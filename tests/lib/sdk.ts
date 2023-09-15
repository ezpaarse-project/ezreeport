import { HttpStatusCode } from 'axios';
import { setup } from '@ezpaarse-project/ezreeport-sdk-js';

setup.setURL(process.env.BASE_URL!);

export const errorStatusMatcher = (status: HttpStatusCode) => new RegExp(`\\S+ \\(${status}\\)`);

export * from '@ezpaarse-project/ezreeport-sdk-js';
