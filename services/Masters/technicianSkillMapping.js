const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
var technicianSkillMapping = "technician_skill_mapping";
var viewTechnicianSkillMapping = "view_" + technicianSkillMapping;


function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        SKILL_ID: req.body.SKILL_ID,
        SKILL_LEVEL: req.body.SKILL_LEVEL,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        STATUS: req.body.STATUS,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('SKILL_ID').isInt().optional(),
        body('SKILL_LEVEL').optional(),
        body('ANY_OTHER_QUALITIES').optional(),
        body('YEARS_OF_EXPERIENCE').isDecimal().optional(),
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
                setContext + `CALL sp_technicianSkillMapping_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get technicianSkillMapping information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 118,
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
                `CALL sp_technicianSkillMapping_create(?,?,?,?,?,?)`,
                [
                    data.TECHNICIAN_ID,
                    data.SKILL_ID,
                    data.SKILL_LEVEL,
                    data.IS_ACTIVE,
                    data.STATUS || 'A',
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to save technicianSkillMapping information..."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped skills to technician.`;
                        var logCategory = "technician skill mapping";

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
                            "message": "TechnicianSkillMapping information saved successfully...",
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
    let REQUEST_MASTER_ID = req.body.REQUEST_MASTER_ID;
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
                `CALL sp_technicianSkillMapping_update(?,?,?,?,?,?,?,?)`,
                [
                    ID,
                    data.TECHNICIAN_ID,
                    data.SKILL_ID,
                    data.SKILL_LEVEL,
                    data.IS_ACTIVE,
                    data.STATUS,
                    data.CLIENT_ID,
                    REQUEST_MASTER_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to update technicianSkillMapping information."
                        });
                    }
                    else {
                        if (data.STATUS && data.STATUS == 'D' && REQUEST_MASTER_ID) {
                            mm.executeQueryData(
                                `CALL sp_technicianSkillMapping_deleteRequest(?)`,
                                [REQUEST_MASTER_ID],
                                supportKey,
                                (error, resDel) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                    }

                                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the technician skill mapping.`;
                                    var logCategory = "technician skill mapping";

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
                                        "message": "TechnicianSkillMapping information updated successfully...",
                                    });
                                }
                            );
                        } else {
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the technician skill mapping.`;
                            var logCategory = "technician skill mapping";

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
                                "message": "TechnicianSkillMapping information updated successfully...",
                            });
                        }
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
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_technicianSkillMapping_map(?,?,?,?,?)`,
                [
                    TECHNICIAN_ID,
                    roleDetailsItem.SKILL_ID,
                    roleDetailsItem.SKILL_LEVEL,
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
                    "message": "Failed to Insert technicianSkillMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped skills to technician.`;
                var logCategory = "technician skill mapping";

                let actionLog = {
                    "SOURCE_ID": TECHNICIAN_ID,
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
                    "message": "New technicianSkillMapping Successfully added",
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

exports.mapSkills = (req, res) => {
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var STATUS = req.body.STATUS;
    var SKILL_LEVEL = req.body.SKILL_LEVEL || "";
    var IS_ACTIVE = req.body.IS_ACTIVE;
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_technicianSkillMapping_mapSkills(?,?,?,?,?,?)`,
                [
                    TECHNICIAN_ID,
                    roleDetailsItem.SKILL_ID,
                    SKILL_LEVEL,
                    IS_ACTIVE,
                    roleDetailsItem.STATUS || STATUS,
                    1 // CLIENT_ID
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
                    "message": "Failed to Insert technicianSkillsMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped skills to technician.`;
                var logCategory = "technician skill mapping";

                let actionLog = {
                    "SOURCE_ID": TECHNICIAN_ID,
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
                    "message": "New technicianSkillsMapping Successfully added",
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

exports.unMapSkills = (req, res) => {
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_technicianSkillMapping_unMapSkills(?,?,?)`,
                [
                    TECHNICIAN_ID,
                    roleDetailsItem.SKILL_ID,
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
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to Insert technicianSkillsMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has unmapped skills from the technician.`;
                var logCategory = "technician skill mapping";

                let actionLog = {
                    "SOURCE_ID": TECHNICIAN_ID,
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
                    "message": "New technicianSkillsMapping Successfully added",
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
