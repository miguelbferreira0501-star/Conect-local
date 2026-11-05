-- Lembretes ao longo do dia (água, Hami, missões, pausa, hora de dormir, passeios e amigos).
-- O plano de cada lembrete fica no servidor (web/src/shared/reminders.ts); aqui ficam as escolhas da pessoa
-- e o controle do que já saiu (para nunca repetir nem passar do limite do dia).

ALTER TABLE push_prefs ADD COLUMN water text NOT NULL DEFAULT 'normal' CHECK (water IN ('pouco', 'normal', 'muito'));
ALTER TABLE push_prefs ADD COLUMN bedtime text NOT NULL DEFAULT '22:00' CHECK (bedtime ~ '^[0-2][0-9]:[0-5][0-9]$');
ALTER TABLE push_prefs ADD COLUMN sent jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Quem pode receber lembrete agora (lembretes ligados e pelo menos um aparelho inscrito).
CREATE OR REPLACE FUNCTION app.reminder_candidates() RETURNS TABLE (
  user_id uuid, enabled boolean, "time" text, tz text, kinds jsonb, water text, bedtime text, sent jsonb, minor boolean, state jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT p.user_id, p.enabled, p.time, p.tz, p.kinds, p.water, p.bedtime, p.sent, u.age_group <> '18mais', s.state
  FROM push_prefs p
  JOIN users u ON u.id = p.user_id AND u.banned_at IS NULL
  LEFT JOIN user_state s ON s.user_id = p.user_id
  WHERE p.enabled AND EXISTS (SELECT 1 FROM push_subscriptions ps WHERE ps.user_id = p.user_id)
$$;

CREATE OR REPLACE FUNCTION app.save_reminder_log(p_user uuid, p_sent jsonb) RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  UPDATE push_prefs SET sent = p_sent WHERE user_id = p_user
$$;

-- Para avisos de amigos (visita, presente, pedido): só se a pessoa quiser e fora do silêncio da noite.
CREATE OR REPLACE FUNCTION app.notify_target(p_user uuid) RETURNS TABLE (enabled boolean, tz text, kinds jsonb, minor boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT p.enabled, p.tz, p.kinds, u.age_group <> '18mais'
  FROM push_prefs p JOIN users u ON u.id = p.user_id AND u.banned_at IS NULL
  WHERE p.user_id = p_user
$$;

REVOKE ALL ON FUNCTION app.reminder_candidates(), app.save_reminder_log(uuid, jsonb), app.notify_target(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.reminder_candidates(), app.save_reminder_log(uuid, jsonb), app.notify_target(uuid) TO {{APP_ROLE}};
