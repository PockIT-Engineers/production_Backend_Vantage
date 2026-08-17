const express = require("express");
const router = express.Router();
const technicianActivityCalender = require("../mongoServices/technicianActivityCalender")

router
    .post("/get", technicianActivityCalender.get)
    .post('/getCalenderData',technicianActivityCalender.getCalenderData)
    .post("/create", technicianActivityCalender.validate(), technicianActivityCalender.create)
    .put("/update", technicianActivityCalender.validate(), technicianActivityCalender.update);

module.exports = router;
