-- "Faz X dias" no lembrete de retorno: conta os dias no horário de Brasília (antes usava a data do servidor, em UTC).
CREATE OR REPLACE FUNCTION app.push_take_due(p_return_days jsonb)
RETURNS TABLE (kind text, endpoint text, p256dh text, auth text, title text, body text, url text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN QUERY
  WITH due_booking AS (
    SELECT bk.id, bk.user_id, b.name AS biz, s.name AS svc, pe.name AS pet,
      to_char(bk.starts_at AT TIME ZONE ci.timezone, 'DD/MM "às" HH24:MI') AS quando
    FROM bookings bk
    JOIN businesses b ON b.id = bk.business_id JOIN cities ci ON ci.ibge = b.city_ibge
    JOIN services s ON s.id = bk.service_id LEFT JOIN pets pe ON pe.id = bk.pet_id
    WHERE bk.status = 'confirmed' AND bk.starts_at BETWEEN now() + interval '2 hours' AND now() + interval '26 hours'
      AND EXISTS (SELECT 1 FROM push_subscriptions x WHERE x.user_id = bk.user_id)
      AND NOT EXISTS (SELECT 1 FROM notification_log l WHERE l.kind = 'booking_reminder' AND l.ref = bk.id::text)
  ), last_visit AS (
    SELECT DISTINCT ON (bk.user_id, coalesce(bk.pet_id::text, ''), bk.service_id)
      bk.id, bk.user_id, bk.pet_id, bk.service_id, bk.starts_at, b.name AS biz, b.slug, s.name AS svc, pe.name AS pet, c.slug AS cat
    FROM bookings bk
    JOIN businesses b ON b.id = bk.business_id JOIN categories c ON c.id = b.category_id
    JOIN services s ON s.id = bk.service_id LEFT JOIN pets pe ON pe.id = bk.pet_id
    WHERE bk.status = 'completed' AND b.status = 'active' AND app.plan_active(b.plan, b.plan_until)
    ORDER BY bk.user_id, coalesce(bk.pet_id::text, ''), bk.service_id, bk.starts_at DESC
  ), due_return AS (
    SELECT v.* FROM last_visit v
    WHERE p_return_days ? v.cat
      AND v.starts_at < now() - make_interval(days => (p_return_days ->> v.cat)::int)
      AND v.starts_at > now() - interval '90 days'
      AND EXISTS (SELECT 1 FROM push_subscriptions x WHERE x.user_id = v.user_id)
      AND NOT EXISTS (SELECT 1 FROM bookings nx WHERE nx.user_id = v.user_id AND nx.service_id = v.service_id
        AND nx.pet_id IS NOT DISTINCT FROM v.pet_id AND nx.starts_at > v.starts_at AND nx.status IN ('requested', 'confirmed', 'completed'))
      AND NOT EXISTS (SELECT 1 FROM notification_log l WHERE l.kind = 'return' AND l.ref = v.id::text)
  ), logged AS (
    INSERT INTO notification_log (kind, ref)
    SELECT 'booking_reminder', id::text FROM due_booking
    UNION ALL SELECT 'return', id::text FROM due_return
    ON CONFLICT DO NOTHING
    RETURNING notification_log.kind AS k, notification_log.ref AS r
  )
  SELECT 'booking_reminder'::text, x.endpoint, x.p256dh, x.auth,
    ('Lembrete: ' || d.svc)::text,
    (coalesce(d.pet || ' tem horário', 'Você tem horário') || ' em ' || d.biz || ' — ' || d.quando || '.')::text,
    '/atividades'::text
  FROM due_booking d JOIN logged l ON l.k = 'booking_reminder' AND l.r = d.id::text JOIN push_subscriptions x ON x.user_id = d.user_id
  UNION ALL
  SELECT 'return'::text, x.endpoint, x.p256dh, x.auth,
    (CASE WHEN r.pet IS NOT NULL THEN 'Hora de agendar para ' || r.pet || '?' ELSE 'Hora de agendar de novo?' END)::text,
    ('Faz ' || ((now() AT TIME ZONE 'America/Sao_Paulo')::date - (r.starts_at AT TIME ZONE 'America/Sao_Paulo')::date) || ' dias do último ' || lower(r.svc) || ' em ' || r.biz || '. Toque para marcar.')::text,
    ('/empresa/' || r.slug || '/agendar?servico=' || r.service_id)::text
  FROM due_return r JOIN logged l ON l.k = 'return' AND l.r = r.id::text JOIN push_subscriptions x ON x.user_id = r.user_id;
END $$;
