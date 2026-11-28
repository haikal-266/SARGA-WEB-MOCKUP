import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import announcementRoutes from './routes/announcement.routes';
import authRoutes from './routes/auth.routes';
import itemRoutes from './routes/item.routes';
import loanRoutes from './routes/loan.routes';
import membershipRoutes from './routes/membership.routes';
import organizationRoutes from './routes/organization.routes';
import platformRoutes from './routes/platform.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

// Allowed origins whitelist
const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:62568',
  process.env.CORS_ORIGIN
].filter(Boolean) as string[];

// Dynamic CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // In non-production, allow any localhost/127.0.0.1 port or matched whitelist
    if (
      process.env.NODE_ENV !== 'production' ||
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS error: Origin ${origin} not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-organization-id',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Authorization', 'x-organization-id']
}));

// Preflight handler
app.options('*', cors());

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SARGA REST API (SRS v1.2)'
  });
});

// Uploaded images are served locally under /uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// API Routes
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/platform', platformRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// Error Middleware
app.use(errorHandler);

export default app;
