const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var invoicePaymentDetails = "invoice_payment_details";
var viewInvoicePaymentDetails = "view_" + invoicePaymentDetails;
// Conversion Done 
function reqData(req) {

    var data = {
        INVOICE_ID: req.body.INVOICE_ID,
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        PAYMENT_DATE: req.body.PAYMENT_DATE,
        PAYMENT_METHOD: req.body.PAYMENT_METHOD,
        PAYMENT_STATUS: req.body.PAYMENT_STATUS,
        AMOUNT: req.body.AMOUNT ? req.body.AMOUNT : 0,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

function reqDataPyament(req) {

    var data = {
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        VENDOR_ID: req.body.VENDOR_ID,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        MEMBER_FROM: req.body.MEMBER_FROM,
        PAYMENT_FOR: req.body.PAYMENT_FOR,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        TRANSACTION_DATE: req.body.TRANSACTION_DATE,
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        TRANSACTION_STATUS: req.body.TRANSACTION_STATUS,
        TRANSACTION_AMOUNT: req.body.TRANSACTION_AMOUNT,
        PAYLOAD: req.body.PAYLOAD,
        RESPONSE_DATA: req.body.RESPONSE_DATA,
        RESPONSE_CODE: req.body.RESPONSE_CODE,
        MERCHENT_ORDER_ID: req.body.MERCHENT_ORDER_ID,
        MERCHENT_ID: req.body.MERCHENT_ID,
        RESPONSE_MESSAGE: req.body.RESPONSE_MESSAGE,
        CLIENT_ID: req.body.CLIENT_ID,

    }
    return data;
}

exports.validate = function () {
    return [
        body('INVOICE_ID').isInt().optional(),
        body('TRANSACTION_ID').isInt().optional(),
        body('PAYMENT_DATE').optional(),
        body('PAYMENT_METHOD').optional(),
        body('PAYMENT_STATUS').optional(),
        body('AMOUNT').isDecimal().optional(),
        body('PAYMENT_MODE').optional(),
        body('ID').optional(),
    ]
}


exports.getPaymentTransactions = (req, res) => {
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
            mm.executeQueryData(setContext + ` CALL sp_get_payment_gateway_transactions_view(); `, [], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get invoicePaymentDetails information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];
                    res.send({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 43,
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult
                    });
                }
            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        });
    }
}

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
            mm.executeQueryData(`CALL sp_create_invoice_payment_details(?,?,?,?,?,?,?,?)`, [data.INVOICE_ID, data.TRANSACTION_ID, data.PAYMENT_DATE, data.PAYMENT_METHOD, data.PAYMENT_STATUS, data.AMOUNT, data.PAYMENT_MODE, data.CLIENT_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save invoicePaymentDetails information..."
                    });
                }
                else {
                    var insertId = results[0][0].insertId;
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new invoice payment details.`;
                    var logCategory = "invoice payment details";
                    let actionLog = {
                        "SOURCE_ID": insertId,
                        "LOG_DATE_TIME": mm.getSystemDate(),
                        "LOG_TEXT": ACTION_DETAILS,
                        "CATEGORY": logCategory,
                        "CLIENT_ID": 1,
                        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "InvoicePaymentDetails information saved successfully...",
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
    var systemDate = mm.getSystemDate();
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_update_invoice_payment_details(?,?,?,?,?,?,?,?,?,?)`, [req.body.ID, data.INVOICE_ID, data.TRANSACTION_ID, data.PAYMENT_DATE, data.PAYMENT_METHOD, data.PAYMENT_STATUS, data.AMOUNT, data.PAYMENT_MODE, data.CLIENT_ID, systemDate], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update invoicePaymentDetails information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of invoice payment details.`;
                    var logCategory = "invoice payment details";
                    let actionLog = {
                        "SOURCE_ID": req.body.ID,
                        "LOG_DATE_TIME": mm.getSystemDate(),
                        "LOG_TEXT": ACTION_DETAILS,
                        "CATEGORY": logCategory,
                        "CLIENT_ID": 1,
                        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "InvoicePaymentDetails information updated successfully...",
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
            mm.executeQueryData(setContext + ` CALL sp_get_payment_gateway_transactions(); `, [], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get invoicePaymentDetails information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];
                    res.send({
                        "code": 200,
                        "message": "success",
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult
                    });
                }
            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        });
    }
}

exports.addPaymentTransactions = (req, res) => {
    let PAYMENT_TYPE = req.body.PAYMENT_TYPE;
    let PAYMENT_FOR = req.body.PAYMENT_FOR;
    let JOB_CARD_NO = req.body.JOB_CARD_NO
    var data = reqDataPyament(req);
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
            data.PAYLOAD = JSON.stringify(req.body.PAYLOAD);
            data.RESPONSE_DATA = JSON.stringify(req.body.RESPONSE_DATA);
            if (PAYMENT_FOR == "P") {
                mm.executeQueryData(`CALL sp_addPaymentTransactions(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [PAYMENT_FOR, data.ORDER_ID, data.CUSTOMER_ID, data.JOB_CARD_ID, data.TECHNICIAN_ID, data.VENDOR_ID,
                        data.MOBILE_NUMBER, data.MEMBER_FROM, data.PAYMENT_MODE, data.TRANSACTION_DATE, data.TRANSACTION_ID,
                        data.TRANSACTION_STATUS, data.TRANSACTION_AMOUNT, data.PAYLOAD, data.RESPONSE_DATA, data.RESPONSE_CODE,
                        data.MERCHENT_ORDER_ID, data.MERCHENT_ID, data.RESPONSE_MESSAGE, data.CLIENT_ID
                    ], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to save invoicePaymentDetails information..."
                            });
                        }
                        else {
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new invoice payment.`;
                            var logCategory = "invoice payment details";
                            let actionLog = {
                                "SOURCE_ID": results[0][0].insertId,
                                "LOG_DATE_TIME": mm.getSystemDate(),
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                "supportKey": 0
                            }
                            mm.sendNotificationToTechnician(
                                data.TECHNICIAN_ID,
                                data.CUSTOMER_ID,
                                `Part(s) Payment`,
                                `A payment of Rs. ${data.TRANSACTION_AMOUNT} has been completed for parts related to job ${JOB_CARD_NO}`,
                                "",
                                "J",
                                supportKey,
                                "N",
                                "J",
                                req.body
                            );
                            dbm.saveLog(actionLog, systemLog)
                            res.send({
                                "code": 200,
                                "message": "InvoicePaymentDetails information saved successfully...",
                            });
                        }
                    });
            }
            else if (PAYMENT_FOR == "O") {
                mm.executeQueryData(`CALL sp_addPaymentTransactions(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [PAYMENT_FOR, data.ORDER_ID, data.CUSTOMER_ID, data.JOB_CARD_ID, data.TECHNICIAN_ID, data.VENDOR_ID, data.MOBILE_NUMBER, data.MEMBER_FROM, data.PAYMENT_MODE, data.TRANSACTION_DATE, data.TRANSACTION_ID, data.TRANSACTION_STATUS, data.TRANSACTION_AMOUNT, data.PAYLOAD, data.RESPONSE_DATA, data.RESPONSE_CODE, data.MERCHENT_ORDER_ID, data.MERCHENT_ID, data.RESPONSE_MESSAGE, data.CLIENT_ID], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save invoicePaymentDetails information..."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "InvoicePaymentDetails information saved successfully...",
                        });
                    }
                });
            }
            else if (PAYMENT_FOR == "S") {
                mm.executeQueryData(`CALL sp_addPaymentTransactions(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [PAYMENT_FOR, data.ORDER_ID, data.CUSTOMER_ID, data.JOB_CARD_ID, data.TECHNICIAN_ID, data.VENDOR_ID, data.MOBILE_NUMBER, data.MEMBER_FROM, data.PAYMENT_MODE, data.TRANSACTION_DATE, data.TRANSACTION_ID, data.TRANSACTION_STATUS, data.TRANSACTION_AMOUNT, data.PAYLOAD, data.RESPONSE_DATA, data.RESPONSE_CODE, data.MERCHENT_ORDER_ID, data.MERCHENT_ID, data.RESPONSE_MESSAGE, data.CLIENT_ID], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save invoicePaymentDetails information..."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "InvoicePaymentDetails information saved successfully...",
                        });
                    }
                });
            }
            else if (PAYMENT_FOR == "J") {
                mm.executeQueryData(`CALL sp_addPaymentTransactions(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [PAYMENT_FOR, data.ORDER_ID, data.CUSTOMER_ID, data.JOB_CARD_ID, data.TECHNICIAN_ID, data.VENDOR_ID, data.MOBILE_NUMBER, data.MEMBER_FROM, data.PAYMENT_MODE, data.TRANSACTION_DATE, data.TRANSACTION_ID, data.TRANSACTION_STATUS, data.TRANSACTION_AMOUNT, data.PAYLOAD, data.RESPONSE_DATA, data.RESPONSE_CODE, data.MERCHENT_ORDER_ID, data.MERCHENT_ID, data.RESPONSE_MESSAGE, data.CLIENT_ID], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save invoicePaymentDetails information..."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new invoice payment.`;
                        var logCategory = "invoice payment details";
                        let actionLog = {
                            "SOURCE_ID": results[0][0].insertId,
                            "LOG_DATE_TIME": mm.getSystemDate(),
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": logCategory,
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        }
                        mm.sendNotificationToTechnician(
                            data.TECHNICIAN_ID,
                            data.CUSTOMER_ID,
                            `Payment Done for job ${JOB_CARD_NO}`,
                            `the Payment of job ${data.TRANSACTION_AMOUNT} is done for ${JOB_CARD_NO}`,
                            "",
                            "J",
                            supportKey,
                            "N",
                            "J",
                            req.body
                        );
                        dbm.saveLog(actionLog, systemLog)
                        res.send({
                            "code": 200,
                            "message": "InvoicePaymentDetails information saved successfully...",
                        });
                    }
                });
            }
            else {
                res.send({
                    "code": 400,
                    "message": "Invalid Payment For."
                });
            }
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