require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const timerRoutes = require('./routes/timers');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({ name: 'Study Forge API', status: 'online' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/timers', timerRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

async function start() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing.');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing.');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected.');

  app.listen(PORT, () => {
    console.log(`Study Forge API running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start Study Forge:', error.message);
  process.exit(1);
});
