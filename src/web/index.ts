import http from 'http';
import app from './app';

const createServer = () => {
  http.createServer(app).listen(45313, () => {
    console.log('WEB: HTTP READY');
  });
};

export default createServer;

