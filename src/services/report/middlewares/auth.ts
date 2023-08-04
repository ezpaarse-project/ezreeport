import type { Request, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import config from '~/lib/config';

import { getAccessValue, Access } from '~/models/access';
import { getAllNamespaces } from '~/models/namespaces';
import { FullUser, getUserByToken } from '~/models/users';

import { HTTPError } from '~/types/errors';

const { adminKey } = config;

export const requireUser: RequestHandler = (req, res, next) => {
  // Getting token
  const header = req.headers.authorization ?? '';
  const regexRes = /Bearer (?<token>.*)/i.exec(header);
  // If no username given/found
  if (!regexRes?.groups?.token) {
    res.errorJson(new HTTPError(`'${req.method} ${req.originalUrl}' requires user`, StatusCodes.UNAUTHORIZED));
    return;
  }

  getUserByToken(regexRes.groups.token).then((user) => {
    if (!user) {
      res.errorJson(new HTTPError('User not found', StatusCodes.UNAUTHORIZED));
      return;
    }

    req.user = user;
    next();
  });
};

export const requireAPIKey: RequestHandler = (req, res, next) => {
  // Getting token
  const token = req.headers['x-api-key'] ?? '';
  // If no username given/found
  if (!token) {
    res.errorJson(new HTTPError(`'${req.method} ${req.originalUrl}' requires API Key`, StatusCodes.UNAUTHORIZED));
    return;
  }

  if (adminKey !== token) {
    res.errorJson(new HTTPError('Token is not valid', StatusCodes.UNAUTHORIZED));
    return;
  }

  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user?.isAdmin) {
    res.errorJson(new HTTPError(`'${req.method} ${req.originalUrl}' requires to be admin`, StatusCodes.UNAUTHORIZED));
    return;
  }

  next();
};

const getPossibleNamespaces = async (
  req: Request,
  minAccess: Access,
): Promise<FullUser['memberships']> => {
  const minAccessValue = getAccessValue(minAccess);

  if (!req.user) {
    return [];
  }

  if (req.user.isAdmin) {
    const { createdAt, updatedAt } = req.user;
    const namespaces = await getAllNamespaces();

    // To avoid issues, return a fake namespace
    if (namespaces.length < 1) {
      namespaces.push({
        id: '_',
        name: '_',
        logoId: '',
        createdAt: new Date('a'),
        updatedAt: new Date('a'),
        _count: {
          tasks: 0,
          memberships: 0,
        },
      });
    }

    return namespaces.map((namespace) => ({
      access: Access.SUPER_USER,
      createdAt,
      updatedAt,
      namespace,
    }));
  }

  return req.user.memberships.filter(
    ({ access }) => getAccessValue(access) >= minAccessValue,
  );
};

export const requireNamespace = (minAccess: Access): RequestHandler => (req, res, next) => {
  getPossibleNamespaces(req, minAccess).then((possibleNamespaces) => {
    // Get ids wanted by user
    const { namespaces: wantedIds } = req.query;
    let ids = new Set(possibleNamespaces.map(({ namespace: { id } }) => id) ?? []);

    if (ids.size <= 0) {
      req.namespaceIds = [];
      req.namespaces = [];
      next();
      return;
    }

    if (wantedIds) {
      if (!Array.isArray(wantedIds)) {
        res.errorJson(new HTTPError('Given namespaces ids are not an array', StatusCodes.BAD_REQUEST));
        return;
      }

      ids = new Set(
        wantedIds
          .map((id) => id.toString())
          .filter((id) => ids.has(id)),
      );
    }

    if (ids.size <= 0) {
      res.errorJson(new HTTPError("Can't find your namespace(s)", StatusCodes.BAD_REQUEST));
      return;
    }

    req.namespaceIds = [...ids];
    req.namespaces = possibleNamespaces.filter(({ namespace: { id } }) => ids.has(id));
    next();
  });
};
