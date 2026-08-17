const express = require("express");
const router = express.Router();
const InventoryTrack = require("../mongoServices/InventoryTrack");

router
    .post("/get", InventoryTrack.get)
    .post("/create", InventoryTrack.create)
    .put("/update", InventoryTrack.update);
module.exports = router;