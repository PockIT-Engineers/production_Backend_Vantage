const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require("../../modules/channelSubscribedUsers");
var technicianPincodeMapping = "technician_pincode_mapping";
var viewTechnicianPincodeMapping = "view_" + technicianPincodeMapping;

function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        STATUS: req.body.STATUS,
        IS_ACTIVE: req.body.IS_ACTIVE ? 1 : 0,
        CLIENT_ID: req.body.CLIENT_ID,
        PINCODE: req.body.PINCODE,
        COUNTRY_NAME: req.body.COUNTRY_NAME,
        COUNTRY_ID: req.body.COUNTRY_ID,
        STATE: req.body.STATE,
        STATE_NAME: req.body.STATE_NAME,
        OFFICE_NAME: req.body.OFFICE_NAME,
        CIRCLE_NAME: req.body.CIRCLE_NAME,
        DIVISION_NAME: req.body.DIVISION_NAME,
        TALUKA: req.body.TALUKA,
        DISTRICT: req.body.DISTRICT,
        DISTRICT_NAME: req.body.DISTRICT_NAME
    }

    return data;
}

exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('PINCODE_ID').isInt().optional(),
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
                setContext + `CALL sp_technicianPincodeMapping_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get technicianPincodeMapping information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 115,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.send({
                "code": 400,
                "message": "Invalid filter parameter."
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
            mm.executeQueryData(
                `CALL sp_technicianPincodeMapping_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.TECHNICIAN_ID,
                    data.PINCODE_ID,
                    data.STATUS,
                    data.IS_ACTIVE,
                    data.CLIENT_ID,
                    data.PINCODE,
                    data.COUNTRY_NAME,
                    data.COUNTRY_ID,
                    data.STATE,
                    data.STATE_NAME,
                    data.OFFICE_NAME,
                    data.CIRCLE_NAME,
                    data.DIVISION_NAME,
                    data.TALUKA,
                    data.DISTRICT,
                    data.DISTRICT_NAME
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save technicianPincodeMapping information..."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped pincodes to the technician.`;
                        var logCategory = "technician Pincode Mapping";

                        let actionLog = {
                            "SOURCE_ID": results[0][0].ID,
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
                            "message": "TechnicianPincodeMapping information saved successfully...",
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
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var ID = req.body.ID;

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
                `CALL sp_technicianPincodeMapping_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    ID,
                    data.TECHNICIAN_ID,
                    data.PINCODE_ID,
                    data.STATUS,
                    data.IS_ACTIVE,
                    data.CLIENT_ID,
                    data.PINCODE,
                    data.COUNTRY_NAME,
                    data.COUNTRY_ID,
                    data.STATE,
                    data.STATE_NAME,
                    data.OFFICE_NAME,
                    data.CIRCLE_NAME,
                    data.DIVISION_NAME,
                    data.TALUKA,
                    data.DISTRICT,
                    data.DISTRICT_NAME
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update technicianPincodeMapping information."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the technician postal code mapping.`;
                        var logCategory = "technician Pincode Mapping";

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
                        res.send({
                            "code": 200,
                            "message": "TechnicianPincodeMapping information updated successfully."
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
};

exports.addBulk = (req, res) => {
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_technicianPincodeMapping_map(?,?,?,?)`,
                [
                    TECHNICIAN_ID,
                    roleDetailsItem.PINCODE_ID,
                    roleDetailsItem.IS_ACTIVE,
                    CLIENT_ID
                ],
                supportKey,
                connection,
                (error) => {
                    if (error) {
                        console.log(error);
                        inner_callback(error);
                    } else {
                        inner_callback(null);
                    }
                }
            );
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to Insert technicianPincodeMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped pincodes to the technician.`;
                var logCategory = "technician Pincode Mapping";

                let actionLog = {
                    "SOURCE_ID": 0,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": 0
                };

                dbm.saveLog(actionLog, systemLog);
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New technicianPincodeMapping Successfully added",
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
};

exports.mapPincodes = (req, res) => {
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var TECHNICIAN_NAME = req.body.TECHNICIAN_NAME;
    var STATUS = req.body.STATUS;
    var IS_ACTIVE = STATUS == 'M' ? '1' : '0';
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_technicianPincodeMapping_mapPincodes(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    TECHNICIAN_ID,
                    roleDetailsItem.PINCODE_ID,
                    STATUS,
                    IS_ACTIVE,
                    1, // CLIENT_ID
                    roleDetailsItem.PINCODE,
                    roleDetailsItem.COUNTRY_NAME,
                    roleDetailsItem.COUNTRY_ID,
                    roleDetailsItem.STATE,
                    roleDetailsItem.STATE_NAME,
                    roleDetailsItem.OFFICE_NAME,
                    roleDetailsItem.CIRCLE_NAME,
                    roleDetailsItem.DIVISION_NAME,
                    roleDetailsItem.TALUKA,
                    roleDetailsItem.DISTRICT,
                    roleDetailsItem.DISTRICT_NAME
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
                res.send({
                    "code": 400,
                    "message": "Failed to Insert technicianPincodeMapping information..."
                });
            } else {
                mm.executeDML(
                    'CALL sp_technicianPincodeMapping_updateTechnicianStatus(?)',
                    [TECHNICIAN_ID],
                    supportKey,
                    connection,
                    (error) => {
                        if (error) {
                            console.log("error", error);
                            mm.rollbackConnection(connection);
                            res.send({
                                "code": 400,
                                "message": "Failed to update technician master..."
                            });
                        } else {
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped postal code to the technician.`;
                            var logCategory = "technician Pincode Mapping";

                            let actionLog = {
                                "SOURCE_ID": 0,
                                "LOG_DATE_TIME": mm.getSystemDate(),
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                "supportKey": 0
                            };

                            dbm.saveLog(actionLog, systemLog);
                            mm.commitConnection(connection);
                            res.send({
                                "code": 200,
                                "message": "TechnicianPincodeMapping information created successfully..."
                            });
                        }
                    }
                );
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
};

exports.unMapPincodes = (req, res) => {
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_technicianPincodeMapping_unMapPincodes(?,?,?)`,
                [
                    TECHNICIAN_ID,
                    roleDetailsItem.PINCODE_ID,
                    roleDetailsItem.IS_ACTIVE
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
                res.send({
                    "code": 400,
                    "message": "Failed to Insert technicianPincodeMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has unmapped pincodes from the technician.`;
                var logCategory = "technician Pincode Mapping";

                let actionLog = {
                    "SOURCE_ID": 0,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": 0
                };

                dbm.saveLog(actionLog, systemLog);
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New technicianPincodeMapping Successfully added",
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
};