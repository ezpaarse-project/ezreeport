import 'dotenv/config';
import { setup } from '@ezpaarse-project/ezreeport-sdk-js';

setup.setURL(process.env.BASE_URL!);

export * from '@ezpaarse-project/ezreeport-sdk-js';
