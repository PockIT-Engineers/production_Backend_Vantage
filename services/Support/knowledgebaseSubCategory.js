const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var knowledgebaseSubCategoryMaster = "knowledgebase_sub_category_master";
var viewKnowledgebaseSubCategoryMaster = "view_" + knowledgebaseSubCategoryMaster;

function reqData(req) {
    var data = {
        KNOWLEDGEBASE_CATEGORY_ID: req.body.KNOWLEDGEBASE_CATEGORY_ID,
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('KNOWLEDGEBASE_CATEGORY_ID').isInt(),
        body('NAME', ' parameter missing').exists(),
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
            setContext + 'CALL sp_knowledgebaseSubCategoryMaster_get()',
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
                    "TAB_ID": 58,
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
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    try {
        const query = `CALL sp_knowledgebaseSubCategoryMaster_create(?,?,?,?,?)`;
        const params = [
            data.KNOWLEDGEBASE_CATEGORY_ID,
            data.NAME,
            data.DESCRIPTION,
            data.IS_ACTIVE,
            data.CLIENT_ID
        ];

        mm.executeQueryData(query, params, supportKey, (error) => {
            if (error) {
                console.log("error", error)
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to save knowledgebaseSubCategory information..."
                });
            }

            res.status(200).json({
                "code": 200,
                 "message": "KnowledgebaseSubCategory information saved successfully..."
            });
        });
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    try {
        const query = `CALL sp_knowledgebaseSubCategoryMaster_update(?,?,?,?,?,?,?)`;
        const params = [
            req.body.ID,
            data.KNOWLEDGEBASE_CATEGORY_ID,
            data.NAME,
            data.DESCRIPTION,
            data.IS_ACTIVE,
            data.CLIENT_ID,
            systemDate
        ];

        mm.executeQueryData(query, params, supportKey, (error) => {
            if (error) {
                console.log("error", error)
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to update knowledgebaseSubCategory information."
                });
            }

            res.status(200).json({
                "code": 200,
                 "message": "KnowledgebaseSubCategory information updated successfully."
            });
        });
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};
