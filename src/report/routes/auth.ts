import { Router } from 'express';
import checkRight, { Roles } from '../middlewares/auth';

const router = Router();

router.get('/', checkRight(Roles.READ), (req, res) => {
  res.sendJson({
    ...req.user,
  });
});

export default router;
