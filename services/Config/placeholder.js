const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var placeholderMaster = "placeholder_master";
var viewPlaceholderMaster = "view_" + placeholderMaster;


function reqData(req) {

    var data = {
        LABEL: req.body.LABEL,
        TABLE_COLUMN: req.body.TABLE_COLUMN,
        TABLE_NAME: req.body.TABLE_NAME,
        TEMPLATE_CATEGORY_ID: req.body.TEMPLATE_CATEGORY_ID,
        DESCRIPTION: req.body.DESCRIPTION,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        PLACEHOLDER_TYPE: req.body.PLACEHOLDER_TYPE,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('LABEL').optional(),
        body('KEY').optional(),
        body('TABLE_NAME').optional(),
        body('TEMPLATE_CATEGORY_ID').isInt().optional(),
        body('DESCRIPTION').optional(),
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
        SET @v_SORT_KEY = '${sortKey||"ID"}';
        SET @v_SORT_VALUE = '${sortValue||"DESC"}';
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
            setContext + 'CALL sp_placeholder_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get placeholder data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 164,
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

exports.getTableData = (req, res) => {
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
        return res.status(400).json({
            "code": 400,
             "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_placeholder_getTableData()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get placeholder data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 16,
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
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    try{
    mm.executeQueryData(
        `CALL sp_placeholder_create(?,?,?,?,?,?,?,?)`,
        [
            data.LABEL,
            data.TABLE_COLUMN,
            data.TABLE_NAME,
            data.TEMPLATE_CATEGORY_ID,
            data.DESCRIPTION,
            data.IS_ACTIVE,
            data.PLACEHOLDER_TYPE,
            data.CLIENT_ID
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log(error);
                return res.status(400).json({ "code": 400,  "message": "Failed to save placeholder information..." });
            }
            res.status(200).json({ "code": 200,  "message": "Placeholder saved successfully", data: results[0][0] });
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

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    try{
    mm.executeQueryData(
        `CALL sp_placeholder_update(?,?,?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            data.LABEL,
            data.TABLE_COLUMN,
            data.TABLE_NAME,
            data.TEMPLATE_CATEGORY_ID,
            data.DESCRIPTION,
            data.IS_ACTIVE,
            data.PLACEHOLDER_TYPE,
            data.CLIENT_ID
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log(error);
                return res.status(400).json({ "code": 400,  "message": "Failed to update placeholder information..." });
            }
            res.status(200).json({ "code": 200,  "message": "Placeholder updated successfully", data: results[0][0] });
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
