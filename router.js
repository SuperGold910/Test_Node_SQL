const express = require('express');

const user = require('./user');

const router = express.Router();

router.get('/search/:userId/:query', user.search);
router.get('/friend/:userId/:friendId', user.friend);
router.get('/unfriend/:userId/:friendId', user.unfriend);

module.exports = router;