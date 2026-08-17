const express = require('express');
const router = express.Router();
const formService = require('../../services/UserAccess/form');

router
    .post('/get', formService.get)
    .post('/create', formService.validate(), formService.create)
    .put('/update', formService.validate(), formService.update)

module.exports = router;