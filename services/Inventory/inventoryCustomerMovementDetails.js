const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var inventoryCustomerMovementDetails = "inventory_customer_movement_details";
var viewinventoryCustomerMovementDetails = "view_" + inventoryCustomerMovementDetails;


function reqData(req) {

    var data = {
        VARIANT_ID: req.body.VARIANT_ID,
        INVENTORY_ID: req.body.INVENTORY_ID,
        MOVEMENT_ID: req.body.MOVEMENT_ID,
        VARIANT_NAME: req.body.VARIANT_NAME,
        VARIENT_DETAILS_ID: req.body.VARIENT_DETAILS_ID,
        INVENTORY_NAME: req.body.INVENTORY_NAME,
        QUANTITY: req.body.QUANTITY,
        INVENTROY_SUB_CAT_ID: req.body.INVENTROY_SUB_CAT_ID,
        INVENTORY_CAT_NAME: req.body.INVENTORY_CAT_NAME,
        INVENTROY_SUB_CAT_NAME: req.body.INVENTROY_SUB_CAT_NAME,
        INVENTORY_CAT_ID: req.body.INVENTORY_CAT_ID,
        UNIT_ID: req.body.UNIT_ID,
        UNIT_NAME: req.body.UNIT_NAME,
        IS_VARIENT: req.body.IS_VARIENT,
        INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
        PARENT_ID: req.body.PARENT_ID,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
        BATCH_NO: req.body.BATCH_NO,
        SERIAL_NO: req.body.SERIAL_NO,
        MOVEMENT_TYPE: req.body.MOVEMENT_TYPE,
        JOB_CARD_ID: req.body.JOB_CARD_ID,

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
            setContext + 'CALL sp_inventoryCustomerMovementDetails_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Customer Movement Details data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 223,
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
            setContext + 'CALL sp_inventoryCustomerMovementDetails_getById()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Customer Movement Details data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 223,
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
            setContext + 'CALL sp_inventoryCustomerMovementDetails_movementDetails()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Customer Movement Details data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 223,
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
        return res.status(422).send({ "message": errors.errors });
    }

    const params = [
        data.VARIANT_ID,
        data.INVENTORY_ID,
        data.MOVEMENT_ID,
        data.VARIANT_NAME,
        data.VARIENT_DETAILS_ID,
        data.INVENTORY_NAME,
        data.QUANTITY,
        data.INVENTROY_SUB_CAT_ID,
        data.INVENTORY_CAT_NAME,
        data.INVENTROY_SUB_CAT_NAME,
        data.INVENTORY_CAT_ID,
        data.UNIT_ID,
        data.UNIT_NAME,
        data.IS_VARIENT,
        data.INVENTORY_TRACKING_TYPE,
        data.PARENT_ID,
        data.QUANTITY_PER_UNIT,
        data.BATCH_NO,
        data.SERIAL_NO,
        data.MOVEMENT_TYPE,
        data.JOB_CARD_ID
    ];

    mm.executeQueryData(
        'CALL sp_inventoryCustomerMovementDetails_create (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        params,
        supportKey,
        (error) => {
            if (error) {
                console.log("error", error)
                return res.status(400).send({ "code": 400, "message": "Failed to save inventoryCustomerMovementDetails information..." });
            }
            res.status(200).send({ "code": 200, "message": "inventoryCustomerMovementDetails information saved successfully..." });
        }
    );
};

exports.update = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).send({ "message": errors.errors });
    }

    const params = [
        req.body.ID,
        data.VARIANT_ID || null,
        data.INVENTORY_ID || null,
        data.MOVEMENT_ID || null,
        data.VARIANT_NAME || null,
        data.VARIENT_DETAILS_ID || null,
        data.INVENTORY_NAME || null,
        data.QUANTITY || null,
        data.INVENTROY_SUB_CAT_ID || null,
        data.INVENTORY_CAT_NAME || null,
        data.INVENTROY_SUB_CAT_NAME || null,
        data.INVENTORY_CAT_ID || null,
        data.UNIT_ID || null,
        data.UNIT_NAME || null,
        data.IS_VARIENT || null,
        data.INVENTORY_TRACKING_TYPE || null,
        data.PARENT_ID || null,
        data.QUANTITY_PER_UNIT || null,
        data.BATCH_NO || null,
        data.SERIAL_NO || null,
        data.MOVEMENT_TYPE || null,
        data.JOB_CARD_ID || null
    ];

    mm.executeQueryData(
        'CALL sp_inventoryCustomerMovementDetails_update (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        params,
        supportKey,
        (error) => {
            if (error) {
                console.log("error", error)
                return res.status(400).send({ "code": 400, "message": "Failed to update inventoryCustomerMovementDetails information." });
            }
            res.status(200).send({ "code": 200, "message": "inventoryCustomerMovementDetails information updated successfully..." });
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
            setContext + 'CALL sp_inventoryCustomerMovementDetails_movementList()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Customer Movement Details data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 223,
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

exports.getCustomers = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : "IDS";
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
            setContext + 'CALL sp_inventoryCustomerMovementDetails_getCustomers()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Customer Movement Details data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 223,
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

exports.getTechnicians = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : "ID";
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let CUSTOMER_ID = req.body.CUSTOMER_ID;

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID || 0};
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
            setContext + 'CALL sp_inventoryCustomerMovementDetails_getTechnicians()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Customer Movement Details data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 223,
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

exports.getItemsToMovement = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : "ID";
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let CUSTOMER_ID = req.body.CUSTOMER_ID;
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID;

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID || 0};
        SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID || 0};
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
            setContext + 'CALL sp_inventoryCustomerMovementDetails_getItemsToMovement()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Customer Movement Details data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];
                const seenIDs = new Set();
                const seenInventoryDetailsIDs = new Set();
                const finalResults = [];

                for (const row of dataResult) {
                    // Only add the row if both its ID and INVENTORY_DETAILS_ID are unique
                    if (!seenIDs.has(row.ID) && !seenInventoryDetailsIDs.has(row.INVENTORY_DETAILS_ID)) {
                        seenIDs.add(row.ID);
                        seenInventoryDetailsIDs.add(row.INVENTORY_DETAILS_ID);
                        finalResults.push(row);
                    }
                }
                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 223,
                    "count": finalResults.length,
                    "data": finalResults
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
