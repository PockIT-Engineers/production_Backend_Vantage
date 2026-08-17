const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var shopOrderDetails = "shop_order_details";
var viewShopOrderDetails = "view_" + shopOrderDetails;

function reqData(req) {
    return {
        ORDER_ID: req.body.ORDER_ID,
        BRAND_ID: req.body.BRAND_ID,
        INVENTORY_ID: req.body.INVENTORY_ID,
        CATEGORY_ID: req.body.CATEGORY_ID,
        SUB_CATEGORY_ID: req.body.SUB_CATEGORY_ID,
        QUANTITY: req.body.QUANTITY || 0,
        RATE: req.body.RATE || 0,
        UNIT_ID: req.body.UNIT_ID,
        UNIT_NAME: req.body.UNIT_NAME,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT || 0,
        BRAND_NAME: req.body.BRAND_NAME,
        UNIQUE_NUMBER: req.body.UNIQUE_NUMBER,
        DESCRIPTION: req.body.DESCRIPTION,
        COUPON_ID: req.body.COUPON_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        PRODUCT_CATALOGUE_ID: req.body.PRODUCT_CATALOGUE_ID,
        PRODUCT_ITEM_ID: req.body.PRODUCT_ITEM_ID,
        TAX_EXCLUSIVE_AMOUNT: req.body.TAX_EXCLUSIVE_AMOUNT || 0,
        TAX_RATE: req.body.TAX_RATE || 0,
        TAX_AMOUNT: req.body.TAX_AMOUNT || 0,
        TAX_INCLUSIVE_AMOUNT: req.body.TAX_INCLUSIVE_AMOUNT || 0,
        CESS: req.body.CESS || 0,
        CGST: req.body.CGST || 0,
        SGST: req.body.SGST || 0,
        IGST: req.body.IGST || 0,
        CATEGORY_NAME: req.body.CATEGORY_NAME,
        SUB_CATEGORY_NAME: req.body.SUB_CATEGORY_NAME,
        PRODUCT_PARENT_NAME: req.body.PRODUCT_PARENT_NAME,
        PRODUCT_NAME: req.body.PRODUCT_NAME,
        TOTAL_TAX_EXCLUSIVE_AMOUNT: req.body.TOTAL_TAX_EXCLUSIVE_AMOUNT || 0,
        IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS || 0,
        INVENTORY_IMAGE: req.body.INVENTORY_IMAGE,
        VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
        WEIGHT: req.body.WEIGHT,
        LENGTH: req.body.LENGTH,
        BREADTH: req.body.BREADTH,
        HEIGHT: req.body.HEIGHT,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT
    };
}


exports.validate = function () {
    return [
        body('ORDER_ID').isInt().optional(),
        body('BRAND_ID').isInt().optional(),
        body('INVENTORY_ID').isInt().optional(),
        body('CATEGORY_ID').isInt().optional(),
        body('SUB_CATEGORY_ID').isInt().optional(),
        body('QUANTITY').isInt().optional(),
        body('RATE').isInt().optional(),
        body('UNIT_ID').isInt().optional(),
        body('UNIT_NAME').optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('BRAND_NAME').optional(),
        body('UNIQUE_NUMBER').optional(),
        body('DESCRIPTION').optional(),
        body('COUPON_ID').isInt().optional(),
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
                setContext + ` CALL sp_shopOrderDetails_get(); `,
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
                        TAB_ID: 191,
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
                setContext + ` CALL sp_shopOrderDetails_getById(); `,
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
                        TAB_ID: 191,
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
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code:500,
            message: "Something went wrong."
        });
    }
};


exports.create = (req, res) => {
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var data = reqData(req);

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({code:422, message: errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_shopOrderDetails_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.ORDER_ID,
                data.BRAND_ID,
                data.INVENTORY_ID,
                data.CATEGORY_ID,
                data.SUB_CATEGORY_ID,
                data.QUANTITY,
                data.RATE,
                data.UNIT_ID,
                data.UNIT_NAME,
                data.TOTAL_AMOUNT,
                data.BRAND_NAME,
                data.UNIQUE_NUMBER,
                data.DESCRIPTION,
                data.COUPON_ID,
                data.CLIENT_ID,
                data.PRODUCT_CATALOGUE_ID,
                data.PRODUCT_ITEM_ID,
                data.TAX_EXCLUSIVE_AMOUNT,
                data.TAX_RATE,
                data.TAX_AMOUNT,
                data.TAX_INCLUSIVE_AMOUNT,
                data.CESS,
                data.CGST,
                data.SGST,
                data.IGST,
                data.CATEGORY_NAME,
                data.SUB_CATEGORY_NAME,
                data.PRODUCT_PARENT_NAME,
                data.PRODUCT_NAME,
                data.TOTAL_TAX_EXCLUSIVE_AMOUNT,
                data.IS_HAVE_VARIANTS,
                data.INVENTORY_IMAGE,
                data.VARIANT_COMBINATION,
                data.WEIGHT,
                data.LENGTH,
                data.BREADTH,
                data.HEIGHT,
                data.QUANTITY_PER_UNIT
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({code:400, message: "Failed to save shopOrderDetails information..." });
                } else {
                    res.status(200).json({code:200, message: "ShopOrderDetails information saved successfully..." });
                }
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({code:500, message: "Something went wrong." });
    }
};


exports.update = (req, res) => {
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var data = reqData(req);

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({code:422, message: errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_shopOrderDetails_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.ORDER_ID,
                data.BRAND_ID,
                data.INVENTORY_ID,
                data.CATEGORY_ID,
                data.SUB_CATEGORY_ID,
                data.QUANTITY,
                data.RATE,
                data.UNIT_ID,
                data.UNIT_NAME,
                data.TOTAL_AMOUNT,
                data.BRAND_NAME,
                data.UNIQUE_NUMBER,
                data.DESCRIPTION,
                data.COUPON_ID,
                data.CLIENT_ID,
                data.PRODUCT_CATALOGUE_ID,
                data.PRODUCT_ITEM_ID,
                data.TAX_EXCLUSIVE_AMOUNT,
                data.TAX_RATE,
                data.TAX_AMOUNT,
                data.TAX_INCLUSIVE_AMOUNT,
                data.CESS,
                data.CGST,
                data.SGST,
                data.IGST,
                data.CATEGORY_NAME,
                data.SUB_CATEGORY_NAME,
                data.PRODUCT_PARENT_NAME,
                data.PRODUCT_NAME,
                data.TOTAL_TAX_EXCLUSIVE_AMOUNT,
                data.IS_HAVE_VARIANTS,
                data.INVENTORY_IMAGE,
                data.VARIANT_COMBINATION,
                data.WEIGHT,
                data.LENGTH,
                data.BREADTH,
                data.HEIGHT,
                data.QUANTITY_PER_UNIT
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({code:400, message: "Failed to update shopOrderDetails information." });
                } else {
                    res.status(200).json({code:200, message: "ShopOrderDetails information updated successfully..." });
                }
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({code:500, message: "Something went wrong." });
    }
};
