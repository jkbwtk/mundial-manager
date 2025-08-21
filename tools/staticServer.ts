import { readFileSync } from 'node:fs';
import compression from 'compression';
import express from 'express';
import sirv from 'sirv';
import { environment } from './constants';

const app = express();

const pageNotFoundHtml = readFileSync('./dist/static/404.html', 'utf-8');

const maxAge = 365 * 24 * 60 * 60; // 7 days

app.use(compression({ level: 9 }));
app.use('/assets', sirv('./dist/client/assets', { extensions: [], maxAge }));
app.use('/', sirv('./dist/static'));

app.get('*', (_req, res) => {
  res.status(404).send(pageNotFoundHtml);
});

app.listen(environment.WEB_PORT, () => {
  console.log(`Server started at http://localhost:${environment.WEB_PORT}`);
});
