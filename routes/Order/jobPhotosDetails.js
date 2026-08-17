const express = require('express');
const router = express.Router();
const jobPhotosDetailsService = require('../../services/Order/jobPhotosDetails');

router
.post('/get',jobPhotosDetailsService.get)
.post('/create',jobPhotosDetailsService.validate(),jobPhotosDetailsService.create)
.put('/update',jobPhotosDetailsService.validate(),jobPhotosDetailsService.update)
.post('/addPhotos',jobPhotosDetailsService.addPhotos)
.post('/deletePhoto',jobPhotosDetailsService.deletePhoto)


module.exports = router;