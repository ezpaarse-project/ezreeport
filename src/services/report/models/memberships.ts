import Joi from 'joi';
import prisma from '~/lib/prisma';
import {
  Access,
  type Prisma,
  type User,
  type Namespace
} from '~/lib/prisma';
import { ArgumentError } from '~/types/errors';

type InputMembership = Pick<Prisma.MembershipCreateInput, 'access'>;

/**
 * Joi schema
 */
const membershipSchema = Joi.object<Prisma.MembershipCreateInput>({
  access: Joi.string().valid(...Object.values(Access)).required(),
});

/**
 * Check if input data is a membership
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
const isValidMembership = (data: unknown): data is InputMembership => {
  const validation = membershipSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

export const addUserToNamespace = async (username: User['username'], namespaceId: Namespace['id'], data: unknown) => {
  if (!isValidMembership(data)) {
    // As validation throws an error, this line shouldn't be called
    return;
  }

  await prisma.$connect();

  await prisma.membership.create({
    data: {
      ...data,
      username,
      namespaceId,
    },
  });

  await prisma.$disconnect();
};

export const updateUserOfNamespace = async (username: User['username'], namespaceId: Namespace['id'], data: unknown) => {
  if (!isValidMembership(data)) {
    // As validation throws an error, this line shouldn't be called
    return;
  }

  await prisma.$connect();

  await prisma.membership.update({
    where: {
      username_namespaceId: {
        username,
        namespaceId,
      },
    },
    data: {
      ...data,
      username,
      namespaceId,
    },
  });

  await prisma.$disconnect();
};

export const removeUserFromNamespace = async (username: User['username'], namespaceId: Namespace['id']) => {
  await prisma.$connect();

  await prisma.membership.delete({
    where: {
      username_namespaceId: {
        username,
        namespaceId,
      },
    },
  });

  await prisma.$disconnect();
};
