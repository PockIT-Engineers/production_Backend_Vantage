const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require("../../modules/channelSubscribedUsers")
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
var customerSpocMapping = "customer_spoc_mapping";
var viewcustomerSpocMapping = "view_" + customerSpocMapping;

function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        BACKOFFICE_ID: req.body.BACKOFFICE_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('BACKOFFICE_ID').isInt().optional(),
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
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_customerSpocMapping_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get mapping list."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 208,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
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
        return res.status(422).json({
            "code": 422,
            "message": errors.array()
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerSpocMapping_create(?,?,?,?,?)`,
            [
                data.CUSTOMER_ID,
                data.BACKOFFICE_ID,
                data.IS_ACTIVE ? '1' : '0',
                data.IS_PRIMARY ? '1' : '0',
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to create mapping."
                    });
                }

                const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} created a new SPOC mapping for customer ${data.CUSTOMER_ID}`;
                const logCategory = "customerSPOC";

                let actionLog = {
                    SOURCE_ID: results[0][0].ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: logCategory,
                    CLIENT_ID: data.CLIENT_ID,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                };
                dbm.saveLog(actionLog, systemLog);

                res.send({
                    "code": 200,
                    "message": "Mapping created successfully."
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const id = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
            "message": errors.array()
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerSpocMapping_update(?,?,?,?,?,?)`,
            [
                id,
                data.CUSTOMER_ID,
                data.BACKOFFICE_ID,
                data.IS_ACTIVE ? '1' : '0',
                data.IS_PRIMARY ? '1' : '0',
                data.CLIENT_ID
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update mapping."
                    });
                }

                const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} updated SPOC mapping ${id}`;
                const logCategory = "customerSPOC";

                let actionLog = {
                    SOURCE_ID: id,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: logCategory,
                    CLIENT_ID: data.CLIENT_ID,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                };
                dbm.saveLog(actionLog, systemLog);

                res.send({
                    "code": 200,
                    "message": "Mapping updated successfully."
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.mapSPOC = async (req, res) => {
    const data = req.body.data;
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const CUSTOMER_ID = req.body.CUSTOMER_ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
            "message": errors.array()
        });
    }

    try {
        const connection = await mm.openConnectionAwait();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_customerSpocMapping_mapSPOC(?,?,?,?,?)`,
                [
                    CUSTOMER_ID,
                    roleDetailsItem.BACKOFFICE_ID,
                    roleDetailsItem.IS_ACTIVE ? '1' : '0',
                    roleDetailsItem.IS_PRIMARY ? '1' : '0',
                    1
                ],
                supportKey,
                connection,
                async (error, result) => {
                    if (error) {
                        console.log("error", error);
                        return inner_callback(error);
                    }
                    else {
                        if (result[0][0].IS_EXIST == 0) {
                            const existingChannel = await channelSubscribedUsers.findOne({
                                CHANNEL_NAME: `customer_spoc_${CUSTOMER_ID}_${roleDetailsItem.USER_ID}_channel`,
                                USER_ID: roleDetailsItem.USER_ID
                            });

                            if (!existingChannel) {
                                console.log("inn")
                                const channelData = {
                                    CHANNEL_NAME: `customer_spoc_${CUSTOMER_ID}_${roleDetailsItem.USER_ID}_channel`,
                                    USER_ID: roleDetailsItem.USER_ID,
                                    TYPE: "B",
                                    STATUS: roleDetailsItem.IS_ACTIVE,
                                    USER_NAME: roleDetailsItem.USER_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }
                                const newChannel = new channelSubscribedUsers(channelData);
                                await newChannel.save();
                            } else {
                                await channelSubscribedUsers.updateOne(
                                    { _id: existingChannel._id },
                                    {
                                        $set: {
                                            TYPE: "B",
                                            STATUS: roleDetailsItem.IS_ACTIVE,
                                            USER_NAME: roleDetailsItem.NAME,
                                            CLIENT_ID: 1,
                                            DATE: mm.getSystemDate()
                                        }
                                    }
                                );
                            }
                            inner_callback(null);
                        }
                        else {
                            const existingChannel = await channelSubscribedUsers.findOne({
                                CHANNEL_NAME: `customer_spoc_${CUSTOMER_ID}_${roleDetailsItem.USER_ID}_channel`,
                                USER_ID: roleDetailsItem.USER_ID
                            });

                            if (!existingChannel) {
                                const channelData = {
                                    CHANNEL_NAME: `customer_spoc_${CUSTOMER_ID}_${roleDetailsItem.USER_ID}_channel`,
                                    USER_ID: roleDetailsItem.USER_ID,
                                    TYPE: "B",
                                    STATUS: roleDetailsItem.IS_ACTIVE,
                                    USER_NAME: roleDetailsItem.USER_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }
                                const newChannel = new channelSubscribedUsers(channelData);
                                await newChannel.save();
                            } else {
                                await channelSubscribedUsers.updateOne(
                                    { _id: existingChannel._id },
                                    {
                                        $set: {
                                            TYPE: "B",
                                            STATUS: roleDetailsItem.IS_ACTIVE,
                                            USER_NAME: roleDetailsItem.NAME,
                                            CLIENT_ID: 1,
                                            DATE: mm.getSystemDate()
                                        }
                                    }
                                );
                            }


                        }
                    }
                }
            );
        },
            function subCb(error) {
                if (error) {
                    console.log("error", error);
                    mm.rollbackConnection(connection);
                    res.send({
                        "code": 400,
                        "message": "Failed to Insert customerSpocMapping information...",
                    });
                } else {
                    mm.commitConnection(connection);
                    res.send({
                        "code": 200,
                        "message": "Customer SPOC Mapping successfully updated",
                    });
                }
            });
    } catch (error) {
        console.log("Error in catch", error)
        if (connection) mm.rollbackConnection(connection);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.unMapSPOC = (req, res) => {
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    const data = req.body.data;
    const supportKey = req.headers["supportkey"];


    try {
        data.forEach(row => {
            row.IS_ACTIVE = row.IS_ACTIVE ? 1 : 0;
        });
        const connection = mm.openConnection();

        async.eachSeries(
            data,
            function iteratorOverElems(item, inner_callback) {

                mm.executeDML(
                    `CALL sp_customerSpocMapping_unmap(?, ?, ?)`,
                    [CUSTOMER_ID, item.BACKOFFICE_ID, item.IS_ACTIVE],
                    supportKey,
                    connection,
                    async (error) => {
                        if (error) {
                            console.log("error", error);
                            return inner_callback(error);
                        }

                        try {
                            const existingChannel = await channelSubscribedUsers.findOne({
                                CHANNEL_NAME: `customer_spoc_${CUSTOMER_ID}_${item.USER_ID}_channel`,
                                USER_ID: item.USER_ID
                            });

                            if (!existingChannel) {
                                const channelData = {
                                    CHANNEL_NAME: `customer_spoc_${CUSTOMER_ID}_${item.USER_ID}_channel`,
                                    USER_ID: item.USER_ID,
                                    TYPE: "B",
                                    STATUS: item.IS_ACTIVE,
                                    USER_NAME: item.USER_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                };
                                const newChannel = new channelSubscribedUsers(channelData);
                                await newChannel.save();
                            } else {
                                await channelSubscribedUsers.updateOne(
                                    { _id: existingChannel._id },
                                    {
                                        $set: {
                                            TYPE: "B",
                                            STATUS: item.IS_ACTIVE,
                                            USER_NAME: item.USER_NAME,
                                            CLIENT_ID: 1,
                                            DATE: mm.getSystemDate()
                                        }
                                    }
                                );
                            }

                            inner_callback(null);
                        } catch (mongoErr) {
                            console.log("Error in catch", mongoErr)
                            inner_callback(mongoErr);
                        }
                    }
                );
            },
            function subCb(error) {
                if (error) {
                    console.log("error", error);
                    mm.rollbackConnection(connection);
                    return res.send({
                        "code": 400,
                        "message": "Failed to unmap customer SPOC information."
                    });
                }

                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "Customer SPOC unmapped successfully."
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        if (connection) mm.rollbackConnection(connection);
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

exports.importCustomerSpocMapping = async (req, res) => {
    console.log("=== IMPORT CUSTOMER SPOC MAPPING STARTED ===");
    console.log("Timestamp:", new Date().toISOString());

    try {
        const supportKey = req.headers["supportkey"];
        console.log("Support Key:", supportKey ? "Present" : "Missing");

        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        console.log("Request Body:", {
            EXCEL_FILE_NAME,
            EXCEL_MASTER_ID,
            IMPORT_TYPE,
            COLUMN_JSON_LENGTH: COLUMN_JSON?.length || 0
        });

        if (!EXCEL_FILE_NAME) {
            console.error("ERROR: Missing EXCEL_FILE_NAME");
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });
        }

        console.log("Reading Excel file:", `./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        console.log("Excel Sheet Names:", workbook.SheetNames);

        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }
        );
        console.log(`Total rows in sheet: ${cleanedRows.length}`);

        const jsonData = cleanedRows.filter(row =>
            Object.values(row).some(v => String(v || "").trim() !== "")
        );
        console.log(`Filtered rows with data: ${jsonData.length}`);

        if (!jsonData.length) {
            console.log("WARNING: No data found in Excel file");
            return res.status(200).json({ code: 200, message: "No data found" });
        }

        console.log("Sending initial response to client");
        res.status(200).json({
            code: 200,
            message: "Customer SPOC Mapping import started...",
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

        console.log(`Import Mode: ${isEdit ? 'EDIT' : 'INSERT'}`);
        console.log(`Chunk Size: ${chunkSize}`);

        const normalize = v => v ? v.toString().trim() : "";

        // Columns mapping
        const excelIdField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "ID")?.EXCEL_FIELD;
        const excelCustomerField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "CUSTOMER_ID")?.EXCEL_FIELD || "Company Name";
        const excelCustomerEmailField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "CUSTOMER_EMAIL")?.EXCEL_FIELD || "Company Email";
        const excelSpocNameField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "BACKOFFICE_ID")?.EXCEL_FIELD || "Service Desk Member Name";
        const excelSpocEmailField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "SERVICE_DESK_MEMBER_EMAIL")?.EXCEL_FIELD || "Service Desk Member Email";
        const excelPrimaryField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "IS_PRIMARY")?.EXCEL_FIELD || "Is Primery";
        const excelActiveField = COLUMN_JSON?.find(c => c.TABLE_FIELD === "IS_ACTIVE")?.EXCEL_FIELD || "Is Active";

        console.log("Column Mapping:", {
            excelIdField,
            excelCustomerField,
            excelCustomerEmailField,
            excelSpocNameField,
            excelSpocEmailField,
            excelPrimaryField,
            excelActiveField
        });

        // Process data in chunks
        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);
            console.log(`\n=== Processing Chunk ${Math.floor(start / chunkSize) + 1} (Rows ${start + 1} to ${Math.min(start + chunkSize, jsonData.length)}) ===`);

            for (let i = 0; i < chunk.length; i++) {
                const row = chunk[i];
                const rowNumber = start + i + 2;

                console.log(`\n--- Processing Row ${rowNumber} ---`);
                console.log("Row Data:", JSON.stringify(row, null, 2));

                const connection = mm.openConnection();
                console.log("Database connection opened");

                try {
                    // Extract and normalize values
                    let ID = excelIdField ? normalize(row[excelIdField]) : null;
                    let CUSTOMER_NAME = normalize(row[excelCustomerField]);
                    let CUSTOMER_EMAIL = normalize(row[excelCustomerEmailField]);
                    let SPOC_NAME = normalize(row[excelSpocNameField]);
                    let SPOC_EMAIL = normalize(row[excelSpocEmailField]);
                    let IS_PRIMARY = normalize(row[excelPrimaryField]);
                    let IS_ACTIVE = normalize(row[excelActiveField]);

                    console.log("Extracted Values:", {
                        ID,
                        CUSTOMER_NAME,
                        CUSTOMER_EMAIL,
                        SPOC_NAME,
                        SPOC_EMAIL,
                        IS_PRIMARY,
                        IS_ACTIVE
                    });

                    let IS_PRIMARY_VAL = (IS_PRIMARY == "Yes" || IS_PRIMARY == "True" || IS_PRIMARY == "Primary") ? 1 : 0;
                    let IS_ACTIVE_VAL = isEdit ? (IS_ACTIVE == "Yes" || IS_ACTIVE == "Active" ? 1 : 0) : 1;

                    console.log("Processed Values:", {
                        IS_PRIMARY_VAL,
                        IS_ACTIVE_VAL
                    });

                    if (CUSTOMER_NAME && SPOC_NAME) {
                        let custName = CUSTOMER_NAME.split("(");
                        CUSTOMER_NAME = custName[0].trim();
                        let SpocName = SPOC_NAME.split("(");
                        SPOC_NAME = SpocName[0].trim();
                        console.log("Cleaned Customer Name:", CUSTOMER_NAME);
                    }

                    // Required validation
                    if (!CUSTOMER_NAME || !CUSTOMER_EMAIL || !SPOC_NAME || !SPOC_EMAIL) {
                        const missingFields = [];
                        if (!CUSTOMER_NAME) missingFields.push("CUSTOMER_NAME");
                        if (!CUSTOMER_EMAIL) missingFields.push("CUSTOMER_EMAIL");
                        if (!SPOC_NAME) missingFields.push("SPOC_NAME");
                        if (!SPOC_EMAIL) missingFields.push("SPOC_EMAIL");

                        console.log(`SKIPPED: Missing required fields - ${missingFields.join(", ")}`);

                        skippedCount++;
                        const reason = "Missing required fields: " + missingFields.join(", ");
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // Customer lookup using SP
                    console.log(`Looking up customer: "${CUSTOMER_NAME}" <${CUSTOMER_EMAIL}>`);
                    const customer = await runQuery(
                        `CALL sp_get_customer_by_name_email(?, ?)`,
                        [CUSTOMER_NAME, CUSTOMER_EMAIL],
                        supportKey,
                        connection
                    );

                    const customerResult = customer && customer[0] ? customer[0] : [];

                    if (!customerResult.length) {
                        console.log(`SKIPPED: Customer not found - "${CUSTOMER_NAME}" <${CUSTOMER_EMAIL}>`);
                        skippedCount++;
                        const reason = `Customer not found: ${CUSTOMER_NAME} (${CUSTOMER_EMAIL})`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const CUSTOMER_ID = customerResult[0].ID;
                    console.log(`Found Customer ID: ${CUSTOMER_ID}`);

                    // SPOC lookup using SP
                    console.log(`Looking up SPOC: "${SPOC_NAME}" <${SPOC_EMAIL}>`);
                    const spoc = await runQuery(
                        `CALL sp_get_backoffice_by_name_email(?, ?)`,
                        [SPOC_NAME, SPOC_EMAIL],
                        supportKey,
                        connection
                    );

                    const spocResult = spoc && spoc[0] ? spoc[0] : [];

                    if (!spocResult.length) {
                        console.log(`SKIPPED: Service Desk Member not found - "${SPOC_NAME}" <${SPOC_EMAIL}>`);
                        skippedCount++;
                        const reason = `Service Desk Member not found: ${SPOC_NAME} (${SPOC_EMAIL})`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const BACKOFFICE_ID = spocResult[0].USER_ID;
                    const USER_ID = spocResult[0].USER_ID;
                    const USER_NAME = spocResult[0].NAME;
                    console.log(`Found SPOC - ID: ${BACKOFFICE_ID}, USER_ID: ${USER_ID}, NAME: ${USER_NAME}`);

                    const channelName = `customer_spoc_${CUSTOMER_ID}_${USER_ID}_channel`;
                    console.log(`Channel Name: ${channelName}`);

                    // ========================================================
                    // EDIT MODE
                    // ========================================================
                    if (isEdit) {
                        console.log("Processing in EDIT mode");

                        if (!ID) {
                            console.log("SKIPPED: ID required for update");
                            skippedCount++;
                            const reason = "ID required for update";
                            skippedDetails.push({ rowNumber, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        console.log(`Checking existing mapping for ID: ${ID}`);
                        const existing = await runQuery(
                            `CALL sp_get_spoc_mapping_by_id(?)`,
                            [ID],
                            supportKey,
                            connection
                        );

                        const existingResult = existing && existing[0] ? existing[0] : [];

                        if (!existingResult.length) {
                            console.log(`SKIPPED: Mapping not found for ID ${ID}`);
                            skippedCount++;
                            const reason = `Mapping not found for ID ${ID}`;
                            skippedDetails.push({ rowNumber, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        if (IS_PRIMARY_VAL === 1) {
                            console.log(`Setting all other mappings as non-primary for CUSTOMER_ID: ${CUSTOMER_ID}`);
                            await runQuery(
                                `CALL sp_reset_primary_spoc(?)`,
                                [CUSTOMER_ID],
                                supportKey,
                                connection
                            );
                        }

                        console.log(`Updating mapping ID ${ID} with:`, {
                            CUSTOMER_ID,
                            BACKOFFICE_ID,
                            IS_PRIMARY_VAL,
                            IS_ACTIVE_VAL
                        });

                        await runQuery(
                            `CALL sp_update_spoc_mapping(?, ?, ?, ?, ?, ?)`,
                            [ID, CUSTOMER_ID, BACKOFFICE_ID, IS_PRIMARY_VAL, IS_ACTIVE_VAL, 1],
                            supportKey,
                            connection
                        );

                        // ---------------- CHANNEL SYNC (MongoDB - stays in API) ----------------
                        console.log("Syncing channel subscription...");
                        let existingChannel = await channelSubscribedUsers.findOne({
                            CHANNEL_NAME: channelName,
                            USER_ID
                        });

                        if (!existingChannel) {
                            console.log("Creating new channel subscription");
                            await new channelSubscribedUsers({
                                CHANNEL_NAME: channelName,
                                USER_ID,
                                TYPE: "B",
                                STATUS: IS_ACTIVE_VAL,
                                USER_NAME,
                                CLIENT_ID: 1,
                                DATE: mm.getSystemDate()
                            }).save();
                        } else {
                            console.log(`Updating existing channel subscription: ${existingChannel._id}`);
                            await channelSubscribedUsers.updateOne(
                                { _id: existingChannel._id },
                                {
                                    $set: {
                                        TYPE: "B",
                                        STATUS: IS_ACTIVE_VAL,
                                        USER_NAME,
                                        CLIENT_ID: 1,
                                        DATE: mm.getSystemDate()
                                    }
                                }
                            );
                        }

                        mm.commitConnection(connection);
                        console.log(`SUCCESS: Updated mapping ID ${ID}`);

                        successCount++;
                        successDetails.push({ rowNumber, row, ID });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                        continue;
                    }

                    // ========================================================
                    // NORMAL MODE (INSERT ONLY)
                    // ========================================================
                    console.log("Processing in INSERT mode");

                    const exists = await runQuery(
                        `CALL sp_check_spoc_mapping_exists(?, ?)`,
                        [CUSTOMER_ID, BACKOFFICE_ID],
                        supportKey,
                        connection
                    );

                    const existsResult = exists && exists[0] ? exists[0] : [];

                    if (existsResult.length) {
                        console.log(`SKIPPED: Mapping already exists for customer ${CUSTOMER_NAME} and spoc ${USER_NAME}`);
                        skippedCount++;
                        const reason = `Mapping already exists for customer ${CUSTOMER_NAME} and spoc ${USER_NAME}`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    if (IS_PRIMARY_VAL === 1) {
                        console.log(`Setting all other mappings as non-primary for CUSTOMER_ID: ${CUSTOMER_ID}`);
                        await runQuery(
                            `CALL sp_reset_primary_spoc(?)`,
                            [CUSTOMER_ID],
                            supportKey,
                            connection
                        );
                    }

                    console.log("Inserting new mapping with values:", {
                        CUSTOMER_ID,
                        BACKOFFICE_ID,
                        IS_PRIMARY_VAL,
                        IS_ACTIVE_VAL
                    });

                    const result = await runQuery(
                        `CALL sp_insert_spoc_mapping(?, ?, ?, ?, ?)`,
                        [CUSTOMER_ID, BACKOFFICE_ID, IS_PRIMARY_VAL, IS_ACTIVE_VAL, 1],
                        supportKey,
                        connection
                    );

                    const insertId = result && result[0] && result[0][0] ? 
                                     result[0][0].insertId : result[0]?.insertId;

                    console.log(`Inserted with ID: ${insertId}`);

                    // ---------------- CHANNEL SYNC (MongoDB - stays in API) ----------------
                    console.log("Syncing channel subscription...");
                    let existingChannel = await channelSubscribedUsers.findOne({
                        CHANNEL_NAME: channelName,
                        USER_ID
                    });

                    if (!existingChannel) {
                        console.log("Creating new channel subscription");
                        await new channelSubscribedUsers({
                            CHANNEL_NAME: channelName,
                            USER_ID,
                            TYPE: "B",
                            STATUS: IS_ACTIVE_VAL,
                            USER_NAME,
                            CLIENT_ID: 1,
                            DATE: mm.getSystemDate()
                        }).save();
                    } else {
                        console.log(`Updating existing channel subscription: ${existingChannel._id}`);
                        await channelSubscribedUsers.updateOne(
                            { _id: existingChannel._id },
                            {
                                $set: {
                                    TYPE: "B",
                                    STATUS: IS_ACTIVE_VAL,
                                    USER_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }
                            }
                        );
                    }

                    mm.commitConnection(connection);
                    console.log(`SUCCESS: Inserted mapping with ID ${insertId}`);

                    successCount++;
                    successDetails.push({ rowNumber, row, ID: insertId });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    console.error(`ERROR in Row ${rowNumber}:`, error.message);
                    console.error("Error Stack:", error.stack);

                    mm.rollbackConnection(connection);
                    console.log("Database connection rolled back");

                    errorDetails.push({ rowNumber, reason: error.message });
                    errorData.push({ rowNumber, row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);
            console.log(`Progress: ${progress}%`);

            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
            console.log("Updated excelMaster progress");
        }

        let response = {
            code: 200,
            message: "Customer SPOC Mapping import completed.",
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

        console.log("\n=== IMPORT SUMMARY ===");
        console.log("Total Records:", jsonData.length);
        console.log("Successful:", successCount);
        console.log("Skipped:", skippedCount);
        console.log("Failed:", errorDetails.length);
        console.log("Response:", JSON.stringify(response, null, 2));

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

        console.log("Final excelMaster update completed");
        console.log("=== IMPORT CUSTOMER SPOC MAPPING COMPLETED ===");

    } catch (error) {
        console.error("\n=== FATAL ERROR ===");
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
        console.error("Error occurred at:", new Date().toISOString());
        console.error("=== END FATAL ERROR ===");
    }
};


