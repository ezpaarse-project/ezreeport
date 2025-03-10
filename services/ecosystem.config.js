const env = (key, defValue) => process.env[key] || defValue;

const logEnv = {
  LOG_LEVEL: env('LOG_LEVEL', 'info'),
  LOG_DIR: env('API_LOG_DIR'),
  LOG_IGNORE: env('LOG_IGNORE', '["hostname"]'),
};

module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './report',
      interpreter: 'tsx',
      script: './src/app.ts',
      merge_logs: false,
      log_type: 'json',
      increment_var: 'HTTP_PORT',
      env: {
        NODE_ENV: env('NODE_ENV'),
        ...logEnv,

        HTTP_PORT: +env('HTTP_PORT', 8080),
        ALLOWED_ORIGINS: env('ALLOWED_ORIGINS', '*'),
        ADMIN_KEY: env('ADMIN_KEY', '00000000-0000-0000-0000-000000000000'),
        DATABASE_URL: env('DATABASE_URL', 'postgresql://postgres:changeme@localhost:5432/?schema=public'),
      },
    },
    {
      name: 'worker',
      cwd: './worker',
      interpreter: 'tsx',
      script: './src/app.ts',
      merge_logs: false,
      log_type: 'json',
      instances: env('WORKERS_CONCURRENCE', 5),
      increment_var: 'HTTP_PORT',
      env: {
        NODE_ENV: env('NODE_ENV'),
        ...logEnv,

        ELASTIC_URL: env('ELASTIC_URL', 'http://elastic:9200'),
        ELASTIC_USERNAME: env('ELASTIC_USERNAME', 'elastic'),
        ELASTIC_PASSWORD: env('ELASTIC_PASSWORD', 'changeme'),
        ELASTIC_API_KEY: env('ELASTIC_API_KEY', ''),
        ELASTIC_REQUIRED_STATUS: env('ELASTIC_REQUIRED_STATUS', 'green'),
        ELASTIC_MAX_TRIES: +env('ELASTIC_MAX_TRIES', 10),

        FETCHER_BANNED_DOMAINS: env('FETCHER_BANNED_DOMAINS', '[]'),

        ITERATIONS_TO_LIVE: +env('ITERATIONS_TO_LIVE', 4),
        DAYS_TO_LIVE: +env('DAYS_TO_LIVE', 7),

        EMAIL_DEV_TEAM: env('EMAIL_DEV_TEAM', 'ezteam-dev@couperin.org'),

        HTTP_PORT: +env('HTTP_PORT', 8180),
      },
    },
    {
      name: 'scheduler',
      cwd: './scheduler',
      interpreter: 'tsx',
      script: './src/app.ts',
      merge_logs: false,
      log_type: 'json',
      env: {
        NODE_ENV: env('NODE_ENV'),
        ...logEnv,

        TIMER_GENERATE_REPORT: env('TIMER_GENERATE_REPORT', '0 1 * * * *'),
        TIMER_PURGE_OLD_REPORT: env('TIMER_PURGE_OLD_REPORT', '0 0 * * * *'),

        HTTP_PORT: +env('HTTP_PORT', 8280),
      },
    },
    {
      name: 'mail',
      cwd: './mail',
      interpreter: 'tsx',
      script: './src/app.ts',
      merge_logs: false,
      log_type: 'json',
      increment_var: 'HTTP_PORT',
      env: {
        NODE_ENV: env('NODE_ENV'),
        ...logEnv,

        SMTP_HOST: env('SMTP_HOST', 'smtp'),
        SMTP_PORT: env('SMTP_PORT', '25'),
        SMTP_SECURE: env('SMTP_SECURE', 'false'),
        SMTP_IGNORE_TLS: env('SMTP_IGNORE_TLS', 'true'),
        SMTP_REJECT_UNAUTHORIZED: env('SMTP_REJECT_UNAUTHORIZED', 'false'),

        EMAIL_SENDER: env('EMAIL_SENDER', 'ezteam@couperin.org'),
        EMAIL_SUPPORT_TEAM: env('EMAIL_SUPPORT_TEAM', 'ezteam@couperin.org'),
        EMAIL_ATTEMPTS: env('EMAIL_ATTEMPTS', '5'),
        EMAIL_ATTEMPTS_INTERVAL: env('EMAIL_ATTEMPTS_INTERVAL', '2000'),

        HTTP_PORT: +env('HTTP_PORT', 8380),
        API_URL: env('API_URL', 'http://localhost:8080'),
      },
    },
  ].filter((app) => !env(`DISABLE_${app.name.toUpperCase()}`, 0)),
};
