import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import YAML from 'js-yaml';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'kangleiai_dev'
});

async function createTables() {
  // Simple schema for demo
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auto_answers (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      enabled BOOLEAN DEFAULT TRUE,
      priority INTEGER DEFAULT 0,
      trigger JSONB NOT NULL,
      action JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id UUID PRIMARY KEY,
      url TEXT NOT NULL,
      events JSONB NOT NULL,
      secret TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY,
      path TEXT NOT NULL,
      originalname TEXT,
      mimetype TEXT,
      metadata JSONB,
      status TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fine_tunes (
      id UUID PRIMARY KEY,
      payload JSONB,
      status TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  // Seed models as a lightweight in-memory / file resource (no DB)
}

async function init() {
  await createTables();
  console.log('Postgres tables ensured');
}

export { pool, init };