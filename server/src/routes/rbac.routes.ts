import { Router } from 'express';
import { RbacController } from '../controllers/rbac.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Middleware to ensure only Admins can manage users and roles
router.use(authenticate);
router.use(authorize('users', 'canView'));

router.get('/users', RbacController.getUsers);
router.patch('/users/role', authorize('users', 'canEdit'), RbacController.updateUserRole);

router.get('/roles', RbacController.getRoles);
router.patch('/permissions', authorize('users', 'canEdit'), RbacController.updatePermissions);

export default router;
