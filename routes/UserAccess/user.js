const express = require('express');
const router = express.Router();
const userService = require('../../services/UserAccess/user');

router
    .post('/get', userService.get)
    .post('/create', userService.validate(), userService.create)
    .put('/update', userService.validate(), userService.update)
    .post('/getForms', userService.getForms)
    .post('/changePassword', userService.changePassword)
    .post('/logout', userService.logout)

module.exports = router;