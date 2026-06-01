-- Custom migration: pgvector extension and additional indexes

CREATE EXTENSION IF NOT EXISTS vector;

-- Idempotency key unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS uq_job_runs_idempotency_key ON job_runs (idempotency_key);

-- Active signals lookup
CREATE INDEX IF NOT EXISTS idx_signals_active ON signals (user_id, asset_id, timeframe, status);

-- Event polling
CREATE INDEX IF NOT EXISTS idx_app_events_created ON app_events (created_at);

-- Job runs by type and status
CREATE INDEX IF NOT EXISTS idx_job_runs_type_status ON job_runs (job_type, status);
