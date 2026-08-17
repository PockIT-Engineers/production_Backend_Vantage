const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
var backofficeTerritoryMapping = "backoffice_territory_mapping";
var viewBackofficeTerritoryMapping = "view_" + backofficeTerritoryMapping;
const channelSubscribedUsers = require("../../modules/channelSubscribedUsers");
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');

function reqData(req) {

    var data = {
        BACKOFFICE_ID: req.body.BACKOFFICE_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        TERITORY_ID: req.body.TERITORY_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('BACKOFFICE_ID').isInt().optional(),
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
    try {
        if (IS_FILTER_WRONG !== "0") {
            return res.status(400).json({
                "code": 400,
                 "message": "Invalid filter parameter."
            });
        }


        mm.executeQueryData(
            setContext+'CALL sp_backofficeTerritoryMapping_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                     console.log("error",error)
                    return res.status(400).send({ "code": 400,  "message": 'Failed to fetch team' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 3,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.status(500).send({ "code": 500,  "message": 'Something went wrong' });
    }
};

exports.create = (req, res) => {

    const {
        BACKOFFICE_ID,
        TERITORY_ID,
        IS_ACTIVE,
        CLIENT_ID
    } = req.body;

    const supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(
            `CALL sp_backoffice_territory_mapping_create(?,?,?,?)`,
            [
                BACKOFFICE_ID,
                TERITORY_ID,
                IS_ACTIVE ? '1' : '0',
                CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to create backoffice territory mapping"
                    });
                }

                const insertId = results[0][0].ID;

                const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created backoffice territory mapping.`;

                dbm.saveLog({
                    SOURCE_ID: insertId,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "backofficeTerritoryMapping",
                    CLIENT_ID: CLIENT_ID,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({
                    code: 200,
                    message: "Successfully created",
                    ID: insertId
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong"
        });
    }
};

exports.update = (req, res) => {

    const {
        ID,
        BACKOFFICE_ID,
        TERITORY_ID,
        IS_ACTIVE,
        CLIENT_ID
    } = req.body;

    const supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(
            `CALL sp_backoffice_territory_mapping_update(?,?,?,?,?)`,
            [
                ID,
                BACKOFFICE_ID,
                TERITORY_ID,
                IS_ACTIVE ? '1' : '0',
                CLIENT_ID
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to update backoffice territory mapping"
                    });
                }

                const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated backoffice territory mapping.`;

                dbm.saveLog({
                    SOURCE_ID: ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "backofficeTerritoryMapping",
                    CLIENT_ID: CLIENT_ID,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({
                    code: 200,
                    message: "Successfully updated",
                    ID
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong"
        });
    }
};


exports.addBulk = (req, res) => {

    const {
        BACKOFFICE_ID,
        USER_ID,
        BACKOFFICE_NAME,
        data,
        CLIENT_ID,
        ROLE_ID
    } = req.body;

    const supportKey = req.headers['supportkey'];
    const connection = mm.openConnection();

    try {
        async.eachSeries(
            data,
            (roleDetailsItem, inner_callback) => {

                mm.executeDML(
                    `CALL sp_backoffice_territory_mapping_bulk_upsert(?,?,?,?)`,
                    [
                        BACKOFFICE_ID,
                        roleDetailsItem.TERITORY_ID,
                        roleDetailsItem.IS_ACTIVE,
                        CLIENT_ID
                    ],
                    supportKey,
                    connection,
                    async (error, results) => {
                        if (error) return inner_callback(error);

                        if (ROLE_ID == 23) {
                            inner_callback(null);
                        }
                        else {
                            if (ROLE_ID == 24 || ROLE_ID == 25) {
                                var CHANNEL_NAME = `support_${roleDetailsItem.TERITORY_ID}_channel`

                            }
                            else {
                                var CHANNEL_NAME = `territory_${roleDetailsItem.TERITORY_ID}_admin_channel`
                            }
                            const chanelData = {
                                CHANNEL_NAME: CHANNEL_NAME,
                                USER_ID: USER_ID,
                                TYPE: "B",
                                STATUS: roleDetailsItem.IS_ACTIVE,
                                USER_NAME: BACKOFFICE_NAME,
                                CLIENT_ID: 1,
                                DATE: mm.getSystemDate()
                            }
                            var TYPE = "B"
                            channelSubscribedUsers.findOne({ "CHANNEL_NAME": CHANNEL_NAME, "USER_ID": USER_ID, "TYPE": TYPE })
                                .then(existingRecord => {
                                    if (existingRecord) {
                                        channelSubscribedUsers
                                            .updateMany({ CHANNEL_NAME: CHANNEL_NAME, USER_ID: USER_ID, TYPE: TYPE }, { STATUS: roleDetailsItem.IS_ACTIVE })
                                            .then(() => {
                                                // const newChannel = new channelSubscribedUsers(req.body);
                                                // newChannel.save();
                                                inner_callback(null);
                                            })

                                            .catch((error) => {
                                                inner_callback(error);
                                            });
                                    }
                                    else {
                                        const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                        newchannelSubscribedUsers.save();
                                        inner_callback(null);
                                    }
                                })
                                .catch(error => {
                                    console.error(error);
                                    inner_callback(null);
                                });
                        }
                    }
                );
            },
            (error) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    return res.send({
                        code: 400,
                        message: "Failed to map backoffice territory"
                    });
                }

                mm.commitConnection(connection);

                const ACTION_DETAILS =
                    `${req.body.authData.data.UserData[0].NAME} has mapped the back office territory.`;

                dbm.saveLog({
                    SOURCE_ID: BACKOFFICE_ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "backoffice territory mapping",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({
                    code: 200,
                    message: "Backoffice territory mapping completed successfully"
                });
            }
        );

    } catch (error) {
        mm.rollbackConnection(connection);
        console.error(error);
        res.send({
            code: 500,
            message: "Something went wrong"
        });
    }
};

