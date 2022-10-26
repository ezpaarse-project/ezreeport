import dotenv from 'dotenv-flow';

let config = {
  EZMESURE_TOKEN: 'changeme',
  REPORT_API: 'http://localhost:8080',
};

const { parsed = {} } = dotenv.config();
config = { ...config, ...parsed };

export default { ...config };
