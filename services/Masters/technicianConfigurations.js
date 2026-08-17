const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var technicianConfigurations = "technician_configurations";
var viewTechnicianConfigurations = "view_" + technicianConfigurations;


function reqData(req) {

    var data = {
        PREFERRED_LANGUAGE_ID: req.body.PREFERRED_LANGUAGE_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        CAN_VIEW_JOB_POOL: req.body.CAN_VIEW_JOB_POOL ? '1' : '0',
        CAN_ASSIGN_EXPRESS_ORDER: req.body.CAN_ASSIGN_EXPRESS_ORDER ? '1' : '0',
        CAN_ASSIGN_ORDERS_FORCEFULLY: req.body.CAN_ASSIGN_ORDERS_FORCEFULLY ? '1' : '0',
        CAN_VIEW_SERVICE_PRICES_SUMMARY: req.body.CAN_VIEW_SERVICE_PRICES_SUMMARY ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        CAN_ACCEPT_JOB: req.body.CAN_ACCEPT_JOB ? '1' : '0',
        CAN_EDIT_PINCODE: req.body.CAN_EDIT_PINCODE ? '1' : '0',
        CAN_EDIT_SKILL: req.body.CAN_EDIT_SKILL ? '1' : '0',
    }
    return data;
}

exports.validate = function () {
    return [
        body('DATE').optional(),
        body('TECHNICIAN_ID').isInt().optional(),
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
                setContext+`CALL sp_technicianConfigurations_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get technicianConfigurations count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 109,
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
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

// Create technician configuration using stored procedure
exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_technicianConfigurations_create(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.PREFERRED_LANGUAGE_ID,
                data.TECHNICIAN_ID,
                data.CAN_VIEW_JOB_POOL,
                data.CAN_ASSIGN_EXPRESS_ORDER,
                data.CAN_ASSIGN_ORDERS_FORCEFULLY,
                data.CAN_VIEW_SERVICE_PRICES_SUMMARY,
                data.CLIENT_ID,
                data.CAN_ACCEPT_JOB,
                data.CAN_EDIT_PINCODE,
                data.CAN_EDIT_SKILL,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technicianConfigurations information..."
                    });
                }

                const resultData = results[0][0];
                if (resultData.code === 300 || resultData.code === 400) {
                    return res.status(200).json({
                        "code": resultData.code,
                        "message": resultData.message
                    });
                }

                // MongoDB logging (keeping as is)
                var ACTION_DETAILS = `${userName} has updated the configuration details of technician.`;
                var logCategory = "Technician Configurations";

                let actionLog = {
                    "SOURCE_ID": resultData.CONFIG_ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "TechnicianConfigurations information saved successfully...",
                    "CONFIG_ID": resultData.CONFIG_ID
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

// Update technician configuration using stored procedure
exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var id = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Clean up data - remove undefined/null values
        Object.keys(data).forEach(key => {
            if (data[key] === undefined || data[key] === null) {
                delete data[key];
            }
        });

        // Handle PREFERRED_LANGUAGE_ID null case
        if (data.PREFERRED_LANGUAGE_ID === null) {
            // Keep it as null to set to NULL in database
        } else if (data.PREFERRED_LANGUAGE_ID === undefined) {
            delete data.PREFERRED_LANGUAGE_ID;
        }

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_technicianConfigurations_update(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.PREFERRED_LANGUAGE_ID !== undefined ? data.PREFERRED_LANGUAGE_ID : null,
                data.TECHNICIAN_ID || null,
                data.CAN_VIEW_JOB_POOL || null,
                data.CAN_ASSIGN_EXPRESS_ORDER || null,
                data.CAN_ASSIGN_ORDERS_FORCEFULLY || null,
                data.CAN_VIEW_SERVICE_PRICES_SUMMARY || null,
                data.CLIENT_ID || null,
                data.CAN_ACCEPT_JOB || null,
                data.CAN_EDIT_PINCODE || null,
                data.CAN_EDIT_SKILL || null,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technicianConfigurations information."
                    });
                }

                const resultData = results[0][0];
                if (resultData.code === 300 || resultData.code === 400) {
                    return res.status(200).json({
                        "code": resultData.code,
                        "message": resultData.message
                    });
                }

                // MongoDB logging (keeping as is)
                var ACTION_DETAILS = `${userName} has updated the configuration details of the technician.`;
                var logCategory = "Technician Configurations";

                let actionLog = {
                    "SOURCE_ID": id,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "TechnicianConfigurations information updated successfully...",
                    "CONFIG_ID": resultData.CONFIG_ID
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};