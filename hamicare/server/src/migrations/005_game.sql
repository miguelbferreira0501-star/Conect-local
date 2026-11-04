-- Economia do jogo no servidor: carteira, histórico, inventário, baús e configuração.
-- O servidor decide XP, sementes, itens e sorteios de quem tem conta. O app só mostra.

CREATE TABLE game_wallet (
  user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  coins int NOT NULL DEFAULT 30 CHECK (coins >= 0),
  xp int NOT NULL DEFAULT 0 CHECK (xp >= 0),
  max_level int NOT NULL DEFAULT 1 CHECK (max_level >= 1),
  fragments int NOT NULL DEFAULT 0 CHECK (fragments >= 0),
  pity jsonb NOT NULL DEFAULT '{"semRaro": 0, "semLendario": 0}',
  -- Baús grátis esperando para abrir (prêmio de arena).
  pending_chests text[] NOT NULL DEFAULT '{}',
  imported_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cada ganho ou gasto, com referência única: a mesma coisa nunca paga duas vezes.
CREATE TABLE game_ledger (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  ref text NOT NULL CHECK (length(ref) <= 160),
  label text NOT NULL CHECK (length(label) <= 120),
  coins int NOT NULL,
  xp int NOT NULL DEFAULT 0,
  -- Dia do ganho e se conta no teto da rotina (para os limites do dia).
  day date,
  routine boolean NOT NULL DEFAULT false,
  bucket text,
  -- false = desfeito (ex.: desmarcou a missão).
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX game_ledger_ref ON game_ledger (user_id, ref);
CREATE INDEX game_ledger_day ON game_ledger (user_id, day) WHERE day IS NOT NULL;
CREATE INDEX game_ledger_recent ON game_ledger (user_id, created_at DESC);

CREATE TABLE game_inventory (
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  item_id text NOT NULL CHECK (length(item_id) <= 80),
  qty int NOT NULL DEFAULT 1 CHECK (qty >= 0),
  origin text NOT NULL DEFAULT 'loja',
  acquired_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE game_chest_opens (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  chest text NOT NULL,
  rarity text NOT NULL,
  item_id text NOT NULL,
  duplicate boolean NOT NULL DEFAULT false,
  fragments int NOT NULL DEFAULT 0,
  -- Baú revelado (menores de 18): a pessoa viu o item antes de comprar.
  revealed boolean NOT NULL DEFAULT false,
  free boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_chest_opens_user ON game_chest_opens (user_id, created_at DESC);

-- Baú revelado: o item já sorteado que aparece antes da compra.
CREATE TABLE game_chest_offers (
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  chest text NOT NULL,
  item_id text NOT NULL,
  rarity text NOT NULL,
  pity jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chest)
);

-- Configuração do jogo (níveis, ganhos, arenas, baús). A última versão vale.
CREATE TABLE game_config (
  version int PRIMARY KEY,
  config jsonb NOT NULL,
  created_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON game_wallet, game_inventory TO {{APP_ROLE}};
GRANT SELECT, INSERT, UPDATE ON game_ledger TO {{APP_ROLE}};
GRANT SELECT, INSERT ON game_chest_opens TO {{APP_ROLE}};
GRANT SELECT, INSERT, UPDATE, DELETE ON game_chest_offers TO {{APP_ROLE}};
GRANT SELECT, INSERT ON game_config TO {{APP_ROLE}};
GRANT USAGE ON SEQUENCE game_ledger_id_seq, game_chest_opens_id_seq TO {{APP_ROLE}};

ALTER TABLE game_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_wallet_self ON game_wallet USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
ALTER TABLE game_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_ledger_self ON game_ledger USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
ALTER TABLE game_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_inventory_self ON game_inventory USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
ALTER TABLE game_chest_opens ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_chest_opens_self ON game_chest_opens USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
ALTER TABLE game_chest_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_chest_offers_self ON game_chest_offers USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
ALTER TABLE game_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_config_read ON game_config FOR SELECT USING (true);
CREATE POLICY game_config_admin ON game_config FOR INSERT WITH CHECK (app.is_admin());
