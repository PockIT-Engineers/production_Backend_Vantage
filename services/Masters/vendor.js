const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
var vendorMaster = "vendor_master";
var viewVendorMaster = "view_" + vendorMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        BUSINESS_NAME: req.body.BUSINESS_NAME,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE_2: req.body.ADDRESS_LINE_2,
        PINCODE_ID: req.body.PINCODE_ID,
        CITY_ID: req.body.CITY_ID,
        STATE_ID: req.body.STATE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        CONTRACT_START_DATE: req.body.CONTRACT_START_DATE,
        CONTRACT_END_DATE: req.body.CONTRACT_END_DATE,
        PAN: req.body.PAN,
        GST_NO: req.body.GST_NO,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        DISTRICT_ID: req.body.DISTRICT_ID,
        ORG_ID: req.body.ORG_ID,
        PASSWORD: req.body.PASSWORD,
        CREATED_DATE: req.body.CREATED_DATE,
        USER_ID: req.body.USER_ID,
        PINCODE: req.body.PINCODE,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO
    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('MOBILE_NUMBER').optional(),
        body('EMAIL_ID').optional(),
        body('PASSWORD').optional(),
        body('CITY_ID').optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('PAN').optional(),
        body('GST_NO').optional(),
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
                setContext + `CALL sp_vendorMaster_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get vendor information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.send({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 133,
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
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.create = async(req, res) => {
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
            // data.PASSWORD = md5(data.PASSWORD);
            data.PASSWORD = await mm.hashPassword(data.PASSWORD);
            mm.executeQueryData(
                `CALL sp_vendorMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.NAME,
                    data.BUSINESS_NAME,
                    data.MOBILE_NUMBER,
                    data.EMAIL_ID,
                    data.ADDRESS_LINE_1,
                    data.ADDRESS_LINE_2,
                    data.PINCODE_ID,
                    data.CITY_ID,
                    data.STATE_ID,
                    data.COUNTRY_ID,
                    data.DISTRICT_ID,
                    data.PINCODE,
                    data.CONTRACT_START_DATE,
                    data.CONTRACT_END_DATE,
                    data.PAN,
                    data.GST_NO,
                    data.STATUS ? '1' : '0',
                    data.CLIENT_ID || 1,
                    data.COUNTRY_CODE,
                    data.ORG_ID,
                    data.PASSWORD,
                    data.PROFILE_PHOTO,
                    data.USER_ID,
                    data.CREATED_DATE || new Date()
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save vendor information..."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "Vendor information saved successfully...",
                        });
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

exports.createVendor = async(req, res) => {
    var data = reqData(req);
    var ROLE_ID = req.body.ROLE_ID || 9;
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
            // data.PASSWORD = md5(data.PASSWORD);
            data.PASSWORD = await mm.hashPassword(data.PASSWORD);
            mm.executeQueryData(
                `CALL sp_vendorMaster_createVendor(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.NAME,
                    data.BUSINESS_NAME,
                    data.MOBILE_NUMBER,
                    data.EMAIL_ID,
                    data.ADDRESS_LINE_1,
                    data.ADDRESS_LINE_2,
                    data.PINCODE_ID,
                    data.CITY_ID,
                    data.STATE_ID,
                    data.COUNTRY_ID,
                    data.DISTRICT_ID,
                    data.PINCODE,
                    data.CONTRACT_START_DATE,
                    data.CONTRACT_END_DATE,
                    data.PAN,
                    data.GST_NO,
                    data.STATUS ? '1' : '0',
                    data.CLIENT_ID || 1,
                    data.COUNTRY_CODE,
                    data.ORG_ID,
                    data.PASSWORD,
                    data.PROFILE_PHOTO,
                    data.USER_ID,
                    data.CREATED_DATE || new Date(),
                    ROLE_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save vendor information..."
                        });
                    }
                    else {
                        const r = results[0][0];

                        if (r.code == 200) {
                            const vendorId = r.ID;
                            const userId = r.USER_ID;

                            // Save action log
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new vendor ${data.NAME}.`;
                            var logCategory = "V";

                            let actionLog = {
                                "SOURCE_ID": vendorId,
                                "LOG_DATE_TIME": mm.getSystemDate(),
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                "supportKey": 0
                            };

                            dbm.saveLog(actionLog, systemLog);

                            // Send email
                            mm.sendDynamicEmail(3, vendorId, supportKey);

                            // Add global data
                            addGlobalData(vendorId, supportKey);

                            // Create channel subscriptions
                            const channels = [
                                {
                                    CHANNEL_NAME: `pincode_${data.PINCODE_ID}_channel`,
                                    USER_ID: userId,
                                    TYPE: "V",
                                    STATUS: true,
                                    USER_NAME: data.NAME,
                                    CLIENT_ID: data.CLIENT_ID,
                                    DATE: mm.getSystemDate()
                                },
                                {
                                    CHANNEL_NAME: 'system_alerts_channel',
                                    USER_ID: userId,
                                    TYPE: "V",
                                    STATUS: true,
                                    USER_NAME: data.NAME,
                                    CLIENT_ID: data.CLIENT_ID,
                                    DATE: mm.getSystemDate()
                                },
                                {
                                    CHANNEL_NAME: 'vendor_channel',
                                    USER_ID: userId,
                                    TYPE: "V",
                                    STATUS: true,
                                    USER_NAME: data.NAME,
                                    CLIENT_ID: data.CLIENT_ID,
                                    DATE: mm.getSystemDate()
                                }
                            ];

                            channels.forEach(channelData => {
                                const channel = new channelSubscribedUsers(channelData);
                                channel.save();
                            });

                            res.send({
                                "code": 200,
                                "message": "Vendor information saved successfully...",
                            });
                        } else if (r.code == 301) {
                            res.send({
                                "code": r.code,
                                "message": r.message
                            });
                        } else if (r.code == 302) {
                            res.send({
                                "code": r.code,
                                "message": r.message
                            });
                        } else if (r.code == 303) {
                            res.send({
                                "code": r.code,
                                "message": r.message
                            });
                        }
                        else {
                            res.send({
                                "code": 400,
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

exports.update = async(req, res) => {
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
            if (data.PASSWORD) {
                // data.PASSWORD = md5(data.PASSWORD);
                data.PASSWORD = await mm.hashPassword(data.PASSWORD);
            }

            mm.executeQueryData(
                `CALL sp_vendorMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    ID,
                    data.NAME,
                    data.BUSINESS_NAME,
                    data.EMAIL_ID,
                    data.MOBILE_NUMBER,

                    data.ADDRESS_LINE_1,
                    data.ADDRESS_LINE_2,
                    data.PINCODE_ID,
                    data.CITY_ID,
                    data.STATE_ID,
                    data.COUNTRY_ID,
                    data.DISTRICT_ID,
                    data.PINCODE,

                    data.CONTRACT_START_DATE,
                    data.CONTRACT_END_DATE,
                    data.PAN,
                    data.GST_NO,

                    data.STATUS,
                    data.CLIENT_ID,
                    data.COUNTRY_CODE,
                    data.ORG_ID,

                    data.PASSWORD,
                    data.PROFILE_PHOTO,
                    data.USER_ID,
                    mm.getSystemDate()
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update vendor information."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "Vendor information updated successfully...",
                        });
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

exports.updateVendor = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var ROLE_ID = req.body.ROLE_ID || 9;
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
                `CALL sp_vendorMaster_updateVendor(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    ID,
                    data.NAME,
                    data.BUSINESS_NAME,
                    data.EMAIL_ID,
                    data.MOBILE_NUMBER,

                    data.ADDRESS_LINE_1,
                    data.ADDRESS_LINE_2,
                    data.PINCODE_ID,
                    data.CITY_ID,
                    data.STATE_ID,
                    data.COUNTRY_ID,
                    data.DISTRICT_ID,
                    data.PINCODE,

                    data.CONTRACT_START_DATE,
                    data.CONTRACT_END_DATE,
                    data.PAN,
                    data.GST_NO,

                    data.STATUS,
                    data.CLIENT_ID,
                    data.COUNTRY_CODE,
                    data.ORG_ID,

                    data.PASSWORD,
                    data.PROFILE_PHOTO,
                    data.USER_ID,
                    mm.getSystemDate(),
                    ROLE_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update vendor information."
                        });
                    }
                    else {
                        const r = results[0][0];

                        if (r.code == 200) {
                            // Save action log
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of the vendor ${data.NAME}.`;
                            var logCategory = "Vendor";

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

                            // Add global data
                            addGlobalData(ID, supportKey);

                            res.send({
                                "code": 200,
                                "message": r.message,
                            });
                        } else if (r.code == 301) {
                            res.send({
                                "code": r.code,
                                "message": r.message
                            });
                        } else if (r.code == 302) {
                            res.send({
                                "code": r.code,
                                "message": r.message
                            });
                        } else if (r.code == 303) {
                            res.send({
                                "code": r.code,
                                "message": r.message
                            });
                        }
                        else {
                            res.send({
                                "code": 400,
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

function addGlobalData(data_Id, supportKey) {
    try {
        const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = "ID";
        SET @v_SORT_VALUE = "desc";
        SET @v_FILTER = ' AND ID=${data_Id}';
    `;
        mm.executeQueryData(setContext + `CALL sp_vendorMaster_get()`, [], supportKey, (error, results1) => {
            if (error) {
                console.log(error);
            }
            else {
                const resultSets = results1.filter(r => Array.isArray(r));
                const results5 = resultSets[1] || [];
                console.log("data retrieved");
                if (results5.length > 0) {
                    let logData = { ID: data_Id, CATEGORY: "Vendor", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/vendor_master", TERRITORY_ID: 0 };
                    dbm.addDatainGlobalmongo(logData.ID, logData.CATEGORY, logData.TITLE, logData.DATA, logData.ROUTE, logData.TERRITORY_ID)
                        .then(() => {
                            console.log("Data added/updated successfully.");
                        })
                        .catch(error => {
                            console.error("Error in addDatainGlobalmongo:", error);
                        });
                } else {
                    console.log(" no data found");
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

function sendWelcomeEmail(emailId, name, mobileNumber) {
    const to = emailId;
    const subject = `Welcome to Vantage – We’re Excited to Have You!`;
    const body = `
        <p>Hi ${name},</p>
        <p>Welcome to <strong>Vantage</strong>. Your account has been created successfully, and we’re thrilled to have you on board!</p>
        <p>If you have any questions or need assistance, feel free to reach out to us at any time. We look forward to working with you!</p>
        <br>
        <p>Best regards,</p>
        <p><strong>The Vantage Team</strong></p>`;
    const TEMPLATE_NAME = 'VENDOR_WELCOME_EMAIL';
    const ATTACHMENTS = '';

    mm.sendEmail(to, [], subject, body, TEMPLATE_NAME, ATTACHMENTS, (error, results) => {
        if (error) {
            console.error('Failed to send welcome email:', error);
        } else {
            console.log('Welcome email sent successfully:', results);
        }
    });
}



const checkVendorDuplicate = async (data, isEdit, supportKey, connection) => {
    const vendorId = isEdit ? data.ID : 0;
    const result = await runSP('sp_check_vendor_duplicates', [data.EMAIL_ID, data.MOBILE_NUMBER, vendorId], supportKey, connection);

    const userEmailDup = result[0] || [];
    const vendorEmailDup = result[1] || [];
    const vendorMobileDup = result[2] || [];

    if (userEmailDup.length) return "Email ID already exists";
    if (vendorEmailDup.length) return "Email ID already exists in vendor master";
    if (vendorMobileDup.length) return "Mobile number already exists";

    return null;
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

exports.importVendor = async (req, res) => {
    try {
        const supportKey = req.headers['supportkey'];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing parameter: EXCEL_FILE_NAME." });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found in the Excel file." });

        res.status(200).json({
            code: 200,
            message: "Import started. Processing in background...",
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
        let systemDate = mm.getSystemDate();
        let total = jsonData.length;

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (const [index, row] of chunk.entries()) {
                let rowNum = start + index + 2;
                const connection = mm.openConnection();
                try {
                    const isEdit = IMPORT_TYPE == "E";
                    const data = {};
                    COLUMN_JSON.forEach(c => data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null);

                    if (isEdit) {
                        data.STATUS = data.STATUS == "Active" ? 1 : 0;
                    }
                    if (!data.NAME || !data.EMAIL_ID || !data.MOBILE_NUMBER || !data.PINCODE_ID || !data.STATE_NAME || !data.COUNTRY_NAME || !data.DISTRICT_NAME) {
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

                    if (isEdit && data.ID) {
                        const checkExistResult = await runSP('sp_get_vendor_by_id', [data.ID], supportKey, connection);
                        const checkExist = checkExistResult[0] || [];
                        if (checkExist.length == 0) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: `Vendor ID ${data.ID} does not exist`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Vendor ID ${data.ID} does not exist` });
                            mm.rollbackConnection(connection)
                            continue;
                        }
                    }

                    const duplicateReason = await checkVendorDuplicate(data, isEdit, supportKey, connection);
                    if (duplicateReason) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: duplicateReason,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: duplicateReason });
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    var getPincodeResult = await runSP('sp_get_pincode_by_value', [data.PINCODE_ID], supportKey, connection);
                    var getPincode = getPincodeResult[0] || [];
                    if (getPincode.length == 0) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `'${data.PINCODE_ID}' pincode not exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `'${data.PINCODE_ID}' pincode not exists` });
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    var getStateResult = await runSP('sp_get_state_by_name', [data.STATE_NAME], supportKey, connection);
                    var getState = getStateResult[0] || [];
                    if (getState.length == 0) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `'${data.STATE_NAME}' state not exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "State not exist" });
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    var getCountryResult = await runSP('sp_get_country_by_name', [data.COUNTRY_NAME], supportKey, connection);
                    var getCountry = getCountryResult[0] || [];
                    if (getCountry.length == 0) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `'${data.COUNTRY_NAME}' country not exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Country not exist" });
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    var getDistrictResult = await runSP('sp_get_district_by_name', [data.DISTRICT_NAME], supportKey, connection);
                    var getDistrict = getDistrictResult[0] || [];


                    if (getDistrict.length == 0) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `'${data.DISTRICT_NAME}' district not exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "District not exist" });
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    data.PINCODE_ID = getPincode[0].ID
                    data.PINCODE = getPincode[0].PINCODE
                    data.STATE_ID = getState[0].ID
                    data.COUNTRY_CODE = data.COUNTRY_CODE ?? getCountry[0].COUNTRY_CODE
                    data.COUNTRY_ID = getCountry[0].ID
                    data.DISTRICT_ID = getDistrict[0].ID
                    data.CLIENT_ID = 1
                    delete data.STATE_NAME;
                    delete data.COUNTRY_NAME;
                    delete data.DISTRICT_NAME;
                    // let PASSWORD = data.PASSWORD ? md5(data.PASSWORD) : md5("Admin@123");
                    let PASSWORD = data.PASSWORD ? await mm.hashPassword(data.PASSWORD) : await mm.hashPassword("Admin@123");

                    if (isEdit) {
                        console.log("Data before update", data);
                        // data.STATUS = data.STATUS == "Active" ? 1 : 0;
                        // Add CREATED_MODIFIED_DATE to the data object
                        data.CREATED_MODIFIED_DATE = systemDate;

                        // Build the SET clause and collect values
                        let setClauses = [];
                        let values = [];

                        Object.keys(data).forEach(key => {
                            if (key !== "ID" && data[key] !== undefined) {
                                setClauses.push(`${key} = ?`);
                                values.push(data[key]);
                            }
                        });

                        // Generate the complete query with actual values
                        let completeQuery = `UPDATE vendor_master SET ${setClauses.join(', ')} WHERE ID = ${data.ID}`;

                        // Replace each ? placeholder with actual formatted values
                        values.forEach(value => {
                            let formattedValue;

                            if (value === null || value === undefined) {
                                formattedValue = 'NULL';
                            } else if (typeof value === 'string') {
                                // Escape single quotes and wrap in quotes
                                formattedValue = `'${value.replace(/'/g, "''")}'`;
                            } else if (typeof value === 'number') {
                                formattedValue = value;
                            } else if (value instanceof Date) {
                                formattedValue = `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                            } else {
                                formattedValue = `'${String(value).replace(/'/g, "''")}'`;
                            }

                            // Replace first occurrence of ? with formatted value
                            completeQuery = completeQuery.replace('?', formattedValue);
                        });



                        // Pass the complete query to the stored procedure
                        await new Promise((resolve, reject) => {
                            mm.executeDML(
                                `CALL sp_executeDynamicQuery(?)`,
                                [completeQuery],  // Pass the complete query string
                                supportKey,
                                connection,
                                (e) => e ? reject(e) : resolve()
                            );
                        });

                        console.log("\n\n*************")
                        console.log("Data:", data);
                        console.log("\n\n*************")

                        await runSP('sp_update_user_by_vendor_id', [data.ID, data.NAME, data.EMAIL_ID, data.MOBILE_NUMBER, systemDate, data.STATUS], supportKey, connection);

                        await runSP('sp_update_user_role_by_vendor_id', [data.ID, 9, systemDate], supportKey, connection);

                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of the vendor ${data.NAME}.`;
                        var logCategory = "Vendor";
                        let actionLog = {
                            "SOURCE_ID": data.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }

                        mm.commitConnection(connection)
                        dbm.saveLog(actionLog, systemLog)
                        addGlobalData(data.ID, supportKey)

                    } else {

                        Object.keys(data).forEach(key => {
                            if (data[key] === undefined) {
                                data[key] = null;
                            }
                        });
                        data.STATUS = 1;
                        const vendorInsertResult = await runSP('sp_insert_vendor', [
                            data.NAME, data.EMAIL_ID, data.MOBILE_NUMBER, data.BUSINESS_NAME,
                            data.ADDRESS_LINE_1, data.ADDRESS_LINE_2,
                            data.COUNTRY_ID, data.STATE_ID, data.DISTRICT_ID, data.PINCODE_ID,
                            data.PINCODE, data.GST_NO, data.STATUS, data.CLIENT_ID,
                            systemDate, PASSWORD, data.COUNTRY_CODE
                        ], supportKey, connection);

                        const vendorInsertId = vendorInsertResult[0][0].insertId;


                        const vendorUserInsertResult = await runSP('sp_insert_user_for_vendor', [
                            9, data.NAME, data.EMAIL_ID, 1, vendorInsertId, 1, 1, PASSWORD, data.MOBILE_NUMBER
                        ], supportKey, connection);

                        const vendorUserInsertId = vendorUserInsertResult[0][0].insertId;


                        await runSP('sp_insert_user_role_mapping', [vendorUserInsertId, 9, data.CLIENT_ID], supportKey, connection);

                        await runSP('sp_update_vendor_user_id', [vendorInsertId, vendorUserInsertId], supportKey, connection);

                        mm.commitConnection(connection)

                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new vendor ${data.NAME}.`;
                        var logCategory = "V";

                        let actionLog = {
                            "SOURCE_ID": vendorInsertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        dbm.saveLog(actionLog, systemLog)
                        addGlobalData(vendorInsertId, supportKey)

                        const chanelData = {
                            CHANNEL_NAME: `pincode_${data.PINCODE_ID}_channel`,
                            USER_ID: vendorUserInsertId,
                            TYPE: "V",
                            STATUS: true,
                            USER_NAME: data.NAME,
                            CLIENT_ID: data.CLIENT_ID,
                            DATE: mm.getSystemDate()
                        }
                        const chanel = new channelSubscribedUsers(chanelData);
                        chanel.save()

                        const chanelData2 = {
                            CHANNEL_NAME: 'system_alerts_channel',
                            USER_ID: vendorUserInsertId,
                            TYPE: "V",
                            STATUS: true,
                            USER_NAME: data.NAME,
                            CLIENT_ID: data.CLIENT_ID,
                            DATE: mm.getSystemDate()
                        }
                        const chanel2 = new channelSubscribedUsers(chanelData2);
                        chanel2.save()

                        const chanelData1 = {
                            CHANNEL_NAME: 'vendor_channel',
                            USER_ID: vendorUserInsertId,
                            TYPE: "V",
                            STATUS: true,
                            USER_NAME: data.NAME,
                            CLIENT_ID: data.CLIENT_ID,
                            DATE: mm.getSystemDate()
                        }
                        const chanel1 = new channelSubscribedUsers(chanelData1);
                        chanel1.save()
                    }
                    successCount++;
                    successDetails.push({ rowNumber: index + 2, row, });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (err) {
                    mm.rollbackConnection(connection);
                    errorDetails.push({ rowNumber: index + 2, reason: err.message });
                    errorData.push({ rowNumber: index + 2, row, reason: err.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, { PROGRESS: progress, STATUS: "Processing" });
        }

        let response = {
            code: 200,
            message: "Vendor import process completed.",
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

    }
};
