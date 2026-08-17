const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var orderRefundTransactions = "order_refund_transactions";
var viewOrderRefundTransactions = "view_" + orderRefundTransactions;
// Conversion Done  
function reqData(req) {
    var data = {
        ORDER_CANCELLATION_ID: req.body.ORDER_CANCELLATION_ID,
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        PAYMENT_ID: req.body.PAYMENT_ID,
        ORDER_ID: req.body.ORDER_ID,
        PAID_AMOUNT: req.body.PAID_AMOUNT ? req.body.PAID_AMOUNT : 0,
        REFUND_AMOUNT: req.body.REFUND_AMOUNT ? req.body.REFUND_AMOUNT : 0,
        REFUND_DATE_TIME: req.body.REFUND_DATE_TIME,
        REFUND_PAYMENT_STATUS: req.body.REFUND_PAYMENT_STATUS,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_CANCELLATION_ID').isInt().optional(),
        body('TRANSACTION_ID').isInt().optional(),
        body('PAYMENT_ID').isInt().optional(),
        body('ORDER_ID').isInt().optional(),
        body('PAID_AMOUNT').isDecimal().optional(),
        body('REFUND_AMOUNT').isDecimal().optional(),
        body('REFUND_DATE_TIME').optional(),
        body('REFUND_PAYMENT_STATUS').optional(),
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
            setContext + 'CALL sp_orderRefundTransaction_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get warehouse data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 136,
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
            const params = [
                data.ORDER_CANCELLATION_ID,
                data.TRANSACTION_ID,
                data.PAYMENT_ID,
                data.ORDER_ID,
                data.PAID_AMOUNT || 0,
                data.REFUND_AMOUNT || 0,
                data.REFUND_DATE_TIME,
                data.REFUND_PAYMENT_STATUS,
                data.CLIENT_ID
            ];

            mm.executeQueryData("CALL sp_orderRefundTransaction_create(?, ?, ?, ?, ?, ?, ?, ?, ?)", params, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderRefundTransactions information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new order refund transactions.`;


                    var logCategory = "order refund transaction";

                    let actionLog = {
                        "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "OrderRefundTransactions information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
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
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            const params = [
                req.body.ID,
                data.ORDER_CANCELLATION_ID || null,
                data.TRANSACTION_ID || null,
                data.PAYMENT_ID || null,
                data.ORDER_ID || null,
                data.PAID_AMOUNT || null,
                data.REFUND_AMOUNT || null,
                data.REFUND_DATE_TIME || null,
                data.REFUND_PAYMENT_STATUS || null,
                data.CLIENT_ID || null
            ];
            mm.executeQueryData("CALL sp_orderRefundTransaction_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", params, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update orderRefundTransactions information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of order refund transactions.`;

                    var logCategory = "order refund transaction";

                    let actionLog = {
                        "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "OrderRefundTransactions information updated successfully...",
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