import { Router } from 'express';
import { PurchaseController } from '../controllers/purchase.controller.js';

const router = Router();

router.post('/', PurchaseController.createPurchase);
router.get('/', PurchaseController.getPurchases);
router.get('/:id', PurchaseController.getPurchaseById);
router.patch('/:id/receive', PurchaseController.receivePurchase);

export default router;
