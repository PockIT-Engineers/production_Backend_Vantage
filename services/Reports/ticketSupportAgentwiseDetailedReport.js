const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const db = require('../../utilities/globalModule');
const async = require('async');
const global = require('../global');

const applicationkey = process.env.APPLICATION_KEY;

var ticketMaster = "ticket_master";
var viewTicketMaster = "view_" + ticketMaster;

function reqData(req) {
    var data = {
        TICKET_GROUP_ID: req.body.TICKET_GROUP_ID,
        TICKET_NO: req.body.TICKET_NO,
        USER_ID: req.body.USER_ID,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        CLOUD_ID: req.body.CLOUD_ID,
        QUESTION: req.body.QUESTION,
        STATUS: req.body.STATUS,
        PRIORITY: req.body.PRIORITY ? req.body.PRIORITY : 'M',
        IS_TAKEN: req.body.IS_TAKEN ? '1' : '0',
        TAKEN_BY_USER_ID: req.body.TAKEN_BY_USER_ID ? req.body.TAKEN_BY_USER_ID : 0,
        LAST_RESPONDED: req.body.LAST_RESPONDED ? req.body.LAST_RESPONDED : mm.getSystemDate(),
        CLIENT_ID: req.body.CLIENT_ID,
        SUBJECT: req.body.SUBJECT,
        DATE: req.body.DATE ? req.body.DATE : mm.getSystemDate(),
        ORG_ID: req.body.ORG_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TICKET_GROUP_ID').isInt(),
        body('TICKET_NO').isInt(),
        body('USER_ID').isInt(),
        body('MOBILE_NO', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('CLOUD_ID', ' parameter missing').exists(),
        body('QUESTION', ' parameter missing').exists(),
        body('ID').optional(),
    ]
}

exports.getTicketSupportAgentwiseDetailedReport = (req, res) => {
    var supportKey = req.headers['supportkey'];

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
                setContext+`CALL sp_ticketSupportAgentwiseDetailedReport_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 127,
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