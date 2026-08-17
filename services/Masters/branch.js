const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
var branchMaster = "branch_master";
var viewBranchMaster = "view_" + branchMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        ADDRESS: req.body.ADDRESS,
        STATE_ID: req.body.STATE_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO,
        ORG_ID: req.body.ORG_ID,
        "code": req.body.CODE,
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
        PINCODE: req.body.PINCODE,

    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('ADDRESS').optional(),
        body('STATE_ID').isInt().optional(),
        body('PINCODE_ID').optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('SEQ_NO').isInt().optional(),
        body('ORG_ID').isInt().optional(),
        body('CODE').optional(),
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
            setContext+'CALL sp_branchMaster_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(400).json({
                        "code": 400,
                         "message": 'Failed to fetch branch data'
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 4,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};


exports.create = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const errors = validationResult(req);
    const data = reqData(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            'CALL sp_branchMaster_create(?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                data.NAME,
                data.ADDRESS,
                data.STATE_ID,
                data.DISTRICT_ID,
                data.PINCODE_ID,
                data.PINCODE,
                data.COUNTRY_ID,
                data.IS_ACTIVE,
                data.SEQ_NO,
                data.ORG_ID,
                data.CODE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to save branch information."
                    });
                }

                const response = results[0][0];

                if (response.code !== 200) {
                    return res.status(200).json(response);
                }

                /* Mongo / System Log */
                const ACTION_DETAILS =
                    `User ${req.body.authData.data.UserData[0].NAME} has created a new branch ${data.NAME}.`;

                const actionLog = {
                    SOURCE_ID: response.data,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "branch",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                };

                dbm.saveLog(actionLog, systemLog);

                return res.status(200).json({
                    "code": response.code,
                     "message": response.message
                });
            }
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};


exports.update = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const errors = validationResult(req);
    const data = reqData(req);
    const branchId = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            'CALL sp_branchMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                branchId,
                data.NAME,
                data.ADDRESS,
                data.STATE_ID,
                data.DISTRICT_ID,
                data.PINCODE_ID,
                data.PINCODE,
                data.COUNTRY_ID,
                data.IS_ACTIVE,
                data.SEQ_NO,
                data.ORG_ID,
                data.CODE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to update branch information."
                    });
                }

                const response = results[0][0];

                if (response.code !== 200) {
                    return res.status(200).json(response);
                }

                /* Mongo / System Log */
                const ACTION_DETAILS =
                    `User ${req.body.authData.data.UserData[0].NAME} has updated branch ${data.NAME}.`;

                const actionLog = {
                    SOURCE_ID: branchId,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "branch",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                };

                dbm.saveLog(actionLog, systemLog);

                return res.status(200).json({
                    "code": response.code,
                     "message": response.message
                });
            }
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};