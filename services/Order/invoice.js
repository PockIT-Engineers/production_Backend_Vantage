const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var invoiceMaster = "invoice_master";
var viewInvoiceMaster = "view_" + invoiceMaster;

// Conversion Done 
function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        BILLING_ADDRESS_ID: req.body.BILLING_ADDRESS_ID,
        INVOICE_DATE: req.body.INVOICE_DATE,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        TAX_RATE: req.body.TAX_RATE ? req.body.TAX_RATE : 0,
        TAX_AMOUNT: req.body.TAX_AMOUNT ? req.body.TAX_AMOUNT : 0,
        DISCOUNT_AMOUNT: req.body.DISCOUNT_AMOUNT ? req.body.DISCOUNT_AMOUNT : 0,
        FINAL_AMOUNT: req.body.FINAL_AMOUNT ? req.body.FINAL_AMOUNT : 0,
        PAYMENT_STATUS: req.body.PAYMENT_STATUS ? '1' : '0',

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}


exports.validate = function () {
    return [

        body('CUSTOMER_ID').isInt().optional(),
        body('BILLING_ADDRESS_ID').isInt().optional(),
        body('INVOICE_DATE').optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('TAX_RATE').isDecimal().optional(),
        body('TAX_AMOUNT').isDecimal().optional(),
        body('DISCOUNT_AMOUNT').isDecimal().optional(),
        body('FINAL_AMOUNT').isDecimal().optional(),
        body('PAYMENT_STATUS').optional(),
        body('ID').optional(),


    ]
}


exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const {
        pageIndex = '',
        pageSize = '',
        sortKey = 'ID',
        sortValue = 'DESC',
        filter = ''
    } = req.body;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    if (IS_FILTER_WRONG !== "0") {
        return res.send({
            code: 400,
            message: "Invalid filter parameter."
        });
    }
    const safeFilter = filter.replace(/'/g, "\\'");
    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    try {
        mm.executeQueryData(setContext + ` CALL spGetInvoiceList(); `, [], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.send({
                    code: 400,
                    message: "Failed to get invoice information."
                });
            }
            const resultSets = results.filter(r => Array.isArray(r));
            const countResult = resultSets[0] || [];
            const dataResult = resultSets[1] || [];
            return res.send({
                code: 200,
                message: "success",
                TAB_ID: 42,
                count: countResult[0]?.cnt || 0,
                data: dataResult
            });
        });
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        return res.send({
            code: 500,
            message: "Something went wrong."
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
    } else {
        try {
            mm.executeQueryData(`CALL sp_create_invoice(?,?,?,?,?,?,?,?,?,?)`, [data.CUSTOMER_ID, data.BILLING_ADDRESS_ID, data.INVOICE_DATE, data.TOTAL_AMOUNT, data.TAX_RATE, data.TAX_AMOUNT, data.DISCOUNT_AMOUNT, data.FINAL_AMOUNT, data.PAYMENT_STATUS, data.CLIENT_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save invoice information..."
                    });
                } else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const insertResult = resultSets[0] || [];
                    const insertId = insertResult[0] ? insertResult[0].insertId : 0;
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has generated new invoice.`;
                    var logCategory = "invoice";
                    let actionLog = {
                        "SOURCE_ID": insertId,
                        "LOG_DATE_TIME": mm.getSystemDate(),
                        "LOG_TEXT": ACTION_DETAILS,
                        "CATEGORY": logCategory,
                        "CLIENT_ID": 1,
                        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "supportKey": 0
                    };
                    dbm.saveLog(actionLog, systemLog);
                    res.send({
                        "code": 200,
                        "message": "Invoice information saved successfully..."
                    });
                }
            });
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
    } else {
        try {
            mm.executeQueryData(`CALL sp_update_invoice(?,?,?,?,?,?,?,?,?,?,?,?)`, [req.body.ID, data.CUSTOMER_ID, data.BILLING_ADDRESS_ID, data.INVOICE_DATE, data.TOTAL_AMOUNT, data.TAX_RATE, data.TAX_AMOUNT, data.DISCOUNT_AMOUNT, data.FINAL_AMOUNT, data.PAYMENT_STATUS, data.CLIENT_ID, systemDate], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update invoice information."
                    });
                } else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of the invoice.`;
                    var logCategory = "invoice";
                    let actionLog = {
                        "SOURCE_ID": req.body.ID,
                        "LOG_DATE_TIME": mm.getSystemDate(),
                        "LOG_TEXT": ACTION_DETAILS,
                        "CATEGORY": logCategory,
                        "CLIENT_ID": 1,
                        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "supportKey": 0
                    };
                    dbm.saveLog(actionLog, systemLog);
                    res.send({
                        "code": 200,
                        "message": "Invoice information updated successfully..."
                    });
                }
            });
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


exports.getInvoiceLogs = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var supportKey = req.headers['supportkey'];
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    if (IS_FILTER_WRONG !== "0") {
        return res.send({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }
    try {

        const safeFilter = (filter || '').replace(/'/g, "\\'");
        const setContext = `
            SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
            SET @v_SORT_KEY = '${sortKey}';
            SET @v_SORT_VALUE = '${sortValue}';
            SET @v_FILTER = '${safeFilter}';
        `;
        mm.executeQueryData(setContext + ` CALL sp_get_invoice_logs(); `, [], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get invoice count."
                });
            } else {
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
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to get invoice information."
        });
    }
};