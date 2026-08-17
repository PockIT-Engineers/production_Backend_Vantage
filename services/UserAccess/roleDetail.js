const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
var roleDetails = "role_details";
var viewRoleDetails = "view_" + roleDetails;

function reqData(req) {
    var data = {
        ROLE_ID: req.body.ROLE_ID,
        FORM_ID: req.body.FORM_ID,
        IS_ALLOWED: req.body.IS_ALLOWED ? 1 : 0,
        SEQ_NO: req.body.SEQ_NO ? req.body.SEQ_NO : 0,
        CLIENT_ID: req.body.CLIENT_ID,
        SHOW_IN_MENU: req.body.SHOW_IN_MENU ? req.body.SHOW_IN_MENU : 0
    }
    return data;
}

exports.validate = function () {
    return [
        body('ROLE_ID').isInt(),
        body('FORM_ID').isInt(),
        body('SEQ_NO').isInt().optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var deviceid = req.headers['deviceid'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    try {

        filter = filter.replace(/'/g, "''");

        const setContext = `
            SET @v_PAGE_INDEX = '${pageIndex}';
            SET @v_PAGE_SIZE = '${pageSize}';
            SET @v_SORT_KEY = '${sortKey}';
            SET @v_SORT_VALUE = '${sortValue}';
            SET @v_FILTER = '${filter}';
        `;

        mm.executeQueryData(
            setContext + ` CALL sp_roleDetail_get(); `,
            [],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey,
                        supportKey,
                        deviceid
                    );
                    return res.send({
                        code: 400,
                        message: "Failed to get form information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r) && r.length);

                const count = resultSets[0]?.[0]?.cnt || 0;
                const data = resultSets[1] || [];

                res.send({
                    code: 200,
                    message: "success",
                    TAB_ID: 87,
                    count: count,
                    data: data
                });

            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);

    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            'CALL sp_roleDetail_create(?,?,?,?,?,?)',
            [
                data.ROLE_ID,
                data.FORM_ID,
                data.IS_ALLOWED,
                data.SEQ_NO,
                data.CLIENT_ID,
                data.SHOW_IN_MENU
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey,
                        supportKey,
                        deviceid
                    );
                    return res.send({
                        code: 400,
                        message: "Failed to save form information..."
                    });
                }

                res.send({
                    code: 200,
                    message: "Form information saved successfully...",
                });

            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.update = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);

    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();
    var ID = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            'CALL sp_roleDetail_update(?,?,?,?,?,?,?,?)',
            [
                ID,
                data.ROLE_ID,
                data.FORM_ID,
                data.IS_ALLOWED,
                data.SEQ_NO,
                data.CLIENT_ID,
                data.SHOW_IN_MENU,
                systemDate
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey,
                        supportKey,
                        deviceid
                    );
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to update form information."
                    });
                }

                res.send({
                    code: 200,
                    message: "Form information updated successfully...",
                });

            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.addBulk = (req, res) => {
    let data = req.body.data || [];
    let ROLE_ID = req.body.ROLE_ID;
    let supportKey = req.headers['supportkey'];
    try {


        if (!ROLE_ID || data.length === 0) {
            return res.send({
                code: 400,
                message: "ROLE_ID or data parameter missing"
            });
        }
        console.log("ROLE_ID", ROLE_ID)
        let connection = mm.openConnection()

        async.eachSeries(
            data,
            (item, cb) => {
                mm.executeDML(
                    `CALL sp_roleDetails_addOrUpdate(?,?,?,?,?)`,
                    [
                        ROLE_ID,
                        item.FORM_ID,
                        item.SHOW_IN_MENU,
                        item.IS_ALLOWED,
                        item.SEQ_NO
                    ],
                    supportKey,
                    connection,
                    (error) => {
                        if (error) {
                            console.log(error);
                            cb(error);
                        } else {
                            cb(null);
                        }
                    }
                );
            },
            (error) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    res.send({
                        code: 400,
                        message: "Failed to Insert Role details"
                    });
                } else {
                    mm.commitConnection(connection);
                    res.send({
                        code: 200,
                        message: "New role details Successfully added"
                    });
                }
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

exports.getMappingData = (req, res) => {
    try {
        let supportKey = req.headers['supportkey'];
        let roleId = req.body.ROLE_ID;
        let filter = req.body.filter ? req.body.filter : '';

        if (!roleId) {
            return res.send({
                code: 400,
                message: "ROLE_ID missing"
            });
        }

        mm.executeQueryData(
            `CALL sp_roleDetail_getRoleMappingData(?, ?)`,
            [roleId, filter],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        code: 400,
                        message: error.sqlMessage || "Failed to get record"
                    });
                } else {
                    res.send({
                        code: 200,
                        message: "success",
                        data: results[0] || []
                    });
                }
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

exports.checkAccess = (req, res) => {
    try {
        let roleId = req.body.ROLE_ID;
        let formLink = req.body.LINK;
        let supportKey = req.headers['supportkey'];

        if (!roleId || !formLink) {
            return res.send({
                code: 400,
                message: "Parameter Missing roleId or formLink"
            });
        }

        mm.executeQueryData(
            `CALL sp_roleDetail_checkRoleAccess(?, ?)`,
            [roleId, formLink],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        code: 400,
                        message: "Failed to get record"
                    });
                } else {
                    res.send({
                        code: 200,
                        message: "success",
                        data: results[0][0].HAS_ACCESS === 1
                    });
                }
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};
