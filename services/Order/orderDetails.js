const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var orderDetails = "order_details";
var viewOrderDetails = "view_" + orderDetails;
// Conversion Done 

function reqData(req) {
    var data = {
        ORDER_ID: req.body.ORDER_ID,
        SERVICE_CATALOGUE_ID: req.body.SERVICE_CATALOGUE_ID,
        SERVICE_ITEM_ID: req.body.SERVICE_ITEM_ID,
        CATEGORY_ID: req.body.CATEGORY_ID,
        SUB_CATEGORY_ID: req.body.SUB_CATEGORY_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        QUANTITY: req.body.QUANTITY,
        RATE: req.body.RATE ? req.body.RATE : 0,
        UNIT_ID: req.body.UNIT_ID,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID').isInt().optional(),
        body('SERVICE_CATALOGUE_ID').isInt().optional(),
        body('SERVICE_ITEM_ID').isInt().optional(),
        body('JOB_CARD_ID').isInt().optional(),
        body('QUANTITY').isInt().optional(),
        body('RATE').isDecimal().optional(),
        body('UNIT_ID').isInt().optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
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
            mm.executeQueryData(setContext + ` CALL sp_get_order_details(); `, [], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderDetails information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];

                    res.send({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 65,
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult
                    });
                }
            });
        }
        else {
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
            mm.executeQueryData(`CALL sp_create_order_details(?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.ORDER_ID,
                    data.SERVICE_CATALOGUE_ID,
                    data.SERVICE_ITEM_ID,
                    data.CATEGORY_ID,
                    data.SUB_CATEGORY_ID,
                    data.JOB_CARD_ID,
                    data.QUANTITY,
                    data.RATE,
                    data.UNIT_ID,
                    data.TOTAL_AMOUNT,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save orderDetails information..."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "OrderDetails information saved successfully...",
                        });
                    }
                });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 500,
                "message": "Something went wrong."
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
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_update_order_details(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    criteria.ID,
                    data.ORDER_ID,
                    data.SERVICE_CATALOGUE_ID,
                    data.SERVICE_ITEM_ID,
                    data.CATEGORY_ID,
                    data.SUB_CATEGORY_ID,
                    data.JOB_CARD_ID,
                    data.QUANTITY,
                    data.RATE,
                    data.UNIT_ID,
                    data.TOTAL_AMOUNT,
                    data.CLIENT_ID,
                    systemDate
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update orderDetails information."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated order details.`;

                        return res.send({
                            code: 200,
                            message: "OrderDetails  information updated and logged successfully."
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



exports.getOrderDetails = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    // ORDER_ID is optional. Omit it to get every ticket of the customer, pass it to scope
    // the result down to a single order.
    var ORDER_ID = req.body.ORDER_ID ? req.body.ORDER_ID : null
    var CUSTOMER_ID = req.body.CUSTOMER_ID
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
        if (!CUSTOMER_ID) {
            res.send({
                code: 400,
                message: "CUSTOMER_ID is required."
            })
            return;
        }
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(setContext + ` CALL sp_get_customer_order_details(?, ?); `, [ORDER_ID, CUSTOMER_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderDetails information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];

                    res.send({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 65,
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult,
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
