import winston, { format } from 'winston';
import util from 'util';

type Format = ReturnType<typeof format.cli>;

function utilFormatter(): Format {
  return {
    transform(info) {
      const args = info[Symbol.for('splat')];
      if (args) {
        info.message = util.format(info.message, ...args);
      }
      return info;
    },
  };
}

export const logger = winston.createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        utilFormatter(),
        format.colorize(),
        format.printf(
          ({ level, message, label, timestamp }) =>
            `${timestamp} ${label || '-'} ${level}: ${message}`
        )
      ),
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  ],
});
