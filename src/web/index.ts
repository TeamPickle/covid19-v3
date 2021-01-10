import http from 'http';
import { port } from '@/config.json';
import app from './app';

http.createServer(app).listen(port, () => {
  console.log('WEB: HTTP READY');
});
