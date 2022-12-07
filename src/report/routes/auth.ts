import { Router } from 'express';
import { createSecuredRoute } from '../lib/express-utils';
import { getAllowedRoutes, Roles } from '../models/roles';

const router = Router();

Object.assign(router, { _permPrefix: 'auth' });

createSecuredRoute(router, 'GET /', Roles.READ, (req, res) => {
  res.sendJson({
    ...req.user,
  });
});

createSecuredRoute(router, 'GET /permissions', Roles.READ, (req, res) => {
  if (req.user) {
    const { maxRolePriority } = req.user;
    res.sendJson(
      getAllowedRoutes(maxRolePriority as Parameters<typeof getAllowedRoutes>[0]),
    );
  } else {
    res.errorJson(new Error('User not found'));
  }
});

export default router;
