const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
var CustomerEmailMapping = "customer_email_mapping";
var viewCustomerEmailMapping = "view_" + CustomerEmailMapping;
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')

function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        EMAIL_ID: req.body.EMAIL_ID,
        PRICE_RANGE: req.body.PRICE_RANGE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').exists(),
        body('PRICE_RANGE').exists(),
        body('EMAIL_ID').exists(),
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
        return res.status(400).json({ "code":400,  "message":'Invalid filter parameter.' });
    }

    try {
        mm.executeQueryData(
            setContext+'CALL sp_customerEmailMapping_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code":400,  "message": error.message });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 217,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code":500,  "message":'Something went wrong' });
    }
};

exports.create = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const data = reqData(req);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            'CALL sp_customerEmailMapping_create(?,?,?,?,?)',
            [
                data.CUSTOMER_ID,
                data.EMAIL_ID,
                data.PRICE_RANGE,
                data.IS_ACTIVE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log("error",error)
                    return res.status(400).json({ "code":400,  "message": error.message });
                }

                const response = result[0][0];

                dbm.saveLog({
                    SOURCE_ID: response.ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `${req.body.authData.data.UserData[0].NAME} has created customer email mapping.`,
                    CATEGORY: 'CustomerEmailMapping',
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID
                }, systemLog);

                res.json(response);
            }
        );
    } catch (error){
        console.log("Error in catch", error)
        res.status(500).json({ "code":500,  "message":'Something went wrong' });
    }
};

exports.update = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const data = reqData(req);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            'CALL sp_customerEmailMapping_update(?,?,?,?,?)',
            [
                req.body.ID,
                data.CUSTOMER_ID,
                data.EMAIL_ID,
                data.PRICE_RANGE,
                data.IS_ACTIVE
            ],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code":400,  "message": error.message });
                }

                dbm.saveLog({
                    SOURCE_ID: req.body.ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `${req.body.authData.data.UserData[0].NAME} has updated customer email mapping.`,
                    CATEGORY: 'CustomerEmailMapping',
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID
                }, systemLog);

                res.json(result[0][0]);
            }
        );
    } catch (error){
        console.log("Error in catch", error)
        res.status(500).json({ "code":500,  "message":'Something went wrong' });
    }
};

exports.addBulk = async (req, res) => {

    const supportKey = req.headers['supportkey'];
    const {
        CUSTOMER_ID,
        data,
        CLIENT_ID
    } = req.body;

    if (!Array.isArray(data)) {
        return res.status(400).json({
            "code": 400,
             "message": 'data must be an array'
        });
    }

    try {
        mm.executeQueryData(
            'CALL sp_customerEmailMapping_bulk(?,?,?)',
            [
                CUSTOMER_ID,
                JSON.stringify(data),
                CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": error.message
                    });
                }

                dbm.saveLog({
                    SOURCE_ID: CUSTOMER_ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `${req.body.authData.data.UserData[0].NAME} has mapped email to customer.`,
                    CATEGORY: 'CustomerEmailMapping',
                    CLIENT_ID: CLIENT_ID,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                return res.json(result[0][0]);
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
             "message": 'Something went wrong.'
        });
    }
};

const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

exports.importCustomerEmailMapping = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);

        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }
        );

        // remove empty rows
        const jsonData = cleanedRows.filter(row =>
            Object.values(row).some(
                val => val !== null && val !== undefined && String(val).trim() !== ""
            )
        );

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found" });

        res.status(200).json({
            code: 200,
            message: "Customer Technician Mapping import started...",
            EXCEL_MASTER_ID
        });

        let successCount = 0,
            skippedCount = 0,
            successDetails = [],
            errorDetails = [],
            errorData = [],
            skippedDetails = [],
            totalData = [];

        const chunkSize = 50;
        const isEdit = IMPORT_TYPE === "E";

        const normalize = v => v ? v.toString().trim() : "";

        // Resolve columns dynamically
        const excelCustomerField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "CUSTOMER_ID")?.EXCEL_FIELD || "Customer Name";
        const excelCustomerEmailField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "CUSTOMER_EMAIL")?.EXCEL_FIELD || "Customer Email";
        const excelEmailIdField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "EMAIL_ID")?.EXCEL_FIELD || "Email Id";
        const excelPriceRangeField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "PRICE_RANGE")?.EXCEL_FIELD || "Price Range";
        const excelActiveField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "IS_ACTIVE")?.EXCEL_FIELD || "Is Active";
        const excelIDField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "ID")?.EXCEL_FIELD || "ID";

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (let i = 0; i < chunk.length; i++) {
                const row = chunk[i];
                const rowNumber = start + i + 2;
                const connection = mm.openConnection();

                try {
                    let CUSTOMER_NAME = normalize(row[excelCustomerField]);
                    let CUSTOMER_EMAIL = normalize(row[excelCustomerEmailField]);
                    let EMAIL_ID = normalize(row[excelEmailIdField]);
                    let PRICE_RANGE = normalize(row[excelPriceRangeField]);
                    let IS_ACTIVE = normalize(row[excelActiveField]);
                    let ID = normalize(row[excelIDField]);

                    let IS_ACTIVE_VALUE = isEdit
                        ? (IS_ACTIVE == "Yes" || IS_ACTIVE == "Active" ? 1 : 0)
                        : 1;

                    if (CUSTOMER_NAME) {
                        let custName = CUSTOMER_NAME.split("(");
                        CUSTOMER_NAME = custName[0].trim();
                    }

                    // Required fields check
                    if (!CUSTOMER_NAME || !CUSTOMER_EMAIL || !EMAIL_ID) {
                        skippedCount++;
                        const reason = "Missing required fields";
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // Validate EMAIL_ID (basic)
                    if (!EMAIL_ID.includes("@")) {
                        skippedCount++;
                        const reason = `Invalid EMAIL_ID: ${EMAIL_ID}`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // --- Customer Lookup (NAME + CUSTOMER_EMAIL) using SP ---
                    const customer = await runQuery(
                        `CALL sp_get_customer_by_name_email(?, ?)`,
                        [CUSTOMER_NAME, CUSTOMER_EMAIL],
                        supportKey,
                        connection
                    );

                    const customerResult = customer && customer[0] ? customer[0] : [];

                    if (!customerResult.length) {
                        skippedCount++;
                        const reason = `Customer not found for "${CUSTOMER_NAME}" with email "${CUSTOMER_EMAIL}"`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const CUSTOMER_ID = customerResult[0].ID;

                    // --- Check Existing Mapping using SP ---
                    const existing = await runQuery(
                        `CALL sp_check_email_mapping_exists(?, ?, ?, ?)`,
                        [CUSTOMER_ID, EMAIL_ID, ID || null, isEdit],
                        supportKey,
                        connection
                    );

                    const existingResult = existing && existing[0] ? existing[0] : [];

                    // UPDATE
                    if (existingResult.length) {
                        if (!isEdit) {
                            skippedCount++;
                            const reason = "Mapping already exists";
                            skippedDetails.push({ rowNumber, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Update using SP
                        await runQuery(
                            `CALL sp_update_email_mapping(?, ?, ?, ?)`,
                            [ID, PRICE_RANGE || null, IS_ACTIVE_VALUE, 1],
                            supportKey,
                            connection
                        );

                        mm.commitConnection(connection);
                        successCount++;
                        successDetails.push({ rowNumber, row, ID: ID });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }
                    // INSERT
                    else {
                        if (isEdit) {
                            skippedCount++;
                            const reason = "Mapping not found for update";
                            skippedDetails.push({ rowNumber, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Insert using SP
                        const result = await runQuery(
                            `CALL sp_insert_email_mapping(?, ?, ?, ?, ?)`,
                            [EMAIL_ID, CUSTOMER_ID, PRICE_RANGE || null, IS_ACTIVE_VALUE, 1],
                            supportKey,
                            connection
                        );

                        const insertId = result && result[0] && result[0][0] ?
                            result[0][0].insertId : result[0]?.insertId;

                        mm.commitConnection(connection);
                        successCount++;
                        successDetails.push({ rowNumber, row, ID: insertId });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }

                } catch (error) {
                    mm.rollbackConnection(connection);
                    errorDetails.push({ rowNumber, reason: error.message });
                    errorData.push({ rowNumber, row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);

            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

        // Final Response Summary
        let response = {
            code: 200,
            message: "Customer Email Mapping import completed.",
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
        console.log(error);
    }
};
