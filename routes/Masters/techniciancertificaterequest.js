const express = require('express');
const router = express.Router();
const technicianCertificateRequestService = require('../../services/Masters/techniciancertificaterequest');

router
    .post('/get', technicianCertificateRequestService.get)
    .post('/create', technicianCertificateRequestService.validate(), technicianCertificateRequestService.create)
    .put('/update', technicianCertificateRequestService.validate(), technicianCertificateRequestService.update)
    .post('/updateCertificateStatus', technicianCertificateRequestService.updateCertificateStatus)
    .post('/getStatusCount', technicianCertificateRequestService.getStatusCount)
    .post('/deleteCertificate', technicianCertificateRequestService.deleteCertificate)

module.exports = router;