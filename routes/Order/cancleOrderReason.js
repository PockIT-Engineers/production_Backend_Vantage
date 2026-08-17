const express = require('express');
const router = express.Router();
const cancleOrderReasonService = require('../../services/Order/cancleOrderReason');

router
.post('/get',cancleOrderReasonService.get)
.post('/create',cancleOrderReasonService.validate(),cancleOrderReasonService.create)
.put('/update',cancleOrderReasonService.validate(),cancleOrderReasonService.update)
.post('/importCancleOrderReason',cancleOrderReasonService.importCancleOrderReason)


module.exports = router;