import { randomBytes } from 'node:crypto';

import {
  describe,
  beforeAll,
  expect,
  it,
  afterAll,
} from '@jest/globals';
import { HttpStatusCode } from 'axios';

import { setup, queues, errorStatusMatcher } from '../../lib/sdk';
import { createUser, deleteUser } from '../../lib/admin';

const QUEUE_NAME = 'generation';
const NO_QUEUE_NAME = randomBytes(6).toString('hex');

const searchForIdToRetry = async (reverse = false) => {
  let jobId: queues.FullJob<any, any>['id'] | undefined;
  let previous: queues.FullJob<any, any>['id'] | undefined;
  while (jobId == null) {
    // eslint-disable-next-line no-await-in-loop
    const { content: list, meta } = await queues.getQueueJobs(
      QUEUE_NAME,
      { previous },
    );
    previous = meta.lastId as queues.FullJob<any, any>['id'];
    if (list.length === 0) {
      throw new Error('No retry-able job found');
    }
    const allowedStatus = new Set<string>(
      ['completed', 'failed'] satisfies queues.FullJob<any, any>['status'][],
    );
    jobId = list.find(({ status }) => {
      const isStatusOk = allowedStatus.has(status);
      return reverse ? !isStatusOk : isStatusOk;
    })?.id;
  }
  return jobId;
};

describe(
  '[queues]: Test start/stop/force features',
  () => {
    describe(
      'As admin',
      () => {
        let username = '';

        beforeAll(async () => {
          // Create an admin for this test suite
          const { token, username: name } = await createUser({ isAdmin: true });
          username = name;
          setup.login(token);
        });

        describe(
          'queues.updateQueue(queue)',
          () => {
            it(
              `Should pause queue [${QUEUE_NAME}]`,
              async () => {
                const res = await queues.updateQueue({
                  name: QUEUE_NAME,
                  status: 'paused',
                });

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const queue = res.content;
                expect(queue.name).toBe(QUEUE_NAME);
                expect(queue.status).toBe('paused');
              },
            );

            it(
              `Should resume queue [${QUEUE_NAME}]`,
              async () => {
                const res = await queues.updateQueue({
                  name: QUEUE_NAME,
                  status: 'active',
                });

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const queue = res.content;
                expect(queue.name).toBe(QUEUE_NAME);
                expect(queue.status).toBe('active');
              },
            );

            it(
              'Queue [<random>] shouldn\'t be found',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.updateQueue({ name: NO_QUEUE_NAME });
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.NotFound),
                    );
                  }
                }
              },
            );

            afterAll(async () => {
              // Resetting the queue
              await queues.updateQueue({
                name: QUEUE_NAME,
                status: 'active',
              });
            });
          },
        );

        describe(
          'queues.retryJob(queueOrName, jobIdOrName)',
          () => {
            it(
              `Should retry first failed job of queue [${QUEUE_NAME}]`,
              async () => {
                const jobId = await searchForIdToRetry();
                const res = await queues.retryJob(QUEUE_NAME, jobId);

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const job = res.content;
                expect(job.id).toBeDefined();
                expect(job.status).toBeDefined();
                expect(job.progress).toBeDefined();
                expect(job.data).toBeDefined();
                expect(job.added).toBeDefined();
                expect(job.attempts).toBeDefined();
              },
            );

            it(
              'Queue [<random>] shouldn\'t be found',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(NO_QUEUE_NAME, NO_QUEUE_NAME);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.NotFound),
                    );
                  }
                }
              },
            );

            it(
              `Job [<random>] in queue [${QUEUE_NAME}] shouldn't be found`,
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(QUEUE_NAME, NO_QUEUE_NAME);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.NotFound),
                    );
                  }
                }
              },
            );

            it(
              `First non completed job in queue [${QUEUE_NAME}] shouldn't be retry-able`,
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                // Search for non retry-able job
                const jobId = await searchForIdToRetry(true);

                try {
                  await queues.retryJob(QUEUE_NAME, jobId);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Conflict),
                    );
                  }
                }
              },
            );
          },
        );

        afterAll(async () => {
          // Delete temp admin
          await deleteUser(username);
          setup.logout();
        });
      },
    );

    describe(
      'As user',
      () => {
        let user = { username: '', token: '' };
        let admin = { username: '', token: '' };
        let queue: queues.Queue | undefined;

        beforeAll(async () => {
          // Create an admin for this test suite
          (admin = await createUser({ isAdmin: true }));

          // Get queue
          setup.login(admin.token);

          // Create an user for this test suite
          (user = await createUser());
          ({ content: queue } = await queues.getQueue(QUEUE_NAME));
        });

        describe(
          'queues.updateQueue(queue)',
          () => {
            it(
              'Should throw a permission error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  setup.login(user.token);
                  await queues.updateQueue({ name: QUEUE_NAME });
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Forbidden),
                    );
                  }
                }
              },
            );

            it(
              `Queue [${QUEUE_NAME}] shouldn't be modified`,
              async () => {
                setup.login(admin.token);
                const { content: newQueue } = await queues.getQueue(QUEUE_NAME);
                setup.logout();

                expect(newQueue).toStrictEqual(queue);
              },
            );

            it(
              'Should throw a permission error even if queue [<random>] doesn\'t exist',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  setup.login(user.token);
                  await queues.updateQueue({ name: NO_QUEUE_NAME });
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Forbidden),
                    );
                  }
                }
              },
            );
          },
        );

        describe(
          'queues.retryJob(queueOrName, jobIdOrName)',
          () => {
            let jobId: queues.Job<any>['id'];

            beforeAll(async () => {
              // Get first job
              setup.login(admin.token);
              jobId = await searchForIdToRetry();

              // TODO: add membership

              setup.login(user.token);
            });

            // it(
            //   `Should get first allowed job of queue [${QUEUE_NAME}] by name`,
            //   async () => {
            //     const res = await queues.retryJob(QUEUE_NAME, jobId);

            //     expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

            //     const job = res.content;
            //     expect(job.id).toBe(QUEUE_NAME);
            //     expect(job.status).toBeDefined();
            //     expect(job.progress).toBeDefined();
            //     expect(job.data).toBeDefined();
            //     expect(job.added).toBeDefined();
            //     expect(job.attempts).toBeDefined();
            //   },
            // );

            it(
              `First disallowed job of queue [${QUEUE_NAME}] shouldn't be accessible`,
              async () => {
                // TODO: remove membership

                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.retryJob(QUEUE_NAME, jobId);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Forbidden),
                    );
                  }
                }
              },
            );

            it(
              'Queue [<random>] shouldn\'t be found',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(NO_QUEUE_NAME, NO_QUEUE_NAME);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.NotFound),
                    );
                  }
                }
              },
            );

            it(
              `Job [<random>] in queue [${QUEUE_NAME}] shouldn't be found`,
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(QUEUE_NAME, NO_QUEUE_NAME);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.NotFound),
                    );
                  }
                }
              },
            );

            it(
              `First non completed job in queue [${QUEUE_NAME}] shouldn't be retry-able`,
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                // Search for non retry-able job
                setup.login(admin.token);
                jobId = await searchForIdToRetry(true);
                setup.login(user.token);

                try {
                  await queues.retryJob(QUEUE_NAME, jobId);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Conflict),
                    );
                  }
                }
              },
            );
          },
        );

        afterAll(async () => {
          // Delete temp admin
          await deleteUser(admin.username);
          // Delete temp user
          await deleteUser(user.username);
        });
      },
    );

    describe(
      'As not logged in',
      () => {
        let username = '';
        let adminToken = '';
        let job: queues.FullJob<any, any>;

        beforeAll(async () => {
          // Create an admin for this test suite
          ({ token: adminToken, username } = await createUser({ isAdmin: true }));

          setup.login(adminToken);
          const jobId = await searchForIdToRetry();
          ({ content: job } = await queues.getJob(QUEUE_NAME, jobId));
        });

        describe(
          'queues.retryJob(queueOrName, jobIdOrName)',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  setup.logout();
                  await queues.retryJob(QUEUE_NAME, job.id);
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

            it(
              `Job [<jobId>] on queue [${QUEUE_NAME}] shouldn't be modified`,
              async () => {
                setup.login(adminToken);
                const { content: newJob } = await queues.getJob(QUEUE_NAME, job.id);
                setup.logout();

                expect(newJob).toStrictEqual(job);
              },
            );
          },
        );

        afterAll(async () => {
          // Delete temp admin
          await deleteUser(username);
        });
      },
    );
  },
);
