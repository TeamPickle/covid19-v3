import { Request, Response } from 'express';
import morgan from 'morgan';

const colors = {
  red: '\x1B[41m',
  green: '\x1B[42m\x1B[30m',
  yellow: '\x1B[43m\x1B[30m',
  cyan: '\x1B[46m\x1B[30m',
  white: '\x1B[47m\x1B[30m',
  endColor: '\x1B[0m',
};

export default morgan.token<Request, Response>(
  'remote-addr',
  (req) => (
    (req.headers['x-real-ip'] as string)
    || (req.headers['x-forwarded-for'] as string)
    || (req.connection.remoteAddress as string)
  ),
).token(
  'method',
  (req) => {
    const color = (
      req.method === 'GET' ? colors.green // eslint-disable-line no-nested-ternary
        : req.method === 'POST' ? colors.cyan // eslint-disable-line no-nested-ternary
          : req.method === 'PUT' ? colors.yellow // eslint-disable-line no-nested-ternary
            : req.method === 'DELETE' ? colors.red
              : colors.white
    );
    return `${color}${req.method}${colors.endColor}`;
  },
).token(
  'status',
  (_, res) => {
    const color = (
      res.statusCode < 300 ? colors.green // eslint-disable-line no-nested-ternary
        : res.statusCode < 400 ? colors.cyan // eslint-disable-line no-nested-ternary
          : res.statusCode < 500 ? colors.yellow // eslint-disable-line no-nested-ternary
            : res.statusCode < 600 ? colors.red
              : colors.white
    );
    return `${color}${res.statusCode}${colors.endColor}`;
  },
)(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :response-time ms :res[content-length]',
);
