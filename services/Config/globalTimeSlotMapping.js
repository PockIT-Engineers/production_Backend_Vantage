const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var globalTimeSlotMapping = "global_time_slots_mapping";
var viewglobalTimeSlotMapping = "view_" + globalTimeSlotMapping;

function reqData(req) {
    var data = {
        ORG_ID: req.body.ORG_ID,
        MAPPING_FOR: req.body.MAPPING_FOR,
        MAPPING_ID: req.body.MAPPING_ID,
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
        return res.send({
            "code": 400,
             "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_globaTimeSlotsMapping_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400,  "message": 'Failed to get global time slot mapping data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 163,
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
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const data = reqData(req);

    if (!errors.isEmpty()) {
        return res.send({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_globaTimeSlotsMapping_create(?,?,?,?,?,?,?,?,?,?)`,
            [
                data.ORG_ID,
                data.MAPPING_FOR,
                data.MAPPING_ID,
                data.SLOT1_START_TIME,
                data.SLOT1_END_TIME,
                data.SLOT2_START_TIME,
                data.SLOT2_END_TIME,
                data.SLOT3_START_TIME,
                data.SLOT3_END_TIME,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        "code": 400,
                         "message": "Failed to save global time slot mapping information."
                    });
                }

                res.send({
                    "code": 200,
                     "message": "Global time slot mapping information saved successfully."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!req.body.ID) {
        return res.send({
            "code": 400,
             "message": "ID is required for update."
        });
    }

    if (!errors.isEmpty()) {
        return res.send({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_globaTimeSlotsMapping_update(?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                req.body.ORG_ID || null,
                req.body.MAPPING_FOR || null,
                req.body.MAPPING_ID || null,
                req.body.SLOT1_START_TIME || null,
                req.body.SLOT1_END_TIME || null,
                req.body.SLOT2_START_TIME || null,
                req.body.SLOT2_END_TIME || null,
                req.body.SLOT3_START_TIME || null,
                req.body.SLOT3_END_TIME || null,
                req.body.CLIENT_ID || null
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        "code": 400,
                         "message": "Failed to update global time slot mapping information."
                    });
                }

                res.send({
                    "code": 200,
                     "message": "Global time slot mapping information updated successfully."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};
