import chai from 'chai';
import { auth } from 'ezreeport-sdk-js';
import type { JsonSchema } from '~/lib/jsonSchema';

const { expect } = chai;

const userSchema: JsonSchema<auth.User> = {
  type: 'object',
  required: ['username', 'email', 'roles', 'maxRolePriority'],
  properties: {
    username: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    roles: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string',
      },
    },
    maxRolePriority: {
      type: 'number',
    },
    institution: {
      type: 'string',
    },
  },
};

export default () => {
  describe('getCurrentUser()', () => {
    let res: ReturnType<typeof auth.getCurrentUser> | undefined;

    it('should return user', async () => {
      if (!res) {
        res = auth.getCurrentUser();
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema(userSchema);
    });
  });

  describe('getPermissions()', () => {
    let res: ReturnType<typeof auth.getPermissions> | undefined;

    it('should return permissions', async () => {
      if (!res) {
        res = auth.getPermissions();
      }
      const { content } = await res;

      expect(Object.values(content)).to.satisfies(
        (entries: unknown[]) => entries.every(
          (value) => typeof value === 'boolean',
        ),
      );
    });
  });
};
