const Thread = require('../models/thread.js');
const ObjectId = require('mongoose').Types.ObjectId;

exports.createReply = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password, thread_id } = req.body;

  try {
    const reply = {
      _id: new ObjectId(),
      text,
      delete_password,
      created_on: new Date(),
      reported: false
    };

    const updatedThread = await Thread.findByIdAndUpdate(
      thread_id,
      {
        $push: { replies: reply },
        $set: { bumped_on: new Date() }
      },
      { new: true }
    );

    res.redirect(`/b/${board}/${thread_id}`);
  } catch (err) {
    res.status(500).send('Error al crear respuesta');
  }
};

exports.getReplies = async (req, res) => {
  const { thread_id } = req.query;

  try {
    const thread = await Thread.findById(thread_id).lean();

    if (!thread) return res.status(404).send('Hilo no encontrado');

    thread.replies = thread.replies.map(r => ({
      _id: r._id,
      text: r.text,
      created_on: r.created_on
    }));

    res.json({
      _id: thread._id,
      text: thread.text,
      created_on: thread.created_on,
      bumped_on: thread.bumped_on,
      replies: thread.replies
    });
  } catch (err) {
    res.status(500).send('Error al obtener respuestas');
  }
};

exports.deleteReply = async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.send('respuesta no encontrada');

    if (reply.delete_password !== delete_password) {
      return res.send('incorrect password');
    }

    reply.text = '[deleted]';
    await thread.save();

    res.send('success');
  } catch (err) {
    res.status(500).send('Error al eliminar respuesta');
  }
};

exports.reportReply = async (req, res) => {
  const { thread_id, reply_id } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    const reply = thread.replies.id(reply_id);

    if (!reply) return res.send('respuesta no encontrada');

    reply.reported = true;
    await thread.save();

    res.send('reported');
  } catch (err) {
    res.status(500).send('Error al reportar respuesta');
  }
};
