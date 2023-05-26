import { Router } from 'express';
import namespacesRouter from './admin/namespaces';
import usersRouter from './admin/users';

const router = Router()
  .use('/namespaces', namespacesRouter)
  .use('/users', usersRouter);

export default router;
