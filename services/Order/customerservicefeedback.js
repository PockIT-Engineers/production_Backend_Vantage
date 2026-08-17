const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var customerServiceFeedback = "customer_service_feedback";
var viewCustomerServiceFeedback = "view_" + customerServiceFeedback;
// Conversion Done

function reqData(req) {

    var data = {
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        SERVICE_ID: req.body.SERVICE_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        RATING: req.body.RATING,
        COMMENTS: req.body.COMMENTS,
        FEEDBACK_DATE_TIME: req.body.FEEDBACK_DATE_TIME,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID').isInt().optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('SERVICE_ID').isInt().optional(),
        body('JOB_CARD_ID').isInt().optional(),
        body('RATING').isInt().optional(),
        body('COMMENTS').optional(),
        body('FEEDBACK_DATE_TIME').optional(),
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
    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }
    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    try {
        if (IS_FILTER_WRONG == "0") {
            const safeFilter = (filter || '').replace(/'/g, "\\'");
            const setContext = `
                SET @v_PAGE_INDEX = ${pageIndex || 0};
                SET @v_PAGE_SIZE = ${pageSize || 0};
                SET @v_SORT_KEY = '${sortKey}';
                SET @v_SORT_VALUE = '${sortValue}';
                SET @v_FILTER = '${safeFilter}';
            `;
            mm.executeQueryData(setContext + ` CALL sp_get_customer_service_feedback(); `, [], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get customerServiceFeedback count.",
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];
                    res.send({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 22,
                        "count": countResult[0] ? countResult[0].cnt : 0,
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
            "code": 500,
            "message": "something went wrong"
        })
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
            mm.executeQueryData(`CALL sp_create_customer_service_feedback(?,?,?,?,?,?,?,?)`, [data.ORDER_ID, data.CUSTOMER_ID, data.SERVICE_ID, data.JOB_CARD_ID, data.RATING, data.COMMENTS, data.FEEDBACK_DATE_TIME, data.CLIENT_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save customerServiceFeedback information..."
                    });
                } else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const insertResult = resultSets[0] || [];
                    const insertId = insertResult[0] ? insertResult[0].insertId : 0;
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has added service feedback.`;
                    var logCategory = "customer service feedback";
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
                        "message": "CustomerServiceFeedback information saved successfully..."
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "something went wrong"
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
            mm.executeQueryData(`CALL sp_update_customer_service_feedback(?,?,?,?,?,?,?,?,?,?)`, [req.body.ID, data.ORDER_ID, data.CUSTOMER_ID, data.SERVICE_ID, data.JOB_CARD_ID, data.RATING, data.COMMENTS, data.FEEDBACK_DATE_TIME, data.CLIENT_ID, systemDate], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update customerServiceFeedback information."
                    });
                } else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of customer service feedback.`;
                    var logCategory = "customer service feedback";
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
                        "message": "CustomerServiceFeedback information updated successfully..."
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "something went wrong"
            });
        }
    }
};

exports.getCustomerServiceFeedback = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            const safeFilter = (filter || '').replace(/'/g, "\\'");
            const setContext = `
                SET @v_PAGE_INDEX = ${pageIndex || 0};
                SET @v_PAGE_SIZE = ${pageSize || 0};
                SET @v_SORT_KEY = '${sortKey}';
                SET @v_SORT_VALUE = '${sortValue}';
                SET @v_FILTER = '${safeFilter}';
            `;
            mm.executeQueryData(setContext + ` CALL sp_get_customer_service_feedback_dashboard(); `, [], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get customerServiceFeedback count."
                    });
                } else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];
                    const progressResult = resultSets[2] || [];
                    const avgResult = resultSets[3] || [];
                    res.send({
                        "code": 200,
                        "message": "success",
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult,
                        "progress": progressResult,
                        "averageRating": avgResult[0] ? avgResult[0].AVG_RATING : 0
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
            "code": 500,
            "message": "something went wrong"
        });
    }
};
