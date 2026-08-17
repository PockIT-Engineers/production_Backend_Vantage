const express = require('express');
const router = express.Router();
const searchService = require('../../services/Config/search');

router
.post('/getDistinctData',searchService.getDistinctData)



module.exports = router;