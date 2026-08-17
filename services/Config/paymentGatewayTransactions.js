const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const request = require("request");
const applicationkey = process.env.APPLICATION_KEY;
var paymentGatewayTransactions = "payment_gateway_transactions";
var viewPaymentGatewayTransactions = "view_" + paymentGatewayTransactions;

function reqData(req) {
    var data = {
        CART_ID: req.body.CART_ID,
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        VENDOR_ID: req.body.VENDOR_ID,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        MEMBER_FROM: req.body.MEMBER_FROM ? '1' : '0',
        PAYMENT_FOR: req.body.PAYMENT_FOR,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        TRANSACTION_DATE: req.body.TRANSACTION_DATE,
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        TRANSACTION_STATUS: req.body.TRANSACTION_STATUS,
        TRANSACTION_AMOUNT: req.body.TRANSACTION_AMOUNT,
        PAYLOAD: req.body.PAYLOAD,
        RESPONSE_DATA: req.body.RESPONSE_DATA,
        MERCHENT_ORDER_ID: req.body.MERCHENT_ORDER_ID,
        MERCHENT_ID: req.body.MERCHENT_ID,
        RESPONSE_MESSAGE: req.body.RESPONSE_MESSAGE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CART_ID').isInt().optional(),
        body('ORDER_ID').isInt().optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('JOB_CARD_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('VENDOR_ID').isInt().optional(),
        body('MOBILE_NUMBER').optional(),
        body('MEMBER_FROM').optional(),
        body('PAYMENT_FOR').optional(),
        body('PAYMENT_MODE').optional(),
        body('TRANSACTION_DATE').optional(),
        body('TRANSACTION_ID').optional(),
        body('TRANSACTION_STATUS').optional(),
        body('TRANSACTION_AMOUNT').optional(),
        body('PAYLOAD').optional(),
        body('RESPONSE_DATA').optional(),
        body('MERCHENT_ORDER_ID').optional(),
        body('MERCHENT_ID').optional(),
        body('RESPONSE_MESSAGE').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let keywords = req.body.keywords ? req.body.keywords : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : keywords;
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
        return res.status(400).json({
            "code": 400,
             "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_paymentGatewayTransactions_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get paymentGatewayTransactions data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 81,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    mm.executeQueryData(
        `CALL sp_paymentGatewayTransaction_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            data.CART_ID,
            data.ORDER_ID,
            data.CUSTOMER_ID,
            data.JOB_CARD_ID,
            data.TECHNICIAN_ID,
            data.VENDOR_ID,
            data.MOBILE_NUMBER,
            data.MEMBER_FROM,
            data.PAYMENT_FOR,
            data.PAYMENT_MODE,
            data.TRANSACTION_DATE,
            data.TRANSACTION_ID,
            data.TRANSACTION_STATUS,
            data.TRANSACTION_AMOUNT,
            data.PAYLOAD,
            data.RESPONSE_DATA,
            data.MERCHENT_ORDER_ID,
            data.MERCHENT_ID,
            data.RESPONSE_MESSAGE,
            data.CLIENT_ID
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log("error",error)
                logger.error(supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.status(400).json({ "code":400, "message": "Failed to save payment gateway transactions information..." });
            }
            res.status(200).json({ "code":200,
                 "message": "Payment gateway transactions information saved successfully...",
                data: results[0][0]
            });
        }
    );
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    mm.executeQueryData(
        `CALL sp_paymentGatewayTransaction_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            data.CART_ID || null,
            data.ORDER_ID || null,
            data.CUSTOMER_ID || null,
            data.JOB_CARD_ID || null,
            data.TECHNICIAN_ID || null,
            data.VENDOR_ID || null,
            data.MOBILE_NUMBER || null,
            data.MEMBER_FROM || null,
            data.PAYMENT_FOR || null,
            data.PAYMENT_MODE || null,
            data.TRANSACTION_DATE || null,
            data.TRANSACTION_ID || null,
            data.TRANSACTION_STATUS || null,
            data.TRANSACTION_AMOUNT || null,
            data.PAYLOAD || null,
            data.RESPONSE_DATA || null,
            data.MERCHENT_ORDER_ID || null,
            data.MERCHENT_ID || null,
            data.RESPONSE_MESSAGE || null,
            data.CLIENT_ID || null
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log("error",error)
                logger.error(supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.status(400).json({ "code":400, "message": "Failed to update payment gateway transactions information." });
            }
            res.status(200).json({ "code":200,
                 "message": "Payment gateway transactions information updated successfully...",
                data: results[0][0]
            });
        }
    );
};


exports.createOrder = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const {
        CART_ID,
        ORDER_ID,
        CUSTOMER_ID,
        JOB_CARD_ID,
        PAYMENT_FOR,
        amount,
        CLIENT_ID
    } = req.body;
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    try {
        const options = {
            url: process.env.RAZORPAY_ORDER_URL,
            headers: { "content-type": "application/json" },
            auth: {
                user: key_id,
                pass: key_secret
            },
            body: {
                amount: amount, // in paise
                currency: "INR",
                receipt: `receipt_${CART_ID}_${Date.now()}`,
                notes: {
                    CART_ID,
                    ORDER_ID,
                    CUSTOMER_ID
                }
            },
            json: true
        };

        request.post(options, (error, response, body) => {

            if (error) {
                return res.status(500).json({
                    "code": 500,
                     "message": "Razorpay request failed.",
                    data: error
                });
            }

            const isSuccess = body && body.id && !body.error;
            const razorpayOrderId = isSuccess ? body.id : null;

            mm.executeQueryData(
                `CALL sp_paymentGatewayOrderLog_create(?,?,?,?,?,?,?,?,?,?)`,
                [
                    CART_ID,
                    ORDER_ID,
                    CUSTOMER_ID,
                    JOB_CARD_ID,
                    PAYMENT_FOR,
                    mm.getSystemDate(),
                    JSON.stringify(options),
                    JSON.stringify(body),
                    CLIENT_ID || 1,
                    razorpayOrderId
                ],
                supportKey,
                (logErr, result) => {

                    if (logErr) {
                        logger.error(
                            supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(logErr),
                            applicationkey
                        );
                        return res.status(400).json({
                            "code": 400,
                             "message": "Failed to save payment gateway logs.",
                            data: body
                        });
                    }

                    if (!isSuccess) {
                        return res.status(400).json({
                            "code": 400,
                             "message": "Failed to create Razorpay order.",
                            data: body
                        });
                    }

                    return res.status(200).json({
                        "code": 200,
                         "message": "Razorpay order created successfully.",
                        data: body
                    });
                }
            );
        });

    } catch (error) {
        logger.error(
            supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        return res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

