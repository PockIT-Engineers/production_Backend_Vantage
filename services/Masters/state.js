const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var stateMaster = "state_master";
var viewStateMaster = "view_" + stateMaster;
const xlsx = require('xlsx');
const excelMaster = require("../../modules/excelImportMaster");

function reqData(req) {
    var data = {
        COUNTRY_ID: req.body.COUNTRY_ID,
        NAME: req.body.NAME,
        SHORT_CODE: req.body.SHORT_CODE,
        CLIENT_ID: req.body.CLIENT_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO
    }
    return data;
}

exports.validate = function () {
    return [
        body('COUNTRY_ID').isInt().optional(),
        body('NAME').optional(),
        body('SHORT_CODE').optional(),
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
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_stateMaster_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get state count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 97,
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

exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_stateMaster_create(?,?,?,?,?,?,?,?)`,
            [
                data.COUNTRY_ID,
                data.NAME,
                data.SHORT_CODE,
                data.CLIENT_ID,
                data.IS_ACTIVE,
                data.SEQ_NO,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save state information..."
                    });
                }

                const resultData = results[0][0];
                if (resultData.code === 300) {
                    return res.status(200).json({
                        "code": 300,
                        "message": resultData.message
                    });
                }

                // MongoDB logging (keeping as is)
                var ACTION_DETAILS = `User ${userName} has added new state, ${data.NAME}`;
                var logCategory = "State";

                let actionLog = {
                    "SOURCE_ID": resultData.STATE_ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "State information saved successfully...",
                    "STATE_ID": resultData.STATE_ID
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(400).json({
            "code": 400,
            "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var id = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Handle empty SHORT_CODE (convert to null)
        if (data.SHORT_CODE === '') {
            data.SHORT_CODE = null;
        }

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_stateMaster_update(?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.COUNTRY_ID,
                data.NAME,
                data.SHORT_CODE,
                data.CLIENT_ID,
                data.IS_ACTIVE,
                data.SEQ_NO,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update state information."
                    });
                }

                const resultData = results[0][0];
                if (resultData.code === 300) {
                    return res.status(200).json({
                        "code": 300,
                        "message": resultData.message
                    });
                }

                // MongoDB logging (keeping as is)
                var ACTION_DETAILS = `User ${userName} has updated the details of ${data.NAME}`;
                var logCategory = "State";

                let actionLog = {
                    "SOURCE_ID": id,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "State information updated successfully...",
                    "STATE_ID": resultData.STATE_ID
                });
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
};


// Helper function to run stored procedures
const runSP = (spName, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        const placeholders = params.map(() => '?').join(',');
        const query = `CALL ${spName}(${placeholders})`;
        mm.executeDML(query, params, supportKey, connection, (err, results) => {
            if (err) {
                console.log("SP error", err);
                reject(err);
            }
            else resolve(results);
        });
    });
};

const checkDuplicateState = async (data, isEdit, supportKey, connection) => {
    const excludeId = isEdit ? data.ID : null;
    const duplicateResult = await runSP(
        'sp_check_state_duplicate',
        [data.COUNTRY_ID, data.NAME, data.SEQ_NO, data.SHORT_CODE || null, excludeId],
        supportKey,
        connection
    );
    const stateNameDup = duplicateResult[0] || [];
    const seqNoDup = duplicateResult[1] || [];
    const shortCodeDup = duplicateResult[2] || [];

    if (stateNameDup.length) return "State already exists";
    if (seqNoDup.length) return "Sequence number already exists";
    if (shortCodeDup.length) return "Short code already exists";

    return null;
};

exports.importState = async (req, res) => {
    console.log("=== STATE IMPORT API STARTED ===");
    console.log("Timestamp:", new Date().toISOString());

    try {
        const supportKey = req.headers['supportkey'];
        console.log("Support Key from headers:", supportKey ? "Present" : "Missing");
        console.log("Request body keys:", Object.keys(req.body));

        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;
        console.log("IMPORT_TYPE:", IMPORT_TYPE);
        console.log("EXCEL_MASTER_ID:", EXCEL_MASTER_ID);
        console.log("EXCEL_FILE_NAME:", EXCEL_FILE_NAME);

        if (!EXCEL_FILE_NAME) {
            console.log("ERROR: Missing EXCEL_FILE_NAME parameter");
            return res.status(400).json({ code: 400, message: "Missing parameter: EXCEL_FILE_NAME." });
        }

        const filePath = `./uploads/ExcelFiles/${EXCEL_FILE_NAME}`;
        console.log("Looking for file at path:", filePath);

        let workbook;
        try {
            workbook = xlsx.readFile(filePath);
            console.log("Excel file loaded successfully");
            console.log("Sheet names:", workbook.SheetNames);
        } catch (fileError) {
            console.log("ERROR: Failed to read Excel file:", fileError.message);
            return res.status(400).json({ code: 400, message: "Failed to read Excel file." });
        }

        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);
        console.log(`Excel data parsed. Total rows: ${jsonData.length}`);
        console.log("First row sample:", jsonData.length > 0 ? JSON.stringify(jsonData[0]) : "No data");

        if (!jsonData.length) {
            console.log("WARNING: No data found in Excel sheet");
            return res.status(200).json({ code: 200, message: "No data found in Excel.", EXCEL_MASTER_ID });
        }

        console.log("Sending initial response to client...");
        res.status(200).json({ code: 200, message: "Import started. Processing in background...", EXCEL_MASTER_ID });

        let successCount = 0
        let skippedCount = 0
        let successDetails = [];
        let errorDetails = [];
        let errorData = [];
        let skippedDetails = [];
        let totalData = [];
        const chunkSize = 5;

        console.log(`Processing ${jsonData.length} records in chunks of ${chunkSize}`);

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);
            console.log(`\n=== Processing chunk ${Math.floor(start / chunkSize) + 1}/${Math.ceil(jsonData.length / chunkSize)} ===`);
            console.log(`Chunk indices: ${start} to ${start + chunk.length - 1}`);

            for (const [index, row] of chunk.entries()) {
                const rowNumber = start + index + 2;
                console.log(`\n--- Processing row ${rowNumber} ---`);
                console.log("Row data:", JSON.stringify(row));

                const connection = mm.openConnection();
                console.log("Database connection opened");


                const data = {};
                console.log("COLUMN_JSON mapping:");
                COLUMN_JSON.forEach(c => {
                    data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                    console.log(`  ${c.EXCEL_FIELD} -> ${c.TABLE_FIELD}: ${data[c.TABLE_FIELD]}`);
                });

                console.log("Validating required fields...");
                console.log("NAME:", data.NAME);

                if (!data.NAME) {
                    console.log(`WARNING: Row ${rowNumber} skipped - Missing required fields`);
                    skippedCount++;
                    skippedDetails.push({ rowNumber, row, reason: "Missing required fields" });
                    totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing required fields" });
                    mm.rollbackConnection(connection);
                    console.log("Connection rolled back");
                    continue;
                }

                console.log("Required fields check passed");
                console.log("Checking for duplicates...");

                const isEdit = IMPORT_TYPE === "E";

                if (IMPORT_TYPE === "E") {
                    console.log("Edit mode - Setting IS_ACTIVE based on value:", data.IS_ACTIVE);
                    data.IS_ACTIVE = data.IS_ACTIVE == 'Active' ? 1 : 0;
                } else {
                    console.log("Add mode - Setting IS_ACTIVE to 1");
                    data.IS_ACTIVE = 1;
                }
                console.log("Is edit mode?", isEdit);
                if (!isEdit) {
                    // AUTO GENERATE SEQ_NO using SP
                    console.log("Getting next SEQ_NO...");
                    const seqNoResult = await runSP(
                        'sp_get_max_state_seq_no',
                        [],
                        supportKey,
                        connection
                    );
                    const seqRes = seqNoResult[0] || [];
                    data.SEQ_NO = seqRes[0].NEXT_NO;
                }

                console.log("Looking up country:", data.COUNTRY_NAME);
                const getCountryResult = await runSP(
                    'sp_get_country_by_name',
                    [data.COUNTRY_NAME],
                    supportKey,
                    connection
                );
                const getCountry = getCountryResult[0] || [];
                console.log("Country query result count:", getCountry.length);

                if (getCountry.length == 0) {
                    console.log(`ERROR: Country '${data.COUNTRY_NAME}' not found`);
                    skippedCount++;
                    skippedDetails.push({
                        rowNumber,
                        row,
                        reason: `'${data.COUNTRY_NAME}' country not exists`,
                    });
                    totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Country not exist" });
                    mm.rollbackConnection(connection);
                    console.log("Connection rolled back");
                    continue;
                }
                console.log("Country found:", getCountry[0]);
                data.COUNTRY_ID = getCountry[0].ID;

                const duplicateReason = await checkDuplicateState(data, isEdit, supportKey, connection);
                if (duplicateReason) {
                    console.log(`WARNING: Row ${rowNumber} skipped - Duplicate found: ${duplicateReason}`);
                    skippedCount++;
                    skippedDetails.push({ rowNumber, row, reason: duplicateReason });
                    totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: duplicateReason });
                    mm.rollbackConnection(connection);
                    console.log("Connection rolled back");
                    continue;
                }
                console.log("No duplicates found");

                try {
                    data.CLIENT_ID = 1;
                    console.log("Assigned COUNTRY_ID:", data.COUNTRY_ID);
                    delete data.COUNTRY_NAME;
                    console.log("Final IS_ACTIVE value:", data.IS_ACTIVE);

                    if (isEdit) {
                        console.log("Processing EDIT operation");

                        if (!data.ID) {
                            console.log(`ERROR: Row ${rowNumber} - ID required for update`);
                            skippedCount++;
                            skippedDetails.push({ rowNumber, row, reason: "ID required for update" });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "ID required for update" });
                            mm.rollbackConnection(connection);
                            console.log("Connection rolled back");
                            continue;
                        }
                        console.log("Update ID:", data.ID);

                        // Check if state exists using SP
                        const existingResult = await runSP(
                            'sp_get_state_by_id',
                            [data.ID],
                            supportKey,
                            connection
                        );
                        const existing = existingResult[0] || [];
                        console.log("Existing record check:", existing.length > 0 ? "Found" : "Not found");

                        if (existing && existing.length == 0) {
                            console.log(`ERROR: State with ID '${data.ID}' does not exist`);
                            skippedDetails.push({
                                rowNumber,
                                row,
                                reason: `State '${data.NAME}' for ID '${data.ID}' does not exists`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "State Does not exists" });
                            skippedCount++;
                            mm.rollbackConnection(connection);
                            console.log("Connection rolled back");
                            continue;
                        }

                        console.log("Updating state record...");
                        await runSP(
                            'sp_update_state',
                            [data.ID, data.NAME, data.SEQ_NO, data.SHORT_CODE, mm.getSystemDate(), data.IS_ACTIVE],
                            supportKey,
                            connection
                        );
                        console.log("Update successful");

                    } else {
                        console.log("Processing ADD operation");
                        console.log("Assigned Values:", {
                            SEQ_NO: data.SEQ_NO,
                            NAME: data.NAME,
                            COUNTRY_ID: data.COUNTRY_ID,
                            CLIENT_ID: data.CLIENT_ID,
                            IS_ACTIVE: data.IS_ACTIVE
                        });

                        const insertResult = await runSP(
                            'sp_insert_state',
                            [data.NAME, data.SEQ_NO, data.SHORT_CODE || null, data.COUNTRY_ID, 1, data.CLIENT_ID],
                            supportKey,
                            connection
                        );
                        const insertId = insertResult[0][0].insertId;
                        console.log("Insert successful, ID:", insertId);

                        // Add action log
                        console.log("Creating action log...");
                        const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} added new state: ${data.NAME}`;
                        console.log("Action details:", ACTION_DETAILS);

                        const logCategory = "state";
                        const actionLog = {
                            SOURCE_ID: insertId,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: ACTION_DETAILS,
                            CATEGORY: logCategory,
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            supportKey: 0
                        };
                        console.log("Action log object:", JSON.stringify(actionLog));

                        dbm.saveLog(actionLog, systemLog);
                        console.log("Action log saved");
                    }

                    mm.commitConnection(connection);
                    console.log("Transaction committed");
                    successCount++;
                    successDetails.push({ rowNumber, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    console.log(`Row ${rowNumber} processed SUCCESSFULLY`);

                } catch (err) {
                    console.log(`ERROR in row ${rowNumber}:`, err.message);
                    console.log("Error stack:", err.stack);
                    console.log("Connection rolled back due to error");
                    errorDetails.push({ rowNumber, error: err.message });
                    errorData.push({ rowNumber, row, error: err.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
                    mm.rollbackConnection(connection);
                    continue;
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);
            console.log(`Progress update: ${progress}%`);

            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
            console.log("Progress saved to database");

        }

        console.log("\n=== IMPORT PROCESS COMPLETED ===");
        console.log(`Total records: ${jsonData.length}`);
        console.log(`Successful: ${successCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Failed: ${errorDetails.length}`);

        const response = {
            code: 200,
            message: "State import process completed.",
            totalRecords: jsonData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: errorDetails.length,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            errorData,
            totalData
        };

        console.log("Final response object prepared");
        console.log("Updating final status in database...");

        const fs = require("fs");
        const path = require("path");

        // unique file name
        const fileName = `${EXCEL_MASTER_ID}.json`;
        const filePathn = path.join(
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

        // write JSON file (pretty format for readability)
        fs.writeFileSync(filePathn, JSON.stringify(response, null, 2), "utf8");

        console.log("Database updated successfully");
        console.log("=== STATE IMPORT API FINISHED ===");

    } catch (error) {
        console.log("\n=== TOP-LEVEL ERROR ===");
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);
        console.log("Full error object:", error);

        // Update Excel Master with error status
        const EXCEL_MASTER_ID = req.body.id;
        if (EXCEL_MASTER_ID) {
            try {
                await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                    STATUS: "Failed",
                    PROGRESS: 0,
                    RESPONSE: JSON.stringify({ error: error.message })
                });
                console.log("Error status saved to database");
            } catch (dbError) {
                console.log("Failed to update error status in database:", dbError.message);
            }
        }

        console.log("=== STATE IMPORT API ENDED WITH ERROR ===");
    }
};
