-- Esquema do HamiCare.
CREATE SCHEMA IF NOT EXISTS app;

-- Identidade do usuário da requisição (definida pela API em cada transação).
CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::uuid $$;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND position('@' in email) > 1),
  password_hash text NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  age_group text NOT NULL CHECK (age_group IN ('ate12', '13a17', '18mais')),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  premium_until date,
  trial_used boolean NOT NULL DEFAULT false,
  banned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

-- Backup privado do estado do app (inclui diário e peso: só o dono lê).
CREATE TABLE user_state (
  user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  state jsonb NOT NULL,
  client_updated_at bigint NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Perfil público: nunca guarda peso, diário ou humor.
CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  pet jsonb NOT NULL,
  house jsonb NOT NULL,
  level int NOT NULL DEFAULT 1,
  teen boolean NOT NULL DEFAULT false,
  accepts_requests boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE friendships (
  requester uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  addressee uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceita')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requester, addressee),
  CHECK (requester <> addressee)
);
CREATE INDEX friendships_addressee ON friendships (addressee);

CREATE TABLE blocks (
  blocker uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  blocked uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker, blocked)
);

CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('foto', 'atividade', 'conquista', 'decoracao', 'momento')),
  text text NOT NULL DEFAULT '' CHECK (length(text) <= 200),
  pet jsonb,
  house jsonb,
  image text CHECK (image IS NULL OR (image LIKE 'data:image/jpeg;base64,%' AND length(image) <= 400000)),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_author ON posts (author_id, created_at DESC);

CREATE TABLE reactions (
  post_id uuid NOT NULL REFERENCES posts ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('carinho', 'parabens', 'forca', 'girassol', 'abraco')),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 200),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_post ON comments (post_id, created_at);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id uuid NOT NULL,
  target_user uuid REFERENCES users ON DELETE CASCADE,
  reason text NOT NULL CHECK (length(reason) <= 200),
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'removida', 'mantida')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users ON DELETE SET NULL,
  UNIQUE (reporter_id, target_type, target_id)
);

CREATE TABLE gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  to_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  item_id text NOT NULL CHECK (length(item_id) <= 40),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 80),
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gifts_to ON gifts (to_id, created_at DESC);

CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 50),
  emoji text NOT NULL CHECK (length(emoji) <= 8),
  target int NOT NULL CHECK (target BETWEEN 1 AND 30),
  ends_at date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE challenge_members (
  challenge_id uuid NOT NULL REFERENCES challenges ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);

CREATE TABLE challenge_checkins (
  challenge_id uuid NOT NULL REFERENCES challenges ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  day date NOT NULL,
  PRIMARY KEY (challenge_id, user_id, day)
);

-- Eventos e missões especiais criados pela administração.
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 60),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 300),
  starts_on date NOT NULL,
  ends_on date NOT NULL CHECK (ends_on >= starts_on),
  reward_coins int NOT NULL DEFAULT 0 CHECK (reward_coins BETWEEN 0 AND 500),
  item_id text,
  created_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE event_claims (
  event_id uuid NOT NULL REFERENCES events ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE push_subscriptions (
  endpoint text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE push_prefs (
  user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  time text NOT NULL DEFAULT '19:00' CHECK (time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  tz text NOT NULL DEFAULT 'America/Sao_Paulo',
  kinds jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sent date
);

CREATE TABLE app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE moderation_log (
  id bigserial PRIMARY KEY,
  actor uuid REFERENCES users ON DELETE SET NULL,
  action text NOT NULL,
  target text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
