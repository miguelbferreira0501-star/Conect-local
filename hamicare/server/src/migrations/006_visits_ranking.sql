-- Visitas com reação, arena no perfil e ranking só entre amigos (opcional).
-- O ranking usa só o que o servidor já sabe pelo histórico do jogo (dias ativos, missões,
-- conquistas, coleções e arena). Peso, calorias, diário e humor nunca entram.

ALTER TABLE profiles ADD COLUMN arena int NOT NULL DEFAULT 1 CHECK (arena BETWEEN 1 AND 99);
-- Aparecer no ranking dos amigos (pode sair a qualquer hora).
ALTER TABLE profiles ADD COLUMN ranked boolean NOT NULL DEFAULT true;

CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  host uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  reaction text NOT NULL CHECK (length(reaction) <= 20),
  day date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (visitor <> host)
);
-- Uma reação por amigo por dia (sem enxurrada de notificações).
CREATE UNIQUE INDEX visits_daily ON visits (visitor, host, day);
CREATE INDEX visits_host ON visits (host, created_at DESC);

GRANT SELECT, INSERT ON visits TO {{APP_ROLE}};
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
-- Só deixa reação na casa de amigos; vê as visitas que fez e as que recebeu.
CREATE POLICY visits_insert ON visits FOR INSERT WITH CHECK (visitor = app.current_user_id() AND app.are_friends(visitor, host));
CREATE POLICY visits_read ON visits FOR SELECT USING (host = app.current_user_id() OR visitor = app.current_user_id());

-- Ranking: você e seus amigos que aceitam aparecer (menores de 13 nunca entram).
CREATE OR REPLACE FUNCTION app.friend_ranking() RETURNS TABLE (
  user_id uuid, name text, pet jsonb, dias int, missoes int, conquistas int, colecoes int, max_level int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  WITH people AS (
    SELECT p.user_id FROM profiles p JOIN users u ON u.id = p.user_id
    WHERE p.ranked AND u.age_group <> 'ate12' AND u.banned_at IS NULL
      AND (p.user_id = app.current_user_id() OR app.are_friends(app.current_user_id(), p.user_id))
  )
  SELECT p.user_id, p.name, p.pet,
    (SELECT count(DISTINCT l.day)::int FROM game_ledger l WHERE l.user_id = p.user_id AND l.active AND l.ref LIKE 'tarefa:%' AND l.day >= current_date - 29),
    (SELECT count(*)::int FROM game_ledger l WHERE l.user_id = p.user_id AND l.active AND l.ref LIKE 'tarefa:%' AND l.day >= current_date - 6),
    (SELECT count(*)::int FROM game_ledger l WHERE l.user_id = p.user_id AND l.ref LIKE 'conquista:%'),
    (SELECT count(*)::int FROM game_ledger l WHERE l.user_id = p.user_id AND l.ref LIKE 'colecao:%'),
    COALESCE((SELECT w.max_level FROM game_wallet w WHERE w.user_id = p.user_id), 1)
  FROM profiles p
  WHERE p.user_id IN (SELECT user_id FROM people)
    AND app.current_user_id() IS NOT NULL
    -- Quem saiu do ranking também não vê o dos outros.
    AND EXISTS (SELECT 1 FROM profiles me WHERE me.user_id = app.current_user_id() AND me.ranked);
$$;
REVOKE ALL ON FUNCTION app.friend_ranking() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.friend_ranking() TO {{APP_ROLE}};

-- Nomes de quem visitou (amigos ou não mais amigos: o nome fica no histórico do anfitrião).
CREATE OR REPLACE FUNCTION app.my_visits(p_limit int) RETURNS TABLE (visitor uuid, name text, pet jsonb, reaction text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT v.visitor, p.name, p.pet, v.reaction, v.created_at
  FROM visits v JOIN profiles p ON p.user_id = v.visitor
  WHERE v.host = app.current_user_id() AND NOT app.blocked_between(v.host, v.visitor)
  ORDER BY v.created_at DESC LIMIT LEAST(p_limit, 50);
$$;
REVOKE ALL ON FUNCTION app.my_visits(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.my_visits(int) TO {{APP_ROLE}};
