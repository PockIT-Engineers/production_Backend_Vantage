const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var inventoryTechnicianMovementDetails = "inventory_technician_movement_details";
var viewinventoryTechnicianMovementDetails = "view_" + inventoryTechnicianMovementDetails;


function reqData(req) {

    var data = {
        MOVEMENT_ID: req.body.MOVEMENT_ID,
        INVENTORY_ID: req.body.INVENTORY_ID,
        IS_VARIENT: req.body.IS_VARIENT,
        INVENTORY_NAME: req.body.INVENTORY_NAME,
        INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
        QUANTITY: req.body.QUANTITY,
        UNIT_ID: req.body.UNIT_ID,
        UNIT_NAME: req.body.UNIT_NAME,
        PARENT_ID: req.body.PARENT_ID,
        VARIANT_NAME: req.body.VARIANT_NAME,
        CLIENT_ID: req.body.CLIENT_ID,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
        BATCH_NO: req.body.BATCH_NO,
        SERIAL_NO: req.body.SERIAL_NO,
        INVENTORY_CAT_ID: req.body.INVENTORY_CAT_ID,
        INVENTORY_CAT_NAME: req.body.INVENTORY_CAT_NAME,
        INVENTROY_SUB_CAT_ID: req.body.INVENTROY_SUB_CAT_ID,
        INVENTROY_SUB_CAT_NAME: req.body.INVENTROY_SUB_CAT_NAME,
        MOVEMENT_TYPE: req.body.MOVEMENT_TYPE
    }

    return data;
}
exports.validate = function () {
    return [
        body('MOVEMENT_ID').isInt().optional(),
        body('INVETORY_ID').isInt().optional(),
        body('MOVEMENT_TYPE').optional(),
        body('QUANTITY').isInt().optional(),
        body('UNIT_NAME').optional(),
        body('ID').optional(),
    ]
}

exports.getAll = (req, res) => {
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
            setContext + 'CALL sp_inventoryTechnicianMovementDetails_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventoryTechnicianMovementDetails data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 202,
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
    let keywords = req.query.keywords ? req.query.keywords : '';
    let sortKey = req.query.sortKey ? req.query.sortKey : keywords;
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
            setContext + 'CALL sp_inventoryTechnicianMovementDetails_getById()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventoryTechnicianMovementDetails data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 202,
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

exports.movementDetails = (req, res) => {
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
            setContext + 'CALL sp_inventoryTechnicianMovementDetails_movementDetails()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventoryTechnicianMovementDetails data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 202,
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
    const supportKey = req.headers['supportkey'];

    const params = [
        data.MOVEMENT_ID,
        data.INVENTORY_ID,
        data.IS_VARIENT,
        data.INVENTORY_NAME,
        data.INVENTORY_TRACKING_TYPE,
        data.QUANTITY,
        data.UNIT_ID,
        data.UNIT_NAME,
        data.PARENT_ID,
        data.VARIANT_NAME,
        data.CLIENT_ID,
        data.QUANTITY_PER_UNIT,
        data.BATCH_NO,
        data.SERIAL_NO,
        data.INVENTORY_CAT_ID,
        data.INVENTORY_CAT_NAME,
        data.INVENTROY_SUB_CAT_ID,
        data.INVENTROY_SUB_CAT_NAME,
        data.MOVEMENT_TYPE
    ];


    mm.executeQueryData(
        `CALL sp_inventoryTechnicianMovementDetails_create (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        params,
        supportKey,
        (error) => {
            if (error) {
                console.log("error", error)
                return res.status(400).json({ "code": 400, "message": 'Failed to get inventoryTechnicianMovementDetails data' });
            }
            res.status(200).send({ "message": "Created successfully" });
        }
    );
};

exports.update = (req, res) => {
    const data = reqData(req);
    const supportKey = req.headers['supportkey'];

    const params = [
        req.body.ID,
        data.MOVEMENT_ID,
        data.INVENTORY_ID,
        data.IS_VARIENT,
        data.INVENTORY_NAME,
        data.INVENTORY_TRACKING_TYPE,
        data.QUANTITY,
        data.UNIT_ID,
        data.UNIT_NAME,
        data.PARENT_ID,
        data.VARIANT_NAME,
        data.CLIENT_ID,
        data.QUANTITY_PER_UNIT,
        data.BATCH_NO,
        data.SERIAL_NO,
        data.INVENTORY_CAT_ID,
        data.INVENTORY_CAT_NAME,
        data.INVENTROY_SUB_CAT_ID,
        data.INVENTROY_SUB_CAT_NAME,
        data.MOVEMENT_TYPE
    ];

    mm.executeQueryData(
        `CALL sp_inventoryTechnicianMovementDetails_update (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        params,
        supportKey,
        (error) => {
            if (error) {
                console.log("error", error)
                return res.status(400).json({ "code": 400, "message": 'Failed to get inventoryTechnicianMovementDetails data' });
            }
            res.status(200).send({ "message": "Updated successfully" });
        }
    );
};


exports.movementList = (req, res) => {
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
            setContext + 'CALL sp_inventoryTechnicianMovementDetails_movementList()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventoryTechnicianMovementDetails data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 202,
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
