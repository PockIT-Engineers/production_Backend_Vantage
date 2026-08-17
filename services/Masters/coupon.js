const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
var couponMaster = "coupon_master";
var viewCouponMaster = "view_" + couponMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        START_DATE: req.body.START_DATE,
        EXPIRY_DATE: req.body.EXPIRY_DATE,
        STATUS: req.body.STATUS ? '1' : '0',
        MAX_USES_COUNT: req.body.MAX_USES_COUNT,
        COUPON_CODE: req.body.COUPON_CODE,
        COUPON_VALUE: req.body.COUPON_VALUE,
        PERUSER_MAX_COUNT: req.body.PERUSER_MAX_COUNT,
        COUPON_VALUE_TYPE: req.body.COUPON_VALUE_TYPE,
        COUPON_MAX_VALUE: req.body.COUPON_MAX_VALUE,
        MIN_CART_AMOUNT: req.body.MIN_CART_AMOUNT,
        MAX_CART_AMOUNT: req.body.MAX_CART_AMOUNT,
        CLIENT_ID: req.body.CLIENT_ID,
        COUPON_TYPE_ID: req.body.COUPON_TYPE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        COUPON_FOR: req.body.COUPON_FOR,
        IS_PUBLIC: req.body.IS_PUBLIC ? '1' : '0',
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('COUPON_VALUE_TYPE').optional(),
        body('COUPON_VALUE').isDecimal().optional(),
        body('MAX_USES_COUNT').isInt().optional(),
        body('MIN_CART_AMOUNT').isDecimal().optional(),
        body('MAX_CART_AMOUNT').isDecimal().optional(),
        body('COUPON_MAX_VALUE').isDecimal().optional(),
        body('START_DATE').optional(), body('EXPIRY_DATE').optional(),
        body('PERUSER_MAX_COUNT').isInt().optional(),
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

            mm.executeQueryData(
                setContext + ` CALL sp_couponMaster_Get(); `,
                [],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get coupon information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        res.send({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 13,
                            "count": countResult[0].cnt,
                            "data": dataResult
                        });
                    }
                }
            );

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
            "message": "Something went wrong."
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

            mm.executeQueryData(
                'CALL sp_couponMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [
                    data.NAME,
                    data.DESCRIPTION,
                    data.START_DATE,
                    data.EXPIRY_DATE,
                    data.STATUS,
                    data.MAX_USES_COUNT,
                    data.COUPON_CODE,
                    data.COUPON_VALUE,
                    data.PERUSER_MAX_COUNT,
                    data.COUPON_VALUE_TYPE,
                    data.COUPON_MAX_VALUE,
                    data.MIN_CART_AMOUNT,
                    data.MAX_CART_AMOUNT,
                    data.CLIENT_ID,
                    data.COUPON_TYPE_ID,
                    data.COUNTRY_ID,
                    data.COUPON_FOR,
                    data.IS_PUBLIC
                ],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save coupon information..."
                        });
                    }
                    else {

                        var insertId = results && results[0] && results[0][0] ? results[0][0].insertId : 0;

                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new coupon ${data.NAME}.`;
                        var logCategory = "coupon"

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
                            "message": "Coupon information saved successfully...",
                        });
                    }
                }
            );

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

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {

            mm.executeQueryData(
                'CALL sp_couponMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [
                    criteria.ID,
                    data.NAME,
                    data.DESCRIPTION,
                    data.START_DATE,
                    data.EXPIRY_DATE,
                    data.STATUS,
                    data.MAX_USES_COUNT,
                    data.COUPON_CODE,
                    data.COUPON_VALUE,
                    data.PERUSER_MAX_COUNT,
                    data.COUPON_VALUE_TYPE,
                    data.COUPON_MAX_VALUE,
                    data.MIN_CART_AMOUNT,
                    data.MAX_CART_AMOUNT,
                    data.CLIENT_ID,
                    data.COUPON_TYPE_ID,
                    data.COUNTRY_ID,
                    data.COUPON_FOR,
                    data.IS_PUBLIC,
                    systemDate
                ],
                supportKey,
                (error, results) => {

                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update coupon information."
                        });
                    }
                    else {

                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the coupon ${data.NAME}.`;
                        var logCategory = "coupon"

                        let actionLog = {
                            "SOURCE_ID": criteria.ID,
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
                            "message": "Coupon information updated successfully...",
                        });
                    }
                }
            );

        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}



exports.addServices = (req, res) => {
    var supportKey = req.headers['supportkey']
    const COUPON_ID = req.body.COUPON_ID;
    var data = req.body.SERVICE_DATA;

    try {

        if (COUPON_ID && data) {

            async.eachSeries(data, function (item, callback) {

                mm.executeQueryData(
                    `CALL sp_couponMaster_addServices(?,?,?,?,?,?,?,?)`,
                    [
                        COUPON_ID,
                        item.SERVICE_ID,
                        item.COUNTRY_ID,
                        item.STATUS,
                        item.CLIENT_ID,
                        item.CATEGORY_ID,
                        item.SUB_CATEGORY_ID,
                        item.SERVICE_CATELOG_ID
                    ],
                    supportKey,
                    (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to add services to coupon."
                            });
                        }
                        else {
                            callback();
                        }
                    }
                );

            }, function (err) {

                if (err) {
                    console.log(err);
                    res.send({
                        "code": 400,
                        "message": "Failed to add services to coupon."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Services added to coupon successfully...",
                    });
                }
            });

        }
        else {
            res.send({
                "code": 400,
                "message": "Invalid parameters."
            });

        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}


exports.getServices = (req, res) => {
    var COUPON_ID = req.body.COUPON_ID;
    var CATEGORY_ID = req.body.CATEGORY_ID;
    var SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID;
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : null;
    var pageSize = req.body.pageSize ? req.body.pageSize : null;
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    var SERVICE_TYPE = req.body.SERVICE_TYPE ? req.body.SERVICE_TYPE : null;
    try {
        if (IS_FILTER_WRONG == "0") {
            if (CATEGORY_ID && SUB_CATEGORY_ID && COUPON_ID) {

                let categoryIds = Array.isArray(CATEGORY_ID) ? CATEGORY_ID.join(',') : CATEGORY_ID;
                let subCategoryIds = Array.isArray(SUB_CATEGORY_ID) ? SUB_CATEGORY_ID.join(',') : SUB_CATEGORY_ID;

                mm.executeQueryData(`CALL sp_couponMaster_getServices(?,?,?,?,?,?,?,?,?)`, [COUPON_ID, categoryIds, subCategoryIds, SERVICE_TYPE, pageIndex, pageSize, sortKey, sortValue, filter], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            code: 400,
                            message: "Failed to get services for coupon."
                        });
                    }
                    else {
                        res.send({
                            code: 200,
                            message: "success",
                            data: results[0]
                        });
                    }
                });
            }
            else {
                res.send({
                    code: 400,
                    message: "Invalid parameters."
                });
            }
        }
        else {
            res.send({
                code: 400,
                message: "Invalid Filter."
            });
        }
    }
    catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong."
        });
    }
}

exports.addInventory = (req, res) => {
    var supportKey = req.headers['supportkey'];
    const COUPON_ID = req.body.COUPON_ID;
    var data = req.body.INVENTORY_DATA;
    try {
        if (COUPON_ID && data) {
            async.eachSeries(data, function (item, callback) {
                mm.executeQueryData(
                    'CALL sp_couponMaster_addInventory(?, ?, ?, ?, ?, ?, ?)',
                    [COUPON_ID, item.INVENTORY_ID, item.COUNTRY_ID, item.STATUS, item.CLIENT_ID, item.INVENTORY_CATEGORY_ID, item.INVENTORY_SUB_CATEGORY_ID],
                    supportKey,
                    (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.status(400).json({
                                "message": "Failed to add services to coupon."
                            });
                        } else {
                            callback();
                        }
                    }
                );
            }, function (err) {
                if (err) {
                    console.log(err);
                    res.status(400).json({
                        "message": "Failed to add services to coupon."
                    });
                } else {
                    res.status(200).json({
                        "message": "Services added to coupon successfully...",
                    });
                }
            });
        } else {
            res.status(400).json({
                "message": "Invalid parameters."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}
exports.getInventory = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var COUPON_ID = req.body.COUPON_ID;
    var CATEGORY_ID = req.body.CATEGORY_ID;
    var SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID;

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : null;
    var pageSize = req.body.pageSize ? req.body.pageSize : null;
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            if (CATEGORY_ID && SUB_CATEGORY_ID && COUPON_ID) {
                mm.executeQueryData(
                    `CALL sp_couponMaster_getInventory(?, ?, ?, ?, ?, ?, ?, ?)`,
                    [COUPON_ID, CATEGORY_ID, SUB_CATEGORY_ID, pageIndex, pageSize, sortKey, sortValue, filter],
                    supportKey,
                    (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get services for coupon."
                            });
                        } else {
                            res.status(200).json({
                                "message": "success",
                                "data": results[0]
                            });
                        }
                    }
                );
            } else {
                res.status(400).json({
                    "message": "Invalid parameters."
                });
            }
        } else {
            res.send({
                "code": 400,
                "message": "Invalid Filtter."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}


exports.addTerritories = (req, res) => {
    var supportKey = req.headers['supportkey'];
    const COUPON_ID = req.body.COUPON_ID;
    var data = req.body.TERRITORY_DATA;

    try {
        if (COUPON_ID && data) {
            async.eachSeries(data, function (item, callback) {
                mm.executeQueryData(
                    'CALL sp_couponMaster_addTerritory(?, ?, ?, ?, ?, ?)',
                    [COUPON_ID, item.TERRITORY_ID, item.SERVICE_ID, item.COUNTRY_ID, item.STATUS, item.CLIENT_ID],
                    supportKey,
                    (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to add services to coupon."
                            });
                        } else {
                            callback();
                        }
                    }
                );
            }, function (err) {
                if (err) {
                    console.log(err);
                    res.send({
                        "code": 400,
                        "message": "Failed to add territories to coupon."
                    });
                } else {
                    res.send({
                        "code": 200,
                        "message": "territories added to coupon successfully...",
                    });
                }
            });
        } else {
            res.send({
                "code": 400,
                "message": "Invalid parameters."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.getTerritories = (req, res) => {
    var COUPON_ID = req.body.COUPON_ID;
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : null;
    var pageSize = req.body.pageSize ? req.body.pageSize : null;
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            if (COUPON_ID) {
                mm.executeQueryData(
                    `CALL sp_couponMaster_getTerritories(?, ?, ?, ?, ?, ?)`,
                    [COUPON_ID, pageIndex, pageSize, sortKey, sortValue, filter],
                    supportKey,
                    (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get territories for coupon."
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "data": results[0]
                            });
                        }
                    }
                );
            } else {
                res.send({
                    "code": 400,
                    "message": "Invalid parameters."
                });
            }
        } else {
            res.send({
                "code": 400,
                "message": "Invalid Filter."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}