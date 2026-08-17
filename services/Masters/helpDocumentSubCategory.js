const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var helpDocumentSubCategory = "help_document_sub_category";
var viewHelpDocumentSubCategory = "view_" + helpDocumentSubCategory;

function reqData(req) {
    var data = {
        CATEGORY_ID: req.body.CATEGORY_ID,
        NAME: req.body.NAME,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CATEGORY_ID').isInt().optional(),
        body('NAME').optional(),
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
        return res.status(400).json({  "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext+`CALL sp_helpDocumentSubCategory_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to get HelpDocumentSubCategory."
                    });
                }

               const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 184,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("catch error", error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_helpDocumentSubCategory_create(?,?,?,?)`,
            [
                data.CATEGORY_ID,
                data.NAME,
                data.STATUS,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to save HelpDocumentSubCategory." });
                }

                const r = result[0][0];
                if (r.code !== 200) return res.status(400).json({
                            "code": 300,
                            "message": "HelpDocumentSubCategory name already exists..."
                        });

                res.status(200).json({ "code": 200,  "message": "HelpDocumentSubCategory saved successfully..." });
            }
        );
    } catch (error) {
        console.log("catch error", error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const id = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_helpDocumentSubCategory_update(?,?,?,?,?)`,
            [
                id,
                data.CATEGORY_ID,
                data.NAME,
                data.STATUS,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to update HelpDocumentSubCategory." });
                }

                const r = result[0][0];
                if (r.code !== 200) return res.status(400).json({
                            "code": 300,
                            "message": "HelpDocumentSubCategory name already exists..."
                        });

                res.status(200).json({ "code": 200,  "message": "HelpDocumentSubCategory updated successfully..." });
            }
        );
    } catch (error) {
        console.log("catch error", error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};
