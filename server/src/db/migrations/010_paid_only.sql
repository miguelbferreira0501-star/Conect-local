-- Pataí só funciona com assinatura: 30 dias grátis uma única vez por conta; depois, plano mensal.

CREATE OR REPLACE FUNCTION app.plan_active(p_plan text, p_until timestamptz) RETURNS boolean
LANGUAGE sql STABLE AS $$ SELECT p_plan <> 'free' AND (p_until IS NULL OR p_until > now()) $$;
GRANT EXECUTE ON FUNCTION app.plan_active(text, timestamptz) TO {{APP_ROLE}};

-- Quem já usou o teste grátis não ganha outro (nem apagando e recriando a empresa).
ALTER TABLE users ADD COLUMN trial_used_at timestamptz;

CREATE OR REPLACE FUNCTION app.business_trial() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user uuid := app.current_user_id();
BEGIN
  IF coalesce(NEW.is_demo, false) THEN RETURN NEW; END IF;
  IF v_user IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE id = v_user AND trial_used_at IS NULL) THEN
    NEW.plan := 'pro';
    NEW.plan_until := now() + interval '30 days';
    UPDATE users SET trial_used_at = now() WHERE id = v_user;
  ELSE
    NEW.plan := 'free';
    NEW.plan_until := NULL;
  END IF;
  RETURN NEW;
END $$;

-- Contas que já têm empresa contam como teste usado.
UPDATE users u SET trial_used_at = now()
WHERE trial_used_at IS NULL AND EXISTS (
  SELECT 1 FROM business_members m JOIN businesses b ON b.id = m.business_id WHERE m.user_id = u.id AND m.role = 'owner' AND NOT b.is_demo);
