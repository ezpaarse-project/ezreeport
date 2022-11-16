import winston from 'winston';
import 'winston-daily-rotate-file';

const formatter = (info: winston.Logform.TransformableInfo) => `${info.timestamp} ${info.level}: ${info.message} ${(info.level === 'error' ? `\n\n${info.stack}\n` : '')}`;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV !== 'production' ? 'debug' : 'info'),
  exitOnError: false,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(formatter),
  ),
  transports: [],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(formatter),
    ),
  }));
} else {
  logger.add(new winston.transports.DailyRotateFile({ filename: 'logs/report_%DATE%.log' }));
}

export default logger;
