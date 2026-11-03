#!/usr/bin/env bash
# Cria os papéis e bancos locais do PostgreSQL (desenvolvimento e testes).
#   hamicare      → dono do esquema (migrações)
#   hamicare_app  → usado pela API; sem privilégios de dono, sujeito às políticas RLS
set -euo pipefail
PSQL=${PSQL:-"sudo -u postgres psql"}
$PSQL -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hamicare') THEN CREATE ROLE hamicare LOGIN PASSWORD 'hamicare' CREATEDB CREATEROLE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hamicare_app') THEN CREATE ROLE hamicare_app LOGIN PASSWORD 'hamicare_app' NOINHERIT; END IF;
END $$;
SELECT 'CREATE DATABASE hamicare OWNER hamicare' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hamicare')\gexec
SELECT 'CREATE DATABASE hamicare_test OWNER hamicare' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hamicare_test')\gexec
SQL
echo "Bancos prontos. Agora rode: npm run migrate"
