const Thread = require('../models/thread.js');
const ObjectId = require('mongoose').Types.ObjectId;

exports.createThread = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password } = req.body;

  try {
    const thread = new Thread({
      text,
      delete_password,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      replies: []
    });

    await thread.save();

    // ✅ Devuelve el hilo creado en JSON para los tests
    res.json(thread);

    // Si querés mantener la redirección para la vista:
    // res.redirect(`/b/${board}/`);
  } catch (err) {
    res.status(500).send('Error al crear hilo');
  }
};

