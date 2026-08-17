const { connect } = require('../../routes/globalSettings');
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
const technicianActionLog = require("../../modules/technicianActionLog")
var supportkey = "1111999";
var jobRescheduleTransactions = "job_reschedule_transactions";
var viewjobRescheduleTransactions = "view_" + jobRescheduleTransactions;

function reqData(req) {
    var data = {
        REQUESTED_DATE: req.body.REQUESTED_DATE,
        ORDER_ID: req.body.ORDER_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        REASON: req.body.REASON,
        STATUS: req.body.STATUS,
        CLIENT_ID: req.body.CLIENT_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        REMARK: req.body.REMARK,
        IS_RESCHEDULED: req.body.IS_RESCHEDULED,
        OLD_SCHEDULED_DATE_TIME: req.body.OLD_SCHEDULED_DATE_TIME
    }
    return data;
}

exports.validate = function () {
    return [
        body('REQUESTED_DATE').optional(),
        body('JOB_CARD_ID').isInt().optional(),
        body('REASON').optional(),
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
        return res.status(400).json({
            "message": "Invalid filter parameter."
        });
    }

    try {

        mm.executeQueryData(
            setContext + `CALL sp_jobRescheduleTransactions_get()`,
            [],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);

                    return res.status(400).json({
                        "message": "Failed to get jobRescheduleTransactions."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                res.status(200).json({
                    "message": "success",
                    "TAB_ID": 183,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });

            }
        );

    } catch (error) {

        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);

        res.status(500).json({
            message: "Something Went Wrong."
        });

    }

};

exports.create = (req, res) => {

    var data = reqData(req);
    var JOB_CARD_NO = req.body.JOB_CARD_NO
    var CUSTOMER_ID = req.body.CUSTOMER_ID
    var IANA_CODE = req.body.IANA_CODE

    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!IANA_CODE) {
        return res.send({
            "code": 302,
            "message": "Please provide the order's timezone to proceed"
        });
    }

    let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);

    if (!errors.isEmpty()) {

        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });

    } else {

        try {

            mm.executeQueryData(
                `CALL sp_jobRescheduleTransactions_create(?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.REQUESTED_DATE,
                    data.CUSTOMER_ID,
                    data.JOB_CARD_ID,
                    data.ORDER_ID,
                    data.TECHNICIAN_ID,
                    data.STATUS,
                    data.REASON,
                    data.REMARK,
                    data.IS_RESCHEDULED,
                    data.CLIENT_ID,
                    data.OLD_SCHEDULED_DATE_TIME
                ],
                supportKey,
                (error, results) => {

                    if (error) {

                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);

                        return res.status(400).json({
                            "code": 400,
                            "message": "Failed to save jobRescheduleTransactions information..."
                        });

                    } else {

                        const resultSets = results.filter(r => Array.isArray(r));
                        const insertResult = resultSets[0][0];
                        // const resultsgetJobs = resultSets[1];

                        const insertId = insertResult.insertId;

                        mm.sendDynamicEmail(58, insertId, supportKey)
                        mm.sendDynamicEmail(61, data.JOB_CARD_ID, supportKey)

                        const ACTION_DETAILS = `A reschedule request has been submitted by technician ${req.body.authData.data.UserData[0].USER_NAME} for work order ${JOB_CARD_NO}.`;

                        const logData = {
                            TECHNICIAN_ID: data.TECHNICIAN_ID,
                            VENDOR_ID: 0,
                            ORDER_ID: data.ORDER_ID,
                            JOB_CARD_ID: data.JOB_CARD_ID,
                            CUSTOMER_ID: data.CUSTOMER_ID,
                            LOG_TYPE: 'Job',
                            ACTION_LOG_TYPE: 'Customer',
                            ACTION_DETAILS: ACTION_DETAILS,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            TECHNICIAN_NAME: "",
                            ORDER_DATE_TIME: null,
                            CART_ID: 0,
                            EXPECTED_DATE_TIME: null,
                            ORDER_MEDIUM: null,
                            ORDER_STATUS: null,
                            PAYMENT_MODE: "",
                            PAYMENT_STATUS: "",
                            TOTAL_AMOUNT: 0,
                            ORDER_NUMBER: "",
                            TASK_DESCRIPTION: "",
                            ESTIMATED_TIME_IN_MIN: 0,
                            PRIORITY: "",
                            JOB_CARD_STATUS: "Reschedule requested by technician",
                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                            DATE_TIME: MongoLogDate,
                            supportKey: 0,
                            IANA_CODE: IANA_CODE
                        };

                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,
                            8,
                            `Reschedule requested by technician`,
                            ACTION_DETAILS,
                            "",
                            "J",
                            supportKey,
                            "J",
                            []
                        );

                        mm.sendNotificationToSPOCChannel(
                            req.body.authData.data.UserData[0].USER_ID,
                            data.ORDER_ID,
                            `Work order ia rescheduled by technician`,
                            `Technician ${req.body.authData.data.UserData[0].USER_NAME} is rescheduled the work order ${JOB_CARD_NO}. This notification is shared with you as the POC for tracking and coordination.`,
                            "",
                            "J",
                            supportKey,
                            "N",
                            "J",
                            []
                        );

                        dbm.saveLog(logData, technicianActionLog);

                        res.status(200).json({
                            "code": 200,
                            "message": "jobRescheduleTransactions information saved successfully..."
                        });

                    }

                }
            );

        } catch (error) {

            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)

            res.status(500).json({
                code: 500,
                message: "Something Went Wrong."
            });

        }

    }

}

exports.update = (req, res) => {
    const errors = validationResult(req);

    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        data[key] ? setData += `${key}= ? , ` : true;
        data[key] ? recordData.push(data[key]) : true;
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_jobRescheduleTransactions_update(?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.ID,
                    data.REQUESTED_DATE,
                    data.CUSTOMER_ID,
                    data.JOB_CARD_ID,
                    data.ORDER_ID,
                    data.TECHNICIAN_ID,
                    data.STATUS,
                    data.REASON,
                    data.REMARK,
                    data.IS_RESCHEDULED,
                    data.CLIENT_ID,
                    data.OLD_SCHEDULED_DATE_TIME
                ], supportKey, (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.status(400).json({
                            "message": "Failed to update jobRescheduleTransactions information."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of work order reschedule transactions.`;


                        var logCategory = "job card photo details";

                        let actionLog = {
                            "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        dbm.saveLog(actionLog, systemLog)
                        res.status(200).json({
                            "message": "jobRescheduleTransactions information updated successfully...",
                        });
                    }
                });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something Went Wrong."
            })
        }
    }
}

exports.updateStatus = (req, res) => {

    var data = reqData(req);
    var ID = req.body.ID;
    var ORDER_ID = req.body.ORDER_ID;
    var JOB_CARD_ID = req.body.JOB_CARD_ID;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var IANA_CODE = req.body.IANA_CODE;
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    let SCHEDULED_DATE_TIME = req.body.SCHEDULED_DATE_TIME
    let REQUESTED_DATE = req.body.REQUESTED_DATE
    let START_TIME = req.body.START_TIME
    let END_TIME = req.body.END_TIME
    let STATUS = req.body.STATUS
    let TERRITORY_ID = req.body.TERRITORY_ID
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    try {
        if (!IANA_CODE) {
            res.send({
                "code": 302,
                "message": "Please provide the order's timezone to proceed"
            });
            return;
        }
        var getUTCfromTimeZone = mm.getUTCFromTimezone(IANA_CODE);
        let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);
        var status = ''
        if (STATUS == "A") {
            status = 'accepted'
        } else {
            status = 'rejected'
        }
        const connection = mm.openConnection();
        mm.executeDML(`CALL sp_jobReschedule_updateStatus(?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                STATUS,
                data.REMARK,
                JOB_CARD_ID,
                ORDER_ID,
                TECHNICIAN_ID,
                SCHEDULED_DATE_TIME,
                REQUESTED_DATE,
                systemDate
            ], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update jobRescheduleTransactions information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));

                    if (STATUS == 'R') {
                        const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your work order rescheduling request.`;
                        const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: null, PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Work order reschedule request is rejected by " + req.body.authData.data.UserData[0].NAME + "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE }
                        dbm.saveLog(logData, technicianActionLog);
                        // mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Reschedule request ${status}`, `${req.body.authData.data.UserData[0].NAME} has resheduled your work order at ${SCHEDULED_DATE_TIME}.`, "", "O", supportKey, "N", "J", logData);
                        mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, ORDER_ID, `Reschedule request ${status}`, `${req.body.authData.data.UserData[0].NAME} has resheduled work order at ${SCHEDULED_DATE_TIME}. This notification is shared with you as the POC for tracking and coordination.`, "", "O", supportKey, "N", "J", []);
                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Reschedule request ${status}`, ACTION_DETAILS, "", "J", supportKey, "N", "J", logData);
                        // mm.sendDynamicEmail(43, JOB_CARD_ID, supportKey)//customeremail
                        mm.sendDynamicEmail(71, ID, supportKey)//technicianemail
                        mm.commitConnection(connection);
                        res.status(200).json({
                            "code": 200,
                            "message": "jobreschedule information updated successfully...",
                        });
                    } else {
                        const OLD = resultSets[0][0];

                        console.log("OLD DATA:", OLD);
                        // Normalize helpers (same as updateScheduleJob)
                        const normalizeDate = (d) => {
                            if (!d) return null;
                            if (typeof d === "string") return d.split("T")[0];
                            if (d instanceof Date) return d.toISOString().split("T")[0];
                            return new Date(d).toISOString().split("T")[0];
                        };
                        const normalizeTime = (t) => t ? t.substring(0, 5) : "00:00";

                        const OLD_START_DATE = normalizeDate(OLD.SCHEDULED_DATE_TIME);
                        const OLD_END_DATE = normalizeDate(OLD.EXPECTED_END_DATE);
                        const OLD_START_TIME = normalizeTime(OLD.START_TIME);
                        const OLD_END_TIME = normalizeTime(OLD.END_TIME);
                        console.log("\n\n\n\n\n $$$$$", "OLD_START_DATE:", OLD_START_DATE, "OLD_END_DATE:", OLD_END_DATE, "OLD_START_TIME:", OLD_START_TIME, "OLD_END_TIME:", OLD_END_TIME);

                        // Build old range
                        const buildRange = (sDate, eDate, sTime, eTime) => {
                            const range = [];
                            let d1 = new Date(sDate);
                            let d2 = new Date(eDate);
                            let dt = new Date(d1);

                            while (dt <= d2) {
                                const day = dt.toISOString().split("T")[0];

                                if (day === sDate && day === eDate) {
                                    range.push({ date: day, start: sTime, end: eTime });
                                } else if (day === sDate) {
                                    range.push({ date: day, start: sTime, end: "23:50" });
                                } else if (day === eDate) {
                                    range.push({ date: day, start: "00:00", end: eTime });
                                } else {
                                    range.push({ date: day, start: "00:00", end: "23:50" });
                                }
                                dt.setDate(dt.getDate() + 1);
                            }
                            return range;
                        };

                        const oldRange = buildRange(OLD_START_DATE, OLD_END_DATE, OLD_START_TIME, OLD_END_TIME);
                                const async = require('async');
                        async.eachSeries(oldRange, (slot, cbClear) => {

                            const start = parseTime(slot.start);
                            const end = parseTime(slot.end);
                            const slots = generateTimeSlots(start, end);

                            const clearClause = slots.map(s => `\`${s}\` = NULL`).join(", ");

                            mm.executeDML(`CALL sp_clearTechnicianSlots(?,?,?,?)`,
                                [
                                    clearClause,
                                    systemDate,
                                    TECHNICIAN_ID,
                                    slot.date
                                ], supportKey, connection, () => cbClear());
                            // console.log("Cleared slots for ", hyggggg);
                        }, () => {
                            // AFTER CLEARING — proceed with logs, notifications
                            const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your work order rescheduling request.`;
                            const logData = {
                                TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID,
                                JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID,
                                LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS,
                                USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "",
                                ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "",
                                ORDER_STATUS: null, PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "",
                                TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "",
                                JOB_CARD_STATUS: "Work order reschedule request is approved by " + req.body.authData.data.UserData[0].NAME,
                                USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate,
                                supportKey: 0, IANA_CODE: IANA_CODE
                            };
                            dbm.saveLog(logData, technicianActionLog);
                            mm.sendNotificationToTechnician(1, TECHNICIAN_ID, `Reschedule request ${status}`, ACTION_DETAILS, "", "J", supportKey, "N", "JR", logData);
                            mm.sendNotificationToChannel(1, `customer_${CUSTOMER_ID}_channel`, `Reschedule request ${status}`, `${req.body.authData.data.UserData[0].NAME} has resheduled your work order at ${SCHEDULED_DATE_TIME}.`, "", "O", supportKey, "N", "JR", logData);
                            mm.sendDynamicEmail(42, JOB_CARD_ID, supportKey);//customer email
                            mm.sendDynamicEmail(70, ID, supportKey);//technician email

                            mm.commitConnection(connection);
                            return res.status(200).json({ "code": 200, "message": "jobreschedule information updated successfully..." });
                        });
                    }
                }
            })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something Went Wrong."
        })
    }
}

exports.getCounts = (req, res) => {

    var supportKey = req.headers['supportkey'];
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {

        if (IS_FILTER_WRONG == "0") {

            const safeFilter = (filter || '').replace(/'/g, "\\'");

            mm.executeQueryData(
                `CALL sp_jobReschedule_getCounts(?)`,
                [safeFilter],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log(error);
                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );

                        return res.status(400).json({
                            message: "Failed to get jobRescheduleTransactions information."
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r));
                    const dataResult = resultSets[0] || [];

                    res.status(200).json({
                        message: "success",
                        TAB_ID: 183,
                        data: dataResult
                    });

                }
            );

        } else {

            res.status(400).json({
                message: "Invalid filter parameter."
            });

        }

    } catch (error) {

        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );

        console.log(error);

        res.status(500).json({
            message: "Something Went Wrong."
        });

    }

};

exports.RefundStatus = (req, res) => {

    var data = reqData(req);
    var ID = req.body.ID;
    var ORDER_ID = req.body.ORDER_ID;
    var ORDER_STATUS = req.body.ORDER_STATUS;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var PAYMENT_STATUS = req.body.PAYMENT_STATUS;

    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];

    try {

        if (PAYMENT_STATUS != "RF") {
            return res.status(300).json({
                "message": "Wrong Status."
            });
        }

        let IANA_CODE = req.body.IANA_CODE;

        if (!IANA_CODE) {
            return res.status(302).json({
                "code": 302,
                "message": "Please provide orders timeZone code."
            });
        }

        const connection = mm.openConnection();

        mm.executeQueryData(
            `CALL sp_jobReschedule_refundStatus(?,?,?)`,
            [
                ID,
                "RF",
                systemDate
            ],
            supportKey,
            connection,
            (error, results) => {

                if (error) {

                    mm.rollbackConnection(connection);

                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );

                    console.log(error);

                    return res.status(400).json({
                        "message": "Failed to update jobRescheduleTransactions information."
                    });

                } else {

                    const ACTION_DETAILS =
                        `${req.body.authData.data.UserData[0].NAME} has refunded the amount for your work order.`;

                    const logData = {
                        TECHNICIAN_ID: 0,
                        VENDOR_ID: 0,
                        ORDER_ID: ORDER_ID,
                        JOB_CARD_ID: 0,
                        CUSTOMER_ID: CUSTOMER_ID,
                        LOG_TYPE: 'Job',
                        ACTION_LOG_TYPE: 'User',
                        ACTION_DETAILS: ACTION_DETAILS,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        TECHNICIAN_NAME: "",
                        ORDER_DATE_TIME: null,
                        CART_ID: 0,
                        EXPECTED_DATE_TIME: null,
                        ORDER_MEDIUM: "",
                        ORDER_STATUS: null,
                        PAYMENT_MODE: "",
                        PAYMENT_STATUS: "",
                        TOTAL_AMOUNT: "",
                        ORDER_NUMBER: "",
                        TASK_DESCRIPTION: "",
                        ESTIMATED_TIME_IN_MIN: 0,
                        PRIORITY: "",
                        JOB_CARD_STATUS: "",
                        USER_NAME: req.body.authData.data.UserData[0].NAME,
                        DATE_TIME: systemDate,
                        supportKey: 0,
                        IANA_CODE: IANA_CODE
                    };

                    const logData2 = { ...logData };

                    const logaaray = [logData, logData2];

                    dbm.saveLog(logaaray, technicianActionLog);

                    mm.commitConnection(connection);

                    res.status(200).json({
                        "message": "jobreschedule information updated successfully..."
                    });

                }

            }
        );

    } catch (error) {

        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );

        console.log(error);

        res.status(500).json({
            message: "Something Went Wrong."
        });

    }

};

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
}

function generateTimeSlots(start, end) {
    const slots = [];
    let current = new Date(0, 0, 0, start.hours, start.minutes);

    while (current <= new Date(0, 0, 0, end.hours, end.minutes)) {
        const hours = current.getHours().toString().padStart(2, "0");
        const minutes = current.getMinutes().toString().padStart(2, "0");
        slots.push(`${hours}:${minutes}`);
        current.setMinutes(current.getMinutes() + 10);
    }

    return slots;
}

exports.bulkRescheduleByTechnician = (req, res) => {

    var data = req.body;
    var supportKey = req.headers['supportkey'];

    try {

        if (!data || data.length === 0) {
            return res.status(400).json({
                code: 400,
                message: "data is required"
            });
        }

        var IANA_CODE = data[0].IANA_CODE;

        if (!IANA_CODE) {
            return res.send({
                code: 302,
                message: "Please provide the order's timezone to proceed"
            });
        }

        var getUTCfromTimeZone = mm.getUTCFromTimezone(IANA_CODE);
        let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);

        mm.executeQueryData(
            `CALL sp_bulkRescheduleByTechnician(?)`,
            [JSON.stringify(data)],
            supportKey,
            (error, results) => {

                if (error) {

                    console.log(error);
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);

                    return res.status(400).json({
                        code: 400,
                        message: "Failed to save jobRescheduleTransactions information..."
                    });

                }

                const insertId = results[0][0].insertId;

                data.forEach(item => {

                    mm.sendDynamicEmail(58, insertId, supportKey); // Customer Email
                    mm.sendDynamicEmail(61, item.JOB_CARD_ID, supportKey); // Admin Email

                    const ACTION_DETAILS =
                        `Technician ${req.body.authData.data.UserData[0].USER_NAME} has requested to reschedule work order ${item.JOB_CARD_NO}.`;

                    const logData = {
                        TECHNICIAN_ID: item.TECHNICIAN_ID,
                        VENDOR_ID: 0,
                        ORDER_ID: item.ORDER_ID,
                        JOB_CARD_ID: item.JOB_CARD_ID,
                        CUSTOMER_ID: item.CUSTOMER_ID,
                        LOG_TYPE: 'Job',
                        ACTION_LOG_TYPE: 'Customer',
                        ACTION_DETAILS: ACTION_DETAILS,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        TECHNICIAN_NAME: "",
                        ORDER_DATE_TIME: null,
                        CART_ID: 0,
                        EXPECTED_DATE_TIME: null,
                        ORDER_MEDIUM: null,
                        ORDER_STATUS: null,
                        PAYMENT_MODE: "",
                        PAYMENT_STATUS: "",
                        TOTAL_AMOUNT: 0,
                        ORDER_NUMBER: "",
                        TASK_DESCRIPTION: "",
                        ESTIMATED_TIME_IN_MIN: 0,
                        PRIORITY: "",
                        JOB_CARD_STATUS: "Reschedule requested by technician",
                        USER_NAME: req.body.authData.data.UserData[0].NAME,
                        DATE_TIME: MongoLogDate,
                        supportKey: 0,
                        IANA_CODE: IANA_CODE
                    };

                    mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,
                        8,
                        `Reschedule requested by technician`,
                        ACTION_DETAILS,
                        "",
                        "J",
                        supportKey,
                        "J",
                        []
                    );

                    mm.sendNotificationToSPOCChannel(
                        req.body.authData.data.UserData[0].USER_ID,
                        item.ORDER_ID,
                        `Work order rescheduled by technician`,
                        `Technician ${req.body.authData.data.UserData[0].USER_NAME} rescheduled the work order ${item.JOB_CARD_ID}`,
                        "",
                        "J",
                        supportKey,
                        "N",
                        "J",
                        []
                    );

                    dbm.saveLog(logData, technicianActionLog);

                });

                res.status(200).json({
                    code: 200,
                    message: "jobRescheduleTransactions information saved successfully..."
                });

            }
        );

    } catch (error) {

        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);

        console.log(error);

        res.status(500).json({
            code: 500,
            message: "Something Went Wrong."
        });

    }

};
