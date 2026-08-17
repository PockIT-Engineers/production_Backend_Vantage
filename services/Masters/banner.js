const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var bannerMaster = "banner_master";
var viewbannerMaster = "view_" + bannerMaster;

function reqData(req) {

    var data = {
        TITLE: req.body.TITLE,
        TITLE_COLOR: req.body.TITLE_COLOR,
        SUB_TITLE: req.body.SUB_TITLE,
        SUB_TITLE_COLOR: req.body.SUB_TITLE_COLOR,
        SUB_TITLE_1: req.body.SUB_TITLE_1,
        SUB_TITLE_COLOR_1: req.body.SUB_TITLE_COLOR_1,
        STATUS: req.body.STATUS ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO,
        IMAGE_URL: req.body.IMAGE_URL,
        CLIENT_ID: req.body.CLIENT_ID,
        IS_FOR_SHOP: req.body.IS_FOR_SHOP ? '1' : '0',
        BANNER_TYPE: req.body.BANNER_TYPE,
        BANNER_FOR: req.body.BANNER_FOR, 
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
    }
    return data;
}

exports.validate = function () {
    return [
        body('TITLE').optional(),
        body('TITLE_COLOR').optional(),
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
            setContext+'CALL sp_bannerMaster_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get banner data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 153,
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
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        const data = reqData(req);

        mm.executeQueryData(
            `CALL sp_bannerMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.TITLE,
                data.TITLE_COLOR,
                data.SUB_TITLE,
                data.SUB_TITLE_COLOR,
                data.SUB_TITLE_1,
                data.SUB_TITLE_COLOR_1,
                data.STATUS,
                data.SEQ_NO,
                data.IMAGE_URL,
                data.CLIENT_ID,
                data.IS_FOR_SHOP,
                data.BANNER_TYPE,
                data.BANNER_FOR,
                data.CUSTOMER_TYPE
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": "Failed to create banner." });
                }

                const response = results[0][0];

                if (response.code === 200) {
                    const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has added a new banner code.`;
                    const logCategory = "banner";

                    let actionLog = {
                        SOURCE_ID: response.data,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: ACTION_DETAILS,
                        CATEGORY: logCategory,
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: 0
                    };

                    // systemLog.create(actionLog);
                }

                return res.status(200).json({
                    "code": 200,
                     "message": "banner information saved successfully"
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong"
        });
    }
};


exports.update = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        const data = reqData(req);

        mm.executeQueryData(
            `CALL sp_bannerMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.TITLE,
                data.TITLE_COLOR,
                data.SUB_TITLE,
                data.SUB_TITLE_COLOR,
                data.SUB_TITLE_1,
                data.SUB_TITLE_COLOR_1,
                data.STATUS,
                data.SEQ_NO,
                data.IMAGE_URL,
                data.CLIENT_ID,
                data.IS_FOR_SHOP,
                data.BANNER_TYPE,
                data.BANNER_FOR,
                data.CUSTOMER_TYPE
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error",error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to update banner." });
                }

                const response = results[0][0];

                if (response.code === 200) {
                    const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of banner code.`;
                    const logCategory = "banner";

                    let actionLog = {
                        SOURCE_ID: req.body.ID,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: ACTION_DETAILS,
                        CATEGORY: logCategory,
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: 0
                    };

                     // systemLog.create(actionLog);
                }

                return res.status(200).json({
                    "code": 200,
                     "message": 'banner information updated successfully...'
                });
            }
        );
    } catch (error) {
       console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong"
        });
    }
};