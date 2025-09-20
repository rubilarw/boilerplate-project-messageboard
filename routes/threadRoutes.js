const express = require('express');
const router = express.Router();
const threadController = require('../controllers/threadController.js');

router.route('/threads/:board')
  .post(threadController.createThread)
  .get(threadController.getThreads)
  .delete(threadController.deleteThread)
  .put(threadController.reportThread);

module.exports = router;
