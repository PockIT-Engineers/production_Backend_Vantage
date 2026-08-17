const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
var vendorServiceCostMapping = "vendor_service_cost_mapping";
var viewVendorServiceCostMapping = "view_" + vendorServiceCostMapping;

function reqData(req) {
    var data = {
        VENDOR_ID: req.body.VENDOR_ID,
        SERVICE_ID: req.body.SERVICE_ID,
        COST_TYPE: req.body.COST_TYPE ? '1' : '0',
        EFFECTIVE_DATE: req.body.EFFECTIVE_DATE,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('VENDOR_ID').isInt().optional(),
        body('SERVICE_ID').isInt().optional(),
        body('COST_TYPE').optional(),
        body('EFFECTIVE_DATE').optional(),
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
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_vendorServiceCostMapping_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                             "message": "Failed to get vendorServiceCostMapping information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 134,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.status(400).json({
                "code": 400,
                 "message": "Invalid filter parameter."
            });
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
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
        res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(
                `CALL sp_vendorServiceCostMapping_create(?,?,?,?,?,?)`,
                [
                    data.VENDOR_ID,
                    data.SERVICE_ID,
                    data.COST_TYPE,
                    data.EFFECTIVE_DATE,
                    data.IS_ACTIVE || '1',
                    data.CLIENT_ID || 1
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                             "message": "Failed to save vendorServiceCostMapping information..."
                        });
                    }
                    else {
                        const r = results[0][0];

                        // Save action log
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new vendor service cost mapping.`;
                        var logCategory = "vendor service cost mapping";

                        let actionLog = {
                            "SOURCE_ID": r.ID,
                            "LOG_DATE_TIME": mm.getSystemDate(),
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": logCategory,
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        };

                        dbm.saveLog(actionLog, systemLog);
                        res.status(200).json({
                            "code": 200,
                             "message": "VendorServiceCostMapping information saved successfully...",
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
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
    var ID = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(
                `CALL sp_vendorServiceCostMapping_update(?,?,?,?,?,?,?)`,
                [
                    ID,
                    data.VENDOR_ID,
                    data.SERVICE_ID,
                    data.COST_TYPE,
                    data.EFFECTIVE_DATE,
                    data.IS_ACTIVE,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                             "message": "Failed to update vendorServiceCostMapping information."
                        });
                    }
                    else {
                        // Save action log
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the vendor service cost mapping.`;
                        var logCategory = "vendor service cost mapping";

                        let actionLog = {
                            "SOURCE_ID": ID,
                            "LOG_DATE_TIME": mm.getSystemDate(),
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": logCategory,
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        };

                        dbm.saveLog(actionLog, systemLog);
                        res.status(200).json({
                            "code": 200,
                             "message": "VendorServiceCostMapping information updated successfully..."
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "code": 500,
                 "message": "Something went wrong."
            });
        }
    }
};

exports.addBulk = (req, res) => {
    var VENDOR_ID = req.body.VENDOR_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_vendorServiceCostMapping_bulkUpsert(?,?,?,?,?,?,?)`,
                [
                    VENDOR_ID,
                    roleDetailsItem.SERVICE_ID,
                    roleDetailsItem.COST_TYPE,
                    roleDetailsItem.COST || 0.00,
                    roleDetailsItem.EFFECTIVE_DATE,
                    roleDetailsItem.IS_ACTIVE,
                    CLIENT_ID
                ],
                supportKey,
                connection,
                (error) => {
                    if (error) {
                        console.log("error", error);
                        inner_callback(error);
                    } else {
                        inner_callback(null);
                    }
                }
            );
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "code": 400,
                     "message": "Failed to Insert vendorServiceCostMapping information..."
                });
            } else {
                // Save action log
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped the service cost to the vendor.`;
                var logCategory = "vendor service cost mapping";

                let actionLog = {
                    "SOURCE_ID": VENDOR_ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": 0
                };

                dbm.saveLog(actionLog, systemLog);
                mm.commitConnection(connection);
                res.status(200).json({
                    "code": 200,
                     "message": "New vendorServiceCostMapping Successfully added",
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};