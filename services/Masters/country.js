const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var countryMaster = "country_master";
var viewCountryMaster = "view_" + countryMaster;
const xlsx = require('xlsx');
const excelMaster = require("../../modules/excelImportMaster");

function reqData(req) {

    var data = {
        SHORT_CODE: req.body.SHORT_CODE,
        NAME: req.body.NAME,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        SEQ_NO: req.body.SEQ_NO,
        COUNTRY_CODE: req.body.COUNTRY_CODE
    }
    return data;
}

exports.validate = function () {
    return [
        body('SHORT_CODE').optional(),
        body('NAME').optional(),
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
            setContext+`CALL sp_countryMaster_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error",error)
                    return res.send({ "code": 400,  "message": "Failed to get country data." });
                }

               const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 10,
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
            `CALL sp_countryMaster_create(?,?,?,?,?,?)`,
            [
                data.SHORT_CODE,
                data.NAME,
                data.SEQ_NO,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                data.COUNTRY_CODE
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error",error)
                    return res.send({ "code": 400,  "message": "Failed to save country." });
                }

                const response = result[0][0];
                if (response.code !== 200) return res.send(response);
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new country ${data.NAME}.`;
                var logCategory = "country"

                let actionLog = {
                    "SOURCE_ID": response.COUNTRY_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                console.log("actionLog",actionLog)
                dbm.saveLog(actionLog, systemLog)


                res.send({ "code": 200,  "message": "Country information saved successfully..." });
            }
        );
    } catch (error) {
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
            `CALL sp_countryMaster_update(?,?,?,?,?,?,?)`,
            [
                ID,
                data.SHORT_CODE,
                data.NAME,
                data.SEQ_NO,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                data.COUNTRY_CODE
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error",error)
                    return res.send({ "code": 400,  "message": "Failed to update country." });
                }
                const r = result[0][0];
                if (r.code !== 200) return res.send(r);

                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the country ${data.NAME}.`;
                var logCategory = "country"

                let actionLog = {
                    "SOURCE_ID": ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                console.log("actionLog",actionLog)
                dbm.saveLog(actionLog, systemLog)

                res.send({ "code": 200,  "message": "Country information updated successfully..." });
            }
        );
    } catch (error) {
         console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const checkDuplicateCountry = async (data, isEdit, supportKey, connection) => {
    const results = await runQuery(
        `CALL sp_check_country_duplicate(?, ?, ?, ?, ?)`,
        [data.NAME, data.SEQ_NO, data.SHORT_CODE, data.ID || null, isEdit],
        supportKey,
        connection
    );
    
    const duplicates = results && results[0] ? results[0] : [];
    
    if (!duplicates.length) return null;

    if (duplicates.find(r => r.NAME === data.NAME)) return "Country name already exists";
    if (duplicates.find(r => r.SEQ_NO == data.SEQ_NO)) return "Sequence number already exists";
    if (duplicates.find(r => r.SHORT_CODE === data.SHORT_CODE)) return "Short code already exists";

    return "Duplicate record";
};

exports.importCountry = async (req, res) => {
    try {
        console.log("=== IMPORT COUNTRY API CALLED ===");
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);

        const supportKey = req.headers['supportkey'];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        console.log("Parsed Inputs:", { supportKey, COLUMN_JSON, EXCEL_FILE_NAME, EXCEL_MASTER_ID, IMPORT_TYPE });

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing parameter: EXCEL_FILE_NAME." });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        console.log("Total Rows Found:", jsonData.length);

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found in Excel.", EXCEL_MASTER_ID });

        res.status(200).json({ code: 200, message: "Import started. Processing in background...", EXCEL_MASTER_ID });

        let successCount = 0,
            skippedCount = 0,
            successDetails = [],
            skippedDetails = [],
            errorDetails = [],
            errorData = [],
            totalData = [];

        const chunkSize = 5;

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (let [index, row] of chunk.entries()) {
                const rowNumber = start + index + 2;
                
                console.log("--------------------------------------------------");
                console.log(`Row ${rowNumber} Data:`, row);

                let data = {};
                COLUMN_JSON.forEach(c => data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null);

                console.log("Mapped Data:", data);

                const isEdit = IMPORT_TYPE === "E";

                // VALIDATION LOGIC — BEFORE opening DB
                if (isEdit) {
                    if (!data.NAME || !data.SHORT_CODE) {
                        console.log("Skipping — missing required fields for UPDATE");
                        skippedCount++;
                        skippedDetails.push({ rowNumber: rowNumber, row, reason: "Missing required fields" });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing required fields" });
                        continue;
                    }
                } else {
                    if (!data.NAME || !data.SHORT_CODE) {
                        console.log("Skipping — missing required fields for INSERT");
                        skippedCount++;
                        skippedDetails.push({ rowNumber: rowNumber, row, reason: "Missing required fields" });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing required fields" });
                        continue;
                    }
                }

                // DUPLICATE CHECK REQUIRES DB
                const connection = mm.openConnection();
                console.log("DB Connection Opened");

                try {
                    const duplicateReason = await checkDuplicateCountry(data, isEdit, supportKey, connection);
                    console.log("Duplicate Result:", duplicateReason);

                    if (duplicateReason) {
                        console.log("Skipping due to duplicate");
                        skippedCount++;
                        skippedDetails.push({ rowNumber: rowNumber, row, reason: duplicateReason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: duplicateReason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // FIELD RULES
                    if (isEdit) {
                        data.IS_ACTIVE = data.IS_ACTIVE == 'Active' ? 1 : 0;

                        if (!data.ID) {
                            console.log("Skipping — ID missing for UPDATE");
                            skippedCount++;
                            skippedDetails.push({ rowNumber: rowNumber, row, reason: "ID required for update" });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "ID required for update" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Check if country exists by ID
                        const existing = await runQuery(
                            `CALL sp_get_country_by_id(?)`,
                            [data.ID],
                            supportKey,
                            connection
                        );
                        
                        const existingResult = existing && existing[0] ? existing[0] : [];
                        console.log("Existing Lookup:", existingResult);

                        if (!existingResult || !existingResult.length) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Country for ID '${data.ID}' does not exist`
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Country does not exist" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Update country using SP
                        await runQuery(
                            `CALL sp_update_country(?, ?, ?, ?, ?)`,
                            [data.ID, data.NAME, data.SEQ_NO, data.SHORT_CODE, data.IS_ACTIVE],
                            supportKey,
                            connection
                        );

                    } else {
                        // AUTO GENERATE SEQ_NO using SP
                        const seqRes = await runQuery(
                            `CALL sp_get_next_country_seq_no()`,
                            [],
                            supportKey,
                            connection
                        );
                        
                        const seqResult = seqRes && seqRes[0] ? seqRes[0] : [];
                        data.SEQ_NO = seqResult[0]?.NEXT_NO || 1;
                        
                        data.IS_ACTIVE = 1;
                        data.CLIENT_ID = 1;

                        console.log("Assigned Values:", { SEQ_NO: data.SEQ_NO, IS_ACTIVE: data.IS_ACTIVE });

                        // Insert country using SP
                        await runQuery(
                            `CALL sp_insert_country(?, ?, ?, ?, ?)`,
                            [data.NAME, data.SEQ_NO, data.SHORT_CODE, data.IS_ACTIVE, data.CLIENT_ID],
                            supportKey,
                            connection
                        );
                    }

                    mm.commitConnection(connection);
                    console.log("Commit Successful");

                    successCount++;
                    successDetails.push({ rowNumber: rowNumber, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    console.log("Row Error:", error);
                    mm.rollbackConnection(connection);
                    errorDetails.push({ rowNumber: rowNumber, error: error.message });
                    errorData.push({ rowNumber: rowNumber, row, error: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);
            console.log("Progress:", progress);

            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, { PROGRESS: progress, STATUS: "Processing" });
        }

        console.log("All Processing Completed");

        const response = {
            code: 200,
            message: "Country import process completed.",
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

        console.log("=== IMPORT COUNTRY FINISHED ===");

    } catch (error) {
        console.log("FATAL IMPORT ERROR:", error);
    }
};




