const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var inventoryInwardDetails = "inventory_inward_details";
var viewInventoryInwardDetails = "view_" + inventoryInwardDetails;


function reqData(req) {

    var data = {
        INWARD_MASTER_ID: req.body.INWARD_MASTER_ID,
        UNIQUE_NO: req.body.UNIQUE_NO,
        GUARANTTEE_IN_DAYS: req.body.GUARANTTEE_IN_DAYS,
        WARANTEE_IN_DAYS: req.body.WARANTEE_IN_DAYS,
        EXPIRY_DATE: req.body.EXPIRY_DATE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('INWARD_MASTER_ID').isInt().optional(),
        body('UNIQUE_NO').optional(),
        body('GUARANTTEE_IN_DAYS').isInt().optional(),
        body('WARANTEE_IN_DAYS').isInt().optional(),
        body('EXPIRY_DATE').optional(),
        body('ID').optional(),
    ]
}

exports.getAll = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : "ID";
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
            setContext + 'CALL sp_inventoryInwardDetails_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventoryInwardDetails data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 198,
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

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var ID = req.params.id;
    var pageIndex = req.query.pageIndex ? req.query.pageIndex : '';
    var pageSize = req.query.pageSize ? req.query.pageSize : '';
    let sortKey = req.query.sortKey ? req.query.sortKey : "ID";
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';


    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_ID = ${ID || 0};
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
            setContext + 'CALL sp_inventoryInwardDetails_getById()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventoryInwardDetails data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 198,
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

exports.inwardDetails = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var ID = req.params.id;
    var pageIndex = req.query.pageIndex ? req.query.pageIndex : '';
    var pageSize = req.query.pageSize ? req.query.pageSize : '';
    let sortKey = req.query.sortKey ? req.query.sortKey : "ID";
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';


    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_ID = ${ID || 0};
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
            setContext + 'CALL sp_inventoryInwardDetails_inwardDetails()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventoryInwardDetails data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 198,
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

    try {
        mm.executeQueryData(
            `CALL sp_inventoryInwardDetails_create(?,?,?,?,?,?)`,
            [
                data.INWARD_MASTER_ID,
                data.UNIQUE_NO,
                data.GUARANTTEE_IN_DAYS,
                data.WARANTEE_IN_DAYS,
                data.EXPIRY_DATE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error",error)
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to save inventory inward details."
                    });
                }

                res.status(200).json({
                    "code": 200,
                     "message": "InventoryInwardDetails saved successfully.",
                    data: results[0][0]
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

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    try{
    mm.executeQueryData(
        `CALL sp_inventoryInwardDetails_update(?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            data.INWARD_MASTER_ID || null,
            data.UNIQUE_NO || null,
            data.GUARANTTEE_IN_DAYS || null,
            data.WARANTEE_IN_DAYS || null,
            data.EXPIRY_DATE || null,
            data.CLIENT_ID || null
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log("error",error)
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to update inventory inward details."
                });
            }

            res.status(200).json({
                "code": 200,
                 "message": "InventoryInwardDetails updated successfully.",
                data: results[0][0]
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
