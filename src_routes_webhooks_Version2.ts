import express from 'express';
import { addWebhook, listWebhooks, deleteWebhook } from '../store';

const router = express.Router();

router.get('/', async (req, res) => {
  const data = await listWebhooks();
  res.json({ data });
});

router.post('/', async (req, res) => {
  const { url, events } = req.body;
  if (!url || !Array.isArray(events)) return res.status(400).json({ error: 'url and events required' });
  const sub = await addWebhook(url, events);
  res.status(201).json(sub);
});

router.delete('/:id', async (req, res) => {
  const ok = await deleteWebhook(req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.status(204).send();
});

export default router;