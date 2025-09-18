const Thread = require('../models/thread.js');
const ObjectId = require('mongoose').Types.ObjectId;

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
    res.redirect(`/b/${board}/`);
  } catch (err) {
    res.status(500).send('Error al crear hilo');
  }
};

exports.getThreads = async (req, res) => {
  const { board } = req.params;

  try {
    const threads = await Thread.find({ board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .lean();

    const sanitized = threads.map(t => ({
      _id: t._id,
      text: t.text,
      created_on: t.created_on,
      bumped_on: t.bumped_on,
      replies: t.replies
        .slice(-3)
        .map(r => ({
          _id: r._id,
          text: r.text,
          created_on: r.created_on
        }))
    }));

    res.json(sanitized);
  } catch (err) {
    res.status(500).send('Error al obtener hilos');
  }
};

exports.deleteThread = async (req, res) => {
  const { board } = req.params;
  const { thread_id, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);

    if (!thread) return res.send('hilo no encontrado');
    if (thread.delete_password !== delete_password) {
      return res.send('incorrect password');
    }

    await Thread.findByIdAndDelete(thread_id);
    res.send('success');
  } catch (err) {
    res.status(500).send('Error al eliminar hilo');
  }
};

exports.reportThread = async (req, res) => {
  const { thread_id } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send('hilo no encontrado');

    thread.reported = true;
    await thread.save();

    res.send('reported');
  } catch (err) {
    res.status(500).send('Error al reportar hilo');
  }
};
