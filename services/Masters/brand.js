const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
const applicationkey = process.env.APPLICATION_KEY;
var brandMaster = "brand_master";
var viewBrandMaster = "view_" + brandMaster;

function reqData(req) {
    var data = {
        BRAND_NAME: req.body.BRAND_NAME,
        SHORT_CODE: req.body.SHORT_CODE,
        SEQUENCE_NO: req.body.SEQUENCE_NO,
        IS_POPULAR: req.body.IS_POPULAR ? '1' : '0',
        BRAND_IMAGE: req.body.BRAND_IMAGE,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('BRAND_NAME', ' parameter missing').exists(),
        body('SHORT_CODE', ' parameter missing').exists(),
        body('SEQUENCE_NO').isInt(), body('ID').optional(),
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
        if (IS_FILTER_WRONG != "0") {
            return res.status(400).json({
                 "message": "Invalid filter parameter."
            });
        }

        mm.executeQueryData(
            setContext + 'CALL sp_brandMaster_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({"code":400,
                         "message": "Failed to get brand information."
                    });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 180,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
             "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        const data = reqData(req);

        mm.executeQueryData(
            'CALL sp_brandMaster_create(?,?,?,?,?,?,?)',
            [
                data.BRAND_NAME,
                data.SHORT_CODE,
                data.SEQUENCE_NO,
                data.IS_POPULAR,
                data.BRAND_IMAGE,
                data.STATUS,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to save brand information..."
                    });
                }

                const response = results[0][0];

                return res.status(200).json({
                    "code": response.code,
                     "message": response.message
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
             "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
             "message": errors.errors
        });
    }

    try {
        const data = reqData(req);

        mm.executeQueryData(
            'CALL sp_brandMaster_update(?,?,?,?,?,?,?,?)',
            [
                req.body.ID,
                data.BRAND_NAME,
                data.SHORT_CODE,
                data.SEQUENCE_NO,
                data.IS_POPULAR,
                data.BRAND_IMAGE,
                data.STATUS,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to update brand information."
                    });
                }

                const response = results[0][0];

                return res.status(200).json({
                    "code": response.code,
                     "message": response.message
                });
            }
        );
    } catch (error) {
        console.log("error", error)
        res.status(500).json({
             "message": "Something went wrong."
        });
    }
};

exports.getList = (req, res) => {
    const ID = req.params.id;
    const supportKey = req.headers['supportkey'];

    var pageIndex = req.params.pageIndex ? req.params.pageIndex : '';
    var pageSize = req.params.pageSize ? req.params.pageSize : '';
    let sortKey = req.params.sortKey ? req.params.sortKey : 'ID';
    let sortValue = req.params.sortValue ? req.params.sortValue : 'DESC';
    let filter = req.params.filter ? req.params.filter : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_ID = ${ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    try {
        if (IS_FILTER_WRONG != "0") {
            return res.status(400).json({
                 "message": "Invalid filter parameter."
            });
        }

        mm.executeQueryData(
            setContext + 'CALL sp_brandMaster_getById()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({"code":400,
                         "message": "Failed to get brand information."
                    });
                }

               const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 180,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
             "message": "Something went wrong."
        });
    }
};

const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (err, results) => {
            if (err) {
                console.log("err", err);
                mm.rollbackConnection(connection);
                reject(err);
            }
            else resolve(results);
        });
    });
};

exports.importBrand = async (req, res) => {
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
            message: "Brand import started. Processing in background..."
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

            for (let i = 0; i < chunk.length; i++) {
                const connection = mm.openConnection();
                const row = chunk[i];
                const rowNumber = start + i + 2;

                try {
                    let data = {};
                    COLUMN_JSON.forEach(c => {
                        data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                    });

                    if (!data.SHORT_CODE) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: "SHORT_CODE is required"
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "SHORT_CODE is required" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // Check duplicate using SP
                    const dupResult = await runQuery(
                        `CALL sp_check_brand_duplicate(?)`,
                        [data.SHORT_CODE],
                        supportKey,
                        connection
                    );

                    const duplicates = dupResult && dupResult[0] ? dupResult[0] : [];

                    if (duplicates.length) {
                        if (!(isEdit && duplicates[0].ID == data.ID)) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: "Short code already exists"
                            });
                            totalData.push({
                                ...row,
                                IMPORT_STATUS: "Duplicate",
                                reason: "Short code already exists"
                            });
                            mm.rollbackConnection(connection);
                            continue;
                        }
                    }
                    
                    if (!isEdit) {
                        // Insert using SP
                        const insertResult = await runQuery(
                            `CALL sp_insert_brand(?, ?, ?, ?, ?, ?)`,
                            [
                                data.NAME,
                                data.SHORT_CODE,
                                data.DESCRIPTION,
                                data.IS_ACTIVE || 1,
                                data.CLIENT_ID || 1,
                                data.ORG_ID || 1
                            ],
                            supportKey,
                            connection
                        );
                        
                        mm.commitConnection(connection);
                        successCount++;
                        successDetails.push({ rowNumber: rowNumber, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Inserted" });
                    } else {
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: "ID is required for update"
                            });
                            totalData.push({
                                ...row,
                                IMPORT_STATUS: "Skipped",
                                reason: "ID is required for update"
                            });
                            mm.rollbackConnection(connection);
                            continue;
                        }
                        
                        // Check if brand exists using SP
                        const getDataResult = await runQuery(
                            `CALL sp_get_brand_by_id(?)`,
                            [data.ID],
                            supportKey,
                            connection
                        );
                        
                        const getData = getDataResult && getDataResult[0] ? getDataResult[0] : [];
                        
                        if (!getData.length) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Brand does not exist for ID ${data.ID}`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Brand does not exist for ID " + data.ID + " " });
                            mm.rollbackConnection(connection);
                            continue;
                        }
                        
                        // Update using SP
                        await runQuery(
                            `CALL sp_update_brand(?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.ID,
                                data.NAME,
                                data.SHORT_CODE,
                                data.DESCRIPTION,
                                data.IS_ACTIVE || 1,
                                data.CLIENT_ID || 1,
                                data.ORG_ID || 1,
                                mm.getSystemDate()
                            ],
                            supportKey,
                            connection
                        );
                        
                        mm.commitConnection(connection);
                        successCount++;
                        successDetails.push({ rowNumber: rowNumber, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }

                } catch (err) {
                    mm.rollbackConnection(connection);
                    console.error(`Row ${rowNumber} failed:`, err.message);
                    errorDetails.push({ rowNumber: rowNumber, reason: err.message });
                    errorData.push({ rowNumber: rowNumber, data: row, reason: err.message });
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
            message: "Brand import process completed.",
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
            error: error.message
        });
    }
};
