const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const channelSubscribedUsers = require("../../modules/channelSubscribedUsers");
var warehouseTerritoryMapping = "warehouse_territory_mapping";
var viewwarehouseTerritoryMapping = "view_" + warehouseTerritoryMapping;
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');

function reqData(req) {

    var data = {
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        TERITORY_ID: req.body.TERITORY_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('WAREHOUSE_ID').isInt().optional(),
        body('TERITORY_ID').isInt().optional(),
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
            setContext+`CALL sp_warehouseTerritoryMapping_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to get data." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 149,
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
            `CALL sp_warehouseTerritoryMapping_create(?,?,?,?)`,
            [
                data.WAREHOUSE_ID,
                data.TERITORY_ID,
                data.IS_ACTIVE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to save data." });
                }

                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped territories to warehouse.`;
                var logCategory = "warehouseTerritoryMapping"

                let actionLog = {
                    "SOURCE_ID": result[0][0].ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                return res.send({
                    "code": 200,
                     "message": "successfully created..."
                });
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
    const ID = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_warehouseTerritoryMapping_update(?,?,?,?,?)`,
            [
                ID,
                data.WAREHOUSE_ID,
                data.TERITORY_ID,
                data.IS_ACTIVE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to update data." });
                }

                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of warehouse territory mapping.`;
                var logCategory = "warehouseTerritoryMapping"

                let actionLog = {
                    "SOURCE_ID": ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)

                return res.send({
                    "code": 200,
                     "message": "information updated and logged successfully."
                });
            }
        );
    } catch (error) {
        console.log("catch error", error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.addBulk = async (req, res) => {
    const supportKey = req.headers['supportkey'];

    const {
        WAREHOUSE_ID,
        WAREHOUSE_MANAGER_ID,
        WAREHOUSE_MANAGER_NAME,
        CLIENT_ID,
        data
    } = req.body;

    const connection = mm.openConnection();

    try {
        async.eachSeries(
            data,
            (item, cb) => {
                mm.executeDML(
                    `CALL sp_warehouseTerritoryMapping_bulkUpsert(?,?,?,?)`,
                    [
                        WAREHOUSE_ID,
                        item.TERITORY_ID,
                        item.IS_ACTIVE,
                        CLIENT_ID
                    ],
                    supportKey,
                    connection,
                    async (error) => {
                        if (error) {
                            console.log("SP error", error);
                            return cb(error);
                        }

                        /** CHANNEL LOGIC (Node / Mongo only) */
                        const CHANNEL_NAME = `territory_warehouse_${item.TERITORY_ID}_channel`;
                        const TYPE = "B";

                        try {
                            const existing = await channelSubscribedUsers.findOne({
                                CHANNEL_NAME,
                                USER_ID: WAREHOUSE_MANAGER_ID,
                                TYPE
                            });

                            if (existing) {
                                await channelSubscribedUsers.updateMany(
                                    { CHANNEL_NAME, USER_ID: WAREHOUSE_MANAGER_ID, TYPE },
                                    { STATUS: item.IS_ACTIVE }
                                );
                            } else {
                                await new channelSubscribedUsers({
                                    CHANNEL_NAME,
                                    USER_ID: WAREHOUSE_MANAGER_ID,
                                    TYPE,
                                    STATUS: item.IS_ACTIVE,
                                    USER_NAME: WAREHOUSE_MANAGER_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }).save();
                            }

                            cb(null);
                        } catch (mongoErr) {
                            console.log("Mongo error", mongoErr);
                            cb(mongoErr);
                        }
                    }
                );
            },
            (error) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to insert warehouse territory mapping."
                    });
                }

                /** ACTION LOG */
                const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped territories to warehouse.`;

                dbm.saveLog(
                    {
                        SOURCE_ID: WAREHOUSE_ID,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: ACTION_DETAILS,
                        CATEGORY: "warehouseTerritoryMapping",
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: 0
                    },
                    systemLog
                );

                mm.commitConnection(connection);

                return res.status(200).json({
                    "code": 200,
                     "message": "Warehouse territory mapping saved successfully."
                });
            }
        );
    } catch (error) {
        mm.rollbackConnection(connection);
        console.log("catch error", error);
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );

        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};
