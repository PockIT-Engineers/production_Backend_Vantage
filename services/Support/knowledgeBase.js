const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var knowledgeBaseMaster = "knowledge_base_master";
var viewKnowledgeBaseMaster = "view_" + knowledgeBaseMaster;

function reqData(req) {
    var data = {
        KNOWLEDGE_SUB_CATEGORY_ID: req.body.KNOWLEDGE_SUB_CATEGORY_ID,
        TITLE: req.body.TITLE,
        DESCRIPTION: req.body.DESCRIPTION,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        TYPE: req.body.TYPE,
        DOCUMENT: req.body.DOCUMENT,
        LINK: req.body.LINK,
        KNOWLEDGE_BASE_TYPE: req.body.KNOWLEDGE_BASE_TYPE
    }
    return data;
}

exports.validate = function () {
    return [
        body('KNOWLEDGE_SUB_CATEGORY_ID').isInt(),
        body('TITLE', ' parameter missing').exists(),
        body('DESCRIPTION').optional(),
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
            setContext + 'CALL sp_knowledgeBase_get()',
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
                    "TAB_ID": 57,
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
    const data = reqData(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        const query = `CALL sp_knowledgeBase_create(?,?,?,?,?,?,?,?,?)`;
        const params = [
            data.KNOWLEDGE_SUB_CATEGORY_ID,
            data.TITLE,
            data.DESCRIPTION,
            data.IS_ACTIVE,
            data.CLIENT_ID,
            data.TYPE,
            data.DOCUMENT,
            data.LINK,
            data.KNOWLEDGE_BASE_TYPE
        ];

        mm.executeQueryData(query, params, supportKey, (error) => {
            if (error) {
                console.log("error", error)
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to save knowledgeBase information..."
                });
            }

            res.status(200).json({
                "code": 200,
                 "message": "KnowledgeBase information saved successfully..."
            });
        });
    }
    catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const data = reqData(req);
    const ID = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }
    try {
        const query = `CALL sp_knowledgeBase_update(?,?,?,?,?,?,?,?,?,?)`;
        const params = [
            ID,
            data.KNOWLEDGE_SUB_CATEGORY_ID,
            data.TITLE,
            data.DESCRIPTION,
            data.IS_ACTIVE,
            data.CLIENT_ID,
            data.TYPE,
            data.DOCUMENT,
            data.LINK,
            data.KNOWLEDGE_BASE_TYPE
        ];

        mm.executeQueryData(query, params, supportKey, (error) => {
            if (error) {
                 console.log("error",error)
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to update knowledgeBase information..."
                });
            }

            res.status(200).json({
                "code": 200,
                 "message": "KnowledgeBase information updated successfully..."
            });
        });
    }
    catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};
