const express = require('express');
const router = express.Router();
const DashboardService = require('../../services/Masters/dashboard');

router
.post('/get',DashboardService.get)
.get('/:id/get',DashboardService.getList)
.post('/create',DashboardService.validate(),DashboardService.create)
.put('/update',DashboardService.validate(),DashboardService.update)

module.exports = router;