import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from '@src/config';
import { CustomError } from '../types/error';
import morgan from './middleware/morgan';
import router from './routes';

const app = express();

app.use(morgan);
app.use(
  cors({
    origin: config.corsAllow,
    credentials: true,
  }),
);
app.use(express.json());

app.use('/', router);

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    res.json({ success: false, code: 400, msg: 'Invalid json type' });
  } else {
    console.error(err.stack);
    res.status(err.status || 500).json({
      message: err.data,
    });
  }
});

export default app;
