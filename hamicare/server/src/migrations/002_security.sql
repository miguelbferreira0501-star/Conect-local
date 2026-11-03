-- Segurança no banco (Row Level Security). A API conecta com {{APP_ROLE}}, sem privilégios
-- de dono, então estas políticas valem para TODAS as consultas da aplicação.

GRANT USAGE ON SCHEMA public, app TO {{APP_ROLE}};
GRANT EXECUTE ON FUNCTION app.current_user_id() TO {{APP_ROLE}};

-- ---------- Funções de apoio (SECURITY DEFINER: rodam como dono, com escopo fechado) ----------

CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = app.current_user_id() AND role = 'admin' AND banned_at IS NULL)
$$;

CREATE OR REPLACE FUNCTION app.blocked_between(a uuid, b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM blocks WHERE (blocker = a AND blocked = b) OR (blocker = b AND blocked = a))
$$;

CREATE OR REPLACE FUNCTION app.are_friends(a uuid, b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT a IS NOT NULL AND b IS NOT NULL AND a <> b
    AND EXISTS (SELECT 1 FROM friendships f WHERE f.status = 'aceita'
      AND ((f.requester = a AND f.addressee = b) OR (f.requester = b AND f.addressee = a)))
    AND NOT app.blocked_between(a, b)
$$;

-- Existe pedido (em qualquer direção) e ninguém bloqueou: dá para ver o perfil básico.
CREATE OR REPLACE FUNCTION app.connected(a uuid, b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM friendships f
      WHERE (f.requester = a AND f.addressee = b) OR (f.requester = b AND f.addressee = a))
    AND NOT app.blocked_between(a, b)
$$;

CREATE OR REPLACE FUNCTION app.can_see_challenge(c uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT EXISTS (SELECT 1 FROM challenges ch WHERE ch.id = c AND (
    ch.owner_id = app.current_user_id()
    OR app.are_friends(app.current_user_id(), ch.owner_id)
    OR EXISTS (SELECT 1 FROM challenge_members m WHERE m.challenge_id = c AND m.user_id = app.current_user_id())))
$$;

-- Sessão: identifica o usuário pelo token (hash). Contas banidas não entram.
CREATE OR REPLACE FUNCTION app.auth_session_user(p_hash text) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT s.user_id FROM sessions s JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = p_hash AND s.expires_at > now() AND u.banned_at IS NULL
$$;

-- Login: devolve id e hash da senha para o e-mail (a comparação é feita na API).
CREATE OR REPLACE FUNCTION app.login_lookup(p_email text) RETURNS TABLE (id uuid, password_hash text, banned boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT id, password_hash, banned_at IS NOT NULL FROM users WHERE email = lower(p_email)
$$;

CREATE OR REPLACE FUNCTION app.register_user(p_email text, p_hash text, p_name text, p_age text) RETURNS uuid
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  INSERT INTO users (email, password_hash, name, age_group) VALUES (lower(p_email), p_hash, p_name, p_age) RETURNING id
$$;

-- Busca por código: devolve só o perfil público, e só de quem não bloqueou nem foi bloqueado.
CREATE OR REPLACE FUNCTION app.find_by_code(p_code text) RETURNS SETOF profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT p.* FROM profiles p JOIN users u ON u.id = p.user_id
  WHERE p.code = upper(p_code) AND p.user_id <> app.current_user_id() AND u.banned_at IS NULL
    AND u.age_group <> 'ate12' AND NOT app.blocked_between(app.current_user_id(), p.user_id)
$$;

-- Pedido de amizade: respeita "não aceito pedidos" e bloqueios. Se a outra pessoa já pediu, vira amizade.
CREATE OR REPLACE FUNCTION app.request_friend(p_target uuid) RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE me uuid := app.current_user_id();
BEGIN
  IF me IS NULL OR p_target IS NULL OR me = p_target THEN RETURN 'bloqueado'; END IF;
  IF app.blocked_between(me, p_target) THEN RETURN 'bloqueado'; END IF;
  IF EXISTS (SELECT 1 FROM users WHERE id = p_target AND (banned_at IS NOT NULL OR age_group = 'ate12')) THEN RETURN 'bloqueado'; END IF;
  IF EXISTS (SELECT 1 FROM friendships WHERE requester = p_target AND addressee = me) THEN
    UPDATE friendships SET status = 'aceita' WHERE requester = p_target AND addressee = me;
    RETURN 'ok';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = p_target AND accepts_requests) THEN RETURN 'fechado'; END IF;
  INSERT INTO friendships (requester, addressee) VALUES (me, p_target) ON CONFLICT DO NOTHING;
  RETURN 'ok';
END $$;

-- Quem postou pode esconder comentários no próprio post.
CREATE OR REPLACE FUNCTION app.hide_comment(p_comment uuid) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  UPDATE comments c SET hidden = true FROM posts p
  WHERE c.id = p_comment AND p.id = c.post_id AND (p.author_id = app.current_user_id() OR app.is_admin())
  RETURNING true
$$;

-- Duas denúncias de pessoas diferentes escondem o conteúdo na hora (até a revisão da administração).
CREATE OR REPLACE FUNCTION app.auto_hide(p_type text, p_target uuid) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE n int;
BEGIN
  SELECT count(DISTINCT reporter_id) INTO n FROM reports WHERE target_type = p_type AND target_id = p_target AND status = 'aberta';
  IF n < 2 THEN RETURN false; END IF;
  IF p_type = 'post' THEN UPDATE posts SET hidden = true WHERE id = p_target;
  ELSIF p_type = 'comment' THEN UPDATE comments SET hidden = true WHERE id = p_target;
  END IF;
  INSERT INTO moderation_log (actor, action, target) VALUES (NULL, 'ocultado-por-denuncias', p_type || ':' || p_target);
  RETURN true;
END $$;

-- Teste grátis de 7 dias do Plus: uma vez por conta.
CREATE OR REPLACE FUNCTION app.start_trial() RETURNS date
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  UPDATE users SET trial_used = true, premium_until = greatest(coalesce(premium_until, current_date), current_date + 7)
  WHERE id = app.current_user_id() AND NOT trial_used RETURNING premium_until
$$;

-- Chaves de push (VAPID): lidas e gravadas só por estas funções.
CREATE OR REPLACE FUNCTION app.get_setting(p_key text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$ SELECT value FROM app_settings WHERE key = p_key $$;
CREATE OR REPLACE FUNCTION app.set_setting(p_key text, p_value text) RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  INSERT INTO app_settings (key, value) VALUES (p_key, p_value) ON CONFLICT (key) DO NOTHING
$$;

-- Lembretes devidos: quem tem push ligado, já passou do horário no fuso dele e ainda não recebeu hoje.
CREATE OR REPLACE FUNCTION app.due_reminders(p_now timestamptz) RETURNS TABLE (user_id uuid, kinds jsonb, state jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT p.user_id, p.kinds, s.state FROM push_prefs p
  JOIN users u ON u.id = p.user_id AND u.banned_at IS NULL
  LEFT JOIN user_state s ON s.user_id = p.user_id
  WHERE p.enabled
    AND to_char(p_now AT TIME ZONE p.tz, 'HH24:MI') >= p.time
    AND (p.last_sent IS NULL OR p.last_sent < (p_now AT TIME ZONE p.tz)::date)
    AND EXISTS (SELECT 1 FROM push_subscriptions ps WHERE ps.user_id = p.user_id)
$$;
CREATE OR REPLACE FUNCTION app.mark_reminded(p_user uuid, p_now timestamptz) RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  UPDATE push_prefs SET last_sent = (p_now AT TIME ZONE tz)::date WHERE user_id = p_user
$$;
CREATE OR REPLACE FUNCTION app.subscriptions_of(p_user uuid) RETURNS SETOF push_subscriptions
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$ SELECT * FROM push_subscriptions WHERE user_id = p_user $$;
CREATE OR REPLACE FUNCTION app.drop_subscription(p_endpoint text) RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$ DELETE FROM push_subscriptions WHERE endpoint = p_endpoint $$;

-- Administradores definidos por variável de ambiente.
CREATE OR REPLACE FUNCTION app.promote_admins(p_emails text[]) RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  UPDATE users SET role = 'admin' WHERE email = ANY (p_emails) AND role <> 'admin'
$$;

REVOKE ALL ON FUNCTION app.is_admin(), app.blocked_between(uuid, uuid), app.are_friends(uuid, uuid), app.connected(uuid, uuid),
  app.can_see_challenge(uuid), app.auth_session_user(text), app.login_lookup(text), app.register_user(text, text, text, text),
  app.find_by_code(text), app.request_friend(uuid), app.hide_comment(uuid), app.auto_hide(text, uuid), app.start_trial(),
  app.get_setting(text), app.set_setting(text, text), app.due_reminders(timestamptz), app.mark_reminded(uuid, timestamptz),
  app.subscriptions_of(uuid), app.drop_subscription(text), app.promote_admins(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.is_admin(), app.blocked_between(uuid, uuid), app.are_friends(uuid, uuid), app.connected(uuid, uuid),
  app.can_see_challenge(uuid), app.auth_session_user(text), app.login_lookup(text), app.register_user(text, text, text, text),
  app.find_by_code(text), app.request_friend(uuid), app.hide_comment(uuid), app.auto_hide(text, uuid), app.start_trial(),
  app.get_setting(text), app.set_setting(text, text), app.due_reminders(timestamptz), app.mark_reminded(uuid, timestamptz),
  app.subscriptions_of(uuid), app.drop_subscription(text), app.promote_admins(text[]) TO {{APP_ROLE}};

-- Ações de administração: conferem o papel dentro da função (o usuário comum não altera Plus nem banimento).
CREATE OR REPLACE FUNCTION app.admin_set_premium(p_user uuid, p_until date) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
BEGIN
  IF NOT app.is_admin() THEN RAISE EXCEPTION 'sem permissão' USING ERRCODE = '42501'; END IF;
  UPDATE users SET premium_until = p_until WHERE id = p_user;
  INSERT INTO moderation_log (actor, action, target) VALUES (app.current_user_id(), 'plus:' || coalesce(p_until::text, 'removido'), p_user::text);
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION app.admin_set_ban(p_user uuid, p_banned boolean) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
BEGIN
  IF NOT app.is_admin() THEN RAISE EXCEPTION 'sem permissão' USING ERRCODE = '42501'; END IF;
  IF p_user = app.current_user_id() THEN RETURN false; END IF;
  UPDATE users SET banned_at = CASE WHEN p_banned THEN now() ELSE NULL END WHERE id = p_user;
  IF p_banned THEN DELETE FROM sessions WHERE user_id = p_user; END IF;
  INSERT INTO moderation_log (actor, action, target) VALUES (app.current_user_id(), CASE WHEN p_banned THEN 'banir' ELSE 'desbanir' END, p_user::text);
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION app.admin_stats() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, app AS $$
BEGIN
  IF NOT app.is_admin() THEN RAISE EXCEPTION 'sem permissão' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'usuarios', (SELECT count(*) FROM users),
    'ativos7', (SELECT count(*) FROM users WHERE last_seen_at > now() - interval '7 days'),
    'novos7', (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days'),
    'plus', (SELECT count(*) FROM users WHERE premium_until >= current_date),
    'menores', (SELECT count(*) FROM users WHERE age_group <> '18mais'),
    'amizades', (SELECT count(*) FROM friendships WHERE status = 'aceita'),
    'posts7', (SELECT count(*) FROM posts WHERE created_at > now() - interval '7 days'),
    'comentarios7', (SELECT count(*) FROM comments WHERE created_at > now() - interval '7 days'),
    'denunciasAbertas', (SELECT count(*) FROM reports WHERE status = 'aberta'),
    'ocultados', (SELECT count(*) FROM posts WHERE hidden) + (SELECT count(*) FROM comments WHERE hidden),
    'banidos', (SELECT count(*) FROM users WHERE banned_at IS NOT NULL)
  );
END $$;

REVOKE ALL ON FUNCTION app.admin_set_premium(uuid, date), app.admin_set_ban(uuid, boolean), app.admin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.admin_set_premium(uuid, date), app.admin_set_ban(uuid, boolean), app.admin_stats() TO {{APP_ROLE}};

-- ---------- Permissões por tabela ----------

GRANT SELECT, DELETE ON users TO {{APP_ROLE}};
GRANT UPDATE (name, age_group, last_seen_at) ON users TO {{APP_ROLE}};
GRANT SELECT, INSERT, DELETE ON sessions TO {{APP_ROLE}};
GRANT SELECT, INSERT, UPDATE, DELETE ON user_state, profiles, blocks, reactions, push_subscriptions, push_prefs, event_claims TO {{APP_ROLE}};
GRANT SELECT, INSERT, DELETE ON friendships, posts, comments, challenges, challenge_members, challenge_checkins TO {{APP_ROLE}};
GRANT UPDATE (status) ON friendships TO {{APP_ROLE}};
GRANT UPDATE (hidden) ON posts, comments TO {{APP_ROLE}};
GRANT SELECT, INSERT ON reports, gifts TO {{APP_ROLE}};
GRANT UPDATE (status, resolved_at, resolved_by) ON reports TO {{APP_ROLE}};
GRANT UPDATE (claimed_at) ON gifts TO {{APP_ROLE}};
GRANT SELECT, INSERT, DELETE ON events TO {{APP_ROLE}};
GRANT SELECT, INSERT ON moderation_log TO {{APP_ROLE}};
GRANT USAGE ON SEQUENCE moderation_log_id_seq TO {{APP_ROLE}};

-- ---------- Políticas ----------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_read ON users FOR SELECT USING (id = app.current_user_id() OR app.is_admin());
CREATE POLICY users_update ON users FOR UPDATE USING (id = app.current_user_id() OR app.is_admin());
CREATE POLICY users_delete ON users FOR DELETE USING (id = app.current_user_id());

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_self ON sessions USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE user_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY state_self ON user_state USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read ON profiles FOR SELECT
  USING (user_id = app.current_user_id() OR app.connected(app.current_user_id(), user_id) OR app.is_admin());
CREATE POLICY profiles_write ON profiles FOR INSERT WITH CHECK (user_id = app.current_user_id());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
CREATE POLICY profiles_delete ON profiles FOR DELETE USING (user_id = app.current_user_id());

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY friendships_read ON friendships FOR SELECT
  USING (requester = app.current_user_id() OR addressee = app.current_user_id());
CREATE POLICY friendships_accept ON friendships FOR UPDATE
  USING (addressee = app.current_user_id()) WITH CHECK (addressee = app.current_user_id() AND status = 'aceita');
CREATE POLICY friendships_delete ON friendships FOR DELETE
  USING (requester = app.current_user_id() OR addressee = app.current_user_id());
-- Pedidos novos só pela função app.request_friend (não há política de INSERT).

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY blocks_self ON blocks USING (blocker = app.current_user_id()) WITH CHECK (blocker = app.current_user_id());

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_read ON posts FOR SELECT
  USING (author_id = app.current_user_id() OR (NOT hidden AND app.are_friends(app.current_user_id(), author_id)) OR app.is_admin());
CREATE POLICY posts_insert ON posts FOR INSERT WITH CHECK (author_id = app.current_user_id() AND NOT hidden);
CREATE POLICY posts_delete ON posts FOR DELETE USING (author_id = app.current_user_id() OR app.is_admin());
CREATE POLICY posts_moderate ON posts FOR UPDATE USING (app.is_admin());

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY reactions_read ON reactions FOR SELECT USING (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id));
CREATE POLICY reactions_write ON reactions FOR INSERT
  WITH CHECK (user_id = app.current_user_id() AND EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id));
CREATE POLICY reactions_update ON reactions FOR UPDATE USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
CREATE POLICY reactions_delete ON reactions FOR DELETE USING (user_id = app.current_user_id());

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_read ON comments FOR SELECT
  USING ((NOT hidden AND EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id)) OR author_id = app.current_user_id() OR app.is_admin());
CREATE POLICY comments_insert ON comments FOR INSERT
  WITH CHECK (author_id = app.current_user_id() AND NOT hidden AND EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id));
CREATE POLICY comments_delete ON comments FOR DELETE USING (author_id = app.current_user_id() OR app.is_admin());
CREATE POLICY comments_moderate ON comments FOR UPDATE USING (app.is_admin());

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_insert ON reports FOR INSERT WITH CHECK (reporter_id = app.current_user_id() AND status = 'aberta');
CREATE POLICY reports_read ON reports FOR SELECT USING (reporter_id = app.current_user_id() OR app.is_admin());
CREATE POLICY reports_resolve ON reports FOR UPDATE USING (app.is_admin());

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY gifts_read ON gifts FOR SELECT USING (from_id = app.current_user_id() OR to_id = app.current_user_id());
CREATE POLICY gifts_send ON gifts FOR INSERT
  WITH CHECK (from_id = app.current_user_id() AND claimed_at IS NULL AND app.are_friends(from_id, to_id));
CREATE POLICY gifts_claim ON gifts FOR UPDATE USING (to_id = app.current_user_id()) WITH CHECK (to_id = app.current_user_id());

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY challenges_read ON challenges FOR SELECT USING (owner_id = app.current_user_id() OR app.can_see_challenge(id));
CREATE POLICY challenges_insert ON challenges FOR INSERT WITH CHECK (owner_id = app.current_user_id());
CREATE POLICY challenges_delete ON challenges FOR DELETE USING (owner_id = app.current_user_id());

ALTER TABLE challenge_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY members_read ON challenge_members FOR SELECT USING (app.can_see_challenge(challenge_id));
CREATE POLICY members_join ON challenge_members FOR INSERT WITH CHECK (user_id = app.current_user_id() AND app.can_see_challenge(challenge_id));
CREATE POLICY members_leave ON challenge_members FOR DELETE USING (user_id = app.current_user_id());

ALTER TABLE challenge_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY checkins_read ON challenge_checkins FOR SELECT USING (app.can_see_challenge(challenge_id));
CREATE POLICY checkins_insert ON challenge_checkins FOR INSERT WITH CHECK (
  user_id = app.current_user_id()
  AND EXISTS (SELECT 1 FROM challenge_members m WHERE m.challenge_id = challenge_checkins.challenge_id AND m.user_id = app.current_user_id()));
CREATE POLICY checkins_delete ON challenge_checkins FOR DELETE USING (user_id = app.current_user_id());

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_read ON events FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY events_admin ON events FOR INSERT WITH CHECK (app.is_admin());
CREATE POLICY events_admin_delete ON events FOR DELETE USING (app.is_admin());

ALTER TABLE event_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY claims_self ON event_claims USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_self ON push_subscriptions USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE push_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY prefs_self ON push_prefs USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());

ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY modlog_admin ON moderation_log USING (app.is_admin()) WITH CHECK (app.is_admin());

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
-- Sem políticas: a API só acessa por app.get_setting/app.set_setting.
