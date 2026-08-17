const express = require("express");
const router = express.Router();
const channelSubscribedUsersService = require("../mongoServices/channelSubscribedUsers");

router
    .post("/get", channelSubscribedUsersService.get)
    .post("/create", channelSubscribedUsersService.create)
    .put("/update", channelSubscribedUsersService.update)
    .post("/subscribeToChanel", channelSubscribedUsersService.subscribeToChanel)
    .post("/updateSubscribedChannel", channelSubscribedUsersService.updateSubscribedChannel)
module.exports = router;