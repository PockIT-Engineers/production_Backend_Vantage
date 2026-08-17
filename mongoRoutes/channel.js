const express = require("express");
const router = express.Router();
const channelService = require("../mongoServices/channel");

router
    .post("/get", channelService.get)
    .post("/create", channelService.create)
    .put("/update", channelService.update);
module.exports = router;