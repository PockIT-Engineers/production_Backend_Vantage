const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var saveFilter = "save_filter";
var viewSaveFilter = "view_" + saveFilter;


function reqData(req) {

    var data = {
        TAB_ID: req.body.TAB_ID,
        USER_ID: req.body.USER_ID,
        FILTER_NAME: req.body.FILTER_NAME,
        FILTER_QUERY: req.body.FILTER_QUERY,
        FILTER_JSON: req.body.FILTER_JSON,
        SHOW_QUERY: req.body.SHOW_QUERY,
        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('TAB_ID').optional(),
        body('USER_ID').isInt().optional(),
        body('FILTER_NAME').optional(),
        body('FILTER_QUERY').optional(),
        body('FILTER_JSON').optional(),
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
        return res.status(400).json({
            "code": 400,
             "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_saveFilter_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get saveFilter data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
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

    if (data.FILTER_QUERY && typeof data.FILTER_QUERY === 'object') {
        data.FILTER_QUERY = JSON.stringify(data.FILTER_QUERY);
    }

    try{
    mm.executeQueryData(
        `CALL sp_saveFilter_create(?,?,?,?,?,?,?)`,
        [
            data.TAB_ID,
            data.USER_ID,
            data.FILTER_NAME,
            data.FILTER_QUERY,
            data.FILTER_JSON,
            data.SHOW_QUERY,
            data.CLIENT_ID
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log("error", error)
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to save filter information..."
                });
            }
            res.status(200).json(results[0][0]);
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
    const supportKey = req.headers['supportkey'];
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    if (data.FILTER_QUERY && typeof data.FILTER_QUERY === 'object') {
        data.FILTER_QUERY = JSON.stringify(data.FILTER_QUERY);
    }

    try{
    mm.executeQueryData(
        `CALL sp_saveFilter_update(?,?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            data.TAB_ID || null,
            data.USER_ID || null,
            data.FILTER_NAME || null,
            data.FILTER_QUERY || null,
            data.FILTER_JSON || null,
            data.SHOW_QUERY || null,
            data.CLIENT_ID || null
        ],
        supportKey,
        (error, results) => {
            if (error) {
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to update save filter information."
                });
            }
            res.status(200).json(results[0][0]);
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


exports.delete = (req, res) => {
    const supportKey = req.headers['supportkey'];

    try{
    mm.executeQueryData(
        `CALL sp_saveFilter_delete(?)`,
        [req.params.id],
        supportKey,
        (error, results) => {
            if (error) {
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to delete save filter information."
                });
            }
            res.status(200).json(results[0][0]);
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
