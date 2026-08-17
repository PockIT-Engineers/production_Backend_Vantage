const express = require('express');
const router = express.Router();
const shipRocketOrderDetailsService = require('../../services/ShipModule/shipRocketOrderDetails.js');

router
    .post('/get', shipRocketOrderDetailsService.getAll)
    .get('/:id', shipRocketOrderDetailsService.get)
    .post('/create', shipRocketOrderDetailsService.validate(), shipRocketOrderDetailsService.create)
    .put('/update', shipRocketOrderDetailsService.validate(), shipRocketOrderDetailsService.update)

module.exports = router;