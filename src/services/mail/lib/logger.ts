import winston from 'winston';

const formatter = (info: winston.Logform.TransformableInfo) => `${info.timestamp}${info.label ? ` [${info.label}]` : ''} ${info.level}: ${info.message} ${(info instanceof Error ? `\n\n${info.stack}\n` : '')}`;

const baseLogger: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV !== 'production' ? 'debug' : 'info'),
  exitOnError: false,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(formatter),
  ),
};

winston.loggers.add('app', {
  ...baseLogger,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.label({ label: 'app' }),
        winston.format.printf(formatter),
      ),
    }),
    new winston.transports.File({
      dirname: '/var/log/ezreeport/mail',
      filename: 'app.log',
    }),
  ],
});

export const appLogger = winston.loggers.get('app');
appLogger.on('error', (err) => appLogger.error(`[winston] ${err.toString()}`));

/**
 * @deprecated use `appLogger` instead
 */
const logger = appLogger;
export default logger;
