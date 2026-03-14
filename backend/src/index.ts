import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import sentimentRoutes from './routes/sentiment.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/sentiment', sentimentRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.PORT, () => {
  console.log(`🚀 Artha API running on port ${config.PORT}`);
  console.log(`📊 API: http://localhost:${config.PORT}/api/sentiment/current`);
});
