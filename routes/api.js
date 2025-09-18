'use strict';

const threadController = require('../controllers/threadController.js');
const replyController = require('../controllers/replyController.js');

module.exports = function (app) {
  
  //  Rutas para hilos
  app.route('/api/threads/:board')
    .post(threadController.createThread)
    .get(threadController.getThreads)
    .delete(threadController.deleteThread)
    .put(threadController.reportThread);

  //  Rutas para respuestas
  app.route('/api/replies/:board')
    .post(replyController.createReply)
    .get(replyController.getReplies)
    .delete(replyController.deleteReply)
    .put(replyController.reportReply);
};

