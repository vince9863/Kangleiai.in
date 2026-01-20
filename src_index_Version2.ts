import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'js-yaml';
import { init as dbInit } from './db';
import auth from './middleware/auth';
import autoAnswersRouter from './routes/autoAnswers';
import webhooksRouter from './routes/webhooks';
import othersRouter from './routes/others';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve OpenAPI spec via Swagger UI
const specPath = path.join(__dirname, '..', 'openapi-kangleiai-v1.yaml');
let specDoc: any = {};
try {
  specDoc = YAML.load(fs.readFileSync(specPath, 'utf8'));
} catch (e) {
  specDoc = { openapi: '3.0.1', info: { title: 'Kangleiai API', version: '1.0.0' }, paths: {} };
}
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specDoc));

// Health
app.get('/', (req, res) => res.json({ ok: true, name: 'Kangleiai Demo API' }));

// Auth for protected routes
app.use(auth);

// Routes
app.use('/auto-answers', autoAnswersRouter);
app.use('/webhooks', webhooksRouter);
app.use('/', othersRouter);

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), UPLOAD_DIR)));

async function start() {
  await dbInit();
  app.listen(PORT, () => {
    console.log(`Kangleiai demo API listening on http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/docs`);
  });
}

start().catch(err => {
  console.error('Failed to start app', err);
  process.exit(1);
});