const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var couponUsage = "coupon_usage";
var viewCouponUsage = "view_" + couponUsage;

function reqData(req) {
    var data = {
        COUPON_ID: req.body.COUPON_ID,
        COSTOMER_ID: req.body.COSTOMER_ID,
        USED_DATETIME: req.body.USED_DATETIME,
        DISCOUNT_AMOUNT: req.body.DISCOUNT_AMOUNT ? req.body.DISCOUNT_AMOUNT : 0,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        CART_ID: req.body.CART_ID,
        ORDER_ID: req.body.ORDER_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('COUPON_ID').isInt().optional(),
        body('COSTOMER_ID').isInt().optional(),
        body('USED_DATETIME').optional(),
        body('DISCOUNT_AMOUNT').isDecimal().optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('CART_ID').isInt().optional(),
        body('ORDER_ID').isInt().optional(),
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
            setContext+'CALL sp_couponUsage_get()',
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
                    "TAB_ID": 2,
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
    
    const supportKey = req.headers['supportkey'];

    mm.executeQueryData(
        `CALL sp_couponUsage_create(?,?,?,?,?,?,?,?)`,
        [
            data.COUPON_ID,
            data.COSTOMER_ID,
            data.USED_DATETIME,
            data.DISCOUNT_AMOUNT || 0,
            data.TOTAL_AMOUNT || 0,
            data.CART_ID,
            data.ORDER_ID,
            data.CLIENT_ID
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log(error);
                return res.send({
                    code: 400,
                    message: "Failed to save couponUsage information"
                });
            }

            res.send({
                code: 200,
                message: "CouponUsage information saved successfully"
            });
        }
    );
};

exports.update = (req, res) => {
    const supportKey = req.headers['supportkey'];

    mm.executeQueryData(
        `CALL sp_couponUsage_update(?,?,?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            req.body.COUPON_ID,
            req.body.COSTOMER_ID,
            req.body.USED_DATETIME,
            req.body.DISCOUNT_AMOUNT || 0,
            req.body.TOTAL_AMOUNT || 0,
            req.body.CART_ID,
            req.body.ORDER_ID,
            req.body.CLIENT_ID
        ],
        supportKey,
        (error) => {
            if (error) {
                console.log(error);
                return res.send({
                    code: 400,
                    message: "Failed to update couponUsage information"
                });
            }

            res.send({
                code: 200,
                message: "CouponUsage information updated successfully"
            });
        }
    );
};
