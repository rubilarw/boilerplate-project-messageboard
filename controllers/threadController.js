'use strict';

const Thread = require('../models/thread.js');

exports.createThread = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password } = req.body;

  try {
    const thread = new Thread({
      board,
      text,
      delete_password,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      replies: []
    });

    await thread.save();
    res.redirect(`/b/${board}`);
  } catch (err) {
    console.error('Error al crear hilo:', err);
    res.status(500).send('Error al crear hilo');
  }
};

exports.getThreads = async (req, res) => {
  try {
    const threads = await Thread.find({ board: req.params.board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .lean();

    threads.forEach(thread => {
      thread.replies = thread.replies.slice(-3).map(reply => ({
        _id: reply._id,
        text: reply.text,
        created_on: reply.created_on
      }));
      delete thread.delete_password;
      delete thread.reported;
    });

    res.json(threads);
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

