const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var TechnicianActionLog = require('../../modules/technicianActionLog')
const dbm = require('../../utilities/dbMongo')
var technicianProfileUpdateRequest = "technician_profile_update_request";
var viewTechnicianProfileUpdateRequest = "view_" + technicianProfileUpdateRequest;


function reqData(req) {
    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        TECHNICIAN_OLD_NAME: req.body.TECHNICIAN_OLD_NAME,
        TECHNICIAN_NEW_NAME: req.body.TECHNICIAN_NEW_NAME,
        OLD_MOBILE_NUMBER: req.body.OLD_MOBILE_NUMBER,
        NEW_MOBILE_NUMBER: req.body.NEW_MOBILE_NUMBER,
        TECHNICIAN_OLD_EMAIL: req.body.TECHNICIAN_OLD_EMAIL,
        TECHNICIAN_NEW_EMAIL: req.body.TECHNICIAN_NEW_EMAIL,
        OLD_PROFILE_PHOTO: req.body.OLD_PROFILE_PHOTO,
        NEW_PROFILE_PHOTO: req.body.NEW_PROFILE_PHOTO,
        REQUESTED_DATETIME: req.body.REQUESTED_DATETIME,
        ACTION_DATETIME: req.body.ACTION_DATETIME,
        APPROVER_ID: req.body.APPROVER_ID,
        APPROVER_NAME: req.body.APPROVER_NAME,
        STATUS: req.body.STATUS,
        IS_VERIFIED: req.body.IS_VERIFIED,
        VERIFICATION_OTP: req.body.VERIFICATION_OTP,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TECHNCIAN_ID').isInt().optional(),
        body('TECHNICIAN_OLD_NAME').optional(),
        body('TECHNICIAN_NEW_NAME').optional(),
        body('TECHNICIAN_OLD_EMAIL').optional(),
        body('TECHNICIAN_NEW_EMAIL').optional(),
        body('OLD_PROFILE_PHOTO').optional(),
        body('NEW_PROFILE_PHOTO').optional(),
        body('REQUESTED_DATETIME').optional(),
        body('APPROVAL_DATETIME').optional(),
        body('APPROVER_ID').isInt().optional(),
        body('APPROVER_NAME').optional(),
        body('STATUS').optional(),
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
                setContext + `CALL sp_technicianProfileUpdateRequest_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "message": "Failed to get technicianProfileUpdateRequest information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 182,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.status(400).json({
                 "message": "Invalid filter parameter.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
             "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var TECHNICIAN_NAME = req.body.TECHNICIAN_NAME;

    if (!TECHNICIAN_NAME) {
        return res.status(400).json({
            "code":400,
            "message": "TECHNICIAN_NAME is required."
        });
    }

    // Set defaults
    data.REQUESTED_DATETIME = mm.getSystemDate();
    data.STATUS = "P";
    data.IS_VERIFIED = 0;
    data.NEW_MOBILE_NUMBER = data.NEW_MOBILE_NUMBER || data.OLD_MOBILE_NUMBER;
    data.TECHNICIAN_NEW_NAME = data.TECHNICIAN_NEW_NAME || data.TECHNICIAN_OLD_NAME;
    data.TECHNICIAN_NEW_EMAIL = data.TECHNICIAN_NEW_EMAIL || data.TECHNICIAN_OLD_EMAIL;
    data.NEW_PROFILE_PHOTO = data.NEW_PROFILE_PHOTO || data.OLD_PROFILE_PHOTO;

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code":422,
            "message": errors.errors
        });
    }
    else {
        try {
            var OTP;
            if (data.NEW_MOBILE_NUMBER == "7020082803" || data.NEW_MOBILE_NUMBER == "8618749880") {
                OTP = mm.getOtp();
            } else {
                OTP = mm.getOtp();
            }
            data.VERIFICATION_OTP = OTP;

            mm.executeQueryData(
                `CALL sp_technicianProfileUpdateRequest_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.TECHNICIAN_ID,
                    data.TECHNICIAN_OLD_NAME,
                    data.TECHNICIAN_NEW_NAME,
                    data.OLD_MOBILE_NUMBER,
                    data.NEW_MOBILE_NUMBER,
                    data.TECHNICIAN_OLD_EMAIL,
                    data.TECHNICIAN_NEW_EMAIL,
                    data.OLD_PROFILE_PHOTO,
                    data.NEW_PROFILE_PHOTO,
                    data.REQUESTED_DATETIME,
                    null, // ACTION_DATETIME
                    null, // APPROVER_ID
                    null, // APPROVER_NAME
                    data.STATUS,
                    data.IS_VERIFIED,
                    data.VERIFICATION_OTP,
                    data.CLIENT_ID,
                    OTP,
                    TECHNICIAN_NAME
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code":400,
                            "message": "Failed to save technicianProfileUpdateRequest information..."
                        });
                    }
                    else {
                        const r = results[0][0];

                        // Send OTP
                        var TYPE = "M";
                        sendOtp(TYPE, data.NEW_MOBILE_NUMBER, "OTP Verify", req.body, r.OTP, TECHNICIAN_NAME, supportKey, (error, result) => {
                            if (error) {
                                console.log(error);
                                res.status(400).json({
                                    "code": 400,
                                     "message": "Failed to send OTP",
                                });
                            } else {
                                // Send notification to admin

                                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Technician profile update", `Technician ${TECHNICIAN_NAME} has updated his profile.`,"", "C", supportKey, "C", []);

                                // Save action log
                                var ACTION_DETAILS = `Technician ${TECHNICIAN_NAME} has updated their profile.`;
                                const logData = {
                                    TECHNICIAN_ID: data.TECHNICIAN_ID,
                                    VENDOR_ID: 0,
                                    ORDER_ID: 0,
                                    JOB_CARD_ID: 0,
                                    CUSTOMER_ID: 0,
                                    LOG_TYPE: 'Technician profile updated',
                                    ACTION_LOG_TYPE: 'Technician',
                                    ACTION_DETAILS: ACTION_DETAILS,
                                    USER_ID: data.TECHNICIAN_ID,
                                    TECHNICIAN_NAME: TECHNICIAN_NAME,
                                    ORDER_DATE_TIME: null,
                                    CART_ID: 0,
                                    EXPECTED_DATE_TIME: null,
                                    ORDER_MEDIUM: null,
                                    ORDER_STATUS: null,
                                    PAYMENT_MODE: null,
                                    PAYMENT_STATUS: null,
                                    TOTAL_AMOUNT: 0,
                                    ORDER_NUMBER: null,
                                    TASK_DESCRIPTION: null,
                                    ESTIMATED_TIME_IN_MIN: 0,
                                    PRIORITY: null,
                                    JOB_CARD_STATUS: null,
                                    USER_NAME: TECHNICIAN_NAME,
                                    DATE_TIME: data.REQUESTED_DATETIME,
                                    supportKey: 0,
                                    IANA_CODE:null
                                };
                                dbm.saveLog(logData, TechnicianActionLog);

                                res.status(200).json({
                                    "code":200,
                                     "message": "OTP sent to mobile."
                                });
                            }
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "code":500,
                 "message": "Something went wrong."
            });
        }
    }
};

exports.verifyOTP = (req, res) => {
    try {
        var OTP = req.body.OTP;
        var MOBILE_NUMBER = req.body.MOBILE_NUMBER;
        var supportKey = req.headers["supportkey"];
        var systemDate = mm.getSystemDate();

        if (OTP && MOBILE_NUMBER) {
            mm.executeQueryData(
                `CALL sp_technicianProfileUpdateRequest_verifyOTP(?,?,?)`,
                [OTP, MOBILE_NUMBER, systemDate],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                             "message": "Failed to verify OTP",
                        });
                    } else {
                        const r = results[0][0];
                        if (r.code == 200) {
                            res.status(200).json({
                                "code":200,
                                 "message": r.message
                            });
                        } else {
                            res.status(400).json({
                                "code":400,
                                 "message": r.message
                            });
                        }
                    }
                }
            );
        } else {
            res.status(400).json({
                "code":400,
                 "message": "Mobile number or OTP parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "code":500,
             "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var ID = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code":422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(
                `CALL sp_technicianProfileUpdateRequest_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    ID,
                    data.TECHNICIAN_ID,
                    data.TECHNICIAN_OLD_NAME,
                    data.TECHNICIAN_NEW_NAME,
                    data.OLD_MOBILE_NUMBER,
                    data.NEW_MOBILE_NUMBER,
                    data.TECHNICIAN_OLD_EMAIL,
                    data.TECHNICIAN_NEW_EMAIL,
                    data.OLD_PROFILE_PHOTO,
                    data.NEW_PROFILE_PHOTO,
                    data.ACTION_DATETIME,
                    data.APPROVER_ID,
                    data.APPROVER_NAME,
                    data.STATUS,
                    data.IS_VERIFIED,
                    data.VERIFICATION_OTP,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.status(400).json({
                            "code":400,
                            "message": "Failed to update technicianProfileUpdateRequest information."
                        });
                    }
                    else {
                        res.status(200).json({
                            "code":200,
                            "message": "TechnicianProfileUpdateRequest information updated successfully...",
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "code":500,
                 "message": "Something went wrong."
            });
        }
    }
};

exports.updateProfileStatus = (req, res) => {
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const TECHNICIAN_NAME = req.body.TECHNICIAN_NAME;
    const STATUS = req.body.STATUS;
    const NEW_NAME = req.body.NEW_NAME;
    const NEW_EMAIL = req.body.NEW_EMAIL;
    const NEW_PHOTO = req.body.NEW_PHOTO;
    const REJECTED_REMARK = req.body.REJECTED_REMARK;
    const NEW_MOBILE_NUMBER = req.body.NEW_MOBILE_NUMBER;
    const ID = req.body.ID;

    if (!TECHNICIAN_ID || !TECHNICIAN_NAME || !STATUS || !ID) {
        return res.status(400).json({
            "code":400,
            "message": "TECHNICIAN_ID, TECHNICIAN_NAME, STATUS, and ID are required."
        });
    }

    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();

    try {
        if (STATUS == "A") {
            if (!NEW_NAME || !NEW_EMAIL) {
                return res.status(400).json({
                    "code":400,
                    "message": "NEW_NAME and NEW_EMAIL are required for approval."
                });
            }

            mm.executeQueryData(
                `CALL sp_technicianProfileUpdateRequest_updateStatus(?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    ID,
                    TECHNICIAN_ID,
                    STATUS,
                    NEW_NAME,
                    NEW_EMAIL,
                    NEW_PHOTO || null,
                    NEW_MOBILE_NUMBER || null,
                    null, // REJECTED_REMARK for approval
                    req.body.authData.data.UserData[0].USER_ID,
                    req.body.authData.data.UserData[0].NAME,
                    systemDate
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.status(400).json({
                            "code":400,
                            "message": "Failed to update technicianProfileUpdateRequest information."
                        });
                    }
                    else {
                        const r = results[0][0];
                        if (r.code == 200) {
                            // Save action log
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has approved the profile update request of technician ${TECHNICIAN_NAME}.`;
                            const logData = {
                                TECHNICIAN_ID: TECHNICIAN_ID,
                                VENDOR_ID: 0,
                                ORDER_ID: 0,
                                JOB_CARD_ID: 0,
                                CUSTOMER_ID: 0,
                                LOG_TYPE: 'Profile Update Request',
                                ACTION_LOG_TYPE: 'Technician',
                                ACTION_DETAILS: ACTION_DETAILS,
                                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                TECHNICIAN_NAME: TECHNICIAN_NAME,
                                ORDER_DATE_TIME: null,
                                CART_ID: 0,
                                EXPECTED_DATE_TIME: null,
                                ORDER_MEDIUM: null,
                                ORDER_STATUS: null,
                                PAYMENT_MODE: null,
                                PAYMENT_STATUS: null,
                                TOTAL_AMOUNT: 0,
                                ORDER_NUMBER: null,
                                TASK_DESCRIPTION: null,
                                ESTIMATED_TIME_IN_MIN: 0,
                                PRIORITY: null,
                                JOB_CARD_STATUS: null,
                                USER_NAME: req.body.authData.data.UserData[0].NAME,
                                DATE_TIME: systemDate,
                                supportKey: 0,
                                IANA_CODE:null
                            };

                            // Send notification to technician
                            mm.sendNotificationToTechnician(
                                TECHNICIAN_ID,
                                "Profile Approved",
                                `Dear ${TECHNICIAN_NAME}, your profile update request is Approved`,
                                "",
                                "P",
                                supportKey,
                                "N",
                                "P",
                                logData
                            );

                            dbm.saveLog(logData, TechnicianActionLog);
                            res.status(200).json({
                                "code":200,
                                "message": r.message,
                            });
                        } else {
                            res.status(400).json({
                                "code":400,
                                "message": r.message,
                            });
                        }
                    }
                }
            );
        } else if (STATUS == "R") {
            if (!REJECTED_REMARK) {
                return res.status(400).json({
                    "code":400,
                    "message": "REJECTED_REMARK is required for rejection."
                });
            }

            mm.executeQueryData(
                `CALL sp_technicianProfileUpdateRequest_updateStatus(?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    ID,
                    TECHNICIAN_ID,
                    STATUS,
                    null, // NEW_NAME for rejection
                    null, // NEW_EMAIL for rejection
                    null, // NEW_PHOTO for rejection
                    null, // NEW_MOBILE_NUMBER for rejection
                    REJECTED_REMARK,
                    req.body.authData.data.UserData[0].USER_ID,
                    req.body.authData.data.UserData[0].NAME,
                    systemDate
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.status(400).json({
                            "code":400,
                            "message": "Failed to update technicianProfileUpdateRequest information."
                        });
                    }
                    else {
                        const r = results[0][0];
                        if (r.code == 200) {
                            // Send notification to technician
                            mm.sendNotificationToTechnician(
                                TECHNICIAN_ID,
                                "Profile Rejected",
                                `Dear ${TECHNICIAN_NAME}, your profile update request is Rejected`,
                                "",
                                "P",
                                supportKey,
                                "N",
                                "P",
                                req.body
                            );

                            // Save action log
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has rejected the profile update request of technician ${TECHNICIAN_NAME}.`;
                            const logData = {
                                TECHNICIAN_ID: TECHNICIAN_ID,
                                VENDOR_ID: 0,
                                ORDER_ID: 0,
                                JOB_CARD_ID: 0,
                                CUSTOMER_ID: 0,
                                LOG_TYPE: 'Profile Update Request',
                                ACTION_LOG_TYPE: 'Technician',
                                ACTION_DETAILS: ACTION_DETAILS,
                                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                TECHNICIAN_NAME: TECHNICIAN_NAME,
                                ORDER_DATE_TIME: null,
                                CART_ID: 0,
                                EXPECTED_DATE_TIME: null,
                                ORDER_MEDIUM: null,
                                ORDER_STATUS: null,
                                PAYMENT_MODE: null,
                                PAYMENT_STATUS: null,
                                TOTAL_AMOUNT: 0,
                                ORDER_NUMBER: null,
                                TASK_DESCRIPTION: null,
                                ESTIMATED_TIME_IN_MIN: 0,
                                PRIORITY: null,
                                JOB_CARD_STATUS: null,
                                USER_NAME: req.body.authData.data.UserData[0].NAME,
                                DATE_TIME: systemDate,
                                supportKey: 0
                            };

                            dbm.saveLog(logData, TechnicianActionLog);
                            res.status(200).json({
                                "code":200,
                                "message": r.message,
                            });
                        } else {
                            res.status(400).json({
                                "code":400,
                                "message": r.message,
                            });
                        }
                    }
                }
            );
        } else {
            res.status(400).json({
                "code":400,
                "message": "Invalid status."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

// OTP sending function remains the same
function sendOtp(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var subject = "Technician Otp Support";
    var otpText1;

    if (TYPE == "M") {
        callback(null, OTP);
        otpText1 = `Your Profile Update Request OTP is ${OTP}. This code is valid for the next [5 minutes]. Please do not share it with anyone.`;
    } else {
        callback(null, OTP);
        otpText1 = `<p style="text-align: justify;"><strong>Dear Technician,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: left;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with servicedesk@ovationwps.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Vantage</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"></p>`;
    }
}

