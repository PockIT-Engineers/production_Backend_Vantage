const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
var territoryPincodeMapping = "territory_pincode_mapping";
var viewTerritoryPincodeMapping = "view_" + territoryPincodeMapping;

function reqData(req) {

    var data = {
        TERRITORY_ID: req.body.TERRITORY_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TERRITORY_ID').isInt().optional(),
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
                setContext + `CALL sp_territoryPincodeMapping_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                             "message": "Failed to get territoryPincodeMapping information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 123,
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
                `CALL sp_territoryPincodeMapping_create(?,?,?,?)`,
                [
                    data.TERRITORY_ID,
                    data.PINCODE_ID,
                    data.IS_ACTIVE,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                             "message": "Failed to save territoryPincodeMapping information..."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped pincodes to territory.`;
                        var logCategory = "territory postal code mapping";

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
                        res.status(200).json({
                            "code": 200,
                             "message": "TerritoryPincodeMapping information saved successfully...",
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
                `CALL sp_territoryPincodeMapping_update(?,?,?,?,?)`,
                [
                    ID,
                    data.TERRITORY_ID,
                    data.PINCODE_ID,
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
                             "message": "Failed to update territoryPincodeMapping information."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the territory postal code mapping.`;
                        var logCategory = "territory postal code mapping";

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
                             "message": "TerritoryPincodeMapping information updated successfully...",
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
    var TERRITORY_ID = req.body.TERRITORY_ID || req.body.TERITORY_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_territoryPincodeMapping_map(?,?,?,?)`,
                [
                    TERRITORY_ID,
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
                res.status(400).json({
                    "code": 400,
                     "message": "Failed to Insert territoryPincodeMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped postal codes to the territory.`;
                var logCategory = "territory postal code mapping";

                let actionLog = {
                    "SOURCE_ID": TERRITORY_ID,
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
                     "message": "New territoryPincodeMapping Successfully added",
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

exports.mapPincodes = (req, res) => {
    var TERRITORY_ID = req.body.TERRITORY_ID;
    var STATUS = req.body.STATUS;
    var IS_ACTIVE = STATUS == 'M' ? '1' : '0';
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_territoryPincodeMapping_mapPincodes(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    TERRITORY_ID,
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
                res.status(400).json({
                    "code": 400,
                     "message": "Failed to Insert territory_pincode_mapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped postal code to the territory`;
                var logCategory = "territory postal code mapping";

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
                res.status(200).json({
                    "code": 200,
                     "message": "TerritoryPincodeMapping information created successfully..."
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

exports.unMapPincodes = (req, res) => {
    const TERRITORY_ID = req.body.TERRITORY_ID;
    const data = req.body.data;
    const supportKey = req.headers['supportkey'];

    try {
        var IS_ALREADY_MAPPED = [];
        const connection = mm.openConnection();

        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_territoryPincodeMapping_unMapPincodes(?,?,?)`,
                [
                    TERRITORY_ID,
                    roleDetailsItem.PINCODE_ID,
                    roleDetailsItem.IS_ACTIVE
                ],
                supportKey,
                connection,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        return inner_callback(error);
                    }

                    const r = results[0][0];

                    if (r.code == 300) {
                        // Pincode is already mapped to another territory
                        return inner_callback({
                            isAlreadyMapped: true,
                            territoryName: r.message.replace('Pincode is already mapped to ', '').replace(' territory', ''),
                            PINCODE: r.PINCODE
                        });
                    } else if (r.code == 404) {
                        // Mapping not found, just continue
                        inner_callback(null);
                    } else if (r.code == 200) {
                        // Successfully unmapped
                        inner_callback(null);
                    } else {
                        // Check if pincode is already mapped elsewhere
                        mm.executeDML(
                            `CALL sp_territoryPincodeMapping_checkAlreadyMapped(?,?)`,
                            [TERRITORY_ID, roleDetailsItem.PINCODE_ID],
                            supportKey,
                            connection,
                            (error, checkResults) => {
                                if (error) {
                                    console.log(error);
                                    return inner_callback(error);
                                }

                                const check = checkResults[0][0];
                                if (check.is_already_mapped == 1) {
                                    IS_ALREADY_MAPPED.push({
                                        PINCODE_ID: roleDetailsItem.PINCODE_ID,
                                        PINCODE: check.PINCODE
                                    });
                                    inner_callback(null);
                                } else {
                                    inner_callback(null);
                                }
                            }
                        );
                    }
                }
            );
        }, function subCb(error) {
            if (error) {
                if (error.isAlreadyMapped) {
                    mm.rollbackConnection(connection);
                    return res.status(300).json({
                        "code": 300,
                         "message": error.territoryName
                    });
                }

                mm.rollbackConnection(connection);
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to update territoryPincodeMapping information.",
                    IS_ALREADY_MAPPED: IS_ALREADY_MAPPED
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has unmapped postal code from the territory.`;
                var logCategory = "territory postal code mapping";

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

                res.status(200).json({
                    "code": 200,
                     "message": "TerritoryPincodeMapping Successfully unmapped",
                    IS_ALREADY_MAPPED: IS_ALREADY_MAPPED
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