const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async')
const applicationkey = process.env.APPLICATION_KEY;
const inwardLogSchema = require("../../modules/inwardLogs")
const dbm = require('../../utilities/dbMongo');
var inventoryInward = "inventory_inward";
var viewInventoryInward = "view_" + inventoryInward;


function reqData(req) {

    var data = {
        ID: req.body.ID,
        INWARD_MASTER_ID: req.body.INWARD_MASTER_ID,
        INWARD_ITEM_ID: req.body.INWARD_ITEM_ID,
        INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
        INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
        QUANTITY: req.body.QUANTITY,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
        UNIT_ID: req.body.UNIT_ID,
        PARENT_ID: req.body.PARENT_ID,
        IS_VARIANT: req.body.IS_VARIANT ? '1' : '0',
        UNIQUE_NO: req.body.UNIQUE_NO,
        GUARANTTEE_IN_DAYS: req.body.GUARANTTEE_IN_DAYS,
        WARANTEE_IN_DAYS: req.body.WARANTEE_IN_DAYS,
        EXPIRY_DATE: req.body.EXPIRY_DATE,
        INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        ACTUAL_UNIT_ID: req.body.ACTUAL_UNIT_ID,
        ACTUAL_UNIT_NAME: req.body.ACTUAL_UNIT_NAME,
        SKU_CODE: req.body.SKU_CODE,
        CLIENT_ID: req.body.CLIENT_ID
    };

    return data;
}

exports.validate = function () {
    return [
        body('ID').isInt().optional(),
        body('PO_NUMBER').optional(),
        body('INWARD_NO').optional(),
        body('INWARD_DATE').optional(),
        body('INWARD_ITEM_ID').isInt().optional(),
        body('INVENTORY_CATEGORY_ID').isInt().optional(),
        body('INVENTRY_SUB_CATEGORY_ID').isInt().optional(),
        body('QUANTITY').isInt().optional(),
        body('QUANTITY_PER_UNIT').isInt().optional(),
        body('UNIT_ID').isInt().optional(),
        body('INVENTORY_TRACKING_TYPE').optional(),
        body('WAREHOUSE_ID').isInt().optional(),
        body('SKU_CODE').optional(),
        body('INWARD_VARIANT_ID').isInt().optional(),
        body('REMARK').optional(),
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
            setContext + 'CALL sp_inventoryInward_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Inward data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 197,
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
            setContext + 'CALL sp_inventoryInward_getById()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Inward data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 197,
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

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

     var data = reqData(req);

    try {
        const params = [
            data.INWARD_MASTER_ID,
            data.INWARD_ITEM_ID,
            data.INVENTORY_CATEGORY_ID,
            data.INVENTRY_SUB_CATEGORY_ID,
            data.QUANTITY,
            data.QUANTITY_PER_UNIT,
            data.UNIT_ID,
            data.PARENT_ID,
            data.IS_VARIANT,
            data.UNIQUE_NO,
            data.GUARANTTEE_IN_DAYS,
            data.WARANTEE_IN_DAYS,
            data.EXPIRY_DATE,
            data.INVENTORY_TRACKING_TYPE,
            data.WAREHOUSE_ID,
            data.CLIENT_ID,
            data.ACTUAL_UNIT_ID,
            data.ACTUAL_UNIT_NAME,
            data.SKU_CODE
        ];

        mm.executeQueryData(
            'CALL sp_inventoryInwardDetails_create (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            params,
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save inventory inward"
                    });
                }
                res.status(200).json({
                    "code": 200,
                    "message": "Inventory inward saved successfully"
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
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

     var data = reqData(req);

    try {
        const params = [
            data.ID,
            data.INWARD_MASTER_ID,
            data.INWARD_ITEM_ID,
            data.INVENTORY_CATEGORY_ID,
            data.INVENTRY_SUB_CATEGORY_ID,
            data.QUANTITY,
            data.QUANTITY_PER_UNIT,
            data.UNIT_ID,
            data.PARENT_ID,
            data.IS_VARIANT,
            data.UNIQUE_NO,
            data.GUARANTTEE_IN_DAYS,
            data.WARANTEE_IN_DAYS,
            data.EXPIRY_DATE,
            data.INVENTORY_TRACKING_TYPE,
            data.WAREHOUSE_ID,
            data.CLIENT_ID,
            data.ACTUAL_UNIT_ID,
            data.ACTUAL_UNIT_NAME,
            data.SKU_CODE
        ];

        mm.executeQueryData(
            'CALL sp_inventoryInward_update (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            params,
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update inventory inward"
                    });
                }
                res.status(200).json({
                    "code": 200,
                    "message": "Inventory inward updated successfully"
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

exports.inwardInventory = (req, res) => {

    var INVENTORY_INWARD_DATA = req.body.INVENTORY_INWARD_DATA
    var supportKey = req.headers['supportkey'];
    let PO_NUMBER = req.body.INVENTORY_INWARD_DATA.PO_NUMBER
    let INWARD_DATE = mm.getSystemDate();
    let WAREHOUSE_ID = req.body.INVENTORY_INWARD_DATA.WAREHOUSE_ID
    let WAREHOUSE_NAME = req.body.INVENTORY_INWARD_DATA.WAREHOUSE_NAME
    var INVENTORY_DETAILS = req.body.INVENTORY_INWARD_DATA.INVENTORY_DETAILS

    try {
        let LogArray = []
        const connection = mm.openConnection()
        mm.executeDML(`call sp_inventoryInward_add(?,?,?,?)`, [PO_NUMBER, INWARD_DATE, WAREHOUSE_ID, 1], supportKey, connection, (error, inwardRes) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "message": "Failed to get inventory inward data."
                });
            } else {
                var is_inwardId
                async.eachSeries(INVENTORY_DETAILS, function iteratorOverElems(inwardData, callback) {
                    if (inwardData.INWARD_ITEM_ID != null && inwardData.INWARD_ITEM_ID != undefined && inwardData.INWARD_ITEM_ID != '') {
                        mm.executeDML('call sp_inventoryInward_details (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [inwardRes[0][0].INWARD_ID, inwardData.UNIQUE_NO, inwardData.GUARANTTEE_IN_DAYS, inwardData.WARANTEE_IN_DAYS, inwardData.EXPIRY_DATE, "1", inwardData.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, inwardData.ACTUAL_UNIT_ID, inwardData.ACTUAL_UNIT_NAME, inwardData.IS_VARIANT, inwardData.INWARD_ITEM_ID, inwardData.INVENTORY_CATEGORY_ID, inwardData.INVENTRY_SUB_CATEGORY_ID, inwardData.QUANTITY, inwardData.QUANTITY_PER_UNIT, inwardData.UNIT_ID, inwardData.PARENT_ID, inwardData.SKU_CODE], supportKey, connection, (error, results2) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                callback(error)
                            }
                            else {
                                mm.executeDML('call sp_inventoryInward_transaction(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                    [inwardData.INWARD_ITEM_ID, inwardData.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, inwardRes[0][0].INWARD_ID, (inwardData.INVENTORY_TRACKING_TYPE == 'B' ? inwardData.UNIQUE_NO : ""), (inwardData.INVENTORY_TRACKING_TYPE == 'S' ? inwardData.UNIQUE_NO : ""), (inwardData.INVENTORY_TRACKING_TYPE == 'B' ? 1 : 1), 1, inwardData.ACTUAL_UNIT_ID, inwardData.ACTUAL_UNIT_NAME, inwardData.IS_VARIANT, inwardData.PARENT_ID, inwardData.QUANTITY_PER_UNIT, req.body.authData.data.UserData[0].NAME, inwardData.ITEM_NAME, WAREHOUSE_NAME],
                                    supportKey, connection, (error, results) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            callback(error)
                                        }
                                        else {

                                            const ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has inwarded the inventory item ${inwardData.ITEM_NAME} for the warehouse ${WAREHOUSE_NAME}`;
                                            const logData = {
                                                ACTION_TYPE: "Inward",
                                                ACTION_DETAILS: ACTION_LOG,
                                                ACTION_DATE: new Date(), // Capturing the current date and time
                                                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                INVENTORY_ID: inwardData.PARENT_ID,
                                                INVENTORY_NAME: inwardData.INWARD_ITEM_NAME,
                                                WAREHOUSE_ID: WAREHOUSE_ID,
                                                WAREHOUSE_NAME: inwardData.WAREHOUSE_NAME,
                                                VARIANT_ID: inwardData.INWARD_ITEM_ID,
                                                VARIANT_NAME: inwardData.VARIANT_NAME || "", // Optional field
                                                QUANTITY: inwardData.QUANTITY,
                                                TOTAL_INWARD: 0, // Assuming 0 is computed elsewhere
                                                CURRENT_STOCK: 0,
                                                OLD_STOCK: 0 || 0, // Optional if not tracked
                                                QUANTITY_PER_UNIT: inwardData.QUANTITY_PER_UNIT,
                                                UNIT_ID: inwardData.UNIT_ID,
                                                UNIT_NAME: inwardData.UNIT_NAME,
                                                REASON: "Inventory Inwarded",
                                                SOURCE_WAREHOUSE_ID: null, // Not applicable for inward
                                                SOURCE_WAREHOUSE_NAME: "",
                                                DESTINATION_WAREHOUSE_ID: WAREHOUSE_ID,
                                                DESTINATION_WAREHOUSE_NAME: inwardData.WAREHOUSE_NAME,
                                                REFERENCE_NO: inwardData.PO_NUMBER || "", // Optional reference for inwarding
                                                STATUS: "COMPLETED",
                                                REMARK: inwardData.REMARK || ""
                                            };
                                            addLogEntry(logData);
                                            function addLogEntry(newEntry) {
                                                const isDuplicate = LogArray.some(
                                                    (entry) =>
                                                        entry.VARIANT_ID === newEntry.VARIANT_ID &&
                                                        entry.INVENTORY_ID === newEntry.INVENTORY_ID &&
                                                        entry.ACTION_DETAILS === newEntry.ACTION_DETAILS
                                                );

                                                if (!isDuplicate) {
                                                    LogArray.push(newEntry);
                                                } else {
                                                    console.log('Duplicate entry detected. Skipping...');
                                                }
                                            }
                                            mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Inward Inventory", `Hello Admin, The inventory ${inwardData.ITEM_NAME} has been inwarded in ${WAREHOUSE_NAME} on ${mm.getSystemDate()}. Please verify.`, "", "II", supportKey, "I", req.body);
                                            callback()
                                        }
                                    });
                            }
                        });
                    } else {
                        is_inwardId = true
                        error = "Please check the INWARD_ITEM_ID is must be a numeric";
                        callback(error)
                    }
                }, function subCb(error) {
                    if (error) {
                        if (is_inwardId == false) {
                            console.log("error", error);
                            mm.rollbackConnection(connection);
                            res.status(400).json({
                                "message": "Failed to add inventory inwards"
                            });
                        } else {
                            console.log("error", error);
                            mm.rollbackConnection(connection);
                            res.status(400).json({
                                "message": error
                            });
                        }
                    } else {
                        dbm.saveLog(LogArray, inwardLogSchema);
                        mm.executeDML(
                            'CALL sp_inventory_inward_stock_update(?)',
                            [inwardRes[0][0].INWARD_ID],
                            supportKey,
                            connection,
                            (error, result) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection);
                                    return res.status(400).json({
                                        "message": "Failed to update inventory stock",
                                        error: error.message
                                    });
                                }

                                mm.commitConnection(connection);
                                return res.status(200).json({
                                    "message": "Inventory updated successfully"
                                });
                            }
                        );

                    }
                });
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}



