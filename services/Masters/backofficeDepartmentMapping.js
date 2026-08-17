const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require("../../modules/channelSubscribedUsers");
var backofficeDepartmentMapping = "backoffice_department_mapping";
var viewbackofficeDepartmentMapping = "view_" + backofficeDepartmentMapping;

function reqData(req) {

    var data = {
        BACKOFFICE_ID: req.body.BACKOFFICE_ID,
        DEPARTMENT_ID: req.body.DEPARTMENT_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        STATUS: req.body.STATUS
    }
    return data;
}

exports.validate = function () {
    return [
        body('BACKOFFICE_ID').isInt().optional(),
        body('DEPARTMENT_ID').isInt().optional(),
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
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + 'CALL sp_backofficeDepartmentMapping_get()',
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error);
                        return res.status(400).json({
                            "code": 400,
                            "message": 'Failed to get backoffice department mapping'
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];

                    return res.status(200).json({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 216,
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult
                    });
                }
            );
        }
        else {
            res.send({
                "code": 400,
                "message": "Invalid filter parameter."
            })
        }
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
            "message": 'Something went wrong'
        });
    }
};

exports.create = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        const data = reqData(req);

        const BACKOFFICE_ID = data.BACKOFFICE_ID;
        const DEPARTMENT_ID = data.DEPARTMENT_ID;
        const IS_ACTIVE = data.IS_ACTIVE;
        const CLIENT_ID = data.CLIENT_ID;
        const STATUS=data.STATUS;

        mm.executeQueryData(
            'CALL sp_backofficeDepartmentMapping_create(?,?,?,?,?)',
            [
                BACKOFFICE_ID,
                DEPARTMENT_ID,
                IS_ACTIVE,
                STATUS,
                CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                        "message": error.sqlMessage
                    });
                }

                const response = results[0][0];

                if (response.code === 200) {
                    dbm.saveLog({
                        SOURCE_ID: response.data,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} mapped backoffice department`,
                        CATEGORY: 'backoffice Department Mapping',
                        CLIENT_ID: 1,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey: 0
                    }, systemLog);
                }

                res.status(200).json({
                    "code": response.code,
                    "message": response.message
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
            "message": 'Something went wrong'
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        const data = reqData(req);

        const ID = req.body.ID;
        const BACKOFFICE_ID = data.BACKOFFICE_ID;
        const DEPARTMENT_ID = data.DEPARTMENT_ID;
        const IS_ACTIVE = data.IS_ACTIVE;
        const CLIENT_ID = data.CLIENT_ID;
        const STATUS = data.STATUS;

        mm.executeQueryData(
            'CALL sp_backofficeDepartmentMapping_update(?,?,?,?,?,?)',
            [
                ID,
                BACKOFFICE_ID,
                DEPARTMENT_ID,
                IS_ACTIVE,
                STATUS,
                CLIENT_ID
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                        "message": error.sqlMessage
                    });
                }

                dbm.saveLog({
                    SOURCE_ID: ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} updated backoffice department mapping`,
                    CATEGORY: 'backoffice Department Mapping',
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": 'Backoffice department mapping updated successfully'
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
            "message": 'Something went wrong'
        });
    }
};

exports.mapDepartment = (req, res) => {
    const supportKey = req.headers['supportkey'];

    try {
        const BACKOFFICE_ID = req.body.BACKOFFICE_ID;
        const BACKOFFICE_NAME = req.body.BACKOFFICE_NAME;
        const USER_ID = req.body.USER_ID;
        const STATUS = req.body.STATUS;
        const DATA = req.body.data || [];

        const IS_ACTIVE = STATUS === 'M' ? '1' : '0';
        const CLIENT_ID = 1;

        async.eachSeries(DATA, (item, cb) => {

            const DEPARTMENT_ID = item.DEPARTMENT_ID;

            mm.executeQueryData(
                'CALL sp_backofficeDepartmentMapping_map(?,?,?,?,?)',
                [
                    BACKOFFICE_ID,
                    DEPARTMENT_ID,
                    IS_ACTIVE,
                    STATUS,
                    CLIENT_ID
                ],
                supportKey,
                (error) => {
                    if (error) {
                        console.log("error", error)
                        return cb(error);
                    }

                    const CHANNEL_NAME = `ticket_${DEPARTMENT_ID}_channel`;
                    const TYPE = "B";
                    const mongoStatus = STATUS === 'M';

                    channelSubscribedUsers.findOne(
                        { CHANNEL_NAME, USER_ID: USER_ID, TYPE }
                    )
                        .then(existing => {
                            if (existing) {
                                return channelSubscribedUsers.updateMany(
                                    { CHANNEL_NAME, USER_ID: USER_ID, TYPE },
                                    { STATUS: mongoStatus }
                                );
                            } else {
                                return new channelSubscribedUsers({
                                    CHANNEL_NAME,
                                    USER_ID: USER_ID,
                                    TYPE,
                                    STATUS: mongoStatus,
                                    USER_NAME: BACKOFFICE_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }).save();
                            }
                        })
                        .then(() => cb(null))
                        .catch(error => cb(error));
                }
            );
        }, (error) => {

            if (error) {
                return res.status(400).json({
                    "code": 400,
                    "message": 'Failed to map backoffice department'
                });
            }

            dbm.saveLog({
                SOURCE_ID: BACKOFFICE_ID,
                LOG_DATE_TIME: mm.getSystemDate(),
                LOG_TEXT: `${req.body.authData.data.UserData[0].NAME} mapped departments`,
                CATEGORY: 'backoffice Department Mapping',
                CLIENT_ID: 1,
                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                supportKey: 0
            }, systemLog);

            res.status(200).json({
                "code": 200,
                "message": 'Backoffice departments mapped successfully'
            });
        });

    } catch (error) {
        console.log("error", error)
        res.status(500).json({
            "code": 500,
            "message": 'Something went wrong'
        });
    }
};

exports.unMapDepartment = (req, res) => {
    const supportKey = req.headers['supportkey'];

    try {
        const BACKOFFICE_ID = req.body.BACKOFFICE_ID;
        const BACKOFFICE_NAME = req.body.BACKOFFICE_NAME;
        const USER_ID = req.body.USER_ID;
        const DATA = req.body.data || [];

        async.eachSeries(DATA, (item, cb) => {

            const DEPARTMENT_ID = item.DEPARTMENT_ID;
            const IS_ACTIVE = item.IS_ACTIVE;

            mm.executeQueryData(
                'CALL sp_backofficeDepartmentMapping_unmap(?,?,?)',
                [
                    BACKOFFICE_ID,
                    DEPARTMENT_ID,
                    IS_ACTIVE
                ],
                supportKey,
                (error) => {
                    if (error) {
                        console.log("error", error)
                        return cb(error);
                    }

                    const CHANNEL_NAME = `ticket_${DEPARTMENT_ID}_channel`;

                    channelSubscribedUsers.findOne(
                        { CHANNEL_NAME, USER_ID: USER_ID, TYPE: "B" }
                    )
                        .then(existing => {
                            if (existing) {
                                return channelSubscribedUsers.updateMany(
                                    { CHANNEL_NAME, USER_ID: USER_ID, TYPE: "B" },
                                    { STATUS: IS_ACTIVE }
                                );
                            } else {
                                return new channelSubscribedUsers({
                                    CHANNEL_NAME,
                                    USER_ID: USER_ID,
                                    TYPE: "B",
                                    STATUS: IS_ACTIVE,
                                    USER_NAME: BACKOFFICE_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }).save();
                            }
                        })
                        .then(() => cb(null))
                        .catch(error => cb(error));
                }
            );
        }, (error) => {

            if (error) {
                console.log("error", error)
                return res.status(400).json({
                    "code": 400,
                    "message": 'Failed to unmap department'
                });
            }

            dbm.saveLog({
                SOURCE_ID: BACKOFFICE_ID,
                LOG_DATE_TIME: mm.getSystemDate(),
                LOG_TEXT: `${req.body.authData.data.UserData[0].NAME} unmapped departments`,
                CATEGORY: 'backoffice Department Mapping',
                CLIENT_ID: 1,
                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                supportKey: 0
            }, systemLog);

            res.status(200).json({
                "code": 200,
                "message": 'Department unmapped successfully'
            });
        });

    } catch (error) {
        console.log("error", error)
        res.status(500).json({
            "code": 500,
            "message": 'Something went wrong'
        });
    }
};

exports.unMappedDepartment = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let BACKOFFICE_ID = req.body.BACKOFFICE_ID ? req.body.BACKOFFICE_ID : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @p_BACKOFFICE_ID = '${BACKOFFICE_ID}';
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
            setContext + 'CALL sp_backofficeDepartmentMapping_unmapped_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                        "message": 'Failed to get unmapped departments'
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 16,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );

    } catch (error) {
        console.log("error", error)
        res.status(500).json({ "code": 500, "message": 'Something went wrong' });
    }
};

exports.addBulk = (req, res) => {

    var BACKOFFICE_ID = req.body.BACKOFFICE_ID;
    const STATUS = req.body.STATUS;
    const DATA = req.body.data || [];

    const IS_ACTIVE = STATUS === 'M' ? '1' : '0';
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection()
        async.eachSeries(DATA, function iteratorOverElems(roleDetailsItem, inner_callback) {
            const DEPARTMENT_ID = roleDetailsItem.DEPARTMENT_ID;
            mm.executeDML(
                'CALL sp_backofficeDepartmentMapping_map(?,?,?,?,?)',
                [
                    BACKOFFICE_ID,
                    DEPARTMENT_ID,
                    IS_ACTIVE,
                    STATUS,
                    CLIENT_ID
                ],
                supportKey,
                connection,
                (error) => {
                    if (error) {
                        console.log("error", error)
                        return inner_callback(error);
                    }
                    inner_callback(null)
                }
            );
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to Insert backoffice department mapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped the department.`;
                var logCategory = "backoffice Department Mapping"

                let actionLog = {
                    "SOURCE_ID": BACKOFFICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New backoffice department mapping Successfully added",
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error)
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}