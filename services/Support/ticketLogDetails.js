const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var ticketLogDetails = "ticket_log_details";
var viewTicketLogDetails = "view_" + ticketLogDetails;

function reqData(req) {
    var data = {
        TICKET_ID: req.body.TICKET_ID,
        LOG_TEXT: req.body.LOG_TEXT,
        LOG_DATETIME: req.body.LOG_DATETIME,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TICKET_ID').isInt(),
        body('LOG_TEXT', ' parameter missing').exists(),
        body('LOG_DATETIME', ' parameter missing').exists(),
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
        return res.status(400).json({
            "code": 400,
             "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_ticketLogDetails_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 170,
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
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        const query = `CALL sp_ticketLogDetails_create(?, ?, ?, ?)`;
        const params = [
            data.TICKET_ID,
            data.LOG_TEXT,
            data.LOG_DATETIME,
            data.CLIENT_ID
        ];

        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                return res.status(400).json({"code":400,  "message": "Failed to save ticketLogDetails information..." });
            }

            res.status(200).json({ "code":200,
                 "message": "TicketLogDetails information saved successfully..."
            });
        });
    } catch (error) {
        console.log(error);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).json({ "code":500, "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        const query = `CALL sp_ticketLogDetails_update(?, ?, ?, ?, ?)`;
        const params = [
            req.body.ID,
            data.TICKET_ID,
            data.LOG_TEXT,
            data.LOG_DATETIME,
            systemDate
        ];

        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                return res.status(400).json({"code":400,  "message": "Failed to update ticketLogDetails information..." });
            }

            res.status(200).json({ "code":200,
                 "message": "TicketLogDetails information updated successfully..."
            });
        });
    } catch (error) {
        console.log(error);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).json({ "code":500, "message": "Something went wrong." });
    }
};
