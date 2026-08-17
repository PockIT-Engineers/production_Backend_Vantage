const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async')
const applicationkey = process.env.APPLICATION_KEY;
const inwardLogSchema = require("../../modules/inwardLogs")
const dbm = require('../../utilities/dbMongo');
var inventoryMovement = "inventory_movement";
var viewInventoryMovement = "view_" + inventoryMovement;

function reqData(req) {

    var data = {
        SOURCE_WAREHOUSE_ID: req.body.SOURCE_WAREHOUSE_ID,
        DESTINATION_WAREHOUSE_ID: req.body.DESTINATION_WAREHOUSE_ID,
        DATE: req.body.DATE,
        USER_ID: req.body.USER_ID,
        REASON: req.body.REASON,
        STATUS: req.body.STATUS,
        USER_NAME: req.body.USER_NAME,
        SOURCE_WAREHOUSE_NAME: req.body.SOURCE_WAREHOUSE_NAME,
        DESTINATION_WAREHOUSE_NAME: req.body.DESTINATION_WAREHOUSE_NAME,
        MOVEMENT_TYPE: req.body.MOVEMENT_TYPE,
        INVENTORY_DETAILS: req.body.INVENTORY_DETAILS,
        INVENTORY_CAT_ID: req.body.INVENTORY_CAT_ID,
        MOVEMENT_REQUEST_NO: req.body.MOVEMENT_REQUEST_NO
    }
    return data;
}

exports.validate = function () {
    return [
        body('SOURCE_WAREHOUSE_ID').isInt().optional(),
        body('DESTINATION_WAREHOUSE_ID').isInt().optional(),
        body('DATE').optional(),
        body('USER_ID').isInt().optional(),
        body('REASON').optional(),
        body('STATUS').optional(),
        body('ID').optional(),
    ]
}

exports.getAll = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
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
            setContext + 'CALL sp_inventoryMovement_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventory Category movement data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 33,
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
            setContext + 'CALL sp_inventoryMovement_getById()',
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
                    "TAB_ID": 33,
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

exports.create = async (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    try {
        const data = reqData(req);

        const query = `
            CALL sp_inventoryMovement_create(?,?,?,?,?,?,?,?,?,?)
        `;

        const params = [
            data.SOURCE_WAREHOUSE_ID,
            data.DESTINATION_WAREHOUSE_ID,
            data.DATE,
            data.USER_ID,
            data.REASON,
            data.USER_NAME,
            data.SOURCE_WAREHOUSE_NAME,
            data.DESTINATION_WAREHOUSE_NAME,
            data.MOVEMENT_TYPE,
            1
        ];

        mm.executeQueryData(query, params, supportKey, (error, result) => {
            if (error) {
                console.log("error",error)
                return res.status(400).json({"code":400,  "message": "Failed to save inventory movement" });
            }
            res.status(200).json({
                "code": 200,
                 "message": "InventoryMovement saved successfully",
                ID: result[0][0].INSERT_ID
            });
        });
    } catch (error) {
        console.log("error in catch",error)
        res.status(500).json({ "code":500, "message": "Something went wrong" });
    }
};

exports.update = async (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    try {
        const data = reqData(req);

        const query = `
            CALL sp_inventoryMovement_update(?,?,?,?,?,?,?,?,?,?)
        `;

        const params = [
            req.body.ID,
            data.SOURCE_WAREHOUSE_ID,
            data.DESTINATION_WAREHOUSE_ID,
            data.DATE,
            data.USER_ID,
            data.REASON,
            data.USER_NAME,
            data.SOURCE_WAREHOUSE_NAME,
            data.DESTINATION_WAREHOUSE_NAME,
            data.MOVEMENT_TYPE
        ];

        mm.executeQueryData(query, params, supportKey, (error, result) => {
            if (error) {
                console.log("error",error)
                return res.status(400).json({ "code": 400,  "message": "Failed to update inventory movement" });
            }
            res.status(200).json({
                "code": 200,
                 "message": "InventoryMovement updated successfully"
            });
        });
    } catch (error) {
        console.log("error",error)
        res.status(500).json({  "message": "Something went wrong" });
    }
};

exports.createMovement = (req, res) => {

    var { MOVEMENT_NUMBER, SOURCE_WAREHOUSE_ID, DESTINATION_WAREHOUSE_ID, DATE, USER_ID, REASON, CLIENT_ID, USER_NAME, SOURCE_WAREHOUSE_NAME, DESTINATION_WAREHOUSE_NAME, MOVEMENT_TYPE, INVENTORY_DETAILS, WAREHOUSE_MANAGER_USER_ID } = req.body
    var supportKey = req.headers['supportkey'];
    try {
        var is_Id
        let LoggArr = [];
        const connection = mm.openConnection()
        mm.executeDML(`call sp_inventoryMovement_add(?,?,?,?,?,?,?,?,?,?)`, [MOVEMENT_NUMBER, SOURCE_WAREHOUSE_ID, DESTINATION_WAREHOUSE_ID, DATE, USER_ID, req.body.authData.data.UserData[0].NAME, SOURCE_WAREHOUSE_NAME, DESTINATION_WAREHOUSE_NAME, MOVEMENT_TYPE, CLIENT_ID], supportKey, connection, (error, result) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "code": 400,
                     "message": "Failed to add inventory movement"
                });
            }
            else {
                var MOVEMENT_ID = result[0][0].p_MOVEMENT_ID

                async.eachSeries(INVENTORY_DETAILS, function iteratorOverElems(movementData, callback) {
                    if (movementData.INVENTORY_ID != null && movementData.INVENTORY_ID != undefined && movementData.INVENTORY_ID != '') {
                        mm.executeDML('call sp_inventoryMovement_details(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [MOVEMENT_ID, movementData.INVENTORY_ID, movementData.IS_VERIENT, movementData.PARENT_ID, movementData.VARIANT_NAME, movementData.INVENTORY_NAME, movementData.QUANTITY, movementData.UNIT_ID, movementData.UNIT_NAME, movementData.QUANTITY_PER_UNIT, movementData.INVENTORY_CAT_ID, movementData.INVENTORY_CAT_NAME, movementData.INVENTROY_SUB_CAT_ID, movementData.INVENTROY_SUB_CAT_NAME, MOVEMENT_TYPE, CLIENT_ID, movementData.SERIAL_NO, movementData.BATCH_NO], supportKey, connection, (error, results2) => {
                            if (error) {
                                console.log(error);
                                callback(error)
                            }
                            else {
                                const ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has transferred the inventory ${movementData.INVENTORY_NAME} from ${SOURCE_WAREHOUSE_NAME} to ${DESTINATION_WAREHOUSE_NAME}`;
                                mm.executeDML('call sp_inventoryMovement_transaction(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [movementData.INVENTORY_ID, movementData.INVENTORY_TRACKING_TYPE, SOURCE_WAREHOUSE_ID, DESTINATION_WAREHOUSE_ID, 0, movementData.BATCH_NO, movementData.SERIAL_NO, movementData.QUANTITY, CLIENT_ID, movementData.UNIT_ID, movementData.UNIT_NAME, movementData.IS_VERIENT, movementData.PARENT_ID,movementData.QUANTITY_PER_UNIT,MOVEMENT_ID,ACTION_LOG], supportKey, connection, (error, results3) => {
                                    if (error) {
                                        console.log(error);
                                        callback(error)
                                    }
                                    else {
                                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Inventory Moved", `Hello Admin, The inventory ${movementData.INVENTORY_NAME} has been transferred from ${SOURCE_WAREHOUSE_NAME} to ${DESTINATION_WAREHOUSE_NAME} on ${mm.getSystemDate()}. Please verify and update records accordingly`, "", "IM", supportKey, "I", []);
                                        mm.sendNotificationToWManager(req.body.authData.data.UserData[0].USER_ID, WAREHOUSE_MANAGER_USER_ID, "Inventory Moved", `Hello ${DESTINATION_WAREHOUSE_NAME}, The inventory ${movementData.INVENTORY_NAME} has been transferred from ${SOURCE_WAREHOUSE_NAME} to ${DESTINATION_WAREHOUSE_NAME} on ${mm.getSystemDate()}. Please verify and update records accordingly`, "", "IM", supportKey);

                                        const logData = {
                                            ACTION_TYPE: "MOVEMENT",
                                            ACTION_DETAILS: ACTION_LOG,
                                            ACTION_DATE: new Date(),
                                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                                            INVENTORY_ID: movementData.INVENTORY_ID,
                                            INVENTORY_NAME: movementData.INVENTORY_NAME,
                                            WAREHOUSE_ID: 0,
                                            WAREHOUSE_NAME: "",
                                            VARIANT_ID: movementData.VARIANT_ID,
                                            VARIANT_NAME: movementData.VARIANT_NAME || "",
                                            QUANTITY: movementData.QUANTITY,
                                            TOTAL_INWARD: 0,
                                            CURRENT_STOCK: 0,
                                            OLD_STOCK: 0,
                                            QUANTITY_PER_UNIT: "",
                                            UNIT_ID: movementData.UNIT_ID,
                                            UNIT_NAME: movementData.UNIT_NAME,
                                            REASON: "Inventory Movement",
                                            SOURCE_WAREHOUSE_ID: SOURCE_WAREHOUSE_ID,
                                            SOURCE_WAREHOUSE_NAME: SOURCE_WAREHOUSE_NAME,
                                            DESTINATION_WAREHOUSE_ID: DESTINATION_WAREHOUSE_ID,
                                            DESTINATION_WAREHOUSE_NAME: DESTINATION_WAREHOUSE_NAME,
                                            REFERENCE_NO: "",
                                            STATUS: "COMPLETED",
                                            REMARK: ""
                                        };
                                        LoggArr.push(logData);
                                        callback()

                                    }
                                });
                            }
                        });
                    } else {
                        is_Id = true
                        error = "Please check the INWARD_ITEM_ID is must be a numeric";
                        callback(error)
                    }
                }, function subCb(error) {
                    if (error) {
                        if (is_Id == true) {
                            mm.rollbackConnection(connection);
                            res.status(400).json({
                                "code": 400,
                                 "message": error
                            });
                        } else {
                            mm.rollbackConnection(connection);
                            res.status(400).json({
                                "code": 400,
                                 "message": "Failed to add inventory movement"
                            });
                        }
                    } else {
                        dbm.saveLog(LoggArr, inwardLogSchema);
                        mm.commitConnection(connection);
                        res.status(200).json({
                            "code": 200,
                             "message": "New inventory inward Successfully added",
                        });
                    }
                });
            }
        })

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
}

exports.counts = (req, res) => {
    var supportKey = req.headers['supportkey'];
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_FILTER = '${safeFilter}';
    `;
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + 'CALL sp_inventoryMovement_counts()',
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
                        "TAB_ID": 33,
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult
                    });
                }
            );
        }
        else {
            res.status(400).send({
                "code": 400,
                 "message": "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
             "message": "Something went wrong."
        });
    }

}

exports.detailedList = (req, res) => {
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
            setContext + 'CALL sp_inventoryMovement_detailedList()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventory customer movement data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 33,
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
