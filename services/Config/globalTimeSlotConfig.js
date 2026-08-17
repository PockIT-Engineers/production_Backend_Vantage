const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var globalTimeSlotConfig = "global_timeslots_settings";
var viewglobalTimeSlotConfig = "view_" + globalTimeSlotConfig;

function reqData(req) {
    var data = {
        ORG_ID: req.body.ORG_ID,
        SLOT1_START_TIME: req.body.SLOT1_START_TIME,
        SLOT1_END_TIME: req.body.SLOT1_END_TIME,
        SLOT2_START_TIME: req.body.SLOT2_START_TIME,
        SLOT2_END_TIME: req.body.SLOT2_END_TIME,
        SLOT3_START_TIME: req.body.SLOT3_START_TIME,
        SLOT3_END_TIME: req.body.SLOT3_END_TIME,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORG_ID').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let keywords = req.body.keywords ? req.body.keywords : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : keywords;
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
        return res.send({
            "code": 400,
             "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_globalTimeSlotConfig_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400,  "message": 'Failed to get globalTimeSlotConfig data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 162,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
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
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try{
    mm.executeQueryData(
        `CALL sp_globalTimeSlotConfig_create(?,?,?,?,?,?,?,?)`,
        [
            data.ORG_ID,
            data.SLOT1_START_TIME,
            data.SLOT1_END_TIME,
            data.SLOT2_START_TIME,
            data.SLOT2_END_TIME,
            data.SLOT3_START_TIME,
            data.SLOT3_END_TIME,
            data.CLIENT_ID
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log("error",error)
                return res.send({
                    "code": 400,
                     "message": "Failed to save global time slot config information..."
                });
            }
            res.send(results[0][0]);
        }
    );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const supportKey = req.headers['supportkey'];
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try{
    mm.executeQueryData(
        `CALL sp_globalTimeSlotConfig_update(?,?,?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            data.ORG_ID || null,
            data.SLOT1_START_TIME || null,
            data.SLOT1_END_TIME || null,
            data.SLOT2_START_TIME || null,
            data.SLOT2_END_TIME || null,
            data.SLOT3_START_TIME || null,
            data.SLOT3_END_TIME || null,
            data.CLIENT_ID || null
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log("error",error)
                return res.send({
                    "code": 400,
                     "message": "Failed to update global time slot config information."
                });
            }
            res.send(results[0][0]);
        }
    );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};


