import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';

const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });

// Simple chat echo
router.post('/chat', (req, res) => {
  const { model, messages, enable_retrieval } = req.body;
  const last = Array.isArray(messages) ? messages[messages.length - 1] : { content: '' };
  const responseText = enable_retrieval ? `(RAG demo) Echo: ${last.content}` : `Echo: ${last.content}`;
  res.json({
    id: 'chat_' + uuidv4(),
    object: 'chat.completion',
    created: Date.now(),
    model: model || 'kangleiai-1.0',
    choices: [{ index: 0, message: { role: 'assistant', content: responseText }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
  });
});

// Models (lightweight)
router.get('/models', (req, res) => {
  res.json({
    data: [
      {
        id: 'kangleiai-1.0',
        name: 'kangleiai-1.0',
        description: 'Demo model - echo & templating only',
        capabilities: ['chat', 'embeddings', 'multimodal'],
        max_context_tokens: 8192,
        multimodal: false
      },
      {
        id: 'kangleiai-embedding-1.0',
        name: 'kangleiai-embedding-1.0',
        description: 'Demo embedding model (random vectors)',
        capabilities: ['embeddings'],
        max_context_tokens: 2048,
        multimodal: false
      }
    ]
  });
});

// Embeddings (random vectors demo)
router.post('/embeddings', (req, res) => {
  const { model, input } = req.body;
  const inputs = Array.isArray(input) ? input : [input];
  const data = inputs.map((inp: any, idx: number) => ({
    embedding: Array.from({ length: 8 }).map(() => Math.random()),
    index: idx,
    input: inp
  }));
  res.json({ data });
});

// Documents upload
router.post('/documents/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const id = uuidv4();
  const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
  await pool.query(
    `INSERT INTO documents (id, path, originalname, mimetype, metadata, status) VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, req.file.path, req.file.originalname, req.file.mimetype, JSON.stringify(metadata), 'indexed']
  );
  res.status(201).json({ document_id: id, status: 'indexed' });
});

// Tools execute (demo)
router.post('/tools/execute', (req, res) => {
  const { tool_id, input } = req.body;
  if (tool_id === 'calendar.create_event') {
    return res.json({ tool_id, status: 'ok', result: { event_id: 'evt_' + uuidv4(), ...input } });
  }
  res.json({ tool_id, status: 'error', result: { message: 'tool not implemented in demo' } });
});

// Fine-tunes
router.post('/fine-tunes', async (req, res) => {
  const id = uuidv4();
  await pool.query(`INSERT INTO fine_tunes (id, payload, status) VALUES ($1,$2,$3)`, [id, JSON.stringify(req.body), 'queued']);
  const job = { fine_tune_id: id, status: 'queued', requested: req.body, created_at: new Date().toISOString() };
  res.status(202).json(job);
});

// Speech endpoints (stubs)
router.post('/speech-to-text', upload.single('audio'), (req, res) => {
  res.json({ transcription: 'Demo transcription (audio not actually processed).', language: req.body.language || 'en', segments: [] });
});

router.post('/text-to-speech', (req, res) => {
  const buf = Buffer.from([]);
  res.set('Content-Type', 'audio/mpeg');
  res.send(buf);
});

export default router;