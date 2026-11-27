import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Stats for dashboard
router.get('/stats', authorize('billing', 'canView'), InvoiceController.getDashboardStats);

// List of invoices
router.get('/list', authorize('billing', 'canView'), InvoiceController.getInvoices);

// CRUD
router.get('/:id', authorize('billing', 'canView'), InvoiceController.getInvoiceById);
router.post('/', authorize('billing', 'canCreate'), InvoiceController.createInvoice);
router.delete('/:id', authorize('billing', 'canDelete'), InvoiceController.deleteInvoice);
router.patch('/:id/status', authorize('billing', 'canEdit'), InvoiceController.updateInvoiceStatus);
router.post('/:id/payments', authorize('billing', 'canEdit'), InvoiceController.recordPayment);

export default router;
