const express = require("express");
const router = express.Router();
const jobchatservice = require("../mongoServices/jobCardChat");

router
    .post("/get", jobchatservice.get)
    .post("/create", jobchatservice.create)
    .put("/update", jobchatservice.update);

module.exports = router;
