-- Teste grátis conforme o plano escolhido: 7 dias no anual, 3 dias no mensal. Uma vez por conta.
CREATE OR REPLACE FUNCTION app.start_trial(p_days int) RETURNS date
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, app AS $$
  UPDATE users SET trial_used = true, premium_until = greatest(coalesce(premium_until, current_date), current_date + least(7, greatest(1, p_days)))
  WHERE id = app.current_user_id() AND NOT trial_used RETURNING premium_until
$$;
REVOKE ALL ON FUNCTION app.start_trial(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.start_trial(int) TO {{APP_ROLE}};
