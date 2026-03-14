import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';
import sentimentRoutes from './routes/sentiment.js';
import { SchedulerService } from './services/scheduler.js';

const app = express();
const scheduler = new SchedulerService();

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    scheduler.start();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

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
