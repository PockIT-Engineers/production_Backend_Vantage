const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var shopOrderSummaryDetails = "shop_order_summary_details";
var viewShopOrderSummaryDetails = "view_" + shopOrderSummaryDetails;


function reqData(req) {
    var data = {
        ORDER_ID: req.body.ORDER_ID,
        GROSS_AMOUNT: req.body.GROSS_AMOUNT ? req.body.GROSS_AMOUNT : 0,
        COUPON_CHARGES: req.body.COUPON_CHARGES ? req.body.COUPON_CHARGES : 0,
        DISCOUNT_CHARGES: req.body.DISCOUNT_CHARGES ? req.body.DISCOUNT_CHARGES : 0,
        DELIVERY_CHARGES: req.body.DELIVERY_CHARGES ? req.body.DELIVERY_CHARGES : 0,
        TAX_AMOUNT: req.body.TAX_AMOUNT ? req.body.TAX_AMOUNT : 0,
        NET_AMOUNT: req.body.NET_AMOUNT ? req.body.NET_AMOUNT : 0,
        CLIENT_ID: req.body.CLIENT_ID,
        TAX_RATE: req.body.TAX_RATE
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID').isInt().optional(),
        body('GROSS_AMOUNT').isDecimal().optional(),
        body('COUPON_CHARGES').isDecimal().optional(),
        body('DISCOUNT_CHARGES').isDecimal().optional(),
        body('DELIVERY_CHARGES').isDecimal().optional(),
        body('TAX_AMOUNT').isDecimal().optional(),
        body('NET_AMOUNT').isDecimal().optional(),
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
                setContext + ` CALL sp_shopOrderSummaryDetails_get(); `,
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
                        TAB_ID: 188,
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
                setContext + ` CALL sp_shopOrderSummaryDetails_getById(); `,
                [],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log("error",error)
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                             code:400,
                            message: "Failed to get information."
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r) && r.length);

                    const count = resultSets[0]?.[0]?.cnt || 0;
                    const data = resultSets[1] || [];

                    res.status(200).json({
                        "code": 200,
                        message: "success",
                        TAB_ID: 188,
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


exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
             code:422,
            message: errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_shopOrderSummaryDetails_create(?,?,?,?,?,?,?,?,?)`,
            [
                data.ORDER_ID,
                data.GROSS_AMOUNT,
                data.COUPON_CHARGES,
                data.DISCOUNT_CHARGES,
                data.DELIVERY_CHARGES,
                data.TAX_AMOUNT,
                data.NET_AMOUNT,
                data.CLIENT_ID,
                data.TAX_RATE
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        code:400,
                        message: "Failed to save shopOrderSummaryDetails information."
                    });
                }

                res.status(200).json({
                     code:200,
                    message: "ShopOrderSummaryDetails information saved successfully."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
             code:500,
            message: "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!ID) {
        return res.status(400).json({
             code:400,
            message: "ID is required."
        });
    }

    if (!errors.isEmpty()) {
        return res.status(422).json({
             code:422,
            message: errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_shopOrderSummaryDetails_update(?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.ORDER_ID,
                data.GROSS_AMOUNT,
                data.COUPON_CHARGES,
                data.DISCOUNT_CHARGES,
                data.DELIVERY_CHARGES,
                data.TAX_AMOUNT,
                data.NET_AMOUNT,
                data.CLIENT_ID,
                data.TAX_RATE
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                         code:400,
                        message: "Failed to update shopOrderSummaryDetails information."
                    });
                }

                res.status(200).json({
                     code:200,
                    message: "ShopOrderSummaryDetails information updated successfully."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
             code:400,
            message: "Something went wrong."
        });
    }
};
