'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet      = require('helmet'); // 



const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');
const mongoose = require('mongoose');
mongoose.connect(process.env.DB);
mongoose.connection.once('open', () => {
  console.log('Conectado a MongoDB');
});


const app = express();

// 🛡️ Headers de seguridad exigidos por los tests
app.use(helmet());
app.use(helmet.frameguard({ action: 'sameorigin' })); 
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
app.use(helmet.noSniff());       
app.use(helmet.xssFilter());     
app.use(helmet.noCache());       
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3'); 
  next();
});

// Archivos públicos
app.use('/public', express.static(process.cwd() + '/public'));

// CORS para FCC
app.use(cors({origin: '*'}));

// Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Front-end
app.route('/b/:board/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/board.html'));
app.route('/b/:board/:threadid')
  .get((req, res) => res.sendFile(process.cwd() + '/views/thread.html'));
app.route('/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/index.html'));

// Rutas de testing y API
fccTestingRoutes(app);
apiRoutes(app);

// Middleware 404
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

// Servidor y tests
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

module.exports = app; //for testing

