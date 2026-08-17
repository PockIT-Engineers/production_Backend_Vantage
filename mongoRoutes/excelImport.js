const express = require("express");
const router = express.Router();
const excelImportService = require("../mongoServices/excelImport");

router
    .post("/get", excelImportService.get)
    .post("/create", excelImportService.create)
    .put("/update", excelImportService.update);
module.exports = router;