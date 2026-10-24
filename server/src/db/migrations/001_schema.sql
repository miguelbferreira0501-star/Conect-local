-- Esquema principal. Compartilhado pelo app do cliente e pelo futuro painel empresarial.

CREATE SCHEMA IF NOT EXISTS app;

-- Usuário autenticado da requisição atual (definido pelo servidor em cada transação).
CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- Normalização sem acentos (não depende da extensão unaccent).
CREATE OR REPLACE FUNCTION app.norm(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT lower(translate(coalesce(t, ''),
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'))
$$;

-- ── Localidades (fonte: IBGE, via github.com/kelvins/municipios-brasileiros) ──
CREATE TABLE states (
  code smallint PRIMARY KEY,
  uf char(2) NOT NULL UNIQUE,
  name text NOT NULL,
  region text NOT NULL
);

CREATE TABLE cities (
  ibge integer PRIMARY KEY,
  name text NOT NULL,
  uf char(2) NOT NULL REFERENCES states(uf),
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  capital boolean NOT NULL DEFAULT false,
  ddd smallint,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo'
);
CREATE INDEX cities_uf_name_idx ON cities (uf, name);

-- ── Categorias ──
CREATE TABLE categories (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_name text NOT NULL,
  icon text NOT NULL,
  description text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

-- ── Usuários e sessões ──
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  phone text CHECK (phone ~ '^\d{10,11}$'),
  city_ibge integer REFERENCES cities(ibge),
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'business', 'admin')),
  terms_accepted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

-- ── Empresas ──
CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name text NOT NULL,
  professional_name text,
  category_id int NOT NULL REFERENCES categories(id),
  short_description text CHECK (char_length(short_description) <= 160),
  description text,
  logo_url text,
  cover_url text,
  -- Endereço físico (sede)
  street text,
  neighborhood text,
  postal_code text,
  city_ibge integer NOT NULL REFERENCES cities(ibge),
  lat double precision,
  lon double precision,
  address_public boolean NOT NULL DEFAULT true,
  -- Contato
  phone text,
  whatsapp text,
  website text,
  instagram text,
  facebook text,
  email text,
  -- Atendimento
  price_level smallint CHECK (price_level BETWEEN 1 AND 4),
  mode_in_person boolean NOT NULL DEFAULT true,
  mode_at_customer boolean NOT NULL DEFAULT false,
  mode_online boolean NOT NULL DEFAULT false,
  accepts_booking boolean NOT NULL DEFAULT false,
  accepts_quote boolean NOT NULL DEFAULT true,
  opening_hours jsonb,
  hours_updated_at timestamptz,
  -- Confiança (preenchidos por processos internos, nunca por pagamento)
  verified_at timestamptz,
  verification_method text,
  requests_received int NOT NULL DEFAULT 0,
  requests_answered int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (mode_in_person OR mode_at_customer OR mode_online)
);
CREATE INDEX businesses_city_idx ON businesses (city_ibge) WHERE status = 'active';
CREATE INDEX businesses_category_idx ON businesses (category_id);

-- Cidades atendidas além da sede (uma empresa, várias cidades, uma conta).
CREATE TABLE business_service_areas (
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  city_ibge integer NOT NULL REFERENCES cities(ibge),
  PRIMARY KEY (business_id, city_ibge)
);
CREATE INDEX business_service_areas_city_idx ON business_service_areas (city_ibge);

-- Membros que poderão administrar a empresa no futuro painel empresarial.
CREATE TABLE business_members (
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, user_id)
);

CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_type text NOT NULL DEFAULT 'quote' CHECK (price_type IN ('fixed', 'from', 'range', 'quote')),
  price_min_cents integer CHECK (price_min_cents >= 0),
  price_max_cents integer,
  duration_minutes integer CHECK (duration_minutes BETWEEN 5 AND 1440),
  bookable boolean NOT NULL DEFAULT false,
  notes text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (price_type <> 'range' OR (price_min_cents IS NOT NULL AND price_max_cents >= price_min_cents)),
  CHECK (NOT bookable OR duration_minutes IS NOT NULL)
);
CREATE INDEX services_business_idx ON services (business_id);

CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX photos_business_idx ON photos (business_id);

-- ── Ações do cliente ──
CREATE TABLE favorites (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
  notes text,
  contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  CHECK (ends_at > starts_at)
);
CREATE INDEX bookings_user_idx ON bookings (user_id, starts_at DESC);
CREATE INDEX bookings_business_time_idx ON bookings (business_id, starts_at);
-- Proteção extra contra dois agendamentos ativos no mesmo horário de início.
CREATE UNIQUE INDEX bookings_active_slot_uq ON bookings (business_id, starts_at) WHERE status IN ('requested', 'confirmed');

CREATE TABLE quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id),
  description text NOT NULL,
  preferred_date date,
  contact_preference text NOT NULL CHECK (contact_preference IN ('whatsapp', 'phone', 'email')),
  contact_phone text,
  neighborhood text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'answered', 'hired', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  hired_at timestamptz
);
CREATE INDEX quote_requests_user_idx ON quote_requests (user_id, created_at DESC);

-- ── Avaliações ──
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_display_name text NOT NULL,
  booking_id uuid UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
  quote_id uuid UNIQUE REFERENCES quote_requests(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) BETWEEN 20 AND 1000),
  aspects jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- 'under_review' = em moderação; denúncias NÃO ocultam automaticamente.
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'under_review', 'removed')),
  verified_interaction boolean NOT NULL DEFAULT false,
  report_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_business_idx ON reviews (business_id, created_at DESC) WHERE status = 'published';
CREATE INDEX reviews_user_idx ON reviews (user_id);

-- Resposta pública da empresa (será usada pelo painel empresarial).
CREATE TABLE review_replies (
  review_id uuid PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 2 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);

-- Estatísticas de avaliações válidas (somente publicadas).
CREATE VIEW business_review_stats AS
SELECT
  business_id,
  count(*)::int AS review_count,
  avg(rating)::float8 AS average,
  stddev_pop(rating)::float8 AS stddev,
  min(created_at) AS first_review_at,
  max(created_at) AS last_review_at,
  count(*) FILTER (WHERE rating = 1)::int AS r1,
  count(*) FILTER (WHERE rating = 2)::int AS r2,
  count(*) FILTER (WHERE rating = 3)::int AS r3,
  count(*) FILTER (WHERE rating = 4)::int AS r4,
  count(*) FILTER (WHERE rating = 5)::int AS r5
FROM reviews
WHERE status = 'published'
GROUP BY business_id;

-- Garante (no banco) que toda avaliação está ligada a uma contratação real do próprio autor.
CREATE OR REPLACE FUNCTION app.check_review_activity() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.booking_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = NEW.booking_id AND b.user_id = NEW.user_id
        AND b.business_id = NEW.business_id AND b.status = 'completed'
    ) THEN
      RAISE EXCEPTION 'review_activity_invalid' USING ERRCODE = 'P0001';
    END IF;
  ELSIF NEW.quote_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM quote_requests q
      WHERE q.id = NEW.quote_id AND q.user_id = NEW.user_id
        AND q.business_id = NEW.business_id AND q.status = 'hired'
    ) THEN
      RAISE EXCEPTION 'review_activity_invalid' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    RAISE EXCEPTION 'review_activity_required' USING ERRCODE = 'P0001';
  END IF;
  NEW.verified_interaction := true;
  RETURN NEW;
END $$;

CREATE TRIGGER reviews_check_activity BEFORE INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION app.check_review_activity();
