-- Políticas de segurança no banco (Row Level Security).
-- O servidor conecta com o papel {{APP_ROLE}} (sem privilégios de dono),
-- então estas políticas valem para TODAS as consultas da aplicação.

GRANT USAGE ON SCHEMA public, app TO {{APP_ROLE}};
GRANT EXECUTE ON FUNCTION app.current_user_id(), app.norm(text) TO {{APP_ROLE}};

-- Dados públicos de referência: somente leitura.
GRANT SELECT ON states, cities, categories, businesses, business_service_areas, services, photos,
  business_review_stats, review_replies TO {{APP_ROLE}};

-- Dados do usuário.
GRANT SELECT, INSERT, UPDATE, DELETE ON users, sessions, favorites TO {{APP_ROLE}};
GRANT SELECT, INSERT ON bookings, quote_requests, review_reports TO {{APP_ROLE}};
GRANT UPDATE (status, updated_at, completed_at, cancelled_at) ON bookings TO {{APP_ROLE}};
GRANT UPDATE (status, updated_at, hired_at) ON quote_requests TO {{APP_ROLE}};
GRANT SELECT, INSERT, DELETE ON reviews TO {{APP_ROLE}};
GRANT UPDATE (rating, comment, aspects, updated_at) ON reviews TO {{APP_ROLE}};
GRANT SELECT ON business_members TO {{APP_ROLE}};
-- Painel empresarial (futuro): membros poderão editar o perfil da empresa.
GRANT UPDATE (name, professional_name, short_description, description, logo_url, cover_url, street, neighborhood,
  postal_code, phone, whatsapp, website, instagram, facebook, email, price_level, mode_in_person,
  mode_at_customer, mode_online, accepts_booking, accepts_quote, opening_hours, hours_updated_at, updated_at)
  ON businesses TO {{APP_ROLE}};
GRANT INSERT, UPDATE, DELETE ON services, photos, business_service_areas TO {{APP_ROLE}};

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_self ON users
  USING (id = app.current_user_id()) WITH CHECK (id = app.current_user_id());

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_self ON sessions
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY favorites_self ON favorites
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_self ON bookings
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY quotes_self ON quote_requests
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_read ON reviews FOR SELECT
  USING (status = 'published' OR user_id = app.current_user_id());
CREATE POLICY reviews_insert ON reviews FOR INSERT
  WITH CHECK (user_id = app.current_user_id());
CREATE POLICY reviews_update ON reviews FOR UPDATE
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
CREATE POLICY reviews_delete ON reviews FOR DELETE
  USING (user_id = app.current_user_id());

ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY review_reports_self ON review_reports
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY members_self ON business_members FOR SELECT
  USING (user_id = app.current_user_id());

CREATE OR REPLACE FUNCTION app.is_business_member(p_business uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM business_members m
    WHERE m.business_id = p_business AND m.user_id = app.current_user_id() AND m.role IN ('owner', 'manager'))
$$;
GRANT EXECUTE ON FUNCTION app.is_business_member(uuid) TO {{APP_ROLE}};

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY businesses_public_read ON businesses FOR SELECT
  USING (status = 'active' OR app.is_business_member(id));
CREATE POLICY businesses_member_update ON businesses FOR UPDATE
  USING (app.is_business_member(id)) WITH CHECK (app.is_business_member(id));

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_public_read ON services FOR SELECT USING (true);
CREATE POLICY services_member_write ON services FOR ALL
  USING (app.is_business_member(business_id)) WITH CHECK (app.is_business_member(business_id));

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY photos_public_read ON photos FOR SELECT USING (true);
CREATE POLICY photos_member_write ON photos FOR ALL
  USING (app.is_business_member(business_id)) WITH CHECK (app.is_business_member(business_id));

ALTER TABLE business_service_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY areas_public_read ON business_service_areas FOR SELECT USING (true);
CREATE POLICY areas_member_write ON business_service_areas FOR ALL
  USING (app.is_business_member(business_id)) WITH CHECK (app.is_business_member(business_id));

-- ── Funções SECURITY DEFINER: expõem só o mínimo necessário ──

-- Login: busca o hash da senha por e-mail (antes de existir um usuário na sessão).
CREATE OR REPLACE FUNCTION app.auth_user_by_email(p_email text)
RETURNS TABLE (id uuid, password_hash text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT u.id, u.password_hash FROM users u WHERE u.email = lower(p_email)
$$;

-- Cadastro: informa apenas se o e-mail já existe.
CREATE OR REPLACE FUNCTION app.auth_email_exists(p_email text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE email = lower(p_email))
$$;

-- Resolve o usuário de uma sessão válida.
CREATE OR REPLACE FUNCTION app.auth_session_user(p_token_hash text) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.user_id FROM sessions s WHERE s.token_hash = p_token_hash AND s.expires_at > now()
$$;

-- Horários ocupados de uma empresa (sem revelar quem agendou).
CREATE OR REPLACE FUNCTION app.business_busy_ranges(p_business uuid, p_from timestamptz, p_to timestamptz)
RETURNS TABLE (starts_at timestamptz, ends_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT b.starts_at, b.ends_at FROM bookings b
  WHERE b.business_id = p_business AND b.status IN ('requested', 'confirmed')
    AND b.starts_at < p_to AND b.ends_at > p_from
$$;

-- Serviços mais procurados numa cidade (apenas contagens agregadas).
CREATE OR REPLACE FUNCTION app.popular_services(p_city integer, p_since timestamptz, p_limit int)
RETURNS TABLE (name text, requests bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH acts AS (
    SELECT s.name FROM bookings b JOIN services s ON s.id = b.service_id
      JOIN businesses bz ON bz.id = b.business_id
      WHERE bz.city_ibge = p_city AND b.created_at >= p_since AND b.status <> 'cancelled'
    UNION ALL
    SELECT s.name FROM quote_requests q JOIN services s ON s.id = q.service_id
      JOIN businesses bz ON bz.id = q.business_id
      WHERE bz.city_ibge = p_city AND q.created_at >= p_since
  )
  SELECT name, count(*) AS requests FROM acts GROUP BY name ORDER BY requests DESC, name LIMIT p_limit
$$;

-- Contador de denúncias (o autor da denúncia não pode alterar a avaliação de outra pessoa).
CREATE OR REPLACE FUNCTION app.increment_review_reports(p_review uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  UPDATE reviews SET report_count = report_count + 1 WHERE id = p_review
$$;

REVOKE ALL ON FUNCTION app.auth_user_by_email(text), app.auth_email_exists(text), app.auth_session_user(text),
  app.business_busy_ranges(uuid, timestamptz, timestamptz), app.popular_services(integer, timestamptz, int),
  app.increment_review_reports(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.auth_user_by_email(text), app.auth_email_exists(text), app.auth_session_user(text),
  app.business_busy_ranges(uuid, timestamptz, timestamptz), app.popular_services(integer, timestamptz, int),
  app.increment_review_reports(uuid) TO {{APP_ROLE}};
