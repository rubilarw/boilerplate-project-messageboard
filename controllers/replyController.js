'use strict';

const Thread = require('../models/thread.js');
const ObjectId = require('mongoose').Types.ObjectId;

// Crear una respuesta en un hilo
exports.createReply = async (req, res) => {
  const { board } = req.params;
  const { thread_id, text, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread || thread.board !== board) {
      return res.status(404).send('thread not found');
    }

    const now = new Date();

    const reply = {
      _id: new ObjectId(),
      text,
      delete_password,
      created_on: now,
      reported: false
    };

    thread.replies.push(reply);
    thread.bumped_on = now;

    await thread.save();
    res.redirect(`/b/${board}/${thread_id}`);
  } catch (err) {
    console.error('Error en POST /api/replies:', err);
    res.status(500).send('error');
  }
};

// Obtener un hilo con todas sus respuestas
exports.getReplies = async (req, res) => {
  const { thread_id } = req.query;

  try {
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
  } catch (err) {
    console.error('Error en GET /api/replies:', err);
    res.status(500).send('error');
  }
};

// Eliminar una respuesta (marcar como '[deleted]')
exports.deleteReply = async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('thread not found');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.status(404).send('reply not found');

    if (reply.delete_password !== delete_password) {
      return res.send('incorrect password');
    }

    reply.text = '[deleted]';
    await thread.save();
    res.send('success');
  } catch (err) {
    console.error('Error en DELETE /api/replies:', err);
    res.status(500).send('error');
  }
};

// Reportar una respuesta
exports.reportReply = async (req, res) => {
  const { thread_id, reply_id } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('thread not found');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.status(404).send('reply not found');

    reply.reported = true;
    await thread.save();
    res.send('reported');
  } catch (err) {
    console.error('Error en PUT /api/replies:', err);
    res.status(500).send('error');
  }
};
