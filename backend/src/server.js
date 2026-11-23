import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDB, disconnectDB } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    try {
      const parsedUrl = new URL(origin);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        parsedUrl.hostname.endsWith('.vercel.app') ||
        parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1' ||
        process.env.NODE_ENV !== 'production';

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, false);
    } catch {
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Request parsers & logger
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Simple cookie parser helper middleware for auth tokens in cookies
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BLEN HR Attendance & Leave API'
  });
});

// Root API status endpoint
app.get('/', (req, res, next) => {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    return next();
  }
  res.status(200).json({
    success: true,
    service: 'BLEN DIGITAL HR SaaS Backend API',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Mount all API routes
app.use('/api', routes);

// Serve static frontend in production if built
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve(frontendDist, 'index.html'));
  });
}

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Connect to MongoDB and start server
let server = null;

export const startServer = async (port = PORT) => {
  await connectDB();
  return new Promise((resolve, reject) => {
    const tryListen = (p) => {
      server = app.listen(p, '0.0.0.0', () => {
        console.log(`[Server] BLEN Digital API server listening on http://0.0.0.0:${p}`);
        resolve(server);
      });
      server.once('error', (err) => {
        if ((err.code === 'EADDRINUSE' || err.code === 'EACCES') && p === 5000) {
          console.warn(`[Server] Port 5000 is unavailable (${err.code}). Falling back to port 5001...`);
          tryListen(5001);
        } else {
          console.error('[Server] Listen error:', err);
          reject(err);
        }
      });
    };
    tryListen(port);
  });
};

export const stopServer = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
};

// Start automatically only when executed directly (not when imported in tests)
const isDirectExecution = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].includes('nodemon'));
if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  });
}

export default app;
