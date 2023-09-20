import {
  describe,
  beforeAll,
  expect,
  it,
  afterAll,
} from '@jest/globals';
import { HttpStatusCode } from 'axios';

import { setup, auth, errorStatusMatcher } from '../../lib/sdk';
import { createUser, deleteUser } from '../../lib/admin';

import permissions from './permissions.json';

describe(
  '[auth]: Test read features',
  () => {
    describe(
      'As admin',
      () => {
        let username = '';
        let token = '';

        beforeAll(async () => {
          // Create an user for this test suite
          ({ token, username } = await createUser({ isAdmin: true }));
          setup.login(token);
        });

        describe(
          'auth.getCurrentUser()',
          () => {
            it(
              'Should get user info',
              async () => {
                const res = await auth.getCurrentUser();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const user = res.content;
                expect(user.username).toBe(username);
                expect(user.token).toBe(token);
                expect(user.isAdmin).toBe(true);
                expect(user.createdAt).toBeDefined();
                expect(user.memberships).toBeDefined();
              },
            );
          },
        );

        describe(
          'auth.getCurrentNamespaces()',
          () => {
            it(
              'Should get namespaces',
              async () => {
                const res = await auth.getCurrentNamespaces();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);
                expect(res.content).toBeInstanceOf(Array);

                const namespace = res.content[0];
                expect(namespace.id).toBeDefined();
                expect(namespace.name).toBeDefined();
                expect(namespace.createdAt).toBeDefined();
              },
            );
          },
        );

        describe(
          'auth.getCurrentPermissions()',
          () => {
            it(
              'Should get permissions',
              async () => {
                const res = await auth.getCurrentPermissions();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const generalPermissions = res.content.general;
                expect(generalPermissions).toBeDefined();
                // eslint-disable-next-line no-restricted-syntax
                for (const [name] of Object.entries(permissions.general)) {
                  expect(generalPermissions).toHaveProperty(name, true);
                }

                const namespacesPermissions = Object.values(res.content.namespaces)[0];
                expect(namespacesPermissions).toBeDefined();
                // eslint-disable-next-line no-restricted-syntax
                for (const name of permissions.namespaces) {
                  expect(namespacesPermissions).toHaveProperty(name, true);
                }
              },
            );
          },
        );

        afterAll(async () => {
          // Delete temp user
          await deleteUser(username);
        });
      },
    );

    describe(
      'As user',
      () => {
        let username = '';
        let token = '';

        beforeAll(async () => {
          // Create an user for this test suite
          ({ token, username } = await createUser());
          setup.login(token);
        });

        describe(
          'auth.getCurrentUser()',
          () => {
            it(
              'Should get user info',
              async () => {
                const res = await auth.getCurrentUser();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const user = res.content;
                expect(user.username).toBe(username);
                expect(user.token).toBe(token);
                expect(user.isAdmin).toBe(false);
                expect(user.createdAt).toBeDefined();
                expect(user.memberships).toBeDefined();
              },
            );
          },
        );

        describe(
          'auth.getCurrentNamespaces()',
          () => {
            it(
              'Should get namespaces',
              async () => {
                const res = await auth.getCurrentNamespaces();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);
                expect(res.content).toBeInstanceOf(Array);

                const namespace = res.content[0];
                if (namespace) {
                  expect(namespace.id).toBeDefined();
                  expect(namespace.name).toBeDefined();
                  expect(namespace.createdAt).toBeDefined();
                }
              },
            );
          },
        );

        describe(
          'auth.getCurrentPermissions()',
          () => {
            it(
              'Should get permissions',
              async () => {
                const res = await auth.getCurrentPermissions();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const generalPermissions = res.content.general;
                expect(generalPermissions).toBeDefined();
                // eslint-disable-next-line no-restricted-syntax
                for (const [name, requireAdmin] of Object.entries(permissions.general)) {
                  expect(generalPermissions).toHaveProperty(name, !requireAdmin);
                }
              },
            );
          },
        );

        afterAll(async () => {
          // Delete temp user
          await deleteUser(username);
        });
      },
    );

    describe(
      'As not logged in',
      () => {
        describe(
          'auth.getCurrentUser()',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await auth.getCurrentUser();
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Unauthorized),
                    );
                  }
                }
              },
            );
          },
        );

        describe(
          'auth.getCurrentNamespaces()',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await auth.getCurrentNamespaces();
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Unauthorized),
                    );
                  }
                }
              },
            );
          },
        );

        describe(
          'auth.getCurrentPermissions()',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await auth.getCurrentPermissions();
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Unauthorized),
                    );
                  }
                }
              },
            );
          },
        );
      },
    );
  },
);
