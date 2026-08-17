const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const xlsx = require('xlsx')
const excelMaster = require("../../modules/excelImportMaster");
const applicationkey = process.env.APPLICATION_KEY;
var customerSlaPriorityMapping = "customer_sla_priority_mapping";
var viewcustomerSlaPriorityMapping = "view_" + customerSlaPriorityMapping;

function reqData(req) {

    var data = {
        SLA_ID: req.body.SLA_ID,
        PRIORITY_NAME: req.body.PRIORITY_NAME,
        ACKNOWLEDGEMENT_TIME: req.body.ACKNOWLEDGEMENT_TIME,
        RESPONSE_TIME: req.body.RESPONSE_TIME,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('SLA_ID').optional(),
        body('PRIORITY_NAME').optional(),
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
        return res.send({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_customerSlaPriorityMapping_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.send({
                        "code": 400,
                        "message": "Failed to get customerSlaPriorityMapping information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 210,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerSlaPriorityMapping_create(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.SLA_ID,
                data.PRIORITY_NAME,
                data.ACKNOWLEDGEMENT_TIME,
                data.RESPONSE_TIME,
                data.IS_CUSTOME_PRIORITY,
                data.DAYS_FOR_SLA_CALCULATION,
                data.STATUS,
                data.CUSTOM_RESPONCE_TIME,
                data.SHORT_CODE,
                data.COUNTER_NO,
                data.CUSTOMER_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.send({
                        "code": 400,
                        "message": "Failed to save customerSlaPriorityMapping information..."
                    });
                }

                const insertedId = results[0][0].ID;

                const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customerSlaPriorityMapping ${data.PRIORITY_NAME}`;
                const logCategory = "customerSlaPriorityMapping";

                dbm.saveLog({
                    SOURCE_ID: insertedId,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: logCategory,
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({
                    "code": 200,
                    "message": "customerSlaPriorityMapping information saved successfully..."
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const data = reqData(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerSlaPriorityMapping_update(?,?,?,?,?,?,?,?,?,?,?,?,?    )`,
            [
                req.body.ID,
                data.SLA_ID,
                data.PRIORITY_NAME,
                data.ACKNOWLEDGEMENT_TIME,
                data.RESPONSE_TIME,
                data.IS_CUSTOME_PRIORITY,
                data.DAYS_FOR_SLA_CALCULATION,
                data.STATUS,
                data.CUSTOM_RESPONCE_TIME,
                data.SHORT_CODE,
                data.COUNTER_NO,
                data.CUSTOMER_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.send({
                        "code": 400,
                        "message": "Failed to update customerSlaPriorityMapping information."
                    });
                }

                const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of the customerSlaPriorityMapping ${data.PRIORITY_NAME}`;
                const logCategory = "customerSlaPriorityMapping";

                dbm.saveLog({
                    SOURCE_ID: req.body.ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: logCategory,
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({
                    "code": 200,
                    "message": "customerSlaPriorityMapping information updated successfully..."
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};




async function getNextCustomerCounter(table, customerId, supportKey, connection) {

    const rows = await mm.executeDMLPromise(
        `CALL sp_getNextCustomerCounter(?, ?)`,
        [table, customerId],
        supportKey,
        connection
    );

    return rows[0][0].NEXT_COUNTER_NO;
}

function buildShortCode(parts, counterNo) {
    return `${parts.join("_")}_${String(counterNo).padStart(4, "0")}`;
}


exports.mapPrioritytoSla = async (req, res) => {

    const { masterData, mappingData } = req.body;

    const supportKey = req.headers["supportkey"] || "9876543210";

    if (!masterData || !Array.isArray(mappingData) || mappingData.length === 0) {
        return res.status(400).send({
            code: 400,
            message: "Invalid or missing data"
        });
    }

    const connection = await mm.openConnectionAwait();

    try {

        masterData.STATUS = masterData.STATUS ? 1 : 0;

        mappingData.forEach(row => {
            row.STATUS = row.STATUS ? 1 : 0;
            row.IS_CUSTOME_PRIORITY = row.IS_CUSTOME_PRIORITY ? 1 : 0;
        });

        const {
            ID,
            SLA_NAME,
            CUSTOMER_ID,
            START_DATE,
            END_DATE,
            STATUS,
            DESCRIPTION,
            DOCUMENT_PATH,
            CLIENT_ID
        } = masterData;

        const result = await mm.executeDMLPromise(
            `CALL sp_mapPrioritytoSla(?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                SLA_NAME,
                CUSTOMER_ID,
                START_DATE,
                END_DATE,
                STATUS,
                DESCRIPTION,
                DOCUMENT_PATH,
                CLIENT_ID,
                JSON.stringify(mappingData)
            ],
            supportKey,
            connection
        );

        await mm.commitConnectionAwait(connection);

        return res.send(result[0][0]);

    } catch (error) {

        await mm.rollbackConnectionAwait(connection);

        return res.status(500).send({
            code: 500,
            message: "Error processing SLA",
            error: error.message
        });

    }
};


exports.getPrioritytoData = (req, res) => {
    const supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    const CUSTOMER_ID = req.body.CUSTOMER_ID || 0;
    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);


    if (mm.sanitizeFilter(filter) !== "0") {
        return res.send({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_customerSlaPriorityMapping_getPriorityToData()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({
                        "code": 400,
                        "message": "Failed to get customerSlaPriorityMapping information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 16,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
            "code": 500,
            "message": "Something went wrong."
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

async function getNextCustomerCounter(table, customerId, supportKey, connection) {
    const rows = await runQuery(
        `CALL sp_get_next_counter(?, ?)`,
        [table, customerId],
        supportKey,
        connection
    );
    
    const result = rows && rows[0] ? rows[0] : [];
    return (result[0]?.NEXT_NO || 1);
}

function buildShortCode(parts, counterNo) {
    return `${parts.join("_")}_${String(counterNo).padStart(4, "0")}`;
}

function toValidTime(value) {
    if (value === null || value === undefined || value === '') return null;

    let str = value.toString().trim();

    // CASE 1: already valid HH:mm:ss
    const validHMS = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    if (validHMS.test(str)) {
        return str;
    }

    // CASE 2: valid HH:mm -> convert to HH:mm:ss
    const validHM = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (validHM.test(str)) {
        return str + ":00";
    }

    // CASE 3: Excel decimal time (like 0.4166)
    if (!isNaN(value)) {
        let num = Number(value);
        if (num >= 0 && num < 1) {
            let totalSeconds = Math.round(num * 24 * 60 * 60);
            let hours = Math.floor(totalSeconds / 3600);
            let minutes = Math.floor((totalSeconds % 3600) / 60);
            let seconds = totalSeconds % 60;
            return [
                hours.toString().padStart(2, '0'),
                minutes.toString().padStart(2, '0'),
                seconds.toString().padStart(2, '0')
            ].join(':');
        }
    }

    return null;
}

exports.importPrioritytoSla = async (req, res) => {
    console.log("=== IMPORT PRIORITY TO SLA STARTED ===");
    console.log("Timestamp:", new Date().toISOString());

    try {
        const supportKey = req.headers["supportkey"];
        const changedBy = req.headers["username"] || "System";

        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;
        const isEdit = IMPORT_TYPE === "E";

        if (!EXCEL_FILE_NAME) {
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });
        }

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }
        );

        const jsonData = cleanedRows.filter(r =>
            Object.values(r).some(v => String(v || "").trim() !== "")
        );

        if (!jsonData.length) {
            return res.status(200).json({ code: 200, message: "No data found" });
        }

        console.log("JSON DATA", jsonData);

        res.status(200).json({
            code: 200,
            message: "Priority To SLA import started...",
            EXCEL_MASTER_ID
        });

        let successCount = 0,
            skippedCount = 0,
            failedCount = 0,
            successData = [],
            skippedData = [],
            errorData = [],
            totalData = [];

        const chunkSize = 50;

        const normalize = v => v ? v.toString().trim() : "";
        const col = f => COLUMN_JSON?.find(c => c.TABLE_FIELD === f)?.EXCEL_FIELD;
        const mapBoolean = v =>
            ["yes", "true", "active", "1"].includes(String(v).toLowerCase()) ? 1 : 0;

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (let i = 0; i < chunk.length; i++) {
                const row = chunk[i];
                const rowNumber = start + i + 2;
                const connection = await mm.openConnectionAwait();

                try {
                    // -------- Extract fields
                    let PRIORITY_ID = normalize(row[col("ID")]);
                    let CUSTOMER_NAME = normalize(row[col("CUSTOMER_NAME")]);
                    let CUSTOMER_EMAIL = normalize(row[col("CUSTOMER_EMAIL")]);
                    let SLA_NAME = normalize(row[col("SLA_NAME")]);
                    let DESCRIPTION = normalize(row[col("DESCRIPTION")]);
                    let CUSTOM_PRIORITY = mapBoolean(row[col("CUSTOM_PRIORITY")]);
                    let PRIORITY_NAME = normalize(row[col("PRIORITY_NAME")]);
                    let ACK_TIME = normalize(row[col("ACK_TIME")]);
                    let RESP_TIME = normalize(row[col("ONSITE_RESPONSE_TIME")]);
                    let PRIORITY_STATUS = mapBoolean(row[col("PRIORITY_STATUS")]);
                    let SLA_CALCULATION_DAYS = normalize(row[col("SLA_CALCULATION_DAYS")]) || 0;

                    if (!isEdit) PRIORITY_STATUS = 1;

                    if (CUSTOMER_NAME)
                        CUSTOMER_NAME = CUSTOMER_NAME.split("(")[0].trim();

                    // -------- Basic Validation
                    if (!CUSTOMER_NAME || !CUSTOMER_EMAIL || !SLA_NAME || !PRIORITY_NAME) {
                        skippedCount++;
                        const reason = "Missing required fields";
                        skippedData.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        await mm.rollbackConnectionAwait(connection);
                        continue;
                    }

                    console.log("Processing:", {
                        PRIORITY_ID,
                        CUSTOMER_NAME,
                        CUSTOMER_EMAIL,
                        SLA_NAME,
                        PRIORITY_NAME,
                        PRIORITY_STATUS,
                        CUSTOM_PRIORITY,
                        RESP_TIME,
                        ACK_TIME
                    });
                    
                    let CUSTOM_RESPONCE_TIME = null;
                    if (CUSTOM_PRIORITY == 1) {
                        CUSTOM_RESPONCE_TIME = RESP_TIME ? toValidTime(RESP_TIME) : null;
                        RESP_TIME = 0;
                        ACK_TIME = ACK_TIME == "" ? 0 : ACK_TIME;
                    } else {
                        CUSTOM_RESPONCE_TIME = null;
                        RESP_TIME = RESP_TIME == "" ? 0 : RESP_TIME;
                        ACK_TIME = ACK_TIME == "" ? 0 : ACK_TIME;
                    }
                    
                    // -------- Customer Lookup using SP
                    const customer = await runQuery(
                        `CALL sp_get_customer_by_name_email(?, ?)`,
                        [CUSTOMER_NAME, CUSTOMER_EMAIL],
                        supportKey,
                        connection
                    );

                    const customerResult = customer && customer[0] ? customer[0] : [];

                    if (!customerResult.length) {
                        skippedCount++;
                        const reason = "Customer not found";
                        skippedData.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        await mm.rollbackConnectionAwait(connection);
                        continue;
                    }

                    const CUSTOMER_ID = customerResult[0].ID;
                    const CLIENT_ID = customerResult[0].length>0?customerResult[0].CLIENT_ID:1;

                    // -------- SLA Lookup using SP
                    let sla = await runQuery(
                        `CALL sp_get_sla_by_customer_and_name(?, ?)`,
                        [CUSTOMER_ID, SLA_NAME],
                        supportKey,
                        connection
                    );

                    const slaResult = sla && sla[0] ? sla[0] : [];

                    let SLA_ID = null;
                    let slaCounter = null;

                    if (slaResult.length) {
                        SLA_ID = slaResult[0].ID;
                        slaCounter = slaResult[0].COUNTER_NO;
                    }

                    // -------- If NEW mode and SLA missing — create SLA
                    else if (!isEdit) {
                        const insert = await runQuery(
                            `CALL sp_insert_sla(?, ?, ?, ?, ?)`,
                            [SLA_NAME, CUSTOMER_ID, DESCRIPTION || "", 1, CLIENT_ID],
                            supportKey,
                            connection
                        );

                        SLA_ID = insert && insert[0] && insert[0][0] ? 
                                 insert[0][0].insertId : insert[0]?.insertId;

                        slaCounter = await getNextCustomerCounter(
                            "customer_sla_master",
                            CUSTOMER_ID,
                            supportKey,
                            connection
                        );

                        const slaShort = buildShortCode(
                            [SLA_NAME, CUSTOMER_ID, SLA_ID],
                            slaCounter
                        );

                        const dup = await runQuery(
                            `CALL sp_check_sla_short_code_exists(?)`,
                            [slaShort],
                            supportKey,
                            connection
                        );

                        const dupResult = dup && dup[0] ? dup[0] : [];
                        if (dupResult.length) throw new Error("Duplicate SLA short-code");

                        await runQuery(
                            `CALL sp_update_sla_with_short_code(?, ?, ?, ?)`,
                            [SLA_ID, slaShort, slaCounter, 1],
                            supportKey,
                            connection
                        );
                    }

                    // -------- Priority Lookup
                    let existing = [];

                    if (isEdit && PRIORITY_ID) {
                        const priorityResult = await runQuery(
                            `CALL sp_get_priority_by_id(?)`,
                            [PRIORITY_ID],
                            supportKey,
                            connection
                        );
                        existing = priorityResult && priorityResult[0] ? priorityResult[0] : [];
                    } else {
                        const priorityResult = await runQuery(
                            `CALL sp_get_priority_by_sla_and_name(?, ?)`,
                            [SLA_ID, PRIORITY_NAME],
                            supportKey,
                            connection
                        );
                        existing = priorityResult && priorityResult[0] ? priorityResult[0] : [];
                    }

                    let counterToUse = existing[0]?.COUNTER_NO;

                    if (isEdit && existing.length) {
                        await runQuery(
                            `CALL sp_update_sla_details(?, ?, ?, ?, ?)`,
                            [
                                existing[0].SLA_ID,
                                SLA_NAME,
                                CUSTOMER_ID,
                                DESCRIPTION || "",
                                1
                            ],
                            supportKey,
                            connection
                        );

                        SLA_ID = existing[0].SLA_ID;

                        slaCounter = await getNextCustomerCounter(
                            "customer_sla_master",
                            CUSTOMER_ID,
                            supportKey,
                            connection
                        );

                        const slaShort = buildShortCode(
                            [SLA_NAME, CUSTOMER_ID, SLA_ID],
                            slaCounter
                        );

                        const dup = await runQuery(
                            `CALL sp_check_sla_short_code_exists(?)`,
                            [slaShort],
                            supportKey,
                            connection
                        );

                        const dupResult = dup && dup[0] ? dup[0] : [];
                        if (dupResult.length) throw new Error("Duplicate SLA short-code");

                        await runQuery(
                            `CALL sp_update_sla_with_short_code(?, ?, ?, ?)`,
                            [SLA_ID, slaShort, slaCounter, 1],
                            supportKey,
                            connection
                        );
                    }

                    if (!counterToUse) {
                        counterToUse = await getNextCustomerCounter(
                            "customer_sla_priority_mapping",
                            CUSTOMER_ID,
                            supportKey,
                            connection
                        );
                    }

                    const shortCode = buildShortCode(
                        [SLA_NAME, PRIORITY_NAME, CUSTOMER_ID, SLA_ID],
                        counterToUse
                    );

                    const dupCheck = await runQuery(
                        `CALL sp_check_priority_short_code_exists(?, ?)`,
                        [shortCode, existing.length ? existing[0].ID : null],
                        supportKey,
                        connection
                    );

                    const dupResult = dupCheck && dupCheck[0] ? dupCheck[0] : [];

                    if (dupResult.length) {
                        skippedCount++;
                        const reason = "Duplicate priority short-code";
                        skippedData.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        await mm.rollbackConnectionAwait(connection);
                        continue;
                    }

                    // -------- UPDATE (EDIT mode or found record)
                    if (existing.length) {
                        await runQuery(
                            `CALL sp_update_priority_mapping(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                existing[0].ID,
                                PRIORITY_NAME,
                                ACK_TIME,
                                RESP_TIME,
                                PRIORITY_STATUS,
                                SLA_CALCULATION_DAYS,
                                CUSTOM_PRIORITY,
                                CLIENT_ID,
                                shortCode,
                                CUSTOMER_ID,
                                CUSTOM_RESPONCE_TIME
                            ],
                            supportKey,
                            connection
                        );
                    }
                    // -------- INSERT (NEW mode or no existing)
                    else {
                        await runQuery(
                            `CALL sp_insert_priority_mapping(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                SLA_ID,
                                PRIORITY_NAME,
                                ACK_TIME,
                                RESP_TIME,
                                PRIORITY_STATUS,
                                CLIENT_ID,
                                CUSTOMER_ID,
                                SLA_CALCULATION_DAYS,
                                CUSTOM_PRIORITY,
                                shortCode,
                                counterToUse,
                                CUSTOM_RESPONCE_TIME
                            ],
                            supportKey,
                            connection
                        );
                    }

                    await mm.commitConnectionAwait(connection);

                    successCount++;
                    successData.push({ rowNumber, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    failedCount++;
                    errorData.push({ rowNumber, row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                    await mm.rollbackConnectionAwait(connection);
                }
            }

            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: Math.round(((start + chunk.length) / jsonData.length) * 100),
                STATUS: "Processing"
            });
        }

        console.log("response", {
            code: 200,
            message: "Priority to SLA import completed",
            totalRecords: jsonData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: failedCount,
            successData,
            skippedData,
            errorData,
            totalData
        });

        let response = {
            code: 200,
            message: "Priority to SLA import completed",
            totalRecords: jsonData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: failedCount,
            successData,
            skippedData,
            errorData,
            totalData
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
            FAILED_RECORDS: failedCount,
            RESPONSE: fileName
        });

        fs.writeFileSync(filePath, JSON.stringify(response, null, 2), "utf8");

        console.log("=== IMPORT PRIORITY TO SLA COMPLETED ===");

    } catch (error) {
        console.error("FATAL ERROR:", error);
    }
};


