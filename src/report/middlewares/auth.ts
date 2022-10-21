import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verify } from 'jsonwebtoken';
import config from '../lib/config';
import { getElasticClient } from '../lib/elastic';
import { CustomError } from '../types/errors';

const { secret: jwtSecret } = config.get('ezmesure');

/**
 * Roles names
 */
export enum Roles {
  SUPER_USER = 'superuser',
  READ_WRITE = 'ezreporting',
  READ = 'ezreporting_read_only',
}

/**
 * Roles priority, higher means more perms
 */
const ROLES_PRIORITIES = {
  [Roles.SUPER_USER]: 9999,
  [Roles.READ_WRITE]: 2,
  [Roles.READ]: 1,
} as const;

/**
 * Check if current user have the rights scopes.
 *
 * Adds `req.user` with `username` & `email` from Elastic user.
 *
 * @param minRole The minimum role required.
 *
 * @returns Express middleware
 */
const checkRight = (minRole: Roles): RequestHandler => async (req, res, next) => {
  let username = '';
  try {
    // Getting given JWT
    const token = req.headers.authorization ?? '';
    const regRes = /Bearer (?<token>.*)/i.exec(token);
    // If no username given/found
    if (!regRes || !regRes.groups || !regRes.groups.token) {
      throw new CustomError(`'${req.method} ${req.url}' requires auth`, StatusCodes.UNAUTHORIZED);
    }

    const jwt = verify(regRes.groups.token, jwtSecret, { algorithms: ['HS256'] });

    if (typeof jwt === 'string') {
      throw new CustomError('JWT malformed', StatusCodes.BAD_REQUEST);
    }

    username = jwt.username;
  } catch (error) {
    res.errorJson(error);
  }

  try {
    const elastic = await getElasticClient();
    const response = await elastic.security.getUser<Record<string, ElasticUser | undefined>>({
      username,
    });
    const { body: { [username]: user } } = response;

    if (user && user.enabled) {
      req.user = { username: user.username, email: user.email, roles: [] };
      // Calculating higher role of user (kinda weird tbh)
      const maxRole = user.roles.reduce((max, role) => {
        const r = role as keyof typeof ROLES_PRIORITIES;
        if (ROLES_PRIORITIES[r] && req.user) {
          req.user.roles.push(r);
          if (ROLES_PRIORITIES[r] > max) {
            return ROLES_PRIORITIES[r] ?? 0;
          }
        }
        return max;
      }, 0);

      // If the higher role of user is valid
      if (maxRole >= ROLES_PRIORITIES[minRole]) {
        next();
        return;
      }
    }

    throw new CustomError(`User '${username}' doesn't have the rights to acces to '${req.method} ${req.url}'`, StatusCodes.FORBIDDEN);
  } catch (error) {
    res.errorJson(error);
  }
};

export default checkRight;
