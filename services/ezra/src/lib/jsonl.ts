import { createReadStream, createWriteStream } from 'node:fs';
import readline from 'node:readline';

export const readJSONL = async (file: string) => {
  const rl = readline.createInterface({
    input: createReadStream(file),
    crlfDelay: Infinity,
  });

  const data = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const line of rl) {
    data.push(JSON.parse(line));
  }
  return data;
};

export const writeJSONL = (file: string, data: any[]) => {
  const ws = createWriteStream(file);
  // eslint-disable-next-line no-restricted-syntax
  for (const element of data) {
    ws.write(`${JSON.stringify(element)}\n`);
  }
  ws.end();
};
