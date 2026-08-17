const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var shiprocketWebhookLogs = "shiprocket_webhook_logs";
var viewShiprocketWebhookLogs = "view_" + shiprocketWebhookLogs;

function reqData(req) {
    var data = {
        ORDER_ID: req.body.ORDER_ID,
        SHIPMENT_ID: req.body.SHIPMENT_ID,
        RESPONSE: req.body.RESPONSE,
        RECEIVED_DATE: req.body.RECEIVED_DATE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID').isInt().optional(), 
        body('SHIPMENT_ID').isInt().optional(), 
        body('RESPONSE').optional(), 
        body('RECEIVED_DATE').optional(), 
        body('ID').optional(),
    ]
}

exports.getAll = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : null;
    var pageSize = req.body.pageSize ? req.body.pageSize : null;
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {

        if (IS_FILTER_WRONG == "0") {

            filter = filter.replace(/'/g, "''");

            const setContext = `
SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
                SET @v_SORT_KEY = '${sortKey}';
                SET @v_SORT_VALUE = '${sortValue}';
                SET @v_FILTER = '${filter}';
            `;

            mm.executeQueryData(
                setContext + ` CALL sp_shiprocketWebhookLogs_get(); `,
                [],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log("error",error)
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                            code: 400,
                            message: "Failed to get information."
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r) && r.length);

                    const count = resultSets[0]?.[0]?.cnt || 0;
                    const data = resultSets[1] || [];

                    res.status(200).json({
                        "code": 200,
                        message: "success",
                        TAB_ID: 189,
                        count: count,
                        data: data
                    });

                }
            );

        } else {

            res.status(400).json({
                code:400,
                message: "Invalid filter parameter."
            });

        }

    } catch (error) {
        console.log("error",error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code:500,
            message: "Something went wrong."
        });
    }
};


exports.get = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var ID = req.params.id;
    var pageIndex = req.query.pageIndex ? req.query.pageIndex : null;
    var pageSize = req.query.pageSize ? req.query.pageSize : null;
    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {

        if (IS_FILTER_WRONG == "0") {

            filter = filter.replace(/'/g, "''");

            const setContext = `
                SET @v_ID = '${ID}';
SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
                SET @v_SORT_KEY = '${sortKey}';
                SET @v_SORT_VALUE = '${sortValue}';
                SET @v_FILTER = '${filter}';
            `;

            mm.executeQueryData(
                setContext + ` CALL sp_shiprocketWebhookLogs_getById(); `,
                [],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log("error",error)
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                            code:400,
                            message: "Failed to get app language information."
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r) && r.length);

                    const count = resultSets[0]?.[0]?.cnt || 0;
                    const data = resultSets[1] || [];

                    res.status(200).json({
                        "code": 200,
                        message: "success",
                        TAB_ID: 189,
                        count: count,
                        data: data
                    });

                }
            );

        } else {

            res.status(400).json({
                code:400,
                message: "Invalid filter parameter."
            });

        }

    } catch (error) {
        console.log("error",error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code:400,
            message: "Something went wrong."
        });
    }
};


exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            code:422,
            message: errors.errors
        });
    } else {
        try {
            mm.executeQueryData(
                `CALL sp_shiprocketWebhookLogs_create(?,?,?,?,?)`,
                [
                    data.ORDER_ID,
                    data.SHIPMENT_ID,
                    data.RESPONSE,
                    data.RECEIVED_DATE,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );
                        res.status(400).json({
                            code:400,
                            message: "Failed to save shiprocketWebhookLogs information..."
                        });
                    } else {
                        res.status(200).json({
                            code:200,
                            message: "ShiprocketWebhookLogs information saved successfully..."
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(
                supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                applicationkey
            );
            console.log(error);
            res.status(500).json({
                code:500,
                message: "Something went wrong."
            });
        }
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            message: errors.errors
        });
    } else {
        try {
            mm.executeQueryData(
                `CALL sp_shiprocketWebhookLogs_update(?,?,?,?,?,?)`,
                [
                    req.body.ID,
                    data.ORDER_ID,
                    data.SHIPMENT_ID,
                    data.RESPONSE,
                    data.RECEIVED_DATE,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );
                        res.status(400).json({
                            code:400,
                            message: "Failed to update shiprocketWebhookLogs information."
                        });
                    } else {
                        res.status(200).json({
                            code:200,
                            message: "ShiprocketWebhookLogs information updated successfully..."
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(
                supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                applicationkey
            );
            console.log(error);
            res.status(500).json({
                code:500,
                message: "Something went wrong."
            });
        }
    }
};
