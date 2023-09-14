import 'dotenv/config';
import axios from 'axios';

import { randomBytes } from 'node:crypto';

import type { auth } from '@ezpaarse-project/ezreeport-sdk-js';

const ezra = axios.create({
  baseURL: process.env.BASE_URL!,
  headers: {
    'X-Api-Key': process.env.API_KEY!,
  },
});

export const createUser = async (params?: { isAdmin?: boolean, username?: string }) => {
  const { data } = await ezra.put<{ content: auth.User }>(
    `/admin/users/${params?.username ?? randomBytes(6).toString('hex')}`,
    {
      isAdmin: params?.isAdmin || false,
    },
  );

  return data.content;
};

export const deleteUser = async (username: string) => {
  await ezra.delete<{ content: auth.User }>(`/admin/users/${username}`);
};
