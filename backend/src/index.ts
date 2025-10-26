import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
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
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

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
  console.log('│                                         │');
  console.log('│  🔐 Authentication:                     │');
  console.log('│  POST   /api/auth/register              │');
  console.log('│  POST   /api/auth/login                 │');
  console.log('│  GET    /api/auth/me                    │');
  console.log('│                                         │');
  console.log('│  🛒 Shopping Cart:                      │');
  console.log('│  GET    /api/cart                       │');
  console.log('│  POST   /api/cart/items                 │');
  console.log('│  PUT    /api/cart/items                 │');
  console.log('│  DELETE /api/cart/items/:productId      │');
  console.log('│  DELETE /api/cart                       │');
  console.log('│                                         │');
  console.log('│  📦 Orders:                             │');
  console.log('│  POST   /api/orders                     │');
  console.log('│  GET    /api/orders                     │');
  console.log('│  GET    /api/orders/:id                 │');
  console.log('│  PATCH  /api/orders/:id/status          │');
  console.log('│                                         │');
  console.log('│  🏷️  Products:                          │');
  console.log('│  GET    /api/products                   │');
  console.log('│  GET    /api/products/:id               │');
  console.log('│  POST   /api/products                   │');
  console.log('│  PUT    /api/products/:id               │');
  console.log('│  DELETE /api/products/:id               │');
  console.log('│                                         │');
  console.log('│  ❤️  Health Check:                      │');
  console.log('│  GET    /api/health                     │');
  console.log('└─────────────────────────────────────────┘');
});

export default app;
