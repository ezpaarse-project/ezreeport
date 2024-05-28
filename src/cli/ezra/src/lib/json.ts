import { readFileSync, writeFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

export const readJSONSync = (file: string) => {
  const content = readFileSync(file, 'utf8');
  return JSON.parse(content);
};

export const readJSON = async (file: string) => {
  const content = await readFile(file, 'utf8');
  return JSON.parse(content);
};

export const writeJSONSync = (file: string, data: any, space = 0) => {
  const content = JSON.stringify(data, null, space);
  writeFileSync(file, content);
};

export const writeJSON = async (file: string, data: any, space = 0) => {
  const content = JSON.stringify(data, null, space);
  await writeFile(file, content);
};
