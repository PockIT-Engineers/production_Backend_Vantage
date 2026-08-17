const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const xlsx = require('xlsx')
const excelMaster = require("../../modules/excelImportMaster");
var customerTechnicianMapping = "customer_technician_mapping";
var viewcustomerTechnicianMapping = "view_" + customerTechnicianMapping;

function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('ID').optional(),
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
                setContext+`CALL sp_customerTechnicianMapping_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error);
                        res.send({
                            "code": 400,
                             "message": "Failed to get customerTechnicianMapping information."
                        });
                    } else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 212,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        } else {
            res.send({
                "code": 400,
                 "message": "Invalid filter parameter."
            });
        }
    } catch (error) {
        console.log("Error in catch", error)
        console.log(error);
        res.send({
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
        return res.send({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerTechnicianMapping_create(?,?,?,?,?)`,
            [
                data.CUSTOMER_ID,
                data.TECHNICIAN_ID,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                "M"
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.send({
                        "code": 400,
                         "message": "Failed to save customerTechnicianMapping information..."
                    });
                } else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped a new technician to the customer.`;
                    var logCategory = "Service Skill Mapping";

                    let actionLog = {
                        SOURCE_ID: results[0][0].ID,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: ACTION_DETAILS,
                        CATEGORY: logCategory,
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: 0
                    };

                    dbm.saveLog(actionLog, systemLog);

                    res.send({
                        "code": 200,
                         "message": "customerTechnicianMapping information saved successfully..."
                    });
                }
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
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerTechnicianMapping_update(?,?,?,?)`,
            [
                req.body.ID,
                data.CUSTOMER_ID,
                data.TECHNICIAN_ID,
                data.IS_ACTIVE
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error);
                    return res.send({
                        "code": 400,
                         "message": "Failed to update customerTechnicianMapping information."
                    });
                } else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of customer technician mapping.`;
                    var logCategory = "Service Skill Mapping";

                    let actionLog = {
                        SOURCE_ID: req.body.ID,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: ACTION_DETAILS,
                        CATEGORY: logCategory,
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: 0
                    };

                    dbm.saveLog(actionLog, systemLog);

                    res.send({
                        "code": 200,
                         "message": "customerTechnicianMapping information updated successfully..."
                    });
                }
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

exports.mapTechnicians = (req, res) => {
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var STATUS = req.body.STATUS;
    var IS_ACTIVE = STATUS == 'M' ? '1' : '0';
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();

        async.eachSeries(data, function (item, inner_callback) {
            mm.executeDML(
                `CALL sp_customerTechnician_map(?,?,?,?,?)`,
                [
                    CUSTOMER_ID,
                    item.TECHNICIAN_ID,
                    IS_ACTIVE,
                    STATUS,
                    1
                ],
                supportKey,
                connection,
                (error) => {
                    if (error) {
                        console.log("error", error);
                        inner_callback(error);
                    } else {
                        inner_callback(null);
                    }
                }
            );
        }, function (error) {
            if (error) {
                console.log("error", error);
                mm.rollbackConnection(connection);
                return res.send({
                    "code": 400,
                     "message": "Failed to Insert serviceSkillsMapping information..."
                });
            }

            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped a new technician to the customer.`;
            var logCategory = "customer Technician Mapping";

            let actionLog = {
                SOURCE_ID: CUSTOMER_ID,
                LOG_DATE_TIME: mm.getSystemDate(),
                LOG_TEXT: ACTION_DETAILS,
                CATEGORY: logCategory,
                CLIENT_ID: 1,
                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                supportKey: 0
            };

            dbm.saveLog(actionLog, systemLog);
            mm.commitConnection(connection);

            res.send({
                "code": 200,
                 "message": "New serviceSkillsMapping Successfully added"
            });
        });
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

exports.unMapTechnicians = (req, res) => {
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();

        async.eachSeries(data, function (item, inner_callback) {
            mm.executeDML(
                `CALL sp_customerTechnician_unmap(?,?,?,?)`,
                [
                    CUSTOMER_ID,
                    item.TECHNICIAN_ID,
                    item.IS_ACTIVE,
                    'M'
                ],
                supportKey,
                connection,
                (error) => {
                    if (error) {
                        console.log("error", error);
                        inner_callback(error);
                    } else {
                        inner_callback(null);
                    }
                }
            );
        }, function (error) {
            if (error) {
                console.log("error", error);
                mm.rollbackConnection(connection);
                return res.send({
                    "code": 400,
                     "message": "Failed to Insert serviceSkillsMapping information..."
                });
            }

            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has unmapped technician.`;
            var logCategory =  "customer Technician Mapping";
            let actionLog = {
                SOURCE_ID: CUSTOMER_ID,
                LOG_DATE_TIME: mm.getSystemDate(),
                LOG_TEXT: ACTION_DETAILS,
                CATEGORY: logCategory,
                CLIENT_ID: 1,
                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                supportKey: 0
            };

            dbm.saveLog(actionLog, systemLog);
            mm.commitConnection(connection);

            res.send({
                "code": 200,
                 "message": "New serviceSkillsMapping Successfully added"
            });
        });
    } catch (error) {
        console.log("error", error);
        res.send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

exports.addBulk = (req, res) => {

    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var STATUS = req.body.STATUS;
    var IS_ACTIVE = STATUS == 'M' ? '1' : '0';
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();

        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {

            mm.executeDML(
                  `CALL sp_customerTechnician_map(?,?,?,?,?)`,
                [
                    CUSTOMER_ID,
                    roleDetailsItem.TECHNICIAN_ID,
                    IS_ACTIVE,
                    STATUS,
                    1
                ],
                supportKey,
                connection,
                (error) => {
                    if (error) {
                        console.log("error", error);
                        inner_callback(error);
                    } else {
                        inner_callback(null);
                    }
                }
            );

        }, function subCb(error) {

            if (error) {
                console.log("error", error);
                mm.rollbackConnection(connection);
                return res.send({
                    "code": 400,
                     "message": "Failed to Insert customerTechnicianMapping information..."
                });
            }

            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped a new technician to the customer.`;
            var logCategory = "Service Skill Mapping";

            let actionLog = {
                SOURCE_ID: CUSTOMER_ID,
                LOG_DATE_TIME: mm.getSystemDate(),
                LOG_TEXT: ACTION_DETAILS,
                CATEGORY: logCategory,
                CLIENT_ID: 1,
                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                supportKey: 0
            };

            dbm.saveLog(actionLog, systemLog);
            mm.commitConnection(connection);

            res.send({
                "code": 200,
                 "message": "New customerTechnicianMapping Successfully added"
            });
        });

    } catch (error) {
        console.log("error", error);
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

exports.importCustomerTechnicianMapping = async (req, res) => {
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

        // --- Resolve excel columns from COLUMN_JSON ---
        const excelTechField =
            COLUMN_JSON?.find(c => c.TABLE_FIELD === "TECHNICIAN_ID")?.EXCEL_FIELD || "Technician Name";

        const excelTechEmailField =
            COLUMN_JSON?.find(c => c.TABLE_FIELD === "TECHNICIAN_EMAIL")?.EXCEL_FIELD || "Technician Email";

        const excelCustomerField =
            COLUMN_JSON?.find(c => c.TABLE_FIELD === "CUSTOMER_ID")?.EXCEL_FIELD || "Customer Name";

        const excelCustomerEmailField =
            COLUMN_JSON?.find(c => c.TABLE_FIELD === "CUSTOMER_EMAIL")?.EXCEL_FIELD || "Customer Email";

        const excelActiveField =
            COLUMN_JSON?.find(c => c.TABLE_FIELD === "IS_ACTIVE")?.EXCEL_FIELD || "Is Active";

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (let i = 0; i < chunk.length; i++) {
                const row = chunk[i];
                const rowNumber = start + i + 2;
                const connection = mm.openConnection();

                try {
                    let TECHNICIAN_NAME = row[excelTechField];
                    let CUSTOMER_NAME = row[excelCustomerField];
                    let TECHNICIAN_EMAIL = normalize(row[excelTechEmailField]);
                    let CUSTOMER_EMAIL = normalize(row[excelCustomerEmailField]);
                    let IS_ACTIVE = normalize(row[excelActiveField]);
                    let STATUS = "M";

                    // ---------------- FOR NAMES ----------------
                    if (TECHNICIAN_NAME && CUSTOMER_NAME) {
                        let techName = TECHNICIAN_NAME.split("(");
                        TECHNICIAN_NAME = techName[0].trim();
                        let custName = CUSTOMER_NAME.split("(");
                        CUSTOMER_NAME = custName[0].trim();
                    }

                    let IS_ACTIVE_VALUE = isEdit
                        ? (IS_ACTIVE == "Yes" || IS_ACTIVE == "Active" ? 1 : 0)
                        : 1;

                    // --- Basic validation ---
                    if (!TECHNICIAN_NAME || !TECHNICIAN_EMAIL || !CUSTOMER_NAME || !CUSTOMER_EMAIL) {
                        skippedCount++;
                        const reason = "Missing required fields";
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // -------------------------------
                    // Technician lookup using SP
                    // -------------------------------
                    const tech = await runQuery(
                        `CALL sp_get_technician_by_name_email(?, ?)`,
                        [TECHNICIAN_NAME, TECHNICIAN_EMAIL],
                        supportKey,
                        connection
                    );

                    const techResult = tech && tech[0] ? tech[0] : [];

                    if (!techResult.length) {
                        skippedCount++;
                        const reason = `Technician not found: ${TECHNICIAN_NAME} (${TECHNICIAN_EMAIL})`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // -------------------------------
                    // Customer lookup using SP
                    // -------------------------------
                    const customer = await runQuery(
                        `CALL sp_get_customer_by_name_email(?, ?)`,
                        [CUSTOMER_NAME, CUSTOMER_EMAIL],
                        supportKey,
                        connection
                    );

                    const customerResult = customer && customer[0] ? customer[0] : [];

                    if (!customerResult.length) {
                        skippedCount++;
                        const reason = `Customer not found: ${CUSTOMER_NAME} (${CUSTOMER_EMAIL})`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const TECHNICIAN_ID = techResult[0].ID;
                    const CUSTOMER_ID = customerResult[0].ID;

                    // -------------------------------
                    // Check if mapping exists using SP
                    // -------------------------------
                    const mapping = await runQuery(
                        `CALL sp_check_technician_mapping_exists(?, ?)`,
                        [TECHNICIAN_ID, CUSTOMER_ID],
                        supportKey,
                        connection
                    );

                    const mappingResult = mapping && mapping[0] ? mapping[0] : [];

                    // -------- UPDATE (Edit mode) --------
                    if (mappingResult.length) {
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
                            `CALL sp_update_technician_mapping(?, ?, ?)`,
                            [mappingResult[0].ID, IS_ACTIVE_VALUE, 1],
                            supportKey,
                            connection
                        );

                        mm.commitConnection(connection);
                        successCount++;
                        successDetails.push({ rowNumber, row, ID: mappingResult[0].ID });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }
                    // -------- INSERT --------
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
                            `CALL sp_insert_technician_mapping(?, ?, ?, ?, ?)`,
                            [TECHNICIAN_ID, CUSTOMER_ID, IS_ACTIVE_VALUE, STATUS, 1],
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

        // -------------------------------
        // Final summary
        // -------------------------------
        let response = {
            code: 200,
            message: "Customer Technician Mapping import completed.",
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
