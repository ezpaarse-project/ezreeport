import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getElasticClient } from '../lib/elastic';
import { CustomError } from '../types/errors';

/**
 * Roles names
 */
export enum Roles {
  READ_WRITE = 'ez-reporting',
  READ = 'ez-reporting-read-only',
}

/**
 * Roles priority, higher means more perms
 */
const ROLES_PRIORITIES = {
  'ez-reporting': 2,
  'ez-reporting-read-only': 1,
} as const;

/**
 * Check if current user have the rights scopes
 *
 * @param minRole The minimum role required.
 *
 * @returns Express middleware
 */
const checkRight = (minRole: Roles): RequestHandler => async (req, res, next) => {
  try {
    // TODO: maybe more secure
    const token = req.headers.authorization ?? '';
    const regRes = /Username (?<username>.*)/i.exec(token);
    // If no username given/found
    if (!regRes || !regRes.groups || !regRes.groups.username) {
      throw new CustomError(`'${req.method} ${req.url}' requires auth`, StatusCodes.UNAUTHORIZED);
    }

    const username = Buffer.from(regRes.groups.username, 'base64').toString();

    const elastic = await getElasticClient();
    const response = await elastic.security.getUser<Record<string, ElasticUser | undefined>>({
      username,
    });
    const { body: { [username]: user } } = response;

    if (user) {
      // Calculating higher role of user (kinda weird tbh)
      const maxRole = user.roles.reduce((max, role) => {
        const r = role as keyof typeof ROLES_PRIORITIES;
        if (role.startsWith('ez-reporting') && ROLES_PRIORITIES[r] > max) {
          return ROLES_PRIORITIES[r];
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
