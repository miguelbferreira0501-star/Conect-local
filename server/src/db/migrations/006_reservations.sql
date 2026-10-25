-- Reservas de restaurante: número de pessoas.
ALTER TABLE bookings ADD COLUMN party_size smallint CHECK (party_size BETWEEN 1 AND 50);
