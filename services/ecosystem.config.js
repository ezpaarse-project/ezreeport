// oxlint-disable no-magic-numbers
const env = (key, defValue) =>
  process.env[`EZREEPORT_${key}`] || process.env[key] || defValue;

const nodeEnv = {
  HEARTBEAT_EXTERNAL_FREQUENCY_MAX: env(
    'HEARTBEAT_EXTERNAL_FREQUENCY_MAX',
    300000
  ),
  HEARTBEAT_EXTERNAL_FREQUENCY_MIN: env(
    'HEARTBEAT_EXTERNAL_FREQUENCY_MIN',
    5000
  ),
  HEARTBEAT_FREQUENCY: env('HEARTBEAT_FREQUENCY', 5000),
  LOG_DIR: env('API_LOG_DIR'),
  LOG_IGNORE: env('LOG_IGNORE', '["hostname"]'),
  LOG_LEVEL: env('LOG_LEVEL', 'info'),
  NODE_ENV: process.env['NODE_ENV'],
  TZ: process.env['TZ'],
};

const elasticEnv = {
  ELASTIC_API_KEY:
    process.env['ELASTIC_API_KEY'] || env('ELASTICSEARCH_API_KEY', ''),
  ELASTIC_PASSWORD:
    process.env['ELASTIC_PASSWORD'] ||
    env('ELASTICSEARCH_PASSWORD', 'changeme'),
  ELASTIC_REQUIRED_STATUS:
    process.env['ELASTIC_REQUIRED_STATUS'] ||
    process.env['ELASTICSEARCH_REQUIRED_STATUS'] ||
    'green',
  ELASTIC_URL:
    process.env['ELASTIC_URL'] ||
    process.env['ELASTICSEARCH_URL'] ||
    'http://elastic:9200',
  ELASTIC_USERNAME:
    process.env['ELASTIC_USERNAME'] || env('ELASTICSEARCH_USERNAME', 'elastic'),
};

const dbEnv = {
  DATABASE_URL: env(
    'DATABASE_URL',
    'postgresql://postgres:changeme@localhost:5432/?schema=public'
  ),
};

const rabbitmqEnv = {
  RABBITMQ_HOST: process.env['RABBITMQ_HOST'] || 'rabbitmq',
  RABBITMQ_PASSWORD: env('RABBITMQ_PASSWORD', 'guest'),
  RABBITMQ_PORT: Number(process.env['RABBITMQ_PORT'] || 5672),
  RABBITMQ_PROTOCOL: process.env['RABBITMQ_PROTOCOL'] || 'amqp',
  RABBITMQ_USERNAME: env('RABBITMQ_USERNAME', 'guest'),
  RABBITMQ_VHOST: env('RABBITMQ_VHOST', '/'),
};

// oxlint-disable-next-line import/no-commonjs unicorn/prefer-module
module.exports = {
  apps: [
    {
      cwd: './api',
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,
        ...dbEnv,
        ...elasticEnv,

        ADMIN_KEY: env('ADMIN_KEY', '00000000-0000-0000-0000-000000000000'),

        ALLOWED_ORIGINS: env('ALLOWED_ORIGINS', '*'),

        ALLOWED_PROXIES: env('ALLOWED_PROXIES', '*'),

        DEFAULT_TEMPLATE_NAME: env('DEFAULT_TEMPLATE_NAME', 'scratch'),

        HTTP_PORT: Number(env('API_HTTP_PORT', 8080)),
      },
      increment_var: 'HTTP_PORT',
      instances: env('APIS_CONCURRENCE', 1),
      interpreter_args: '--enable-source-maps',
      merge_logs: false,
      name: 'api',
      script: 'app.cjs',
    },
    {
      cwd: './worker',
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,
        ...elasticEnv,

        DAYS_TO_LIVE: Number(env('DAYS_TO_LIVE', 7)),

        FETCHER_BANNED_DOMAINS: env('FETCHER_BANNED_DOMAINS', '[]'),

        HTTP_PORT: Number(env('WORKER_HTTP_PORT', 8180)),

        ITERATIONS_TO_LIVE: Number(env('ITERATIONS_TO_LIVE', 4)),
      },
      increment_var: 'HTTP_PORT',
      instances: env('WORKERS_CONCURRENCE', 5),
      interpreter_args: '--enable-source-maps',
      merge_logs: false,
      name: 'worker',
      script: 'app.cjs',
    },
    {
      cwd: './scheduler',
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,
        ...dbEnv,

        DEFAULT_TEMPLATE_DATEFIELD: env(
          'DEFAULT_TEMPLATE_DATEFIELD',
          'datetime'
        ),
        DEFAULT_TEMPLATE_LOCALE: env('DEFAULT_TEMPLATE_LOCALE', 'en'),
        DEFAULT_TEMPLATE_NAME: env('DEFAULT_TEMPLATE_NAME', 'scratch'),
        HTTP_PORT: Number(env('SCHEDULER_HTTP_PORT', 8280)),
        TIMER_GENERATE_REPORT: env('TIMER_GENERATE_REPORT', '0 7 * * * *'),
        TIMER_PURGE_OLD_REPORT: env('TIMER_PURGE_OLD_REPORT', '0 1 * * * *'),
      },
      interpreter_args: '--enable-source-maps',
      merge_logs: false,
      name: 'scheduler',
      script: 'app.cjs',
    },
    {
      cwd: './mail',
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,

        API_HOME: env('API_HOME', 'https://ezmesure.couperin.org'),
        API_URL: env('API_URL', 'http://localhost:8080'),
        EMAIL_ATTEMPTS: env('EMAIL_ATTEMPTS', '5'),
        EMAIL_ATTEMPTS_INTERVAL: env('EMAIL_ATTEMPTS_INTERVAL', '2000'),
        EMAIL_SENDER: env('EMAIL_SENDER', 'ezREEPORT <ezreeport@inist.fr>'),
        EMAIL_SUPPORT_TEAM: env('EMAIL_SUPPORT_TEAM', 'ezteam@couperin.org'),
        HTTP_PORT: Number(env('MAIL_HTTP_PORT', 8380)),
        SMTP_HOST: process.env['SMTP_HOST'] || 'smtp',
        SMTP_IGNORE_TLS: process.env['SMTP_IGNORE_TLS'] || 'true',
        SMTP_PORT: process.env['SMTP_PORT'] || '25',
        SMTP_REJECT_UNAUTHORIZED:
          process.env['SMTP_REJECT_UNAUTHORIZED'] || 'false',
        SMTP_SECURE: process.env['SMTP_SECURE'] || 'false',
      },
      increment_var: 'HTTP_PORT',
      instances: env('MAILS_CONCURRENCE', 1),
      interpreter_args: '--enable-source-maps',
      merge_logs: false,
      name: 'mail',
      script: 'app.cjs',
    },
    {
      cwd: './files',
      env: {
        ...nodeEnv,
        ...rabbitmqEnv,

        HTTP_PORT: Number(env('FILES_HTTP_PORT', 8480)),
        PATHS_DB: env('PATHS_DB', '/data/ezreeport/db'),
        PATHS_REPORT: env('PATHS_REPORT', '/data/ezreeport/reports'),
      },
      increment_var: 'HTTP_PORT',
      instances: env('FILES_CONCURRENCE', 1),
      interpreter_args: '--enable-source-maps',
      merge_logs: false,
      name: 'files',
      script: 'app.cjs',
    },
  ].filter((app) => !env(`DISABLE_${app.name.toUpperCase()}`, 0)),
};
