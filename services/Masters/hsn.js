const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
const applicationkey = process.env.APPLICATION_KEY;
var hsnMaster = "hsn_master";
var viewHsnMaster = "view_" + hsnMaster;


function reqData(req) {

    var data = {
        DESCRIPTION: req.body.DESCRIPTION,
        CODE: req.body.CODE,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        SEQ_NO: req.body.SEQ_NO
    }
    return data;
}

exports.validate = function () {
    return [
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
                setContext + 'CALL sp_hsnMaster_get()',
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.error(error);
                        return res.status(400).json({
                            "code": 400,
                            "message": 'Failed to fetch HSN data'
                        });
                    }
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];

                    return res.status(200).json({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 146,
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult
                    });
                }
            );
        }
        else {
            res.status(400).json({
                "message": "Invalid filter parameter.",
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            "message": 'Something went wrong'
        });
    }
};

exports.create = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    const {
        CODE,
        DESCRIPTION,
        STATUS,
        CLIENT_ID,
        SEQ_NO
    } = req.body;

    try {
        mm.executeQueryData(
            'CALL sp_hsnMaster_create(?,?,?,?,?)',
            [
                CODE,
                DESCRIPTION,
                STATUS,
                CLIENT_ID,
                SEQ_NO
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": 'Failed to save HSN information'
                    });
                }

                const response = results[0][0];
                if (response.code != 200) {
                    return res.status(200).json(response);
                }
                else {
                    console.log("response",response)
                    const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has added a new HSN code.`;
                    const logCategory = "HSN";

                    let actionLog = {
                        SOURCE_ID: response.DATA,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: ACTION_DETAILS,
                        CATEGORY: logCategory,
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: 0
                    };

                    dbm.saveLog(actionLog, systemLog);
                    return res.status(200).json({
                        "code": 200,
                        "message": "HSN information saved successfully."
                    });
                }


            }
        );
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({
            "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    const {
        ID,
        CODE,
        DESCRIPTION,
        STATUS,
        CLIENT_ID,
        SEQ_NO
    } = req.body;

    try {
        mm.executeQueryData(
            'CALL sp_hsnMaster_update(?,?,?,?,?,?)',
            [
                ID,
                CODE,
                DESCRIPTION,
                STATUS,
                CLIENT_ID,
                SEQ_NO
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": 'Failed to update HSN information'
                    });
                }

                const response = results[0][0];

                if (response.code === 200) {
                    const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of HSN code.`;
                    const logCategory = "HSN";

                    let actionLog = {
                        SOURCE_ID: ID,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: ACTION_DETAILS,
                        CATEGORY: logCategory,
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: 0
                    };

                    dbm.saveLog(actionLog, systemLog);
                }

                return res.status(200).json({
                    "code": response.code,
                    "message": response.message
                });
            }
        );
    } catch (error) {
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        return res.status(500).json({
            "message": "Something went wrong."
        });
    }
};


const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, results) => {
            if (error) {
                reject(error);
                mm.rollbackConnection(connection);
            }
            else resolve(results);
        });
    });
};

const checkHSNDuplicate = async (CODE, SEQ_NO, ID, isEdit, supportKey, connection) => {
    const results = await runQuery(
        `CALL sp_check_hsn_duplicate(?, ?, ?, ?)`,
        [CODE, SEQ_NO, ID || null, isEdit],
        supportKey,
        connection
    );

    const duplicates = results && results[0] ? results[0] : [];

    if (!duplicates.length) return null;

    const others = isEdit ? duplicates.filter(r => r.ID != ID) : duplicates;

    const seqConflict = others.find(r => r.SEQ_NO == SEQ_NO);
    if (seqConflict) return "Duplicate SEQ_NO";

    const codeConflict = others.find(
        r => String(r.CODE).trim().toLowerCase() === String(CODE).trim().toLowerCase()
    );
    if (codeConflict) return "Duplicate CODE";

    return null;
};

exports.importHSN = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME || !COLUMN_JSON)
            return res.status(400).json({ code: 400, message: "Missing parameter: EXCEL_FILE_NAME or COLUMN_JSON." });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found in the Excel file." });

        res.status(200).json({
            code: 200,
            message: "HSN Import started. Processing in background...",
            EXCEL_MASTER_ID: EXCEL_MASTER_ID
        });

        let successCount = 0;
        let skippedCount = 0;
        let successDetails = [];
        let errorDetails = [];
        let errorData = [];
        let skippedDetails = [];
        let totalData = [];
        const chunkSize = 50;
        let total = jsonData.length;
        const isEdit = IMPORT_TYPE === "E";

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (const [index, row] of chunk.entries()) {
                const connection = mm.openConnection();
                const rowNumber = start + index + 2;

                try {
                    let data = {};

                    COLUMN_JSON.forEach(c => {
                        data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                    });
                    
                    if (isEdit) {
                        data.STATUS = data.STATUS == 'Active' ? 1 : 0;
                    } else {
                        data.STATUS = 1;
                    }
                    
                    data.CLIENT_ID = 1;

                    if (!data.CODE) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: "Missing CODE",
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing CODE" });
                        mm.rollbackConnection(connection);
                        continue;
                    }
                    
                    if (!data.SEQ_NO) {
                        // AUTO GENERATE SEQ_NO using SP
                        const seqRes = await runQuery(
                            `CALL sp_get_next_hsn_seq_no()`,
                            [],
                            supportKey,
                            connection
                        );

                        const seqResult = seqRes && seqRes[0] ? seqRes[0] : [];
                        data.SEQ_NO = seqResult[0]?.NEXT_NO || 1;
                        console.log("Assigned Values:", { SEQ_NO: data.SEQ_NO });
                    }

                    const dupMsg = await checkHSNDuplicate(
                        data.CODE,
                        data.SEQ_NO,
                        data.ID,
                        isEdit,
                        supportKey,
                        connection
                    );

                    if (dupMsg) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: dupMsg,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: dupMsg });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    if (isEdit) {
                        // EDIT MODE
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: "Missing ID for update",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing ID for update" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Check if HSN exists using SP
                        const getData = await runQuery(
                            `CALL sp_get_hsn_by_id(?)`,
                            [data.ID],
                            supportKey,
                            connection
                        );

                        const existingResult = getData && getData[0] ? getData[0] : [];

                        if (!existingResult.length) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `HSN does not exist for ID ${data.ID}`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "HSN does not exist for ID " + data.ID });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Update HSN using SP
                        await runQuery(
                            `CALL sp_update_hsn(?, ?, ?, ?, ?)`,
                            [data.ID, data.CODE, data.SEQ_NO, data.DESCRIPTION || null, data.STATUS],
                            supportKey,
                            connection
                        );

                        mm.commitConnection(connection);

                        // System log (MongoDB - stays in API)
                        const logDetails = `HSN Code updated from Excel Import`;
                        dbm.saveLog({
                            SOURCE_ID: data.ID,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: logDetails,
                            CATEGORY: "HSN",
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData?.data?.UserData[0]?.USER_ID,
                            supportKey: 0
                        }, systemLog);

                        successCount++;
                        successDetails.push({ rowNumber: rowNumber, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }
                    else {
                        // INSERT MODE
                        data.STATUS = 1;

                        // Insert HSN using SP
                        const insertRes = await runQuery(
                            `CALL sp_insert_hsn(?, ?, ?, ?, ?)`,
                            [data.CODE, data.SEQ_NO, data.DESCRIPTION || null, data.STATUS, data.CLIENT_ID],
                            supportKey,
                            connection
                        );

                        const insertId = insertRes && insertRes[0] && insertRes[0][0] ? 
                                        insertRes[0][0].insertId : insertRes[0]?.insertId;

                        mm.commitConnection(connection);

                        // System log (MongoDB - stays in API)
                        const logDetails = `HSN Code added from Excel Import`;
                        dbm.saveLog({
                            SOURCE_ID: insertId,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: logDetails,
                            CATEGORY: "HSN",
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData?.data?.UserData[0]?.USER_ID,
                            supportKey: 0
                        }, systemLog);

                        successCount++;
                        successDetails.push({ rowNumber: rowNumber, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }

                } catch (error) {
                    mm.rollbackConnection(connection);
                    console.error(`Row ${rowNumber} failed:`, error.message);
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
            message: "HSN import process completed.",
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
        console.log(error);
        return res.status(500).json({
            code: 500,
            message: "Internal Server Error",
            reason: error.message
        });
    }
};
