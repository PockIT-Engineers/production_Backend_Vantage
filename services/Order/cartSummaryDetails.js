const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var cartSummaryDetails = "cart_summary_details";
var viewCartSummaryDetails = "view_" + cartSummaryDetails;
// Conversion Done
function reqData(req) {

    var data = {
        CART_ID: req.body.CART_ID,
        GROSS_AMOUNT: req.body.GROSS_AMOUNT ? req.body.GROSS_AMOUNT : 0,
        TAX_RATE: req.body.TAX_RATE ? req.body.TAX_RATE : 0,
        COUPON_CHARGES: req.body.COUPON_CHARGES ? req.body.COUPON_CHARGES : 0,
        TOTAL_TAX: req.body.TOTAL_TAX ? req.body.TOTAL_TAX : 0,
        SERVICE_CHARGES: req.body.SERVICE_CHARGES ? req.body.SERVICE_CHARGES : 0,
        NET_AMOUNT: req.body.NET_AMOUNT ? req.body.NET_AMOUNT : 0,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [

        body('CART_ID').isInt().optional(), body('GROSS_AMOUNT').isDecimal().optional(), body('TAX_RATE').isDecimal().optional(), body('COUPON_CHARGES').isDecimal().optional(), body('TOTAL_TAX').isDecimal().optional(), body('SERVICE_CHARGES').isDecimal().optional(), body('NET_AMOUNT').isDecimal().optional(), body('ID').optional(),

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

    if (IS_FILTER_WRONG != "0") {
        return res.status(400).send({
            code: 400,
            message: "Invalid filter parameter."
        });
    }
    const safeFilter = (filter || '').replace(/'/g, "\\'");
    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    try {
        mm.executeQueryData(setContext + ` CALL sp_get_cart_summary_details(); `, [], supportKey, (error, results) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                return res.status(400).send({
                    code: 400,
                    message: "Failed to get cartSummaryDetails information."
                });
            }
            const resultSets = results.filter(r => Array.isArray(r));
            const countResult = resultSets[0] || [];
            const dataResult = resultSets[1] || [];
            return res.send({
                code: 200,
                message: "success",
                count: countResult[0] ? countResult[0].cnt : 0,
                data: dataResult
            });

        });
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        return res.status(500).send({
            code: 500,
            message: "something went wrong"
        });
    }
};


exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        return res.status(422).send({
            code: 422,
            message: errors.errors
        });
    }
    try {
        mm.executeQueryData(`CALL sp_create_cart_summary_details(?,?,?,?,?,?,?,?)`, [data.CART_ID, data.GROSS_AMOUNT, data.TAX_RATE, data.COUPON_CHARGES, data.TOTAL_TAX, data.SERVICE_CHARGES, data.NET_AMOUNT, data.CLIENT_ID], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.status(400).send({
                    code: 400,
                    message: "Failed to save cartSummaryDetails information..."
                });
            }
            const resultSets = results.filter(r => Array.isArray(r));
            const insertResult = resultSets[0] || [];
            const insertId = insertResult[0] ? insertResult[0].insertId : 0;
            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new cart summary details.`;
            var logCategory = "cart summary details";
            dbm.saveLog({
                SOURCE_ID: insertId,
                LOG_DATE_TIME: mm.getSystemDate(),
                LOG_TEXT: ACTION_DETAILS,
                CATEGORY: logCategory,
                CLIENT_ID: 1,
                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                supportKey: 0
            }, systemLog);
            return res.send({
                code: 200,
                message: "CartSummaryDetails information saved successfully..."
            });

        });
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        return res.status(500).send({
            code: 500,
            message: "something went wrong"
        });
    }
};


exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();
    if (!errors.isEmpty()) {
        return res.status(422).send({
            code: 422,
            message: errors.errors
        });
    }
    try {
        mm.executeQueryData(`CALL sp_update_cart_summary_details(?,?,?,?,?,?,?,?,?,?)`, [req.body.ID, data.CART_ID, data.GROSS_AMOUNT, data.TAX_RATE, data.COUPON_CHARGES, data.TOTAL_TAX, data.SERVICE_CHARGES, data.NET_AMOUNT, data.CLIENT_ID, systemDate], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.status(400).send({
                    code: 400,
                    message: "Failed to update cartSummaryDetails information."
                });
            }
            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated cart summary details.`;
            var logCategory = "cart items category";
            dbm.saveLog({
                SOURCE_ID: req.body.ID,
                LOG_DATE_TIME: mm.getSystemDate(),
                LOG_TEXT: ACTION_DETAILS,
                CATEGORY: logCategory,
                CLIENT_ID: 1,
                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                supportKey: 0
            }, systemLog);
            return res.send({
                code: 200,
                message: "CartSummaryDetails information updated successfully..."
            });

        });
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        return res.status(500).send({
            code: 500,
            message: "something went wrong"
        });
    }
};