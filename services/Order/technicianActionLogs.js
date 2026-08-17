const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var technicianActionLogs = "technician_action_logs";
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
var viewTechnicianActionLogs = "view_" + technicianActionLogs;
const TechnicianActionLog = require("../../modules/technicianActionLog");
// Conversion Done  

function reqData(req) {
    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        DATE_TIME: req.body.DATE_TIME,
        ACTION_LOG_TYPE: req.body.ACTION_LOG_TYPE ? '1' : '0',
        ACTION_DETAILS: req.body.ACTION_DETAILS,
        ORDER_ID: req.body.ORDER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [

        body('TECHNICIAN_ID').isInt().optional(), body('DATE_TIME').optional(), body('ACTION_LOG_TYPE').optional(), body('ACTION_DETAILS').optional(), body('ORDER_ID').isInt().optional(), body('JOB_CARD_ID').isInt().optional(), body('ID').optional(),

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
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_technicianActionLogs_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get warehouse data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 136,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
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
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {

            const params = [
                data.TECHNICIAN_ID,
                data.VENDOR_ID,
                data.ORDER_ID,
                data.JOB_CARD_ID,
                data.CUSTOMER_ID,
                data.DATE_TIME,
                data.LOG_TYPE,
                data.ACTION_LOG_TYPE,
                data.ACTION_DETAILS,
                data.READ_ONLY,
                data.ARCHIVE_FLAG,
                data.CLIENT_ID,
                data.USER_ID,
                data.TECHNICIAN_NAME,
                data.ORDER_DATE_TIME,
                data.CART_ID,
                data.EXPECTED_DATE_TIME,
                data.ORDER_MEDIUM,
                data.ORDER_STATUS,
                data.PAYMENT_MODE,
                data.PAYMENT_STATUS,
                data.TOTAL_AMOUNT,
                data.ORDER_NUMBER,
                data.TASK_DESCRIPTION,
                data.ESTIMATED_TIME_IN_MIN,
                data.PRIORITY,
                data.JOB_CARD_STATUS,
                data.USER_NAME
            ];
            mm.executeQueryData("CALL sp_technicianActionLog_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", params, supportKey, (error, results) => {
                if (error) {
                    console.log(error);

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save technicianActionLogs information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new technician action logs.`;


                    var logCategory = "technician actions log";

                    let actionLog = {
                        "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "TechnicianActionLogs information saved successfully...",
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
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);

    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        data[key] ? setData += `${key}= ? , ` : true;
        data[key] ? recordData.push(data[key]) : true;
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {

            const params = [
                req.body.ID,
                data.TECHNICIAN_ID || null,
                data.VENDOR_ID || null,
                data.ORDER_ID || null,
                data.JOB_CARD_ID || null,
                data.CUSTOMER_ID || null,
                data.DATE_TIME || null,
                data.LOG_TYPE || null,
                data.ACTION_LOG_TYPE || null,
                data.ACTION_DETAILS || null,
                data.READ_ONLY || null,
                data.ARCHIVE_FLAG || null,
                data.CLIENT_ID || null,
                data.USER_ID || null,
                data.TECHNICIAN_NAME || null,
                data.ORDER_DATE_TIME || null,
                data.CART_ID || null,
                data.EXPECTED_DATE_TIME || null,
                data.ORDER_MEDIUM || null,
                data.ORDER_STATUS || null,
                data.PAYMENT_MODE || null,
                data.PAYMENT_STATUS || null,
                data.TOTAL_AMOUNT || null,
                data.ORDER_NUMBER || null,
                data.TASK_DESCRIPTION || null,
                data.ESTIMATED_TIME_IN_MIN || null,
                data.PRIORITY || null,
                data.JOB_CARD_STATUS || null,
                data.USER_NAME || null
            ];
            mm.executeQueryData("CALL sp_technicianActionLog_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", params, supportKey, (error, results) => {
                if (error) {

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update technicianActionLogs information."
                    });
                }
                else {

                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details technician action logs.`;

                    var logCategory = "technician actions log";

                    let actionLog = {
                        "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "TechnicianActionLogs information updated successfully...",
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
    }
}

exports.getDateWiseLogs = async (req, res) => {
    const pageIndex = parseInt(req.body.pageIndex) || 1;
    const pageSize = parseInt(req.body.pageSize) || 10;
    const sortKey = req.body.sortKey || 'DATE_TIME';
    const sortValue = req.body.sortValue === 'ASC' ? 1 : -1;
    let filter = req.body.filter || '{}';
    const supportKey = req.headers['supportkey'];

    try {
        filter = JSON.parse(filter);
        const collection = TechnicianActionLog;
        const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

        if (IS_FILTER_WRONG === "0") {
            const countQuery = [
                { $match: filter },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$DATE_TIME" } } } },
                { $count: "cnt" }
            ];

            const countResult = await collection.aggregate(countQuery).exec();
            const totalCount = countResult.length > 0 ? countResult[0].cnt : 0;

            const dataQuery = [
                { $match: filter },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$DATE_TIME" } },
                        ACTION_LOGS: {
                            $push: {
                                ID: "$ID",
                                DATE_TIME: "$DATE_TIME",
                                TECHNICIAN_ID: "$TECHNICIAN_ID",
                                CUSTOMER_ID: "$CUSTOMER_ID",
                                ACTION_LOG_TYPE: "$ACTION_LOG_TYPE",
                                ACTION_DETAILS: "$ACTION_DETAILS",
                                LOG_TYPE: "$LOG_TYPE",
                                TECHNICIAN_NAME: "$TECHNICIAN_NAME",
                                USER_NAME: "$USER_NAME",
                                IANA_CODE: "$IANA_CODE"
                            }
                        }
                    }
                },
                // { $sort: { [sortKey]: sortValue } },
                { $sort: { _id: sortValue } },
                { $skip: (pageIndex - 1) * pageSize },
                { $limit: pageSize },
            ];

            let dataResults = await collection.aggregate(dataQuery).exec();
            dataResults = dataResults.map(entry => ({
                ...entry,
                ACTION_LOGS: Object.values(
                    entry.ACTION_LOGS.reduce((acc, log) => {
                        if (!acc[log.ACTION_DETAILS]) {
                            acc[log.ACTION_DETAILS] = log;
                        }
                        return acc;
                    }, {})
                )
            }));
            res.send({
                code: 200,
                message: "success",
                count: totalCount,
                data: dataResults
            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter provided."
            });
        }
    } catch (error) {
        console.error("Error fetching date-wise logs:", error);
        res.send({
            code: 500,
            message: "Internal Server Error."
        });
    }
};

exports.getorderLogsforCustomer = async (req, res) => {
    const pageIndex = parseInt(req.body.pageIndex) || 1;
    const pageSize = parseInt(req.body.pageSize) || 10;
    const sortKey = req.body.sortKey || 'DATE_TIME';
    const sortValue = req.body.sortValue === 'ASC' ? 1 : -1;
    let filter = req.body.filter || '{}';
    let IS_ORDER_OR_JOB = req.body.IS_ORDER_OR_JOB
    let ORDER_ID = req.body.ORDER_ID
    const supportKey = req.headers['supportkey'];

    try {
        const collection = TechnicianActionLog;

        const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

        if (IS_FILTER_WRONG === "0") {
            const countQuery = [
                { $match: filter },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$DATE_TIME" } } } },
                { $count: "cnt" }
            ];

            const countResult = await collection.aggregate(countQuery).exec();
            const totalCount = countResult.length > 0 ? countResult[0].cnt : 0;

            let GroupClumn = IS_ORDER_OR_JOB === "O" ? "$ORDER_STATUS" : "$JOB_CARD_STATUS";

            const dataQuery = [
                { $match: filter },

                // 🔥 VERY IMPORTANT: sort first so latest comes first
                { $sort: { DATE_TIME: -1 } },

                {
                    $group: {
                        _id: GroupClumn,

                        ID: { $first: "$_id" },
                        ORDER_STATUS: { $first: "$ORDER_STATUS" },
                        TECHNICIAN_ID: { $first: "$TECHNICIAN_ID" },
                        VENDOR_ID: { $first: "$VENDOR_ID" },
                        ORDER_ID: { $first: "$ORDER_ID" },
                        JOB_CARD_ID: { $first: "$JOB_CARD_ID" },
                        CUSTOMER_ID: { $first: "$CUSTOMER_ID" },
                        DATE_TIME: { $first: "$DATE_TIME" },   // ✅ now this is latest
                        LOG_TYPE: { $first: "$LOG_TYPE" },
                        ACTION_LOG_TYPE: { $first: "$ACTION_LOG_TYPE" },
                        ACTION_DETAILS: { $first: "$ACTION_DETAILS" },
                        TECHNICIAN_NAME: { $first: "$TECHNICIAN_NAME" },
                        ORDER_NUMBER: { $first: "$ORDER_NUMBER" },
                        JOB_CARD_STATUS: { $first: "$JOB_CARD_STATUS" },
                        USER_NAME: { $first: "$USER_NAME" }
                    }
                },

                // Now sort the grouped results for frontend timeline
                { $sort: { [sortKey]: sortValue } },

                { $skip: (pageIndex - 1) * pageSize },
                { $limit: pageSize }
            ];



            let dataResults = await collection.aggregate(dataQuery).exec();
            mm.executeQueryData(`CALL sp_get_active_job_cards_by_order(?)`, [ORDER_ID], supportKey, (error, resultsjOBS) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to update job card status."
                    });
                } else {
                    resultsjOBS = resultsjOBS?.[0];
                    if (resultsjOBS.length > 0) {
                        const filteredDataResults = dataResults.filter(
                            item => item.ORDER_STATUS !== "Order Completed" && item.ORDER_STATUS !== "Order completed"
                        );
                        const updatedCount = totalCount - (dataResults.length - filteredDataResults.length);
                        return res.send({
                            code: 200,
                            message: "success",
                            count: updatedCount,
                            data: filteredDataResults
                        });
                    } else {
                        return res.send({
                            code: 200,
                            message: "success",
                            count: totalCount,
                            data: dataResults
                        });
                    }
                }
            }
            );
        } else {
            res.send({
                code: 400,
                message: "Invalid filter provided."
            });
        }
    } catch (error) {
        console.error("Error fetching date-wise logs:", error);
        res.send({
            code: 500,
            message: "Internal Server Error."
        });
    }
};

