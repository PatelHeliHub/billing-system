import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authorize('customers', 'canView'), CustomerController.getCustomers);
router.get('/:id', authorize('customers', 'canView'), CustomerController.getCustomerById);
router.post('/', authorize('customers', 'canCreate'), CustomerController.createCustomer);
router.put('/:id', authorize('customers', 'canEdit'), CustomerController.updateCustomer);
router.delete('/:id', authorize('customers', 'canDelete'), CustomerController.deleteCustomer);
router.get('/:id/ledger', authorize('customers', 'canView'), CustomerController.getCustomerLedger);

export default router;
