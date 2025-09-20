'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const nocache = require('nocache');
const mongoose = require('mongoose');
const runner = require('./test-runner');
const replyRoutes = require('./routes/replyRoutes.js');
const app = express();

// Seguridad HTTP
app.use(helmet());
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(nocache());
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

// Conexión a MongoDB
mongoose.connect(process.env.DB);
mongoose.connection.once('open', () => {
  console.log('Conectado a MongoDB');
});

// Middleware general
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(replyRoutes);

// Vistas front-end
app.route('/b/:board/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/board.html'));
app.route('/b/:board/:threadid')
  .get((req, res) => res.sendFile(process.cwd() + '/views/thread.html'));
app.route('/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/index.html'));

// Rutas API modularizadas 
const apiRoutes = require('./routes/api.js');
app.use(apiRoutes);

// Ruta de testing FCC
require('./routes/fcctesting.js')(app);

// Middleware 404
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

// Inicio del servidor y ejecución de tests
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  }
});

module.exports = app;
