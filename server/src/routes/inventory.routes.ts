import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller.js';

const router = Router();

router.get('/overview', InventoryController.getOverview);
router.get('/movements', InventoryController.getMovements);
router.post('/adjust', InventoryController.adjustStock);

export default router;
