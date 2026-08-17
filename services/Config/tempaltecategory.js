const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var tempalteCategoryMaster = "tempalte_category_master";
var viewTempalteCategoryMaster = "view_" + tempalteCategoryMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        SEQ_NO: req.body.SEQ_NO,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('SEQ_NO').isInt().optional(),
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
            setContext + 'CALL sp_templateCategory_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get templateCategory data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 160,
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
    mm.executeQueryData(`CALL sp_templateCategory_create(?, ?, ?, ?, ?)`, [data.NAME, data.DESCRIPTION, data.SEQ_NO, data.IS_ACTIVE, data.CLIENT_ID], supportKey, (error, results) => {
        if (error) {
            console.log(error);
            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
            return res.status(400).json({ "code": 400,  "message": "Failed to save template category information." });
        }
        res.status(200).json({ "code": 200,  "message": "Template category information saved successfully." });
    });
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
    const ID = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }
    try{
    mm.executeQueryData(`CALL sp_templateCategory_update(?, ?, ?, ?, ?, ?)`, [ID, data.NAME, data.DESCRIPTION, data.SEQ_NO, data.IS_ACTIVE, data.CLIENT_ID], supportKey, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(400).json({ "code": 400,  "message": "Failed to update template category information." });
        }
        res.status(200).json({ "code": 200,  "message": "Template category information updated successfully." });
    });
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};
