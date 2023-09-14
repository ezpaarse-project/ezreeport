import {
  describe,
  beforeAll,
  expect,
  it,
} from '@jest/globals';

import { setup, crons } from '../../lib/sdk';
import { createUser } from '../../lib/admin';

describe(
  '[crons]: Test read features',
  () => {
    describe(
      'As admin',
      () => {
        beforeAll(async () => {
          // Create an admin for this test suite
          const { token } = await createUser({ isAdmin: true });
          setup.login(token);
        });

        describe(
          'crons.getAllCrons()',
          () => {
            it(
              'Should get all crons',
              async () => {
                const res = await crons.getAllCrons();

                expect(res).toHaveProperty('status.code', 200);

                const cron = res.content[0];
                expect(cron.name).not.toBeNull();
                // expect(cron.running).toBe(true);
              },
            );
          },
        );
      },
    );
  },
);
