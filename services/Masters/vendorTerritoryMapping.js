const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const channelSubscribedUsers = require("../../modules/channelSubscribedUsers");
var vendorTerritoryMapping = "vendor_territory_mapping";
var viewvendorTerritoryMapping = "view_" + vendorTerritoryMapping;


function reqData(req) {

    var data = {
        VENDOR_ID: req.body.VENDOR_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        TERITORY_ID: req.body.TERITORY_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}


exports.validate = function () {
    return [
        body('VENDOR_ID').isInt().optional(),
        body('TERITORY_ID').isInt().optional(),
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
                setContext + `CALL sp_vendorTerritoryMapping_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                             "message": "Failed to get vendorTerritoryMapping information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 145,
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
                `CALL sp_vendorTerritoryMapping_create(?,?,?,?)`,
                [
                    data.VENDOR_ID,
                    data.TERITORY_ID,
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
                             "message": "Failed to save vendorTerritoryMapping information..."
                        });
                    }
                    else {
                        const r = results[0][0];

                        // Save action log
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped territories to vendor`;
                        var logCategory = "vendor territory mapping";

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
                             "message": "VendorTerritoryMapping information saved successfully...",
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
                `CALL sp_vendorTerritoryMapping_update(?,?,?,?,?)`,
                [
                    ID,
                    data.VENDOR_ID,
                    data.TERITORY_ID,
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
                             "message": "Failed to update vendorTerritoryMapping information."
                        });
                    }
                    else {
                        // Save action log
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped territories to vendor.`;
                        var logCategory = "vendor territory mapping";

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
                             "message": "VendorTerritoryMapping information updated successfully."
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

exports.mapTerritorytoVendor = (req, res) => {
    var VENDOR_ID = req.body.VENDOR_ID;
    var USER_ID = req.body.USER_ID;
    var VENDOR_NAME = req.body.VENDOR_NAME;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    if (!VENDOR_ID) {
        return res.status(400).json({
            "code": 400,
             "message": "VENDOR_ID is required."
        });
    }

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            var CHANNEL_NAME = `territory_${roleDetailsItem.TERITORY_ID}_admin_channel`;

            mm.executeDML(
                `CALL sp_vendorTerritoryMapping_mapTerritoryToVendor(?,?,?,?,?,?,?)`,
                [
                    VENDOR_ID,
                    roleDetailsItem.TERITORY_ID,
                    roleDetailsItem.IS_ACTIVE,
                    CLIENT_ID,
                    USER_ID,
                    VENDOR_NAME,
                    CHANNEL_NAME
                ],
                supportKey,
                connection,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        inner_callback(error);
                    } else {
                        // Handle channel subscription
                        const chanelData = {
                            CHANNEL_NAME: CHANNEL_NAME,
                            USER_ID: USER_ID,
                            TYPE: "V",
                            STATUS: roleDetailsItem.IS_ACTIVE,
                            USER_NAME: VENDOR_NAME,
                            CLIENT_ID: 1,
                            DATE: mm.getSystemDate()
                        };

                        var TYPE = "V";

                        channelSubscribedUsers.findOne({
                            "CHANNEL_NAME": CHANNEL_NAME,
                            "USER_ID": USER_ID,
                            "TYPE": TYPE
                        })
                            .then(existingRecord => {
                                if (existingRecord) {
                                    channelSubscribedUsers
                                        .updateMany({
                                            CHANNEL_NAME: CHANNEL_NAME,
                                            USER_ID: USER_ID,
                                            TYPE: TYPE
                                        }, {
                                            STATUS: roleDetailsItem.IS_ACTIVE
                                        })
                                        .then(() => {
                                            inner_callback(null);
                                        })
                                        .catch((error) => {
                                            console.error("Error updating channel:", error);
                                            inner_callback(error);
                                        });
                                }
                                else {
                                    const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                    newchannelSubscribedUsers.save()
                                        .then(() => {
                                            inner_callback(null);
                                        })
                                        .catch(error => {
                                            console.error("Error saving channel:", error);
                                            inner_callback(error);
                                        });
                                }
                            })
                            .catch(error => {
                                console.error("Error finding channel:", error);
                                inner_callback(null);
                            });
                    }
                }
            );
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "code": 400,
                     "message": "Failed to Insert vendorTerritoryMapping information..."
                });
            } else {
                // Save action log
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped territory to vendor.`;

                // Save log via systemLog if needed
                // dbm.saveLog(actionLog, systemLog);

                mm.commitConnection(connection);
                res.status(200).json({
                    "code": 200,
                     "message": "New vendorTerritoryMapping Successfully added",
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
