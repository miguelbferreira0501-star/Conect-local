-- Guardiões do Hami: quem pode pagar dá HamiCare+ para quem não pode.
-- Pedido do Guardião (pagamento único) → quando o pagamento confirma, cada "vaga" vira Plus para
-- a próxima pessoa da fila de quem pediu ajuda (ordem de chegada). Tudo que mexe em outra conta
-- passa por funções SECURITY DEFINER; a API só lê o que é da própria pessoa.

CREATE TABLE guardian_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users ON DELETE SET NULL,
  tier text NOT NULL CHECK (tier IN ('aliado', 'protetor', 'heroi')),
  period text NOT NULL CHECK (period IN ('mes', 'ano')),
  seats int NOT NULL CHECK (seats BETWEEN 1 AND 600),
  months int NOT NULL CHECK (months IN (1, 12)),
  amount_cents int NOT NULL CHECK (amount_cents BETWEEN 500 AND 500000),
  display_name text CHECK (length(display_name) <= 40),
  message text CHECK (length(message) <= 140),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  seats_left int NOT NULL DEFAULT 0,
  provider text NOT NULL CHECK (provider IN ('mercadopago', 'teste')),
  provider_ref text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guardian_orders_paid ON guardian_orders (paid_at) WHERE status = 'pago';

CREATE TABLE guardian_requests (
  user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  reason text CHECK (length(reason) <= 200),
  status text NOT NULL DEFAULT 'esperando' CHECK (status IN ('esperando', 'atendido')),
  created_at timestamptz NOT NULL DEFAULT now(),
  granted_at timestamptz,
  months int,
  order_id uuid REFERENCES guardian_orders ON DELETE SET NULL
);
CREATE INDEX guardian_requests_queue ON guardian_requests (created_at) WHERE status = 'esperando';

GRANT SELECT, INSERT ON guardian_orders TO {{APP_ROLE}};
GRANT SELECT, INSERT, UPDATE, DELETE ON guardian_requests TO {{APP_ROLE}};

ALTER TABLE guardian_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY guardian_orders_read ON guardian_orders FOR SELECT USING (user_id = app.current_user_id());
CREATE POLICY guardian_orders_insert ON guardian_orders FOR INSERT WITH CHECK (user_id = app.current_user_id() AND status = 'pendente' AND seats_left = 0);

ALTER TABLE guardian_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY guardian_requests_read ON guardian_requests FOR SELECT USING (user_id = app.current_user_id());
CREATE POLICY guardian_requests_insert ON guardian_requests FOR INSERT WITH CHECK (user_id = app.current_user_id() AND status = 'esperando');
CREATE POLICY guardian_requests_update ON guardian_requests FOR UPDATE USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id() AND status = 'esperando');
CREATE POLICY guardian_requests_delete ON guardian_requests FOR DELETE USING (user_id = app.current_user_id() AND status = 'esperando');

-- Entrega as vagas pagas para a fila (mais antigo primeiro). Devolve quantas pessoas foram atendidas.
CREATE OR REPLACE FUNCTION app.guardian_assign() RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
  o record;
  r record;
  n int := 0;
BEGIN
  FOR o IN SELECT id, months FROM guardian_orders WHERE status = 'pago' AND seats_left > 0 ORDER BY paid_at, id FOR UPDATE LOOP
    FOR r IN SELECT q.user_id FROM guardian_requests q JOIN users u ON u.id = q.user_id
             WHERE q.status = 'esperando' AND u.banned_at IS NULL ORDER BY q.created_at FOR UPDATE OF q SKIP LOCKED LOOP
      EXIT WHEN (SELECT seats_left FROM guardian_orders WHERE id = o.id) <= 0;
      UPDATE users SET premium_until = greatest(coalesce(premium_until, current_date), current_date) + make_interval(months => o.months)
        WHERE id = r.user_id;
      UPDATE guardian_requests SET status = 'atendido', granted_at = now(), months = o.months, order_id = o.id WHERE user_id = r.user_id;
      UPDATE guardian_orders SET seats_left = seats_left - 1 WHERE id = o.id;
      n := n + 1;
    END LOOP;
  END LOOP;
  RETURN n;
END $$;

-- Confirma o pagamento (chamado depois de conferir com a empresa de pagamento) e entrega as vagas.
-- Devolve o dono do pedido e as vagas só na PRIMEIRA confirmação (para pagar o agradecimento uma vez).
CREATE OR REPLACE FUNCTION app.guardian_mark_paid(p_order uuid, p_ref text, p_cents int)
RETURNS TABLE (owner uuid, seats int, assigned int)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE o guardian_orders;
BEGIN
  UPDATE guardian_orders g SET status = 'pago', paid_at = now(), seats_left = g.seats, provider_ref = coalesce(p_ref, g.provider_ref)
    WHERE g.id = p_order AND g.status = 'pendente' AND p_cents >= g.amount_cents
    RETURNING * INTO o;
  IF o.id IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT o.user_id, o.seats, app.guardian_assign();
END $$;

-- Mural: Guardiões recentes (nome escolhido ou anônimo) e números gerais.
CREATE OR REPLACE FUNCTION app.guardian_wall(p_limit int) RETURNS TABLE (name text, tier text, seats int, months int, message text, paid_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT coalesce(nullif(display_name, ''), 'Guardião anônimo'), tier, seats, months, message, paid_at
  FROM guardian_orders WHERE status = 'pago' ORDER BY paid_at DESC LIMIT least(greatest(p_limit, 1), 50)
$$;

CREATE OR REPLACE FUNCTION app.guardian_stats() RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT json_build_object(
    'helped', (SELECT count(*) FROM guardian_requests WHERE status = 'atendido'),
    'waiting', (SELECT count(*) FROM guardian_requests WHERE status = 'esperando'),
    'guardians', (SELECT count(*) FROM guardian_orders WHERE status = 'pago'),
    'seatsLeft', (SELECT coalesce(sum(seats_left), 0) FROM guardian_orders WHERE status = 'pago')
  )
$$;

REVOKE ALL ON FUNCTION app.guardian_assign(), app.guardian_mark_paid(uuid, text, int), app.guardian_wall(int), app.guardian_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.guardian_assign(), app.guardian_mark_paid(uuid, text, int), app.guardian_wall(int), app.guardian_stats() TO {{APP_ROLE}};
