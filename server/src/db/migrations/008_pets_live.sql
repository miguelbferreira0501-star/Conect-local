-- Pataí: ficha do pet, agendamentos recorrentes e "Pet ao Vivo" (etapas com fotos).

-- ── Ficha do pet ──
CREATE TABLE pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  species text NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
  breed text CHECK (char_length(breed) <= 60),
  size text CHECK (size IN ('mini', 'small', 'medium', 'large', 'giant')),
  sex text CHECK (sex IN ('male', 'female')),
  birth_year smallint CHECK (birth_year BETWEEN 1990 AND 2100),
  weight_kg numeric(5,1) CHECK (weight_kg > 0 AND weight_kg < 150),
  temperament text[] NOT NULL DEFAULT '{}',
  health_notes text CHECK (char_length(health_notes) <= 500),
  care_notes text CHECK (char_length(care_notes) <= 500),
  grooming_notes text CHECK (char_length(grooming_notes) <= 300),
  vaccines_up_to_date boolean,
  photo_mime text,
  photo bytea,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pets_user_idx ON pets (user_id);

ALTER TABLE bookings ADD COLUMN pet_id uuid REFERENCES pets(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN series_id uuid;
ALTER TABLE quote_requests ADD COLUMN pet_id uuid REFERENCES pets(id) ON DELETE SET NULL;
CREATE INDEX bookings_series_idx ON bookings (series_id) WHERE series_id IS NOT NULL;

-- O pet do pedido precisa ser de quem pediu (vale mesmo se alguém burlar a API).
CREATE OR REPLACE FUNCTION app.check_pet_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.pet_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pets p WHERE p.id = NEW.pet_id AND p.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'pet_not_owned' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_pet_owner BEFORE INSERT OR UPDATE OF pet_id ON bookings FOR EACH ROW EXECUTE FUNCTION app.check_pet_owner();
CREATE TRIGGER quotes_pet_owner BEFORE INSERT OR UPDATE OF pet_id ON quote_requests FOR EACH ROW EXECUTE FUNCTION app.check_pet_owner();

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY pets_owner ON pets
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
-- A empresa vê a ficha dos pets que têm pedido com ela (para atender com segurança).
CREATE POLICY pets_business_read ON pets FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings b WHERE b.pet_id = pets.id AND app.is_business_member(b.business_id))
  OR EXISTS (SELECT 1 FROM quote_requests q WHERE q.pet_id = pets.id AND app.is_business_member(q.business_id))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON pets TO {{APP_ROLE}};

-- ── Pet ao Vivo: etapas do atendimento, com foto opcional ──
CREATE TABLE booking_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('checkin', 'bath', 'drying', 'grooming', 'ready', 'walk_start', 'walk_end', 'visit_start', 'visit_end', 'pickup', 'dropoff', 'photo', 'done')),
  note text CHECK (char_length(note) <= 300),
  details jsonb NOT NULL DEFAULT '{}',
  photo_mime text,
  photo bytea,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_updates_booking_idx ON booking_updates (booking_id, created_at);

ALTER TABLE booking_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_updates_read ON booking_updates FOR SELECT USING (
  app.is_business_member(business_id)
  OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = app.current_user_id())
);
CREATE POLICY booking_updates_insert ON booking_updates FOR INSERT WITH CHECK (
  app.is_business_member(business_id)
  AND EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.business_id = booking_updates.business_id AND b.status IN ('confirmed', 'completed'))
);
CREATE POLICY booking_updates_delete ON booking_updates FOR DELETE USING (app.is_business_member(business_id));
GRANT SELECT, INSERT, DELETE ON booking_updates TO {{APP_ROLE}};
