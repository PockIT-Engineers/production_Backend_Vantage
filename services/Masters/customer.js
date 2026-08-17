const mm = require('../../utilities/globalModule');
const dbm = require('../../utilities/dbMongo');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const jwt = require('jsonwebtoken');
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
const async = require('async');
var customerMaster = "customer_master";
var viewCustomerMaster = "view_" + customerMaster;
const xlsx = require('xlsx')
const excelMaster = require("../../modules/excelImportMaster");
const bcrypt = require('bcrypt');

function reqData(req) {
    var data = {
        CUSTOMER_CATEGORY_ID: req.body.CUSTOMER_CATEGORY_ID,
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        SALUTATION: req.body.SALUTATION,
        MOBILE_NO: req.body.MOBILE_NO,
        REGISTRATION_DATE: mm.getSystemDate(),
        ACCOUNT_STATUS: req.body.ACCOUNT_STATUS ? '1' : '0',
        COMPANY_NAME: req.body.COMPANY_NAME,
        ALTERNATE_MOBILE_NO: req.body.ALTERNATE_MOBILE_NO,
        CURRENT_ADDRESS_ID: req.body.CURRENT_ADDRESS_ID,
        PASSWORD: req.body.PASSWORD,
        PAN: req.body.PAN,
        GST_NO: req.body.GST_NO,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        CLOUD_ID: req.body.CLOUD_ID,
        DEVICE_ID: req.body.DEVICE_ID,
        LOGOUT_DATETIME: null,
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        ALTCOUNTRY_CODE: req.body.ALTCOUNTRY_CODE,
        IS_SPECIAL_CATALOGUE: req.body.IS_SPECIAL_CATALOGUE ? '1' : '0',
        IS_PARENT: req.body.IS_PARENT,
        CUSTOMER_MANAGER_ID: req.body.CUSTOMER_MANAGER_ID,
        SHORT_CODE: req.body.SHORT_CODE,
        INDIVIDUAL_COMPANY_NAME: req.body.INDIVIDUAL_COMPANY_NAME,
        COMPANY_ADDRESS: req.body.COMPANY_ADDRESS,
        IS_HAVE_GST: req.body.IS_HAVE_GST ? '1' : '0',
        VAT_NUMBER: req.body.VAT_NUMBER,
        SITE_NUMBER: req.body.SITE_NUMBER,
        WEEKLY_HOLIDAY: req.body.WEEKLY_HOLIDAY,
        PARENT_CUSTOMER_ID: req.body.PARENT_CUSTOMER_ID
    }
    return data;
}

exports.validate = function () {
    return [
        // body('CUSTOMER_CATEGORY_ID').isInt().optional(),
        body('CUSTOMER_TYPE').optional(),
        body('NAME').optional(),
        body('EMAIL').optional(),
        body('REGISTRATION_DATE').optional(),
        body('COMPANY_NAME').optional(),
        body('ALTERNATE_MOBILE_NO').optional(),
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

    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({ "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_customer_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    return res.status(400).json({ "code": 400, "message": "Failed to get customers." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 20,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


function addGlobalData(data_Id, supportKey) {
    const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND ID=${data_Id}';
    `;
    try {
        mm.executeQueryData(setContext + `CALL sp_customer_get()`, [], supportKey, (error, results1) => {
            if (error) {
                console.log(error);
            }
            else {
                const resultSets = results1.filter(r => Array.isArray(r));
                const results5 = resultSets[1] || [];
                console.log("data retrieved", results5);
                if (results5.length > 0) {
                    // require('../global').addDatainGlobal(data_Id, "Customer", results5[0].NAME, JSON.stringify(results5[0]), "/masters/customer",0, supportKey)
                    let logData = { ID: data_Id, CATEGORY: "Customer", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/customer", TERRITORY_ID: 0 };
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


exports.changePassword = async (req, res) => {

    var OLD_PASSWORD = req.body.OLD_PASSWORD;
    OLD_PASSWORD = await mm.hashPassword(OLD_PASSWORD);
    // OLD_PASSWORD = md5(OLD_PASSWORD);

    var NEW_PASSWORD = req.body.NEW_PASSWORD;
    // NEW_PASSWORD = md5(NEW_PASSWORD);
    NEW_PASSWORD = await mm.hashPassword(NEW_PASSWORD);

    var ID = req.body.ID;
    var systemDate = mm.getSystemDate();

    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(
            "CALL sp_customer_changePassword(?,?,?,?)",
            [ID, OLD_PASSWORD, NEW_PASSWORD, systemDate],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    return res.send({
                        "code": 400,
                        "message": "Failed to save user information..."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const spRes = resultSets[0] || [];

                const code = spRes[0] ? spRes[0].code : 400;
                const message = spRes[0] ? spRes[0].message : "Failed to update user information.";
                const updatedId = spRes[0] ? spRes[0].ID : 0;
                const customerName = spRes[0] ? spRes[0].CUSTOMER_NAME : null;

                if (code == 200) {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has changed the password for ${customerName}.`;
                    var logCategory = "customer";

                    let actionLog = {
                        "SOURCE_ID": updatedId,
                        "LOG_DATE_TIME": mm.getSystemDate(),
                        "LOG_TEXT": ACTION_DETAILS,
                        "CATEGORY": logCategory,
                        "CLIENT_ID": 1,
                        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "supportKey": 0
                    };

                    return res.send({
                        code: 200,
                        message: "customer information  saved successfully.",
                        "ID": updatedId
                    });
                } else {
                    return res.send({
                        "code": 400,
                        "message": "Password not match"
                    });
                }
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.forgetPassword = async (req, res) => {
    try {
        const { EMAIL_ID, PASSWORD } = req.body;
        const supportKey = req.headers["supportkey"];

        if (!EMAIL_ID || !PASSWORD) {
            return res.send({
                code: 400,
                message: "EMAIL_ID and PASSWORD parameter missing."
            });
        }

        const connection = mm.openConnection();

        mm.executeDML(
            `CALL sp_customerMaster_forgetPassword(?, ?)`,
            [EMAIL_ID, PASSWORD],
            supportKey,
            connection,
            (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    return res.send({
                        code: 500,
                        message: "Failed to update password."
                    });
                }

                mm.commitConnection(connection);

                return res.send(results[0][0]);
            }
        );

    } catch (error) {
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong."
        });
    }
};

function generateToken(userId, res, resultsUser, userDetails1, flag) {

    try {
        let SECRET_KEY;
        if (flag == "customer") {
            SECRET_KEY = process.env.PANEL_SECRET
        } else {
            SECRET_KEY = process.env.WEB_SECRET
        }
        var data = {
            "USER_ID": userId,
            "UserData": userDetails1
        }

        jwt.sign({ data }, SECRET_KEY, (error, token) => {
            if (error) {
                console.log("token error", error);
                res.status(400).json({
                    "message": "Failed to login.",

                });
            }
            else {
                res.status(200).json({
                    "code": 200,
                    "message": "Logged in successfully.",
                    "token": token,
                    "UserData": resultsUser,
                    "isPresent": resultsUser.isPresent
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendOTPToDevice = (req, res) => {
    var TYPE = "E"; // Fixed as "E" like in your code
    var TYPE_VALUE = req.body.TYPE_VALUE;
    var systemDate = mm.getSystemDate();
    var COUNTRY_CODE = req.body.COUNTRY_CODE;
    var CUSTOMER_TYPE = req.body.CUSTOMER_TYPE;
    var supportKey = req.headers["supportkey"];

    try {
        if (TYPE && TYPE != " " && TYPE_VALUE && TYPE_VALUE != " " && CUSTOMER_TYPE && CUSTOMER_TYPE != " ") {

            // Generate OTP (EXACT same logic)
            var OTP;
            if ((TYPE_VALUE == "8669806792" || TYPE_VALUE == "7666832817") && TYPE == "M") {
                OTP = mm.getOtp();
            } else {
                OTP = mm.getOtp();
            }


            mm.executeQueryData(
                `CALL sp_customer_sendOTPToDevice(?,?,?,?,?)`,
                [COUNTRY_CODE == null ? 'E' : 'M', TYPE_VALUE, systemDate, COUNTRY_CODE, CUSTOMER_TYPE],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get OTP details",
                        });
                    } else {
                        const resultData = results[0][0];
                        console.log("resultData", resultData)
                        if (resultData.code === 400) {
                            // Handle different 400 error messages
                            if (resultData.message === 'The user is not registered or has been deactivated.') {
                                res.status(400).send({
                                    "code": 400,
                                    "message": resultData.message,
                                    isPresent: resultData.isPresent || 0
                                });
                            } else {
                                res.send({
                                    "code": 400,
                                    "message": resultData.message,
                                });
                            }
                        }
                        else if (resultData.code === 200) {
                            var body = `Your one-time password (OTP) is ${OTP}. Please enter this code to complete your login. This code is valid for 10 minutes. Team UVtechSoft.`;

                            // EXACT same logic for sending OTP
                            if (resultData.hasExistingRecord === 1) {
                                // Existing record - check email for TYPE='E' (EXACT same logic)
                                if (TYPE == 'E' && (resultData.EMAIL_ID == "" || resultData.EMAIL_ID == null || resultData.EMAIL_ID == undefined)) {
                                    return res.send({
                                        "code": 400,
                                        "message": "Email is not registered with this mobile number.",
                                    });
                                }

                                console.log(" Already in registration attempt details:", resultData.RID);

                                // Send OTP (EXACT same logic)
                                sendOtp("E", resultData.EMAIL_ID, "OTP Verify", body, OTP, resultData.USER_NAME, supportKey, (error, result) => {
                                    if (error) {
                                        console.log(error);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to send OTP",
                                        });
                                    } else {
                                        console.log("OTP send to mobile");
                                        res.send({
                                            "code": 200,
                                            "message": "OTP sent to mobile.",
                                            RID: resultData.RID,
                                            VID: result,
                                            USER_ID: resultData.USER_ID,
                                            USER_NAME: resultData.USER_NAME,
                                            EMAIL_ID: resultData.EMAIL_ID,
                                            CUSTOMER_TYPE: resultData.CUSTOMER_TYPE
                                        });
                                    }
                                });
                            } else {
                                // New record - check email for TYPE='E' (EXACT same logic)
                                if (TYPE == 'E' && (resultData.EMAIL_ID == "" || resultData.EMAIL_ID == null || resultData.EMAIL_ID == undefined)) {
                                    return res.send({
                                        "code": 400,
                                        "message": "Email is not registered with this mobile number.",
                                    });
                                }

                                // Update OTP in the newly created record (EXACT same logic would be in Node.js)
                                // But in your original code, OTP is passed in the INSERT
                                // We need to update it

                                // Send OTP (EXACT same logic)
                                sendOtp(TYPE, resultData.EMAIL_ID, "OTP Verify", body, OTP, resultData.USER_NAME, supportKey, (error, result) => {
                                    if (error) {
                                        console.log(error);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to send OTP",
                                        });
                                    } else {
                                        console.log("OTP send to mobile");
                                        res.send({
                                            "code": 200,
                                            "message": "OTP sent to mobile.",
                                            RID: resultData.RID,
                                            VID: result,
                                            isPresent: resultData.isPresent || 1,
                                            USER_ID: resultData.USER_ID,
                                            USER_NAME: resultData.USER_NAME,
                                            EMAIL_ID: resultData.EMAIL_ID,
                                            CUSTOMER_TYPE: resultData.CUSTOMER_TYPE
                                        });
                                    }
                                });
                            }
                        }
                        else {
                            res.send({
                                "code": resultData.code,
                                "message": resultData.message,
                            });
                        }
                    }
                }
            );
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
    }
};

//p
exports.registerOtp = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const TYPE = req.body.TYPE;
    const TYPE_VALUE = req.body.TYPE_VALUE;
    const MOBILE_NO = req.body.MOBILE_NO;
    const EMAIL = req.body.EMAIL_ID;
    const CUSTOMER_TYPE = req.body.CUSTOMER_TYPE;

    if (!TYPE || !TYPE_VALUE || !CUSTOMER_TYPE) {
        return res.send({ "code": 400, "message": "Parameter missing." });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customer_registerOtp(?,?,?,?,?)`,
            [TYPE, TYPE_VALUE, MOBILE_NO, EMAIL, CUSTOMER_TYPE],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400, "message": 'Failed to get customer details from customer_email_master.' });
                }
                else {
                    const r = result[0][0];
                    if (r.code == 200) {
                        addingB2BCustomerData(req, res, connection, supportKey);
                    }
                    else {
                        return res.send(r)
                    }
                }
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500, "message": "Internal server error." });
    }
};

function sendSMSEmail(type, to, OTP, subject, body, callback) {
    if (type == "M") {
        callback(null, "SMS sent"); // Simulate successful SMS sending
    } else if (type == "E") {
        let data = {
            USER_ID: '',
            TYPE: 'text',
            ATTACHMENT: '',
        }
        mm.sendEmail(to, [], subject, body, 'Customer Login OTP', "", (error, results) => {
            if (error) {
                console.log(error);
                callback(null, results);
            } else {
                callback(null, results);
            }
        });
    }
};


exports.verifyOTP = (req, res) => {
    try {

        var type = "c";
        var TYPE = req.body.TYPE;
        var TYPE_VALUE = req.body.TYPE_VALUE;
        var OTP = req.body.OTP;
        var USER_ID = req.body.USER_ID;
        var IS_NEW_CUSTOMER = req.body.IS_NEW_CUSTOMER;

        var supportKey = req.headers["supportkey"];
        var systemDate = mm.getSystemDate();

        var CUSTOMER_NAME = req.body.CUSTOMER_NAME
        var CUSTOMER_EMAIL_ID = req.body.CUSTOMER_EMAIL_ID
        var CUSTOMER_MOBILE_NO = req.body.CUSTOMER_MOBILE_NO
        var CUSTOMER_TYPE = req.body.CUSTOMER_TYPE
        var CLOUD_ID = req.body.CLOUD_ID
        var W_CLOUD_ID = req.body.W_CLOUD_ID
        var DEVICE_ID = req.body.DEVICE_ID
        var COUNTRY_CODE = req.body.COUNTRY_CODE
        var IS_SPECIAL_CATALOGUE = req.body.IS_SPECIAL_CATALOGUE
        var ACCOUNT_STATUS = req.body.ACCOUNT_STATUS
        var CUSTOMER_CATEGORY_ID = req.body.CUSTOMER_CATEGORY_ID
        var SHORT_CODE = req.body.SHORT_CODE
        var COMPANY_NAME = req.body.COMPANY_NAME
        var GST_NO = req.body.GST_NO || null
        var PAN_NO = req.body.PAN_NO || null

        if (TYPE != " " && TYPE_VALUE != " " && OTP != " ") {

            var connection = mm.openConnection();

            mm.executeDML(
                `CALL sp_customer_getOTP(?,?)`,
                [TYPE, TYPE_VALUE],
                supportKey,
                connection,
                (error, results1) => {

                    if (error) {

                        mm.rollbackConnection(connection);

                        res.status(400).send({
                            code: 400,
                            message: "Failed to get otp details"
                        });

                    } else {
                        var results = results1[0]
                        if (results.length > 0) {
                            if (results[0].OTP == OTP) {
                                mm.executeDML(
                                    `CALL sp_customer_verifyOTP(?,?)`,
                                    [TYPE_VALUE, systemDate],
                                    supportKey,
                                    connection,
                                    (error) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            res.status(400).send({
                                                code: 400,
                                                message: "OTP verification failed"
                                            });

                                        } else {
                                            if (IS_NEW_CUSTOMER == 1) {
                                                mm.executeDML(
                                                    `CALL sp_Customer_checkCustomer(?,?)`,
                                                    [CUSTOMER_EMAIL_ID, CUSTOMER_MOBILE_NO],
                                                    supportKey,
                                                    connection,
                                                    (error, resultsCustomer) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection);
                                                            res.status(400).send({
                                                                code: 400,
                                                                message: "Customer check failed"
                                                            });

                                                        } else {
                                                            var results = resultsCustomer[0]
                                                            if (results.length > 0) {
                                                                if (results[0].EMAIL === CUSTOMER_EMAIL_ID && results[0].MOBILE_NO === CUSTOMER_EMAIL_ID) {
                                                                    mm.rollbackConnection(connection);
                                                                    res.send({
                                                                        "code": 300,
                                                                        "message": "Email ID and mobile number already exist."
                                                                    });
                                                                } else if (results[0].EMAIL === CUSTOMER_EMAIL_ID) {
                                                                    mm.rollbackConnection(connection);
                                                                    res.send({
                                                                        "code": 300,
                                                                        "message": "Email ID already exist."
                                                                    });
                                                                }
                                                                else if (results[0].MOBILE_NO === CUSTOMER_MOBILE_NO) {
                                                                    if (results[0].CUSTOMER_TYPE === CUSTOMER_TYPE) {
                                                                        mm.rollbackConnection(connection);
                                                                        return res.send({
                                                                            "code": 300,
                                                                            "message": "Mobile number already exists for this customer type."
                                                                        });
                                                                    } else {
                                                                        if (CUSTOMER_TYPE == "B") {
                                                                            if (results.length > 0 && results != undefined) {
                                                                                if (results[0].some(row => row.SHORT_CODE.toLowerCase() === data.SHORT_CODE.toLowerCase())) {
                                                                                    console.log("result11", results);
                                                                                    mm.rollbackConnection(connection);
                                                                                    return res.send({
                                                                                        "code": 300,
                                                                                        "message": "Short code already exist."
                                                                                    });
                                                                                }
                                                                            }
                                                                        }
                                                                        mm.executeDML(`CALL sp_customer_insertCustomerEmail(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                                                                            [
                                                                                CUSTOMER_NAME,
                                                                                CUSTOMER_EMAIL_ID,
                                                                                CUSTOMER_MOBILE_NO,
                                                                                1,
                                                                                ACCOUNT_STATUS,
                                                                                IS_SPECIAL_CATALOGUE,
                                                                                systemDate,
                                                                                CLOUD_ID,
                                                                                W_CLOUD_ID,
                                                                                COUNTRY_CODE,
                                                                                CUSTOMER_TYPE,
                                                                                CUSTOMER_CATEGORY_ID,
                                                                                SHORT_CODE,
                                                                                PAN_NO,
                                                                                GST_NO,
                                                                                COMPANY_NAME
                                                                            ], supportKey, connection, async (error, resultCustomer1) => {

                                                                                if (error) {
                                                                                    console.log(error);
                                                                                    logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                                                    mm.rollbackConnection(connection);
                                                                                    res.status(400).send({
                                                                                        "code": 400,
                                                                                        "message": "Failed to update mobile verified in registration attempt details.",
                                                                                    });
                                                                                } else {
                                                                                    mm.executeDML(`CALL sp_customer_insertCustomerMaster(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                                                                                        [
                                                                                            CUSTOMER_NAME,
                                                                                            CUSTOMER_EMAIL_ID,
                                                                                            CUSTOMER_MOBILE_NO,
                                                                                            1,
                                                                                            ACCOUNT_STATUS,
                                                                                            IS_SPECIAL_CATALOGUE,
                                                                                            systemDate,
                                                                                            CLOUD_ID,
                                                                                            W_CLOUD_ID,
                                                                                            COUNTRY_CODE,
                                                                                            CUSTOMER_TYPE,
                                                                                            CUSTOMER_CATEGORY_ID,
                                                                                            resultCustomer1[0][0].ID,
                                                                                            SHORT_CODE,
                                                                                            PAN_NO,
                                                                                            GST_NO,
                                                                                            COMPANY_NAME
                                                                                        ], supportKey, connection, async (error, resultCustomer12) => {
                                                                                            var resultCustomer2 = resultCustomer12[0]
                                                                                            var CustomerId = resultCustomer12[0][0].ID
                                                                                            if (error) {
                                                                                                console.log(error);
                                                                                                logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                                                                mm.rollbackConnection(connection);
                                                                                                res.status(400).send({
                                                                                                    "code": 400,
                                                                                                    "message": "Failed to update mobile verified in registration attempt details.",
                                                                                                });
                                                                                            } else {
                                                                                                if (CUSTOMER_TYPE == "B") {
                                                                                                   
                                                                                                    const channels = [
                                                                                                        { CHANNEL_NAME: "customer_channel" },
                                                                                                        { CHANNEL_NAME: "system_alerts_channel" },
                                                                                                        { CHANNEL_NAME: `customer_${CustomerId}_channel` }
                                                                                                    ];
                                                                                                    var SUBSCRIBED_CHANNELS = []
                                                                                                    channels.forEach(channel => {
                                                                                                        const chanelData = {
                                                                                                            ...channel,
                                                                                                            USER_ID: CustomerId,
                                                                                                            TYPE: "C",
                                                                                                            STATUS: true,
                                                                                                            USER_NAME: CUSTOMER_NAME,
                                                                                                            CLIENT_ID: 1,
                                                                                                            DATE: mm.getSystemDate()
                                                                                                        };
                                                                                                        new channelSubscribedUsers(chanelData).save();
                                                                                                        SUBSCRIBED_CHANNELS.push(chanelData)
                                                                                                    });

                                                                                                    var userDetails = [{
                                                                                                        USER_ID: CustomerId,
                                                                                                        USER_NAME: CUSTOMER_NAME,
                                                                                                        MOBILE_NUMBER: TYPE === "M" ? TYPE_VALUE : CUSTOMER_MOBILE_NO,
                                                                                                        CLIENT_ID: 1,
                                                                                                        isPresent: 1,
                                                                                                        EMAIL_ID: CUSTOMER_EMAIL_ID,
                                                                                                        CUSTOMER_DETAILS_ID: CustomerId,
                                                                                                        SUBSCRIBED_CHANNELS: SUBSCRIBED_CHANNELS

                                                                                                    }]

                                                                                                    var userDetails1 = [{
                                                                                                        USER_ID: CustomerId,
                                                                                                        USER_NAME: CUSTOMER_NAME,
                                                                                                        NAME: CUSTOMER_NAME,
                                                                                                    }]
                                                                                                    mm.sendDynamicEmail(1, CustomerId, supportKey)

                                                                                                    if (CUSTOMER_TYPE == "B") {
                                                                                                        let body = `
                                                                                            <p>Hello Team,</p>
                                                                                            <p>A new <strong>business user</strong> has just registered on the platform.</p>
                                                                                            <p>Please update and verify the <strong>customer details</strong> accordingly.</p>
                                                                                            
                                                                                            <table style="margin-top:15px;width:100%;border-collapse:collapse;">
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;width:35%;"><strong>Business Name:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${COMPANY_NAME}</td>
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Contact Person:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${CUSTOMER_NAME}</td>
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Email:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${CUSTOMER_EMAIL_ID}</td>
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Phone:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${TYPE_VALUE}</td>
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Registered On:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${systemDate}</td>
                                                                                            </tr>
                                                                                            </table>

                                                                                            <p style="margin-top:20px;">Thank you,<br><strong>Support Team</strong></p>

                                                                                           <em> <p style="margin-top:20px;">This is an auto-generated email. Please do not reply.</p></em>

                                                                                    `;
                                                                                                    }

                                                                                                    addGlobalData(CustomerId, supportKey)
                                                                                                    generateToken(userDetails[0].USER_ID, res, userDetails, userDetails1, "");
                                                                                                    mm.userloginlogs(CustomerId, "C", systemDate, "L", supportKey)
                                                                                                    mm.commitConnection(connection);
                                                                                                } else {
                                                                                                    const channels = [
                                                                                                        { CHANNEL_NAME: "customer_channel" },
                                                                                                        { CHANNEL_NAME: "system_alerts_channel" },
                                                                                                        { CHANNEL_NAME: `customer_${CustomerId}_channel` }
                                                                                                    ];
                                                                                                    var SUBSCRIBED_CHANNELS = []
                                                                                                    channels.forEach(channel => {
                                                                                                        const chanelData = {
                                                                                                            ...channel,
                                                                                                            USER_ID: CustomerId,
                                                                                                            TYPE: "C",
                                                                                                            STATUS: true,
                                                                                                            USER_NAME: CUSTOMER_NAME,
                                                                                                            CLIENT_ID: 1,
                                                                                                            DATE: mm.getSystemDate()
                                                                                                        };
                                                                                                        new channelSubscribedUsers(chanelData).save();
                                                                                                        SUBSCRIBED_CHANNELS.push(chanelData)
                                                                                                    });

                                                                                                    var userDetails = [{
                                                                                                        USER_ID: CustomerId,
                                                                                                        USER_NAME: CUSTOMER_NAME,
                                                                                                        MOBILE_NUMBER: TYPE === "M" ? TYPE_VALUE : results[0].MOBILE_NO,
                                                                                                        CLIENT_ID: 1,
                                                                                                        isPresent: 1,
                                                                                                        EMAIL_ID: CUSTOMER_EMAIL_ID,
                                                                                                        CUSTOMER_DETAILS_ID: CustomerId,
                                                                                                        SUBSCRIBED_CHANNELS: SUBSCRIBED_CHANNELS

                                                                                                    }]

                                                                                                    var userDetails1 = [{
                                                                                                        USER_ID: CustomerId,
                                                                                                        USER_NAME: CUSTOMER_NAME,
                                                                                                        NAME: CUSTOMER_NAME,
                                                                                                    }]
                                                                                                    mm.sendDynamicEmail(1, CustomerId, supportKey)
                                                                                                    addGlobalData(CustomerId, supportKey)
                                                                                                    generateToken(userDetails[0].USER_ID, res, userDetails, userDetails1, "");
                                                                                                    mm.userloginlogs(CustomerId, "C", systemDate, "L", supportKey)
                                                                                                    mm.commitConnection(connection);
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                }
                                                                            });
                                                                    }
                                                                }

                                                            } else {

                                                                if (CUSTOMER_TYPE == "B") {
                                                                    if (results.length > 0 && results != undefined) {
                                                                        if (results[0].some(row => row.SHORT_CODE.toLowerCase() === data.SHORT_CODE.toLowerCase())) {
                                                                            console.log("result11", results);
                                                                            mm.rollbackConnection(connection);
                                                                            return res.send({
                                                                                "code": 300,
                                                                                "message": "Short code already exist."
                                                                            });
                                                                        }
                                                                    }
                                                                }
                                                                mm.executeDML(`CALL sp_customer_insertCustomerEmail(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                                                                    [
                                                                        CUSTOMER_NAME,
                                                                        CUSTOMER_EMAIL_ID,
                                                                        CUSTOMER_MOBILE_NO,
                                                                        1,
                                                                        ACCOUNT_STATUS,
                                                                        IS_SPECIAL_CATALOGUE,
                                                                        systemDate,
                                                                        CLOUD_ID,
                                                                        W_CLOUD_ID,
                                                                        COUNTRY_CODE,
                                                                        CUSTOMER_TYPE,
                                                                        CUSTOMER_CATEGORY_ID,
                                                                        SHORT_CODE,
                                                                        PAN_NO,
                                                                        GST_NO,
                                                                        COMPANY_NAME
                                                                    ], supportKey, connection, async (error, resultCustomer1) => {

                                                                        if (error) {
                                                                            console.log(error);
                                                                            logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                                            mm.rollbackConnection(connection);
                                                                            res.status(400).send({
                                                                                "code": 400,
                                                                                "message": "Failed to update mobile verified in registration attempt details.",
                                                                            });
                                                                        } else {
                                                                            mm.executeDML(`CALL sp_customer_insertCustomerMaster(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                                                                                [
                                                                                    CUSTOMER_NAME,
                                                                                    CUSTOMER_EMAIL_ID,
                                                                                    CUSTOMER_MOBILE_NO,
                                                                                    1,
                                                                                    ACCOUNT_STATUS,
                                                                                    IS_SPECIAL_CATALOGUE,
                                                                                    systemDate,
                                                                                    CLOUD_ID,
                                                                                    W_CLOUD_ID,
                                                                                    COUNTRY_CODE,
                                                                                    CUSTOMER_TYPE,
                                                                                    CUSTOMER_CATEGORY_ID,
                                                                                    resultCustomer1[0][0].ID,
                                                                                    SHORT_CODE,
                                                                                    PAN_NO,
                                                                                    GST_NO,
                                                                                    COMPANY_NAME
                                                                                ], supportKey, connection, async (error, resultCustomer2) => {
                                                                                    var resultCustomer2 = resultCustomer12[0]
                                                                                    var CustomerId = resultCustomer12[0][0].ID

                                                                                    if (error) {
                                                                                        console.log(error);
                                                                                        logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                                                        mm.rollbackConnection(connection);
                                                                                        res.status(400).send({
                                                                                            "code": 400,
                                                                                            "message": "Failed to update mobile verified in registration attempt details.",
                                                                                        });
                                                                                    } else {
                                                                                        if (CUSTOMER_TYPE == "B") {
                                                                                            const channels = [
                                                                                                { CHANNEL_NAME: "customer_channel" },
                                                                                                { CHANNEL_NAME: "system_alerts_channel" },
                                                                                                { CHANNEL_NAME: `customer_${resultCustomer2.insertId}_channel` }
                                                                                            ];
                                                                                            var SUBSCRIBED_CHANNELS = []
                                                                                            channels.forEach(channel => {
                                                                                                const chanelData = {
                                                                                                    ...channel,
                                                                                                    USER_ID: resultCustomer2.insertId,
                                                                                                    TYPE: "C",
                                                                                                    STATUS: true,
                                                                                                    USER_NAME: CUSTOMER_NAME,
                                                                                                    CLIENT_ID: 1,
                                                                                                    DATE: mm.getSystemDate()
                                                                                                };
                                                                                                new channelSubscribedUsers(chanelData).save();
                                                                                                SUBSCRIBED_CHANNELS.push(chanelData)
                                                                                            });

                                                                                            var userDetails = [{
                                                                                                USER_ID: resultCustomer2.insertId,
                                                                                                USER_NAME: CUSTOMER_NAME,
                                                                                                MOBILE_NUMBER: TYPE === "M" ? TYPE_VALUE : CUSTOMER_MOBILE_NO,
                                                                                                CLIENT_ID: 1,
                                                                                                isPresent: 1,
                                                                                                EMAIL_ID: CUSTOMER_EMAIL_ID,
                                                                                                CUSTOMER_DETAILS_ID: resultCustomer2.insertId,
                                                                                                SUBSCRIBED_CHANNELS: SUBSCRIBED_CHANNELS

                                                                                            }]

                                                                                            var userDetails1 = [{
                                                                                                USER_ID: resultCustomer2.insertId,
                                                                                                USER_NAME: CUSTOMER_NAME,
                                                                                                NAME: CUSTOMER_NAME,
                                                                                            }]
                                                                                            mm.sendDynamicEmail(1, resultCustomer2.insertId, supportKey)
                                                                                            let body = `
                                                                                            <p>Hello Team,</p>
                                                                                            <p>A new <strong>business user</strong> has just registered on the platform.</p>
                                                                                            <p>Please update and verify the <strong>customer details</strong> accordingly.</p>
                                                                                            
                                                                                            <table style="margin-top:15px;width:100%;border-collapse:collapse;">
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;width:35%;"><strong>Business Name:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${COMPANY_NAME}</td>
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Contact Person:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${CUSTOMER_NAME}</td>
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Email:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${CUSTOMER_EMAIL_ID}</td>
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Phone:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${TYPE_VALUE}</td>
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Registered On:</strong></td>
                                                                                                <td style="padding:8px;border:1px solid #e5e7eb;">${systemDate}</td>
                                                                                            </tr>
                                                                                            </table>

                                                                                            <p style="margin-top:20px;">Thank you,<br><strong>Support Team</strong></p>

                                                                                           <em> <p style="margin-top:20px;">This is an auto-generated email. Please do not reply.</p></em>

                                                                                    `;
                                                                                            addGlobalData(resultCustomer2.insertId, supportKey)
                                                                                            generateToken(userDetails[0].USER_ID, res, userDetails, userDetails1, "");
                                                                                            mm.userloginlogs(resultCustomer2.insertId, "C", systemDate, "L", supportKey)
                                                                                            mm.commitConnection(connection);

                                                                                        } else {
                                                                                            const channels = [
                                                                                                { CHANNEL_NAME: "customer_channel" },
                                                                                                { CHANNEL_NAME: "system_alerts_channel" },
                                                                                                { CHANNEL_NAME: `customer_${resultCustomer2.insertId}_channel` }
                                                                                            ];
                                                                                            var SUBSCRIBED_CHANNELS = []
                                                                                            channels.forEach(channel => {
                                                                                                const chanelData = {
                                                                                                    ...channel,
                                                                                                    USER_ID: resultCustomer2.insertId,
                                                                                                    TYPE: "C",
                                                                                                    STATUS: true,
                                                                                                    USER_NAME: CUSTOMER_NAME,
                                                                                                    CLIENT_ID: 1,
                                                                                                    DATE: mm.getSystemDate()
                                                                                                };
                                                                                                new channelSubscribedUsers(chanelData).save();
                                                                                                SUBSCRIBED_CHANNELS.push(chanelData)
                                                                                            });

                                                                                            var userDetails = [{
                                                                                                USER_ID: resultCustomer2.insertId,
                                                                                                USER_NAME: CUSTOMER_NAME,
                                                                                                MOBILE_NUMBER: TYPE === "M" ? TYPE_VALUE : results[0].MOBILE_NO,
                                                                                                CLIENT_ID: 1,
                                                                                                isPresent: 1,
                                                                                                EMAIL_ID: CUSTOMER_EMAIL_ID,
                                                                                                CUSTOMER_DETAILS_ID: resultCustomer2.insertId,
                                                                                                SUBSCRIBED_CHANNELS: SUBSCRIBED_CHANNELS

                                                                                            }]

                                                                                            var userDetails1 = [{
                                                                                                USER_ID: resultCustomer2.insertId,
                                                                                                USER_NAME: CUSTOMER_NAME,
                                                                                                NAME: CUSTOMER_NAME,
                                                                                            }]
                                                                                            mm.sendDynamicEmail(1, resultCustomer2.insertId, supportKey)
                                                                                            addGlobalData(resultCustomer2.insertId, supportKey)
                                                                                            generateToken(userDetails[0].USER_ID, res, userDetails, userDetails1, "");
                                                                                            mm.userloginlogs(resultCustomer2.insertId, "C", systemDate, "L", supportKey)
                                                                                            mm.commitConnection(connection);
                                                                                        }
                                                                                    }
                                                                                });
                                                                        }
                                                                    });

                                                            }

                                                        }

                                                    }
                                                );
                                            }
                                            else {

                                                mm.executeDML(
                                                    `CALL sp_customer_existingCustomerLoginChecks(?,?,?)`,
                                                    [USER_ID, TYPE_VALUE, CLOUD_ID],
                                                    supportKey,
                                                    connection,
                                                    async (error, resultsExisting) => {
                                                        if (error) {
                                                            console.log(error);
                                                            mm.rollbackConnection(connection);
                                                            return res.status(400).send({
                                                                code: 400,
                                                                message: "Failed to update mobile verified in registration attempt details details ",
                                                            });
                                                        }

                                                        const rsEx = resultsExisting.filter(r => Array.isArray(r));
                                                        const spEx = rsEx[0] || [];

                                                        const eCode = spEx[0] ? spEx[0].code : 400;
                                                        const custType = spEx[0] ? spEx[0].CUSTOMER_TYPE : "";
                                                        const custEmail = spEx[0] ? spEx[0].EMAIL : "";
                                                        const custMobile = spEx[0] ? spEx[0].MOBILE_NO : "";
                                                        const addrCnt = spEx[0] ? spEx[0].ADDRESS_CNT : 0;

                                                        if (eCode != 200) {
                                                            mm.rollbackConnection(connection);
                                                            return res.status(400).send({
                                                                code: 400,
                                                                message: "Failed to update mobile verified in registration attempt details details ",
                                                            });
                                                        }

                                                        if (custType == "B" && addrCnt == 0) {
                                                            mm.rollbackConnection(connection);
                                                            return res.status(301).send({
                                                                code: 301,
                                                                message: "You don't have any default address to process this request, please contact our support team at servicedesk@ovationwps.com",
                                                            })
                                                        }

                                                        const subscribedChannels1 = await channelSubscribedUsers.find({
                                                            USER_ID: USER_ID,
                                                            TYPE: "C",
                                                            STATUS: true
                                                        });

                                                        var userDetails = [{
                                                            USER_ID: USER_ID,
                                                            USER_NAME: CUSTOMER_NAME,
                                                            MOBILE_NUMBER: TYPE === "M" ? TYPE_VALUE : custMobile,
                                                            EMAIL_ID: custEmail,
                                                            CLIENT_ID: 1,
                                                            isPresent: 1,
                                                            SUBSCRIBED_CHANNELS: subscribedChannels1
                                                        }]

                                                        var userDetails1 = [{
                                                            USER_ID: USER_ID,
                                                            USER_NAME: CUSTOMER_NAME,
                                                            NAME: CUSTOMER_NAME
                                                        }]

                                                        mm.userloginlogs(USER_ID, "C", systemDate, "L", supportKey)
                                                        generateToken(userDetails[0].USER_ID, res, userDetails, userDetails1, "");
                                                        mm.commitConnection(connection);
                                                    }
                                                );

                                            }
                                        }

                                    }
                                );
                            }
                            else {
                                mm.rollbackConnection(connection);
                                res.status(300).send({
                                    "code": 300,
                                    "message": "Invalid OTP ",
                                });
                            }
                        } else {

                            mm.rollbackConnection(connection);
                            res.status(400).send({
                                "code": 400,
                                "message": "Invalid OTP request ",
                            });

                        }

                    }

                }
            );

        } else {

            res.status(400).send({
                code: 400,
                message: "Invalid parameters"
            });

        }

    } catch (error) {

        res.status(500).send({
            code: 500,
            message: error
        });

    }
};

exports.addCustomer = (req, res) => {
    var data = reqData(req);
    var ADDRESS_DATA = req.body.ADDRESS_DATA;
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
        return;
    }

    try {

        const addressJson = ADDRESS_DATA ? JSON.stringify(ADDRESS_DATA) : null;

        const params = [
            data.CUSTOMER_CATEGORY_ID,
            data.CUSTOMER_TYPE,
            data.NAME,
            data.EMAIL,
            data.SALUTATION,
            data.MOBILE_NO,
            data.REGISTRATION_DATE,
            data.ACCOUNT_STATUS,
            data.COMPANY_NAME,
            data.ALTERNATE_MOBILE_NO,
            data.CURRENT_ADDRESS_ID,
            data.PASSWORD,
            data.PAN,
            data.GST_NO,
            data.PROFILE_PHOTO,
            data.CLOUD_ID,
            data.DEVICE_ID,
            data.LOGOUT_DATETIME,
            data.CLIENT_ID,
            data.COUNTRY_CODE,
            data.ALTCOUNTRY_CODE,
            data.IS_SPECIAL_CATALOGUE,
            data.IS_PARENT,
            data.CUSTOMER_MANAGER_ID,
            data.SHORT_CODE,
            data.INDIVIDUAL_COMPANY_NAME,
            data.COMPANY_ADDRESS,
            data.IS_HAVE_GST,
            data.VAT_NUMBER,
            data.WEEKLY_HOLIDAY,
            data.PARENT_CUSTOMER_ID,
            data.SITE_NUMBER,
            addressJson
        ].map(v => (v === undefined ? null : v));

        mm.executeQueryData(
            "CALL sp_customerMaster_addCustomer(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            params,
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technician information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const spRes = resultSets[0] || [];

                const code = spRes[0] ? spRes[0].code : 400;
                const message = spRes[0] ? spRes[0].message : "Failed to save technician information.";
                const customerId = spRes[0] ? spRes[0].ID : 0;

                if (code == 300) {
                    return res.status(300).json({
                        "code": 300,
                        "message": message
                    });
                }

                if (code != 200) {
                    return res.status(400).json({
                        "code": 400,
                        "message": message
                    });
                }

                addGlobalData(customerId, supportKey);

                var ACTION_DETAILS = `A new customer has been created with the name ${data.NAME}.`;
                var logCategory = "customer";

                let actionLog = {
                    "SOURCE_ID": customerId,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": 0
                };

                dbm.saveLog(actionLog, systemLog);

                var userDetails = [{
                    USER_ID: customerId,
                    CLIENT_ID: 1,
                    USER_NAME: data.NAME,
                    NAME: data.NAME
                }];

                generateToken(userDetails[0].USER_ID, res, userDetails, "1", "");
            }
        );

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        return res.status(500).json({
            "code": 500,
            "message": "Internal Server Error."
        });
    }
};

exports.logout = (req, res) => {
    const USER_ID = req.body.USER_ID;
    const supportKey = req.headers["supportkey"];
    const systemDate = mm.getSystemDate();

    try {
        if (!USER_ID) {
            return res.status(400).json({
                "code": 400,
                "message": "USER_ID is required."
            });
        }

        mm.executeQueryData(
            `CALL sp_customerMaster_logout(?)`,
            [USER_ID],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": error.sqlMessage || "Failed to logout from system."
                    });
                }

                // same as existing logic
                mm.userloginlogs(USER_ID, "C", systemDate, "O", supportKey);

                return res.status(200).json(result[0][0]);
            }
        );
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            "code": 400,
            "message": "Failed to logout from system."
        });
    }
};

function sendOtp(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    console.log("TYPE : ", TYPE, "TYPE_VALUE :", TYPE_VALUE);
    var subject = "Customer Login OTP"
    var otpText1
    if (TYPE == "M") {
        // otpText1 = `Dear customer, please share OTP ${OTP} with our technician to complete your order. For queries, contact Vantage Team.Team UVtechSoft.`;
        otpText1 = `Your one-time password (OTP) is ${OTP}. Please enter this code to complete your login. This code is valid for 10 minutes. Team UVtechSoft.`;
    } else {
        otpText1 = `<p style="text-align: justify;"><strong>Dear Customer,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: left;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with servicedesk@ovationwps.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Vantage</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"></p>`;
    }
    var otpSendStatus = "S";
    mm.executeQueryData(`CALL sp_insert_registration_otp_details(?,?,?,?,?,?,?,?,?)`, [TYPE, TYPE_VALUE, OTP, otpText1, systemDate, 1, 'S', '0', 'C'], supportKey, (error, insertOtpDetails) => {
        if (error) {
            callback(error);
        }
        else {
            sendSMSEmail(TYPE, TYPE_VALUE, OTP, subject, otpText1, (error, results) => {
                if (error) {
                    callback(error);
                }
                else {
                    const VID = insertOtpDetails.insertId;
                    callback(null, VID);
                }
            });
        }
    });
}

exports.unMappedTechnicians = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
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
        SET @v_CUSTOMER_ID = '${CUSTOMER_ID}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (!CUSTOMER_ID || IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter or CUSTOMER_ID."
        });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_unMappedTechnicians_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get un-mapped technicians."
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
        console.log(error);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

function customerData(req) {

    var data = {
        CUSTOMER_CATEGORY_ID: req.body.CUSTOMER_CATEGORY_ID,
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        SALUTATION: req.body.SALUTATION,
        MOBILE_NO: req.body.MOBILE_NO,
        REGISTRATION_DATE: mm.getSystemDate(),
        ACCOUNT_STATUS: req.body.ACCOUNT_STATUS ? '1' : '0',
        COMPANY_NAME: req.body.COMPANY_NAME,
        ALTERNATE_MOBILE_NO: req.body.ALTERNATE_MOBILE_NO,
        CURRENT_ADDRESS_ID: req.body.CURRENT_ADDRESS_ID,
        PASSWORD: req.body.PASSWORD,
        PAN: req.body.PAN,
        GST_NO: req.body.GST_NO,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        CLOUD_ID: req.body.CLOUD_ID,
        DEVICE_ID: req.body.DEVICE_ID,
        LOGOUT_DATETIME: null,
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        ALTCOUNTRY_CODE: req.body.ALTCOUNTRY_CODE,
        IS_SPECIAL_CATALOGUE: req.body.IS_SPECIAL_CATALOGUE ? '1' : '0',
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        IS_PARENT: req.body.IS_PARENT,
        CUSTOMER_MANAGER_ID: req.body.CUSTOMER_MANAGER_ID,
        SHORT_CODE: req.body.SHORT_CODE,
        INDIVIDUAL_COMPANY_NAME: req.body.INDIVIDUAL_COMPANY_NAME,
        COMPANY_ADDRESS: req.body.COMPANY_ADDRESS,
        IS_HAVE_GST: req.body.IS_HAVE_GST ? '1' : '0',
        VAT_NUMBER: req.body.VAT_NUMBER,
        SITE_NUMBER: req.body.SITE_NUMBER,
        WEEKLY_HOLIDAY: req.body.WEEKLY_HOLIDAY,
        PARENT_CUSTOMER_ID: req.body.PARENT_CUSTOMER_ID

    }
    return data;
}

exports.create = async (req, res) => {
    var data = reqData(req);
    var custdata = customerData(req);

    // data.PASSWORD !== null ? data.PASSWORD = md5(data.PASSWORD) : data.PASSWORD = null;
    data.PASSWORD !== null ? data.PASSWORD = await mm.hashPassword(data.PASSWORD) : data.PASSWORD = null;

    var systemDate = mm.getSystemDate();
    data.REGISTRATION_DATE = systemDate;

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

        const params = [
            data.CUSTOMER_CATEGORY_ID,
            data.CUSTOMER_TYPE,
            data.NAME,
            data.EMAIL,
            data.SALUTATION,
            data.MOBILE_NO,
            data.REGISTRATION_DATE,
            data.ACCOUNT_STATUS,
            data.COMPANY_NAME,
            data.ALTERNATE_MOBILE_NO,
            data.CURRENT_ADDRESS_ID,
            data.PASSWORD,
            data.PAN,
            data.GST_NO,
            data.PROFILE_PHOTO,
            data.CLOUD_ID,
            data.DEVICE_ID,
            data.LOGOUT_DATETIME,
            data.CLIENT_ID,
            data.COUNTRY_CODE,
            data.ALTCOUNTRY_CODE,
            data.IS_SPECIAL_CATALOGUE,
            1,
            data.CUSTOMER_MANAGER_ID,
            data.SHORT_CODE,
            data.INDIVIDUAL_COMPANY_NAME,
            data.COMPANY_ADDRESS,
            data.IS_HAVE_GST,
            data.VAT_NUMBER,
            data.SITE_NUMBER,
            data.WEEKLY_HOLIDAY,
            data.PARENT_CUSTOMER_ID,
            null
        ].map(v => (v === undefined ? null : v));
        console.log("params", params)
        mm.executeQueryData(
            "CALL sp_customerMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            params,
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({
                        "code": 400,
                        "message": "Failed to save customer information."
                    });
                }
                console.log("results", results);
                const resultSets = results.filter(r => Array.isArray(r));

                console.log("resultSets", resultSets);
                const spRes = resultSets[0] || [];

                const code = spRes[0] ? spRes[0].code : 400;
                const message = spRes[0] ? spRes[0].message : "Failed to save customer information.";
                const ID = spRes[0] ? spRes[0].ID : 0;
                const CUSTOMER_DETAILS_ID = spRes[0] ? spRes[0].CUSTOMER_DETAILS_ID : 0;

                if (code != 200) {
                    return res.send({
                        "code": code,
                        "message": message
                    });
                }

                if (data.CUSTOMER_TYPE == "B") {

                    mm.sendDynamicEmail(1, ID, supportKey);
                    addGlobalData(ID, supportKey);

                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer${data.NAME}.`;
                    var logCategory = "customer";

                    let actionLog = {
                        SOURCE_ID: CUSTOMER_DETAILS_ID,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: ACTION_DETAILS,
                        CATEGORY: logCategory,
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: "987654327654",
                        CUSTOMER_DETAILS_ID: ID
                    };
                    dbm.saveLog(actionLog, systemLog);

                    const channels = [
                        { CHANNEL_NAME: "customer_channel" },
                        { CHANNEL_NAME: "system_alerts_channel" },
                        { CHANNEL_NAME: `customer_${ID}_channel` }
                    ];

                    channels.forEach(channel => {
                        const chanelData = {
                            ...channel,
                            USER_ID: ID,
                            TYPE: "C",
                            STATUS: true,
                            USER_NAME: data.NAME,
                            CLIENT_ID: data.CLIENT_ID,
                            DATE: mm.getSystemDate()
                        };
                        new channelSubscribedUsers(chanelData).save();
                    });

                    return res.send({
                        "code": 200,
                        "message": "Customer information saved successfully.",
                        "ID": ID,
                        "CUSTOMER_DETAILS_ID": CUSTOMER_DETAILS_ID
                    });

                } else {

                    mm.sendDynamicEmail(1, ID, supportKey);
                    addGlobalData(CUSTOMER_DETAILS_ID, supportKey);

                    const channels = [
                        { CHANNEL_NAME: "customer_channel" },
                        { CHANNEL_NAME: "system_alerts_channel" },
                        { CHANNEL_NAME: `customer_${ID}_channel` }
                    ];

                    channels.forEach(channel => {
                        const chanelData = {
                            ...channel,
                            USER_ID: ID,
                            TYPE: "C",
                            STATUS: true,
                            USER_NAME: data.NAME,
                            CLIENT_ID: data.CLIENT_ID,
                            DATE: mm.getSystemDate()
                        };
                        new channelSubscribedUsers(chanelData).save();
                    });

                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer ${data.NAME}.`;
                    var logCategory = "customer";

                    let actionLog = {
                        SOURCE_ID: CUSTOMER_DETAILS_ID,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: ACTION_DETAILS,
                        CATEGORY: logCategory,
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: "987654327654",
                        CUSTOMER_DETAILS_ID: ID
                    };
                    dbm.saveLog(actionLog, systemLog);
                    return res.send({
                        "code": 200,
                        "message": "Customer information saved successfully.",
                        "ID": ID,
                        "CUSTOMER_DETAILS_ID": CUSTOMER_DETAILS_ID
                    });
                }
            }
        );

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        return res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var custdata = customerData(req);
    console.log("req.body", req.body);

    var CUSTOMER_MASTER_ID = req.body.CUSTOMER_MASTER_ID ? req.body.CUSTOMER_MASTER_ID : req.body.ID;
    var CUSTOMER_EMAIL_ID = req.body.CUSTOMER_DETAILS_ID ? req.body.CUSTOMER_DETAILS_ID : req.body.ID;

    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            const params = [
                CUSTOMER_MASTER_ID,
                CUSTOMER_EMAIL_ID,
                data.CUSTOMER_CATEGORY_ID,
                data.CUSTOMER_TYPE,
                data.NAME,
                data.EMAIL,
                data.SALUTATION,
                data.MOBILE_NO,
                data.REGISTRATION_DATE,
                data.ACCOUNT_STATUS,
                data.COMPANY_NAME,
                data.ALTERNATE_MOBILE_NO,
                data.CURRENT_ADDRESS_ID,
                data.PASSWORD,
                data.PAN,
                data.GST_NO,
                data.PROFILE_PHOTO,
                data.CLOUD_ID,
                data.DEVICE_ID,
                data.LOGOUT_DATETIME,
                data.CLIENT_ID,
                data.COUNTRY_CODE,
                data.ALTCOUNTRY_CODE,
                data.IS_SPECIAL_CATALOGUE,
                data.IS_PARENT,
                data.CUSTOMER_MANAGER_ID,
                data.SHORT_CODE,
                data.INDIVIDUAL_COMPANY_NAME,
                data.COMPANY_ADDRESS,
                data.IS_HAVE_GST,
                systemDate,
                data.VAT_NUMBER,
                data.SITE_NUMBER,
                data.WEEKLY_HOLIDAY,
                data.PARENT_CUSTOMER_ID

            ].map(v => (v === undefined ? null : v));

            mm.executeQueryData(
                "CALL sp_customerMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                params,
                supportKey,
                (error, results) => {
                    console.log("error", error)
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.send({
                            "code": 400,
                            "message": "Failed to update customer information."
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r));
                    console.log("resultSets", resultSets)
                    const spRes = resultSets[0] || [];

                    const code = spRes[0] ? spRes[0].code : 400;
                    const message = spRes[0] ? spRes[0].message : "Failed to update customer information.";

                    if (code != 200) {
                        return res.send({
                            "code": code,
                            "message": message
                        });
                    }

                    addGlobalData(CUSTOMER_MASTER_ID, supportKey);


                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of  ${data.NAME}.`;
                    var logCategory = "customer";

                    let actionLog = {
                        "SOURCE_ID": CUSTOMER_MASTER_ID,
                        "LOG_DATE_TIME": mm.getSystemDate(),
                        "LOG_TEXT": ACTION_DETAILS,
                        "CATEGORY": logCategory,
                        "CLIENT_ID": 1,
                        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "supportKey": 0
                    };
                    dbm.saveLog(actionLog, systemLog);

                    return res.send({
                        "code": 200,
                        "message": "customer information updated successfully...",
                    });
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            return res.send({
                "code": 500,
                "message": "Internal Server Error."
            });
        }
    }
};

exports.getCustomerDetails = (req, res) => {
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
            setContext + `CALL sp_customer_getCustomerDetails()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get customer information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 20,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.deleteProfile = (req, res) => {
    try {
        var CUSTOMER_ID = req.body.CUSTOMER_ID;
        var CUSTOMER_NAME = req.body.NAME;
        var MOBILE_NO = req.body.MOBILE_NO;
        var supportKey = req.headers["supportkey"];
        var systemDate = mm.getSystemDate();

        if (CUSTOMER_ID) {
            const connection = mm.openConnection();

            mm.executeDML(
                `CALL sp_customerMaster_deleteProfile(?,?,?)`,
                [CUSTOMER_ID, MOBILE_NO, systemDate],
                supportKey,
                connection,
                async (error, results) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).send({
                            code: 400,
                            message: "Failed to update mobile verified in registration attempt details."
                        });
                    } else {
                        const response = results && results[0] && results[0][0] ? results[0][0] : null;

                        if (response && response.code == 200) {
                            mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, "Customer Profile Deleted", "Hello admin customer " + CUSTOMER_NAME + " has deleted his profile", "", "CA", "", supportKey, "", "");
                            addGlobalData(CUSTOMER_ID, supportKey);
                            mm.commitConnection(connection);
                            res.status(200).send(response);
                        } else {
                            mm.rollbackConnection(connection);
                            res.status(400).send(response || {
                                code: 400,
                                message: "Failed to update mobile verified in registration attempt details."
                            });
                        }
                    }
                }
            );
        } else {
            res.status(400).send({
                code: 400,
                message: "Please provide customer id.",
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.activateProfile = (req, res) => {
    try {
        var CUSTOMER_ID = req.body.CUSTOMER_ID;
        var CUSTOMER_NAME = req.body.NAME;
        var MOBILE_NO = req.body.MOBILE_NO;
        var IS_B2C = req.body.IS_B2C;
        var supportKey = req.headers["supportkey"]; //Supportkey ;
        var systemDate = mm.getSystemDate();

        if (CUSTOMER_ID) {
            const connection = mm.openConnection();

            // Call stored procedure
            mm.executeDML(
                `CALL sp_customerMaster_activateProfile(?, ?, ?)`,
                [CUSTOMER_ID, MOBILE_NO, systemDate],
                supportKey,
                connection,
                async (error, results) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.log(error);
                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );
                        res.status(400).send({
                            code: 400,
                            message: "Failed to activate customer profile."
                        });
                    } else {
                        const spResult = results[0][0];

                        if (spResult.code === 200) {
                            mm.sendDynamicEmail(74, CUSTOMER_ID, supportKey);

                            addGlobalData(CUSTOMER_ID, supportKey);

                            mm.commitConnection(connection);
                            res.status(200).send({
                                code: 200,
                                message: spResult.message
                            });
                        } else {
                            mm.rollbackConnection(connection);
                            res.status(400).send({
                                code: spResult.code,
                                message: spResult.message
                            });
                        }
                    }
                }
            );
        } else {
            res.status(400).send({
                code: 400,
                message: "Please provide customer id.",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.customerlogin = async (req, res) => {
    try {
        var systemDate = mm.getSystemDate();
        var username = req.body.username;
        var password = req.body.password;
        var flag = req.body.flag;
        var type = req.body.type;
        var supportKey = req.headers['supportkey'];

        if ((!username || username == ' ') || (!password || password == ' ')) {
            res.send({
                "code": 400,
                "message": "username or password parameter missing.",
            });
        }
        else {
            // password = md5(password);

            mm.executeQueryData(
                "CALL sp_customerMaster_login(?,?)",
                [username, password],
                supportKey,
                async (error, results) => {
                    if (error) {
                        console.log(error);
                        return res.send({
                            "code": 400,
                            "message": "Failed to get user record.",
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r));
                    const userResult = resultSets[0] || [];

                    const isMatch = await bcrypt.compare(password, userResult[0].PASSWORD);

                    if (!isMatch) {
                        return res.send({
                            "code": 404,
                            "message": "Incorrect username or password"
                        });
                    }
                    if (userResult.length > 0) {
                        var USER_ID = userResult[0].ID;

                        const subscribedChannels1 = await channelSubscribedUsers.find({
                            USER_ID: USER_ID,
                            TYPE: "C",
                            STATUS: true
                        });

                        var userDetails = [{
                            USER_ID: USER_ID,
                            USER_NAME: userResult[0].NAME,
                            EMAIL_ID: userResult[0].EMAIL,
                            CLIENT_ID: 1,
                            isPresent: 1,
                            ROLE_ID: 27,
                            PROFILE_PHOTO: userResult[0].PROFILE_PHOTO
                        }];

                        var userDetails1 = [{
                            USER_ID: USER_ID,
                            USER_NAME: userResult[0].NAME,
                            NAME: userResult[0].NAME,
                            EMAIL_ID: userResult[0].EMAIL,
                            CLIENT_ID: 1,
                            ROLE_ID: 27
                        }];

                        var userDetails1 = {
                            "ID": userResult[0].ID,
                            "USER_TYPE": "C",
                            "CUSTOMER_TYPE": "B",
                        };

                        generateToken(userResult[0].ID, res, userDetails, userDetails1, flag);
                    } else {
                        return res.send({
                            "code": 404,
                            "message": "Incorrect username or password"
                        });
                    }
                }
            );
        }
    } catch (error) {
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};


exports.changeCustomerPassword = async (req, res) => {
    var USER_ID = req.body.USER_ID;
    var USER_NAME = req.body.USER_NAME;

    var NEW_PASSWORD = req.body.NEW_PASSWORD;
    // NEW_PASSWORD = md5(NEW_PASSWORD);
    NEW_PASSWORD = await mm.hashPassword(NEW_PASSWORD);

    var systemDate = mm.getSystemDate();
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(
            "CALL sp_customerMaster_changeCustomerPassword(?,?,?,?)",
            [USER_ID, USER_NAME, NEW_PASSWORD, systemDate],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    return res.send({
                        "code": 400,
                        "message": "Failed to save user information..."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const spRes = resultSets[0] || [];

                const code = spRes[0] ? spRes[0].code : 400;
                const message = spRes[0] ? spRes[0].message : "Failed to update user information.";
                const ID = spRes[0] ? spRes[0].ID : 0;

                if (code != 200) {
                    return res.send({
                        "code": code,
                        "message": message
                    });
                }

                return res.send({
                    code: 200,
                    message: "user information  saved successfully.",
                    "ID": USER_ID
                });
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        console.log(error);
    }
};

exports.sendotpforchangepassword = (req, res) => {
    var TYPE = "E";
    var TYPE_VALUE = req.body.username;
    var systemDate = mm.getSystemDate();
    var COUNTRY_CODE = req.body.COUNTRY_CODE;
    var supportKey = req.headers["supportkey"];

    try {
        if (TYPE && TYPE != " " && TYPE_VALUE && TYPE_VALUE != " ") {

            var OTP
            if ((TYPE_VALUE == "8669806792" || TYPE_VALUE == "7721909974") && TYPE == "M") {
                OTP = 1234;
            } else {
                OTP = 1234;
            }

            var body = `Your one-time password (OTP) is ${OTP}. Please enter this code to complete your login. This code is valid for 10 minutes. Team UVtechSoft.`;

            mm.executeQueryData(
                "CALL sp_customerMaster_sendotpforchangepassword(?,?,?,?)",
                [TYPE, TYPE_VALUE, OTP, systemDate],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        return res.send({
                            code: 400,
                            message: "Failed to get otp details ",
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r));
                    const spRes = resultSets[0] || [];

                    const code = spRes[0] ? spRes[0].code : 400;
                    const message = spRes[0] ? spRes[0].message : "Failed to get otp details ";

                    const RID = spRes[0] ? spRes[0].RID : 0;
                    const VERIFIED_RID = spRes[0] ? spRes[0].VERIFIED_RID : 0;

                    const USER_ID = spRes[0] ? spRes[0].USER_ID : 0;
                    const USER_NAME = spRes[0] ? spRes[0].USER_NAME : "";
                    const EMAIL = spRes[0] ? spRes[0].EMAIL : "";
                    const CUSTOMER_TYPE = spRes[0] ? spRes[0].CUSTOMER_TYPE : "";

                    if (code != 200) {
                        return res.status(400).send({
                            code: code,
                            message: message
                        });
                    }

                    if (VERIFIED_RID && VERIFIED_RID > 0) {
                        sendOtppassword("E", TYPE_VALUE, "OTP Verify", body, OTP, USER_NAME, supportKey, (err, result) => {
                            if (err) {
                                console.log(err);
                                return res.send({
                                    code: 400,
                                    message: "Failed to send OTP",
                                });
                            } else {
                                return res.send({
                                    code: 200,
                                    message: "OTP sent to mobile.",
                                    RID: RID,
                                    VID: result,
                                    USER_ID: USER_ID,
                                    USER_NAME: USER_NAME,
                                    EMAIL: EMAIL,
                                    CUSTOMER_TYPE: CUSTOMER_TYPE
                                });
                            }
                        });
                    } else {
                        sendOtp(TYPE, TYPE_VALUE, "OTP Verify", body, OTP, USER_NAME, supportKey, (err, result) => {
                            if (err) {
                                console.log(err);
                                return res.send({
                                    code: 400,
                                    message: "Failed to send OTP",
                                });
                            } else {
                                return res.send({
                                    code: 200,
                                    message: "OTP sent to mobile.",
                                    RID: RID,
                                    VID: result,
                                    isPresent: 1,
                                    USER_ID: USER_ID,
                                    USER_NAME: USER_NAME,
                                    CUSTOMER_TYPE: CUSTOMER_TYPE,
                                    EMAIL: EMAIL
                                });
                            }
                        });
                    }
                }
            );

        } else {
            res.send({
                code: 400,
                message: "parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
    }
};

function sendOtppassword(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    console.log("TYPE : ", TYPE, "TYPE_VALUE :", TYPE_VALUE);
    var subject = "Customer Login OTP"
    var otpText1
    if (TYPE == "M") {
        // otpText1 = `Dear customer, please share OTP ${OTP} with our technician to complete your order. For queries, contact Vantage Team.Team UVtechSoft.`;
        otpText1 = `Your one-time password (OTP) is ${OTP}. Please enter this code to complete your login. This code is valid for 10 minutes. Team UVtechSoft.`;
    } else {
        otpText1 = `<p style="text-align: justify;"><strong>Dear Customer,</strong></p><p style="text-align: justify;">Your one-time password (OTP) to change password is</p><h1 style="text-align: left;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with servicedesk@ovationwps.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Vantage</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"><p>`;
    }
    var otpSendStatus = "S";
    const connection = mm.openConnection();
    console.log("\n\n\n\n\n\nInserting otp details");
    mm.executeQueryData(
        "CALL sp_customer_sendOtppassword(?,?,?,?,?,?,?,?,?)",
        [TYPE, TYPE_VALUE, OTP, otpText1, systemDate, 1, 'S', '0', 'C'],
        supportKey,
        (error, results) => {
            if (error) {
                console.log(error);
                callback(error);
            } else {
                const resultSets = results.filter(r => Array.isArray(r));
                const spRes = resultSets[0] || [];

                const code = spRes[0] ? spRes[0].code : 400;
                const VID = spRes[0] ? spRes[0].VID : 0;

                if (code != 200 || !VID) {
                    return callback({ message: "Failed to insert otp details" });
                }

                sendSMSEmail(TYPE, TYPE_VALUE, OTP, subject, otpText1, (error, results) => {
                    if (error) {
                        console.log(error);
                        callback(error);
                    } else {
                        callback(null, VID);
                    }
                });
            }
        }
    );
}

exports.verifyOTPpassword = (req, res) => {
    try {
        var TYPE = "E";
        var TYPE_VALUE = req.body.EMAIL_ID;
        var OTP = req.body.OTP;
        var USER_ID = req.body.USER_ID;

        var supportKey = req.headers["supportkey"];
        var systemDate = mm.getSystemDate();

        if (TYPE != " " && TYPE_VALUE != " " && OTP != " ") {

            mm.executeQueryData(
                "CALL sp_customerMaster_verifyOTPpassword(?,?,?,?)",
                [TYPE, TYPE_VALUE, OTP, systemDate],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        return res.status(400).send({
                            code: 400,
                            message: "Failed to get otp details ",
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r));
                    const spRes = resultSets[0] || [];

                    const code = spRes[0] ? spRes[0].code : 400;
                    const message = spRes[0] ? spRes[0].message : "Failed to get otp details ";

                    if (code == 200) {
                        return res.status(200).send({
                            code: 200,
                            message: "OTP verified successfully.",
                        });
                    }

                    if (code == 300) {
                        return res.status(300).send({
                            code: 300,
                            message: "invalid OTP ",
                        });
                    }

                    return res.status(400).send({
                        code: 400,
                        message: message
                    });
                }
            );

        } else {
            return res.status(400).send({
                code: 400,
                message: "mobileno or OTP or registrationAttemptId parameter missing.",
            });
        }

    } catch (error) {
        console.log(error);
    }
};

function addingB2BCustomerData(req, res, connection, supportKey) {
    var TYPE = req.body.TYPE;
    var TYPE_VALUE = req.body.TYPE_VALUE;
    var systemDate = mm.getSystemDate();
    var COUNTRY_CODE = req.query.COUNTRY_CODE;
    COUNTRY_CODE = `${COUNTRY_CODE}`
    const CUSTOMER_TYPE = req.body.CUSTOMER_TYPE;
    if (TYPE && TYPE.trim() !== "" && TYPE_VALUE && TYPE_VALUE.trim() !== "") {
        var OTP
        if ((TYPE_VALUE == "8669806792" || TYPE_VALUE == "7721909974") && TYPE == "M") {
            // ;
            OTP = mm.getOtp();
        } else {
            OTP = mm.getOtp();
            // 
        }
        mm.executeQueryData(
            `CALL sp_add_b2b_customer_register_otp(?,?)`,
            [TYPE, TYPE_VALUE],
            supportKey,
            (error, result) => {
                if (error) {
                    return res.send({ "code": 400, "message": error.sqlMessage });
                }

                const r = result[0][0];
                const body = `${r.OTP} is your One Time Password (OTP) for registration, please do not share it with anyone.\nTeam Vantage.`;

                sendOtp(TYPE, TYPE_VALUE, "OTP Verify", body, r.OTP, '', supportKey, () => {
                    res.send({
                        "code": 200,
                        "message": r.message,
                        RID: r.RID,
                        isPresent: r.isPresent,
                        USER_ID: r.USER_ID
                    });
                });
            }
        );

    } else {
        res.send({
            "code": 400,
            "message": "Parameter missing.",
        });
    }
}

exports.unMappedSPOC = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    try {
        if (IS_FILTER_WRONG == "0" && CUSTOMER_ID != '') {
            mm.executeQueryData(
                setContext + `CALL sp_customer_unMappedSPOC()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).send({
                            "code": 400,
                            "message": "Failed to get unMapped SPOC information.",
                        });
                    }
                    else {
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
                }
            );
        }
        else {
            res.status(400).send({
                "code": 400,
                "message": "Invalid filter parameter or customer id."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.getCompanyNames = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'COMPANY_NAME';
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
                setContext + `CALL sp_customer_getCompanyNames()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                        res.status(400).send({
                            "code": 400,
                            "message": "Failed to get company names.",
                        });
                    } else {
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
                }
            );
        } else {
            res.status(400).send({
                "code": 400,
                "message": "Invalid filter.",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong.",
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

const checkCustomerDuplicate = async (data, isEdit, supportKey, connection) => {
    const results = await runQuery(
        `CALL sp_check_customer_duplicate(?, ?, ?, ?, ?, ?)`,
        [
            data.EMAIL,
            data.MOBILE_NO,
            data.SHORT_CODE || null,
            data.CUSTOMER_TYPE || 'B',
            data.ID || null,
            isEdit
        ],
        supportKey,
        connection
    );

    // First result set is email/mobile duplicates
    const emailResult = results && results[0] ? results[0] : [];

    if (emailResult.length > 0) {
        const rec = emailResult[0];

        if (rec.EMAIL?.toLowerCase() === data.EMAIL?.toLowerCase() &&
            rec.MOBILE_NO == data.MOBILE_NO)
            return `Email ${data.EMAIL} and Mobile ${data.MOBILE_NO} already belong to customer ${rec.NAME}`;

        if (rec.EMAIL?.toLowerCase() === data.EMAIL?.toLowerCase())
            return `Email ${data.EMAIL} already belongs to customer ${rec.NAME}`;

        if (rec.MOBILE_NO == data.MOBILE_NO)
            return `Mobile ${data.MOBILE_NO} already belongs to customer ${rec.NAME}`;
    }

    // Second result set is short code duplicates (for B2B)
    if (data.CUSTOMER_TYPE === "B" && data.SHORT_CODE) {
        const scResult = results && results[1] ? results[1] : [];

        if (scResult.length > 0)
            return `Short Code ${data.SHORT_CODE} already used by customer ${scResult[0].NAME}`;
    }

    return null;
};

exports.importCustomer = async (req, res) => {
    const supportKey = req.headers["supportkey"];
    const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

    if (!EXCEL_FILE_NAME) {
        return res.status(400).json({ "code": 400, "message": "Missing EXCEL_FILE_NAME" });
    }

    const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
    const cleanedRows = xlsx.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[1]],
        { defval: "" }
    );

    const jsonData = cleanedRows.filter(r =>
        Object.values(r).some(v => String(v ?? "").trim() !== "")
    );

    if (!jsonData.length) {
        return res.status(200).json({ "code": 200, "message": "No data found" });
    }

    // respond async
    res.status(200).json({
        "code": 200,
        "message": "Customer import started...",
        EXCEL_MASTER_ID
    });

    
    let successCount = 0,
        skippedCount = 0;

    let successDetails = [],
        skippedDetails = [],
        errorDetails = [],
        totalData = [],
        errorData = [];

    const isEdit = IMPORT_TYPE === "E";
    const chunkSize = 5;
    console.log("josndata", jsonData);

    for (let start = 0; start < jsonData.length; start += chunkSize) {
        const chunk = jsonData.slice(start, start + chunkSize);

        for (const [idx, row] of chunk.entries()) {
            const rowNum = start + idx + 2;
            const connection = mm.openConnection();

            try {
                
                let data = {};
                COLUMN_JSON.forEach(c =>
                    data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null
                );

                data.IS_PARENT = data.IS_PARENT === "Yes" ? 1 : 0;
                data.CUSTOMER_TYPE = "B";
                data.IS_SPECIAL_CATALOGUE = data.IS_SPECIAL_CATALOGUE === "Yes" ? 1 : 0;
                data.IS_HAVE_GST = data.IS_HAVE_GST === "Yes" ? 1 : 0;
                data.CLIENT_ID = 1;
                data.ORG_ID = 1;
                data.CUSTOMER_CATEGORY_ID = 1;

                if (isEdit) {
                    data.ACCOUNT_STATUS = data.ACCOUNT_STATUS === "Active" ? 1 : 0;
                } else {
                    data.ACCOUNT_STATUS = 1;
                }

                data.CUSTOMER_MANAGER_ID = data.CUSTOMER_MANAGER_ID ? data.CUSTOMER_MANAGER_ID : 0;

                const DAY_SHORT = {
                    Sunday: "Sun", Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
                    Thursday: "Thu", Friday: "Fri", Saturday: "Sat"
                };

                if (data.WEEKLY_HOLIDAY) {
                    data.WEEKLY_HOLIDAY = data.WEEKLY_HOLIDAY.split(",").map(d => d.trim()).map(d => DAY_SHORT[d] || d).join(",");
                } else {
                    data.WEEKLY_HOLIDAY = null;
                }

                
                if (!data.NAME || !data.EMAIL || !data.MOBILE_NO) {
                    skippedCount++;
                    skippedDetails.push({ rowNum, row, reason: "Missing mandatory fields" });
                    totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing mandatory fields" });
                    mm.rollbackConnection(connection);
                    continue;
                }

                
                const dup = await checkCustomerDuplicate(data, isEdit, supportKey, connection);

                if (dup) {
                    skippedCount++;
                    skippedDetails.push({ rowNum, row, reason: dup });
                    totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: dup });
                    mm.rollbackConnection(connection);
                    continue;
                }

                if (data.IS_PARENT == 0 && !isEdit) {
                    if (!data.PARENT_EMAIL_ID) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNum, row,
                            reason: "Provide parent email for processing the customer " + (data.NAME ?? "")
                        });
                        totalData.push({
                            ...row, IMPORT_STATUS: "Skipped",
                            reason: "Provide parent email for processing the customer " + (data.NAME ?? "")
                        });
                        mm.rollbackConnection(connection);
                        continue;
                    }
                }

                
                if (data.IS_PARENT == 0 && data.PARENT_EMAIL_ID) {
                    const parent = await runQuery(
                        `CALL sp_get_parent_customer_by_email(?)`,
                        [data.PARENT_EMAIL_ID],
                        supportKey,
                        connection
                    );

                    const parentResult = parent && parent[0] ? parent[0] : [];

                    if (!parentResult.length) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNum, row,
                            reason: "Parent customer not found having email: " + (data.PARENT_EMAIL_ID ?? "") + " for customer " + (data.NAME ?? "")
                        });
                        totalData.push({
                            ...row, IMPORT_STATUS: "Skipped",
                            reason: "Parent customer not found having email: " + (data.PARENT_EMAIL_ID ?? "") + " for customer " + (data.NAME ?? "")
                        });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    data.PARENT_CUSTOMER_ID = parentResult[0].ID;
                    data.CUSTOMER_DETAILS_ID = parentResult[0].CUSTOMER_DETAILS_ID;
                    data.CUSTOMER_CATEGORY_ID = parentResult[0].CUSTOMER_CATEGORY_ID;
                    data.CUSTOMER_TYPE = parentResult[0].CUSTOMER_TYPE;
                    data.COMPANY_NAME = parentResult[0].COMPANY_NAME;
                    data.PAN = parentResult[0].PAN;
                    data.GST_NO = parentResult[0].GST_NO;
                    data.CUSTOMER_MANAGER_ID = parentResult[0].CUSTOMER_MANAGER_ID;
                    data.VAT_NUMBER = parentResult[0].VAT_NUMBER;
                    data.WEEKLY_HOLIDAY = parentResult[0].WEEKLY_HOLIDAY;
                } else {
                    data.PARENT_CUSTOMER_ID = 0;
                }

                
                if (data.CUSTOMER_MANAGER_ID && data.IS_PARENT == 1) {
                    let customerManager = data.CUSTOMER_MANAGER_ID.split("(Email ID:");
                    let email = customerManager[1].replace(")", "").trim();

                    const ManagerEMail = await runQuery(
                        `CALL sp_get_backoffice_by_email(?)`,
                        [email],
                        supportKey,
                        connection
                    );

                    const managerResult = ManagerEMail && ManagerEMail[0] ? ManagerEMail[0] : [];

                    if (!managerResult.length) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNum, row, reason: `Customer manager details not found having email: ${email}`
                        });
                        totalData.push({
                            ...row, IMPORT_STATUS: "Skipped", reason: `Customer manager details not found having email: ${email}`
                        });
                        mm.rollbackConnection(connection);
                        continue;
                    }
                    data.CUSTOMER_MANAGER_ID = managerResult[0].ID;
                }

                let emailMasterId = null;
                const systemDate = mm.getSystemDate();

                if (isEdit) {
                    if (!data.ID) {
                        skippedCount++;
                        skippedDetails.push({ rowNum, row, reason: "Customer ID is required for Update mode" });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Customer ID missing" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    
                    const existing = await runQuery(
                        `CALL sp_get_customer_by_id(?)`,
                        [data.ID],
                        supportKey,
                        connection
                    );

                    const existingResult = existing && existing[0] ? existing[0] : [];

                    if (!existingResult.length) {
                        skippedCount++;
                        skippedDetails.push({ rowNum, row, reason: `Customer not found with ID ${data.ID}` });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Customer not found with ID ${data.ID}` });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    if (!data.PASSWORD) {
                        delete data.PASSWORD;
                    } else {
                        // data.PASSWORD = md5(data.PASSWORD);
                        data.PASSWORD = await mm.hashPassword(data.PASSWORD);
                    }

                    const existingCustomer = existingResult[0];
                    delete data.PARENT_EMAIL_ID;

                    
                    await runQuery(
                        `CALL sp_update_customer_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            data.ID,
                            data.NAME,
                            data.EMAIL,
                            data.SALUTATION || null,
                            data.MOBILE_NO,
                            data.COUNTRY_CODE,
                            data.PASSWORD || null,
                            data.IS_PARENT,
                            data.CUSTOMER_TYPE,
                            data.ACCOUNT_STATUS,
                            data.IS_SPECIAL_CATALOGUE,
                            data.IS_HAVE_GST,
                            data.CLIENT_ID,
                            data.CUSTOMER_CATEGORY_ID,
                            data.CUSTOMER_MANAGER_ID,
                            data.WEEKLY_HOLIDAY,
                            data.REGISTRATION_DATE || null,
                            data.COMPANY_NAME || null,
                            data.PAN || null,
                            data.GST_NO || null,
                            data.VAT_NUMBER || null,
                            data.SHORT_CODE || null,
                            data.PARENT_CUSTOMER_ID || 0,
                            data.CUSTOMER_DETAILS_ID || null,
                            systemDate
                        ],
                        supportKey,
                        connection
                    );

                    
                    if (existingCustomer.IS_PARENT == 1) {
                        await runQuery(
                            `CALL sp_update_customer_email_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                existingCustomer.CUSTOMER_DETAILS_ID,
                                data.NAME,
                                data.EMAIL,
                                data.SALUTATION || null,
                                data.MOBILE_NO,
                                data.COUNTRY_CODE,
                                data.PASSWORD || null,
                                data.IS_PARENT,
                                data.CUSTOMER_TYPE,
                                data.ACCOUNT_STATUS,
                                data.IS_SPECIAL_CATALOGUE,
                                data.IS_HAVE_GST,
                                data.CLIENT_ID,
                                data.CUSTOMER_CATEGORY_ID,
                                data.CUSTOMER_MANAGER_ID,
                                data.WEEKLY_HOLIDAY,
                                data.REGISTRATION_DATE || null,
                                data.COMPANY_NAME || null,
                                data.PAN || null,
                                data.GST_NO || null,
                                data.VAT_NUMBER || null,
                                data.SHORT_CODE || null,
                                systemDate
                            ],
                            supportKey,
                            connection
                        );

                        // cascade weekly holiday to all children
                        if (data.WEEKLY_HOLIDAY) {
                            await runQuery(
                                `CALL sp_update_child_customers_weekly_holiday(?, ?, ?)`,
                                [data.ID, data.WEEKLY_HOLIDAY, systemDate],
                                supportKey,
                                connection
                            );
                        }
                    }

                    mm.commitConnection(connection);
                    successCount++;
                    successDetails.push({ rowNum, row, customerId: data.ID });
                    totalData.push({ ...row, IMPORT_STATUS: "Success", MODE: "Updated" });

                } else {
                    // INSERT MODE
                    data.REGISTRATION_DATE = systemDate;
                    data.PASSWORD = await mm.hashPassword(data.PASSWORD ?? "Welcome@123");

                    
                    if (data.IS_PARENT == 1) {
                        delete data.PARENT_EMAIL_ID;

                        const emailResult = await runQuery(
                            `CALL sp_insert_customer_email_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.NAME,
                                data.EMAIL,
                                data.MOBILE_NO,
                                data.SALUTATION,
                                data.COUNTRY_CODE,
                                data.PASSWORD,
                                data.IS_PARENT,
                                data.CUSTOMER_TYPE,
                                data.ACCOUNT_STATUS,
                                data.IS_SPECIAL_CATALOGUE,
                                data.IS_HAVE_GST,
                                data.CLIENT_ID,
                                data.CUSTOMER_CATEGORY_ID,
                                data.CUSTOMER_MANAGER_ID,
                                data.WEEKLY_HOLIDAY,
                                data.REGISTRATION_DATE,
                                data.COMPANY_NAME || null,
                                data.PAN || null,
                                data.GST_NO || null,
                                data.VAT_NUMBER || null,
                                data.SHORT_CODE || null,

                            ],
                            supportKey,
                            connection
                        );

                        emailMasterId = emailResult && emailResult[0] && emailResult[0][0] ?
                            emailResult[0][0].insertId : emailResult[0]?.insertId;

                        data.CUSTOMER_DETAILS_ID = emailMasterId;
                    }

                    
                    delete data.PARENT_EMAIL_ID;

                    console.log("\n\n****************************");
                    console.log("Inserting customer_master with data: ", data);
                    console.log("\n\n****************************");
                    if (!data.CUSTOMER_DETAILS_ID) {
                        skippedCount++;
                        skippedDetails.push({ rowNum, row, reason: `Something went wrong while inserting customer_master with ID ${data.ID}` });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Something went wrong while inserting customer_master with ID ${data.ID}` });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const custResult = await runQuery(
                        `CALL sp_insert_customer_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            data.NAME,
                            data.EMAIL,
                            data.MOBILE_NO,
                            data.SALUTATION,
                            data.COUNTRY_CODE,
                            data.PASSWORD,
                            data.IS_PARENT,
                            data.CUSTOMER_TYPE,
                            data.ACCOUNT_STATUS,
                            data.IS_SPECIAL_CATALOGUE,
                            data.IS_HAVE_GST,
                            data.CLIENT_ID,
                            data.CUSTOMER_CATEGORY_ID,
                            data.CUSTOMER_MANAGER_ID,
                            data.WEEKLY_HOLIDAY,
                            data.REGISTRATION_DATE,
                            data.COMPANY_NAME || null,
                            data.PAN || null,
                            data.GST_NO || null,
                            data.VAT_NUMBER || null,
                            data.SHORT_CODE || null,
                            data.PARENT_CUSTOMER_ID || 0,
                            data.CUSTOMER_DETAILS_ID || null,
                        ],
                        supportKey,
                        connection
                    );

                    const customerId = custResult && custResult[0] && custResult[0][0] ?
                        custResult[0][0].insertId : custResult[0]?.insertId;

                    // MongoDB operations - stay in API layer
                    addGlobalData(customerId, supportKey);

                    const channels = [
                        { CHANNEL_NAME: "customer_channel" },
                        { CHANNEL_NAME: "system_alerts_channel" },
                        { CHANNEL_NAME: `customer_${customerId}_channel` }
                    ];

                    channels.forEach(ch => {
                        new channelSubscribedUsers({
                            ...ch,
                            USER_ID: customerId,
                            TYPE: "C",
                            STATUS: true,
                            USER_NAME: data.NAME,
                            CLIENT_ID: data.CLIENT_ID,
                            DATE: systemDate
                        }).save();
                    });

                    mm.commitConnection(connection);
                    successCount++;
                    successDetails.push({ rowNum, row, customerId });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });
                }

            } catch (error) {
                mm.rollbackConnection(connection);
                errorDetails.push({ rowNum, row, reason: error.message });
                errorData.push({ rowNum, row, reason: error.message });
                totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
            }

            await excelMaster.findByIdAndUpdate(
                EXCEL_MASTER_ID,
                {
                    PROGRESS: Math.round(((start + idx + 1) / jsonData.length) * 100),
                    STATUS: "Processing"
                }
            );
        }
    }

    console.log("IMPORT COMPLETED", {
        total: jsonData.length,
        successCount,
        skippedCount,
        failed: errorDetails.length
    });

    const response = {
        "code": 200,
        "message": "Customer import process completed.",
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

    console.log("\n\nJSON.stringify(response)", response);
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

};

exports.getParanetWithChild = (req, res) => {
    const supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let PARENT_CUSTOMER_ID = req.body.PARENT_CUSTOMER_ID ? req.body.PARENT_CUSTOMER_ID : '0';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PARENT_CUSTOMER_ID = ${PARENT_CUSTOMER_ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({ "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_customerMaster_getParanetWithChild()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": "Failed to get customers." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];
                console.log("resultSets", resultSets)
                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 20,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};