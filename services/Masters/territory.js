const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var territoryMaster = "territory_master";
var viewTerritoryMaster = "view_" + territoryMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        STATUS: req.body.STATUS ? '1' : '0',
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        COUNTRY_ID: req.body.COUNTRY_ID,
        SEQ_NO: req.body.SEQ_NO,
        IS_EXPRESS_SERVICE_AVAILABLE: req.body.IS_EXPRESS_SERVICE_AVAILABLE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        SUPPORT_COUNTRY_CODE: req.body.SUPPORT_COUNTRY_CODE,
        SUPPORT_CONTACT_NUMBER: req.body.SUPPORT_CONTACT_NUMBER,

    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('STATUS').optional(),
        // body('BRANCH_ID').isInt().optional(),
        body('CITY_ID').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('SEQ_NO').isInt().optional(),
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
                setContext + `CALL sp_territoryMaster_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                             "message": "Failed to get territory information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 121,
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
                `CALL sp_territoryMaster_create(?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.NAME,
                    data.STATUS || '1',
                    data.IS_ACTIVE || '1',
                    data.COUNTRY_ID,
                    data.SEQ_NO || 0,
                    data.IS_EXPRESS_SERVICE_AVAILABLE || '0',
                    data.CLIENT_ID || 1,
                    data.START_TIME,
                    data.END_TIME,
                    data.SUPPORT_COUNTRY_CODE,
                    data.SUPPORT_CONTACT_NUMBER
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to save territory information..."
                        });
                    }
                    else {
                        const r = results[0][0];

                        // Save action log
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has added a new territory ${data.NAME}`;
                        let actionLog = {
                            "SOURCE_ID": r.ID,
                            "LOG_DATE_TIME": mm.getSystemDate(),
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": "territory",
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        };

                        dbm.saveLog(actionLog, systemLog);
                        res.status(200).json({
                            "code": 200,
                            "message": "Territory information saved successfully..."
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
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_territoryMaster_update(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.NAME,
                data.STATUS,
                data.IS_ACTIVE,
                data.COUNTRY_ID,
                data.SEQ_NO,
                data.IS_EXPRESS_SERVICE_AVAILABLE,
                data.CLIENT_ID,
                data.START_TIME,
                data.END_TIME,
                data.SUPPORT_COUNTRY_CODE,
                data.SUPPORT_CONTACT_NUMBER
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to update territory information."
                    });
                }

                // Save action log
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of territory ${data.NAME}`;
                const actionLog = {
                    SOURCE_ID: ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "territory",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0,
                };

                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                     "message": "Territory information updated successfully..."
                });
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
};

exports.partialUpdate = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var ID = req.params.id || req.body.ID;

    try {
        if (!ID) {
            return res.status(400).json({
                "code": 400,
                 "message": "ID is required."
            });
        }

        mm.executeQueryData(
            `CALL sp_territoryMaster_partialUpdate(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.NAME,
                data.STATUS,
                data.IS_ACTIVE,
                data.COUNTRY_ID,
                data.SEQ_NO,
                data.IS_EXPRESS_SERVICE_AVAILABLE,
                data.CLIENT_ID,
                data.START_TIME,
                data.END_TIME,
                data.SUPPORT_COUNTRY_CODE,
                data.SUPPORT_CONTACT_NUMBER
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to update territory information."
                    });
                } else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has partially updated the details of the territory`;
                    res.status(200).json({
                        "code": 200,
                         "message": "Territory information updated successfully..."
                    });
                }
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
             "message": "Internal Server Error!"
        });
    }
};

exports.unMappedpincodes = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_TERRITORY_ID = '${TERRITORY_ID || 0}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0" && TERRITORY_ID) {
            mm.executeQueryData(
                setContext + `CALL sp_territoryMaster_unMappedPincodes()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                             "message": "Failed to get unmapped pincodes."
                        });
                    } else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        } else {
            res.status(400).json({
                "code": 400,
                 "message": "Invalid filter parameter or territory id."
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