import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import { authenticate, authorize } from './middlewares/auth.middleware.js';
import invoiceRoutes from './routes/invoice.routes.js';
import productRoutes from './routes/product.routes.js';
import customerRoutes from './routes/customer.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import reportsRoutes from './routes/report.routes.js';
import rbacRoutes from './routes/rbac.routes.js';

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Public Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use(authenticate);

app.use('/api/invoices', invoiceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);

// Sensitive Modules with Authorization
app.use('/api/reports', authorize('reports', 'canView'), reportsRoutes);
app.use('/api/rbac', rbacRoutes); // rbacRoutes has its own internal authorization


export default app;
