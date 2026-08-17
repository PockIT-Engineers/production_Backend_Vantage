const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var siteVisitReport = "site_visit_reports";
var viewsiteVisitReport = "view_" + siteVisitReport;

function reqData(req) {
    var data = {
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        DISPATCH_REPORT_JSON: JSON.stringify(req.body.DISPATCH_REPORT_JSON), //req.body.DISPATCH_REPORT_JSON,
        QHC_REPORT_JSON: JSON.stringify(req.body.QHC_REPORT_JSON), //req.body.QHC_REPORT_JSON,
        DISPATCH_REPORT_URL: req.body.DISPATCH_REPORT_URL,
        QHC_REPORT_URL: req.body.QHC_REPORT_URL,
        DISPATCH_REPORT_SUBMIT_DATE: mm.getSystemDate(),
        QHC_REPORT_SUBMIT_DATE: mm.getSystemDate(),

    }
    return data;
}

exports.validate = function () {
    return [
        body('JOB_CARD_ID').isInt().optional(),
        body('ORDER_ID').isInt().optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('DISPATCH_REPORT').optional(),
        body('QHC_REPORT').optional(),
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
                setContext + `CALL sp_siteVisitReport_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get site visit report count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 229,
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

// Create site visit report using stored procedure
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
            `CALL sp_siteVisitReport_create(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.JOB_CARD_ID,
                data.ORDER_ID,
                data.CUSTOMER_ID,
                data.TECHNICIAN_ID,
                data.DISPATCH_REPORT_JSON,
                data.QHC_REPORT_JSON,
                data.DISPATCH_REPORT_URL,
                data.QHC_REPORT_URL,
                data.DISPATCH_REPORT_SUBMIT_DATE,
                data.QHC_REPORT_SUBMIT_DATE,
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
                        "message": "Failed to save site visit report information..."
                    });
                }

                const resultData = results[0][0];

                // MongoDB logging (keeping as is)
                var ACTION_DETAILS = `User ${userName} has created a new site visit report`;
                var logCategory = "Site Visit Report";

                let actionLog = {
                    "SOURCE_ID": resultData.REPORT_ID,
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
                    "message": "Site visit report information saved successfully...",
                    "REPORT_ID": resultData.REPORT_ID
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

// Update site visit report using stored procedure
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

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_siteVisitReport_update(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.JOB_CARD_ID,
                data.ORDER_ID,
                data.CUSTOMER_ID,
                data.TECHNICIAN_ID,
                data.DISPATCH_REPORT_JSON,
                data.QHC_REPORT_JSON,
                data.DISPATCH_REPORT_URL,
                data.QHC_REPORT_URL,
                data.DISPATCH_REPORT_SUBMIT_DATE,
                data.QHC_REPORT_SUBMIT_DATE,
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
                        "message": "Failed to update site visit report information."
                    });
                }

                const resultData = results[0][0];

                // MongoDB logging (keeping as is)
                var ACTION_DETAILS = `User ${userName} has updated the details of site visit report`;
                var logCategory = "Site Visit Report";

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
                    "message": "Site visit report information updated successfully...",
                    "REPORT_ID": resultData.REPORT_ID
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
