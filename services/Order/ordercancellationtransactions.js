const { connect } = require('../../routes/globalSettings');
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
const technicianActionLog = require("../../modules/technicianActionLog")
var orderCancellationTransactions = "order_cancellation_transactions";
var viewOrderCancellationTransactions = "view_" + orderCancellationTransactions;
// Conversion Done 

function reqData(req) {
    var data = {
        REQUESTED_DATE: req.body.REQUESTED_DATE,
        ORDER_ID: req.body.ORDER_ID,
        PAYMENT_ID: req.body.PAYMENT_ID,
        CANCELLED_BY: req.body.CANCELLED_BY,
        CANCEL_DATE: req.body.CANCEL_DATE,
        REASON: req.body.REASON,
        REFUND_STATUS: req.body.REFUND_STATUS,
        CLIENT_ID: req.body.CLIENT_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        REMARK: req.body.REMARK,
        CUSTOMER_REMARK: req.body.CUSTOMER_REMARK,
        PAYMENT_REFUND_STATUS: req.body.PAYMENT_REFUND_STATUS
    }
    return data;
}

exports.validate = function () {
    return [
        body('REQUESTED_DATE').optional(),
        body('ORDER_ID').isInt().optional(),
        body('PAYMENT_ID').optional(),
        body('CANCELLED_BY').optional(),
        body('CANCEL_DATE').optional(),
        body('REASON').optional(),
        body('REFUND_STATUS').optional(),
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
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    const safeFilter = (filter || '').replace(/'/g, "\\'");
    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(setContext + ` CALL sp_get_order_cancellation_transactions(); `, [], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey); res.send({
                        code: 400,
                        message: "Failed to get orderCancellationTransactions information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];
                    res.send({
                        code: 200,
                        message: "success",
                        TAB_ID: 61,
                        count: countResult[0] ? countResult[0].cnt : 0,
                        data: dataResult
                    });

                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            });
        }
    }
    catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        });
    }
};

exports.create = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'] ? req.headers['supportkey'] : "supportkey";

    const ORDER_CREATER_ID = req.body.ORDER_CREATER_ID;
    const ORDER_CREATED_BY = req.body.ORDER_CREATED_BY;
    const IANA_CODE = req.body.IANA_CODE;

    const USER_ID = req.body.authData.data.UserData[0].USER_ID;
    const USER_NAME = req.body.authData.data.UserData[0].NAME;

    /* A senior Service Desk member, and a customer cancelling their own not yet
       accepted work order, are cancelling outright rather than asking for approval.
       Sending them "we have received your cancellation request" (template 34) is
       immediately contradicted by the "successfully cancelled" mail (template 36),
       which is the pair of mails the customer complained about. Only the junior
       Service Desk flow, which really does wait in the Work Order Cancellation
       Queue, still gets the acknowledgement.
       The flag comes from the caller because the JWT carries only USER_ID / NAME
       (see generateToken in services/UserAccess/user.js) - there is no ROLE_ID to
       check here. It selects which mail goes out, never who is allowed to cancel. */
    const IS_DIRECT_CANCELLATION =
        req.body.IS_DIRECT_CANCELLATION === true ||
        req.body.IS_DIRECT_CANCELLATION === 'true' ||
        req.body.IS_DIRECT_CANCELLATION === 1;

    if (!IANA_CODE) {
        return res.send({
            code: 302,
            message: "Please provide the work order's timezone to proceed"
        });
    }

    if (!errors.isEmpty()) {
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);
        mm.executeQueryData(
            `CALL sp_order_cancellation_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.REQUESTED_DATE,
                data.ORDER_ID,
                data.PAYMENT_ID,
                USER_ID, // CANCELLED_BY is an INT column = user id of whoever cancelled (frontend sends 'A' flag which is wrong type)
                data.CANCEL_DATE,
                data.REASON,
                data.REFUND_STATUS,
                data.CLIENT_ID,
                data.CUSTOMER_ID,
                data.REMARK,
                data.CUSTOMER_REMARK,
                data.PAYMENT_REFUND_STATUS || 'P',
                ORDER_CREATER_ID,
                ORDER_CREATED_BY,
                IANA_CODE,
                USER_ID,
                USER_NAME
            ],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey +
                        ' ' +
                        req.method +
                        " " +
                        req.url +
                        ' ' +
                        JSON.stringify(error),
                        applicationkey
                    );

                    return res.send({
                        code: 400,
                        message: "Failed to save orderCancellationTransactions information..."
                    });
                }

                const r = result[0][0];

                if (r.code !== 200) {
                    return res.send(r);
                }

                const CANCELLATION_ID = r.CANCELLATION_ID;
                const COMPANY_NAME = r.COMPANY_NAME;

                /* ---------------- EMAILS ---------------- */

                // Everyone mapped to this customer under "Map Service Desk Team" is
                // CC'd on the customer's cancellation mail, next to the SPOC emails.
                // A direct cancellation skips it - the customer only gets the
                // "successfully cancelled" mail once the cancellation completes.
                if (!IS_DIRECT_CANCELLATION) {
                    mm.getCancellationEmailRecipients(data.ORDER_ID, supportKey, (recipients) => {
                        mm.sendDynamicEmail(34, CANCELLATION_ID, supportKey, recipients); // customer email
                    });
                }

                mm.sendDynamicEmail(55, CANCELLATION_ID, supportKey); // admin email

                /* ---------------- ACTION DETAILS ---------------- */

                const ACTION_DETAILS =
                    `${COMPANY_NAME} has requested to cancel work order.`;

                /* ---------------- ADMIN NOTIFICATION ---------------- */

                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,
                    8,
                    "Work Order Cancellation Request",
                    ACTION_DETAILS,
                    "",
                    "O",
                    supportKey,
                    "O",
                    []
                );

                /* ---------------- SPOC CHANNEL ---------------- */

                mm.sendNotificationToSPOCChannel(
                    USER_ID,
                    data.ORDER_ID,
                    "Work Order Cancellation Request",
                    `${USER_NAME} has requested to cancel work order. This notification is shared with you as the POC for tracking and coordination.`,
                    "",
                    "O",
                    supportKey,
                    "N",
                    "O",
                    []
                );

                /* ---------------- VENDOR / MANAGER NOTIFICATION ---------------- */

                if (ORDER_CREATED_BY == 'V') {

                    mm.sendNotificationToVendor(
                        USER_ID,
                        ORDER_CREATER_ID,
                        "Work Order Cancellation Request",
                        ACTION_DETAILS,
                        "",
                        "O",
                        supportKey,
                        "",
                        "O",
                        req.body
                    );

                } else if (ORDER_CREATED_BY == 'B') {

                    mm.sendNotificationToManager(
                        USER_ID,
                        ORDER_CREATER_ID,
                        "Work Order Cancellation Request",
                        ACTION_DETAILS,
                        "",
                        "O",
                        supportKey,
                        "",
                        "O",
                        req.body
                    );

                } else {

                    console.log("ORDER_CREATED_BY is C");

                }

                /* ---------------- MONGO LOG ---------------- */

                const logData = {
                    TECHNICIAN_ID: 0,
                    VENDOR_ID: 0,
                    ORDER_ID: data.ORDER_ID,
                    JOB_CARD_ID: 0,
                    CUSTOMER_ID: data.CUSTOMER_ID,
                    LOG_TYPE: 'Order',
                    ACTION_LOG_TYPE: 'Customer',
                    ACTION_DETAILS: ACTION_DETAILS,
                    USER_ID: USER_ID,
                    TECHNICIAN_NAME: "",
                    ORDER_DATE_TIME: null,
                    CART_ID: 0,
                    EXPECTED_DATE_TIME: null,
                    ORDER_MEDIUM: null,
                    ORDER_STATUS: "Requested for work order cancellation",
                    PAYMENT_MODE: "",
                    PAYMENT_STATUS: "",
                    TOTAL_AMOUNT: 0,
                    ORDER_NUMBER: "",
                    TASK_DESCRIPTION: "",
                    ESTIMATED_TIME_IN_MIN: 0,
                    PRIORITY: "",
                    JOB_CARD_STATUS: "",
                    USER_NAME: USER_NAME,
                    DATE_TIME: MongoLogDate,
                    supportKey: 0,
                    IANA_CODE: IANA_CODE
                };

                dbm.saveLog(logData, technicianActionLog);

                /* ---------------- SUCCESS RESPONSE ---------------- */

                res.send({
                    code: 200,
                    message: "OrderCancellationTransactions information saved successfully..."
                });

            }
        );

    } catch (error) {

        logger.error(
            supportKey +
            ' ' +
            req.method +
            " " +
            req.url +
            ' ' +
            JSON.stringify(error),
            applicationkey
        );

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }
};



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
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_update_order_cancellation_transactions(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    criteria.ID,
                    data.REQUESTED_DATE,
                    data.ORDER_ID,
                    data.PAYMENT_ID,
                    data.CANCELLED_BY,
                    data.CANCEL_DATE,
                    data.REASON,
                    data.REFUND_STATUS,
                    data.CLIENT_ID,
                    data.CUSTOMER_ID,
                    data.REMARK,
                    data.CUSTOMER_REMARK,
                    data.PAYMENT_REFUND_STATUS,
                    systemDate
                ], supportKey, (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update orderCancellationTransactions information."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated of order cancellation request.`;
                        var logCategory = "job card photo details";
                        let actionLog = {
                            "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        dbm.saveLog(actionLog, systemLog)
                        res.send({
                            "code": 200,
                            "message": "OrderCancellationTransactions information updated successfully...",
                        });
                    }
                });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
        }
    }
}

exports.updateStatus = (req, res) => {

    const data = reqData(req);
    const supportKey = req.headers['supportkey'];

    const ID = req.body.ID;
    const ORDER_ID = req.body.ORDER_ID;
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    const PAYMENT_MODE = req.body.PAYMENT_MODE;
    const ORDER_STATUS = req.body.ORDER_STATUS;
    const IANA_CODE = req.body.IANA_CODE;

    const USER_ID = req.body.authData.data.UserData[0].USER_ID;
    const USER_NAME = req.body.authData.data.UserData[0].NAME;

    if (!IANA_CODE) {
        return res.send({
            code: 302,
            message: "Please provide the work order's timezone to proceed"
        });
    }

    let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);

    try {

        mm.executeQueryData(
            `CALL sp_order_cancellation_updateStatus(?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                ORDER_ID,
                CUSTOMER_ID,
                data.REFUND_STATUS,
                data.REMARK,
                PAYMENT_MODE,
                ORDER_STATUS,
                IANA_CODE,
                USER_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to update orderCancellationTransactions information."
                    });
                }

                const r = result[0][0];

                if (r.code !== 200) {
                    return res.send(r);
                }

                const status = data.REFUND_STATUS === "A" ? "accepted" : "rejected";

                /* -------- EMAIL -------- */

                if (data.REFUND_STATUS == "A" || data.REFUND_STATUS == "R") {
                    const TEMPLATE_ID = data.REFUND_STATUS == "A" ? 36 : 37;

                    // Same CC audience as the cancellation request: everyone mapped
                    // to this customer under "Map Service Desk Team".
                    mm.getCancellationEmailRecipients(ORDER_ID, supportKey, (recipients) => {
                        mm.sendDynamicEmail(TEMPLATE_ID, ID, supportKey, recipients);
                    });
                }

                /* -------- LOG + NOTIFICATIONS -------- */

                const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your work order cancellation request due to ${data.REMARK}`;
                const logData = {
                    TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Cancellation request ' + status, PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE
                }

                dbm.saveLog(logData, technicianActionLog);

                mm.sendNotificationToChannel(
                    USER_ID,
                    `customer_${CUSTOMER_ID}_channel`,
                    `Cancellation request ${status}`,
                    ACTION_DETAILS,
                    "",
                    "O",
                    supportKey,
                    "N",
                    "O",
                    logData
                );

                mm.sendNotificationToSPOCChannel(
                    USER_ID,
                    ORDER_ID,
                    `Cancellation request ${status}`,
                    `${USER_NAME} has ${status} work order cancellation request.`,
                    "",
                    "O",
                    supportKey,
                    "N",
                    "O",
                    []
                );

                /* -------- COD REFUND EMAIL -------- */

                if (r.PAYMENT_REFUND_STATUS === 'RF') {
                    mm.sendDynamicEmail(13, r.ORDER_DETAILS_ID, supportKey);
                }

                res.status(200).json({
                    code: 200,
                    message: "CancleOrderReason information updated successfully..."
                });

            }
        );

    } catch (error) {

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }
};


exports.getCounts = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;

    try {
        if (IS_FILTER_WRONG == "0") {

            mm.executeQueryData(setContext + ` CALL sp_get_order_cancellation_transactions_counts(); `, [], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderCancellationTransactions information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const dataResult = resultSets[0] || [];

                    res.send({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 61,
                        "data": dataResult
                    });
                }
            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        })
    }

}

exports.RefundStatus = (req, res) => {

    const data = reqData(req);
    const ID = req.body.ID;
    const ORDER_ID = req.body.ORDER_ID;
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    const PAYMENT_REFUND_STATUS = req.body.PAYMENT_REFUND_STATUS;
    const IANA_CODE = req.body.IANA_CODE;

    const USER_ID = req.body.authData.data.UserData[0].USER_ID;
    const USER_NAME = req.body.authData.data.UserData[0].NAME;

    const systemDate = mm.getSystemDate();
    const supportKey = req.headers['supportkey'];

    try {

        mm.executeQueryData(
            `CALL sp_order_cancellation_refundStatus(?,?,?,?,?,?)`,
            [
                ID,
                ORDER_ID,
                CUSTOMER_ID,
                PAYMENT_REFUND_STATUS,
                IANA_CODE,
                USER_ID
            ],
            supportKey,
            (error, result) => {

                if (error) {

                    console.log(error);

                    return res.send({
                        code: 400,
                        message: "Failed to update orderCancellationTransactions information."
                    });

                }

                const r = result[0][0];

                if (r.code !== 200) {
                    return res.send(r);
                }

                /* -------- ACTION LOG -------- */

                const ACTION_DETAILS =
                    `${USER_NAME} has refunded the amount for your work order cancellation request.`;

                const logData = {
                    TECHNICIAN_ID: 0,
                    VENDOR_ID: 0,
                    ORDER_ID: ORDER_ID,
                    JOB_CARD_ID: 0,
                    CUSTOMER_ID: CUSTOMER_ID,
                    LOG_TYPE: 'Order',
                    ACTION_LOG_TYPE: 'User',
                    ACTION_DETAILS: ACTION_DETAILS,
                    USER_ID: USER_ID,
                    TECHNICIAN_NAME: "",
                    ORDER_DATE_TIME: null,
                    CART_ID: 0,
                    EXPECTED_DATE_TIME: null,
                    ORDER_MEDIUM: "",
                    ORDER_STATUS: 'Cancellation request refunded',
                    PAYMENT_MODE: "",
                    PAYMENT_STATUS: "",
                    TOTAL_AMOUNT: "",
                    ORDER_NUMBER: "",
                    TASK_DESCRIPTION: "",
                    ESTIMATED_TIME_IN_MIN: 0,
                    PRIORITY: "",
                    JOB_CARD_STATUS: "",
                    USER_NAME: USER_NAME,
                    DATE_TIME: systemDate,
                    supportKey: 0,
                    IANA_CODE: IANA_CODE
                };

                const logData2 = {
                    ...logData,
                    ORDER_STATUS: 'Work order cancelled successfully'
                };

                dbm.saveLog([logData, logData2], technicianActionLog);

                res.status(200).json({
                    code: 200,
                    message: "CancleOrderReason information updated successfully..."
                });

            }
        );

    } catch (error) {

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }

};

