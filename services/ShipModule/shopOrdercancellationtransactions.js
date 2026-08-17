const { connect } = require('../../routes/globalSettings');
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const shopOrderActionLog = require("../../modules/shopOrderActionLog")
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")

var shopOrderCancellationTransactions = "shop_order_cancellation_transactions";
var viewshopOrderCancellationTransactions = "view_" + shopOrderCancellationTransactions;

function reqData(req) {
    var data = {
        REQUESTED_DATE: req.body.REQUESTED_DATE,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        ORDER_ID: req.body.ORDER_ID,
        PAYMENT_ID: req.body.PAYMENT_ID,
        CANCELLED_BY: req.body.CANCELLED_BY,
        CANCEL_DATE: req.body.CANCEL_DATE,
        REASON: req.body.REASON,
        REMARK: req.body.REMARK,
        REFUND_STATUS: req.body.REFUND_STATUS,
        CLIENT_ID: req.body.CLIENT_ID,
        REFUNDED_DATE: req.body.REFUNDED_DATE,
        PAYMENT_REFUND_STATUS: req.body.PAYMENT_REFUND_STATUS,
        CUSTOMER_REMARK: req.body.CUSTOMER_REMARK

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

    var pageIndex = req.query.pageIndex ? req.query.pageIndex : null;
    var pageSize = req.query.pageSize ? req.query.pageSize : null;
    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {

        if (IS_FILTER_WRONG == "0") {

            filter = filter.replace(/'/g, "''");

            const setContext = `
SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
                SET @v_SORT_KEY = '${sortKey}';
                SET @v_SORT_VALUE = '${sortValue}';
                SET @v_FILTER = '${filter}';
            `;

            mm.executeQueryData(
                setContext + ` CALL sp_shopOrderCancellationTransactions_get(); `,
                [],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log("error", error)
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                            code: 400,
                            message: "Failed to get information."
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r) && r.length);

                    const count = resultSets[0]?.[0]?.cnt || 0;
                    const data = resultSets[1] || [];

                    res.status(200).json({
                        "code": 200,
                        message: "success",
                        TAB_ID: 196,
                        count: count,
                        data: data
                    });

                }
            );

        } else {

            res.status(400).json({
                code: 400,
                message: "Invalid filter parameter."
            });

        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};


exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var ORDER_NUMBER = req.body.ORDER_NUMBER;
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            code: 422,
            message: errors.errors
        });
    } else {
        try {
            data.PAYMENT_REFUND_STATUS = 'P';

            mm.executeQueryData(
                `CALL sp_shopOrderCancellationTransactions_create(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.REQUESTED_DATE,
                    data.CUSTOMER_ID,
                    data.ORDER_ID,
                    data.PAYMENT_ID,
                    data.CANCELLED_BY,
                    data.CANCEL_DATE,
                    data.REASON,
                    data.REMARK,
                    data.REFUND_STATUS,
                    data.CLIENT_ID,
                    data.REFUNDED_DATE,
                    data.PAYMENT_REFUND_STATUS,
                    data.CUSTOMER_REMARK
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );
                        res.send({
                            code: 400,
                            message: "Failed to save shopOrderCancellationTransactions information..."
                        });
                    } else {
                        const ACTION_DETAILS =
                            `Customer ${req.body.authData.data.UserData[0].USER_NAME} has requested to cancel the order.`;

                        const logData = {
                            ORDER_ID: data.ORDER_ID,
                            CUSTOMER_ID: data.CUSTOMER_ID,
                            LOG_TYPE: 'order',
                            ACTION_LOG_TYPE: 'Customer',
                            ACTION_DETAILS: ACTION_DETAILS,
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            ORDER_DATE_TIME: null,
                            CART_ID: 0,
                            EXPECTED_DATE_TIME: null,
                            ORDER_MEDIUM: null,
                            ORDER_STATUS: "Requested for order cancellation",
                            TOTAL_AMOUNT: 0,
                            ORDER_NUMBER: ORDER_NUMBER,
                            PAYMENT_MODE: "",
                            PAYMENT_STATUS: "",
                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                            EXPECTED_PREAPARATION_DATETIME: null,
                            EXPECTED_PACKAGING_DATETIME: null,
                            EXPECTED_DISPATCH_DATETIME: null,
                            ACTUAL_PREAPARATION_DATETIME: null,
                            ACTUAL_PACKAGING_DATETIME: null,
                            ACTUAL_DISPATCH_DATETIME: null
                        };

                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,
                            8,
                            `Cancellation request by customer`,
                            ACTION_DETAILS,
                            "",
                            "O",
                            supportKey,
                            "O",
                            req.body
                        );

                        dbm.saveLog(logData, shopOrderActionLog);

                        res.send({
                            code: 200,
                            message: "shopOrderCancellationTransactions information saved successfully..."
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
            res.send({
                code: 500,
                message: "Something Went Wrong."
            });
        }
    }
};


exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            code: 422,
            message: errors.errors
        });
    } else {
        try {
            mm.executeQueryData(
                `CALL sp_shopOrderCancellationTransactions_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    req.body.ID,
                    data.REQUESTED_DATE,
                    data.CUSTOMER_ID,
                    data.ORDER_ID,
                    data.PAYMENT_ID,
                    data.CANCELLED_BY,
                    data.CANCEL_DATE,
                    data.REASON,
                    data.REMARK,
                    data.REFUND_STATUS,
                    data.CLIENT_ID,
                    data.REFUNDED_DATE,
                    data.PAYMENT_REFUND_STATUS,
                    data.CUSTOMER_REMARK
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );
                        console.log(error);
                        res.send({
                            code: 400,
                            message: "Failed to update shopOrderCancellationTransactions information."
                        });
                    } else {
                        var ACTION_DETAILS =
                            `Customer ${req.body.authData.data.UserData[0].NAME} has updated the details of the order cancellation transactions.`;

                        var logCategory = "Order Cancellation Transactions";

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
                            code: 200,
                            message: "shopOrderCancellationTransactions information updated successfully..."
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
            res.send({
                code: 500,
                message: "Something Went Wrong."
            });
        }
    }
};


exports.updateStatus = (req, res) => {

    var data = reqData(req);
    var ID = req.body.ID;
    var ORDER_ID = req.body.ORDER_ID;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var PAYMENT_MODE = req.body.PAYMENT_MODE;
        var orderStatus1 = req.body.ORDER_STATUS;
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];

    try {
        data.CANCELLED_BY = req.body.authData.data.UserData[0].USER_ID;
        var status = ''
        var ORDER_STATUS = ''
        if (data.REFUND_STATUS == "A") {
            status = 'accepted'
            ORDER_STATUS = 'OC'
        } else {
            status = 'rejected'
            ORDER_STATUS = orderStatus1
        }
        const connection = mm.openConnection();

        mm.executeDML(
            `CALL sp_shopOrderCancellationTransactions_updateStatus(?,?,?,?,?,?,?)`,
            [
                ID,
                ORDER_ID,
                CUSTOMER_ID,
                data.REFUND_STATUS,
                data.REMARK,
                PAYMENT_MODE,
                data.CANCELLED_BY
            ],
            supportKey,
            connection,
            (error, results) => {

                if (error) {
                    mm.rollbackConnection(connection);
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.send({
                        code: 400,
                        message: "Failed to update shopOrderCancellationTransactions information."
                    });
                }

                if (data.REFUND_STATUS == 'R') {
                    const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has marked the order cancellation request as ${status} due to ${data.REMARK}`;
                    const logData = { ORDER_ID: ORDER_ID, CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'user', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Order cancel request rejected', TOTAL_AMOUNT: 0, ORDER_NUMBER: data.ORDER_NUMBER, PAYMENT_MODE: PAYMENT_MODE, PAYMENT_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                    dbm.saveLog(logData, shopOrderActionLog);
                    // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Cancellation request ${status}**`, ACTION_DETAILS, "", "O", supportKey, "N", "S", req.body);
                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Cancellation request ${status}`, ACTION_DETAILS, "", "O", supportKey, "N", "S", req.body);
                    mm.commitConnection(connection);
                    res.status(200).json({
                        "code": 200,
                        "message": "CancleOrderReason information updated successfully...",
                    });
                }
                else {
                    if (data.PAYMENT_REFUND_STATUS === 'RF') {
                        const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your order cancellation request.`;
                        const logData = { ORDER_ID: ORDER_ID, CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'user', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Cancellation request ' + status, TOTAL_AMOUNT: "", ORDER_NUMBER: "", PAYMENT_MODE: PAYMENT_MODE, PAYMENT_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                        dbm.saveLog(logData, shopOrderActionLog);
                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Cancellation request ${status}**`, ACTION_DETAILS, "", "O", supportKey, "N", "O", req.body);
                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Cancellation request ${status}`, ACTION_DETAILS, "", "O", supportKey, "N", "O", req.body);
                        mm.commitConnection(connection);
                        res.status(200).json({
                            "code": 200,
                            "message": "CancleOrderReason information updated successfully...",
                        });
                    } else {
                        const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your order cancellation request.`;
                        const logData = {
                            ORDER_ID: ORDER_ID,
                            CUSTOMER_ID: CUSTOMER_ID,
                            DATE_TIME: systemDate,
                            LOG_TYPE: 'order',
                            ACTION_LOG_TYPE: 'user',
                            ACTION_DETAILS: ACTION_DETAILS,
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            ORDER_DATE_TIME: null,
                            CART_ID: 0,
                            EXPECTED_DATE_TIME: null,
                            ORDER_MEDIUM: "",
                            ORDER_STATUS: 'Cancellation request ' + status,
                            TOTAL_AMOUNT: 0,
                            ORDER_NUMBER: "",
                            PAYMENT_MODE: PAYMENT_MODE,
                            PAYMENT_STATUS: "",
                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                            EXPECTED_PREAPARATION_DATETIME: null,
                            EXPECTED_PACKAGING_DATETIME: null,
                            EXPECTED_DISPATCH_DATETIME: null,
                            ACTUAL_PREAPARATION_DATETIME: null,
                            ACTUAL_PACKAGING_DATETIME: null,
                            ACTUAL_DISPATCH_DATETIME: null
                        }
                        dbm.saveLog(logData, shopOrderActionLog);
                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Cancellation request ${status}**`, ACTION_DETAILS, "", "O", supportKey, "N", "S", req.body);
                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Cancellation request ${status}`, ACTION_DETAILS, "", "O", supportKey, "N", "S", req.body);
                        mm.commitConnection(connection);
                        res.status(200).json({
                            "code": 200,
                            "message": "CancleOrderReason information updated successfully...",
                        });
                    }
                }
            }
        );

    } catch (error) {
        console.log(error);
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        res.send({
            code: 500,
            message: "Something Went Wrong."
        });
    }
};


exports.getCounts = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : null;
    var pageSize = req.body.pageSize ? req.body.pageSize : null;
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {

        if (IS_FILTER_WRONG == "0") {

            filter = filter.replace(/'/g, "''");

            const setContext = `
SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
                SET @v_SORT_KEY = '${sortKey}';
                SET @v_SORT_VALUE = '${sortValue}';
                SET @v_FILTER = '${filter}';
            `;

            mm.executeQueryData(
                setContext + ` CALL sp_shopOrderCancellationTransactions_getCounts(); `,
                [],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log("error",error)
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                            code:400,
                            message: "Failed to get app language information."
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r) && r.length);

                    const data = resultSets[0] || [];

                    res.status(200).json({
                        "code": 200,
                        message: "success",
                        TAB_ID: 1,
                        data: data
                    });

                }
            );

        } else {

            res.status(400).json({
                code: 400,
                message: "Invalid filter parameter."
            });

        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};



exports.RefundStatus = (req, res) => {

    var data = reqData(req);
    var ID = req.body.ID;
    var ORDER_ID = req.body.ORDER_ID;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var PAYMENT_REFUND_STATUS = req.body.PAYMENT_REFUND_STATUS;
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];

    try {
        if (PAYMENT_REFUND_STATUS != "RF") {
            return res.send({
                code: 300,
                message: "Wrong Status."
            });
        }

        const connection = mm.openConnection();

        mm.executeDML(
            `CALL sp_shopOrderCancellationTransactions_refundStatus(?, ?)`,
            [ID, systemDate],
            supportKey,
            connection,
            (error, results) => {

                if (error) {
                    mm.rollbackConnection(connection);
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.send({
                        code: 400,
                        message: "Failed to update shopOrderCancellationTransactions information."
                    });
                }

                const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has processed refund for your order cancellation request.`;
                const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'user', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Cancellation request refunded', PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                const logData2 = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'user', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Order canceled successfully', PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                const logaaray = [logData, logData2]
                dbm.saveLog(logaaray, shopOrderActionLog);
                mm.commitConnection(connection);
                res.status(200).json({
                    "code": 200,
                    "message": "CancleOrderReason information updated successfully...",
                });
            }
        );

    } catch (error) {
        console.log(error);
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        res.send({
            code: 500,
            message: "Something Went Wrong."
        });
    }
};