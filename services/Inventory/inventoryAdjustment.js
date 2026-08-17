const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const inwardLogSchema = require("../../modules/inwardLogs")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var inventoryAdjustment = "inventory_adjustment";
const async = require('async');
var viewInventoryAdjustment = "view_" + inventoryAdjustment;

function reqData(req) {
    var data = {
        ITEM_ID: req.body.ITEM_ID,
        OLD_QTY: req.body.OLD_QTY,
        ADJUSTMENT_QUANTITY: req.body.ADJUSTMENT_QUANTITY,
        NEW_QTY: req.body.NEW_QTY,
        ADJUSTMENT_TYPE: req.body.ADJUSTMENT_TYPE,
        ADJUSTMENT_REASON: req.body.ADJUSTMENT_REASON,
        VARIANT_ID: req.body.VARIANT_ID,
        VARIENT_DETAILS_ID: req.body.VARIENT_DETAILS_ID,
        INVENTORY_ID: req.body.INVENTORY_ID,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        ADJUSTED_DATETIME: req.body.ADJUSTED_DATETIME,
        ADJUSTED_BY: req.body.ADJUSTED_BY,
        CLIENT_ID: req.body.CLIENT_ID,
        ITEM_NAME: req.body.ITEM_NAME,
        WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
        VARIANT_NAME: req.body.VARIANT_NAME,
        OLD_QTY: req.body.OLD_QTY,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
        UNIT_ID: req.body.UNIT_ID,
        UNIT_NAME: req.body.UNIT_NAME,
        WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
        PO_NUMBER: req.body.PO_NUMBER,
        REMARK: req.body.REMARK
    }
    return data;
}

exports.validate = function () {
    return [
        body('ITEM_ID').isInt().optional(),
        body('OLD_QTY').isInt().optional(),
        body('ADJUSTMENT_QUANTITY').isInt().optional(),
        body('NEW_QTY').isInt().optional(),
        body('ADJUSTMENT_REASON').optional(),
        body('ADJUSTED_BY').optional(),
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
            setContext + 'CALL sp_inventoryAdjustment_get()',
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
                    "TAB_ID": 29,
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
            `CALL sp_inventoryAdjustment_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.ITEM_ID,                     // p_ITEM_ID
                data.OLD_QTY,                     // p_OLD_QTY
                data.ADJUSTMENT_QUANTITY,          // p_ADJUSTMENT_QUANTITY
                data.NEW_QTY,                     // p_NEW_QTY
                data.ADJUSTMENT_TYPE,             // p_ADJUSTMENT_TYPE
                data.ADJUSTMENT_REASON,            // p_ADJUSTMENT_REASON
                data.VARIANT_ID,                  // p_VARIANT_ID
                data.ADJUSTED_DATETIME,            // p_ADJUSTED_DATETIME
                data.ADJUSTED_BY,                 // p_ADJUSTED_BY
                data.CLIENT_ID,                   // p_CLIENT_ID
                data.ITEM_NAME,                   // p_ITEM_NAME
                data.WAREHOUSE_NAME,              // p_WAREHOUSE_NAME
                data.VARIANT_NAME,                // p_VARIANT_NAME
                data.UNIT_ID,                     // p_UNIT_ID
                data.UNIT_NAME,                   // p_UNIT_NAME
                data.QUANTITY_PER_UNIT,           // p_QUANTITY_PER_UNIT
                data.REMARK,                      // p_REMARK
                data.IS_VARIANT,                  // p_IS_VARIANT
                data.USER_ID,                     // p_USER_ID
                data.USER_NAME,                   // p_USER_NAME
                data.UNIQUE_NO,                   // p_UNIQUE_NO (BATCH / SERIAL)
                data.INVENTORY_TRACKING_TYPE   ,   // p_INVENTORY_TRACKING_TYPE,
                data.WAREHOUSE_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to save inventory adjustment information."
                    });
                }

                res.status(200).json({
                    "code": 200,
                     "message": "Inventory adjustment saved successfully.",
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

    try {
        mm.executeQueryData(
            `CALL sp_inventoryAdjustment_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
               data.ITEM_ID||null,                     // p_ITEM_ID
                data.OLD_QTY||null,                     // p_OLD_QTY
                data.ADJUSTMENT_QUANTITY||null,          // p_ADJUSTMENT_QUANTITY
                data.NEW_QTY||null,                     // p_NEW_QTY
                data.ADJUSTMENT_TYPE||null,             // p_ADJUSTMENT_TYPE
                data.ADJUSTMENT_REASON||null,            // p_ADJUSTMENT_REASON
                data.VARIANT_ID||null,                  // p_VARIANT_ID
                data.ADJUSTED_DATETIME||null,            // p_ADJUSTED_DATETIME
                data.ADJUSTED_BY||null,                 // p_ADJUSTED_BY
                data.CLIENT_ID||null,                   // p_CLIENT_ID
                data.ITEM_NAME||null,                   // p_ITEM_NAME
                data.WAREHOUSE_NAME||null,              // p_WAREHOUSE_NAME
                data.VARIANT_NAME||null,                // p_VARIANT_NAME
                data.UNIT_ID||null,                     // p_UNIT_ID
                data.UNIT_NAME||null,                   // p_UNIT_NAME
                data.REMARK||null,                      // p_REMARK
                data.IS_VARIANT||null,                  // p_IS_VARIANT
                data.USER_ID||null,                     // p_USER_ID
                data.USER_NAME||null,                   // p_USER_NAME
                data.UNIQUE_NO||null,                   // p_UNIQUE_NO (BATCH / SERIAL)
                data.INVENTORY_TRACKING_TYPE||null,   // p_INVENTORY_TRACKING_TYPE,
                data.WAREHOUSE_ID||null
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to update inventory adjustment information."
                    });
                }

                res.status(200).json({
                    "code": 200,
                     "message": "Inventory adjustment updated successfully.",
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

exports.adjustmentInventory = (req, res) => {
    let { CLIENT_ID, ADJUSTMENT_ARRAY, WAREHOUSE_NAME } = req.body;
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).send({
            "code": 422,
             "message": errors.array()
        });
    }

    if (!Array.isArray(ADJUSTMENT_ARRAY) || ADJUSTMENT_ARRAY.length === 0) {
        return res.status(400).send({
            "code": 400,
             "message": "ADJUSTMENT_ARRAY must be a non-empty array."
        });
    }

    const connection = mm.openConnection();
    const Logarray = [];

    try {
        async.eachSeries(
            ADJUSTMENT_ARRAY,
            (adjustmentItem, callback) => {
                mm.executeDML(
                    `CALL sp_inventoryAdjustment_adjustmentInventory(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        CLIENT_ID,
                        adjustmentItem.ITEM_ID,
                        adjustmentItem.OLD_QTY,
                        adjustmentItem.ADJUSTMENT_QUANTITY,
                        adjustmentItem.VARIANT_ID,
                        adjustmentItem.WAREHOUSE_ID,
                        req.body.authData.data.UserData[0].USER_ID,
                        req.body.authData.data.UserData[0].NAME,
                        adjustmentItem.ITEM_NAME,
                        adjustmentItem.WAREHOUSE_NAME,
                        adjustmentItem.VARIANT_NAME,
                        adjustmentItem.UNIT_ID,
                        adjustmentItem.UNIT_NAME,
                        adjustmentItem.ADJUSTMENT_TYPE,
                        adjustmentItem.REMARK,
                        adjustmentItem.IS_VERIENT,
                        adjustmentItem.UNIQUE_NO,
                        adjustmentItem.INVENTORY_TRACKING_TYPE,
                        adjustmentItem.PARENT_ID,
                        adjustmentItem.QUANTITY_PER_UNIT
                    ],
                    supportKey,
                    connection,
                    (error, results) => {
                        if (error) {
                            console.error(error);
                            return callback(error);
                        }

                        const ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has adjusted the stock for ${adjustmentItem.ITEM_NAME} in the warehouse ${adjustmentItem.WAREHOUSE_NAME}.`;

                        Logarray.push({
                            ACTION_TYPE: "Adjusted",
                            ACTION_DETAILS: ACTION_LOG,
                            ACTION_DATE: new Date(),
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                            INVENTORY_ID: adjustmentItem.ITEM_ID,
                            INVENTORY_NAME: adjustmentItem.ITEM_NAME,
                            WAREHOUSE_ID: adjustmentItem.WAREHOUSE_ID,
                            WAREHOUSE_NAME: adjustmentItem.WAREHOUSE_NAME,
                            VARIANT_ID: adjustmentItem.VARIANT_ID,
                            IS_VERIANT: adjustmentItem.IS_VERIENT,
                            VARIANT_NAME: adjustmentItem.VARIANT_NAME || "",
                            QUANTITY: adjustmentItem.ADJUSTMENT_QUANTITY,
                            ADJUSTMENT_TYPE: adjustmentItem.ADJUSTMENT_TYPE,
                            OLD_STOCK: adjustmentItem.OLD_QTY || 0,
                            QUANTITY_PER_UNIT: adjustmentItem.QUANTITY_PER_UNIT || 0,
                            UNIT_ID: adjustmentItem.UNIT_ID,
                            UNIT_NAME: adjustmentItem.UNIT_NAME,
                            REASON: adjustmentItem.REMARK || "",
                            STATUS: "COMPLETED",
                            REMARK: adjustmentItem.REMARK || ""
                        });

                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,
                            8,
                            "Inventory Adjustment",
                            `Hello Admin, The stock of ${adjustmentItem.ITEM_NAME} has been adjusted on ${mm.getSystemDate()}.`,
                            "",
                            "IA",
                            supportKey,
                            "I",
                            []
                        );

                        callback();
                    }
                );

            },
            (error) => {
                if (error) {
                    console.error(error);
                    mm.rollbackConnection(connection);
                    return res.status(400).send({
                        "code": 400,
                         "message": "Failed to save inventory adjustment information."
                    });
                }
                dbm.saveLog(Logarray, inwardLogSchema);
                mm.commitConnection(connection);
                res.status(200).send({
                    "code": 200,
                     "message": "Inventory adjustment information saved successfully."
                });
            }
        );
    } catch (error) {
        mm.rollbackConnection(connection);
        console.error(error);
        res.status(500).send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};