'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const nocache = require('nocache');
const mongoose = require('mongoose');
const runner = require('./test-runner');

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
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.connection.once('open', () => {
  console.log('Conectado a MongoDB');
});

// Middleware general
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Vistas front-end
app.route('/b/:board/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/board.html'));
app.route('/b/:board/:threadid')
  .get((req, res) => res.sendFile(process.cwd() + '/views/thread.html'));
app.route('/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/index.html'));

// Modelo Mongoose
const { Schema } = mongoose;

const replySchema = new Schema({
  text: String,
  created_on: Date,
  delete_password: String,
  reported: Boolean
});

const threadSchema = new Schema({
  board: String,
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: String,
  replies: [replySchema]
});

const Thread = mongoose.model('Thread', threadSchema);

// Rutas API
app.post('/api/threads/:board', async (req, res) => {
  const { text, delete_password } = req.body;
  const thread = new Thread({
    board: req.params.board,
    text,
    delete_password,
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    replies: []
  });
  await thread.save();
  res.redirect(`/b/${req.params.board}`);
});

app.get('/api/threads/:board', async (req, res) => {
  const threads = await Thread.find({ board: req.params.board })
    .sort({ bumped_on: -1 })
    .limit(10)
    .lean();

  threads.forEach(t => {
    t.replies = t.replies.slice(-3).map(r => ({
      _id: r._id,
      text: r.text,
      created_on: r.created_on
    }));
    delete t.delete_password;
    delete t.reported;
  });

  res.json(threads);
});

app.delete('/api/threads/:board', async (req, res) => {
  const { thread_id, delete_password } = req.body;
  const thread = await Thread.findById(thread_id);
  if (!thread) return res.send('thread not found');
  if (thread.delete_password !== delete_password) return res.send('incorrect password');
  await Thread.findByIdAndDelete(thread_id);
  res.send('success');
});

app.put('/api/threads/:board', async (req, res) => {
  const { thread_id } = req.body;
  const updated = await Thread.findByIdAndUpdate(thread_id, { reported: true });
  if (!updated) return res.send('thread not found');
  res.send('reported');
});

app.post('/api/replies/:board', async (req, res) => {
  const { thread_id, text, delete_password } = req.body;
  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('thread not found');

    const now = new Date();

    thread.replies.push({
      text,
      delete_password,
      created_on: now,
      reported: false
    });

    thread.bumped_on = now;
    await thread.save();

    res.redirect(`/b/${req.params.board}/${thread_id}`);
  } catch (err) {
    console.error('Error en POST /api/replies:', err);
    res.status(500).send('error');
  }
});


app.get('/api/replies/:board', async (req, res) => {
  const { thread_id } = req.query;
  const thread = await Thread.findById(thread_id).lean();
  if (!thread) return res.status(404).send('thread not found');

  thread.replies = thread.replies.map(r => ({
    _id: r._id,
    text: r.text,
    created_on: r.created_on
  }));
  delete thread.delete_password;
  delete thread.reported;

  res.json(thread);
});

app.put('/api/replies/:board', async (req, res) => {
  const { thread_id, reply_id } = req.body;
  const thread = await Thread.findById(thread_id);
  const reply = thread.replies.id(reply_id);
  if (!reply) return res.status(404).send('reply not found');
  reply.reported = true;
  await thread.save();
  res.send('reported');
});

app.delete('/api/replies/:board', async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;
  const thread = await Thread.findById(thread_id);
  const reply = thread.replies.id(reply_id);
  if (!reply) return res.status(404).send('reply not found');
  if (reply.delete_password !== delete_password) return res.send('incorrect password');
  reply.text = '[deleted]';
  await thread.save();
  res.send('success');
});

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

