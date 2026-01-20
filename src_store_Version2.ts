import { pool } from './db';
import { v4 as uuidv4 } from 'uuid';

type Rule = {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  priority?: number;
  trigger: any;
  action: any;
  created_at?: string;
  updated_at?: string;
};

async function createAutoAnswer(rule: Partial<Rule>): Promise<Rule> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const res = await pool.query(
    `INSERT INTO auto_answers (id, name, description, enabled, priority, trigger, action, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [id, rule.name, rule.description || null, rule.enabled ?? true, rule.priority ?? 0, rule.trigger, rule.action, now, now]
  );
  return res.rows[0];
}

async function listAutoAnswers(): Promise<Rule[]> {
  const res = await pool.query(`SELECT * FROM auto_answers ORDER BY priority DESC, created_at DESC`);
  return res.rows;
}

async function getAutoAnswer(id: string): Promise<Rule | null> {
  const res = await pool.query(`SELECT * FROM auto_answers WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

async function updateAutoAnswer(id: string, patch: Partial<Rule>): Promise<Rule | null> {
  const existing = await getAutoAnswer(id);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...patch,
    updated_at: new Date().toISOString()
  };
  await pool.query(
    `UPDATE auto_answers SET name=$1, description=$2, enabled=$3, priority=$4, trigger=$5, action=$6, updated_at=$7 WHERE id=$8`,
    [updated.name, updated.description, updated.enabled, updated.priority, updated.trigger, updated.action, updated.updated_at, id]
  );
  return await getAutoAnswer(id);
}

async function deleteAutoAnswer(id: string): Promise<boolean> {
  const res = await pool.query(`DELETE FROM auto_answers WHERE id = $1`, [id]);
  return res.rowCount > 0;
}

async function addWebhook(url: string, events: string[]): Promise<any> {
  const id = uuidv4();
  const secret = uuidv4();
  const res = await pool.query(
    `INSERT INTO webhooks (id, url, events, secret) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, url, JSON.stringify(events), secret]
  );
  return res.rows[0];
}

async function listWebhooks(): Promise<any[]> {
  const res = await pool.query(`SELECT * FROM webhooks ORDER BY created_at DESC`);
  return res.rows;
}

async function deleteWebhook(id: string): Promise<boolean> {
  const res = await pool.query(`DELETE FROM webhooks WHERE id = $1`, [id]);
  return res.rowCount > 0;
}

export { createAutoAnswer, listAutoAnswers, getAutoAnswer, updateAutoAnswer, deleteAutoAnswer, addWebhook, listWebhooks, deleteWebhook };