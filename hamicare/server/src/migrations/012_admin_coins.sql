-- Admin dá sementes de presente para uma conta (fica no histórico da carteira e no registro de moderação).
CREATE OR REPLACE FUNCTION app.admin_give_coins(p_user uuid, p_coins int) RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
DECLARE total int;
BEGIN
  IF NOT app.is_admin() THEN RAISE EXCEPTION 'sem permissão' USING ERRCODE = '42501'; END IF;
  IF p_coins < 1 OR p_coins > 50000 THEN RAISE EXCEPTION 'valor inválido' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user) THEN RETURN NULL; END IF;
  INSERT INTO game_wallet (user_id) VALUES (p_user) ON CONFLICT DO NOTHING;
  UPDATE game_wallet SET coins = coins + p_coins, updated_at = now() WHERE user_id = p_user RETURNING coins INTO total;
  INSERT INTO game_ledger (user_id, ref, label, coins) VALUES (p_user, 'admin:' || gen_random_uuid()::text, 'Presente da equipe HamiCare', p_coins);
  INSERT INTO moderation_log (actor, action, target) VALUES (app.current_user_id(), 'sementes:' || p_coins, p_user::text);
  RETURN total;
END $$;

REVOKE ALL ON FUNCTION app.admin_give_coins(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.admin_give_coins(uuid, int) TO {{APP_ROLE}};
