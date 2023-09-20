import { randomBytes } from 'node:crypto';

import {
  describe,
  expect,
  it,
} from '@jest/globals';
import { HttpStatusCode } from 'axios';

import { health, errorStatusMatcher } from '../../lib/sdk';

const SERVICE_NAME = 'ezreeport-report';
const NO_SERVICE_NAME = randomBytes(6).toString('hex');

describe(
  '[health]: Test read features',
  () => {
    describe(
      'health.getAllConnectedServices()',
      () => {
        it(
          'Should check all connected services',
          async () => {
            const res = await health.getAllConnectedServices();

            expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

            const data = res.content;
            expect(data.current).toBe(SERVICE_NAME);
            expect(data.currentVersion).toBeDefined();
            expect(data.services).toBeInstanceOf(Array);

            const service = data.services[0];
            expect(service).toBeDefined();
          },
        );
      },
    );

    describe(
      'health.checkAllConnectedService()',
      () => {
        it(
          'Should check all connected services',
          async () => {
            const res = await health.checkAllConnectedService();

            expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

            expect(res.content).toBeInstanceOf(Array);
            const result = res.content[0];
            expect(result.name).toBeDefined();
            expect(result.status).toBeDefined();

            if (result.status) {
              expect(result.statusCode).toBeDefined();
              expect(result.elapsedTime).toBeDefined();
            } else {
              expect(result.error).toBeDefined();
            }
          },
        );
      },
    );

    describe(
      'health.checkConnectedService(service)',
      () => {
        it(
          `Should check service [${SERVICE_NAME}]`,
          async () => {
            const res = await health.checkConnectedService(SERVICE_NAME);

            expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

            const result = res.content;
            expect(result.name).toBe(SERVICE_NAME);
            expect(result.status).toBeDefined();

            if (result.status) {
              expect(result.statusCode).toBeDefined();
              expect(result.elapsedTime).toBeDefined();
            } else {
              expect(result.error).toBeDefined();
            }
          },
        );

        it(
          "Service [<random>] shouldn't be found",
          async () => {
            // Make test fails if call is successful
            expect.assertions(2);

            try {
              await health.checkConnectedService(NO_SERVICE_NAME);
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
      },
    );

    describe(
      'health.checkCurrentService()',
      () => {
        it(
          'Should check self',
          async () => {
            const res = await health.checkCurrentService();

            expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

            const result = res.content;
            expect(result.name).toBe(SERVICE_NAME);
            expect(result.status).toBe(true);

            if (result.status) {
              expect(result.statusCode).toBe(200);
              expect(result.elapsedTime).toBeLessThanOrEqual(1);
            }
          },
        );
      },
    );
  },
);
