'use strict';

const Thread = require('../models/thread.js');

exports.createThread = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password } = req.body;

  try {
    const now = new Date();
    const thread = new Thread({
      board,
      text,
      delete_password,
      created_on: now,
      bumped_on: now,
      reported: false,
      replies: []
    });

    await thread.save();
    res.json(thread); 
  } catch (err) {
    console.error('Error en POST /api/threads:', err);
    res.status(500).send('error');
  }
};

exports.getThreads = async (req, res) => {
  try {
    const rawThreads = await Thread.find({ board: req.params.board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .lean();

    const sanitizedThreads = rawThreads.map(thread => ({
      _id: thread._id,
      text: thread.text,
      created_on: thread.created_on,
      bumped_on: thread.bumped_on,
      replies: (thread.replies || [])
        .slice(-3)
        .sort((a, b) => new Date(a.created_on) - new Date(b.created_on))
        .map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }))
    }));

    res.json(sanitizedThreads);
  } catch (err) {
    console.error('Error al obtener hilos:', err);
    res.status(500).send('Error al obtener hilos');
  }
};


exports.deleteThread = async (req, res) => {
  const { thread_id, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send('thread not found');
    if (thread.delete_password !== delete_password) return res.send('incorrect password');

    await Thread.findByIdAndDelete(thread_id);
    res.send('success');
  } catch (err) {
    console.error('Error al eliminar hilo:', err);
    res.status(500).send('error');
  }
};

exports.reportThread = async (req, res) => {
  const { thread_id } = req.body;

  try {
    const updated = await Thread.findByIdAndUpdate(thread_id, { reported: true });
    if (!updated) return res.send('thread not found');
    res.send('reported');
  } catch (err) {
    console.error('Error al reportar hilo:', err);
    res.status(500).send('error');
  }
};

