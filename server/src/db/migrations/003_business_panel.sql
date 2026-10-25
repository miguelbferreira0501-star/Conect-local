-- Painel das empresas: cadastro pela própria empresa, pedidos recebidos, respostas a avaliações,
-- imagens e moderação por administradores.

-- Quem criou a empresa (usado para permitir que ela se torne dona do perfil).
ALTER TABLE businesses ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL DEFAULT app.current_user_id();
ALTER TABLE businesses ADD COLUMN suspended_reason text;

-- Empresa pode recusar um agendamento; e responder um orçamento com uma mensagem.
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'declined'));
ALTER TABLE bookings ADD COLUMN business_note text;
ALTER TABLE quote_requests ADD COLUMN business_response text;

-- Imagens (logo, capa e fotos) guardadas no próprio banco, já reduzidas pelo navegador.
CREATE TABLE images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('logo', 'cover', 'photo')),
  mime text NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  data bytea NOT NULL CHECK (octet_length(data) <= 600000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX images_business_idx ON images (business_id);

-- ── Permissões ──
GRANT INSERT (slug, name, professional_name, category_id, short_description, description, street, neighborhood, postal_code,
  city_ibge, lat, lon, address_public, phone, whatsapp, website, instagram, facebook, email, price_level, mode_in_person,
  mode_at_customer, mode_online, accepts_booking, accepts_quote, opening_hours, hours_updated_at) ON businesses TO {{APP_ROLE}};
GRANT UPDATE (category_id, city_ibge, lat, lon) ON businesses TO {{APP_ROLE}};
GRANT INSERT ON business_members TO {{APP_ROLE}};
GRANT UPDATE (status, updated_at, business_note) ON bookings TO {{APP_ROLE}};
GRANT UPDATE (business_response, answered_at) ON quote_requests TO {{APP_ROLE}};
GRANT INSERT, UPDATE, DELETE ON review_replies TO {{APP_ROLE}};
GRANT SELECT, INSERT, DELETE ON images TO {{APP_ROLE}};

-- Qualquer pessoa logada pode cadastrar uma empresa (aparece na hora). Campos de confiança ficam nos padrões.
CREATE POLICY businesses_insert ON businesses FOR INSERT
  WITH CHECK (created_by = app.current_user_id() AND status = 'active' AND NOT is_demo AND verified_at IS NULL);

-- Quem criou a empresa pode se tornar dono dela — e somente dela.
CREATE POLICY members_owner_insert ON business_members FOR INSERT
  WITH CHECK (
    user_id = app.current_user_id() AND role = 'owner'
    AND EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_id AND b.created_by = app.current_user_id())
  );

-- A empresa vê e responde os pedidos feitos a ela.
CREATE POLICY bookings_business_read ON bookings FOR SELECT USING (app.is_business_member(business_id));
CREATE POLICY bookings_business_update ON bookings FOR UPDATE
  USING (app.is_business_member(business_id)) WITH CHECK (app.is_business_member(business_id));
CREATE POLICY quotes_business_read ON quote_requests FOR SELECT USING (app.is_business_member(business_id));
CREATE POLICY quotes_business_update ON quote_requests FOR UPDATE
  USING (app.is_business_member(business_id)) WITH CHECK (app.is_business_member(business_id));

-- Respostas públicas às avaliações: só a própria empresa, e só em avaliações dela.
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY replies_public_read ON review_replies FOR SELECT USING (true);
CREATE POLICY replies_member_write ON review_replies FOR ALL
  USING (app.is_business_member(business_id))
  WITH CHECK (
    app.is_business_member(business_id)
    AND EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.business_id = review_replies.business_id)
  );

ALTER TABLE images ENABLE ROW LEVEL SECURITY;
CREATE POLICY images_public_read ON images FOR SELECT USING (true);
CREATE POLICY images_member_insert ON images FOR INSERT WITH CHECK (app.is_business_member(business_id));
CREATE POLICY images_member_delete ON images FOR DELETE USING (app.is_business_member(business_id));

-- ── Administradores ──
CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = app.current_user_id() AND role = 'admin')
$$;
CREATE POLICY businesses_admin_read ON businesses FOR SELECT USING (app.is_admin());

-- Suspender/reativar e verificar empresas (apenas administradores).
CREATE OR REPLACE FUNCTION app.admin_update_business(p_id uuid, p_status text, p_verified boolean, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT app.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_status NOT IN ('active', 'suspended') THEN RAISE EXCEPTION 'invalid_status'; END IF;
  UPDATE businesses SET
    status = p_status,
    suspended_reason = CASE WHEN p_status = 'suspended' THEN p_reason ELSE NULL END,
    verified_at = CASE WHEN p_verified THEN coalesce(verified_at, now()) ELSE NULL END,
    verification_method = CASE WHEN p_verified THEN coalesce(verification_method, 'administrador') ELSE NULL END,
    updated_at = now()
  WHERE id = p_id;
END $$;

-- Contato do cliente para a empresa — só de quem fez um pedido a ela.
CREATE OR REPLACE FUNCTION app.business_customer(p_business uuid, p_user uuid)
RETURNS TABLE (name text, email text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT u.name, u.email, u.phone FROM users u
  WHERE u.id = p_user
    AND app.is_business_member(p_business)
    AND (EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = p_user AND b.business_id = p_business)
      OR EXISTS (SELECT 1 FROM quote_requests q WHERE q.user_id = p_user AND q.business_id = p_business))
$$;

-- Contadores usados no selo "Responde às solicitações".
CREATE OR REPLACE FUNCTION app.count_requests() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('requested', 'sent') THEN
    UPDATE businesses SET requests_received = requests_received + 1 WHERE id = NEW.business_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IN ('requested', 'sent') AND NEW.status IN ('confirmed', 'declined', 'answered') THEN
    UPDATE businesses SET requests_answered = requests_answered + 1 WHERE id = NEW.business_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER bookings_count_requests AFTER INSERT OR UPDATE OF status ON bookings FOR EACH ROW EXECUTE FUNCTION app.count_requests();
CREATE TRIGGER quotes_count_requests AFTER INSERT OR UPDATE OF status ON quote_requests FOR EACH ROW EXECUTE FUNCTION app.count_requests();

REVOKE ALL ON FUNCTION app.is_admin(), app.admin_update_business(uuid, text, boolean, text), app.business_customer(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.is_admin(), app.admin_update_business(uuid, text, boolean, text), app.business_customer(uuid, uuid) TO {{APP_ROLE}};
