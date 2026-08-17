const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async')
const applicationkey = process.env.APPLICATION_KEY;
const inwardLogSchema = require("../../modules/inwardLogs")
const dbm = require('../../utilities/dbMongo');
var inventoryTechnicianMovement = "inventory_technician_movement";
var viewinventoryTechnicianMovement = "view_" + inventoryTechnicianMovement;

function reqData(req) {

    var data = {
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        DATE: req.body.DATE,
        USER_ID: req.body.USER_ID,
        REASON: req.body.REASON,
        STATUS: req.body.STATUS,
        USER_NAME: req.body.USER_NAME,
        WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        MOVEMENT_TYPE: req.body.MOVEMENT_TYPE,
        TRANSFER_MODE: req.body.TRANSFER_MODE,
        INVENTORY_DETAILS: req.body.INVENTORY_DETAILS,
        INVENTORY_CAT_ID: req.body.INVENTORY_CAT_ID,
        MOVEMENT_REQUEST_NO: req.body.MOVEMENT_REQUEST_NO
    }
    return data;
}

exports.validate = function () {
    return [
        body('WAREHOUSE_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
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
            setContext + 'CALL sp_inventoryTechnicianMovement_get()',
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
                    "TAB_ID": 201,
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
            setContext + 'CALL sp_inventoryTechnicianMovement_getById()',
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
                    "TAB_ID": 201,
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
            CALL sp_inventoryTechnicianMovement_create(?,?,?,?,?,?,?,?,?,?)
        `;

        const params = [
            data.WAREHOUSE_ID,
            data.TECHNICIAN_ID,
            data.DATE,
            data.USER_ID,
            data.REASON,
            data.USER_NAME,
            data.WAREHOUSE_NAME,
            data.TECHNICIAN_NAME,
            data.MOVEMENT_TYPE,
            data.TRANSFER_MODE,
            data.INVENTORY_DETAILS,
            data.INVENTORY_CAT_ID,
            data.MOVEMENT_REQUEST_NO
        ];

        mm.executeQueryData(query, params, supportKey, (error, result) => {
            if (error) {
                console.log("error", error)
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to save inventoryTechnicianMovement information"
                });
            }

            res.status(200).json({
                "code": 200,
                 "message": "inventoryTechnicianMovement information saved successfully",
                ID: result[0][0].INSERT_ID
            });
        });
    } catch (error) {
        console.log("error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong" });
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
            CALL sp_inventoryTechnicianMovement_update(?,?,?,?,?,?,?,?,?,?,?)
        `;

        const params = [
            req.body.ID,
            data.WAREHOUSE_ID,
            data.TECHNICIAN_ID,
            data.DATE,
            data.USER_ID,
            data.REASON,
            data.USER_NAME,
            data.WAREHOUSE_NAME,
            data.TECHNICIAN_NAME,
            data.MOVEMENT_TYPE,
            data.TRANSFER_MODE
        ];

        mm.executeQueryData(query, params, supportKey, (error) => {
            if (error) {
                console.log("error", error)
                logger.error(supportKey + ' ' + JSON.stringify(error), applicationkey);
                return res.status(400).json({
                    "code": 400,
                     "message": "Failed to update inventoryTechnicianMovement information"
                });
            }

            res.status(200).json({
                "code": 200,
                 "message": "inventoryTechnicianMovement information updated successfully"
            });
        });
    } catch (error) {
        console.log("error", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong" });
    }
};

exports.createMovement = (req, res) => {

    var { MOVEMENT_NUMBER, WAREHOUSE_ID, TECHNICIAN_ID, DATE, USER_ID, REASON, CLIENT_ID, USER_NAME, WAREHOUSE_NAME, TECHNICIAN_NAME, MOVEMENT_TYPE, TRANSFER_MODE, INVENTORY_DETAILS } = req.body
    var supportKey = req.headers['supportkey'];
    try {
        var is_Id
        let LoggArr = [];
        const connection = mm.openConnection()
        mm.executeDML(`call sp_inventoryTechnicianMovement_add(?,?,?,?,?,?,?,?,?,?,?)`, [MOVEMENT_NUMBER, WAREHOUSE_ID, TECHNICIAN_ID, DATE, USER_ID, USER_NAME, WAREHOUSE_NAME, TECHNICIAN_NAME, MOVEMENT_TYPE, CLIENT_ID, TRANSFER_MODE], supportKey, connection, (error, result) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "code":400,
                     "message": "Failed to add inventory movement"
                });
            }
            else {
                var MOVEMENT_ID = result[0][0].p_MOVEMENT_ID

                async.eachSeries(INVENTORY_DETAILS, function iteratorOverElems(movementData, callback) {
                    if (movementData.INVENTORY_ID != null && movementData.INVENTORY_ID != undefined && movementData.INVENTORY_ID != '') {
                        mm.executeDML('call sp_inventoryTechnicianMovement_details(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [MOVEMENT_ID, movementData.INVENTORY_ID, movementData.IS_VERIENT, movementData.PARENT_ID, movementData.VARIANT_NAME, movementData.INVENTORY_NAME, movementData.QUANTITY, movementData.UNIT_ID, movementData.UNIT_NAME, movementData.QUANTITY_PER_UNIT, movementData.INVENTORY_CAT_ID, movementData.INVENTORY_CAT_NAME, movementData.INVENTROY_SUB_CAT_ID, movementData.INVENTROY_SUB_CAT_NAME, MOVEMENT_TYPE, CLIENT_ID, movementData.SERIAL_NO, movementData.BATCH_NO], supportKey, connection, (error, results2) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                callback(error)
                            }
                            else {
                                var ACTION_LOG = `${req.body.authData.data.UserData[0].NAME} has transferred the inventory to technician ${TECHNICIAN_NAME}`;
                                mm.executeDML('call sp_inventoryTechnicianMovement_transaction(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [TRANSFER_MODE, movementData.INVENTORY_ID, movementData.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, TECHNICIAN_ID, movementData.BATCH_NO, movementData.SERIAL_NO, movementData.QUANTITY, CLIENT_ID, movementData.UNIT_ID, movementData.UNIT_NAME, movementData.IS_VERIENT, movementData.PARENT_ID, movementData.QUANTITY_PER_UNIT,ACTION_LOG], supportKey, connection, (error, results3) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection);
                                        res.status(400).json({
                                            "message": "Failed to add inventory movement"
                                        });
                                    }
                                    else {
                                        
                                        if (TRANSFER_MODE == "W") {
                                            
                                            var TITLE = 'Inventory Stock Transferred'
                                            var DESCRIPTION = `You have received ${movementData.QUANTITY} new items in your inventory stock.
Item: ${movementData.INVENTORY_NAME}
Quantity: ${movementData.QUANTITY}
Tracking Type:  ${movementData.INVENTORY_TRACKING_TYPE === "S" ? "Serial No." : movementData.INVENTORY_TRACKING_TYPE === "B" ? "Batch No." : "None"}
Unique Type: ${movementData.INVENTORY_TRACKING_TYPE === "S" ? movementData.SERIAL_NO : movementData.INVENTORY_TRACKING_TYPE === "B" ? movementData.BATCH_NO : "N/A"}
Please check and update your stock accordingly.`

                                            let notificationData = {
                                                ORDER_ID: 0,
                                                ORDER_NUMBER: "",
                                                JOB_CARD_ID: 0,
                                                JOB_CARD_NUMBER: "",
                                                CUSTOMER_ID: 0,
                                                CUSTOMER_NAME: "",
                                                USER_ID: TECHNICIAN_ID,
                                                USER_TYPE: "TECHNICIAN",
                                                CREATED_BY: req.body.authData.data.UserData[0].USER_ID
                                            }
                                            mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, TITLE, DESCRIPTION, "", "T", supportKey, "", "I", notificationData)
                                        }

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
                                            WAREHOUSE_ID: WAREHOUSE_ID,
                                            WAREHOUSE_NAME: WAREHOUSE_NAME,
                                            TECHNICIAN_ID: TECHNICIAN_ID,
                                            TECHNICIAN_NAME: TECHNICIAN_NAME,
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
                                "code":400,
                                 "message": error
                            });
                        } else {
                            mm.rollbackConnection(connection);
                            res.status(400).json({
                                "code":400,
                                 "message": "Failed to add inventory movement"
                            });
                        }
                    } else {
                        dbm.saveLog(LoggArr, inwardLogSchema);
                        mm.commitConnection(connection);
                        res.status(200).json({
                            "code":200,
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
            "code":500,
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
                setContext + 'CALL sp_inventoryTechnicianMovement_counts()',
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
                        "TAB_ID": 201,
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult
                    });
                }
            );
        }
        else {
            res.status(400).send({
                "code":400,
                 "message": "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code":500,
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
            setContext + 'CALL sp_inventoryTechnicianMovement_detailedList()',
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
                    "TAB_ID": 201,
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
