import express from 'express';
import { createAutoAnswer, listAutoAnswers, getAutoAnswer, updateAutoAnswer, deleteAutoAnswer } from '../store';
import fetch from 'node-fetch';

const router = express.Router();

function renderTemplate(template = '', ctx: any = {}) {
  return String(template).replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const parts = key.split('.');
    let v: any = ctx;
    for (const p of parts) {
      if (v == null) return '';
      v = v[p];
    }
    return v == null ? '' : String(v);
  });
}

function matchRule(rule: any, message: any) {
  const content = (message && message.content) ? String(message.content).toLowerCase() : '';
  if (!rule || !rule.trigger) return { matched: false };
  const trig = rule.trigger;
  if (trig.type === 'keyword' && Array.isArray(trig.keywords)) {
    for (const kw of trig.keywords) {
      if (!kw) continue;
      if (content.includes(String(kw).toLowerCase())) {
        return { matched: true, matched_keyword: kw, reason: 'keyword' };
      }
    }
  }
  if (trig.type === 'regex' && trig.pattern) {
    try {
      const r = new RegExp(trig.pattern, 'i');
      const m = content.match(r);
      if (m) return { matched: true, matched_keyword: m[0], reason: 'regex' };
    } catch (e) {
      // invalid regex
    }
  }
  return { matched: false };
}

router.post('/', async (req, res) => {
  const body = req.body;
  if (!body || !body.name || !body.trigger || !body.action) {
    return res.status(400).json({ error: 'name, trigger and action required' });
  }
  const r = await createAutoAnswer(body);
  res.status(201).json(r);
});

router.get('/', async (req, res) => {
  const data = await listAutoAnswers();
  res.json({ data });
});

router.get('/:id', async (req, res) => {
  const r = await getAutoAnswer(req.params.id);
  if (!r) return res.status(404).json({ error: 'not found' });
  res.json(r);
});

router.patch('/:id', async (req, res) => {
  const updated = await updateAutoAnswer(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const ok = await deleteAutoAnswer(req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.status(204).send();
});

router.post('/:id/test', async (req, res) => {
  const rule = await getAutoAnswer(req.params.id);
  if (!rule) return res.status(404).json({ error: 'not found' });
  const { message, user } = req.body;
  const match = matchRule(rule, message || {});
  let generated_reply: string | null = null;
  let attachments: any[] = [];
  if (match.matched) {
    const ctx = { user: user || (req as any).user, matched_keyword: match.matched_keyword, doc: {} };
    if (rule.action && rule.action.type === 'reply') {
      if (rule.action.reply_template) {
        generated_reply = renderTemplate(rule.action.reply_template, ctx);
      } else if (rule.action.model) {
        generated_reply = `[model:${rule.action.model}] (demo) -- matched ${match.matched_keyword}`;
      } else {
        generated_reply = `(auto-reply) matched ${match.matched_keyword}`;
      }
      attachments = rule.action.attachments || [];
    }
  }
  res.json({
    matched: !!match.matched,
    rule_id: rule.id,
    generated_reply,
    attachments,
    debug: { match }
  });
});

router.post('/preview', async (req, res) => {
  const { message, user } = req.body;
  const rules = (await listAutoAnswers()).filter(r => r.enabled);
  const results: any[] = [];
  for (const r of rules) {
    const match = matchRule(r, message || {});
    if (match.matched) {
      const ctx = { user: user || (req as any).user, matched_keyword: match.matched_keyword, doc: {} };
      const reply = r.action && r.action.reply_template ? renderTemplate(r.action.reply_template, ctx) : `(auto-reply) matched ${match.matched_keyword}`;
      results.push({
        matched: true,
        rule_id: r.id,
        generated_reply: reply,
        attachments: r.action && r.action.attachments ? r.action.attachments : [],
        debug: { match }
      });
    }
  }
  res.json({ matches: results });
});

// Helper to send reply and dispatch webhooks (used by other components)
async function sendAutoReply(rule: any, message: any, user: any) {
  const match = matchRule(rule, message || {});
  if (!match.matched) return null;
  const ctx = { user: user || { name: 'Unknown' }, matched_keyword: match.matched_keyword, doc: {} };
  const reply = rule.action && rule.action.reply_template ? renderTemplate(rule.action.reply_template, ctx) : `(auto-reply) matched ${match.matched_keyword}`;
  // dispatch webhooks
  const { listWebhooks } = require('../store');
  const webhooks = await listWebhooks();
  const subs = webhooks.filter((w: any) => (w.events || []).includes('auto_answer_sent'));
  const payload = { event: 'auto_answer_sent', rule_id: rule.id, reply, message, user };
  for (const wh of subs) {
    try {
      await fetch(wh.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // node-fetch v3 does not support timeout option on top-level; omitting here for demo
      });
    } catch (e) {
      // ignore errors in demo
    }
  }
  return { reply, matched_keyword: match.matched_keyword };
}

export default router;
export { matchRule, renderTemplate, sendAutoReply };