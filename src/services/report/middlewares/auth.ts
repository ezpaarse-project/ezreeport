import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verify } from 'jsonwebtoken';
import config from '~/lib/config';
import { elasticGetUser } from '~/lib/elastic';
import { findInstitutionByCreatorOrRole, findInstitutionByIds } from '~/models/institutions';
import { getMaxRole, Roles, RoleValues } from '~/models/roles';
import { HTTPError } from '~/types/errors';

const { secret: jwtSecret } = config.get('ezmesure');

/**
 * Check if current user have the rights scopes.
 *
 * Adds `req.user` with `username` & `email` from Elastic user.
 *
 * @param minRolePriority The minimum role value required.
 *
 * @returns Express middleware
 */
export const checkRight = (
  minRolePriority: RoleValues,
): RequestHandler => async (req, res, next) => {
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
    const { [username]: user } = await elasticGetUser(username);

    if (user?.enabled) {
      const maxRole = getMaxRole(user.roles) ?? ['Not found', -1];

      req.user = {
        username: user.username,
        email: user.email,
        roles: user.roles,
        maxRolePriority: maxRole[1],
      };

      if (maxRole[1] >= minRolePriority) {
        next();
        return;
      }
    }
    throw new HTTPError(`User '${username}' doesn't have the rights to access to '${req.method} ${req.originalUrl}'`, StatusCodes.FORBIDDEN);
  } catch (error) {
    res.errorJson(error);
  }
};

/**
 * Get authed user's institution or given instituion (if allowed)
 *
 * Needs to be called after {@link checkRight}
 */
export const checkInstitution: RequestHandler = async (req, res, next) => {
  if (req.user) {
    if (
      req.user.roles.includes(Roles.SUPER_USER)
      && (typeof req.query.institution === 'string' || typeof req.query.institution === 'undefined')
    ) {
      if (req.query.institution) {
        const instits = await findInstitutionByIds([req.query.institution]);

        // eslint-disable-next-line no-underscore-dangle
        req.user.institution = instits[0]._id.toString();
      }
      next();
    } else {
      const { _id: id } = await findInstitutionByCreatorOrRole(req.user.username, req.user.roles);
      req.user.institution = id.toString();
      next();
    }
  }
};

export default checkRight;
