import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';

const router = Router();

router.get('/', ProductController.getProducts);
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.post('/bulk', ProductController.bulkCreateProducts);
router.delete('/:id', ProductController.deleteProduct);

export default router;
