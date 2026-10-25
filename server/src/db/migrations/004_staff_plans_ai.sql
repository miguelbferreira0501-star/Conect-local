-- Agendas por nicho, equipe (profissionais ou recursos como quadras/salas), planos e uso da IA.

-- Profissionais ou recursos que atendem (cada um tem a própria agenda).
CREATE TABLE business_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  role_title text CHECK (char_length(role_title) <= 60),
  kind text NOT NULL DEFAULT 'person' CHECK (kind IN ('person', 'resource')),
  -- Horários próprios; NULL = segue os horários da empresa.
  opening_hours jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_staff_business_idx ON business_staff (business_id) WHERE active;

-- Quais serviços cada profissional/recurso faz. Serviço sem ninguém ligado = qualquer um da equipe.
CREATE TABLE staff_services (
  staff_id uuid NOT NULL REFERENCES business_staff(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- Tipo de agenda do serviço:
--   slot   = horário marcado com duração (salão, pet, tatuagem, quadra, assistência)
--   period = dia + turno (manhã/tarde/noite), a empresa combina a hora (limpeza, reformas, serviços em casa)
--   day    = diária inteira (espaços para eventos, hospedagem)
ALTER TABLE services ADD COLUMN booking_mode text NOT NULL DEFAULT 'slot' CHECK (booking_mode IN ('slot', 'period', 'day'));
-- Duração só é obrigatória no horário marcado.
ALTER TABLE services DROP CONSTRAINT services_check1;
ALTER TABLE services ADD CONSTRAINT services_bookable_duration_check CHECK (NOT bookable OR booking_mode <> 'slot' OR duration_minutes IS NOT NULL);

ALTER TABLE bookings ADD COLUMN staff_id uuid REFERENCES business_staff(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN booking_mode text NOT NULL DEFAULT 'slot' CHECK (booking_mode IN ('slot', 'period', 'day'));
ALTER TABLE bookings ADD COLUMN period text CHECK (period IN ('morning', 'afternoon', 'evening'));

-- Com vários profissionais, dois clientes podem marcar o mesmo horário (com pessoas diferentes).
DROP INDEX bookings_active_slot_uq;
CREATE UNIQUE INDEX bookings_active_slot_uq ON bookings (business_id, coalesce(staff_id, '00000000-0000-0000-0000-000000000000'::uuid), starts_at)
  WHERE status IN ('requested', 'confirmed');

-- Plano da empresa (cobrança mensal). O plano NUNCA altera a posição na busca nem os selos.
ALTER TABLE businesses ADD COLUMN plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team'));
ALTER TABLE businesses ADD COLUMN plan_until timestamptz;

-- Uso mensal do assistente de IA (para limites por plano e acompanhamento de custo).
CREATE TABLE ai_usage (
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  month date NOT NULL,
  requests int NOT NULL DEFAULT 0,
  input_tokens bigint NOT NULL DEFAULT 0,
  output_tokens bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (business_id, month)
);

-- ── Permissões ──
GRANT SELECT ON business_staff, staff_services TO {{APP_ROLE}};
GRANT INSERT, UPDATE, DELETE ON business_staff, staff_services TO {{APP_ROLE}};
GRANT UPDATE (booking_mode) ON services TO {{APP_ROLE}};
GRANT SELECT ON ai_usage TO {{APP_ROLE}};

ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_public_read ON business_staff FOR SELECT USING (true);
CREATE POLICY staff_member_write ON business_staff FOR ALL
  USING (app.is_business_member(business_id)) WITH CHECK (app.is_business_member(business_id));

ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_services_public_read ON staff_services FOR SELECT USING (true);
CREATE POLICY staff_services_member_write ON staff_services FOR ALL
  USING (EXISTS (SELECT 1 FROM business_staff s WHERE s.id = staff_id AND app.is_business_member(s.business_id)))
  WITH CHECK (
    EXISTS (SELECT 1 FROM business_staff s JOIN services sv ON sv.business_id = s.business_id
            WHERE s.id = staff_id AND sv.id = service_id AND app.is_business_member(s.business_id))
  );

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_usage_member_read ON ai_usage FOR SELECT USING (app.is_business_member(business_id));

-- Horários ocupados agora informam também o profissional (sem revelar o cliente).
DROP FUNCTION app.business_busy_ranges(uuid, timestamptz, timestamptz);
CREATE FUNCTION app.business_busy_ranges(p_business uuid, p_from timestamptz, p_to timestamptz)
RETURNS TABLE (starts_at timestamptz, ends_at timestamptz, staff_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT b.starts_at, b.ends_at, b.staff_id FROM bookings b
  WHERE b.business_id = p_business AND b.status IN ('requested', 'confirmed')
    AND b.starts_at < p_to AND b.ends_at > p_from
$$;
REVOKE ALL ON FUNCTION app.business_busy_ranges(uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.business_busy_ranges(uuid, timestamptz, timestamptz) TO {{APP_ROLE}};

-- Registro de uso da IA (somente o servidor, em nome de um membro da empresa).
CREATE OR REPLACE FUNCTION app.record_ai_usage(p_business uuid, p_input bigint, p_output bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT app.is_business_member(p_business) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  INSERT INTO ai_usage (business_id, month, requests, input_tokens, output_tokens)
  VALUES (p_business, date_trunc('month', now())::date, 1, p_input, p_output)
  ON CONFLICT (business_id, month) DO UPDATE SET
    requests = ai_usage.requests + 1,
    input_tokens = ai_usage.input_tokens + EXCLUDED.input_tokens,
    output_tokens = ai_usage.output_tokens + EXCLUDED.output_tokens;
END $$;

-- Plano: definido pelo administrador (até a integração com o meio de pagamento).
CREATE OR REPLACE FUNCTION app.admin_set_plan(p_id uuid, p_plan text, p_until timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT app.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  UPDATE businesses SET plan = p_plan, plan_until = p_until, updated_at = now() WHERE id = p_id;
END $$;

REVOKE ALL ON FUNCTION app.record_ai_usage(uuid, bigint, bigint), app.admin_set_plan(uuid, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.record_ai_usage(uuid, bigint, bigint), app.admin_set_plan(uuid, text, timestamptz) TO {{APP_ROLE}};
