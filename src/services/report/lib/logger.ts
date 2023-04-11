import { join } from 'path';
import winston from 'winston';
import config from '~/lib/config';

const level = config.get('logLevel');

const formatter = (info: winston.Logform.TransformableInfo) => `${info.timestamp}${info.label ? ` [${info.label}]` : ''} ${info.level}: ${info.message} ${(info.level === 'error' ? `\n\n${info.stack}\n` : '')}`;

const baseLogger: winston.LoggerOptions = {
  level,
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
      filename: join(__dirname, '../logs/app.log'),
    }),
  ],
});

winston.loggers.add('access', {
  ...baseLogger,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.label({ label: 'access' }),
        winston.format.timestamp(),
        winston.format.printf(formatter),
      ),
    }),
    new winston.transports.File({
      filename: join(__dirname, '../logs/access.log'),
    }),
  ],
});

export const appLogger = winston.loggers.get('app');
appLogger.on('error', (err) => appLogger.error(`[winston] ${err.toString()}`));

export const accessLogger = winston.loggers.get('access');
accessLogger.on('error', (err) => appLogger.error(`[winston] ${err.toString()}`));
