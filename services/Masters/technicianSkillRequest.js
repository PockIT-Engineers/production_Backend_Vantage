const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var TechnicianActionLog = require('../../modules/technicianActionLog')
const dbm = require('../../utilities/dbMongo')
var technicianSkillRequest = "technician_skill_request";
var viewTechnicianSkillRequest = "view_" + technicianSkillRequest;


function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        SKILL_IDS: req.body.SKILL_IDS,
        SKILL_NAME: req.body.SKILL_NAME,
        APPROVER_ID: req.body.APPROVER_ID,
        APPROVED_BY: req.body.APPROVED_BY,
        REQUESTED_DATETIME: req.body.REQUESTED_DATETIME,
        ACTION_DATE_TIME: req.body.ACTION_DATE_TIME,
        REJECTED_REMARK: req.body.REJECTED_REMARK,
        STATUS: req.body.STATUS,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('TECHNICIAN_NAME').optional(),
        body('SKILL_IDS').optional(),
        body('SKILL_NAME').optional(),
        body('APPROVER_ID').isInt().optional(),
        body('APPROVED_BY').optional(),
        body('REQUESTED_DATETIME').optional(),
        body('APPROVED_DATE_TIME').optional(),
        body('REJECTED_REMARK').optional(),
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
                setContext + `CALL sp_technicianSkillRequest_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get technicianSkillRequest information."
                        });
                    }
                    else {
                        console.log("results",results)
                         const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 118,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.status(400).json({
                "code": 400,
                "message": "Invalid filter parameter.",
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

exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    data.REQUESTED_DATETIME = mm.getSystemDate();

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            data.STATUS = 'P';
            mm.executeQueryData(
                `CALL sp_technicianSkillRequest_create(?,?,?,?,?,?,?)`,
                [
                    data.TECHNICIAN_ID,
                    data.TECHNICIAN_NAME,
                    data.SKILL_IDS,
                    data.SKILL_NAME,
                    data.REQUESTED_DATETIME,
                    data.STATUS,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to save technicianSkillRequest information..."
                        });
                    }
                    else {
                        const r = results[0][0];
                        const requestId = r.ID;

                        // Send notifications
                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Skill Request", `Technician ${data.TECHNICIAN_NAME} has sent skill approval request,\n kindly take action over it.`, "", "S", supportKey, "TSR", []);
                        mm.sendDynamicEmail(69, data.TECHNICIAN_ID, supportKey); // technician email
                        mm.sendDynamicEmail(63, data.TECHNICIAN_ID, supportKey); // admin email

                        // Save action log
                        var ACTION_DETAILS = `Technician ${data.TECHNICIAN_NAME} has submitted a skill request.`;
                        const logData = {
                            TECHNICIAN_ID: data.TECHNICIAN_ID,
                            VENDOR_ID: 0,
                            ORDER_ID: 0,
                            JOB_CARD_ID: 0,
                            CUSTOMER_ID: 0,
                            LOG_TYPE: 'Skill Request',
                            ACTION_LOG_TYPE: 'Technician',
                            ACTION_DETAILS: ACTION_DETAILS,
                            USER_ID: data.TECHNICIAN_ID,
                            TECHNICIAN_NAME: data.TECHNICIAN_NAME,
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
                            USER_NAME: data.TECHNICIAN_NAME,
                            DATE_TIME: data.REQUESTED_DATETIME,
                            supportKey: 0,
                            IANA_CODE:null
                        };

                        dbm.saveLog(logData, TechnicianActionLog);
                        res.status(200).json({
                            "code": 200,
                            "message": "TechnicianSkillRequest information saved successfully...",
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var ID = req.body.ID;
    var systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            data.STATUS = 'P';
            mm.executeQueryData(
                `CALL sp_technicianSkillRequest_update(?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    ID,
                    data.TECHNICIAN_ID,
                    data.TECHNICIAN_NAME,
                    data.SKILL_IDS,
                    data.SKILL_NAME,
                    data.APPROVER_ID,
                    data.APPROVED_BY,
                    data.ACTION_DATE_TIME,
                    data.REJECTED_REMARK,
                    data.STATUS,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to update technicianSkillRequest information."
                        });
                    }
                    else {
                        // Save action log
                        var ACTION_DETAILS = `Technician ${data.TECHNICIAN_NAME} has updated skill request.`;
                        const logData = {
                            TECHNICIAN_ID: data.TECHNICIAN_ID,
                            VENDOR_ID: 0,
                            ORDER_ID: 0,
                            JOB_CARD_ID: 0,
                            CUSTOMER_ID: 0,
                            LOG_TYPE: 'Skill Request',
                            ACTION_LOG_TYPE: 'Technician',
                            ACTION_DETAILS: ACTION_DETAILS,
                            USER_ID: data.TECHNICIAN_ID,
                            TECHNICIAN_NAME: data.TECHNICIAN_NAME,
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
                            USER_NAME: data.TECHNICIAN_NAME,
                            DATE_TIME: data.REQUESTED_DATETIME,
                            supportKey: 0,
                            IANA_CODE:null
                        };

                        dbm.saveLog(logData, TechnicianActionLog);

                        // Send notification to admin
                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Skill Request", `Technician ${data.TECHNICIAN_NAME} has sent skill approval request,\n kindly take action over it.`, "", "S",supportKey,'S', []);

                        res.status(200).json({
                            "code": 200,
                            "message": "TechnicianSkillRequest information updated successfully...",
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};

exports.updateSkillStatus = (req, res) => {
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const TECHNICIAN_NAME = req.body.TECHNICIAN_NAME;
    const STATUS = req.body.STATUS;
    const SKILL_IDS = req.body.SKILL_IDS;
    const REJECTED_REMARK = req.body.REJECTED_REMARK;
    const ID = req.body.ID;

    if (!TECHNICIAN_ID || !TECHNICIAN_NAME || !STATUS || !ID) {
        return res.status(400).json({
            "code": 400,
            "message": "TECHNICIAN_ID, TECHNICIAN_NAME, STATUS, and ID are required."
        });
    }

    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();

    try {

        let skillIdsArray = SKILL_IDS;
        let skillIdsString = skillIdsArray.join(',');
        mm.executeQueryData(
            `CALL sp_technicianSkillRequest_updateStatus(?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                TECHNICIAN_ID,
                TECHNICIAN_NAME,
                STATUS,
                skillIdsString,
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
                        "code": 400,
                        "message": "Failed to update technicianSkillRequest information."
                    });
                }
                else {
                    const r = results[0][0];

                    if (r.code == 200) {
                        // Save action log based on status
                        var ACTION_DETAILS = '';
                        const logData = {
                            TECHNICIAN_ID: TECHNICIAN_ID,
                            VENDOR_ID: 0,
                            ORDER_ID: 0,
                            JOB_CARD_ID: 0,
                            CUSTOMER_ID: 0,
                            LOG_TYPE: 'Skill Request',
                            ACTION_LOG_TYPE: 'Technician',
                            ACTION_DETAILS: '',
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
                            IANA_CODE: null
                        };

                        if (STATUS == "A") {
                            // Send notification to technician for approval
                            mm.sendNotificationToTechnician(
                                req.body.authData.data.UserData[0].USER_ID,
                                TECHNICIAN_ID,
                                "Skill Approved",
                                `Dear ${TECHNICIAN_NAME}, your skill request has been approved.`,
                                "",
                                "S",
                                supportKey,
                                "N",
                                "S",
                                req.body
                            );

                            ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has approved the skill request of technician ${TECHNICIAN_NAME}.`;
                            logData.ACTION_DETAILS = ACTION_DETAILS;

                        } else if (STATUS == "R") {
                            // Send notification to technician for rejection
                            mm.sendNotificationToTechnician(
                                req.body.authData.data.UserData[0].USER_ID,
                                TECHNICIAN_ID,
                                "Skill Request Rejected",
                                `Dear ${TECHNICIAN_NAME}, your skill request is rejected`,
                                "",
                                "S",
                                supportKey,
                                "N",
                                "S",
                                logData
                            );

                            ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has rejected the skill approval request of technician ${TECHNICIAN_NAME}.`;
                            logData.ACTION_DETAILS = ACTION_DETAILS;
                        }

                        dbm.saveLog(logData, TechnicianActionLog);

                        // Send email notification
                        mm.sendDynamicEmail(66, ID, supportKey); // technician email

                        res.status(200).json({
                            "code": 200,
                            "message": r.message,
                        });
                    } else {
                        res.status(400).json({
                            "code": 400,
                            "message": r.message,
                        });
                    }
                }
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.getStatusCount = (req, res) => {
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
                setContext+`CALL sp_technicianSkillRequest_getStatusCount()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get technicianSkillRequest status count."
                        });
                    }
                    else {

                          const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 118,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                      
                    }
                }
            );
        }
        else {
            res.status(400).json({
                "code": 400,
                "message": "Invalid filter parameter.",
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