const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var ticketGroupMaster = "ticket_group_master";
var viewTicketGroupMaster = "view_" + ticketGroupMaster;

function reqData(req) {
    var data = {
        PARENT_ID: req.body.PARENT_ID,
        TYPE: req.body.TYPE,
        VALUE: req.body.VALUE,
        URL: req.body.URL,
        SEQ_NO: req.body.SEQ_NO,
        IS_LAST: req.body.IS_LAST ? '1' : '0',
        ALERT_MSG: req.body.ALERT_MSG,
        STATUS: req.body.STATUS ? '1' : '0',
        PRIORITY: req.body.PRIORITY,
        DEPARTMENT_ID: req.body.DEPARTMENT_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        ORG_ID: req.body.ORG_ID,
        TICKET_TYPE: req.body.TICKET_TYPE
    }
    return data;
}

exports.validate = function () {
    return [
        body('PARENT_ID').isInt(),
        body('TYPE', ' parameter missing').exists(),
        body('VALUE', ' parameter missing').exists(),
        body('URL', ' parameter missing').exists(),
        body('SEQ_NO').isInt(),
        body('ALERT_MSG', ' parameter missing').exists(),
        body('PRIORITY', ' parameter missing').exists(),
        body('DEPARTMENT_ID').isInt(),
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
            setContext + 'CALL sp_ticketGroup_get()',
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
                    "TAB_ID": 169,
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

exports.ticketGroups = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var ID = req.body.ID

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_ID= ${ID || 0};
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
            setContext + 'CALL sp_ticketGroup_ticketGroups()',
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
                    "TAB_ID": 169,
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
        const query = `CALL sp_ticketGroup_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            data.PARENT_ID,
            data.TYPE,
            data.VALUE,
            data.URL,
            data.SEQ_NO,
            data.IS_LAST,
            data.ALERT_MSG,
            data.STATUS,
            data.PRIORITY,
            data.DEPARTMENT_ID,
            data.CLIENT_ID,
            data.ORG_ID,
            data.TICKET_TYPE
        ];

        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                return res.status(400).json({"code":400,  "message": "Failed to save ticketGroup information..." });
            }

            res.status(200).json({ "code":200,
                 "message": "TicketGroup information saved successfully..."
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
        const query = `CALL sp_ticketGroup_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            req.body.ID,
            data.PARENT_ID,
            data.TYPE,
            data.VALUE,
            data.URL,
            data.SEQ_NO,
            data.IS_LAST,
            data.ALERT_MSG,
            data.STATUS,
            data.PRIORITY,
            data.DEPARTMENT_ID,
            data.CLIENT_ID,
            data.ORG_ID,
            data.TICKET_TYPE,
            systemDate
        ];

        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                return res.status(400).json({cod:400,  "message": "Failed to update ticketGroup information..." });
            }

            res.status(200).json({ "code":200,
                 "message": "TicketGroup information updated successfully..."
            });
        });
    } catch (error) {
        console.log(error);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).json({ "code":500, "message": "Something went wrong." });
    }
};



exports.getParent = (req, res) => {
    const supportKey = req.headers['supportkey'];
   
    var TICKET_GROUP_ID = req.body.TICKET_GROUP_ID;

    const setContext = `
        SET @v_TICKET_GROUP_ID= ${TICKET_GROUP_ID || 0};
    `;
    try {
        mm.executeQueryData(
            setContext + 'CALL sp_ticketGroup_getParent()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 169,
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