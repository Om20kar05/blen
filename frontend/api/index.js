import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './backend/config/db.js';
import routes from './backend/routes/index.js';
import { errorHandler } from './backend/middleware/errorHandler.js';

dotenv.config();

const app = express();

// Security and CORS
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser helper
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const key = parts[0]?.trim();
      const val = parts[1]?.trim();
      if (key && val) {
        req.cookies[key] = decodeURIComponent(val);
      }
    });
  }
  next();
});

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Vercel Serverless] DB connection error:', err);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'BLEN HR Vercel Serverless API' });
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'BLEN HR Vercel Serverless API' });
});

// Mount routes on both /api and / to handle any rewrite variation
app.use('/api', routes);
app.use('/', routes);

// Error handler
app.use(errorHandler);

export default app;
