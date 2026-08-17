const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
var addressSpocMapping = "address_spoc_mapping";
var viewaddressSpocMapping = "view_" + addressSpocMapping;

function reqData(req) {

    var data = {
        CUSTOMER_ID:req.body.CUSTOMER_ID,
        ADDRESS_ID: req.body.ADDRESS_ID,
        FULL_NAME: req.body.FULL_NAME,
        EMAIL_ID: req.body.EMAIL_ID,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        IS_PRIMARY: req.body.IS_PRIMARY ? '1' : '0',
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        COUNTRY_CODE: req.body.COUNTRY_CODE,
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('ADDRESS_ID').isInt().optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const pageIndex = req.body.pageIndex || null;
    const pageSize = req.body.pageSize || null;
    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue || 'DESC';
    const filter = req.body.filter || '';

    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
            SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
            SET @v_SORT_KEY = '${sortKey}';
            SET @v_SORT_VALUE = '${sortValue}';
            SET @v_FILTER = '${safeFilter}';
        `;

    if (mm.sanitizeFilter(filter) !== "0") {
        return res.status(400).json({ "code": 400, "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_addressSpocMapping_get()`,
            [],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": "Failed to get addressSpocMapping." });
                }

                const resultSets = result.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 219,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_addressSpocMapping_create(?,?,?,?,?,?,?,?,?)`,
            [
                data.CUSTOMER_ID,
                data.ADDRESS_ID,
                data.FULL_NAME,
                data.EMAIL_ID,
                data.MOBILE_NUMBER,
                data.IS_PRIMARY,
                data.IS_ACTIVE,
                data.COUNTRY_CODE,
                req.body.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": "Failed to save addressSpocMapping." });
                }

                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped a new technician to the address.`;
                var logCategory = "Service Skill Mapping"

                let actionLog = {
                    "SOURCE_ID": result[0][0].ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                res.send({
                    "code": 200,
                    "message": "addressSpocMapping information saved successfully...",
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_addressSpocMapping_update(?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.CUSTOMER_ID,
                data.ADDRESS_ID,
                data.FULL_NAME,
                data.EMAIL_ID,
                data.MOBILE_NUMBER,
                data.IS_PRIMARY,
                data.IS_ACTIVE,
                data.COUNTRY_CODE
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": "Failed to update addressSpocMapping." });
                }

                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of address technician mapping  .`;

                var logCategory = "Service Skill Mapping"

                let actionLog = {
                    "SOURCE_ID": req.body.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                res.send({
                    "code": 200,
                    "message": "addressSpocMapping information updated successfully...",
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.mapSpoctoAddress = async (req, res) => {
    const data = req.body;
    const supportKey = req.headers["supportkey"];
    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
            "code": 400,
             "message": "No data provided"
        });
    }

    const connection = mm.openConnection();

    try {
        await async.eachSeries(data, async (item) => {

            const {
                ID,
                CUSTOMER_ID,
                ADDRESS_ID,
                FULL_NAME,
                EMAIL_ID,
                MOBILE_NUMBER,
                IS_PRIMARY,
                IS_ACTIVE,
                COUNTRY_CODE
            } = item;

            await mm.executeDMLPromise(
                `CALL sp_addressSpocMapping_upsert(?,?,?,?,?,?,?,?,?,?)`,
                [
                    ID || null,
                    CUSTOMER_ID,
                    ADDRESS_ID,
                    FULL_NAME,
                    EMAIL_ID,
                    MOBILE_NUMBER,
                    IS_PRIMARY ? '1' : '0',
                    IS_ACTIVE ? '1' : '0',
                    COUNTRY_CODE,
                    1
                ],
                supportKey,
                connection
            );
        });

        mm.commitConnection(connection);

        res.status(200).json({
            "code": 200,
             "message": "Customer SPOC mapping saved successfully"
        });

    } catch (error) {
        console.log("Error in catch", error)
        mm.rollbackConnection(connection);

        res.status(500).json({
            "code": 500,
             "message": "Error updating address SPOC mapping",
            error: error.message
        });
    }
};


exports.importAddressSpocMapping = async (req, res) => {
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

        const jsonData = cleanedRows.filter(row =>
            Object.values(row).some(v => String(v).trim() !== "")
        );

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found" });

        res.status(200).json({
            code: 200,
            message: "Address SPOC Mapping import started...",
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

        // COLUMN MAPPINGS
        const getCol = field =>
            COLUMN_JSON?.find(c => c.TABLE_FIELD === field)?.EXCEL_FIELD;

        const excelIdField = getCol("ID") || "ID";
        const excelCustomerField = getCol("CUSTOMER_ID") || "Customer Name";
        const excelCustomerEmailField = getCol("CUSTOMER_EMAIL") || "Customer Email";
        const excelAddressIdField = getCol("ADDRESS_ID") || "Address ID";
        const excelFullNameField = getCol("FULL_NAME") || "SPOC Name";
        const excelEmailIdField = getCol("EMAIL_ID") || "SPOC Email";
        const excelCountryCodeField = getCol("COUNTRY_CODE") || "Country Code";
        const excelMobileField = getCol("MOBILE_NUMBER") || "Mobile Number";
        let excelPrimaryField = getCol("IS_PRIMARY") || "Is Primary";
        const excelActiveField = getCol("IS_ACTIVE") || "Is Active";


        for (let start = 0; start < jsonData.length; start += chunkSize) {

            const chunk = jsonData.slice(start, start + chunkSize);

            for (let i = 0; i < chunk.length; i++) {

                const row = chunk[i];
                const rowNumber = start + i + 2;
                const connection = mm.openConnection();

                try {

                    let ID = normalize(row[excelIdField]);
                    let CUSTOMER_NAME = normalize(row[excelCustomerField]);
                    let CUSTOMER_EMAIL = normalize(row[excelCustomerEmailField]);
                    let ADDRESS_ID = normalize(row[excelAddressIdField]);
                    let FULL_NAME = normalize(row[excelFullNameField]);
                    let EMAIL_ID = normalize(row[excelEmailIdField]);
                    let COUNTRY_CODE = normalize(row[excelCountryCodeField]);
                    let MOBILE_NUMBER = normalize(row[excelMobileField]);
                    let IS_PRIMARY = normalize(row[excelPrimaryField]);
                    let IS_ACTIVE = normalize(row[excelActiveField]);

                    let activeValue = isEdit
                        ? (["Yes", "Active"].includes(IS_ACTIVE) ? "1" : "0")
                        : "1";

                    IS_PRIMARY = IS_PRIMARY == "Yes" ? "1" : "0";

                    if (CUSTOMER_NAME.includes("(")) {
                        CUSTOMER_NAME = CUSTOMER_NAME.split("(")[0].trim();
                    }

                    // REQUIRED VALIDATION
                    if (!CUSTOMER_NAME || !CUSTOMER_EMAIL || !ADDRESS_ID || !EMAIL_ID) {
                        skip("Missing required fields");
                        continue;
                    }

                    // GET CUSTOMER
                    const customerSp = await runQuery(
                        `CALL sp_vallidateCustomerforAddresImport(?,?)`,
                        [CUSTOMER_NAME, CUSTOMER_EMAIL],
                        supportKey,
                        connection
                    );
                    let customer = customerSp[0] ? customerSp[0] : [];
                    if (!customer.length) {
                        skip("Customer not found");
                        continue;
                    }

                    const CUSTOMER_ID = customer[0].ID;

                    // ADDRESS VALIDATION
                    const existingAddressSp = await runQuery(
                        `CALL sp_validateAddressForImport(?,?)`,
                        [ADDRESS_ID, CUSTOMER_ID],
                        supportKey,
                        connection
                    );

                    let existingAddress = existingAddressSp[0] ? existingAddressSp[0] : [];
                    if (!existingAddress.length) {
                        skip("Address not found for given address ID");
                        continue;
                    }

                    // EDIT MODE
                    if (isEdit) {

                        if (!ID) {
                            skip("Missing ID in Edit Mode");
                            continue;
                        }

                        const existingSp = await runQuery(
                            `CALL sp_validateAddressSpocMappingForEdit(?)`,
                            [ID],
                            supportKey,
                            connection
                        );
                        let existing = existingSp[0] ? existingSp[0] : [];

                        if (!existing.length) {
                            skip("Record not found for update");
                            continue;
                        }

                        const existingEmailSP = await runQuery(
                            `CALL sp_checkExistingEmailAddressSpocMappingForEdit(?,?,?,?,?)`,
                            [EMAIL_ID, CUSTOMER_ID, ADDRESS_ID, ID, IMPORT_TYPE],
                            supportKey,
                            connection
                        );
                        let existingEmail = existingEmailSP[0] ? existingEmailSP[0] : [];

                        if (existingEmail.length) {
                            skip("This email is already assigned as a SPOC for this address.");
                            continue;
                        }

                        await handlePrimaryLogic();

                        mm.commitConnection(connection);
                        success("Success", ID);
                    }

                    // CREATE MODE
                    else {

                        const existingSp = await runQuery(
                            `CALL sp_checkExistingEmailAddressSpocMappingForEdit(?,?,?,null,?)`,
                            [EMAIL_ID, CUSTOMER_ID, ADDRESS_ID, IMPORT_TYPE],
                            supportKey,
                            connection
                        );
                        let existing = existingSp[0] ? existingSp[0] : [];

                        if (existing.length) {
                            skip("This email is already assigned as a SPOC for this address.");
                            continue;
                        }

                        const insertPrimaryId = await handlePrimaryLogic(true);

                        mm.commitConnection(connection);
                        success("Success", insertPrimaryId);
                    }

                    // =======================
                    // REUSABLE HELPERS
                    // =======================

                    async function handlePrimaryLogic(isInsert = false) {
                        if (isInsert) {
                            // For INSERT
                            const result = await runQuery(
                                `CALL sp_insert_address_spoc_mapping(?, ?, ?, ?, ?, ?, ?, ?, ?, @inserted_id);
                                SELECT @inserted_id as inserted_id;`,
                                [
                                    CUSTOMER_ID,
                                    ADDRESS_ID,
                                    FULL_NAME,
                                    EMAIL_ID,
                                    MOBILE_NUMBER,
                                    IS_PRIMARY,
                                    activeValue,
                                    COUNTRY_CODE,
                                    1 // CLIENT_ID
                                ],
                                supportKey,
                                connection
                            );

                            // Extract inserted_id from result
                            let insertedId = null;
                            if (result && result[1] && result[1][0]) {
                                insertedId = result[1][0].inserted_id;
                            }
                            return insertedId;

                        } else {
                            // For UPDATE - no return value needed
                            await runQuery(
                                `CALL sp_update_address_spoc_mapping(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    parseInt(ID),
                                    CUSTOMER_ID,
                                    ADDRESS_ID,
                                    FULL_NAME,
                                    EMAIL_ID,
                                    MOBILE_NUMBER,
                                    IS_PRIMARY,
                                    activeValue,
                                    COUNTRY_CODE
                                ],
                                supportKey,
                                connection
                            );
                        }
                    }

                    function skip(reason) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                    }

                    function success(msg, ID) {
                        successCount++;
                        successDetails.push({ rowNumber, row, ID });
                        totalData.push({ ...row, IMPORT_STATUS: msg });
                    }

                } catch (err) {

                    mm.rollbackConnection(connection);
                    errorDetails.push({ rowNumber, reason: err.message });
                    errorData.push({ rowNumber, row, reason: err.message });
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
            message: "Address SPOC Mapping import completed.",
            totalRecords: jsonData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: errorDetails.length,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            totalData,
            errorData
        }
        const fs = require("fs");
        const path = require("path");

        // unique file name
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

        // write JSON file (pretty format for readability)
        fs.writeFileSync(filePath, JSON.stringify(response, null, 2), "utf8");

    } catch (error) {
        console.log(error);
    }
};


const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (err, results) => {
            if (err) {
                reject(err)
                mm.rollbackConnection(connection)
            }
            else resolve(results);
        });
    });
};
