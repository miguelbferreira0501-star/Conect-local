#!/usr/bin/env bash
# Cria os papéis e bancos locais do PostgreSQL (desenvolvimento).
#   conecta      → dono do esquema (migrações e seed)
#   conecta_app  → usado pela aplicação; sem privilégios de dono, sujeito às políticas RLS
set -euo pipefail
PSQL=${PSQL:-"sudo -u postgres psql"}
$PSQL -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'conecta') THEN CREATE ROLE conecta LOGIN PASSWORD 'conecta' CREATEDB; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'conecta_app') THEN CREATE ROLE conecta_app LOGIN PASSWORD 'conecta_app' NOINHERIT; END IF;
END $$;
SELECT 'CREATE DATABASE conecta OWNER conecta' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'conecta')\gexec
SELECT 'CREATE DATABASE conecta_test OWNER conecta' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'conecta_test')\gexec
SQL
echo "Bancos prontos. Agora rode: npm run db:reset"
