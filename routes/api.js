const express = require('express');
const router = express.Router();

const threadController = require('../controllers/threadController.js');
const replyController = require('../controllers/replyController.js');

router.route('/api/threads/:board')
  .post(threadController.createThread)
  .get(threadController.getThreads)
  .delete(threadController.deleteThread)
  .put(threadController.reportThread);

router.route('/api/replies/:board')
  .post(replyController.createReply)
  .get(replyController.getReplies)
  .delete(replyController.deleteReply)
  .put(replyController.reportReply);

module.exports = router;



