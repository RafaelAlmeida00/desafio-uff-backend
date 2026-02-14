import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { taskRoutes } from './task.routes';

const router = Router();

router.use('/api/auth', authRoutes);
router.use('/api/tasks', taskRoutes);

export { router };
