-- Turma: você e até 3 amigos, com missões em comum. Uma missão só conta quando todos fazem.
-- Regras: no máximo 4 pessoas, cada pessoa em uma turma por vez, só amigos de quem criou,
-- e cada um só marca a própria parte.

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  missions text[] NOT NULL CHECK (array_length(missions, 1) BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
  team_id uuid NOT NULL REFERENCES teams ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id),
  UNIQUE (user_id)
);

CREATE TABLE team_checkins (
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  day date NOT NULL,
  mission text NOT NULL CHECK (length(mission) <= 40),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id, day, mission),
  FOREIGN KEY (team_id, user_id) REFERENCES team_members ON DELETE CASCADE
);
CREATE INDEX team_checkins_day ON team_checkins (team_id, day);

-- Avisos da turma já mandados (para não repetir no mesmo dia).
CREATE TABLE team_notices (
  team_id uuid NOT NULL REFERENCES teams ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  day date NOT NULL,
  kind text NOT NULL,
  PRIMARY KEY (team_id, user_id, day, kind)
);

-- ---------- Funções de apoio ----------

CREATE OR REPLACE FUNCTION app.in_team(t uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM team_members WHERE team_id = t AND user_id = app.current_user_id())
$$;

CREATE OR REPLACE FUNCTION app.team_owner(t uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT owner_id FROM teams WHERE id = t
$$;

-- No máximo 4 pessoas por turma, e só amigos de quem criou (ou a própria pessoa que criou).
CREATE OR REPLACE FUNCTION app.check_team_member() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app AS $$
DECLARE owner uuid;
BEGIN
  SELECT owner_id INTO owner FROM teams WHERE id = NEW.team_id;
  IF (SELECT count(*) FROM team_members WHERE team_id = NEW.team_id) >= 4 THEN
    RAISE EXCEPTION 'turma cheia' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.user_id <> owner AND NOT app.are_friends(owner, NEW.user_id) THEN
    RAISE EXCEPTION 'só amigos' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id AND (age_group = 'ate12' OR banned_at IS NOT NULL)) THEN
    RAISE EXCEPTION 'não pode entrar' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER team_member_limits BEFORE INSERT ON team_members FOR EACH ROW EXECUTE FUNCTION app.check_team_member();

-- O dia está completo? Todos os membros de agora fizeram todas as missões de agora (turma com 2 ou mais).
CREATE OR REPLACE FUNCTION app.team_day_complete(t uuid, d date) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT (SELECT count(*) FROM team_members WHERE team_id = t) >= 2
    AND NOT EXISTS (
      SELECT 1 FROM team_members m CROSS JOIN unnest((SELECT missions FROM teams WHERE id = t)) AS ms(mission)
      WHERE m.team_id = t
        AND NOT EXISTS (SELECT 1 FROM team_checkins c WHERE c.team_id = t AND c.user_id = m.user_id AND c.day = d AND c.mission = ms.mission)
    )
$$;

-- ---------- Regras de acesso ----------

GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO {{APP_ROLE}};
GRANT SELECT, INSERT, DELETE ON team_members, team_checkins TO {{APP_ROLE}};
GRANT SELECT, INSERT ON team_notices TO {{APP_ROLE}};

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_read ON teams FOR SELECT USING (owner_id = app.current_user_id() OR app.in_team(id));
CREATE POLICY teams_insert ON teams FOR INSERT WITH CHECK (owner_id = app.current_user_id());
CREATE POLICY teams_update ON teams FOR UPDATE USING (owner_id = app.current_user_id()) WITH CHECK (owner_id = app.current_user_id());
CREATE POLICY teams_delete ON teams FOR DELETE USING (owner_id = app.current_user_id());

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_members_read ON team_members FOR SELECT USING (app.in_team(team_id));
-- Quem criou coloca as pessoas (os limites ficam no gatilho).
CREATE POLICY team_members_insert ON team_members FOR INSERT WITH CHECK (app.team_owner(team_id) = app.current_user_id());
-- Sair (você mesmo) ou tirar alguém (quem criou).
CREATE POLICY team_members_delete ON team_members FOR DELETE USING (user_id = app.current_user_id() OR app.team_owner(team_id) = app.current_user_id());

ALTER TABLE team_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_checkins_read ON team_checkins FOR SELECT USING (app.in_team(team_id));
CREATE POLICY team_checkins_insert ON team_checkins FOR INSERT WITH CHECK (
  user_id = app.current_user_id() AND app.in_team(team_id)
  AND EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND mission = ANY (t.missions))
  AND day BETWEEN current_date - 1 AND current_date + 1
);
CREATE POLICY team_checkins_delete ON team_checkins FOR DELETE USING (user_id = app.current_user_id() AND day >= current_date - 1);

ALTER TABLE team_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_notices_rw ON team_notices USING (app.in_team(team_id)) WITH CHECK (app.in_team(team_id));

REVOKE ALL ON FUNCTION app.in_team(uuid), app.team_owner(uuid), app.team_day_complete(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.in_team(uuid), app.team_owner(uuid), app.team_day_complete(uuid, date) TO {{APP_ROLE}};

-- Quem está na mesma turma vê o perfil um do outro (para ver os Hamis juntos), mesmo sem ser amigo direto.
CREATE OR REPLACE FUNCTION app.share_team(a uuid, b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM team_members x JOIN team_members y ON x.team_id = y.team_id WHERE x.user_id = a AND y.user_id = b)
    AND NOT app.blocked_between(a, b)
$$;
REVOKE ALL ON FUNCTION app.share_team(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.share_team(uuid, uuid) TO {{APP_ROLE}};

DROP POLICY profiles_read ON profiles;
CREATE POLICY profiles_read ON profiles FOR SELECT USING (
  user_id = app.current_user_id()
  OR app.connected(app.current_user_id(), user_id)
  OR app.share_group(app.current_user_id(), user_id)
  OR app.share_team(app.current_user_id(), user_id)
  OR app.is_admin());
