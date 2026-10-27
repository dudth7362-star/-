import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllSeoulSchools, getSchoolDetail } from './server/schoolinfo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Status check endpoint (does not leak key value)
  app.get('/api/status', (_req, res) => {
    const hasKey = Boolean(process.env.SCHOOLINFO_API_KEY && process.env.SCHOOLINFO_API_KEY.trim() !== '');
    res.json({
      hasApiKey: hasKey,
      status: 'ready',
    });
  });

  // Main schools list endpoint
  app.get('/api/schools', async (req, res) => {
    const apiKey = process.env.SCHOOLINFO_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      res.status(503).json({ error: 'SCHOOLINFO_API_KEY_MISSING' });
      return;
    }

    const forceRefresh = req.query.refresh === 'true';

    try {
      const data = await getAllSeoulSchools(forceRefresh);
      res.json(data);
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === 'SCHOOLINFO_API_KEY_MISSING' || errorObj?.message === 'SCHOOLINFO_API_KEY_MISSING') {
        res.status(503).json({ error: 'SCHOOLINFO_API_KEY_MISSING' });
        return;
      }
      console.error('API Error in /api/schools:', errorObj?.message || err);
      res.status(500).json({
        error: 'SCHOOLINFO_API_FAILED',
        message: '학교알리미 API 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  });

  // School detail endpoint
  app.get('/api/schools/:schoolCode', async (req, res) => {
    const { schoolCode } = req.params;
    if (!schoolCode) {
      res.status(400).json({ error: 'MISSING_SCHOOL_CODE' });
      return;
    }

    try {
      const detail = await getSchoolDetail(schoolCode);
      res.json(detail);
    } catch (err: unknown) {
      console.error(`Error in /api/schools/${schoolCode}:`, err);
      res.status(500).json({ error: 'DETAIL_FETCH_FAILED' });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Seoul High School Map] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
