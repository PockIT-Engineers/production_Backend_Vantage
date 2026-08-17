const express = require('express');
const router = express.Router();
const placeholderService = require('../../services/Config/placeholder');

router
    .post('/get', placeholderService.get)
    .post('/getTableData', placeholderService.getTableData)
    .post('/create', placeholderService.validate(), placeholderService.create)
    .put('/update', placeholderService.validate(), placeholderService.update)


module.exports = router;