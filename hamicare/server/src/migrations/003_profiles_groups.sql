-- Perfis no estilo rede social (bio e contadores públicos) e grupos de amigos com mural próprio.
-- Os contadores são só coisas boas (ofensiva e conquistas). Peso, diário e humor continuam fora.

ALTER TABLE profiles ADD COLUMN bio text NOT NULL DEFAULT '' CHECK (length(bio) <= 120);
ALTER TABLE profiles ADD COLUMN streak int NOT NULL DEFAULT 0 CHECK (streak BETWEEN 0 AND 9999);
ALTER TABLE profiles ADD COLUMN badges int NOT NULL DEFAULT 0 CHECK (badges BETWEEN 0 AND 999);

CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  emoji text NOT NULL DEFAULT '🌻' CHECK (length(emoji) <= 16),
  color text NOT NULL DEFAULT 'morango' CHECK (length(color) <= 20),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX groups_owner ON groups (owner_id);

CREATE TABLE group_members (
  group_id uuid NOT NULL REFERENCES groups ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX group_members_user ON group_members (user_id);

ALTER TABLE posts ADD COLUMN group_id uuid REFERENCES groups ON DELETE CASCADE;
CREATE INDEX posts_group ON posts (group_id, created_at DESC) WHERE group_id IS NOT NULL;

-- ---------- Funções de apoio ----------

CREATE OR REPLACE FUNCTION app.in_group(g uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM group_members m WHERE m.group_id = g AND m.user_id = app.current_user_id())
$$;

CREATE OR REPLACE FUNCTION app.group_owner(g uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT owner_id FROM groups WHERE id = g
$$;

-- Duas pessoas no mesmo grupo (e sem bloqueio) podem ver o perfil uma da outra.
CREATE OR REPLACE FUNCTION app.share_group(a uuid, b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM group_members x JOIN group_members y ON y.group_id = x.group_id
      WHERE x.user_id = a AND y.user_id = b)
    AND NOT app.blocked_between(a, b)
$$;

-- Número de amigos de alguém: só para quem pode ver o perfil dessa pessoa.
CREATE OR REPLACE FUNCTION app.friend_count(u uuid) RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT CASE WHEN u = app.current_user_id() OR app.connected(app.current_user_id(), u) OR app.share_group(app.current_user_id(), u)
    THEN (SELECT count(*)::int FROM friendships f WHERE f.status = 'aceita' AND (f.requester = u OR f.addressee = u))
    ELSE 0 END
$$;

REVOKE ALL ON FUNCTION app.in_group(uuid), app.group_owner(uuid), app.share_group(uuid, uuid), app.friend_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.in_group(uuid), app.group_owner(uuid), app.share_group(uuid, uuid), app.friend_count(uuid) TO {{APP_ROLE}};

-- ---------- Permissões ----------

GRANT SELECT, INSERT, DELETE ON groups, group_members TO {{APP_ROLE}};
GRANT UPDATE (name, emoji, color) ON groups TO {{APP_ROLE}};

-- ---------- Políticas ----------

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY groups_read ON groups FOR SELECT USING (owner_id = app.current_user_id() OR app.in_group(id) OR app.is_admin());
CREATE POLICY groups_insert ON groups FOR INSERT WITH CHECK (owner_id = app.current_user_id());
CREATE POLICY groups_update ON groups FOR UPDATE USING (owner_id = app.current_user_id()) WITH CHECK (owner_id = app.current_user_id());
CREATE POLICY groups_delete ON groups FOR DELETE USING (owner_id = app.current_user_id());

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY group_members_read ON group_members FOR SELECT USING (app.in_group(group_id) OR app.is_admin());
-- Quem criou o grupo entra nele e adiciona só amigos de verdade.
CREATE POLICY group_members_insert ON group_members FOR INSERT WITH CHECK (
  app.group_owner(group_id) = app.current_user_id()
  AND (user_id = app.current_user_id() OR app.are_friends(app.current_user_id(), user_id)));
-- Sair é sempre possível; quem criou também pode tirar alguém.
CREATE POLICY group_members_delete ON group_members FOR DELETE USING (user_id = app.current_user_id() OR app.group_owner(group_id) = app.current_user_id());

-- Posts de grupo: só os membros veem. Posts normais: como antes (amigos).
DROP POLICY posts_read ON posts;
CREATE POLICY posts_read ON posts FOR SELECT USING (
  app.is_admin()
  OR author_id = app.current_user_id()
  OR (group_id IS NULL AND NOT hidden AND app.are_friends(app.current_user_id(), author_id))
  OR (group_id IS NOT NULL AND NOT hidden AND app.in_group(group_id) AND NOT app.blocked_between(app.current_user_id(), author_id)));
DROP POLICY posts_insert ON posts;
CREATE POLICY posts_insert ON posts FOR INSERT WITH CHECK (
  author_id = app.current_user_id() AND NOT hidden AND (group_id IS NULL OR app.in_group(group_id)));

DROP POLICY profiles_read ON profiles;
CREATE POLICY profiles_read ON profiles FOR SELECT USING (
  user_id = app.current_user_id()
  OR app.connected(app.current_user_id(), user_id)
  OR app.share_group(app.current_user_id(), user_id)
  OR app.is_admin());
