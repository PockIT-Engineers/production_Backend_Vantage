const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var inventoryAccountTransaction = "inventory_account_transaction";
var viewInventoryAccountTransaction = "view_" + inventoryAccountTransaction;

function reqData(req) {

    var data = {
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        TRANSACTION_DATE: req.body.TRANSACTION_DATE,
        TRANSACTION_TYPE: req.body.TRANSACTION_TYPE ? '1' : '0',
        MOVEMENT_ID: req.body.MOVEMENT_ID,
        ITEM_ID: req.body.ITEM_ID,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        REMARKS: req.body.REMARKS,
        ADJUSTMENT_ID: req.body.ADJUSTMENT_ID,
        INWARD_ID: req.body.INWARD_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
        IS_VARIANT: req.body.IS_VARIANT,
        PARENT_ID: req.body.PARENT_ID,
        IN_QTY: req.body.IN_QTY,
        OUT_QTY: req.body.OUT_QTY,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        ORDER_ID: req.body.ORDER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        GATEWAY_TYPE: req.body.GATEWAY_TYPE ? '1' : '0',
        BATCH_NO: req.body.BATCH_NO,
        SERIAL_NO: req.body.SERIAL_NO,
        ACTUAL_UNIT_ID: req.body.ACTUAL_UNIT_ID,
        ACTUAL_UNIT_NAME: req.body.ACTUAL_UNIT_NAME,
    }
    return data;
}

exports.validate = function () {
    return [
        body('TRANSACTION_DATE').optional(),
        body('TRANSACTION_TYPE').optional(),
        body('MOVEMENT_ID').isInt(),
        body('ITEM_ID').isInt(),
        body('WAREHOUSE_ID').isInt(),
        body('REMARKS').optional(),
        body('ADJUSTMENT_ID').isInt(),
        body('INWARD_ID').isInt(),
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
            setContext + 'CALL sp_inventoryAccountTransaction_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventory data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 194,
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
        `CALL sp_inventoryAccountTransaction_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            data.TRANSACTION_ID,
            data.TRANSACTION_DATE,
            data.TRANSACTION_TYPE,
            data.MOVEMENT_ID,
            data.ITEM_ID,
            data.WAREHOUSE_ID,
            data.REMARKS,
            data.ADJUSTMENT_ID,
            data.INWARD_ID,
            data.CLIENT_ID,
            data.INVENTORY_TRACKING_TYPE,
            data.IS_VARIANT,
            data.PARENT_ID,
            data.IN_QTY,
            data.OUT_QTY,
            data.QUANTITY_PER_UNIT,
            data.TECHNICIAN_ID,
            data.ORDER_ID,
            data.JOB_CARD_ID,
            data.GATEWAY_TYPE,
            data.BATCH_NO,
            data.SERIAL_NO,
            data.ACTUAL_UNIT_ID,
            data.ACTUAL_UNIT_NAME
        ],
        supportKey,
        (error) => {
            if (error) {
                console.log("error",error)
                return res.status(400).json({ "code": 400,  "message": "Failed to save inventoryAccountTransaction information..." });
            }
            res.status(200).json({ "code": 200,  "message": "InventoryAccountTransaction information saved successfully..." });
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
        `CALL sp_inventoryAccountTransaction_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            data.TRANSACTION_ID,
            data.TRANSACTION_DATE,
            data.TRANSACTION_TYPE,
            data.MOVEMENT_ID,
            data.ITEM_ID,
            data.WAREHOUSE_ID,
            data.REMARKS,
            data.ADJUSTMENT_ID,
            data.INWARD_ID,
            data.CLIENT_ID,
            data.INVENTORY_TRACKING_TYPE,
            data.IS_VARIANT,
            data.PARENT_ID,
            data.IN_QTY,
            data.OUT_QTY,
            data.QUANTITY_PER_UNIT,
            data.TECHNICIAN_ID,
            data.ORDER_ID,
            data.JOB_CARD_ID,
            data.GATEWAY_TYPE,
            data.BATCH_NO,
            data.SERIAL_NO,
            data.ACTUAL_UNIT_ID,
            data.ACTUAL_UNIT_NAME
        ],
        supportKey,
        (error) => {
            if (error) {
                console.log("error",error)
                return res.status(400).json({ "code": 400,  "message": "Failed to update inventoryAccountTransaction information." });
            }
            res.status(200).json({ "code": 200,  "message": "InventoryAccountTransaction information updated successfully..." });
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
