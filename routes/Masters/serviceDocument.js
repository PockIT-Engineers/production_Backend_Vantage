const express = require('express');
const router = express.Router();
const serviceDocumentService = require('../../services/Masters/serviceDocument');

router
.post('/get',serviceDocumentService.get)
.post('/create',serviceDocumentService.validate(),serviceDocumentService.create)
.put('/update',serviceDocumentService.validate(),serviceDocumentService.update)
.post('/mapServiceDocument',serviceDocumentService.validate(),serviceDocumentService.mapServiceDocument)

.post('/unMappedServiceDocument',serviceDocumentService.validate(),serviceDocumentService.unMappedServiceDocument)
.post('/unMapService',serviceDocumentService.validate(),serviceDocumentService.unMapService)
.post('/mappedServiceDocument',serviceDocumentService.validate(),serviceDocumentService.mappedServiceDocument)
.post('/importServiceDocumentMapping',serviceDocumentService.importServiceDocumentMapping)



module.exports = router;