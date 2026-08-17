const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var shopOrderMaster = "shop_order_master";
var viewShopOrderMaster = "view_" + shopOrderMaster;
const async = require('async');
const dbm = require('../../utilities/dbMongo');
const shopOrderActionLog = require("../../modules/shopOrderActionLog")
const token = require('../ShipModule/shiprocketLoginInfo')
const request = require('request')
const pdf = require('html-pdf');
function reqData(req) {
    return {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CART_ID: req.body.CART_ID,
        ORDER_DATE_TIME: req.body.ORDER_DATE_TIME,
        ESTIMATED_DATE_TIME: req.body.ESTIMATED_DATE_TIME,
        ORDER_STATUS: req.body.ORDER_STATUS,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        PAYMENT_STATUS: req.body.PAYMENT_STATUS,

        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT || 0,
        COUPON_CODE: req.body.COUPON_CODE,
        COUPON_AMOUNT: req.body.COUPON_AMOUNT || 0,
        FINAL_AMOUNT: req.body.FINAL_AMOUNT || 0,

        DELIVERY_ADDRESS_ID: req.body.DELIVERY_ADDRESS_ID,
        SPECIAL_INSTRUCTIONS: req.body.SPECIAL_INSTRUCTIONS,
        TERRITORY_ID: req.body.TERRITORY_ID,
        ORDER_NUMBER: req.body.ORDER_NUMBER,

        OEDER_COMPLETED_DATETIME: req.body.OEDER_COMPLETED_DATETIME,
        RESCHEDULE_REQUEST_DATE: req.body.RESCHEDULE_REQUEST_DATE,
        RESCHEDULE_APPROVE_DATE: req.body.RESCHEDULE_APPROVE_DATE,
        RESCHEDULE_REQUEST_REMARK: req.body.RESCHEDULE_REQUEST_REMARK,
        RESCHEDULE_REQUEST_REASON: req.body.RESCHEDULE_REQUEST_REASON,

        EXPECTED_PREAPARATION_DATETIME: req.body.EXPECTED_PREAPARATION_DATETIME,
        EXPECTED_PACKAGING_DATETIME: req.body.EXPECTED_PACKAGING_DATETIME,
        EXPECTED_DISPATCH_DATETIME: req.body.EXPECTED_DISPATCH_DATETIME,

        ACTUAL_PREAPARATION_DATETIME: req.body.ACTUAL_PREAPARATION_DATETIME,
        ACTUAL_PACKAGING_DATETIME: req.body.ACTUAL_PACKAGING_DATETIME,
        ACTUAL_DISPATCH_DATETIME: req.body.ACTUAL_DISPATCH_DATETIME,

        REJECTION_REMARK: req.body.REJECTION_REMARK,

        COUPON_ID: req.body.COUPON_ID,
        ORDER_STATUS_ID: req.body.ORDER_STATUS_ID,
        TOTAL_TAXABLE_AMOUNT: req.body.TOTAL_TAXABLE_AMOUNT || 0,
        DISCOUNT_AMOUNT: req.body.DISCOUNT_AMOUNT || 0,
        TAX_AMOUNT: req.body.TAX_AMOUNT,

        STATE_ID: req.body.STATE_ID,
        IS_SAME_STATE: req.body.IS_SAME_STATE || 0,
        USER_ID: req.body.USER_ID,

        ITEM_COUNT: req.body.ITEM_COUNT || 0,
        WEIGHT: req.body.WEIGHT,
        LENGTH: req.body.LENGTH,
        BREADTH: req.body.BREADTH,
        HEIGHT: req.body.HEIGHT,

        COURIER_ID: req.body.COURIER_ID,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,

        ORDER_ID: req.body.ORDER_ID,
        SHIPMENT_ID: req.body.SHIPMENT_ID,
        AWB_CODE: req.body.AWB_CODE,

        COURIER_DETAILS: req.body.COURIER_DETAILS,
        DELIVERY_DATE: req.body.DELIVERY_DATE,

        STOCK_TAKEN_WAREHOUSE: req.body.STOCK_TAKEN_WAREHOUSE,
        WAREHOUSE_DETAILS: req.body.WAREHOUSE_DETAILS,

        CANCELLATION_REMARK: req.body.CANCELLATION_REMARK,
        ACCEPTANCE_REMARK: req.body.ACCEPTANCE_REMARK,
        SHIPROCKET_FINAL_RESPONSE: req.body.SHIPROCKET_FINAL_RESPONSE,

        PICKUP_SCHEDULED_DATE: req.body.PICKUP_SCHEDULED_DATE,
        LABEL_URL: req.body.LABEL_URL,

        ORDER_SHIPROCKET_DATETIME: req.body.ORDER_SHIPROCKET_DATETIME,
        ORDER_SHIP_ASSIGN_DATETIME: req.body.ORDER_SHIP_ASSIGN_DATETIME,
        ORDER_LABEL_DATETIME: req.body.ORDER_LABEL_DATETIME,
        ORDER_PICKUP_DATETIME: req.body.ORDER_PICKUP_DATETIME,

        IS_SHIP_ORDER: req.body.IS_SHIP_ORDER,
        MANUAL_COURIER_URL: req.body.MANUAL_COURIER_URL,

        ORDER_CANCELLED_DATE: req.body.ORDER_CANCELLED_DATE,
        ORDER_OUT_FOR_DELIVERY_DATE: req.body.ORDER_OUT_FOR_DELIVERY_DATE,

        INVOICE_NUMBER: req.body.INVOICE_NUMBER,

        CLIENT_ID: req.body.CLIENT_ID
    };
}


exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('CART_ID').isInt().optional(),
        body('ORDER_DATE_TIME').optional(),
        body('ESTIMATED_DATE_TIME').optional(),
        body('ORDER_STATUS').optional(),
        body('PAYMENT_MODE').optional(),
        body('PAYMENT_STATUS').optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('COUPON_CODE').optional(),
        body('COUPON_AMOUNT').isDecimal().optional(),
        body('FINAL_AMOUNT').isDecimal().optional(),
        body('DELIVERY_ADDRESS_ID').isInt().optional(),
        body('SPECIAL_INSTRUCTIONS').optional(),
        body('ORDER_NUMBER').optional(),
        body('OEDER_COMPLETED_DATETIME').optional(),
        body('RESCHEDULE_REQUEST_DATE').optional(),
        body('RESCHEDULE_APPROVE_DATE').optional(),
        body('RESCHEDULE_REQUEST_REMARK').optional(),
        body('RESCHEDULE_REQUEST_REASON').optional(),
        body('EXPECTED_PREAPARATION_DATETIME').optional(),
        body('EXPECTED_PACKAGING_DATETIME').optional(),
        body('EXPECTED_DISPATCH_DATETIME').optional(),
        body('ACTUAL_PREAPARATION_DATETIME').optional(),
        body('ACTUAL_PACKAGING_DATETIME').optional(),
        body('ACTUAL_DISPATCH_DATETIME').optional(),
        body('REJECTION_REMARK').optional(),
        body('ID').optional(),
    ]
}

exports.getAll = (req, res) => {

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
                setContext + ` CALL sp_shopOrderMaster_get(); `,
                [],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log("error", error)
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
                        TAB_ID: 185,
                        count: count,
                        data: data
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
        console.log("error", error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.get = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var ID = req.params.id;
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
                SET @v_ID = '${ID}';
SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
                SET @v_SORT_KEY = '${sortKey}';
                SET @v_SORT_VALUE = '${sortValue}';
                SET @v_FILTER = '${filter}';
            `;

            mm.executeQueryData(
                setContext + ` CALL sp_shopOrderMaster_getById(); `,
                [],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log("error", error)
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
                        TAB_ID: 185,
                        count: count,
                        data: data
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
        console.log("error", error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.create = (req, res) => {

    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            code: 422,
            message: errors.errors
        });
    }

    const data = reqData(req);

    try {

        mm.executeQueryData(
            `CALL sp_shopOrderMaster_create(
                ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? )`,
            [

                data.CUSTOMER_ID,
                data.CART_ID,
                data.ORDER_DATE_TIME,
                data.ESTIMATED_DATE_TIME,
                data.ORDER_STATUS,
                data.PAYMENT_MODE,
                data.PAYMENT_STATUS,

                data.TOTAL_AMOUNT,
                data.COUPON_CODE,
                data.COUPON_AMOUNT,
                data.FINAL_AMOUNT,

                data.DELIVERY_ADDRESS_ID,
                data.SPECIAL_INSTRUCTIONS,
                data.TERRITORY_ID,
                data.ORDER_NUMBER,

                data.OEDER_COMPLETED_DATETIME,
                data.RESCHEDULE_REQUEST_DATE,
                data.RESCHEDULE_APPROVE_DATE,
                data.RESCHEDULE_REQUEST_REMARK,
                data.RESCHEDULE_REQUEST_REASON,

                data.EXPECTED_PREAPARATION_DATETIME,
                data.EXPECTED_PACKAGING_DATETIME,
                data.EXPECTED_DISPATCH_DATETIME,

                data.ACTUAL_PREAPARATION_DATETIME,
                data.ACTUAL_PACKAGING_DATETIME,
                data.ACTUAL_DISPATCH_DATETIME,

                data.REJECTION_REMARK,

                data.COUPON_ID,
                data.ORDER_STATUS_ID,
                data.TOTAL_TAXABLE_AMOUNT,
                data.DISCOUNT_AMOUNT,
                data.TAX_AMOUNT,

                data.STATE_ID,
                data.IS_SAME_STATE,
                data.USER_ID,

                data.ITEM_COUNT,
                data.WEIGHT,
                data.LENGTH,
                data.BREADTH,
                data.HEIGHT,

                data.COURIER_ID,
                data.WAREHOUSE_ID,

                data.ORDER_ID,
                data.SHIPMENT_ID,
                data.AWB_CODE,

                data.COURIER_DETAILS,
                data.DELIVERY_DATE,

                data.STOCK_TAKEN_WAREHOUSE,
                data.WAREHOUSE_DETAILS,

                data.CANCELLATION_REMARK,
                data.ACCEPTANCE_REMARK,
                data.SHIPROCKET_FINAL_RESPONSE,

                data.PICKUP_SCHEDULED_DATE,
                data.LABEL_URL,

                data.ORDER_SHIPROCKET_DATETIME,
                data.ORDER_SHIP_ASSIGN_DATETIME,
                data.ORDER_LABEL_DATETIME,
                data.ORDER_PICKUP_DATETIME,

                data.IS_SHIP_ORDER,
                data.MANUAL_COURIER_URL,

                data.ORDER_CANCELLED_DATE,
                data.ORDER_OUT_FOR_DELIVERY_DATE,

                data.INVOICE_NUMBER,

                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to save shopOrder information."
                    });
                }

                return res.status(200).json({
                    code: 200,
                    message: "ShopOrder information saved successfully.",
                    order_id: results[0][0].ID
                });
            }
        );

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.update = (req, res) => {

    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            code: 422,
            message: errors.errors
        });
    }

    const data = reqData(req);

    if (!req.body.ID) {
        return res.status(400).json({
            code: 400,
            message: "ID is required."
        });
    }

    try {

        mm.executeQueryData(
            `CALL sp_shopOrderMaster_update(
                ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )`,
            [
                req.body.ID,

                data.CUSTOMER_ID,
                data.CART_ID,
                data.ORDER_DATE_TIME,
                data.ESTIMATED_DATE_TIME,
                data.ORDER_STATUS,
                data.PAYMENT_MODE,
                data.PAYMENT_STATUS,

                data.TOTAL_AMOUNT,
                data.COUPON_CODE,
                data.COUPON_AMOUNT,
                data.FINAL_AMOUNT,

                data.DELIVERY_ADDRESS_ID,
                data.SPECIAL_INSTRUCTIONS,
                data.TERRITORY_ID,
                data.ORDER_NUMBER,

                data.OEDER_COMPLETED_DATETIME,
                data.RESCHEDULE_REQUEST_DATE,
                data.RESCHEDULE_APPROVE_DATE,
                data.RESCHEDULE_REQUEST_REMARK,
                data.RESCHEDULE_REQUEST_REASON,

                data.EXPECTED_PREAPARATION_DATETIME,
                data.EXPECTED_PACKAGING_DATETIME,
                data.EXPECTED_DISPATCH_DATETIME,

                data.ACTUAL_PREAPARATION_DATETIME,
                data.ACTUAL_PACKAGING_DATETIME,
                data.ACTUAL_DISPATCH_DATETIME,

                data.REJECTION_REMARK,

                data.COUPON_ID,
                data.ORDER_STATUS_ID,
                data.TOTAL_TAXABLE_AMOUNT,
                data.DISCOUNT_AMOUNT,
                data.TAX_AMOUNT,

                data.STATE_ID,
                data.IS_SAME_STATE,
                data.USER_ID,

                data.ITEM_COUNT,
                data.WEIGHT,
                data.LENGTH,
                data.BREADTH,
                data.HEIGHT,

                data.COURIER_ID,
                data.WAREHOUSE_ID,

                data.ORDER_ID,
                data.SHIPMENT_ID,
                data.AWB_CODE,

                data.COURIER_DETAILS,
                data.DELIVERY_DATE,

                data.STOCK_TAKEN_WAREHOUSE,
                data.WAREHOUSE_DETAILS,

                data.CANCELLATION_REMARK,
                data.ACCEPTANCE_REMARK,
                data.SHIPROCKET_FINAL_RESPONSE,

                data.PICKUP_SCHEDULED_DATE,
                data.LABEL_URL,

                data.ORDER_SHIPROCKET_DATETIME,
                data.ORDER_SHIP_ASSIGN_DATETIME,
                data.ORDER_LABEL_DATETIME,
                data.ORDER_PICKUP_DATETIME,

                data.IS_SHIP_ORDER,
                data.MANUAL_COURIER_URL,

                data.ORDER_CANCELLED_DATE,
                data.ORDER_OUT_FOR_DELIVERY_DATE,

                data.INVOICE_NUMBER,

                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to update shopOrder information."
                    });
                }

                return res.status(200).json({
                    code: 200,
                    message: "ShopOrder information updated successfully."
                });
            }
        );

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.orderDetails = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var ID = req.params.id;


    try {
        const setContext = `
                SET @v_ID = '${ID}';
            `;

        mm.executeQueryData(
            setContext + ` CALL sp_shopOrder_orderDetails(); `,
            [],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log("error", error)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to get information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r) && r.length);

                const orderData = resultSets[0] || [];
                const addressData = resultSets[1] || [];
                const summaryData = resultSets[2] || [];
                const detailsData = resultSets[3] || [];

                res.status(200).json({
                    "message": "success",
                    "TAB_ID": 185,
                    "orderData": orderData,
                    "addressData": addressData,
                    "summaryData": summaryData,
                    "detailsData": detailsData,
                });

            }
        );

    } catch (error) {
        console.log("error", error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};


exports.orderUpdateStatus = (req, res) => {

    try {
        const { ID, ORDER_STATUS, REMARK, EXPECTED_DATE_TIME, ACTUAL_DATE_TIME, IS_FIRST, WAREHOUSE_DETAILS, WEIGHT, LENGTH, BREADTH, HEIGHT, COURIER_ID, COURIER_DETAILS, INVENTORY_DETAILS, ACCEPTANCE_REMARK, SHIPMENT_ID, IS_SHIP_ORDER, MANUAL_COURIER_URL } = req.body;

        if (ORDER_STATUS == "OA" || ORDER_STATUS == "OK") {
            if (!WAREHOUSE_DETAILS || !INVENTORY_DETAILS) {
                return res.send({
                    code: 400,
                    message: "WAREHOUSE_DETAILS and INVENTORY_DETAILS is required."
                });
            }
        }

        var supportKey = req.headers['supportkey'];
        const systemDate = mm.getSystemDate();
        const connection = mm.openConnection();
        mm.executeDML(
            `CALL sp_shopOrder_orderUpdateStatus(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                ORDER_STATUS,
                REMARK,
                EXPECTED_DATE_TIME,
                ACTUAL_DATE_TIME,
                IS_SHIP_ORDER,
                WAREHOUSE_DETAILS ? WAREHOUSE_DETAILS[0].ID : null,
                JSON.stringify(WAREHOUSE_DETAILS),
                ACCEPTANCE_REMARK,
                WEIGHT,
                LENGTH,
                BREADTH,
                HEIGHT,
                COURIER_ID,
                JSON.stringify(COURIER_DETAILS),
                systemDate,
                MANUAL_COURIER_URL
            ],
            supportKey,
            connection,
            (error, results) => {

                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to update order."
                    });
                }

                const results1 = results[0];
                const results2 = results[1];

                var DESCRIPTION = '';
                var TITLE = '';
                if (ORDER_STATUS === "OA") {
                    TITLE = 'Order Accepted'
                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                } else if (ORDER_STATUS === "OR") {
                    TITLE = 'Order Rejected'
                    DESCRIPTION = `We regret to inform you that your order ${results1[0].ORDER_NUMBER} has been rejected due to ${REMARK}.`
                } else if (ORDER_STATUS === "ON") {
                    TITLE = 'Order Prepared'
                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been prepared. will notify you once it confirmed.`
                }
                else if (ORDER_STATUS === "OK") {
                    TITLE = 'Order Packaged'
                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been packaged. will notify you once it confirmed.`
                }
                else if (ORDER_STATUS === "OD") {
                    TITLE = 'Order Dispatched'
                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been dispatched. will notify you once it confirmed.`
                }
                else if (ORDER_STATUS === "OS") {
                    TITLE = 'Order Deliverd'
                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been deliverd.`
                }
                else if (ORDER_STATUS === "OC") {
                    TITLE = 'Order Cancelled'
                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been cancelled.`
                }
                else if (ORDER_STATUS === "DO") {
                    TITLE = 'Order out for delivery'
                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been out for delivery.`
                }

                if (ORDER_STATUS == 'OD') {
                    mm.commitConnection(connection);
                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                    var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} for the customer ${results1[0].CUSTOMER_NAME}.`
                    const logData = { ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? EXPECTED_DATE_TIME : null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? EXPECTED_DATE_TIME : null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? EXPECTED_DATE_TIME : null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? ACTUAL_DATE_TIME : null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? ACTUAL_DATE_TIME : null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? ACTUAL_DATE_TIME : null), ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null }
                    dbm.saveLog(logData, shopOrderActionLog);

                    if (results1[0].CUSTOMER_TYPE == 'I') {
                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                    }
                    if (ORDER_STATUS == 'OA' || ORDER_STATUS == 'OK') {
                        mm.sendDynamicEmail(19, ID, supportKey)
                        setTimeout(() => {
                            mm.sendDynamicEmail(18, ID, supportKey)
                        }, 1000);
                    } else if (ORDER_STATUS == 'OS') {
                        mm.sendDynamicEmail(20, ID, supportKey)
                    } else {
                        mm.sendDynamicEmail(18, ID, supportKey)
                    }
                    res.status(200).json({
                        code: 200,
                        message: "OrderMaster information updated successfully."
                    });
                }
                else if (ORDER_STATUS === "OA" || ORDER_STATUS === "OK") {
                    if (INVENTORY_DETAILS) {
                        mm.executeDML(`CALL sp_shopOrder_inventoryTransactionCreate(?,?,?,?)`,
                            [
                                ID,
                                WAREHOUSE_DETAILS[0].ID,
                                JSON.stringify(INVENTORY_DETAILS),
                                systemDate
                            ], supportKey, connection, (error, transactions) => {
                                if (error) {
                                    console.log(` Error adding transaction logs`, error);
                                    mm.rollbackConnection(connection);
                                    res.send({
                                        code: 400,
                                        message: "Failed to update Order Status."
                                    });
                                    console.log("Failed to insert transaction by system.")
                                }
                                else {
                                    if (results2.length === 0) {
                                        mm.rollbackConnection(connection);
                                        res.send({
                                            code: 400,
                                            message: "No items to update."
                                        });
                                    } else {
                                        mm.executeDML(`CALL sp_shopOrder_inventoryStockUpdate(?,?)`,
                                            [
                                                WAREHOUSE_DETAILS[0].ID,
                                                JSON.stringify(results2)
                                            ], supportKey, connection, (error, serviceData) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection);
                                                    console.error("Error updating stock:", error);
                                                    res.send({
                                                        code: 400,
                                                        message: "Failed to update Order Status."
                                                    });
                                                }
                                                else {
                                                    mm.commitConnection(connection);
                                                    var TITLE = 'Order Accepted'
                                                    var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                                    mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Order Accepted", `Hello Admin, A new order ${results1[0].ORDER_NUMBER} has been accepted on ${mm.getSystemDate()}. Please review it.`, "", "O", supportKey, "S", []);
                                                    var TITLE2 = 'Order Packaged'
                                                    var DESCRIPTION2 = `Your order ${results1[0].ORDER_NUMBER} has been packaged. Will notify you once it confirmed.`
                                                    mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Order Packaged", `Hello Admin, order ${results1[0].ORDER_NUMBER} has been packaged on ${mm.getSystemDate()}. Ready for dispatch. Please proceed with the next steps.`, "", "O", supportKey, "S", []);
                                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE2}`, `${DESCRIPTION2}`, "", "O", supportKey, "N", "S", results1);
                                                    if (results1[0].CUSTOMER_TYPE == 'I') {
                                                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, null, results1[0].MOBILE_NO, "shop_order_accepted", REMARK)
                                                    }
                                                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} for customer ${results1[0].CUSTOMER_NAME}.`
                                                    var logData = {
                                                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null
                                                    }
                                                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE2} for customer ${results1[0].CUSTOMER_NAME}.`
                                                    var logData2 = {
                                                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE2, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                                                    }
                                                    generateInvoice(results1[0].ID)
                                                    dbm.saveLog(logData, shopOrderActionLog);
                                                    dbm.saveLog(logData2, shopOrderActionLog);
                                                    if (ORDER_STATUS == 'OA' || ORDER_STATUS == 'OK') {
                                                        mm.sendDynamicEmail(19, ID, supportKey)
                                                        setTimeout(() => {
                                                            mm.sendDynamicEmail(18, ID, supportKey)
                                                        }, 1000);
                                                    } else if (ORDER_STATUS == 'OS') {
                                                        mm.sendDynamicEmail(20, ID, supportKey)
                                                    } else {
                                                        mm.sendDynamicEmail(18, ID, supportKey)
                                                    }
                                                    res.status(200).json({
                                                        code: 200,
                                                        message: "OrderMaster information updated successfully."
                                                    });
                                                }
                                            })
                                    }
                                }
                            });
                    } else {
                        res.status(400).json({
                            code: 400,
                            message: "INVENTORY_DETAILS is required. for order status OA or OK."
                        });
                    }
                }
                else if (ORDER_STATUS == 'SC') {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created order ${results1[0].ORDER_NUMBER} in shiprocket of the customer ${results1[0].CUSTOMER_NAME}.`
                    const logData = {
                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Order Created In Shiprocket', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: systemDate, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                    }

                    shipOrderCreate(results1, results2, results1[0].PICKUP_LOCATION, COURIER_ID, ID, WEIGHT, LENGTH, BREADTH, HEIGHT, connection, supportKey, res, logData, req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, REMARK)
                }
                else if (ORDER_STATUS == 'AO') {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has assign order ${results1[0].ORDER_NUMBER} to courier of the customer ${results1[0].CUSTOMER_NAME}.`
                    const logData = {
                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Order Assigned', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: systemDate, ORDER_SHIP_ASSIGN_DATETIME: systemDate, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                    }
                    shipAssignOrder(results1, COURIER_ID, ID, SHIPMENT_ID, connection, supportKey, res, logData, results1, req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, REMARK)

                }
                else if (ORDER_STATUS == 'GL') {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has generated label for the order ${results1[0].ORDER_NUMBER} of the customer ${results1[0].CUSTOMER_NAME}.`
                    const logData = {
                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Label Generated', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: null, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: systemDate, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                    }
                    shipGenrateLabel(results1, SHIPMENT_ID, ID, connection, supportKey, res, logData, results1, req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, REMARK)
                }
                else if (ORDER_STATUS == 'SP') {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has send the order ${results1[0].ORDER_NUMBER} for pickup of the customer ${results1[0].CUSTOMER_NAME}.`
                    const logData = {
                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Sent For Pickup', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: systemDate, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: systemDate, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                    }
                    shipPickup(results1, SHIPMENT_ID, ID, connection, supportKey, res, logData, results1, req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, REMARK)
                }
                else {
                    mm.commitConnection(connection);
                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                    var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} of the customer ${results1[0].CUSTOMER_NAME}.`
                    const logData = { ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? EXPECTED_DATE_TIME : null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? EXPECTED_DATE_TIME : null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? EXPECTED_DATE_TIME : null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? ACTUAL_DATE_TIME : null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? ACTUAL_DATE_TIME : null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? ACTUAL_DATE_TIME : null), ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null }
                    dbm.saveLog(logData, shopOrderActionLog);
                    if (results1[0].CUSTOMER_TYPE == 'I' && ORDER_STATUS == 'OS') {
                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_delivered", REMARK)
                    }
                    else if (results1[0].CUSTOMER_TYPE == 'I') {
                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                    }
                    if (ORDER_STATUS == 'OA' || ORDER_STATUS == 'OK') {

                        mm.sendDynamicEmail(19, ID, supportKey)
                        setTimeout(() => {
                            mm.sendDynamicEmail(18, ID, supportKey)
                        }, 1000);
                    } else if (ORDER_STATUS == 'OS') {
                        mm.sendDynamicEmail(20, ID, supportKey)
                    } else {
                        mm.sendDynamicEmail(18, ID, supportKey)
                    }
                    res.status(200).json({
                        code: 200,
                        message: "OrderMaster information updated successfully."
                    });
                }

            }
        );

    } catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something Went Wrong."
        });
    }
};


exports.courierServiceability = (req, res) => {
    const { PICKUP_PINCODE, DELIVERY_PINCODE, WEIGHT, LENGTH, BREADTH, HEIGHT } = req.body
    var supportKey = req.headers['supportkey'];
    try {
        token.createToken(supportKey, (error, result) => {
            if (error) {
                console.log("error", error)
                res.status(400).json({
                    "message": "Failed to save pickupLocation information..."
                });
            }
            else {
                const body = {
                    "pickup_postcode": PICKUP_PINCODE,
                    "delivery_postcode": DELIVERY_PINCODE,
                    "cod": 0,
                    "weight": WEIGHT,
                    "length": LENGTH,
                    "breadth": BREADTH,
                    "height": HEIGHT
                }
                var options = {
                    url: 'https://apiv2.shiprocket.in/v1/external/courier/serviceability',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + result
                    },
                    body: body,
                    method: "get",
                    json: true
                }

                request(options, (error, response, body) => {
                    if (error) {
                        console.log("request error -send email ", error);
                        res.status(400).json({
                            "message": "Failed to save pickupLocation information...",
                        });
                    } else {
                        res.status(200).json({
                            "message": "PickupLocation information saved successfully...",
                            "DATA": body
                        });
                    }
                });
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
};

exports.trackThroughShipmentId = (req, res) => {
    const { SHIPMENT_ID } = req.params.shipment_id
    var supportKey = req.headers['supportkey'];
    try {
        token.createToken(supportKey, (error, result) => {
            if (error) {
                console.log("error", error)
                res.status(400).json({
                    "message": "Failed to save pickupLocation information..."
                });
            }
            else {
                var options = {
                    url: 'https://apiv2.shiprocket.in/v1/external/courier/track/shipment/' + SHIPMENT_ID,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + result
                    },
                    body: {},
                    method: "get",
                    json: true
                }

                request(options, (error, response, body) => {
                    if (error) {
                        console.log("request error -send email ", error);
                        res.status(400).json({
                            "message": "Failed to get Tracking information...",
                        });
                    } else {
                        res.status(200).json({
                            "message": "Tracking information get successfully...",
                            "DATA": body
                        });
                    }
                });
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
};

exports.trackThroughOrderId = (req, res) => {
    const ORDER_ID = req.params.order_id
    var supportKey = req.headers['supportkey'];
    try {
        token.createToken(supportKey, (error, result) => {
            if (error) {
                console.log("error", error)
                res.status(400).json({
                    "message": "Failed to save pickupLocation information..."
                });
            }
            else {
                var options = {
                    url: 'https://apiv2.shiprocket.in/v1/external/courier/track/order/' + ORDER_ID,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + result
                    },
                    body: {},
                    method: "get",
                    json: true
                }
                console.log("options", options)
                request(options, (error, response, body) => {
                    if (error) {
                        console.log("request error -send email ", error);
                        res.status(400).json({
                            "message": "Failed to get Tracking information...",
                        });
                    } else {
                        res.status(200).json({
                            "message": "Tracking information get successfully...",
                            "DATA": body
                        });
                    }
                });
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
};

exports.trackThroughAwbCode = (req, res) => {
    const AWB_CODE = req.params.awbCode
    var supportKey = req.headers['supportkey'];
    try {
        token.createToken(supportKey, (error, result) => {
            if (error) {
                console.log("error", error)
                res.status(400).json({
                    "message": "Failed to save pickupLocation information..."
                });
            }
            else {
                var options = {
                    url: 'https://apiv2.shiprocket.in/v1/external/courier/track/awb/' + AWB_CODE,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + result
                    },
                    body: {},
                    method: "get",
                    json: true
                }
                console.log("options", options)
                request(options, (error, response, body) => {
                    if (error) {
                        console.log("request error -send email ", error);
                        res.status(400).json({
                            "message": "Failed to get Tracking information...",
                        });
                    } else {
                        res.status(200).json({
                            "message": "Tracking information get successfully...",
                            "DATA": body
                        });
                    }
                });
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
};

function shipOrderCreate(results1, results2, PICKUP_LOCATION, COURIER_ID, ID, WEIGHT, LENGTH, BREADTH, HEIGHT, connection, supportKey, res, logData, USER_ID, CUSTOMER_ID, REMARK) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                mm.rollbackConnection(connection)
                console.log("error", error)
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to get shopOrder information."
                });
            }
            else {
                var ORDER_DETAILS = []
                for (let i = 0; i < results2.length; i++) {
                    var elemet = {
                        "name": results2[i].PRODUCT_NAME,
                        "sku": `${results2[i].PRODUCT_NAME}${results2[i].ID}`,
                        "units": results2[i].QUANTITY,
                        "selling_price": results2[i].TAX_INCLUSIVE_AMOUNT,
                        "discount": "",
                        "tax": results2[i].TAX_AMOUNT,
                        "hsn": ""
                    }
                    ORDER_DETAILS.push(elemet)
                }
                const createOrderBody = {
                    "order_id": results1[0].ID,
                    "order_date": results1[0].ORDER_DATE,
                    "pickup_location": PICKUP_LOCATION,
                    "channel_id": "",
                    "comment": "",
                    "reseller_name": "",
                    "company_name": "",
                    "billing_customer_name": results1[0].CUSTOMER_NAME,
                    "billing_last_name": "",
                    "billing_address": results1[0].SERVICE_ADDRESS,
                    "billing_isd_code": "",
                    "billing_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "billing_pincode": results1[0].PINCODE.split("-")[0],
                    "billing_state": results1[0].STATE_NAME,
                    "billing_country": results1[0].COUNTRY_NAME,
                    "billing_email": results1[0].EMAIL,
                    "billing_phone": results1[0].MOBILE_NO,
                    "billing_alternate_phone": "",
                    "shipping_is_billing": false,
                    "shipping_customer_name": results1[0].CUSTOMER_NAME,
                    "shipping_last_name": "",
                    "shipping_address": results1[0].SERVICE_ADDRESS,
                    "shipping_address_2": "",
                    "shipping_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "shipping_pincode": results1[0].PINCODE.split("-")[0],
                    "shipping_country": results1[0].COUNTRY_NAME,
                    "shipping_state": results1[0].STATE_NAME,
                    "shipping_email": results1[0].EMAIL,
                    "shipping_phone": results1[0].MOBILE_NO,
                    "order_items": ORDER_DETAILS,
                    "payment_method": results1[0].PAYMENT_METHOD,
                    "shipping_charges": 0,
                    "giftwrap_charges": 0,
                    "transaction_charges": 0,
                    "total_discount": results1[0].COUPON_AMOUNT,
                    "sub_total": (results1[0].FINAL_AMOUNT ? results1[0].FINAL_AMOUNT : results1[0].TOTAL_AMOUNT),
                    "length": LENGTH,
                    "breadth": BREADTH,
                    "height": HEIGHT,
                    "weight": WEIGHT,
                    "ewaybill_no": "",
                    "customer_gstin": "",
                    "invoice_number": "",
                    "order_type": ""
                }
                var createOrderOptions = requestPost('orders/create/adhoc', result3, createOrderBody, "post")
                request(createOrderOptions, (error, response, createOrderData) => {
                    logShiprocketCall(results1[0].ID, createOrderBody, createOrderData, 'orders/create/adhoc', supportKey);
                    if (createOrderData.order_id && createOrderData.status_code != 5) {
                        mm.executeDML(`CALL sp_shopOrder_shipOrderCreate(?,?,?,?,?,?)`,
                            [
                                9,
                                createOrderData.order_id,
                                createOrderData.shipment_id,
                                COURIER_ID,
                                mm.getSystemDate(),
                                ID
                            ], supportKey, connection, (error, results4) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection)
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to get shopOrder information."
                                    });
                                }
                                else {
                                    var TITLE = 'Order placed in Shiprocket'
                                    var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been placed and is now being processed.`
                                    mm.sendNotificationToChannel(USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                    dbm.saveLog(logData, shopOrderActionLog);
                                    // mm.sendDynamicEmail(17, CUSTOMER_ID, supportKey)
                                    if (results1[0].CUSTOMER_TYPE == 'I') {
                                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                    }
                                    mm.commitConnection(connection)
                                    res.status(200).json({
                                        "message": "success",
                                    });
                                }
                            });
                    } else {
                        mm.rollbackConnection(connection)
                        res.status(301).json({
                            "code": 301,
                            "message": "Failed to create order in shiprocket",
                        });
                    }
                });
            }
        })
    } catch (error) {
        mm.rollbackConnection(connection)
        console.error("Error parsing JSON string:", error.message);
        return null;
    }
}

function shipAssignOrder(results1, COURIER_ID, ID, SHIPMENT_ID, connection, supportKey, res, logData, results1, USER_ID, CUSTOMER_ID, REMARK) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                console.log("error", error)
                mm.rollbackConnection(connection)
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to get shopOrder information."
                });
            }
            else {
                var assignOrderBody = {
                    "shipment_id": SHIPMENT_ID,
                    "courier_id": COURIER_ID,
                }

                // ASSIGN ORDER
                var assignOrderOptions = requestPost('courier/assign/awb', result3, assignOrderBody, "post")
                request(assignOrderOptions, (error, response, awbData) => {
                    logShiprocketCall(results1[0].ID, assignOrderBody, awbData, 'courier/assign/awb', supportKey);
                    if (awbData.message) {
                        mm.rollbackConnection(connection)
                        res.status(301).json({
                            "code": 301,
                            "message": "Failed to assign order in shiprocket",
                        });
                    }
                    else {
                        mm.executeDML(`CALL sp_shopOrder_shipAssignOrder(?,?,?,?)`,
                            [
                                10,
                                mm.getSystemDate(),
                                awbData.response.data.awb_code,
                                ID
                            ], supportKey, connection, (error, results4) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection)
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to get shopOrder information."
                                    });
                                }
                                else {
                                    var TITLE = 'Order Assigned'
                                    var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been assigned to courier.`
                                    mm.sendNotificationToChannel(USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                    dbm.saveLog(logData, shopOrderActionLog);
                                    // mm.sendDynamicEmail(17, CUSTOMER_ID, supportKey)
                                    if (results1[0].CUSTOMER_TYPE == 'I') {
                                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                    }
                                    mm.commitConnection(connection)
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "success",
                                    });
                                }
                            });
                    }
                });
            }
        })
    } catch (error) {
        mm.rollbackConnection(connection)
        console.error("Error parsing JSON string:", error.message);
        res.status(500).json({
            "code": 500,
            "message": "success",
        });
    }
}

function shipGenrateLabel(results1, SHIPMENT_ID, ID, connection, supportKey, res, logData, results1, USER_ID, CUSTOMER_ID, REMARK) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                console.log("error", error)
                mm.rollbackConnection(connection)
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to get shopOrder information."
                });
            }
            else {
                var PickupBody = {
                    "shipment_id": [SHIPMENT_ID]
                }
                var generateLableOptions = requestPost('courier/generate/label', result3, PickupBody, "post")
                request(generateLableOptions, (error, response, labelData) => {
                    logShiprocketCall(results1[0].ID, PickupBody, labelData, 'courier/generate/label', supportKey);
                    if (labelData.label_created == 0) {
                        mm.rollbackConnection(connection)
                        res.status(301).json({
                            "code": 301,
                            "message": "Failed to generate label in shiprocket",
                        });
                    }
                    else {
                        mm.executeDML(`CALL sp_shopOrder_shipGenrateLabel(?,?,?,?)`,
                            [
                                11,
                                labelData.label_url,
                                mm.getSystemDate(),
                                ID
                            ], supportKey, connection, (error, results4) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection)
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to get shopOrder information."
                                    });
                                }
                                else {
                                    var TITLE = 'Order Label Generated'
                                    var DESCRIPTION = `Label generated for your order ${results1[0].ORDER_NUMBER}.`
                                    mm.sendNotificationToChannel(USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                    dbm.saveLog(logData, shopOrderActionLog);
                                    // mm.sendDynamicEmail(17, CUSTOMER_ID, supportKey)
                                    if (results1[0].CUSTOMER_TYPE == 'I') {
                                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                    }
                                    mm.commitConnection(connection)
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "success",
                                    });
                                }
                            });
                    }
                });
            }
        })
    } catch (error) {
        mm.rollbackConnection(connection)
        console.error("Error parsing JSON string:", error.message);
        res.status(500).json({
            "code": 500,
            "message": "success",
        });
    }
}

function shipPickup(results1, SHIPMENT_ID, ID, connection, supportKey, res, logData, results1, USER_ID, CUSTOMER_ID, REMARK) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                console.log("error", error)
                mm.rollbackConnection(connection)
                console.error("Error parsing JSON string:", error.message);
                res.status(400).json({
                    "code": 400,
                    "message": "success",
                });
            }
            else {
                var PickupBody = {
                    "shipment_id": [SHIPMENT_ID]
                }
                // SEND PICKUP
                var pickupOptions = requestPost('courier/generate/pickup', result3, PickupBody, "post")
                request(pickupOptions, (error, response, pickupData) => {
                    logShiprocketCall(results1[0].ID, PickupBody, pickupData, 'courier/generate/pickup', supportKey);
                    if (!pickupData.message) {
                        mm.executeDML(`CALL sp_shopOrder_shipPickup(?,?,?,?)`,
                            [
                                12,
                                pickupData.response.pickup_scheduled_date,
                                mm.getSystemDate(),
                                ID
                            ], supportKey, connection, (error, results4) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection)
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to get shopOrder information."
                                    });
                                }
                                else {
                                    var TITLE = 'Order Sent For Pickup'
                                    var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been sent for pickup.`
                                    mm.sendNotificationToChannel(USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                    dbm.saveLog(logData, shopOrderActionLog);
                                    // mm.sendDynamicEmail(17, CUSTOMER_ID, supportKey)
                                    if (results1[0].CUSTOMER_TYPE == 'I') {
                                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                    }
                                    mm.commitConnection(connection)
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "success",
                                    });
                                }
                            });
                    } else {
                        mm.rollbackConnection(connection)
                        res.status(301).json({
                            "code": 301,
                            "message": "Failed to create order in shiprocket",
                        });
                    }
                });
            }
        })
    } catch (error) {
        mm.rollbackConnection(connection)
        console.error("Error parsing JSON string:", error.message);
        res.status(500).json({
            "code": 500,
            "message": "success",
        });
    }
}

function sendToShipRocket(results1, results2, PICKUP_LOCATION, COURIER_ID, ID, WEIGHT, LENGTH, BREADTH, HEIGHT, connection, supportKey, callback) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                console.log("error", error)
                callback(error);
            }
            else {
                var ORDER_DETAILS = []
                for (let i = 0; i < results2.length; i++) {
                    var elemet = {
                        "name": results2[i].PRODUCT_NAME,
                        "sku": `${results2[i].PRODUCT_NAME}${results2[i].ID}`,
                        "units": results2[i].QUANTITY,
                        "selling_price": results2[i].TAX_INCLUSIVE_AMOUNT,
                        "discount": "",
                        "tax": results2[i].TAX_AMOUNT,
                        "hsn": ""
                    }
                    ORDER_DETAILS.push(elemet)
                }
                const createOrderBody = {
                    "order_id": results1[0].ID,
                    "order_date": results1[0].ORDER_DATE,
                    "pickup_location": PICKUP_LOCATION,
                    "channel_id": "",
                    "comment": "",
                    "reseller_name": "",
                    "company_name": "",
                    "billing_customer_name": results1[0].CUSTOMER_NAME,
                    "billing_last_name": "",
                    "billing_address": results1[0].SERVICE_ADDRESS,
                    "billing_isd_code": "",
                    "billing_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "billing_pincode": results1[0].PINCODE.split("-")[0],
                    "billing_state": results1[0].STATE_NAME,
                    "billing_country": results1[0].COUNTRY_NAME,
                    "billing_email": results1[0].EMAIL,
                    "billing_phone": results1[0].MOBILE_NO,
                    "billing_alternate_phone": "",
                    "shipping_is_billing": false,
                    "shipping_customer_name": results1[0].CUSTOMER_NAME,
                    "shipping_last_name": "",
                    "shipping_address": results1[0].SERVICE_ADDRESS,
                    "shipping_address_2": "",
                    "shipping_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "shipping_pincode": results1[0].PINCODE.split("-")[0],
                    "shipping_country": results1[0].COUNTRY_NAME,
                    "shipping_state": results1[0].STATE_NAME,
                    "shipping_email": results1[0].EMAIL,
                    "shipping_phone": results1[0].MOBILE_NO,
                    "order_items": ORDER_DETAILS,
                    "payment_method": results1[0].PAYMENT_METHOD,
                    "shipping_charges": 0,
                    "giftwrap_charges": 0,
                    "transaction_charges": 0,
                    "total_discount": results1[0].COUPON_AMOUNT,
                    "sub_total": (results1[0].FINAL_AMOUNT ? results1[0].FINAL_AMOUNT : results1[0].TOTAL_AMOUNT),
                    "length": LENGTH,
                    "breadth": BREADTH,
                    "height": HEIGHT,
                    "weight": WEIGHT,
                    "ewaybill_no": "",
                    "customer_gstin": "",
                    "invoice_number": "",
                    "order_type": ""
                }
                // CREATE ORDER
                var createOrderOptions = requestPost('orders/create/adhoc', result3, createOrderBody, "post")
                request(createOrderOptions, (error, response, createOrderData) => {
                    console.log("createOrderData", createOrderData)
                    console.log("error", error)
                    logShiprocketCall(results1[0].ID, createOrderBody, createOrderData, 'orders/create/adhoc', supportKey);
                    if (createOrderData.order_id && createOrderData.status_code != 5) {
                        var assignOrderBody = {
                            "shipment_id": createOrderData.shipment_id,
                            "courier_id": COURIER_ID,
                        }

                        // ASSIGN ORDER
                        var assignOrderOptions = requestPost('courier/assign/awb', result3, assignOrderBody, "post")
                        request(assignOrderOptions, (error, response, awbData) => {
                            logShiprocketCall(results1[0].ID, assignOrderBody, awbData, 'courier/assign/awb', supportKey);
                            console.log("awbData", awbData);
                            if (awbData.message) {
                                if (error) {
                                    callback(error);
                                }
                                else {
                                    error = "error"
                                    callback(error)
                                }
                            } else {
                                // GENRATE LABEL
                                var PickupBody = {
                                    "shipment_id": [createOrderData.shipment_id]
                                }
                                var generateLableOptions = requestPost('courier/generate/label', result3, PickupBody, "post")
                                request(generateLableOptions, (error, response, labelData) => {
                                    logShiprocketCall(results1[0].ID, PickupBody, labelData, 'courier/generate/label', supportKey);
                                    console.log("labelData", labelData);
                                    if (labelData.success) {
                                        if (error) {
                                            callback(error);
                                        }
                                        else {
                                            error = "error"
                                            callback(error)
                                        }
                                    } else {
                                        var PickupBody = {
                                            "shipment_id": [createOrderData.shipment_id]
                                        }
                                        // SEND PICKUP
                                        var pickupOptions = requestPost('courier/generate/pickup', result3, PickupBody, "post")
                                        request(pickupOptions, (error, response, pickupData) => {
                                            console.log("pickupData", pickupData);
                                            logShiprocketCall(results1[0].ID, PickupBody, pickupData, 'courier/generate/pickup', supportKey);
                                            if (pickupData.pickup_status) {
                                                if (error) {
                                                    callback(error);
                                                }
                                                else {
                                                    error = "error"
                                                    callback(error)
                                                }
                                                mm.executeDML('UPDATE shop_order_master SET ORDER_ID=?,SHIPMENT_ID=?,AWB_CODE=?,LABEL_URL=?,PICKUP_SCHEDULED_DATE=? WHERE ID=?', [createOrderData.order_id, createOrderData.shipment_id, awbData.response.data.awb_code, labelData.label_url, null, ID], supportKey, connection, (error, results4) => {
                                                    if (error) {
                                                        console.log(error);
                                                        callback(error);
                                                    }
                                                    else {
                                                        callback(null);
                                                    }
                                                });

                                            } else {
                                                mm.executeDML('UPDATE shop_order_master SET ORDER_ID=?,SHIPMENT_ID=?,AWB_CODE=?,LABEL_URL=?,PICKUP_SCHEDULED_DATE=? WHERE ID=?', [createOrderData.order_id, createOrderData.shipment_id, awbData.response.data.awb_code, labelData.label_url, null, ID], supportKey, connection, (error, results4) => {
                                                    if (error) {
                                                        console.log(error);
                                                        callback(error);
                                                    }
                                                    else {
                                                        console.log("error ")
                                                        callback(error);
                                                    }
                                                });

                                            }
                                        });
                                    }
                                });
                            }
                        });

                    } else {
                        if (error) {
                            callback(error);
                        }
                        else {
                            error = "error"
                            callback(error)
                        }
                    }
                });
            }
        })
    } catch (error) {
        console.error("Error parsing JSON string:", error.message);
        return null;
    }
}

function requestPost(url, token, body, method) {
    var options = {
        url: 'https://apiv2.shiprocket.in/v1/external/' + url,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: body,
        method: method,
        json: true
    }
    console.log("options", options)
    return options
}

function logShiprocketCall(orderId, requestData, responseData, apiEndpoint, supportKey) {

    const values = [
        orderId,
        JSON.stringify(requestData),
        JSON.stringify(responseData),
        apiEndpoint,
        "1"
    ];

    mm.executeQueryData(
        `CALL sp_shopOrder_logCreate(?,?,?,?,?)`,
        values,
        supportKey,
        (err, result) => {

            if (err) {
                console.log("Logging error:", err);
            } else {
                console.log("success");
            }
        }
    );
}



exports.updateOrderDelivery = (req, res) => {

    const { order_id, shipment_status, current_status, etd } = req.body;
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];

    try {

        mm.executeQueryData(
            `CALL sp_shopOrder_updateOrderDelivery(?,?,?,?,?,?)`,
            [
                order_id,
                shipment_status,
                current_status,
                JSON.stringify(req.body),
                etd,
                systemDate
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    return res.status(200).json({
                        "message": "Failed to update shopOrder information."
                    });
                }

                const orderData = results[0][0];

                if (!orderData) {
                    return res.status(200).json({
                        "message": "ShopOrder information updated successfully..."
                    });
                }

                let TITLE = '';
                let DESCRIPTION = '';
                let ORDER_STATUS_TEXT = '';
                let ACTION_DETAILS = '';

                if (shipment_status === 'DELIVERED' || current_status === 'DELIVERED') {
                    TITLE = 'Order Delivered';
                    DESCRIPTION = `Your order ${orderData.ORDER_NUMBER} has been delivered.`;
                    ORDER_STATUS_TEXT = 'Order Delivered';
                    ACTION_DETAILS = `Shiprocket has deliver the order ${orderData.ORDER_NUMBER} for the customer ${orderData.CUSTOMER_NAME}.`
                }
                else if (shipment_status === 'Cancelled' || current_status === 'Cancelled') {
                    TITLE = 'Order Cancelled';
                    DESCRIPTION = `Your order ${orderData.ORDER_NUMBER} has been cancelled.`;
                    ORDER_STATUS_TEXT = 'Order Cancelled';
                    ACTION_DETAILS = `Shiprocket has cancelled the order ${orderData.ORDER_NUMBER} for the customer ${orderData.CUSTOMER_NAME}.`
                }
                else if (shipment_status === 'OUT FOR DELIVERY' || current_status === 'OUT FOR DELIVERY') {
                    TITLE = 'Out for Delivery';
                    DESCRIPTION = `Your order ${orderData.ORDER_NUMBER} has been out for delivery.`;
                    ORDER_STATUS_TEXT = 'Out for Delivery';
                    ACTION_DETAILS = `Shiprocket has out for devlivery of the order ${orderData.ORDER_NUMBER} for the customer ${orderData.CUSTOMER_NAME}.`
                }

                const logData = {
                    ORDER_ID: order_id, CUSTOMER_ID: orderData.CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: orderData.CLIENT_ID, USER_ID: 0, ORDER_DATE_TIME: "", CART_ID: orderData.CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Order Delivered', TOTAL_AMOUNT: orderData.TOTAL_AMOUNT, ORDER_NUMBER: orderData.ORDER_NUMBER, PAYMENT_MODE: orderData.PAYMENT_MODE, PAYMENT_STATUS: orderData.PAYMENT_STATUS, USER_NAME: "Shiprocket", EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: null, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: systemDate
                }

                mm.sendNotificationToChannel(
                    0,
                    `customer_${orderData.CUSTOMER_ID}_channel`,
                    TITLE,
                    DESCRIPTION,
                    "",
                    "O",
                    supportKey,
                    "N",
                    "S",
                    [orderData]
                );

                dbm.saveLog(logData, shopOrderActionLog);

                if (ORDER_STATUS_TEXT === 'Order Delivered')
                    mm.sendDynamicEmail(20, order_id, supportKey);
                else if (ORDER_STATUS_TEXT === 'Order Cancelled' || ORDER_STATUS_TEXT === 'Out for Delivery')
                    mm.sendDynamicEmail(18, order_id, supportKey);

                return res.status(200).json({
                    "message": "ShopOrder information updated successfully..."
                });
            }
        );

        logShiprocketCall(order_id, req.body, '', "webhook api", supportKey);

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Something went wrong."
        });
    }
};


function sendWpMessage(NAME, ORDER_NUMBER, STATUS, MOBILE_NO, TEMPLATE_NAME, REMARK) {

    console.log("im in sendWpMessage function", "NAME", NAME, "ORDER_NUMBER", ORDER_NUMBER, "STATUS", STATUS, "MOBILE_NO", MOBILE_NO, "TEMPLATE_NAME", TEMPLATE_NAME);

    var formattedDate = new Date(mm.getSystemDate().split(" ")[0]).toLocaleDateString("en-GB", {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    var wBparams = [];
    if (STATUS == "Order Rejected") {
        wBparams = [{ "type": "text", "text": NAME }, { "type": "text", "text": ORDER_NUMBER }, { "type": "text", "text": REMARK }, { "type": "text", "text": formattedDate }]
        TEMPLATE_NAME = "order_rejected"
    } else {
        wBparams = [
            {
                "type": "text",
                "text": NAME
            },
            {
                "type": "text",
                "text": ORDER_NUMBER
            }
        ];
    }
    if (STATUS && STATUS !== "Order Deliverd" && STATUS !== "Order Rejected") {
        wBparams.push({
            "type": "text",
            "text": STATUS
        });
    }
    var wparams = [
        {
            "type": "body",
            "parameters": wBparams
        }
    ]

    mm.sendWAToolSMS(MOBILE_NO, TEMPLATE_NAME, wparams, 'en', (error, resultswsms) => {
        if (error) {
            console.log(error)
        }
        else {
            console.log("watsapp message sent");

        }
    })
}

async function generateInvoice(ORDER_ID) {
    mm.executeQueryData(`CALL sp_getInvoiceData(?)`,
        [ORDER_ID], "1234", async (error, results) => {
            if (error) {
                console.log(error);
            } else {
                const results1 = results[0]; // order master
                const results2 = results[1]; // order details
                const lastRow = results[2];  // last invoice
                const istNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
                const d = new Date(istNow);
                const yyyy = d.getFullYear();
                const dd = String(d.getDate()).padStart(2, "0");
                const mmm = String(d.getMonth() + 1).padStart(2, "0");
                const todayStr = `${yyyy}${dd}${mmm}`;
                let counter = 1;
                if (lastRow?.length > 0 && lastRow[0].INVOICE_NUMBER) {
                    const lastInv = lastRow[0].INVOICE_NUMBER.replace('.pdf', '');
                    const lastDate = lastInv.substring(6, 14);
                    const lastCount = lastInv.substring(14);
                    if (lastDate === todayStr) {
                        counter = Number(lastCount) + 1;
                    }
                }
                const counterStr = String(counter).padStart(4, "0");
                const invoiceNumber = `INVSHP${todayStr}${counterStr}`;
                const invoiceTemplate = require('fs').readFileSync('templates/shop_order.html', 'utf8');
                const populatedHtml = invoiceTemplate
                    .replace('{{CUSTOMER_NAME}}', results1[0].CUSTOMER_NAME)
                    .replace('{{CUSTOMER_ADDRESS}}', results1[0].SERVICE_ADDRESS)
                    .replace('{{INVOICE_NO}}', invoiceNumber)
                    .replace('{{ORDER_NO}}', results1[0].ORDER_NUMBER)
                    .replace('{{INVOICE_DATE}}', formatDateToReadable(mm.getSystemDate()))
                    .replace('{{PRODUCT_ROWS}}', results2.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td style="max-width:200px; word-wrap:break-word; white-space:normal; text-align: left;">${item.PRODUCT_NAME}</td>
                                <td>${item.HSN_NAME || '-'}</td>
                                <td style="text-align: end;">${item.QUANTITY}</td>
                                <td style="text-align: end;">${item.TAX_EXCLUSIVE_AMOUNT}</td>
                                <td style="text-align: end;">${item.TAX_AMOUNT}</td>
                                <td style="text-align: end;">${item.EXPECTED_DELIVERY_CHARGES * item.QUANTITY}</td>
                                <td style="text-align: right;">${Number(item.TOTAL_AMOUNT) + (Number(item.EXPECTED_DELIVERY_CHARGES) * Number(item.QUANTITY))}</td>
                            </tr>
                        `).join(''))
                    .replace('{{CGST}}',
                        results2
                            .map(item => parseFloat(item.CGST) || 0)
                            .reduce((a, b) => a + b, 0)
                            .toFixed(2)
                    )
                    .replace('{{SGST}}',
                        results2
                            .map(item => parseFloat(item.SGST) || 0)
                            .reduce((a, b) => a + b, 0)
                            .toFixed(2)
                    )
                    .replace('{{IGST}}',
                        results2
                            .map(item => parseFloat(item.IGST) || 0)
                            .reduce((a, b) => a + b, 0)
                            .toFixed(2)
                    )

                    .replace('{{GST_TOTAL}}', results2.map(item => parseFloat(item.TAX_AMOUNT) || 0).reduce((a, b) => a + b, 0).toFixed(2))
                    .replace('{{DISCOUNT}}', results1[0].COUPON_AMOUNT)
                    .replace('{{GRAND_TOTAL}}', results1[0].TOTAL_AMOUNT);
                const pdf = require('html-pdf');
                const pdfOptions = {
                    childProcessOptions: {
                        env: {
                            OPENSSL_CONF: '/dev/null',
                        },
                    }
                };
                const outputFilePath = `uploads/Invoices/${invoiceNumber}.pdf`;
                await pdf.create(populatedHtml, pdfOptions).toFile(outputFilePath, async (err, resPdf) => {
                    if (err) {
                        console.log("PDF Generation Error:", err);
                    } else {
                        const invoicenamee = `${invoiceNumber}.pdf`;
                        mm.executeQueryData(`CALL sp_updateInvoiceData(?, ?)`,
                            [ORDER_ID, invoicenamee], "1234", (error, results4) => {
                                if (error) {
                                    console.log(error);
                                }
                                else {
                                    console.log("Invoice log inserted in the database.");
                                }
                            });
                    }
                });
            }
        });
}
function formatDateToReadable(dateTime) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const d = new Date(dateTime); // yyyy-mm-dd hh:mm:ss

    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${month} ${day},${year}`;
}
