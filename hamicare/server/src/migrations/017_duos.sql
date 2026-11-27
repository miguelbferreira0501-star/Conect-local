-- Ofensiva em dupla: você e um amigo mantêm uma sequência juntos. O dia conta quando os dois fazem
-- pelo menos 1 tarefa. Cada pessoa fica em uma dupla por vez (convite enviado também conta).

CREATE TABLE IF NOT EXISTS duos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  a uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  b uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'convite' CHECK (status IN ('convite', 'ativa')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (a <> b)
);
CREATE INDEX IF NOT EXISTS duos_a ON duos (a);
CREATE INDEX IF NOT EXISTS duos_b ON duos (b);

CREATE TABLE IF NOT EXISTS duo_days (
  duo_id uuid NOT NULL REFERENCES duos ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  day date NOT NULL,
  PRIMARY KEY (duo_id, user_id, day)
);

-- Avisos já mandados (cutucada, "falta você", "dia completo"): um de cada por dia.
CREATE TABLE IF NOT EXISTS duo_notices (
  duo_id uuid NOT NULL REFERENCES duos ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  day date NOT NULL,
  kind text NOT NULL CHECK (length(kind) <= 20),
  PRIMARY KEY (duo_id, user_id, day, kind)
);

CREATE OR REPLACE FUNCTION app.in_duo(d uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM duos WHERE id = d AND app.current_user_id() IN (a, b))
$$;
CREATE OR REPLACE FUNCTION app.duo_active(d uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM duos WHERE id = d AND status = 'ativa' AND app.current_user_id() IN (a, b))
$$;

-- Só amigos, uma dupla por pessoa e ninguém com menos de 13 anos.
CREATE OR REPLACE FUNCTION app.check_duo() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app AS $$
BEGIN
  IF NOT app.are_friends(NEW.a, NEW.b) THEN
    RAISE EXCEPTION 'só amigos' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF EXISTS (SELECT 1 FROM duos WHERE id <> NEW.id AND (a IN (NEW.a, NEW.b) OR b IN (NEW.a, NEW.b))) THEN
    RAISE EXCEPTION 'já tem dupla' USING ERRCODE = 'unique_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE id IN (NEW.a, NEW.b) AND (age_group = 'ate12' OR banned_at IS NOT NULL)) THEN
    RAISE EXCEPTION 'não pode' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS duo_limits ON duos;
CREATE TRIGGER duo_limits BEFORE INSERT ON duos FOR EACH ROW EXECUTE FUNCTION app.check_duo();

GRANT SELECT, INSERT, UPDATE, DELETE ON duos TO {{APP_ROLE}};
GRANT SELECT, INSERT, DELETE ON duo_days TO {{APP_ROLE}};
GRANT SELECT, INSERT ON duo_notices TO {{APP_ROLE}};

ALTER TABLE duos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS duos_read ON duos;
CREATE POLICY duos_read ON duos FOR SELECT USING (app.current_user_id() IN (a, b));
DROP POLICY IF EXISTS duos_insert ON duos;
CREATE POLICY duos_insert ON duos FOR INSERT WITH CHECK (a = app.current_user_id() AND status = 'convite');
-- Só quem recebeu o convite aceita.
DROP POLICY IF EXISTS duos_update ON duos;
CREATE POLICY duos_update ON duos FOR UPDATE USING (b = app.current_user_id()) WITH CHECK (b = app.current_user_id());
-- Qualquer um dos dois desfaz a dupla (ou recusa / cancela o convite).
DROP POLICY IF EXISTS duos_delete ON duos;
CREATE POLICY duos_delete ON duos FOR DELETE USING (app.current_user_id() IN (a, b));

ALTER TABLE duo_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS duo_days_read ON duo_days;
CREATE POLICY duo_days_read ON duo_days FOR SELECT USING (app.in_duo(duo_id));
DROP POLICY IF EXISTS duo_days_insert ON duo_days;
CREATE POLICY duo_days_insert ON duo_days FOR INSERT WITH CHECK (
  user_id = app.current_user_id() AND app.duo_active(duo_id) AND day BETWEEN current_date - 1 AND current_date + 1
);
DROP POLICY IF EXISTS duo_days_delete ON duo_days;
CREATE POLICY duo_days_delete ON duo_days FOR DELETE USING (user_id = app.current_user_id() AND day >= current_date - 1);

ALTER TABLE duo_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS duo_notices_rw ON duo_notices;
CREATE POLICY duo_notices_rw ON duo_notices USING (app.in_duo(duo_id)) WITH CHECK (app.in_duo(duo_id));

REVOKE ALL ON FUNCTION app.in_duo(uuid), app.duo_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.in_duo(uuid), app.duo_active(uuid) TO {{APP_ROLE}};
