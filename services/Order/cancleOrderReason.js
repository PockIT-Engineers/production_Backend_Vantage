const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const systemLog = require("../../modules/systemLog");
const dbm = require('../../utilities/dbMongo');
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
const applicationkey = process.env.APPLICATION_KEY;
var cancleOrderReasonMaster = "cancle_order_reason_master";
var viewCancleOrderReasonMaster = "view_" + cancleOrderReasonMaster;

// Conversion Done 
function reqData(req) {

    var data = {
        REASON: req.body.REASON,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        TYPE: req.body.TYPE,
        REASON_FOR: req.body.REASON_FOR,
        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [

        body('REASON').exists(),
        body('TYPE').exists(),
        body('ID').optional(),


    ]
}

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];

    let pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    let pageSize = req.body.pageSize ? req.body.pageSize : '';

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    const safeFilter = filter.replace(/'/g, "\\'");

    if (mm.sanitizeFilter(filter) !== "0") {
        return res.status(400).json({
            code: 400,
            message: "Invalid filter parameter."
        });
    }

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE  = ${pageSize || 0};
        SET @v_SORT_KEY   = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER     = '${safeFilter}';
    `;

    try {
        mm.executeQueryData(
            setContext + `CALL sp_cancelOrderReason_get();`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to get cancel order reason information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                res.status(200).json({
                    code: 200,
                    message: "success",
                    TAB_ID: 144,
                    count: countResult[0] ? countResult[0].cnt : 0,
                    data: dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            code: 422,
            message: errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_cancelOrderReason_create(?,?,?,?,?)`,
            [
                data.REASON,
                data.TYPE,
                data.REASON_FOR,
                data.IS_ACTIVE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to save cancel order reason."
                    });
                }

                const r = result[0][0];

                if (r.code !== 200) {
                    return res.status(200).json(r);
                }

                /* Optional: Action Log */
                const ACTION_DETAILS =
                    `User ${req.body.authData.data.UserData[0].NAME} has created a new cancel order reason.`;

                let actionLog = {
                    SOURCE_ID: r.CANCEL_REASON_ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "cancleOrderReason",
                    CLIENT_ID: data.CLIENT_ID,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: supportKey
                };
                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    code: 200,
                    message: "Cancel order reason saved successfully."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            code: 422,
            message: errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_cancelOrderReason_update(?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.REASON,
                data.TYPE,
                data.REASON_FOR,
                data.IS_ACTIVE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to update cancel order reason."
                    });
                }

                const r = result[0][0];

                if (r.code !== 200) {
                    return res.status(200).json(r);
                }

                /* Optional Action Log */
                const ACTION_DETAILS =
                    `User ${req.body.authData.data.UserData[0].NAME} has updated the details of cancel order reason.`;

                let actionLog = {
                    SOURCE_ID: r.CANCEL_REASON_ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "cancleOrderReason",
                    CLIENT_ID: data.CLIENT_ID,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: supportKey
                };
                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    code: 200,
                    message: "Cancel order reason updated successfully."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
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

exports.importCancleOrderReason = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "Excel file is empty" });

        res.status(200).json({
            code: 200,
            message: "Cancel Order Reason import started. Processing in background...",
            EXCEL_MASTER_ID: EXCEL_MASTER_ID
        });

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

            for (let index = 0; index < chunk.length; index++) {
                const row = chunk[index];
                const rowNumber = start + index + 2;
                const connection = mm.openConnection()
                try {
                    let data = {};
                    COLUMN_JSON.forEach(c => {
                        data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                    });
                    console.log("data", data)

                    if (data.TYPE !== undefined) {
                        data.TYPE = data.TYPE == 'Cancellation' ? "CO" : "OR";
                    }

                    if (isEdit) {
                        data.IS_ACTIVE = data.IS_ACTIVE == 'Active' ? 1 : 0;
                    } else {
                        data.IS_ACTIVE = 1;
                    }
                    data.CLIENT_ID = 1
                    data.REASON_FOR = 'S'

                    if (!isEdit) {
                        // Check if reason already exists using SP
                        const getDataResult = await runSP(
                            'sp_check_cancel_reason_exists',
                            [data.REASON, null, data.TYPE],
                            supportKey,
                            connection
                        );

                        const getData = getDataResult[0] || [];

                        if (getData.length) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: `Cancel order reason ${data.REASON} already exists.`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Cancel order reason " + data.REASON + " already exists. " });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        data.IS_ACTIVE = 1

                        // Insert using SP
                        await runSP(
                            'sp_insert_cancel_reason',
                            [data.REASON, data.TYPE, data.IS_ACTIVE, data.CLIENT_ID, data.REASON_FOR],
                            supportKey,
                            connection
                        );

                        mm.commitConnection(connection)
                        successCount++;
                        successDetails.push({ rowNumber: index + 2, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }
                    else {
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: "ID is required for update",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "ID is required for update" });
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Check if record exists using SP
                        const getDataResult = await runSP(
                            'sp_get_cancel_reason_by_id',
                            [data.ID],
                            supportKey,
                            connection
                        );

                        const getData = getDataResult[0] || [];

                        if (!getData.length) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: `Cancel order reason does not exist for ID ${data.ID}`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Cancel order reason does not exist for ID " + data.ID + " " });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        const getexistDataResult = await runSP(
                            'sp_check_cancel_reason_exists',
                            [data.REASON, data.ID, data.TYPE],
                            supportKey,
                            connection
                        );

                        const getexistData = getexistDataResult[0] || [];

                        if (getexistData.length > 0) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: `Cancel order reason ${data.REASON} already exists.`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Cancel order reason " + data.REASON + " already exists. " });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Update using SP
                        await runSP(
                            'sp_update_cancel_reason',
                            [data.ID, data.REASON, data.TYPE, data.IS_ACTIVE, data.CLIENT_ID, data.REASON_FOR, mm.getSystemDate()],
                            supportKey,
                            connection
                        );

                        mm.commitConnection(connection)
                        successCount++;
                        successDetails.push({ rowNumber: index + 2, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }
                } catch (err) {
                    mm.rollbackConnection(connection)
                    console.error(`Row ${index + 2} failed:`, err.message);
                    errorDetails.push({ rowNumber: index + 2, reason: err.message });
                    errorData.push({ rowNumber: index + 2, row, reason: err.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
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
            message: "Cancel Order Reason import process completed.",
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