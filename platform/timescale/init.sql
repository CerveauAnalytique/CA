-- Table for CA7 records in TimescaleDB (also works on plain PostgreSQL, without the hypertable).
CREATE TABLE IF NOT EXISTS ca7_records (
  id          bigint      NOT NULL,
  source      bigint      NOT NULL,
  recorded_at timestamptz NOT NULL,
  data        jsonb       NOT NULL,
  PRIMARY KEY (id, recorded_at)
);
CREATE INDEX IF NOT EXISTS ca7_records_source_time ON ca7_records (source, recorded_at DESC);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb') THEN
    CREATE EXTENSION IF NOT EXISTS timescaledb;
    PERFORM create_hypertable('ca7_records', 'recorded_at', if_not_exists => TRUE);
  END IF;
END $$;
