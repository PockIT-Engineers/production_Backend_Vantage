const express = require('express');
const router = express.Router();
const ianaMasterService = require('../../services/Masters/iana');

router
    .post('/get', ianaMasterService.get)
    .post('/create', ianaMasterService.validate(), ianaMasterService.create)
    .put('/update', ianaMasterService.validate(), ianaMasterService.update)
module.exports = router;