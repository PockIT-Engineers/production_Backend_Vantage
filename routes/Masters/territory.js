const express = require('express');
const router = express.Router();
const territoryService = require('../../services/Masters/territory');
const territoryPincodeMappingService = require('../../services/Masters/territoryPincodeMapping');

router
router
  .post('/get', territoryService.get)
  .post('/create', territoryService.validate(), territoryService.create)
  .put('/update', territoryService.validate(), territoryService.update)

  .post('/unMappedpincodes', territoryService.unMappedpincodes)
  .post('/mapPincodes', territoryPincodeMappingService.mapPincodes)
  .post('/unMapPincodes', territoryPincodeMappingService.unMapPincodes)


module.exports = router;
