const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var technicianTimeTrack = "technician_time_track";
var viewTechnicianTimeTrack = "view_" + technicianTimeTrack;

// Conversion Done/ 
function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        DATE: req.body.DATE,
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        TOTAL_TIME: req.body.TOTAL_TIME,
        TASK_DESCRIPTION: req.body.TASK_DESCRIPTION,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('JOB_CARD_ID').isInt().optional(),
        body('DATE').optional(),
        body('START_TIME').optional(),
        body('END_TIME').optional(),
        body('TOTAL_TIME').optional(),
        body('TASK_DESCRIPTION').optional(),
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
            setContext + 'CALL sp_technicianTimeTrack_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get data' });
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
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) return res.status(422).json({code:422, message: errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_technicianTimeTrack_create(?,?,?,?,?,?,?,?)`,
            [
                data.TECHNICIAN_ID, data.JOB_CARD_ID, data.DATE, data.START_TIME,
                data.END_TIME, data.TOTAL_TIME, data.TASK_DESCRIPTION, data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error",error)
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    return res.status(400).json({code:400, message: "Failed to save technicianTimeTrack information..." });
                }
                res.status(200).json({code:200, message: "TechnicianTimeTrack information saved successfully..." });
            }
        );
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).json({code:500, message: "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) return res.status(422).json({code:422, message: errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_technicianTimeTrack_update(?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID, data.TECHNICIAN_ID, data.JOB_CARD_ID, data.DATE,
                data.START_TIME, data.END_TIME, data.TOTAL_TIME, data.TASK_DESCRIPTION,
                data.CLIENT_ID, systemDate
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error",error)
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    return res.status(400).json({code:400, message: "Failed to update technicianTimeTrack information." });
                }
                res.status(200).json({code:200, message: "TechnicianTimeTrack information updated successfully..." });
            }
        );
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).json({ message: "Something went wrong." });
    }
};