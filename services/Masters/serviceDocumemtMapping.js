const mm = require('../../utilities/globalModule');
const { validationResult, body, Result } = require('express-validator');
const logger = require("../../utilities/logger");
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var serviceDocumemtMapping = "service_documemt_mapping";
var viewServiceDocumemtMapping = "view_" + serviceDocumemtMapping;


function reqData(req) {

    var data = {
        SERVICE_ID: req.body.SERVICE_ID,
        MASTER_ID: req.body.MASTER_ID,
        STATUS: req.body.STATUS ? '1' : '0',
        CATEGORY_ID: req.body.CATEGORY_ID,
        SUBCATEGORY_ID: req.body.SUBCATEGORY_ID,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [

        body('SERVICE_ID').isInt().optional(), body('MASTER_ID').isInt().optional(), body('ID').optional(),


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
                setContext + `CALL sp_serviceDocumentMapping_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get serviceDocumentMapping information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 213,
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
                 "message": "Invalid filter parameter.",
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

exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            // Get user information from auth data
            const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
            const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

            // Using stored procedure
            mm.executeQueryData(
                `CALL sp_serviceDocumentMapping_create(?,?,?,?,?,?,?,?)`,
                [
                    data.SERVICE_ID,
                    data.MASTER_ID,
                    data.STATUS,
                    data.CATEGORY_ID,
                    data.SUBCATEGORY_ID,
                    data.CLIENT_ID,
                    userId,
                    userName
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to save serviceDocumentMapping information..."
                        });
                    }
                    else {
                        const resultData = results[0][0];
                        if (resultData.code === 300) {
                            res.status(200).json({
                                "code": 300,
                                "message": resultData.message
                            });
                        } else {

                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped new service documemt .`;
                            var logCategory = "Service Documemt Mapping"

                            let actionLog = {
                                "SOURCE_ID": resultData.MAPPING_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }

                            dbm.saveLog(actionLog, systemLog)
                            res.status(200).json({
                                "code": 200,
                                "message": "ServiceDocumentMapping information saved successfully...",
                                "MAPPING_ID": resultData.MAPPING_ID
                            });
                        }
                    }
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
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var id = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            // Get user information from auth data
            const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
            const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

            // Using stored procedure
            mm.executeQueryData(
                `CALL sp_serviceDocumentMapping_update(?,?,?,?,?,?,?,?,?)`,
                [
                    id,
                    data.SERVICE_ID,
                    data.MASTER_ID,
                    data.STATUS,
                    data.CATEGORY_ID,
                    data.SUBCATEGORY_ID,
                    data.CLIENT_ID,
                    userId,
                    userName
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to update serviceDocumentMapping information."
                        });
                    }
                    else {
                        const resultData = results[0][0];
                        if (resultData.code === 300) {
                            res.status(200).json({
                                "code": 300,
                                "message": resultData.message
                            });
                        } else {
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the service documemt mapping.`;
                            var logCategory = "Service Documemt Mapping"

                            let actionLog = {
                                "SOURCE_ID": id, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }

                            dbm.saveLog(actionLog, systemLog)
                            res.status(200).json({
                                "code": 200,
                                "message": "ServiceDocumentMapping information updated successfully...",
                                "MAPPING_ID": resultData.MAPPING_ID
                            });
                        }
                    }
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
    }
};