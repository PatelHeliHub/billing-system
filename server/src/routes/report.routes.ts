import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/sales-summary', authorize('reports', 'canView'), ReportController.getSalesSummary);
router.get('/product-performance', authorize('reports', 'canView'), ReportController.getProductPerformance);
router.get('/inventory-health', authorize('reports', 'canView'), ReportController.getInventoryHealth);
router.get('/purchase-report', authorize('reports', 'canView'), ReportController.getPurchaseReport);
router.get('/daily-closing', authorize('reports', 'canView'), ReportController.getDailyClosing);

export default router;
