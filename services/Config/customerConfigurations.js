const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var customerConfigurations = "customer_configurations";
var viewCustomerConfigurations = "view_" + customerConfigurations;

function reqData(req) {
    var data = {
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        CUSTOMER_CATEGORY: req.body.CUSTOMER_CATEGORY,
        DEFAULT_LANGUAGE: req.body.DEFAULT_LANGUAGE,
        TIMEZONE: req.body.TIMEZONE,
        NOTIFICATION_PREFERENCES: req.body.NOTIFICATION_PREFERENCES,
        ENABLE_PUSH_NOTIFICATIONS: req.body.ENABLE_PUSH_NOTIFICATIONS ? '1' : '0',
        ENABLE_SMS_NOTIFICATIONS: req.body.ENABLE_SMS_NOTIFICATIONS ? '1' : '0',
        ENABLE_EMAIL_NOTIFICATIONS: req.body.ENABLE_EMAIL_NOTIFICATIONS ? '1' : '0',
        PREFERRED_CONTACT_METHOD: req.body.PREFERRED_CONTACT_METHOD,
        DEFAULT_PAYMENT_METHOD: req.body.DEFAULT_PAYMENT_METHOD,
        SUPPORT_ACCESS_LEVEL: req.body.SUPPORT_ACCESS_LEVEL,
        SERVICE_HISTORY_ACCESS: req.body.SERVICE_HISTORY_ACCESS ? '1' : '0',
        ACCOUNT_STATUS: req.body.ACCOUNT_STATUS,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_TYPE').optional(),
        body('CUSTOMER_CATEGORY').optional(),
        body('DEFAULT_LANGUAGE').optional(),
        body('TIMEZONE').optional(),
        body('NOTIFICATION_PREFERENCES').optional(),
        body('PREFERRED_CONTACT_METHOD').isInt().optional(),
        body('DEFAULT_PAYMENT_METHOD').isInt().optional(),
        body('SUPPORT_ACCESS_LEVEL').optional(),
        body('ACCOUNT_STATUS').optional(),
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
        return res.send({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_customerConfigurations_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400, "message": 'Failed to get customerConfigurations data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 19,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500, "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const data = reqData(req);

    if (!errors.isEmpty()) {
        return res.send({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerConfigurations_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.CUSTOMER_TYPE,
                data.CUSTOMER_CATEGORY,
                data.DEFAULT_LANGUAGE,
                data.TIMEZONE,
                data.NOTIFICATION_PREFERENCES,
                data.ENABLE_PUSH_NOTIFICATIONS,
                data.ENABLE_SMS_NOTIFICATIONS,
                data.ENABLE_EMAIL_NOTIFICATIONS,
                data.PREFERRED_CONTACT_METHOD,
                data.DEFAULT_PAYMENT_METHOD,
                data.SUPPORT_ACCESS_LEVEL,
                data.SERVICE_HISTORY_ACCESS,
                data.ACCOUNT_STATUS,
                data.CLIENT_ID
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400, "message": "Failed to save customer configurations information" });
                }
                res.send({ "code": 200, "message": "Customer configurations information saved successfully" });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500, "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!req.body.ID) {
        return res.send({ "code": 400, "message": "ID is required" });
    }

    if (!errors.isEmpty()) {
        return res.send({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerConfigurations_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                req.body.CUSTOMER_TYPE || null,
                req.body.CUSTOMER_CATEGORY || null,
                req.body.DEFAULT_LANGUAGE || null,
                req.body.TIMEZONE || null,
                req.body.NOTIFICATION_PREFERENCES || null,
                req.body.ENABLE_PUSH_NOTIFICATIONS ?? null,
                req.body.ENABLE_SMS_NOTIFICATIONS ?? null,
                req.body.ENABLE_EMAIL_NOTIFICATIONS ?? null,
                req.body.PREFERRED_CONTACT_METHOD || null,
                req.body.DEFAULT_PAYMENT_METHOD || null,
                req.body.SUPPORT_ACCESS_LEVEL || null,
                req.body.SERVICE_HISTORY_ACCESS ?? null,
                req.body.ACCOUNT_STATUS || null,
                req.body.CLIENT_ID || null
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400, "message": "Failed to update customer configurations information" });
                }
                res.send({ "code": 200, "message": "Customer configurations information updated successfully" });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500, "message": "Something went wrong." });
    }
};
