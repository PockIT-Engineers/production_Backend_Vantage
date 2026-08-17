const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
const applicationkey = process.env.APPLICATION_KEY;
var unitMaster = "unit_master";
var viewUnitMaster = "view_" + unitMaster;

function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        SHORT_CODE: req.body.SHORT_CODE,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('SHORT_CODE').optional(),
        body('SEQ_NO').isInt().optional(),
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
                setContext+`CALL sp_unitMaster_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                             "message": "Failed to get unit information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.send({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 128,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.send({
                "code": 400,
                 "message": "Invalid filter parameter."
            });
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
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
        res.send({
            "code": 422,
             "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(
                `CALL sp_unitMaster_create(?,?,?,?,?)`,
                [
                    data.NAME,
                    data.SHORT_CODE,
                    data.IS_ACTIVE || '1',
                    data.SEQ_NO || 0,
                    data.CLIENT_ID || 1
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                             "message": "Failed to save unit information..."
                        });
                    }
                    else {
                        const r = results[0][0];

                        if (r.code == 200) {
                            // Save action log
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new unit named ${data.NAME}.`;
                            var logCategory = "unit";

                            let actionLog = {
                                "SOURCE_ID": r.ID,
                                "LOG_DATE_TIME": mm.getSystemDate(),
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                "supportKey": 0
                            };

                            dbm.saveLog(actionLog, systemLog);
                            res.send({
                                "code": 200,
                                 "message": r.message,
                            });
                        } else {
                            res.send({
                                "code": r.code,
                                 "message": r.message
                            });
                        }
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                 "message": "Something went wrong."
            });
        }
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var ID = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
             "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(
                `CALL sp_unitMaster_update(?,?,?,?,?,?)`,
                [
                    ID,
                    data.NAME,
                    data.SHORT_CODE,
                    data.IS_ACTIVE,
                    data.SEQ_NO,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                             "message": "Failed to update unit information."
                        });
                    }
                    else {
                        const r = results[0][0];

                        if (r.code == 200) {
                            // Save action log
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the unit ${data.NAME}.`;
                            var logCategory = "unit";

                            let actionLog = {
                                "SOURCE_ID": ID,
                                "LOG_DATE_TIME": mm.getSystemDate(),
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                "supportKey": 0
                            };

                            dbm.saveLog(actionLog, systemLog);
                            res.send({
                                "code": 200,
                                 "message": r.message,
                            });
                        } else {
                            res.send({
                                "code": r.code,
                                 "message": r.message
                            });
                        }
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "code": 500,
                 "message": "Something went wrong."
            });
        }
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

const checkUnitDuplicate = async (SHORT_CODE, SEQ_NO, NAME, ID, isEdit, supportKey, connection) => {
    const excludeId = isEdit ? ID : null;
    const duplicateResult = await runSP(
        'sp_check_unit_duplicate',
        [SHORT_CODE, SEQ_NO, NAME, excludeId],
        supportKey,
        connection
    );

    const results = duplicateResult[0] || [];

    if (!results.length) return null;

    const others = isEdit ? results.filter(r => r.ID != ID) : results;

    if (!others.length) return null;

    if (others.find(r => r.SEQ_NO == SEQ_NO))
        return { code: 304, message: "Sequence No Already Exist" };

    if (others.find(r => r.NAME?.trim().toLowerCase() === NAME?.trim().toLowerCase()))
        return { code: 301, message: "Unit Name Already Exist" };

    if (others.find(r => r.SHORT_CODE === SHORT_CODE))
        return { code: 303, message: "Short Code Already Exist" };

    return null;
};

exports.importUnit = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing parameter: EXCEL_FILE_NAME." });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found in Excel file." });

        res.status(200).json({ code: 200, message: "Unit Import started. Processing in background..." });

        let successCount = 0;
        let skippedCount = 0;
        let successDetails = [];
        let errorDetails = [];
        let errorData = [];
        let skippedDetails = [];
        let totalData = [];
        const chunkSize = 5;
        let total = jsonData.length;

        const isEdit = IMPORT_TYPE === "E";

        for (let start = 0; start < jsonData.length; start += chunkSize) {

            const chunk = jsonData.slice(start, start + chunkSize);

            for (const [index, row] of chunk.entries()) {
                const rowNumber = start + index + 2;
                const connection = mm.openConnection()
                try {
                    let data = {};

                    COLUMN_JSON.forEach(c => {
                        data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                    });

                    if (!data.SHORT_CODE || !data.SEQ_NO || !data.NAME) {
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `Missing required fields`,
                        });
                        skippedCount++;
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing required fields" });
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    const duplicateReason = await checkUnitDuplicate(
                        data.SHORT_CODE,
                        data.SEQ_NO,
                        data.NAME,
                        data.ID,
                        isEdit,
                        supportKey,
                        connection
                    );

                    if (duplicateReason) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: duplicateReason.message || duplicateReason,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: duplicateReason.message || duplicateReason });
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    if (isEdit) {
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: `Missing ID for update`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing ID for update" });
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Check if unit exists using SP
                        const getDataResult = await runSP(
                            'sp_get_unit_by_id',
                            [data.ID],
                            supportKey,
                            connection
                        );
                        const getData = getDataResult[0] || [];

                        if (!getData.length) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: `Unit does not exist for ID ${data.ID}`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Unit does not exist for ID " + data.ID + " " });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Update unit using SP
                        await runSP(
                            'sp_update_unit',
                            [data.ID, data.SHORT_CODE, data.SEQ_NO, data.NAME, data.DESCRIPTION, data.IS_ACTIVE, data.CLIENT_ID || 1, mm.getSystemDate()],
                            supportKey,
                            connection
                        );

                        dbm.saveLog({
                            SOURCE_ID: data.ID,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: "Unit updated from Excel import",
                            CATEGORY: "unit",
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            supportKey: 0
                        }, systemLog);
                        mm.commitConnection(connection)
                        successCount++;
                        successDetails.push({ rowNumber: index + 2, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }
                    else {
                        // Insert unit using SP
                        const insertResult = await runSP(
                            'sp_insert_unit',
                            [data.SHORT_CODE, data.SEQ_NO, data.NAME, data.DESCRIPTION, data.IS_ACTIVE || 1, data.CLIENT_ID || 1],
                            supportKey,
                            connection
                        );
                        const insertId = insertResult[0][0].insertId;

                        dbm.saveLog({
                            SOURCE_ID: insertId,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: "Unit created from Excel import",
                            CATEGORY: "unit",
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            supportKey: 0
                        }, systemLog);
                        mm.commitConnection(connection)
                        successCount++;
                        successDetails.push({ rowNumber: index + 2, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }

                } catch (error) {
                    mm.rollbackConnection(connection)
                    errorDetails.push({ rowNumber: index + 2, reason: error.message });
                    errorData.push({ rowNumber: index + 2, data: row, reason: error.message });
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
            message: "Unit import process completed.",
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

    } catch (error) {
        console.log(error);
    }
};