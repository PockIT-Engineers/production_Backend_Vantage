const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
var technicianLanguageMapping = "technician_language_mapping";
var viewTechnicianLanguageMapping = "view_" + technicianLanguageMapping;


function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        LANGUAGE_ID: req.body.LANGUAGE_ID,
        PROFICIENCY_LEVEL: req.body.PROFICIENCY_LEVEL,
        IS_PRIMARY: req.body.IS_PRIMARY ? '1' : '0',
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('LANGUAGE_ID').isInt().optional(),
        body('PROFICIENCY_LEVEL').optional(),
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
        console.log("Invalid filter parameter:", filter);
        return res.status(400).json({
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_technicianLanguageMapping_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("Error in get technician language mapping:", error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get technician language mapping information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 112,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch technician language mapping get:", error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.errors);
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_technicianLanguageMapping_create(?,?,?,?,?,?)`,
            [
                data.TECHNICIAN_ID,
                data.LANGUAGE_ID,
                data.PROFICIENCY_LEVEL,
                data.IS_PRIMARY,
                data.IS_ACTIVE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("Error creating technician language mapping:", error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technician language mapping."
                    });
                }

                const r = result[0][0];
                if (r.code !== 200) {
                    return res.status(200).json(r);
                }

                // Save action log
                const ACTION_DETAILS = `${req.body.authData?.data?.UserData?.[0]?.NAME || 'User'} has mapped a language to the technician.`;
                const logCategory = "technician language mapping";

                const actionLog = {
                    "SOURCE_ID": r.ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData?.data?.UserData?.[0]?.USER_ID || 0,
                    "supportKey": 0
                };

                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "Technician language mapping saved successfully..."
                });
            }
        );
    } catch (error) {
        console.log("Error in catch technician language mapping create:", error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const id = req.body.ID;

    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.errors);
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_technicianLanguageMapping_update(?,?,?,?,?,?,?)`,
            [
                id,
                data.TECHNICIAN_ID,
                data.LANGUAGE_ID,
                data.PROFICIENCY_LEVEL,
                data.IS_PRIMARY,
                data.IS_ACTIVE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("Error updating technician language mapping:", error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technician language mapping."
                    });
                }

                const r = result[0][0];
                if (r.code !== 200) {
                    return res.status(200).json(r);
                }

                // Save action log
                const ACTION_DETAILS = `${req.body.authData?.data?.UserData?.[0]?.NAME || 'User'} has updated technician language mapping`;
                const logCategory = "technician language mapping";

                const actionLog = {
                    "SOURCE_ID": id,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData?.data?.UserData?.[0]?.USER_ID || 0,
                    "supportKey": 0
                };

                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "Technician language mapping updated successfully..."
                });
            }
        );
    } catch (error) {
        console.log("Error in catch technician language mapping update:", error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.addBulk = (req, res) => {
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const data = req.body.data || [];
    const CLIENT_ID = req.body.CLIENT_ID;
    const supportKey = req.headers['supportkey'];

    console.log("Starting bulk technician language mapping for technician ID:", TECHNICIAN_ID);
    console.log("Data to process:", JSON.stringify(data));

    try {
        const connection = mm.openConnection();

        if (!data || data.length === 0) {
            return res.status(200).json({
                code: 200,
                message: "No languages provided to map",
                total_mapped: 0
            });
        }
        async.eachSeries(data, function iteratorOverElems(languageItem, callback) {
            const LANGUAGE_ID = languageItem.LANGUAGE_ID;
            const PROFICIENCY_LEVEL = languageItem.PROFICIENCY_LEVEL || '';
            const IS_PRIMARY = languageItem.IS_PRIMARY ? '1' : '0';
            const IS_ACTIVE = languageItem.IS_ACTIVE ? '1' : '0';

            console.log(`Processing language ID ${LANGUAGE_ID} for technician ${TECHNICIAN_ID}`);

            mm.executeDML(
                'CALL sp_technicianLanguageMapping_map(?,?,?,?,?,?)',
                [
                    TECHNICIAN_ID,
                    LANGUAGE_ID,
                    PROFICIENCY_LEVEL,
                    IS_PRIMARY,
                    IS_ACTIVE,
                    CLIENT_ID
                ],
                supportKey,
                connection,
                (error, result) => {
                    if (error) {
                        console.log("Error mapping language:", error);
                        return callback(error);
                    }
                    console.log(`Successfully mapped language ID ${LANGUAGE_ID}`);
                    callback(null);
                }
            );
        }, function subCb(error) {
            if (error) {
                console.log("Bulk operation failed:", error);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to process technician language mapping."
                });
            } else {
                // Save action log
                const ACTION_DETAILS = `${req.body.authData?.data?.UserData?.[0]?.NAME || 'User'} has mapped ${data.length} languages to the technician.`;
                const logCategory = "technician language mapping";

                let actionLog = {
                    "SOURCE_ID": TECHNICIAN_ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData?.data?.UserData?.[0]?.USER_ID || 0,
                    "supportKey": 0
                };

                console.log("Saving action log:", actionLog);
                dbm.saveLog(actionLog, systemLog);

                mm.commitConnection(connection);

                console.log("Bulk operation completed successfully");
                res.status(200).json({
                    "code": 200,
                    "message": "Technician language mapping successfully processed",
                    total_mapped: data.length
                });
            }
        });
    } catch (error) {
        console.log("Error in catch:", error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};


exports.updatePrimaryLanguage = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ${technicianLanguageMapping} SET IS_PRIMARY= 0  , CREATED_MODIFIED_DATE = '${systemDate}' where TECHNICIAN_ID = ? `, [data.TECHNICIAN_ID], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technicianLanguageMapping information."
                    });
                }
                else {

                    mm.executeQueryData(`UPDATE ${technicianLanguageMapping} SET IS_PRIMARY= 1 , CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} AND TECHNICIAN_ID= ? AND LANGUAGE_ID=? `, [data.TECHNICIAN_ID, data.LANGUAGE_ID], supportKey, (error, result1) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to update technicianLanguageMapping information."
                            });
                        }
                        else {

                            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the technician's primary language`;

                            var logCategory = "technician language mapping"

                            let actionLog = {
                                "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }

                            dbm.saveLog(actionLog, systemLog)
                            res.status(200).json({
                                "code": 200,
                                "message": "TechnicianLanguageMapping information updated successfully..."
                            });
                        }
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
    }
}

exports.updatePrimaryLanguage = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];

    var systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: errors.errors
        });
    }

    try {
        mm.executeQueryData(
            'CALL sp_technicianLanguageMapping_updatePrimaryLanguage(?, ?, ?, ?)',
            [
                req.body.ID,
                data.TECHNICIAN_ID,
                data.LANGUAGE_ID,
                systemDate
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to update technicianLanguageMapping information."
                    });
                }

                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the technician's primary language`;

                var logCategory = "technician language mapping"

                let actionLog = {
                    "SOURCE_ID": req.body.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                res.status(200).json({
                    "code": 200,
                    "message": "TechnicianLanguageMapping information updated successfully..."
                });
            }
        );

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};