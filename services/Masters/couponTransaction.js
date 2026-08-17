const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var couponTypeMaster = "coupon_transactions";
var viewCouponTypeMaster = "view_" + couponTypeMaster;

function reqData(req) {
    var data = {
        COUPON_ID: req.body.COUPON_ID,
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        COUPON_CODE: req.body.COUPON_CODE,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CART_ID: req.body.CART_ID,
        ORDER_ID: req.body.ORDER_ID,
        COUPON_AMOUNT: req.body.COUPON_AMOUNT,
        DISCOUNTED_AMOUNT: req.body.DISCOUNTED_AMOUNT,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT,
        STATUS: req.body.STATUS,
        APPLIED_DATE_TIME: req.body.APPLIED_DATE_TIME,
        REMOVED_DATETIME: req.body.REMOVED_DATETIME,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').exists(), body('ID').optional(),

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
            setContext+'CALL sp_couponTransactions_get()',
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
    const data = req.body;

    mm.executeQueryData(
        `CALL sp_couponTransactions_create(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            data.COUPON_ID,
            data.TRANSACTION_ID,
            data.COUPON_CODE,
            data.CUSTOMER_ID,
            data.CART_ID,
            data.ORDER_ID,
            data.COUPON_AMOUNT,
            data.DISCOUNTED_AMOUNT,
            data.TOTAL_AMOUNT,
            data.STATUS,
            data.APPLIED_DATE_TIME,
            data.REMOVED_DATETIME,
            data.CLIENT_ID
        ],
        supportKey,
        (error) => {
            if (error) {
                return res.send({ code: 400, message: "Failed to create coupon" });
            }
            res.send({ code: 200, message: "Coupon created successfully" });
        }
    );
};

exports.update = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const data = req.body;

    mm.executeQueryData(
        `CALL sp_couponTransactions_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            data.ID,
            data.COUPON_ID,
            data.TRANSACTION_ID,
            data.COUPON_CODE,
            data.CUSTOMER_ID,
            data.CART_ID,
            data.ORDER_ID,
            data.COUPON_AMOUNT,
            data.DISCOUNTED_AMOUNT,
            data.TOTAL_AMOUNT,
            data.STATUS,
            data.APPLIED_DATE_TIME,
            data.REMOVED_DATETIME,
            data.CLIENT_ID
        ],
        supportKey,
        (error) => {
            if (error) {
                console.log(error);
                return res.send({
                    code: 400,
                    message: "Failed to update couponType information"
                });
            }

            res.send({
                code: 200,
                message: "CouponType information updated successfully"
            });
        }
    );
};

