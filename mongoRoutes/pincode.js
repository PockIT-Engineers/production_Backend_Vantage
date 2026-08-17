const express = require("express");
const router = express.Router();
const pincodeService = require("../mongoServices/pincode");

router
    .post("/get", pincodeService.get)
    .post("/create", pincodeService.validate(), pincodeService.create)
    .put("/update", pincodeService.validate(), pincodeService.update);

module.exports = router;
