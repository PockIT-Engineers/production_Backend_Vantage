const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
var pincodeMaster = "pincode_master";
var viewPincodeMaster = "view_" + pincodeMaster;

function reqData(req) {

    var data = {
        OFFICE_NAME: req.body.OFFICE_NAME,
        PINCODE: req.body.PINCODE,
        DIVISION_NAME: req.body.DIVISION_NAME,
        CIRCLE_NAME: req.body.CIRCLE_NAME,
        TALUKA: req.body.TALUKA,
        DISTRICT: req.body.DISTRICT,
        STATE: req.body.STATE,
        COUNTRY_ID: req.body.COUNTRY_ID,
        SUB_OFFICE: req.body.SUB_OFFICE,
        HEAD_OFFICE: req.body.HEAD_OFFICE,
        LONGITUDE: req.body.LONGITUDE,
        LATTITUDE: req.body.LATTITUDE,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        STATE_NAME: req.body.STATE_NAME,
        COUNTRY_NAME: req.body.COUNTRY_NAME,
        DISTRICT_NAME: req.body.DISTRICT_NAME,
        PINCODE_FOR: req.body.PINCODE_FOR,
        IANA_CODE_ID: req.body.IANA_CODE_ID,
        IANA_CODE: req.body.IANA_CODE,
        TITLE: req.body.TITLE,
        PINCODE_NUMBER: req.body.PINCODE,


    }
    return data;
}

exports.validate = function () {
    return [
        body('OFFICE_NAME').optional(),
        body('PINCODE').optional(),
        body('DIVISION_NAME').optional(),
        body('CIRCLE_NAME').optional(),
        body('TALUKA').optional(),
        body('DISTRICT').optional(),
        body('STATE').optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('SUB_OFFICE').optional(),
        body('HEAD_OFFICE').optional(),
        body('LONGITUDE').optional(),
        body('LATTITUDE').optional(),
        body('IS_ACTIVE').optional(),
        body('CLIENT_ID').isInt().optional(),
        body('ID').optional(),
        body('STATE_NAME').exists(),
    ]
}

exports.get = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_pincode_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get postal code information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 82,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.status(400).json({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }

    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.create = async (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log("validation errors", errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            const ste = data.STATE_NAME;
            const cntry = data.COUNTRY_NAME;
            const pincd = data.PINCODE;
            let fullAddress = "";
            if (!data.LONGITUDE && !data.LATTITUDE) {
                data.LONGITUDE = ""
                data.LATTITUDE = ""
            }

            if (!ste || !cntry || !pincd) {
                const reason = "The required fields are missing for getting geolocation";
                res.send({
                    "code": 400,
                    "message": reason
                });
                return;
            } else {
                fullAddress = [ste, cntry, pincd].filter(Boolean).join(', ');
            }
            if (data.LONGITUDE == "" || data.LATTITUDE == "") {
                console.log(`\n\n\n\n **** Geocoding address for row ${fullAddress}`);
                const geo = await mm.geocodeAddress(fullAddress);
                if (!geo.latitude || !geo.longitude) {
                    const reason = "Invalid address faild to fetch geolocation";
                    res.send({
                        "code": 400,
                        "message": reason
                    });
                    return;
                }
                data.LONGITUDE = geo.longitude;
                data.LATTITUDE = geo.latitude
            }
            // Using stored procedure
            mm.executeQueryData(
                `CALL sp_pincode_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.OFFICE_NAME,
                    data.PINCODE,
                    data.DIVISION_NAME,
                    data.CIRCLE_NAME,
                    data.TALUKA,
                    data.DISTRICT,
                    data.STATE,
                    data.COUNTRY_ID,
                    data.SUB_OFFICE,
                    data.HEAD_OFFICE,
                    data.LONGITUDE,
                    data.LATTITUDE,
                    data.IS_ACTIVE,
                    data.CLIENT_ID,
                    data.STATE_NAME,
                    data.COUNTRY_NAME,
                    data.DISTRICT_NAME,
                    data.PINCODE_FOR,
                    data.IANA_CODE_ID,
                    data.IANA_CODE,
                    data.TITLE,
                    data.PINCODE_NUMBER
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to save postal code information..."
                        });
                    }
                    else {
                        const resultData = results[0][0];
                        if (resultData.code === 300) {
                            res.status(200).json({
                                "code": 300,
                                "message": resultData.message
                            });
                        } else {
                            res.status(200).json({
                                "code": 200,
                                "message": "Pincode information saved successfully...",
                                "PINCODE_ID": resultData.PINCODE_ID
                            });
                        }
                    }
                }
            );
        } catch (error) {
            console.log("Error in catch", error);
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            res.status(500).json({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};

exports.update = async (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var id = req.body.ID;

    if (!errors.isEmpty()) {
        console.log("validation errors", errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            const ste = data.STATE_NAME;
            const cntry = data.COUNTRY_NAME;
            const pincd = data.PINCODE;
            let fullAddress = "";

            if (!ste || !cntry || !pincd) {
                const reason = "The required fields are missing for getting geolocation";
                res.send({
                    "code": 400,
                    "message": reason
                });
                return;
            } else {
                fullAddress = [ste, cntry, pincd].filter(Boolean).join(', ');
            }
            if (data.LONGITUDE == "" || data.LATTITUDE == "") {
                console.log(`\n\n\n\n **** Geocoding address for row ${fullAddress}`);
                const geo = await mm.geocodeAddress(fullAddress);
                if (!geo.latitude || !geo.longitude) {
                    const reason = "Invalid address faild to fetch geolocation";
                    res.send({
                        "code": 400,
                        "message": reason
                    });
                    return;
                }
                data.LONGITUDE = geo.longitude;
                data.LATTITUDE = geo.latitude
            }
            // Using stored procedure
            mm.executeQueryData(
                `CALL sp_pincode_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    id,
                    data.OFFICE_NAME,
                    data.PINCODE,
                    data.DIVISION_NAME,
                    data.CIRCLE_NAME,
                    data.TALUKA,
                    data.DISTRICT,
                    data.STATE,
                    data.COUNTRY_ID,
                    data.SUB_OFFICE,
                    data.HEAD_OFFICE,
                    data.LONGITUDE,
                    data.LATTITUDE,
                    data.IS_ACTIVE,
                    data.CLIENT_ID,
                    data.STATE_NAME,
                    data.COUNTRY_NAME,
                    data.DISTRICT_NAME,
                    data.PINCODE_FOR,
                    data.IANA_CODE_ID,
                    data.IANA_CODE,
                    data.TITLE,
                    data.PINCODE_NUMBER
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to update postal code information."
                        });
                    }
                    else {
                        const resultData = results[0][0];
                        if (resultData.code === 300) {
                            res.status(200).json({
                                "code": 300,
                                "message": resultData.message
                            });
                        } else {
                            res.status(200).json({
                                "code": 200,
                                "message": "Pincode information updated successfully...",
                                "PINCODE_ID": resultData.PINCODE_ID
                            });
                        }
                    }
                }
            );
        } catch (error) {
            console.log("Error in catch", error);
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            res.status(500).json({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};

const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (err, results) => {
            if (err) {
                reject(err);
                mm.rollbackConnection(connection);
            }
            else resolve(results);
        });
    });
};

async function getMasterIdByName(connection, table, idField, nameField, value, supportKey) {
    if (!value) return null;

    let spName = '';
    if (table === 'country_master') spName = 'sp_get_country_by_name';
    else if (table === 'state_master') spName = 'sp_get_state_by_name';
    else if (table === 'district_master') spName = 'sp_get_district_by_name';
    else if (table === 'iana_master') spName = 'sp_get_iana_by_name';
    else return null;

    const result = await runQuery(
        `CALL ${spName}(?)`,
        [value],
        supportKey,
        connection
    );

    const masterResult = result && result[0] ? result[0] : [];
    return masterResult.length ? masterResult[0][idField] : null;
}

exports.importPincode = async (req, res) => {
    console.log("=== PINCODE IMPORT API STARTED ===");
    console.log("Timestamp:", new Date().toISOString());

    try {
        const supportKey = req.headers['supportkey'];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);

        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }
        );

        const jsonData = cleanedRows.filter(row =>
            Object.values(row).some(v => String(v).trim() !== "")
        );

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found" });

        res.status(200).json({
            code: 200,
            message: "Import started. Processing in background...",
            EXCEL_MASTER_ID
        });

        let successCount = 0;
        let skippedCount = 0;
        let successDetails = [];
        let skippedDetails = [];
        let errorDetails = [];
        let totalData = [];
        let errorData = [];

        const chunkSize = 5;
        const isEdit = IMPORT_TYPE === "E";

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (const [index, row] of chunk.entries()) {
                const rowNumber = start + index + 2;
                const connection = mm.openConnection();

                try {
                    const data = {};
                    COLUMN_JSON.forEach(c => {
                        data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                    });

                    if (!data.PINCODE) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber, row, reason: "Missing required field: PINCODE" });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing required field" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    if (isEdit) {
                        data.IS_ACTIVE = data.IS_ACTIVE == "Active" ? 1 : 0;
                    } else {
                        data.IS_ACTIVE = 1;
                    }

                    // =============================
                    // 🔍 MASTER LOOKUPS USING SPs
                    // =============================
                    const countryId = await getMasterIdByName(
                        connection,
                        "country_master",
                        "ID",
                        "NAME",
                        data.COUNTRY_NAME,
                        supportKey
                    );

                    const stateId = await getMasterIdByName(
                        connection,
                        "state_master",
                        "ID",
                        "NAME",
                        data.STATE_NAME,
                        supportKey
                    );

                    const districtId = await getMasterIdByName(
                        connection,
                        "district_master",
                        "ID",
                        "NAME",
                        data.DISTRICT_NAME,
                        supportKey
                    );

                    const ianaCodeId = await getMasterIdByName(
                        connection,
                        "iana_master",
                        "ID",
                        "NAME",
                        data.IANA_CODE,
                        supportKey
                    );

                    const missingMasters = [];
                    if (data.COUNTRY_NAME && !countryId) missingMasters.push("Country");
                    if (data.STATE_NAME && !stateId) missingMasters.push("State");
                    if (data.DISTRICT_NAME && !districtId) missingMasters.push("District");
                    if (data.IANA_CODE && !ianaCodeId) missingMasters.push("IANA Code");

                    if (missingMasters.length > 0) {
                        skippedCount++;
                        const reason = `Data not found for ${missingMasters.join(", ")}`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    data.COUNTRY_ID = countryId;
                    data.STATE = stateId;
                    data.DISTRICT = districtId;
                    data.CLIENT_ID = 1;
                    data.PINCODE_NUMBER = data.PINCODE;
                    data.IANA_CODE_ID = ianaCodeId;
                    data.TITLE = data.IANA_CODE;

                    // =============================
                    // 🛑 DUPLICATE CHECK USING SP
                    // =============================
                    const duplicate = await runQuery(
                        `CALL sp_check_pincode_exists(?, ?, ?, ?, ?)`,
                        [data.PINCODE, data.COUNTRY_ID, data.STATE, data.ID || null, isEdit],
                        supportKey,
                        connection
                    );

                    const duplicateResult = duplicate && duplicate[0] ? duplicate[0] : [];

                    if (duplicateResult.length > 0) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber, row, reason: "This postal code is already exist" });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "This postal code is already exist" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // =============================
                    // 🌍 GEOCODING LOGIC
                    // =============================
                    const ste = data.STATE_NAME;
                    const cntry = data.COUNTRY_NAME;
                    const pincd = data.PINCODE;
                    let fullAddress = "";

                    if (!ste || !cntry || !pincd) {
                        const reason = "The required fields are missing for getting geolocation";
                        skippedCount++;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    } else {
                        fullAddress = [ste, cntry, pincd].filter(Boolean).join(', ');
                    }

                    if (data.LONGITUDE == "" || data.LATTITUDE == "") {
                        console.log(`\n\n\n\n **** Geocoding address for row ${rowNumber}: ${fullAddress}`);
                        const geo = await mm.geocodeAddress(fullAddress);
                        if (!geo.latitude || !geo.longitude) {
                            const reason = "Invalid address failed to fetch geolocation";
                            skippedCount++;
                            skippedDetails.push({ rowNumber, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }
                        data.LONGITUDE = geo.longitude;
                        data.LATTITUDE = geo.latitude;
                        row.Longitude = geo.longitude;
                        row.Latitude = geo.latitude;
                    }

                    // =============================
                    // ✍ INSERT / UPDATE USING SPs
                    // =============================
                    if (isEdit) {
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({ rowNumber, row, reason: "ID required for update" });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "ID required" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        await runQuery(
                            `CALL sp_update_pincode(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.ID,
                                data.PINCODE,
                                data.PINCODE_NUMBER,
                                data.COUNTRY_ID,
                                data.STATE,
                                data.DISTRICT,
                                data.IANA_CODE_ID,
                                data.TITLE,
                                data.LONGITUDE || null,
                                data.LATTITUDE || null,
                                data.IS_ACTIVE,
                                data.CLIENT_ID,
                                data.STATE_NAME,
                                data.COUNTRY_NAME,
                                data.DISTRICT_NAME,
                            ],
                            supportKey,
                            connection
                        );

                    } else {
                        await runQuery(
                            `CALL sp_insert_pincode(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.PINCODE,
                                data.PINCODE_NUMBER,
                                data.COUNTRY_ID,
                                data.STATE,
                                data.DISTRICT,
                                data.IANA_CODE_ID,
                                data.TITLE,
                                data.LONGITUDE || null,
                                data.LATTITUDE || null,
                                data.IS_ACTIVE,
                                data.CLIENT_ID,
                                data.STATE_NAME,
                                data.COUNTRY_NAME,
                                data.DISTRICT_NAME,
                            ],
                            supportKey,
                            connection
                        );
                    }

                    mm.commitConnection(connection);

                    successCount++;
                    successDetails.push({ rowNumber, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (err) {
                    mm.rollbackConnection(connection);
                    errorDetails.push({ rowNumber, error: err.message });
                    errorData.push({ rowNumber: index + 2, data: row, reason: err.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);

            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

        const response = {
            code: 200,
            message: "Pincode import completed",
            totalRecords: jsonData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: errorDetails.length,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            totalData,
            errorData
        };

        const fs = require("fs");
        const path = require("path");

        const fileName = `${EXCEL_MASTER_ID}.json`;
        const filePath = path.join(
            __dirname,
            "../../uploads/ExcelImporResponse/",
            fileName
        );

        await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
            STATUS: "Completed",
            PROGRESS: 100,
            TOTAL_RECORDS: jsonData.length,
            SUCCESSFUL_RECORDS: successCount,
            SKIPPED_RECORDS: skippedCount,
            FAILED_RECORDS: errorDetails.length,
            RESPONSE: fileName
        });

        fs.writeFileSync(filePath, JSON.stringify(response, null, 2), "utf8");

    } catch (error) {
        console.log("Fatal Error in importPincode:", error);
    }
};




