import dotenv from 'dotenv-flow';

let config = {
  EZMESURE_TOKEN: 'changeme',
  EZMESURE_INSTITUTION: 'changeme',
  REPORT_API: 'http://localhost:8080',
  SDK_REPORT_SERVICE: 'ezreeport-report',
  SDK_REPORT_CRON: 'generateReports',
  SDK_REPORT_QUEUE: 'generation',
  SDK_REPORT_QUEUE_JOB: 1,
  SDK_REPORT_TASK: 'changeme',
};

const { parsed = {} } = dotenv.config();
config = { ...config, ...parsed };

export default { ...config };
