const express = require('express');
const router = express.Router();
const departmentService = require('../../services/Support/department');
const { checkToken } = require('../../services/global');

router
    .post('/get', checkToken, departmentService.get)
    .post('/create', checkToken, departmentService.validate(), departmentService.create)
    .put('/update', checkToken, departmentService.validate(), departmentService.update)

module.exports = router;