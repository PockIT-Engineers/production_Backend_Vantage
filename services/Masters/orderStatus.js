const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var orderStatusMaster = "order_status_master";
var viewOrderStatusMaster = "view_" + orderStatusMaster;

function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        ICON: req.body.ICON,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('ICON').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
    var supportKey = req.headers['supportkey'];

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
        return res.send({
            "code": 400,
             "message": "Invalid filter parameter."
        });
    }


    try {
        mm.executeQueryData(
            setContext+`CALL sp_orderStatus_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        "code": 400,
                         "message": "Failed to get orderStatus information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 72,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};



exports.create = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const data = reqData(req);

    if (!errors.isEmpty())
        return res.send({ "code": 422,  "message": errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_orderStatus_Create(?,?,?,?,?)`,
            [
                data.NAME,
                data.DESCRIPTION,
                data.ICON,
                data.IS_ACTIVE,
                data.CLIENT_ID
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.send({
                        "code": 400,
                         "message": error.sqlMessage || "Failed to save orderStatus information."
                    });
                }

                dbm.saveLog({
                    SOURCE_ID: 0,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} created new order status ${data.NAME}.`,
                    CATEGORY: "Order Status",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({
                    "code": 200,
                     "message": "OrderStatus information saved successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.update = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;
    const data = reqData(req);

    if (!ID)
        return res.send({ "code": 400,  "message": "ID is required." });

    if (!errors.isEmpty())
        return res.send({ "code": 422,  "message": errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_orderStatus_Update(?,?,?,?,?)`,
            [
                ID,
                data.NAME,
                data.DESCRIPTION,
                data.ICON,
                data.IS_ACTIVE
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.send({
                        "code": 400,
                         "message": "Failed to update orderStatus information."
                    });
                }

                // ---- ACTION LOG ----
                dbm.saveLog({
                    SOURCE_ID: ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} updated order status ${data.NAME}.`,
                    CATEGORY: "Order Status",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({
                    "code": 200,
                     "message": "OrderStatus information updated successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        res.send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};
