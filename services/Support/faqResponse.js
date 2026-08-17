const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
var faqResponse = "faq_responses";
var viewFaqResponse = "view_" + faqResponse;
const applicationkey = process.env.APPLICATION_KEY;

function reqData(req) {
    var data = {
        FAQ_MASTER_ID: req.body.FAQ_MASTER_ID,
        USER_MOBILE: req.body.USER_MOBILE ? req.body.USER_MOBILE : '',
        USER_EMAIL_ID: req.body.USER_EMAIL_ID ? req.body.USER_EMAIL_ID : '',
        SUGGESTION: req.body.SUGGESTION,
        STATUS: req.body.STATUS ? req.body.STATUS : 'P',
        USER_ID: req.body.USER_ID ? req.body.USER_ID : '',
        CLIENT_ID: req.body.CLIENT_ID,
        USER_TYPE: req.body.USER_TYPE,
        USER_NAME: req.body.USER_NAME
    }
    return data;
}

exports.validate = function () {
    return [
        body('FAQ_MASTER_ID').isInt().not().isEmpty().exists(),
        body('USER_EMAIL_ID', ' parameter missing').not().isEmpty().exists(),
        body('SUGGESTION', ' parameter missing').optional(),
        body('ID').optional(),
    ]
}

exports.validateUpdate = () => {
    return [
        body('STATUS').not().isEmpty().exists(),
        body('ID').not().isEmpty().exists()
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
            setContext + 'CALL sp_faqResponses_get()',
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
                    "TAB_ID": 173,
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
    const supportKey = req.headers['supportkey'];


    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }
    try {
        const params = [
            data.FAQ_MASTER_ID,
            data.USER_ID || null,
            data.USER_TYPE || null,
            data.USER_MOBILE || null,
            data.USER_EMAIL_ID || null,
            data.USER_NAME || null,
            data.SUGGESTION || null,
            data.STATUS || null,
            data.CLIENT_ID || null
        ];

        mm.executeQueryData(
            `CALL sp_faqResponse_create(?,?,?,?,?,?,?,?,?)`,
            params,
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code":400,
                         "message": "Failed to save FAQ response"
                    });
                }

                res.status(200).json({
                    "code": 200,
                     "message": "FAQ response processed successfully"
                });
            }
        );

    } catch (error) {
        console.log(error);
        res.status(500).json({
            "code":500,
             "message": "Something went wrong"
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const data = reqData(req);
    const ID = req.body.ID;

    if (!ID) {
        return res.status(400).json({
            "code":400,
             "message": "ID parameter missing"
        });
    }

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_faqResponse_update(?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.FAQ_MASTER_ID || null,
                data.USER_MOBILE || null,
                data.USER_EMAIL_ID || null,
                data.SUGGESTION || null,
                data.STATUS || null,
                data.USER_ID || null,
                data.CLIENT_ID || null,
                data.USER_TYPE || null,
                data.USER_NAME || null
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code":400,
                         "message": "Failed to update faqResponse information..."
                    });
                }

                // Extra logic stays SAME
                if (data.STATUS === 'A') {
                    req.body.ID = data.FAQ_MASTER_ID;
                    require('./faq').update(req, res);
                } else {
                    res.status(200).json({
                        "code":200,
                         "message": "FaqResponse information updated successfully..."
                    });
                }
            }
        );

    } catch (error) {
        console.log(error);
        res.status(500).json({
            "code":500,
             "message": "Something went wrong."
        });
    }
};
