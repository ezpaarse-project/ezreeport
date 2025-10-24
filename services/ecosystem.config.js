const env = (key, defValue) => process.env[key] || defValue;

const nodeEnv = {
  NODE_ENV: env('NODE_ENV'),
  TZ: env('TZ'),

  HEARTBEAT_FREQUENCY: env('HEARTBEAT_FREQUENCY', 5000),
  HEARTBEAT_EXTERNAL_FREQUENCY_MIN: env(
    'HEARTBEAT_EXTERNAL_FREQUENCY_MIN',
    5000
  ),
  HEARTBEAT_EXTERNAL_FREQUENCY_MAX: env(
    'HEARTBEAT_EXTERNAL_FREQUENCY_MAX',
    300000
  ),

  LOG_LEVEL: env('LOG_LEVEL', 'info'),
  LOG_DIR: env('API_LOG_DIR'),
  LOG_IGNORE: env('LOG_IGNORE', '["hostname"]'),
};

const elasticEnv = {
  ELASTIC_URL: env('ELASTIC_URL', 'http://elastic:9200'),
  ELASTIC_USERNAME: env('ELASTIC_USERNAME', 'elastic'),
  ELASTIC_PASSWORD: env('ELASTIC_PASSWORD', 'changeme'),
  ELASTIC_API_KEY: env('ELASTIC_API_KEY', ''),
  ELASTIC_REQUIRED_STATUS: env('ELASTIC_REQUIRED_STATUS', 'green'),
};

const dbEnv = {
  DATABASE_URL: env(
    'DATABASE_URL',
    'postgresql://postgres:changeme@localhost:5432/?schema=public'
  ),
};

const rabbitmqEnv = {
  RABBITMQ_PROTOCOL: env('RABBITMQ_PROTOCOL', 'amqp'),
  RABBITMQ_HOST: env('RABBITMQ_HOST', 'rabbitmq'),
  RABBITMQ_PORT: +env('RABBITMQ_PORT', 5672),
  RABBITMQ_VHOST: env('RABBITMQ_VHOST', '/'),
  RABBITMQ_USERNAME: env('RABBITMQ_USERNAME', 'guest'),
  RABBITMQ_PASSWORD: env('RABBITMQ_PASSWORD', 'guest'),
};

// oxlint-disable-next-line import/no-commonjs
module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './report',
      interpreter: 'tsx',
      script: './src/app.ts',
      merge_logs: false,
      instances: env('APIS_CONCURRENCE', 1),
      increment_var: 'HTTP_PORT',
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,
        ...dbEnv,
        ...elasticEnv,

        HTTP_PORT: +env('API_HTTP_PORT', 8080),
        ALLOWED_ORIGINS: env('ALLOWED_ORIGINS', '*'),
        ALLOWED_PROXIES: env('ALLOWED_PROXIES', '*'),
        ADMIN_KEY: env('ADMIN_KEY', '00000000-0000-0000-0000-000000000000'),
        DEFAULT_TEMPLATE_NAME: env('DEFAULT_TEMPLATE_NAME', 'scratch'),
        DEFAULT_TEMPLATE_DATEFIELD: env(
          'DEFAULT_TEMPLATE_DATEFIELD',
          'datetime'
        ),
      },
    },
    {
      name: 'worker',
      cwd: './worker',
      interpreter: 'tsx',
      script: './src/app.ts',
      merge_logs: false,
      instances: env('WORKERS_CONCURRENCE', 5),
      increment_var: 'HTTP_PORT',
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,
        ...elasticEnv,

        FETCHER_BANNED_DOMAINS: env('FETCHER_BANNED_DOMAINS', '[]'),

        ITERATIONS_TO_LIVE: +env('ITERATIONS_TO_LIVE', 4),
        DAYS_TO_LIVE: +env('DAYS_TO_LIVE', 7),

        EMAIL_DEV_TEAM: env('EMAIL_DEV_TEAM', 'ezteam-dev@couperin.org'),

        HTTP_PORT: +env('WORKER_HTTP_PORT', 8180),
      },
    },
    {
      name: 'scheduler',
      cwd: './scheduler',
      interpreter: 'tsx',
      script: './src/app.ts',
      merge_logs: false,
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,
        ...dbEnv,

        TIMER_GENERATE_REPORT: env('TIMER_GENERATE_REPORT', '0 7 * * * *'),
        TIMER_PURGE_OLD_REPORT: env('TIMER_PURGE_OLD_REPORT', '0 1 * * * *'),

        HTTP_PORT: +env('SCHEDULER_HTTP_PORT', 8280),
      },
    },
    {
      name: 'mail',
      cwd: './mail',
      interpreter: 'tsx',
      script: './src/app.ts',
      merge_logs: false,
      instances: env('MAILS_CONCURRENCE', 1),
      increment_var: 'HTTP_PORT',
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,

        SMTP_HOST: env('SMTP_HOST', 'smtp'),
        SMTP_PORT: env('SMTP_PORT', '25'),
        SMTP_SECURE: env('SMTP_SECURE', 'false'),
        SMTP_IGNORE_TLS: env('SMTP_IGNORE_TLS', 'true'),
        SMTP_REJECT_UNAUTHORIZED: env('SMTP_REJECT_UNAUTHORIZED', 'false'),

        EMAIL_SENDER: env('EMAIL_SENDER', 'ezteam@couperin.org'),
        EMAIL_SUPPORT_TEAM: env('EMAIL_SUPPORT_TEAM', 'ezteam@couperin.org'),
        EMAIL_ATTEMPTS: env('EMAIL_ATTEMPTS', '5'),
        EMAIL_ATTEMPTS_INTERVAL: env('EMAIL_ATTEMPTS_INTERVAL', '2000'),

        HTTP_PORT: +env('MAIL_HTTP_PORT', 8380),
        API_URL: env('API_URL', 'http://localhost:8080'),
      },
    },
    {
      name: 'files',
      cwd: './files',
      interpreter: 'tsx',
      script: './src/app.ts',
      merge_logs: false,
      instances: env('FILES_CONCURRENCE', 1),
      increment_var: 'HTTP_PORT',
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,

        PATHS_REPORT: env('PATHS_REPORT', '/data/ezreeport/reports'),
        PATHS_DB: env('PATHS_DB', '/data/ezreeport/db'),

        HTTP_PORT: +env('FILES_HTTP_PORT', 8480),
      },
    },
  ].filter((app) => !env(`DISABLE_${app.name.toUpperCase()}`, 0)),
};
