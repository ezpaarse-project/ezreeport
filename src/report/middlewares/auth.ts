import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verify } from 'jsonwebtoken';
import config from '../lib/config';
import { getElasticClient } from '../lib/elastic';
import { HTTPError } from '../types/errors';

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
    if (!regRes?.groups?.token) {
      throw new HTTPError(`'${req.method} ${req.originalUrl}' requires auth`, StatusCodes.UNAUTHORIZED);
    }

    const jwt = verify(regRes.groups.token, jwtSecret, { algorithms: ['HS256'] });

    if (typeof jwt === 'string') {
      throw new Error("result can't be string");
    }

    username = jwt.username;
  } catch (error) {
    if (error instanceof HTTPError) {
      res.errorJson(error);
    } else {
      res.errorJson(
        new HTTPError(`JWT malformed: ${(error as Error).message}`, StatusCodes.BAD_REQUEST),
      );
    }
    return;
  }

  try {
    const elastic = await getElasticClient();
    const response = await elastic.security.getUser<Record<string, ElasticUser | undefined>>({
      username,
    });
    const { body: { [username]: user } } = response;

    if (user?.enabled) {
      req.user = { username: user.username, email: user.email, roles: user.roles };

      if (
        // Check if user have enough role to access route
        user.roles.some(
          (role) => role in ROLES_PRIORITIES
            && ROLES_PRIORITIES[role as keyof typeof ROLES_PRIORITIES] >= ROLES_PRIORITIES[minRole],
        )
      ) {
        next();
        return;
      }
    }
    throw new HTTPError(`User '${username}' doesn't have the rights to access to '${req.method} ${req.originalUrl}'`, StatusCodes.FORBIDDEN);
  } catch (error) {
    res.errorJson(error);
  }
};

export default checkRight;
