-- HamiCare+: turma maior. Quem criou a turma e tem Plus pode ter até 8 pessoas; sem Plus, 4.
CREATE OR REPLACE FUNCTION app.team_max(t uuid) RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM teams tt JOIN users u ON u.id = tt.owner_id WHERE tt.id = t AND u.premium_until >= current_date
  ) THEN 8 ELSE 4 END
$$;

CREATE OR REPLACE FUNCTION app.check_team_member() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app AS $$
DECLARE owner uuid;
BEGIN
  SELECT owner_id INTO owner FROM teams WHERE id = NEW.team_id;
  IF (SELECT count(*) FROM team_members WHERE team_id = NEW.team_id) >= app.team_max(NEW.team_id) THEN
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

REVOKE ALL ON FUNCTION app.team_max(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.team_max(uuid) TO {{APP_ROLE}};
