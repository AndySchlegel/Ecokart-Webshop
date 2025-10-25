import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/products', productRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('┌─────────────────────────────────────────┐');
  console.log('│  🚀 EcoKart Backend API                 │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  📍 Server: http://localhost:${PORT}       │`);
  console.log(`│  🌐 Environment: ${(process.env.NODE_ENV || 'development').padEnd(19)}│`);
  console.log('│  📦 Database: JSON (Local)              │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  Endpoints:                             │');
  console.log(`│  GET    /api/health                     │`);
  console.log(`│  GET    /api/products                   │`);
  console.log(`│  GET    /api/products/:id               │`);
  console.log(`│  POST   /api/products                   │`);
  console.log(`│  PUT    /api/products/:id               │`);
  console.log(`│  DELETE /api/products/:id               │`);
  console.log('└─────────────────────────────────────────┘');
});

export default app;
