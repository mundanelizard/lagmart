import cookieParser from 'cookie-parser'
import logger from 'morgan'
import express from 'express'
import { PORT, STATIC } from './utilities/config';

import indexRouter from './routes/index';
import usersRouter from './routes/users';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(STATIC));

app.use('/', indexRouter);
app.use('/users', usersRouter);


if (module.parent) {
  module.exports = app;
} else {
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
}