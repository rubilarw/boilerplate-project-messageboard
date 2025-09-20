const express = require('express');
const router = express.Router();
const replyController = require('../controllers/replyController.js');

router.route('/api/replies/:board')
  .post(replyController.createReply)
  .get(replyController.getReplies)
  .delete(replyController.deleteReply)
  .put(replyController.reportReply);

module.exports = router;
