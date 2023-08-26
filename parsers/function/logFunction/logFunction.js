const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log') }),
  ],
});

function logError(error, filename) {
  const logDir = path.join(__dirname, '../../logs');
  const logFilePath = path.join(logDir, `${filename}.log`);
  logger.add(new winston.transports.File({ filename: logFilePath }));
  logger.error(`${filename}: ${error.stack}`);
}

module.exports = {
  logError,
};