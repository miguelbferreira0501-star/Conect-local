-- Pataí: plano único com teste grátis, agendamento por área (endereços, estadias),
-- sinal pelo Pix da empresa, clube de pacotes e cartão fidelidade.

-- ── Teste grátis: toda empresa nova começa com o plano ativo por 30 dias (definido no banco) ──
CREATE OR REPLACE FUNCTION app.business_trial() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT coalesce(NEW.is_demo, false) THEN
    NEW.plan := 'pro';
    NEW.plan_until := now() + interval '30 days';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER businesses_trial BEFORE INSERT ON businesses FOR EACH ROW EXECUTE FUNCTION app.business_trial();

-- ── Agendamento por área ──
ALTER TABLE bookings ADD COLUMN address text CHECK (char_length(address) <= 200);
ALTER TABLE bookings ADD COLUMN destination text CHECK (char_length(destination) <= 200);
ALTER TABLE bookings ADD COLUMN details jsonb NOT NULL DEFAULT '{}';

-- ── Sinal pelo Pix (vai direto para a conta da empresa; o app não intermedeia o dinheiro) ──
ALTER TABLE businesses ADD COLUMN pix_key text CHECK (char_length(pix_key) <= 77);
ALTER TABLE businesses ADD COLUMN loyalty_every smallint CHECK (loyalty_every BETWEEN 3 AND 30);
GRANT UPDATE (pix_key, loyalty_every) ON businesses TO {{APP_ROLE}};
ALTER TABLE services ADD COLUMN deposit_cents integer CHECK (deposit_cents > 0 AND deposit_cents <= 100000);
ALTER TABLE bookings ADD COLUMN deposit_cents integer;
ALTER TABLE bookings ADD COLUMN deposit_status text CHECK (deposit_status IN ('pending', 'paid'));
GRANT UPDATE (deposit_status) ON bookings TO {{APP_ROLE}};

-- ── Clube de pacotes ("4 banhos por mês") ──
CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 80),
  sessions smallint NOT NULL CHECK (sessions BETWEEN 2 AND 30),
  price_cents integer NOT NULL CHECK (price_cents > 0 AND price_cents <= 1000000),
  validity_days smallint NOT NULL CHECK (validity_days BETWEEN 7 AND 365),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX packages_business_idx ON packages (business_id) WHERE active;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY packages_public_read ON packages FOR SELECT USING (true);
CREATE POLICY packages_member_write ON packages FOR ALL USING (app.is_business_member(business_id))
  WITH CHECK (app.is_business_member(business_id) AND EXISTS (SELECT 1 FROM services s WHERE s.id = service_id AND s.business_id = packages.business_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON packages TO {{APP_ROLE}};

CREATE TABLE customer_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id uuid REFERENCES pets(id) ON DELETE SET NULL,
  sessions smallint NOT NULL,
  price_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'active', 'cancelled')),
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_packages_user_idx ON customer_packages (user_id);
CREATE INDEX customer_packages_business_idx ON customer_packages (business_id);
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
-- Tutor pede o pacote (sempre como "pedido") e vê os seus; a empresa vê e ativa quando receber.
CREATE POLICY cpkg_self_read ON customer_packages FOR SELECT USING (user_id = app.current_user_id());
CREATE POLICY cpkg_self_insert ON customer_packages FOR INSERT WITH CHECK (
  user_id = app.current_user_id() AND status = 'requested' AND activated_at IS NULL
  AND EXISTS (SELECT 1 FROM packages p WHERE p.id = package_id AND p.business_id = customer_packages.business_id AND p.active
    AND p.sessions = customer_packages.sessions AND p.price_cents = customer_packages.price_cents)
);
CREATE POLICY cpkg_self_cancel ON customer_packages FOR UPDATE USING (user_id = app.current_user_id() AND status = 'requested')
  WITH CHECK (user_id = app.current_user_id() AND status = 'cancelled');
CREATE POLICY cpkg_business_read ON customer_packages FOR SELECT USING (app.is_business_member(business_id));
CREATE POLICY cpkg_business_update ON customer_packages FOR UPDATE USING (app.is_business_member(business_id)) WITH CHECK (app.is_business_member(business_id));
GRANT SELECT, INSERT ON customer_packages TO {{APP_ROLE}};
GRANT UPDATE (status, activated_at, expires_at) ON customer_packages TO {{APP_ROLE}};
CREATE TRIGGER customer_packages_pet_owner BEFORE INSERT OR UPDATE OF pet_id ON customer_packages FOR EACH ROW EXECUTE FUNCTION app.check_pet_owner();

ALTER TABLE bookings ADD COLUMN customer_package_id uuid REFERENCES customer_packages(id) ON DELETE SET NULL;

-- Só a empresa confirma que recebeu o sinal (o tutor pode atualizar o próprio agendamento para cancelar).
CREATE OR REPLACE FUNCTION app.guard_deposit_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.deposit_status IS DISTINCT FROM OLD.deposit_status
     AND (OLD.deposit_status IS NULL OR NOT app.is_business_member(NEW.business_id)) THEN
    RAISE EXCEPTION 'deposit_not_allowed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_deposit_guard BEFORE UPDATE OF deposit_status ON bookings FOR EACH ROW EXECUTE FUNCTION app.guard_deposit_status();

-- Quem pediu um pacote também é cliente da empresa (nome e telefone para combinar o pagamento).
CREATE OR REPLACE FUNCTION app.business_customer(p_business uuid, p_user uuid)
RETURNS TABLE (name text, email text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT u.name, u.email, u.phone FROM users u
  WHERE u.id = p_user
    AND app.is_business_member(p_business)
    AND (EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = p_user AND b.business_id = p_business)
      OR EXISTS (SELECT 1 FROM quote_requests q WHERE q.user_id = p_user AND q.business_id = p_business)
      OR EXISTS (SELECT 1 FROM customer_packages cp WHERE cp.user_id = p_user AND cp.business_id = p_business))
$$;
CREATE POLICY pets_package_read ON pets FOR SELECT USING (
  EXISTS (SELECT 1 FROM customer_packages cp WHERE cp.pet_id = pets.id AND app.is_business_member(cp.business_id))
);
