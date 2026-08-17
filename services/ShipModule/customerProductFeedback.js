const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async')
const applicationkey = process.env.APPLICATION_KEY;

var customerProductFeedback = "customer_product_feedback";
var viewCustomerProductFeedback = "view_" + customerProductFeedback;

function reqData(req) {

    var data = {
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        INVENTORY_ID: req.body.INVENTORY_ID,
        RATING: req.body.RATING ? req.body.RATING : 0,
        COMMENTS: req.body.COMMENTS,
        FEEDBACK_DATE_TIME: req.body.FEEDBACK_DATE_TIME,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID').isInt(),
        body('CUSTOMER_ID').isInt(),
        body('INVENTORY_ID').isInt(),
        body('RATING').isDecimal(),
        body('COMMENTS', ' parameter missing').exists(),
        body('FEEDBACK_DATE_TIME', ' parameter missing').exists(),
        body('ID').optional(),
    ]
}




exports.get = (req, res) => {

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
                setContext + ` CALL sp_customerProductFeedback_get(); `,
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
                        TAB_ID: 193,
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
                `CALL sp_customerProductFeedback_create(?,?,?,?,?,?,?)`,
                [
                    data.ORDER_ID,
                    data.CUSTOMER_ID,
                    data.INVENTORY_ID,
                    data.RATING,
                    data.COMMENTS,
                    data.FEEDBACK_DATE_TIME,
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
                            message: "Failed to save customerProductFeedback information..."
                        });
                    } else {
                        res.status(200).json({
                            code:200,
                            message: "CustomerProductFeedback information saved successfully..."
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
            code:422,
            message: errors.errors
        });
    } else {
        try {
            mm.executeQueryData(
                `CALL sp_customerProductFeedback_update(?,?,?,?,?,?,?,?)`,
                [
                    req.body.ID,
                    data.ORDER_ID,
                    data.CUSTOMER_ID,
                    data.INVENTORY_ID,
                    data.RATING,
                    data.COMMENTS,
                    data.FEEDBACK_DATE_TIME,
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
                            message: "Failed to update customerProductFeedback information."
                        });
                    } else {
                        res.status(200).json({
                            code:200,
                            message: "CustomerProductFeedback information updated successfully..."
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


exports.addFeedback = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            code:422,
            message: errors.errors
        });
    }

    try {
        const connection = mm.openConnection();
        let inventoryIds = Array.isArray(data.INVENTORY_ID)
            ? data.INVENTORY_ID
            : [data.INVENTORY_ID];

        async.eachSeries(
            inventoryIds,
            (inventoryId, callback) => {

                mm.executeDML(
                    `CALL sp_customerProductFeedback_addFeedback(?,?,?,?,?,?,?)`,
                    [
                        data.ORDER_ID,
                        data.CUSTOMER_ID,
                        inventoryId,
                        data.RATING || 0,
                        data.COMMENTS,
                        systemDate,
                        data.CLIENT_ID
                    ],
                    supportKey,
                    connection,
                    (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(
                                supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                                applicationkey
                            );
                            return callback(error);
                        }
                        callback();
                    }
                );
            },
            (error) => {
                if (error) {
                    console.log("Error occurred while inserting feedback");
                    mm.rollbackConnection(connection);
                    return res.status(400).json({
                        code:400,
                        message: "Failed to save customerProductFeedback information..."
                    });
                }

                mm.commitConnection(connection);
                res.status(200).json({
                    code:200,
                    message: "CustomerProductFeedback information saved successfully..."
                });
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
};


exports.getCustomerProductFeedback = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
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
                setContext + ` CALL sp_customerProductFeedback_getCustomerProductFeedback(); `,
                [],
                supportKey,
                (error, result) => {

                    if (error) {
                        console.log("error",error)
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                            code:400,
                            message: "Failed to get app language information."
                        });
                    }

                    const resultSets = result.filter(r => Array.isArray(r));

                    const count = resultSets[0]?.[0]?.cnt || 0;
                    const results = resultSets[1] || [];
                    const progressResults = resultSets[2] || [];
                    const avgResults = resultSets[3] || [];
                    console.log("resultSets",resultSets)
                    res.status(200).json({
                        "code": 200,
                        message: "success",
                        "count": count,
                        "data": results,
                        "progress": progressResults,
                        "averageRating": avgResults[0].AVG_RATING
                    });

                }
            );

        } else {

            res.status(400).json({
                code: 400,
                message: "Invalid filter parameter."
            });

        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code: 400,
            message: "Something went wrong."
        });
    }
};
