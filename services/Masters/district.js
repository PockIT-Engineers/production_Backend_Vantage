const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const xlsx = require("xlsx");
const excelMaster = require("../../modules/excelImportMaster");
var districtMaster = "district_master";
var viewdistrictMaster = "view_" + districtMaster;


function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        STATE: req.body.STATE,
        SEQ_NO: req.body.SEQ_NO,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        STATE_ID: req.body.STATE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        CLIENT_ID: req.body.CLIENT_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('SEQ_NO').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];
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

    if (IS_FILTER_WRONG !== "0") {
        return res.send({ "code": 400,  "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext+`CALL sp_district_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400,  "message": "Failed to get district information." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 24,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_district_create(?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.STATE,
                data.SEQ_NO,
                data.IS_ACTIVE,
                data.STATE_ID,
                data.COUNTRY_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400,  "message": "Failed to save district information..." });
                }

                const r = result[0][0];
                if (r.code === 300) return res.send(r);

                // 🔹 LOGGING KEPT
                dbm.saveLog({
                    SOURCE_ID: r.ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} has created a new district, ${data.NAME}.`,
                    CATEGORY: "district",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({ "code": 200,  "message": "District information saved successfully..." });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!errors.isEmpty()) {
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_district_update(?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.NAME,
                data.STATE,
                data.SEQ_NO,
                data.IS_ACTIVE,
                data.STATE_ID,
                data.COUNTRY_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400,  "message": "Failed to update district information." });
                }

                const r = result[0][0];
                if (r.code === 300) return res.send(r);

                dbm.saveLog({
                    SOURCE_ID: ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} has updated details of the district, ${data.NAME}.`,
                    CATEGORY: "district",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({ "code": 200,  "message": "District information updated successfully..." });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

const checkDuplicateDistrict = async (data, isEdit, supportKey, connection) => {
    const result = await runQuery(
        `CALL sp_check_district_duplicate(?, ?, ?, ?, ?, ?)`,
        [data.SEQ_NO, data.STATE_ID, data.NAME, data.COUNTRY_ID, data.ID || null, isEdit],
        supportKey,
        connection
    );

    const duplicates = result && result[0] ? result[0] : [];
    
    if (!duplicates.length) return null;

    if (duplicates.find(r => r.STATE_ID == data.STATE_ID && r.NAME === data.NAME && r.COUNTRY_ID === data.COUNTRY_ID))
        return "District already exists with same state and country";

    if (duplicates.find(r => r.SEQ_NO == data.SEQ_NO))
        return "Sequence number already exists";

    return null;
};

exports.importDistrict = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, IMPORT_TYPE, id: EXCEL_MASTER_ID } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "EXCEL_FILE_NAME required" });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        if (!jsonData.length)
            return res.json({ code: 200, message: "No data found", EXCEL_MASTER_ID });

        res.json({ code: 200, message: "Import started", EXCEL_MASTER_ID });

        let successCount = 0,
            skippedCount = 0,
            successDetails = [],
            errorDetails = [],
            errorData = [],
            skippedDetails = [],
            totalData = [];
            
        const chunkSize = 5;
        const isEdit = IMPORT_TYPE === "E";

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (const [index, row] of chunk.entries()) {
                const rowNumber = start + index + 2;
                const data = {};

                COLUMN_JSON.forEach(c => {
                    data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                });
                
                console.log("data", data.NAME);
                
                if (!data.NAME) {
                    skippedCount++;
                    skippedDetails.push({
                        rowNumber: rowNumber,
                        row,
                        reason: "Missing required fields",
                    });
                    totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing required fields" });
                    console.log("innn");
                    continue;
                }
                
                const connection = mm.openConnection();
                
                try {
                    // Get country using SP
                    var getCountry = await runQuery(
                        `CALL sp_get_country_by_name(?)`,
                        [data.COUNTRY_NAME],
                        supportKey,
                        connection
                    );

                    const countryResult = getCountry && getCountry[0] ? getCountry[0] : [];

                    if (countryResult.length == 0) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: `'${data.COUNTRY_NAME}' country not exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Country not exist" });
                        mm.rollbackConnection(connection);
                        console.log("innn1");
                        continue;
                    }

                    // Auto-generate SEQ_NO for insert mode if not provided
                    if (!isEdit && !data.SEQ_NO) {
                        const seqRes = await runQuery(
                            `CALL sp_get_next_district_seq_no()`,
                            [],
                            supportKey,
                            connection
                        );

                        const seqResult = seqRes && seqRes[0] ? seqRes[0] : [];
                        data.SEQ_NO = seqResult[0]?.NEXT_NO || 1;
                        console.log("Assigned Values:", { SEQ_NO: data.SEQ_NO });
                    }

                    // Get state using SP
                    var getState = await runQuery(
                        `CALL sp_get_state_by_name(?)`,
                        [data.STATE_NAME],
                        supportKey,
                        connection
                    );

                    const stateResult = getState && getState[0] ? getState[0] : [];

                    if (stateResult.length == 0) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: `'${data.STATE_NAME}' state not exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "State not exist" });
                        mm.rollbackConnection(connection);
                        console.log("innn2");
                        continue;
                    }

                    data.STATE_ID = stateResult[0].ID;
                    data.COUNTRY_ID = countryResult[0].ID;
                    data.CLIENT_ID = 1;
                    
                    // Store for later use
                    const countryName = data.COUNTRY_NAME;
                    const stateName = data.STATE_NAME;
                    
                    delete data.COUNTRY_NAME;
                    delete data.STATE_NAME;

                    const duplicateReason = await checkDuplicateDistrict(data, isEdit, supportKey, connection);
                    console.log("duplicateReason", duplicateReason);
                    
                    if (duplicateReason) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: duplicateReason,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: duplicateReason });
                        mm.rollbackConnection(connection);
                        console.log("innn4");
                        continue;
                    }

                    if (isEdit) {
                        // EDIT MODE
                        data.IS_ACTIVE = data.IS_ACTIVE == 'Active' ? 1 : 0;
                        
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: "ID required for update",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "ID required for update" });
                            mm.rollbackConnection(connection);
                            console.log("innn5");
                            continue;
                        }
                        
                        // Check if district exists using SP
                        var existing = await runQuery(
                            `CALL sp_get_district_by_id(?)`,
                            [data.ID],
                            supportKey,
                            connection
                        );

                        const existingResult = existing && existing[0] ? existing[0] : [];

                        if (existingResult.length == 0) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `District '${data.NAME}' for ID '${data.ID}' does not exists`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "District Does not exists" });
                            mm.rollbackConnection(connection);
                            console.log("innn6");
                            continue;
                        }

                        // Update district using SP
                        await runQuery(
                            `CALL sp_update_district(?, ?, ?, ?, ?)`,
                            [data.ID, data.NAME, data.STATE_ID, data.SEQ_NO, data.IS_ACTIVE],
                            supportKey,
                            connection
                        );

                        // System log (MongoDB - stays in API)
                        const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} updated district ${data.NAME}`;
                        dbm.saveLog({
                            SOURCE_ID: data.ID,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: ACTION_DETAILS,
                            CATEGORY: "district",
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            supportKey: 0
                        }, systemLog);

                    } else {
                        // INSERT MODE
                        data.IS_ACTIVE = 1;

                        // Insert district using SP
                        const insertResult = await runQuery(
                            `CALL sp_insert_district(?, ?, ?, ?, ?, ?)`,
                            [data.NAME, data.STATE_ID, data.COUNTRY_ID, data.SEQ_NO, data.IS_ACTIVE, data.CLIENT_ID],
                            supportKey,
                            connection
                        );

                        const insertId = insertResult && insertResult[0] && insertResult[0][0] ? 
                                        insertResult[0][0].insertId : insertResult[0]?.insertId;

                        // System log (MongoDB - stays in API)
                        const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} created district ${data.NAME}`;
                        dbm.saveLog({
                            SOURCE_ID: insertId,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: ACTION_DETAILS,
                            CATEGORY: "district",
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            supportKey: 0
                        }, systemLog);
                    }
                    
                    console.log("in 5123456");
                    mm.commitConnection(connection);
                    
                    successCount++;
                    successDetails.push({ rowNumber: rowNumber, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    mm.rollbackConnection(connection);
                    console.error(`Row ${rowNumber} failed:`, error);
                    errorDetails.push({ rowNumber: rowNumber, reason: error.message });
                    errorData.push({ rowNumber: rowNumber, row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

        let response = {
            code: 200,
            message: "District import process completed.",
            totalRecords: jsonData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: errorDetails.length,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            totalData: totalData,
            errorData: errorData
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
        console.error("District import error:", error);
    }
};