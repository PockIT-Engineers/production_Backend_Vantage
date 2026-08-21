const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const dbm = require('../../utilities/dbMongo');
const technicianActionLog = require("../../modules/technicianActionLog")
const applicationkey = process.env.APPLICATION_KEY;
const { getOrderListCustomerScopeClause } = require('../../utilities/reportCustomerScope');
var orderMaster = "order_master";
var viewOrderMaster = "view_" + orderMaster;

var formattedDate = new Date(mm.getSystemDate().split(" ")[0]).toLocaleDateString("en-GB", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
});

function reqData(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CART_ID: req.body.CART_ID,
        ORDER_DATE_TIME: req.body.ORDER_DATE_TIME,
        EXPECTED_DATE_TIME: req.body.EXPECTED_DATE_TIME,
        ORDER_MEDIUM: req.body.ORDER_MEDIUM,
        ORDER_STATUS: req.body.ORDER_STATUS ? '1' : '0',
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        PAYMENT_STATUS: req.body.PAYMENT_STATUS,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        COUPON_CODE: req.body.COUPON_CODE,
        COUPON_AMOUNT: req.body.COUPON_AMOUNT ? req.body.COUPON_AMOUNT : 0,
        FINAL_AMOUNT: req.body.FINAL_AMOUNT ? req.body.FINAL_AMOUNT : 0,
        SERVICE_ADDRESS_ID: req.body.SERVICE_ADDRESS_ID,
        BILLING_ADDRESS_ID: req.body.BILLING_ADDRESS_ID,
        SPECIAL_INSTRUCTIONS: req.body.SPECIAL_INSTRUCTIONS,
        ORDER_NUMBER: req.body.ORDER_NUMBER,
        CLIENT_ID: req.body.CLIENT_ID,
        REMARK: req.body.REMARK,
        TAX_EXCLUSIVE_AMOUNT: req.body.TAX_EXCLUSIVE_AMOUNT,
        UNIT_NAME: req.body.UNIT_NAME,
        TAX_RATE: req.body.TAX_RATE,
        TAX_AMOUNT: req.body.TAX_AMOUNT,
        TAX_INCLUSIVE_AMOUNT: req.body.TAX_INCLUSIVE_AMOUNT,
        ORDER_CREATED_BY: req.body.ORDER_CREATED_BY,
        ORDER_CREATER_ID: req.body.ORDER_CREATER_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('CART_ID').isInt().optional(),
        body('ORDER_DATE_TIME').optional(),
        body('EXPECTED_DATE_TIME').optional(),
        body('ORDER_MEDIUM').optional(),
        body('ORDER_STATUS').optional(),
        body('PAYMENT_MODE').optional(),
        body('PAYMENT_STATUS').optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('COUPON_CODE').optional(),
        body('COUPON_AMOUNT').isDecimal().optional(),
        body('FINAL_AMOUNT').isDecimal().optional(),
        body('SERVICE_ADDRESS').optional(),
        body('BILLING_ADDRESS').optional(),
        body('SPECIAL_INSTRUCTIONS').optional(),
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
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_orderMaster_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get order information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.send({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 143,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.send({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.generateOrderNumber = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var systemDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const prefix = 'ORD';
    const datePart = systemDate;
    try {
        mm.executeQuery('CALL spGetOrderDetails();', supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    code: 400,
                    message: "Failed to generate work order number.",
                });
            }
            else {
                var results = results1[0]
                let newSequenceNumber = 1;
                if (results.length > 0) {
                    const lastOrderNumber = results[0].ORDER_NUMBER;
                    const lastSequence = parseInt(lastOrderNumber.split('/')[2], 10);
                    newSequenceNumber = lastSequence + 1;
                }
                const newOrderNumber = `${prefix}/${datePart}/${String(newSequenceNumber).padStart(5, '0')}`;
                res.send({
                    code: 200,
                    message: "Work order number generated successfully.",
                    orderNumber: newOrderNumber,
                });
            }
        });
    }
    catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong while generating the work order number.",
        });
    }
}

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('CALL sp_orderMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
                data.CUSTOMER_ID,
                data.CART_ID,
                data.ORDER_DATE_TIME,
                data.EXPECTED_DATE_TIME,
                data.ORDER_MEDIUM,
                data.PAYMENT_MODE,
                data.PAYMENT_STATUS,
                data.TOTAL_AMOUNT,
                data.COUPON_CODE,
                data.COUPON_AMOUNT,
                data.FINAL_AMOUNT,
                data.SERVICE_ADDRESS_ID,
                data.BILLING_ADDRESS_ID,
                data.SPECIAL_INSTRUCTIONS,
                data.CLIENT_ID,
                data.TERRITORY_ID,
                data.ORDER_NUMBER,
                data.REMARK,
                data.IS_EXPRESS,
                data.SERVICE_COUNT,
                data.TOTAL_TAXABLE_AMOUNT,
                data.DISCOUNT_AMOUNT,
                data.EXPRESS_DELIVERY_CHARGES,
                data.TAX_AMOUNT,
                data.IGST_TAX_AMOUNT,
                data.STATE_ID,
                data.IS_SAME_STATE,
                data.USER_ID,
                data.ORDER_STATUS_ID,
                data.PRIORITY_MAPPING_ID,
                data.PRIORITY_NAME,
                data.RESPONSE_TIME,
                data.PREFERED_START_TIME,
                data.ORDER_CREATED_BY,
                data.ORDER_CREATER_ID,
                data.ASSIGN_TO,
                data.ORDER_TYPE
            ], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "OrderMaster information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
        }
    }
}

// p
exports.createOrder = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var ORDER_DATA = req.body.ORDER_DATA;
    var SERVICE_ADDRESS_DATA = req.body.SERVICE_ADDRESS_DATA;
    var BILLING_ADDRESS_DATA = req.body.BILLING_ADDRESS_DATA;
    var ORDER_DETAILS_DATA = req.body.ORDER_DETAILS_DATA
    var SUMMARY_DATA = req.body.SUMMARY_DATA;
    var MOBILE_NO = req.body.MOBILE_NO
    var username = req.body.USERNAME;
    var DOCUMENT_NAME = req.body.DOCUMENT_NAME;
    var Razorpay_ID = req.body.Razorpay_ID
    ORDER_DATA.ORDER_CREATED_BY = ORDER_DATA.ORDER_CREATED_BY ? ORDER_DATA.ORDER_CREATED_BY : 'C'
    ORDER_DATA.ORDER_CREATER_ID = ORDER_DATA.ORDER_CREATER_ID ? ORDER_DATA.ORDER_CREATER_ID : req.body.authData.data.UserData[0].USER_ID
    let PRIORITY_MAPPING_ID = req.body.PRIORITY_MAPPING_ID
    let PRIORITY_NAME = req.body.PRIORITY_NAME
    let RESPONSE_TIME = req.body.RESPONSE_TIME
    let ACKNOWLEDGEMENT_TIME = req.body.ACKNOWLEDGEMENT_TIME
    let PREFERED_START_TIME = req.body.PREFERED_START_TIME
    let CUSTOMER_LEVEL_SPOC = JSON.stringify(req.body.CUSTOMER_LEVEL_SPOC)
    let ADDRESS_LEVEL_SPOC = JSON.stringify(req.body.ADDRESS_LEVEL_SPOC)
    var systemDate = mm.getSystemDate();
    var CREATED_FROM = req.body.CREATED_FROM ? req.body.CREATED_FROM : 'A';
    let SPOC_EMAILS = req.body.SPOC_EMAILS ? req.body.SPOC_EMAILS : ''
    let CUSTOMER_LEVEL_SPOC_EMAILS = req.body.CUSTOMER_LEVEL_SPOC_EMAILS ? req.body.CUSTOMER_LEVEL_SPOC_EMAILS : ''

    if (!SERVICE_ADDRESS_DATA.IANA_CODE) {
        res.send({
            "code": 302,
            "message": "Please provide the work order's timezone to proceed"
        });
    }
    var getUTCfromTimeZone = mm.getUTCFromTimezone(SERVICE_ADDRESS_DATA.IANA_CODE);
    let MongoLogDate = mm.getUTCDateFromTimezone(SERVICE_ADDRESS_DATA.IANA_CODE);
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            const connection = mm.openConnection()
            // The work order number is allocated by the database, not here. The previous
            // "read the last number, add one in Node, insert" sequence took no lock on the
            // read, so two simultaneous submissions both saw the same last number and both
            // inserted it - that is where the duplicate work order numbers came from.
            // sp_allocateDocumentNumber bumps a counter row under an exclusive lock held
            // until this transaction commits, so no two orders can be handed the same
            // number. See sp_orderMaster_allocateOrderNumber.sql.
            var datePart = systemDate.split(" ")[0].split("-").join('')
            mm.executeDML('CALL sp_allocateDocumentNumber(?,?,?);', ['ORDER_NUMBER', 'ORD', datePart], supportKey, connection, (error, orderResult1) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderMaster information..."
                    });
                }
                else {
                    var orderResult = orderResult1[0]
                    if (!orderResult || orderResult.length === 0 || !orderResult[0].DOCUMENT_NUMBER) {
                        mm.rollbackConnection(connection)
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' failed to allocate a work order number', applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save orderMaster information..."
                        });
                        return;
                    }
                    const ORDER_NUMBER = orderResult[0].DOCUMENT_NUMBER;
                    mm.executeDML('CALL sp_orderMaster_createOrder(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [ORDER_DATA.CUSTOMER_ID, getUTCfromTimeZone, PREFERED_START_TIME, ORDER_DATA.ORDER_MEDIUM, 1, "COD", "P", SUMMARY_DATA.TOTAL_AMOUNT, ORDER_DATA.COUPON_CODE, ORDER_DATA.COUPON_AMOUNT, SUMMARY_DATA.NET_AMOUNT, ORDER_DATA.TERRITORY_ID, ORDER_DATA.CLIENT_ID, typeof SUMMARY_DATA?.SPECIAL_INSTRUCTIONS === 'string' && SUMMARY_DATA.SPECIAL_INSTRUCTIONS !== null ? SUMMARY_DATA.SPECIAL_INSTRUCTIONS : JSON.stringify(SUMMARY_DATA?.SPECIAL_INSTRUCTIONS), ORDER_NUMBER, ORDER_DATA.IS_EXPRESS, ORDER_DATA.SERVICE_COUNT, ORDER_DATA.TOTAL_TAXABLE_AMOUNT, ORDER_DATA.DISCOUNT_AMOUNT, ORDER_DATA.EXPRESS_DELIVERY_CHARGES, ORDER_DATA.TAX_AMOUNT, ORDER_DATA.STATE_ID, ORDER_DATA.IS_SAME_STATE, ORDER_DATA.USER_ID, ORDER_DATA.ORDER_CREATED_BY, ORDER_DATA.ORDER_CREATER_ID, DOCUMENT_NAME, PRIORITY_MAPPING_ID, PRIORITY_NAME, RESPONSE_TIME, PREFERED_START_TIME, CUSTOMER_LEVEL_SPOC, ADDRESS_LEVEL_SPOC, getUTCfromTimeZone, CREATED_FROM, SPOC_EMAILS, CUSTOMER_LEVEL_SPOC_EMAILS, ACKNOWLEDGEMENT_TIME, SERVICE_ADDRESS_DATA, BILLING_ADDRESS_DATA], supportKey, connection, (error, results) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection)
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to save orderMaster information..."
                            });
                        }
                        else {
                            let ORDER_ID = results[0][0].ORDER_ID;
                            mm.executeDML('CALL sp_orderMaster_orderDetails(?,?,?,?,?,?,?,?,?,?,?,?)', [
                                ORDER_ID,
                                ORDER_DATA.CLIENT_ID,
                                ORDER_DATA.VENDOR_ID,
                                orderDetailsJSON,
                                SUMMARY_DATA.GROSS_AMOUNT,
                                SUMMARY_DATA.TAX_RATE,
                                SUMMARY_DATA.COUPON_CHARGES,
                                SUMMARY_DATA.DISCOUNT_CHARGES,
                                SUMMARY_DATA.TOTAL_TAX,
                                SUMMARY_DATA.SERVICE_CHARGES,
                                SUMMARY_DATA.NET_AMOUNT,
                                Razorpay_ID
                            ], supportKey, connection, (error, results4) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection)
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to save orderMaster information..."
                                    });
                                }
                                else {
                                    mm.commitConnection(connection);
                                    addGlobalData(results.insertId, supportKey)
                                    console.log(req.body.authData.data.UserData[0]);
                                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has successfully created an work order for customer ${ORDER_DATA.CUSTOMER_NAME}.`;
                                    const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results.insertId, JOB_CARD_ID: 0, CUSTOMER_ID: ORDER_DATA.CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: data.EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: data.EXPECTED_DATE_TIME, ORDER_MEDIUM: data.ORDER_MEDIUM, ORDER_STATUS: "Work order created successfully", PAYMENT_MODE: data.PAYMENT_MODE, PAYMENT_STATUS: data.PAYMENT_STATUS, TOTAL_AMOUNT: data.TOTAL_AMOUNT, ORDER_NUMBER: ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: SERVICE_ADDRESS_DATA.IANA_CODE }
                                    dbm.saveLog(logData, technicianActionLog);
                                    // customer email, CC'd to the customer's mapped "Map Service Desk Team" members
                                    mm.getMappedServiceDeskRecipients(results.insertId, supportKey, (recipients) => {
                                        mm.sendDynamicEmail(29, results.insertId, supportKey, recipients);
                                    });
                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${ORDER_DATA.CUSTOMER_ID}_channel`, "Work Order Created Successfully", `Your work order ${ORDER_NUMBER} has been created successfully. Thank you for choosing us!`, "", "O", supportKey, "N", "O", logData);
                                    mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, results.insertId, "Work Order Created Successfully", `Work order ${ORDER_NUMBER} has been placed successfully. This notification is shared with you as the POC for tracking and coordination.`, "", "O", supportKey, "N", "O", []);

                                    if (ORDER_DATA.CUSTOMER_TYPE === "I") {

                                        res.send({
                                            "code": 200,
                                            "message": "Successfully to save orderMaster information..."
                                        });
                                    } else {
                                        res.send({
                                            "code": 200,
                                            "message": "Successfully to save orderMaster information..."
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}



exports.getOrderDetails = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    // Server-side customer scoping for admin-panel backoffice/service-desk users — previously
    // this endpoint trusted whatever CUSTOMER_ID filter the caller sent, same class of gap as
    // the pre-fix Reports endpoints. Customer/technician app callers are unaffected (see
    // getOrderListCustomerScopeClause) since they aren't user_master identities at all.
    try {
        const scopeClause = await getOrderListCustomerScopeClause(req.body.authData, supportKey);
        if (scopeClause) filter += scopeClause;
    } catch (scopeError) {
        console.log("Error resolving order list customer scope", scopeError);
        return res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
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
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_orderMaster_getOrderDetails()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get order information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.send({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 143,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.send({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.getPaymentOrdeDetails = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let ORDER_ID = req.body.ORDER_ID ? req.body.ORDER_ID : '';
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
        SET @v_ORDER_ID = ${ORDER_ID};
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_orderMaster_getPaymentOrdeDetails()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get order information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.send({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 143,
                            "orderData": countResult,
                            "detailsData": dataResult,
                        });
                    }
                }
            );
        }
        else {
            res.send({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);

    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {

        data[key] ? setData += `${key}= ? , ` : true;
        data[key] ? recordData.push(data[key]) : true;
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_orderMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) `, [
                data.ID,
                data.CUSTOMER_ID,
                data.CART_ID,
                data.ORDER_DATE_TIME,
                data.EXPECTED_DATE_TIME,
                data.ORDER_MEDIUM,
                data.PAYMENT_MODE,
                data.PAYMENT_STATUS,
                data.TOTAL_AMOUNT,
                data.COUPON_CODE,
                data.COUPON_AMOUNT,
                data.FINAL_AMOUNT,
                data.SERVICE_ADDRESS_ID,
                data.BILLING_ADDRESS_ID,
                data.SPECIAL_INSTRUCTIONS,
                data.TERRITORY_ID,
                data.REMARK,
                data.IS_EXPRESS,
                data.SERVICE_COUNT,
                data.TOTAL_TAXABLE_AMOUNT,
                data.DISCOUNT_AMOUNT,
                data.EXPRESS_DELIVERY_CHARGES,
                data.TAX_AMOUNT,
                data.IGST_TAX_AMOUNT,
                data.STATE_ID,
                data.IS_SAME_STATE,
                data.USER_ID,
                data.ORDER_STATUS_ID,
                data.PRIORITY_MAPPING_ID,
                data.PRIORITY_NAME,
                data.RESPONSE_TIME,
                data.PREFERED_START_TIME,
                data.ASSING_TO,
                data.ORDER_TYPE
            ], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update orderMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "OrderMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
        }
    }
}


exports.orderUpdateStatus = (req, res) => {
    try {

        const { ID, ORDER_STATUS, REMARK, RESCHEDULE_REQUEST_REASON, EXPECTED_DATE_TIME, OLD_EXPECTED_DATE_TIME, IS_UPDATED_BY_CUSTOMER, ACCEPTANCE_REMARK, IANA_CODE, GUEST_TECHNICIAN_NAME, GUEST_TECHNICIAN_EMAIL, GUEST_TECHNICIAN_CONTACT, GUEST_TECHNICIAN_OTHER_DETAILS, ORDER_TYPE } = req.body;
        const SERVICE_ITEM_IDS = req.body.SERVICE_ITEM_IDS
        const ASSING_TO = req.body.ASSING_TO ? req.body.ASSING_TO : 0
        let LogArrays = [];
        var supportKey = req.headers['supportkey'];

        if (!ID) {
            res.send({
                code: 400,
                message: "ID and is required."
            });
            return;
        }
        if (!ORDER_STATUS) {
            res.send({
                code: 400,
                message: "ORDER_STATUS is required."
            });
            return;
        }
        if (ORDER_STATUS !== "OA" && ORDER_STATUS !== "OR" && ORDER_STATUS !== "OS") {
            res.send({
                code: 400,
                message: "Invalid ORDER_STATUS."
            });
            return;
        }
        if (!IANA_CODE) {
            res.send({
                "code": 302,
                "message": "Please provide the work order's timezone to proceed"
            });
            return;
        }

        let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);
        var orderStatusId = 0;
        if (ORDER_STATUS === "OA") {
            orderStatusId = 2
        } else if (ORDER_STATUS === "OR") {
            orderStatusId = 3
        } else if (ORDER_STATUS === "OS") {
            orderStatusId = 1
        }

        const systemDate = mm.getSystemDate();
        let setData = "ORDER_STATUS_ID = ?, CREATED_MODIFIED_DATE = ?";
        var recordData = [orderStatusId, systemDate, ID];

        if (ORDER_STATUS === "OR") {
            if (!REMARK) {
                res.send({
                    code: 400,
                    message: "REMARK is required."
                });
                return;
            }
            setData = "ORDER_STATUS_ID = ?, REMARK = ?, CREATED_MODIFIED_DATE = ?,ORDER_REJECTED_DATE=?";
            recordData = [3, REMARK, systemDate, systemDate, ID]
        } else if (ORDER_STATUS === "OA") {
            if (!EXPECTED_DATE_TIME || !ORDER_TYPE) {
                res.send({
                    code: 400,
                    message: "EXPECTED_DATE_TIME and ORDER_TYPE is required for ORDER_STATUS 'OA'."
                });
                return;
            }
            if (ORDER_TYPE == "G") {
                setData = "ORDER_STATUS_ID = ?, EXPECTED_DATE_TIME = ?, CREATED_MODIFIED_DATE = ?,ORDER_ACCEPTED_DATE=?,REMARK=?,ACCEPTANCE_REMARK=?, ASSING_TO=?, ORDER_TYPE = ?,GUEST_TECHNICIAN_NAME = ?,GUEST_TECHNICIAN_EMAIL = ?,GUEST_TECHNICIAN_CONTACT = ?,GUEST_TECHNICIAN_OTHER_DETAILS = ? ";
                recordData = [2, EXPECTED_DATE_TIME, systemDate, systemDate, REMARK, ACCEPTANCE_REMARK, ASSING_TO, ORDER_TYPE, GUEST_TECHNICIAN_NAME, GUEST_TECHNICIAN_EMAIL, GUEST_TECHNICIAN_CONTACT, GUEST_TECHNICIAN_OTHER_DETAILS, ID]
            } else {
                setData = "ORDER_STATUS_ID = ?, EXPECTED_DATE_TIME = ?, CREATED_MODIFIED_DATE = ?,ORDER_ACCEPTED_DATE=?,REMARK=?,ACCEPTANCE_REMARK=?, ASSING_TO=?, ORDER_TYPE = ?";
                recordData = [2, EXPECTED_DATE_TIME, systemDate, systemDate, REMARK, ACCEPTANCE_REMARK, ASSING_TO, ORDER_TYPE, ID]
            }
        }
        else if (ORDER_STATUS === "OS") {
            if (!EXPECTED_DATE_TIME) {
                res.send({
                    code: 400,
                    message: "EXPECTED_DATE_TIME is required for ORDER_STATUS 'OS'."
                });
                return;
            }
            if (IS_UPDATED_BY_CUSTOMER == 1) {
                setData = "ORDER_STATUS_ID = ?, EXPECTED_DATE_TIME = ?, PREFERED_START_TIME = ?, CREATED_MODIFIED_DATE = ?,RESCHEDULE_REQUEST_DATE=?,OLD_EXPECTED_DATE_TIME=?,RESCHEDULE_REQUEST_REMARK=?,RESCHEDULE_REQUEST_REASON= ?";
                recordData = [1, EXPECTED_DATE_TIME, EXPECTED_DATE_TIME, systemDate, systemDate, OLD_EXPECTED_DATE_TIME, typeof REMARK === 'string' ? REMARK : JSON.stringify(REMARK), RESCHEDULE_REQUEST_REASON, ID]
            } else {
                if (ORDER_TYPE == "G") {
                    setData = "ORDER_STATUS_ID = ?, EXPECTED_DATE_TIME = ?,PREFERED_START_TIME = ?, CREATED_MODIFIED_DATE = ?,REMARK = ?,RESCHEDULE_REQUEST_DATE=?,RESCHEDULE_REQUEST_REMARK=?,ORDER_ACCEPTED_DATE=?,ORDER_TYPE = ?,GUEST_TECHNICIAN_NAME = ?,GUEST_TECHNICIAN_EMAIL = ?,GUEST_TECHNICIAN_CONTACT = ?,GUEST_TECHNICIAN_OTHER_DETAILS = ? ";
                    recordData = [2, EXPECTED_DATE_TIME, EXPECTED_DATE_TIME, systemDate, REMARK, systemDate, REMARK, systemDate, ORDER_TYPE, GUEST_TECHNICIAN_NAME, GUEST_TECHNICIAN_EMAIL, GUEST_TECHNICIAN_CONTACT, GUEST_TECHNICIAN_OTHER_DETAILS, ID]
                } else {
                    setData = "ORDER_STATUS_ID = ?, EXPECTED_DATE_TIME = ?,PREFERED_START_TIME = ?, CREATED_MODIFIED_DATE = ?,REMARK = ?,RESCHEDULE_REQUEST_DATE=?,RESCHEDULE_REQUEST_REMARK=?,ORDER_ACCEPTED_DATE=?, ORDER_TYPE = ?";
                    recordData = [2, EXPECTED_DATE_TIME, EXPECTED_DATE_TIME, systemDate, REMARK, systemDate, REMARK, systemDate, ORDER_TYPE, ID]
                }

            }
        }
        const query = `UPDATE ${orderMaster} SET ${setData} WHERE ID = ?`;
        const connection = mm.openConnection();
        mm.executeDML('CALL Sp_GetOrderStatusforUpdate(?)', ID, supportKey, connection, (error, orderResult) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                mm.rollbackConnection(connection);
                console.log(error);
                res.send({
                    code: 500,
                    message: "Failed to update orderMaster information."
                });
            } else {
                orderResult = orderResult[0];
                if (!orderResult || !orderResult[0] || orderResult[0].length === 0) {
                    mm.rollbackConnection(connection);
                    return res.send({ code: 400, message: "Order Data not found" });
                }
                if ((orderResult[0].ORDER_STATUS == "OA" && ORDER_STATUS == "OA") || (orderResult[0].ORDER_STATUS == "OA" && ORDER_STATUS == "OR") || (orderResult[0].ORDER_STATUS == "OA" && ORDER_STATUS == "OS")) {
                    mm.rollbackConnection(connection);
                    res.send({
                        code: 400,
                        message: "Work order already accepted."
                    });
                } else if ((orderResult[0].ORDER_STATUS == "OR" && ORDER_STATUS == "OR") || (orderResult[0].ORDER_STATUS == "OR" && ORDER_STATUS == "OA") || (orderResult[0].ORDER_STATUS == "OR" && ORDER_STATUS == "OS")) {
                    mm.rollbackConnection(connection);
                    res.send({
                        code: 400,
                        message: "Work order already rejected."
                    });
                } else if ((orderResult[0].ORDER_STATUS == "OS" && ORDER_STATUS == "OS") || (orderResult[0].ORDER_STATUS == "OS" && ORDER_STATUS == "OA") || (orderResult[0].ORDER_STATUS == "OS" && ORDER_STATUS == "OR")) {
                    mm.rollbackConnection(connection);
                    res.send({
                        code: 400,
                        message: "Work order already rescheduled."
                    });
                } else {
                    const finalQuery = connection.format(query, recordData)

                    mm.executeDML('CALL Sp_UpdateOrderMasterDynamic(?)', [finalQuery], supportKey, connection, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            mm.rollbackConnection(connection);
                            res.send({
                                code: 500,
                                message: "Failed to update orderMaster information."
                            });
                        } else {
                            var DESCRIPTION = '';
                            var TITLE = '';
                            var BO_DESCRIPTION = '';
                            if (ORDER_STATUS === "OA") {
                                mm.sendDynamicEmail(30, ID, supportKey)
                                TITLE = 'Work Order Accepted'
                                DESCRIPTION = `Your work order ${orderResult[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                BO_DESCRIPTION = `Work order ${orderResult[0].ORDER_NUMBER} has been accepted and is now being processed. This notification is shared with you as the POC for tracking and coordination.`
                            } else if (ORDER_STATUS === "OR") {
                                mm.sendDynamicEmail(31, ID, supportKey)
                                TITLE = 'Work Order Rejected'
                                DESCRIPTION = `We regret to inform you that your work order ${orderResult[0].ORDER_NUMBER} has been rejected due to ${REMARK}.`
                                BO_DESCRIPTION = `We regret to inform you that work order ${orderResult[0].ORDER_NUMBER} has been rejected due to ${REMARK}. This notification is shared with you as the POC for tracking and coordination.`
                            } else if (ORDER_STATUS === "OS") {
                                IS_UPDATED_BY_CUSTOMER != 1 ? mm.sendDynamicEmail(32, ID, supportKey) : "";//customeremail
                                TITLE = 'Work Order Rescheduled'
                                DESCRIPTION = `Your work order ${orderResult[0].ORDER_NUMBER} has been rescheduled. will notify you once it confirmed.`
                                BO_DESCRIPTION = `Work order ${orderResult[0].ORDER_NUMBER} has been rescheduled. Will notify you once it confirmed. This notification is shared with you as the POC for tracking and coordination.`
                            }
                            let notificationData = {
                                TECHNICIAN_ID: 0,
                                VENDOR_ID: 0,
                                ORDER_ID: orderResult[0].ID,
                                JOB_CARD_ID: 0,
                                ORDER_NUMBER: orderResult[0].ORDER_NUMBER,
                                ORDER_STATUS: ORDER_STATUS,
                                CUSTOMER_ID: orderResult[0].CUSTOMER_ID,
                                LOG_TYPE: 'Order',
                                ACTION_LOG_TYPE: 'User',
                                ACTION_DETAILS: `${req.body.authData.data.UserData[0].NAME} has updated the work order status to ${ORDER_STATUS} for customer ${orderResult[0].COMPANY_NAME}.`,
                                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                IANA_CODE: IANA_CODE
                            }
                            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${orderResult[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "O", notificationData);
                            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, ID, `${TITLE}`, `${BO_DESCRIPTION}`, "", "O", supportKey, "N", "O", notificationData);
                            if (SERVICE_ITEM_IDS && SERVICE_ITEM_IDS.length > 0) {
                                let serviceData = req.body.ORDER_JOB_DATA
                                if (!serviceData || serviceData.length == 0) {
                                    mm.rollbackConnection(connection);
                                    console.log(`Service data is required.`);
                                    return res.send({
                                        code: 400,
                                        message: "Service data is required."
                                    });
                                }
                                // A double-wrapped ORDER_JOB_DATA ([[{...}]]) used to slip
                                // through here: serviceData[0] was an array, every job card
                                // field read as undefined and Sp_InsertJobCard failed with an
                                // opaque DB error. Reject the bad shape with a clear message.
                                if (Array.isArray(serviceData[0]) || typeof serviceData[0] !== 'object' || serviceData[0] === null || !serviceData[0].ORDER_DETAILS_ID) {
                                    mm.rollbackConnection(connection);
                                    console.log(`Invalid service data.`, JSON.stringify(serviceData[0]));
                                    return res.send({
                                        code: 400,
                                        message: "Invalid service data for work order(job) creation."
                                    });
                                }
                                async.eachSeries(SERVICE_ITEM_IDS, function processTechnician(Services, inner_callback) {
                                    // Same atomic allocation the order number uses. The old
                                    // Sp_GetLastJobCardNo read took no lock, so two orders
                                    // being created at the same time could both be handed
                                    // the same JOB_CARD_NO.
                                    let systemDate = mm.getSystemDate();
                                    const datePart = systemDate.split(" ")[0].split("-").join('');
                                    mm.executeDML('CALL sp_allocateDocumentNumber(?,?,?);', ['JOB_CARD_NO', 'JOB', datePart], supportKey, connection, (error, jobResult) => {
                                        if (error) {
                                            console.log(` Error getting letest Job Number`, error);
                                            return inner_callback(error);
                                        }
                                        else {
                                            jobResult = jobResult[0];
                                            if (!jobResult || jobResult.length === 0 || !jobResult[0].DOCUMENT_NUMBER) {
                                                console.log(`Failed to allocate a job card number`);
                                                return inner_callback(new Error('Failed to allocate a job card number'));
                                            }
                                            let isRemote = ORDER_TYPE == "R" ? 1 : 0
                                            let JOB_PAYMENT_STATUS = ""
                                            const JOB_CARD_NO = jobResult[0].DOCUMENT_NUMBER;
                                            orderResult[0].PAYMENT_STATUS == "D" ? JOB_PAYMENT_STATUS = "D" : "P"
                                            mm.executeDML('CALL Sp_InsertJobCard(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [serviceData[0].JOB_CREATED_DATE, serviceData[0].EXPECTED_DATE_TIME, serviceData[0].TASK_DESCRIPTION, 1, serviceData[0].ORDER_ID, serviceData[0].ORDER_NUMBER, JOB_CARD_NO, serviceData[0].CUSTOMER_ID, serviceData[0].SERVICE_ID, serviceData[0].TERRITORY_ID, serviceData[0].TECHNICIAN_ID, serviceData[0].SERVICE_AMOUNT, serviceData[0].ESTIMATED_TIME_IN_MIN, serviceData[0].CLIENT_ID, serviceData[0].ORDER_DETAILS_ID, serviceData[0].TECHNICIAN_STATUS, serviceData[0].USER_ID, serviceData[0].CUSTOMER_TYPE, serviceData[0].CUSTOMER_NAME, serviceData[0].SERVICE_ADDRESS, serviceData[0].LATTITUTE, serviceData[0].LONGITUDE, serviceData[0].SERVICE_NAME, serviceData[0].SERVICE_SKILLS, serviceData[0].PINCODE, serviceData[0].TERRITORY_NAME, JOB_PAYMENT_STATUS, isRemote, serviceData[0].VENDOR_COST, serviceData[0].TECHNICIAN_COST, serviceData[0].SITE_VISIT_REPORT_TYPE, serviceData[0].SERVICE_FULL_NAME, ASSING_TO], supportKey, connection, (error, resultsjOB1) => {
                                                if (error) {
                                                    console.log(`Failed to Create Job Card`, error);
                                                    return inner_callback(error);
                                                }
                                                else {
                                                    var resultsjOB = resultsjOB1[0]
                                                    mm.executeDML(`CALL Sp_UpdateOrderDetailsJobCard(?,?)`, [resultsjOB[0].insertId, serviceData[0].ORDER_DETAILS_ID], supportKey, connection, (error, results) => {
                                                        if (error) {
                                                            console.log(`Failed to update work order details`, error);
                                                            return inner_callback(error);
                                                        }
                                                        else {
                                                            mm.executeDML(`CALL Sp_GetJobCardById(?)`, [resultsjOB[0].insertId], supportKey, connection, (error, resultsgetJob) => {
                                                                if (error) {
                                                                    console.log(`Failed to update work order details`, error);
                                                                    return inner_callback(error);
                                                                }
                                                                else {
                                                                    resultsgetJob = resultsgetJob[0];
                                                                    let notificationData = {
                                                                        JOB_CARD_ID: resultsjOB[0].insertId,
                                                                        ORDER_NUMBER: orderResult[0].ORDER_NUMBER,
                                                                        JOB_CARD_NUMBER: resultsgetJob[0].JOB_CARD_NO,
                                                                        ORDER_STATUS: orderResult[0].ORDER_STATUS,
                                                                        ORDER_ID: orderResult[0].ID,
                                                                        CUSTOMER_ID: orderResult[0].CUSTOMER_ID,
                                                                        TECHNICIAN_ID: serviceData[0].TECHNICIAN_ID,
                                                                        IANA_CODE: IANA_CODE
                                                                    }
                                                                    if (ORDER_TYPE == 'N') {
                                                                        mm.sendNotificationToTerritory(serviceData[0].PINCODE, "New Work Order Created", `Dear Technician, a new work order has been created near your location.`, "", "J", supportKey, 'PJ', notificationData)
                                                                        mm.sendDynamicEmail(54, resultsjOB[0].insertId, supportKey)
                                                                    }
                                                                    let ACTION_DETAILSS = ` System has auto generated a work order(job) for the service ${serviceData[0].SERVICE_NAME} for the customer ${serviceData[0].COMPANY_NAME}.`
                                                                    const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: orderResult[0].ID, JOB_CARD_ID: resultsjOB[0].insertId, CUSTOMER_ID: orderResult[0].CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILSS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: orderResult[0].ORDER_MEDIUM, ORDER_STATUS: null, PAYMENT_MODE: orderResult[0].PAYMENT_MODE, PAYMENT_STATUS: orderResult[0].PAYMENT_STATUS, TOTAL_AMOUNT: orderResult[0].TOTAL_AMOUNT, ORDER_NUMBER: orderResult[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Work order created ", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE }
                                                                    LogArrays.push(logData);
                                                                    addJobGlobalData(resultsjOB[0].insertId, supportKey);
                                                                    return inner_callback(null);
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }, function finalCallback(error) {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        res.send({
                                            code: 400,
                                            message: "Failed to update work order status."
                                        });
                                        console.log("Failed to Create Job Card by system.")
                                    } else {
                                        var ACTION_DETAILS
                                        if (IS_UPDATED_BY_CUSTOMER == 1 && ORDER_STATUS === "OS") {
                                            ACTION_DETAILS = `${orderResult[0].COMPANY_NAME} has reschedule the work order ${orderResult[0].ORDER_NUMBER}.`
                                        } else {
                                            ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME} has ${(ORDER_STATUS == 'OA' ? 'accepted' : (ORDER_STATUS == 'OR' ? 'rejected' : (ORDER_STATUS == 'OS' ? 'rescheduled' : 'scheduled')))} the work order ${orderResult[0].ORDER_NUMBER} for the customer ${orderResult[0].COMPANY_NAME}.`
                                        }
                                        const orderLog = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: orderResult[0].ID, JOB_CARD_ID: 0, CUSTOMER_ID: orderResult[0].CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: orderResult[0].ORDER_MEDIUM, ORDER_STATUS: 'Work order ' + (ORDER_STATUS == 'OA' ? 'accepted' : (ORDER_STATUS == 'OR' ? 'rejected' : 'rescheduled')), PAYMENT_MODE: orderResult[0].PAYMENT_MODE, PAYMENT_STATUS: orderResult[0].PAYMENT_STATUS, TOTAL_AMOUNT: orderResult[0].TOTAL_AMOUNT, ORDER_NUMBER: orderResult[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE }
                                        LogArrays.push(orderLog);
                                        dbm.saveLog(LogArrays, technicianActionLog);
                                        mm.commitConnection(connection);
                                        res.send({
                                            code: 200,
                                            message: "OrderMaster information updated successfully."
                                        });
                                    }
                                });
                            } else {
                                var ACTION_DETAILS = ""
                                var ACTION_DETAILS
                                if (IS_UPDATED_BY_CUSTOMER == 1 && ORDER_STATUS === "OS") {
                                    ACTION_DETAILS = `${orderResult[0].COMPANY_NAME} has reschedule the work order ${orderResult[0].ORDER_NUMBER}.`
                                } else {
                                    ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME} has ${(ORDER_STATUS == 'OA' ? 'accepted' : (ORDER_STATUS == 'OR' ? 'rejected' : (ORDER_STATUS == 'OS' ? 'rescheduled' : 'scheduled')))} the work order ${orderResult[0].ORDER_NUMBER} for the customer ${orderResult[0].COMPANY_NAME}.`
                                }
                                const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: orderResult[0].ID, JOB_CARD_ID: 0, CUSTOMER_ID: orderResult[0].CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: orderResult[0].ORDER_MEDIUM, ORDER_STATUS: 'Work order ' + (ORDER_STATUS == 'OA' ? 'accepted' : (ORDER_STATUS == 'OR' ? 'rejected' : 'rescheduled')), PAYMENT_MODE: orderResult[0].PAYMENT_MODE, PAYMENT_STATUS: orderResult[0].PAYMENT_STATUS, TOTAL_AMOUNT: orderResult[0].TOTAL_AMOUNT, ORDER_NUMBER: orderResult[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE }
                                dbm.saveLog(logData, technicianActionLog);
                                mm.commitConnection(connection);
                                res.send({
                                    code: 200,
                                    message: "OrderMaster information updated successfully."
                                });
                            }
                        }
                    });
                }
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        })
    }
};



function addGlobalData(ORDER_ID, supportKey) {

    try {

        mm.executeQueryData(
            `CALL Sp_GetOrderGlobalDataforOrderUpdate(?)`,
            [ORDER_ID],
            supportKey,
            (error, results5) => {

                if (error) {
                    console.log(`Error to find work order data`, error);
                }
                else {

                    results5 = results5[0];   // important for SP result

                    console.log("data retrieved");

                    if (results5.length > 0) {

                        let logData = {
                            ID: ORDER_ID,
                            CATEGORY: "Order",
                            TITLE: results5[0].ORDER_NUMBER,
                            DATA: JSON.stringify(results5[0]),
                            ROUTE: "/order-list",
                            TERRITORY_ID: results5[0].TERRITORY_ID
                        };

                        dbm.addDatainGlobalmongo(
                            logData.ID,
                            logData.CATEGORY,
                            logData.TITLE,
                            logData.DATA,
                            logData.ROUTE,
                            logData.TERRITORY_ID
                        )
                            .then(() => {
                                console.log("Data added/updated successfully.");
                            })
                            .catch(err => {
                                console.error("Error in addDatainGlobalmongo:", err);
                            });

                    } else {

                        console.log(" no data found");

                    }

                }

            });

    } catch (error) {

        console.log(error);

    }

}

function addJobGlobalData(JOB_ID, supportKey) {

    try {

        mm.executeQueryData(
            `CALL Sp_GetJobGlobalDataforOrderUpdate(?)`,
            [JOB_ID],
            supportKey,
            (error, results5) => {

                if (error) {
                    console.log(error);
                }
                else {

                    results5 = results5[0];   // important for SP result

                    console.log("data retrieved");

                    if (results5.length > 0) {

                        let logData = {
                            ID: JOB_ID,
                            CATEGORY: "Job",
                            TITLE: results5[0].JOB_CARD_NO,
                            DATA: JSON.stringify(results5[0]),
                            ROUTE: "/overview/jobs",
                            TERRITORY_ID: results5[0].TERRITORY_ID
                        };

                        dbm.addDatainGlobalmongo(
                            logData.ID,
                            logData.CATEGORY,
                            logData.TITLE,
                            logData.DATA,
                            logData.ROUTE,
                            logData.TERRITORY_ID
                        )
                            .then(() => {
                                console.log("Data added/updated successfully.");
                            })
                            .catch(err => {
                                console.error("Error in addDatainGlobalmongo:", err);
                            });

                    } else {

                        console.log(" no data found");

                    }

                }

            });

    } catch (error) {

        console.log(error);

    }

}

exports.updateOrder = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var ORDER_DATA = req.body.ORDER_DATA;
    var SERVICE_ADDRESS_DATA = req.body.SERVICE_ADDRESS_DATA;
    var BILLING_ADDRESS_DATA = req.body.BILLING_ADDRESS_DATA;
    var ORDER_DETAILS_DATA = req.body.ORDER_DETAILS_DATA
    var SUMMARY_DATA = req.body.SUMMARY_DATA;
    var DELETED_DATA = req.body.DELETED_DATA;
    var username = req.body.USERNAME;
    var DOCUMENT_NAME = req.body.DOCUMENT_NAME
    let PRIORITY_MAPPING_ID = req.body.PRIORITY_MAPPING_ID
    let PRIORITY_NAME = req.body.PRIORITY_NAME
    let RESPONSE_TIME = req.body.RESPONSE_TIME
    let ACKNOWLEDGEMENT_TIME = req.body.ACKNOWLEDGEMENT_TIME
    let PREFERED_START_TIME = req.body.PREFERED_START_TIME
    let CUSTOMER_LEVEL_SPOC = req.body.CUSTOMER_LEVEL_SPOC
    let ADDRESS_LEVEL_SPOC = req.body.ADDRESS_LEVEL_SPOC
    let SPOC_EMAILS = req.body.SPOC_EMAILS
    let CREATED_MODIFIED_DATE = mm.getSystemDate();
    let IANA_CODE = req.body.IANA_CODE;
    let IS_UPDATED_ADMIN = req.body.IS_UPDATED_ADMIN
    let USER_NAME = IS_UPDATED_ADMIN == 1 ? req.body.authData.data.UserData[0].USER_NAME : ORDER_DATA.CUSTOMER_NAME;
    let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);

    console.log("here : ", SUMMARY_DATA, ORDER_DETAILS_DATA)
    var systemDate = mm.getSystemDate();
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            if (!IANA_CODE) {
                res.send({
                    "code": 302,
                    "message": "IANA_CODE is required"
                });
                return;
            }
            const connection = mm.openConnection()
            mm.executeDML(`CALL Sp_GetOrderDetails(?)`, [ORDER_DATA.ID], supportKey, connection, (error, orderResult) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderMaster information..."
                    });
                }
                else {
                    orderResult = orderResult[0];
                    let newSequenceNumber = 1;
                    if (orderResult.length > 0) {
                        console.log("req.body.authData", req.body.authData.data.UserData[0].NAME)
                        if (orderResult[0].ORDER_STATUS == 'OP') {
                            let tecAction = IS_UPDATED_ADMIN == 1 ? `for customer ${ORDER_DATA.CUSTOMER_NAME}` : ` for work order number ${orderResult[0].ORDER_NUMBER}`;
                            // need to add log for order accepted/rejected/rescheduled
                            let ACTION_DETAILS = `${USER_NAME} has updated the work order details ${tecAction}`;
                            const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: orderResult[0].ID, JOB_CARD_ID: 0, CUSTOMER_ID: orderResult[0].CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: orderResult[0].ORDER_MEDIUM, ORDER_STATUS: "Work order updated", PAYMENT_MODE: orderResult[0].PAYMENT_MODE, PAYMENT_STATUS: orderResult[0].PAYMENT_STATUS, TOTAL_AMOUNT: orderResult[0].TOTAL_AMOUNT, ORDER_NUMBER: orderResult[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE }
                            dbm.saveLog(logData, technicianActionLog);

                            const specialInstructions =
                                SUMMARY_DATA?.SPECIAL_INSTRUCTIONS == null
                                    ? null
                                    : typeof SUMMARY_DATA.SPECIAL_INSTRUCTIONS === "string"
                                        ? SUMMARY_DATA.SPECIAL_INSTRUCTIONS
                                        : JSON.stringify(SUMMARY_DATA.SPECIAL_INSTRUCTIONS);
                            mm.executeDML(`CALL Sp_UpdateOrderMaster(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                                [SUMMARY_DATA.PAYMENT_MODE, SUMMARY_DATA.TOTAL_AMOUNT, SUMMARY_DATA.FINAL_AMOUNT, specialInstructions, ORDER_DATA.IS_EXPRESS, ORDER_DATA.SERVICE_COUNT, ORDER_DATA.TOTAL_TAXABLE_AMOUNT, ORDER_DATA.DISCOUNT_AMOUNT, ORDER_DATA.EXPRESS_DELIVERY_CHARGES, ORDER_DATA.TAX_AMOUNT, PREFERED_START_TIME, DOCUMENT_NAME, PRIORITY_MAPPING_ID, PRIORITY_NAME, RESPONSE_TIME, PREFERED_START_TIME, JSON.stringify(CUSTOMER_LEVEL_SPOC), JSON.stringify(ADDRESS_LEVEL_SPOC), CREATED_MODIFIED_DATE, SPOC_EMAILS, ACKNOWLEDGEMENT_TIME, ORDER_DATA.ID], supportKey, connection, (error, results3) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save orderMaster information..."
                                        });
                                    }
                                    else {
                                        req.body.MongoLogDate = MongoLogDate;
                                        updateOrderDetails(ORDER_DETAILS_DATA, orderResult[0].ID, ORDER_DATA.CUSTOMER_ID, supportKey, req, connection, IANA_CODE, (error) => {
                                            if (error) {
                                                console.log(error);
                                                mm.rollbackConnection(connection)
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to save orderMaster information..."
                                                });
                                            }
                                            else {

                                                mm.executeDML(`CALL Sp_UpdateOrderSummary(?,?,?,?,?,?,?,?)`, [SUMMARY_DATA.GROSS_AMOUNT, SUMMARY_DATA.TAX_RATE, SUMMARY_DATA.COUPON_CHARGES, SUMMARY_DATA.DISCOUNT_CHARGES || 0, SUMMARY_DATA.TOTAL_TAX || 0, SUMMARY_DATA.SERVICE_CHARGES, SUMMARY_DATA.NET_AMOUNT, ORDER_DATA.ID], supportKey, connection, (error, results5) => {
                                                    if (error) {
                                                        console.log(error);
                                                        mm.rollbackConnection(connection)
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to save orderMaster information..."
                                                        });
                                                    }
                                                    else {

                                                        if (DELETED_DATA.length > 0) {

                                                            deleteOrders(DELETED_DATA, req.body.authData, supportKey, connection, req, (error) => {
                                                                if (error) {

                                                                    mm.rollbackConnection(connection)
                                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "Failed to save orderMaster information..."
                                                                    });

                                                                } else {
                                                                    mm.commitConnection(connection);
                                                                    res.send({
                                                                        "code": 200,
                                                                        "message": "Successfully to save orderMaster information..."
                                                                    });

                                                                }
                                                            })

                                                        }
                                                        else {

                                                            mm.commitConnection(connection);
                                                            res.send({
                                                                "code": 200,
                                                                "message": "Successfully to save orderMaster information..."
                                                            });
                                                        }

                                                    }
                                                });

                                            }
                                        })

                                    }
                                });

                        } else {

                            res.send({
                                "code": 422,
                                "message": "Work order cannot be updated as it is already processed."
                            });

                        }

                    }
                    else {

                        res.send({
                            "code": 400,
                            "message": "Work order not found."
                        });

                    }

                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }

}


function updateOrderDetails(ORDER_DETAILS_DATA, ORDER_ID, CUSTOMER_ID, supportKey, req, connection, IANA_CODE, callback) {
    try {
        var systemDate = mm.getSystemDate();
        async.eachSeries(ORDER_DETAILS_DATA, function (orderDetailsItem, intercallback) {
            var ids = [];
            mm.executeDML(`CALL Sp_CheckOrderDetail(?)`, [orderDetailsItem.ID], supportKey, connection, (error, results4) => {
                if (error) {
                    console.log(error);
                    intercallback(error);
                }
                else {
                    results4 = results4[0];
                    if (results4.length > 0) {
                        ids.push(results4[0].ID)
                        mm.executeDML('CALL Sp_UpdateOrderDetail(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                            [orderDetailsItem.QUANTITY, orderDetailsItem.RATE, orderDetailsItem.TOTAL_AMOUNT, orderDetailsItem.TAX_EXCLUSIVE_AMOUNT, orderDetailsItem.TAX_RATE, orderDetailsItem.TAX_AMOUNT, orderDetailsItem.TAX_INCLUSIVE_AMOUNT, orderDetailsItem.IS_EXPRESS, orderDetailsItem.EXPRESS_DELIVERY_CHARGES, orderDetailsItem.TOTAL_DURARTION_MIN, orderDetailsItem.DURARTION_MIN, orderDetailsItem.DURARTION_HOUR, orderDetailsItem.START_TIME, orderDetailsItem.END_TIME, orderDetailsItem.CESS, orderDetailsItem.CGST, orderDetailsItem.SGST, orderDetailsItem.IGST, orderDetailsItem.MAX_QTY, orderDetailsItem.PREPARATION_HOURS, orderDetailsItem.PREPARATION_MINUTES, orderDetailsItem.CATEGORY_NAME, orderDetailsItem.SUB_CATEGORY_NAME, orderDetailsItem.SERVICE_PARENT_NAME, orderDetailsItem.SERVICE_NAME, orderDetailsItem.TOTAL_TAX_EXCLUSIVE_AMOUNT, results4[0].ID], supportKey, connection, (error, results5) => {
                                if (error) {
                                    console.log(error);
                                    intercallback(error);
                                }
                                else {
                                    intercallback();
                                }
                            });
                    } else {
                        var ordItem = [ORDER_ID, orderDetailsItem.SERVICE_CATALOGUE_ID, orderDetailsItem.SERVICE_ITEM_ID, orderDetailsItem.CATEGORY_ID, orderDetailsItem.SUB_CATEGORY_ID, orderDetailsItem.JOB_CARD_ID, orderDetailsItem.QUANTITY, orderDetailsItem.RATE, orderDetailsItem.UNIT_ID, orderDetailsItem.TOTAL_AMOUNT, 1, orderDetailsItem.TAX_EXCLUSIVE_AMOUNT, orderDetailsItem.UNIT_NAME, orderDetailsItem.TAX_RATE, orderDetailsItem.TAX_AMOUNT, orderDetailsItem.TOTAL_AMOUNT, orderDetailsItem.IS_EXPRESS, orderDetailsItem.EXPRESS_DELIVERY_CHARGES, orderDetailsItem.TOTAL_DURARTION_MIN, orderDetailsItem.DURARTION_MIN, orderDetailsItem.DURARTION_HOUR, orderDetailsItem.IS_JOB_CREATED_DIRECTLY, orderDetailsItem.START_TIME, orderDetailsItem.END_TIME, orderDetailsItem.CESS, orderDetailsItem.CGST, orderDetailsItem.SGST, orderDetailsItem.IGST, orderDetailsItem.MAX_QTY, orderDetailsItem.PREPARATION_HOURS, orderDetailsItem.PREPARATION_MINUTES, orderDetailsItem.CATEGORY_NAME, orderDetailsItem.SUB_CATEGORY_NAME, orderDetailsItem.SERVICE_PARENT_NAME, orderDetailsItem.SERVICE_NAME, orderDetailsItem.TOTAL_TAX_EXCLUSIVE_AMOUNT]

                        mm.executeDML('CALL Sp_InsertOrderDetail(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', ordItem, supportKey, connection, (error, results411) => {
                            if (error) {
                                console.log(error);
                                intercallback(error);
                            }
                            else {
                                ids.push(results411.insertId)
                                intercallback();
                            }
                        });
                    }
                }
            });
        }, function (err) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                callback();
            }
        })

    } catch (error) {
        console.log(error);
        callback(error);
    }

}


function deleteOrders(DELETED_DATA, authData, supportKey, connection, req, callback) {

    try {
        var systemDate = mm.getSystemDate();
        async.eachSeries(DELETED_DATA, function (orderDetailsItem, intercallback) {
            var ids = [];
            mm.executeDML('CALL Sp_CheckDeleteOrderDetail(?)', [orderDetailsItem], supportKey, connection, (error, results4) => {
                if (error) {
                    console.log(error);
                    intercallback(error);
                }
                else {
                    if (results4.length > 0) {
                        mm.executeDML('CALL Sp_DeleteOrderDetail(?);', [results4[0][0].ID], supportKey, connection, (error, results5) => {
                            if (error) {
                                console.log(error);
                                intercallback(error);
                            }
                            else {
                                intercallback();
                            }
                        });
                    } else {
                        intercallback();
                    }
                }
            });
        }, function (err) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                callback();
            }
        })
    } catch (error) {
        console.log(error);
        callback(error);
    }
}


exports.requestForReschedule = (req, res) => {
    try {

        const { ORDER_STATUS, EXPECTED_DATE_TIME, RESCHEDULE_REQUEST_REMARK, RESCHEDULE_REQUEST_REASON, ID, IANA_CODE } = req.body;
        const systemDate = mm.getSystemDate();
        var supportKey = req.headers['supportkey'];

        if (!ID) {
            res.send({
                code: 400,
                message: "ID and is required."
            });
            return;
        }
        if (!ORDER_STATUS) {
            res.send({
                code: 400,
                message: "ORDER_STATUS is required."
            });
            return;
        }

        if (ORDER_STATUS !== "RR") {
            res.send({
                code: 400,
                message: "Invalid ORDER_STATUS."
            });
            return;
        }
        if (!IANA_CODE) {
            res.send({
                "code": 302,
                "message": "Please provide the work order's timezone to proceed"
            });
            return;
        }
        let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);
        const connection = mm.openConnection();
        mm.executeDML(`CALL Sp_RequestRescheduleOrder(?,?,?,?,?,?,?)`, [1, systemDate, EXPECTED_DATE_TIME, RESCHEDULE_REQUEST_REMARK, RESCHEDULE_REQUEST_REASON, systemDate, ID], supportKey, connection, (error, results) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                mm.rollbackConnection(connection);
                res.send({
                    code: 500,
                    message: "Failed to update orderMaster information."
                });
            } else {
                mm.executeDML(`CALL Sp_GetOrderMasterById(?)`, ID, supportKey, connection, (error, results1) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        mm.rollbackConnection(connection);
                        console.log(error);
                        res.send({
                            code: 500,
                            message: "Failed to update orderMaster information."
                        });
                    } else {
                        results1 = results1[0];
                        mm.sendDynamicEmail(33, results1[0].ID, supportKey)//customeremail
                        mm.sendDynamicEmail(53, results1[0].ID, supportKey)//adminemail
                        var DESCRIPTION = '';
                        var TITLE = '';
                        TITLE = 'Request for reschedule work order'
                        DESCRIPTION = `The customer has requested for reschedule work order ${results1[0].ORDER_NUMBER}. Please take the necessary action.`
                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, `${TITLE}`, `${DESCRIPTION}`, "", "O",supportKey, "O", []);
                        console.log(req.body.authData.data.UserData[0]);
                        mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, results1[0].ID, TITLE, DESCRIPTION, "", "O", supportKey, "N", "O", [])


                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has requested to reschedule work order ${results1[0].ORDER_NUMBER}.`
                        const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results1[0].ID, JOB_CARD_ID: 0, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: results1[0].ORDER_MEDIUM, ORDER_STATUS: 'Requested for reschedule work order', PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE }
                        dbm.saveLog(logData, technicianActionLog);
                        mm.commitConnection(connection);
                        res.send({
                            code: 200,
                            message: "OrderMaster information updated successfully."
                        });
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        })
    }
};


exports.updateOrderDiscription = (req, res) => {
    let ORDER_ID = req.body.ORDER_ID;
    let REMARK = req.body.REMARK ? typeof req.body.REMARK === 'string' ? req.body.REMARK : JSON.stringify(req.body.REMARK) : null;
    let OLD_REMARK = req.body.OLD_REMARK;
    let CUSTOMER_ID = req.body.CUSTOMER_ID;
    var systemDate = mm.getSystemDate();
    let supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(`CALL Sp_CheckOrderDetails(?)`, [ORDER_ID], supportKey, (error, resultsCheck) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                res.send({
                    "code": 400,
                    "message": "Failed to update orderMaster information."
                });
            }
            else {
                resultsCheck = resultsCheck[0];
                if (resultsCheck.length == 0) {
                    res.send({
                        "code": 400,
                        "message": "Work order not found."
                    });
                    return;
                }
                const orderRows = resultsCheck[0];

                mm.executeQueryData(`CALL Sp_UpdateOrderDescription(?,?,?,?)`, [REMARK, typeof REMARK === 'string' ? REMARK : JSON.stringify(REMARK), systemDate, ORDER_ID], supportKey, (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update orderMaster information."
                        });
                    }
                    else {
                        mm.executeQueryData(`CALL Sp_InsertOrderDescriptionLog(?,?,?,?)`, [ORDER_ID, REMARK, OLD_REMARK, 0, 1], supportKey, (error, results) => {
                            if (error) {
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update orderMaster information."
                                });
                            }
                            else {
                                mm.executeQueryData(`CALL Sp_GetCustomerSpocEmails(?)`, [CUSTOMER_ID], supportKey, (error, checkEmails) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to update orderMaster information."
                                        });
                                    }
                                    else {
                                        const ACTION_DETAILS =
                                            `${req.body.authData.data.UserData[0].NAME} has updated the work order description for work order ${orderRows.ORDER_NUMBER}.`;
                                        let logData = {
                                            TECHNICIAN_ID: orderRows.TECHNICIAN_ID,
                                            VENDOR_ID: orderRows.VENDOR_ID,
                                            ORDER_ID: orderRows.ORDER_ID,
                                            JOB_CARD_ID: orderRows.JOB_CARD_ID,
                                            CUSTOMER_ID: orderRows.CUSTOMER_ID,
                                            LOG_TYPE: "Order",
                                            ACTION_LOG_TYPE: "User",
                                            ACTION_DETAILS: ACTION_DETAILS,
                                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                            TECHNICIAN_NAME: orderRows.TECHNICIAN_NAME,
                                            ORDER_DATE_TIME: orderRows.ORDER_DATE_TIME,
                                            CART_ID: 0,
                                            EXPECTED_DATE_TIME: orderRows.EXPECTED_DATE_TIME,
                                            ORDER_MEDIUM: orderRows.ORDER_MEDIUM,
                                            ORDER_STATUS: "Work order description updated",
                                            PAYMENT_MODE: orderRows.PAYMENT_MODE,
                                            PAYMENT_STATUS: "Work order description updated",
                                            TOTAL_AMOUNT: orderRows.TOTAL_AMOUNT,
                                            ORDER_NUMBER: orderRows.ORDER_NUMBER,
                                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                                            DATE_TIME: mm.getUTCDateFromTimezone(orderRows.IANA_CODE),
                                            IANA_CODE: orderRows.IANA_CODE,
                                            supportKey: 0,
                                        }

                                        // mm.sendDynamicEmail(52, ORDER_ID, supportKey)//customeremail
                                        dbm.saveLog(logData, technicianActionLog);
                                        checkEmails.forEach(emailObj => {
                                            let email = emailObj.EMAIL_ID;
                                            let name = emailObj.NAME;
                                            let subject = `Description updated for work order: ${orderRows.ORDER_NUMBER}`;
                                            let body = `<!-- HEADER --> <div style="background:#ffffff;padding:20px;padding-bottom:5px !important;text-align:center;">     <img src="https://console.ovationwps.com/auth/static/logo/Vantage_Main_Logo.png" style="width:200px;"> </div> <!-- BODY --> <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:20px;padding-top:5px !important;font-family:Roboto,Arial,sans-serif;">     <p style="font-size:15px;color:#333;">         Dear <strong>${name}</strong>,     </p>     <p style="font-size:15px;color:#444;">         The description for work order&nbsp;<strong>${orderRows.ORDER_NUMBER}</strong> has been updated.     </p>     <p style="font-size:15px;color:#444;">         <strong><br>Updated Description:</strong>&nbsp;</p><p style="font-size:15px;color:#444;">${REMARK}     </p><p style="font-size:15px;color:#444;"><br></p>     <p style="font-size:15px;color:#444;margin-top:15px;">         For assistance, contact us at <strong>servicedesk@ovationwps.com</strong>.     </p>     <p style="margin-top:30px;font-size:14px;color:#333;">         <strong>Best Regards,</strong><br>         <strong>Vantage Team</strong>     </p> </div> <!-- FOOTER --> <div style="background:#f3f3f3;padding:20px;text-align:center;border-top:1px solid #e1e1e1;             font-family:Roboto,Arial,sans-serif;font-size:13px;color:#555;">     <p style="margin:0;">Need help? Contact <strong>servicedesk@ovationwps.com</strong></p>     <p style="margin:6px 0 0;">© Vantage. All Rights Reserved.</p> </div>`;
                                            mm.sendEmail(email, [], subject, body, "", "", (error, emailResult) => {
                                                if (error) {
                                                    console.log("Error sending email to " + email + ": " + error);
                                                } else {
                                                    console.log("Email sent successfully to " + email);
                                                }

                                            })
                                        });
                                        res.send({
                                            "code": 200,
                                            "message": "OrderMaster information updated successfully."
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        })
    }
}


exports.getServices = (req, res) => {
    try {

        console.log(req.body)
        var teritory_id = req.body.TERRITORY_ID;
        var customer_id = req.body.CUSTOMER_ID;
        var subcategory_id = req.body.SUB_CATEGORY_ID;
        var searchkey = req.body.SEARCHKEY;
        var parentID = req.body.PARENT_ID;
        var customerCategoryType = req.body.CUSTOMER_TYPE;
        var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
        var pageSize = req.body.pageSize ? req.body.pageSize : '';
        let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
        let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
        if (subcategory_id) {
            var start = 0;
            var end = 0;
            var filter = ` and S.SUB_CATEGORY_ID = ${subcategory_id} ` + (parentID ? `AND S.PARENT_ID = ${parentID} ` : ` AND S.PARENT_ID=0 `) + (searchkey ? `AND S.NAME LIKE ${searchkey}` : ``)
            var filterAll = filter + (customerCategoryType == 'I' ? ` AND S.SERVICE_TYPE IN ('C','O')` : ` AND S.SERVICE_TYPE IN ('B','O')`) + ``;
            let criteria = '';
            let countCriteria = filterAll;

            if (pageIndex != '' && pageSize != '') {
                start = (pageIndex - 1) * pageSize;
                end = pageSize;
            }

            var dataquery = []
            dataquery.push(teritory_id)
            dataquery.push(subcategory_id)
            parentID ? dataquery.push(parentID) : true;
            searchkey ? dataquery.push(searchkey) : true;

            var keyData = customerCategoryType == 'I' ? 'B2C_PRICE' : 'B2B_PRICE';

            if (pageIndex === '' && pageSize === '')
                criteria = filter + " order by " + sortKey + " " + sortValue;
            else
                criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

            var supportKey = req.headers['supportkey'];
            var deviceid = req.headers['deviceid'];

            mm.executeQueryData(`CALL Sp_GetCustomerDetails(?)`, [customer_id], supportKey, (error, results11) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get services count.",
                    });
                }
                else {
                    results11 = results11[0];

                    mm.executeQueryData(`CALL Sp_GetServiceCount(?)`, [countCriteria], supportKey, (error, results1) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get services count.",
                            });
                        }
                        else {
                            results1 = results1[0];
                            var Query = ``;
                            console.log("here 1: ", customerCategoryType);

                            if (customerCategoryType == 'I') {
                                Query = ` SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_PERIOD, S.GUARANTEE_PERIOD) AS GUARANTEE_PERIOD,
    COALESCE(T.WARRANTY_PERIOD, S.PREPARATION_HOURS) AS PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_ALLOWED, S.GUARANTEE_ALLOWED) AS GUARANTEE_ALLOWED,
    COALESCE(T.WARRANTY_ALLOWED, S.WARRANTY_ALLOWED) AS WARRANTY_ALLOWED,
    COALESCE(T.SERVICE_DETAILS_IMAGE, S.SERVICE_DETAILS_IMAGE) AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT
FROM 
    view_service_master S
JOIN 
    view_territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
     S.IS_FOR_B2B = 0 AND S.STATUS = 1 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filterAll}
UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    S.SERVICE_IMAGE AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
     NULL AS GUARANTEE_PERIOD,
    NULL AS PREPARATION_HOURS,
    NULL AS GUARANTEE_ALLOWED,
    NULL AS WARRANTY_ALLOWED,
    NULL AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
     (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id}  AND T.IS_AVAILABLE =1   ${filter}
    ) and S.IS_FOR_B2B = 0 AND S.STATUS = 1
ORDER BY 
    ID ASC;`;

                                console.log("here :  ", Query);

                                mm.executeQueryData(`CALL Sp_GetServicesData(?)`, [Query], supportKey, (error, results) => {
                                    if (error) {
                                        console.log(error);

                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to get services information."
                                        });
                                    }
                                    else {
                                        const resultSets = results.filter(r => Array.isArray(r));
                                        res.send({
                                            "code": 200,
                                            "message": "success",
                                            "count": results1[0].cnt,
                                            "data": resultSets[0]
                                        });
                                    }
                                });
                            }
                            else {
                                //FOR B2B CUSTOMER
                                if (results11.length > 0 && results11[0].IS_SPECIAL_CATALOGUE) {

                                    Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.CUSTOMER_ID, NULL) AS CUSTOMER_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.MAX_QTY, S.MAX_QTY) AS MAX_QTY,
    COALESCE(T.SITE_VISIT_REPORT_TYPE, S.SITE_VISIT_REPORT_TYPE) AS SITE_VISIT_REPORT_TYPE,
    COALESCE(T.IS_JOB_CREATED_DIRECTLY, S.IS_JOB_CREATED_DIRECTLY) AS IS_JOB_CREATED_DIRECTLY,
    COALESCE(T.JOB_CLOSURE_TIME, S.JOB_CLOSURE_TIME) AS JOB_CLOSURE_TIME,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_PERIOD, S.GUARANTEE_PERIOD) AS GUARANTEE_PERIOD,
    COALESCE(T.WARRANTY_PERIOD, S.WARRANTY_PERIOD) AS WARRANTY_PERIOD,
    COALESCE(T.GUARANTEE_ALLOWED, S.GUARANTEE_ALLOWED) AS GUARANTEE_ALLOWED,
    COALESCE(T.WARRANTY_ALLOWED, S.WARRANTY_ALLOWED) AS WARRANTY_ALLOWED,
    COALESCE(T.SERVICE_DETAILS_IMAGE, S.SERVICE_DETAILS_IMAGE) AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
        0 as CHILD_COUNT
FROM 
    view_service_master S
JOIN 
    view_b2b_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID} 
WHERE 
  S.IS_PARENT = 0 AND T.IS_AVAILABLE =1  ${filterAll} AND s.STATUS=1

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS CUSTOMER_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS MAX_QTY,
    NULL AS SITE_VISIT_REPORT_TYPE,
    NULL AS IS_JOB_CREATED_DIRECTLY,
    NULL AS JOB_CLOSURE_TIME,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    S.SERVICE_IMAGE AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    NULL AS GUARANTEE_PERIOD,
    NULL AS WARRANTY_PERIOD,
    NULL AS GUARANTEE_ALLOWED,
    NULL AS WARRANTY_ALLOWED,
    NULL AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM b2b_availability_mapping where CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_b2b_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID} AND T.IS_AVAILABLE =1 
    ) ${filter}
ORDER BY 
    ID ASC;`
                                    console.log("HERE ", Query);


                                } else {

                                    Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(0, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(1, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
     COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_PERIOD, S.GUARANTEE_PERIOD) AS GUARANTEE_PERIOD,
    COALESCE(T.WARRANTY_PERIOD, S.PREPARATION_HOURS) AS PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_ALLOWED, S.GUARANTEE_ALLOWED) AS GUARANTEE_ALLOWED,
    COALESCE(T.WARRANTY_ALLOWED, S.WARRANTY_ALLOWED) AS WARRANTY_ALLOWED,
    COALESCE(T.SERVICE_DETAILS_IMAGE, S.SERVICE_DETAILS_IMAGE) AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT
FROM 
    view_service_master S
JOIN 
    view_service_master T 
    ON S.ID = T.ID 
WHERE 
     S.IS_PARENT = 0 AND S.STATUS=1 AND T.STATUS=1   AND S.IS_FOR_B2B=0  AND T.IS_FOR_B2B=0 ${filterAll}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    S.SERVICE_IMAGE AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    NULL AS GUARANTEE_PERIOD,
    NULL AS PREPARATION_HOURS,
    NULL AS GUARANTEE_ALLOWED,
    NULL AS WARRANTY_ALLOWED,
    NULL AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1  ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND S.STATUS=1
    AND S.IS_FOR_B2B=0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id} AND T.IS_AVAILABLE =1 AND Sub.STATUS=1    ${filter}
    )  
ORDER BY 
    ID ASC;`

                                }
                                mm.executeQueryData(`CALL Sp_GetServicesData(?)`, [Query], supportKey, (error, results) => {
                                    if (error) {
                                        console.log(error);

                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to get services information."
                                        });
                                    }
                                    else {
                                        const resultSets = results.filter(r => Array.isArray(r));
                                        res.send({
                                            "code": 200,
                                            "message": "success",
                                            "count": results1[0].cnt,
                                            "data": resultSets[0]
                                        });
                                    }
                                });
                            }
                        }
                    })
                }
            })
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing, subcategory_id ."
            });

        }

    } catch (error) {
        console.log(error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
}


exports.getCategoriesHierarchy = (req, res) => {
    try {
        const customer_id = req.body.CUSTOMER_ID;
        const teritory_id = req.body.TERRITORY_ID;
        const sortKey = req.body.sortKey || 'SEQ_NO';
        const sortValue = req.body.sortValue || 'ASC'; // Default to ASC
        const supportKey = req.headers['supportkey'];
        const deviceid = req.headers['deviceid'];
        console.log("sortValue", sortValue)

        mm.executeQueryData(`CALL Sp_GetCustomerDetailsHierarchy(?)`, [customer_id], supportKey, (error, resultsCustomer) => {
            if (error) {
                console.log(error);
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey, supportKey, deviceid);
                return res.send({ code: 400, message: "Failed to get Data" });
            }
            resultsCustomer = resultsCustomer[0];
            const hasCustomer = resultsCustomer.length > 0;
            const customerType = hasCustomer ? resultsCustomer[0].CUSTOMER_TYPE : null;
            const isSpecial = hasCustomer && resultsCustomer[0].IS_SPECIAL_CATALOGUE === 1;
            const CustID = hasCustomer && customerType === 'B' ? resultsCustomer[0].CUSTOMER_DETAILS_ID : customer_id;

            let query = '';
            let processedQuery = '';
            console.log("isSpecial", isSpecial);
            console.log("customerType", customerType);
            console.log("CustID", CustID);

            if (hasCustomer && customerType === 'B' && isSpecial) {
                query = `
                        SELECT REPLACE(REPLACE(CONCAT('[',
                            GROUP_CONCAT(
                                JSON_OBJECT(
                                    'key', c.ID,
                                    'title', c.NAME,
                                    'DESCRIPTION', c.DESCRIPTION,
                                    'ICON', c.ICON,
                                    'disabled', 'true',
                                    'children', IFNULL((
                                        SELECT REPLACE(REPLACE(CONCAT('[',
                                            GROUP_CONCAT(
                                                JSON_OBJECT(
                                                    'key', s.ID,
                                                    'title', s.NAME,
                                                    'DESCRIPTION', s.DESCRIPTION,
                                                    'ICON', s.IMAGE,
                                                    'isLeaf', 'true'
                                                ) ORDER BY s.${sortKey} ${sortValue}
                                            ), ']'), '"[', '['), ']"', ']')
                                        FROM sub_category_master s
                                        WHERE s.CATEGORY_ID = c.ID AND s.STATUS = 1
                                        AND s.ID IN (
                                            SELECT SUB_CATEGORY_ID
                                            FROM view_b2b_availability_mapping
                                            WHERE CUSTOMER_ID = ${CustID} AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1
                                        )
                                    ), '[]')
                                ) ORDER BY c.${sortKey} ${sortValue}
                            ), ']'), '"[', '['), ']"', ']') AS data
                        FROM category_master c
                        WHERE STATUS = 1
                        AND ID IN (
                            SELECT CATEGORY_ID
                            FROM view_b2b_availability_mapping
                            WHERE CUSTOMER_ID = ${CustID} AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1
                        );
                    `;
            } else if (hasCustomer === true && customerType === 'B' && isSpecial === false) {
                query = `
                        SELECT REPLACE(REPLACE(CONCAT('[',
                            GROUP_CONCAT(
                                JSON_OBJECT(
                                    'key', c.ID,
                                    'title', c.NAME,
                                    'DESCRIPTION', c.DESCRIPTION,
                                    'ICON', c.ICON,
                                    'disabled', 'true',
                                    'children', IFNULL((
                                        SELECT REPLACE(REPLACE(CONCAT('[',
                                            GROUP_CONCAT(
                                                JSON_OBJECT(
                                                    'key', s.ID,
                                                    'title', s.NAME,
                                                    'DESCRIPTION', s.DESCRIPTION,
                                                    'ICON', s.IMAGE,
                                                    'isLeaf', 'true'
                                                ) ORDER BY s.${sortKey} ${sortValue}
                                            ), ']'), '"[', '['), ']"', ']')
                                        FROM sub_category_master s
                                        WHERE s.CATEGORY_ID = c.ID AND s.STATUS = 1
                                        AND s.ID IN (
                                            SELECT SUB_CATEGORY_ID
                                            FROM view_service_master
                                            WHERE 1 AND STATUS = 1
                                        )
                                    ), '[]')
                                ) ORDER BY c.${sortKey} ${sortValue}
                            ), ']'), '"[', '['), ']"', ']') AS data
                        FROM category_master c
                        WHERE STATUS = 1
                        AND ID IN (
                            SELECT CATEGORY_ID
                            FROM view_service_master
                            WHERE 1 AND STATUS = 1
                        );
                    `;
            } else {
                query = `
                        SELECT REPLACE(REPLACE(CONCAT('[',
                            GROUP_CONCAT(
                                JSON_OBJECT(
                                    'key', c.ID,
                                    'title', c.NAME,
                                    'DESCRIPTION', c.DESCRIPTION,
                                    'ICON', c.ICON,
                                    'disabled', 'true',
                                    'children', IFNULL((
                                        SELECT REPLACE(REPLACE(CONCAT('[',
                                            GROUP_CONCAT(
                                                JSON_OBJECT(
                                                    'key', s.ID,
                                                    'title', s.NAME,
                                                    'DESCRIPTION', s.DESCRIPTION,
                                                    'ICON', s.IMAGE,
                                                    'isLeaf', 'true'
                                                ) ORDER BY s.${sortKey} ${sortValue}
                                            ), ']'), '"[', '['), ']"', ']')
                                        FROM sub_category_master s
                                        WHERE s.CATEGORY_ID = c.ID AND s.STATUS = 1
                                        AND s.ID IN (
                                            SELECT SUB_CATEGORY_ID
                                            FROM view_service_master
                                            WHERE 1 AND STATUS = 1
                                        )
                                    ), '[]')
                                ) ORDER BY c.${sortKey} ${sortValue}
                            ), ']'), '"[', '['), ']"', ']') AS data
                        FROM category_master c
                        WHERE STATUS = 1
                        AND ID IN (
                            SELECT CATEGORY_ID
                            FROM view_service_master
                            WHERE 1 AND STATUS = 1
                        );
                    `;
            }

            // No need for qdata array anymore since we replaced placeholders directly in query
            mm.executeQueryData(`CALL Sp_GetCategoriesHierarchyData(?)`, [query], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey, supportKey, deviceid);
                    return res.send({ code: 400, message: "Failed to get Data" });
                }
                results = results[0];
                let json = results[0].data;

                if (json) {
                    json = json.replace(/\\/g, '')
                        .replace(/\"true\"/g, true)
                        .replace(/\"false\"/g, false);
                }

                return res.send({
                    code: 200,
                    message: "success",
                    data: JSON.parse(json)
                });
            });
        });
    } catch (error) {
        console.log(error);
        const supportKey = req.headers['supportkey'];
        const deviceid = req.headers['deviceid'];
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey, supportKey, deviceid);
        return res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.getServicesForWeb = (req, res) => {
    try {

        console.log(req.body)
        var teritory_id = req.body.TERRITORY_ID;
        var customer_id = req.body.CUSTOMER_ID;
        var subcategory_id = req.body.SUB_CATEGORY_ID;
        var searchkey = req.body.SEARCHKEY;
        var parentID = req.body.PARENT_ID;
        var customerCategoryType = req.body.CUSTOMER_TYPE;
        let customFilter = req.body.filter

        var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
        var pageSize = req.body.pageSize ? req.body.pageSize : '';
        let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
        let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';


        if (((customerCategoryType == 'I' && teritory_id) || (customerCategoryType != 'I' && customer_id)) && subcategory_id) {
            var start = 0;
            var end = 0;
            var filter = `${customFilter} and S.CATEGORY_ID = ${subcategory_id} ` + (parentID ? `AND S.PARENT_ID = ${parentID} ` : ` AND S.PARENT_ID=0 `) + (searchkey ? `AND S.NAME LIKE ${searchkey}` : ``)
            var filterAll = filter + (customerCategoryType == 'I' ? ` AND S.SERVICE_TYPE IN ('C','O')` : ` AND S.SERVICE_TYPE IN ('B','O')`) + ``;
            let criteria = '';
            let countCriteria = customFilter + filter;

            if (pageIndex != '' && pageSize != '') {
                start = (pageIndex - 1) * pageSize;
                end = pageSize;
            }

            var dataquery = []
            dataquery.push(teritory_id)
            dataquery.push(subcategory_id)
            parentID ? dataquery.push(parentID) : true;
            searchkey ? dataquery.push(searchkey) : true;
            var customerFilter = '';
            if (customer_id) {
                customerFilter = ` AND CUSTOMER_ID = ${customer_id}`
            }

            var keyData = customerCategoryType == 'I' ? 'B2C_PRICE' : 'B2B_PRICE';

            if (pageIndex === '' && pageSize === '')
                criteria = filter + " order by " + sortKey + " " + sortValue;
            else
                criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

            var supportKey = req.headers['supportkey'];

            var deviceid = req.headers['deviceid'];

            mm.executeQueryData(`CALL Sp_Web_GetServiceCount(?,?)`, [teritory_id, countCriteria], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get services count.",
                    });
                }
                else {
                    results1 = results1[0];

                    var Query = ``;
                    console.log("here 1: ", customerCategoryType);

                    if (customerCategoryType == 'I') {
                        Query = ` SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    0 as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = 'S' AND CART_STATUS = 'C' ORDER BY ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    view_territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
     S.IS_FOR_B2B = 0 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filterAll}
UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = 'S' AND CART_STATUS = 'C' ORDER BY ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id}  AND T.IS_AVAILABLE =1   ${filter}
    ) and S.IS_FOR_B2B = 0
ORDER BY 
    ID ASC;`;

                        console.log("here :  ", Query);

                        mm.executeQueryData(`CALL Sp_Web_GetServicesData(?)`, [Query], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);

                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services information."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "success",
                                    "count": results1[0].cnt,
                                    "data": results
                                });
                            }
                        });
                    }
                    else {

                        mm.executeQueryData(`CALL Sp_Web_GetCustomerDetails(?)`, [customer_id], supportKey, (error, results11) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services count.",
                                });
                            }
                            else {
                                results11 = results11[0];
                                if (results11.length > 0) {

                                    if (results11[0].IS_SPECIAL_CATALOGUE) {
                                        customerFilter = ` AND CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID}`;
                                        Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.CUSTOMER_ID, NULL) AS CUSTOMER_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT,
        IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    view_b2b_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID}
WHERE 
  S.IS_PARENT = 0 AND T.IS_AVAILABLE =1  ${filterAll}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS CUSTOMER_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM b2b_availability_mapping where CUSTOMER_ID = ${customer_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_b2b_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID} AND T.IS_AVAILABLE =1 
    ) ${filter}
ORDER BY 
    ID ASC;`
                                        console.log("HERE ", Query);


                                    } else {
                                        Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT,
        IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    view_territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
    S.IS_FOR_B2B = 0 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filterAll}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1  ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id} AND T.IS_AVAILABLE =1    ${filter}
    ) and S.IS_FOR_B2B = 0 
ORDER BY 
    ID ASC;`

                                    }

                                    mm.executeQueryData(`CALL Sp_Web_GetServicesData(?)`, [Query], supportKey, (error, results) => {
                                        if (error) {
                                            console.log(error);

                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get services information."
                                            });
                                        }
                                        else {
                                            res.send({
                                                "code": 200,
                                                "message": "success",
                                                "count": results1[0].cnt,
                                                "data": results
                                            });
                                        }
                                    });


                                } else {

                                    res.send({
                                        "code": 201,
                                        "message": "No customer data found.",
                                    });
                                    console.log("No customer data found.");
                                }
                            }
                        });
                    }
                }
            });
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing- teritory_id, subcategory_id ."
            });
        }
    } catch (error) {
        console.log(error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
}

exports.updateWorkOrderType = (req, res) => {
    let systemDate = mm.getSystemDate();
    let { ORDER_TYPE, ORDER_ID, IANA_CODE, GUEST_TECHNICIAN_NAME, GUEST_TECHNICIAN_EMAIL, GUEST_TECHNICIAN_CONTACT, GUEST_TECHNICIAN_OTHER_DETAILS, OLD_ORDER_TYPE } = req.body;

    let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);
    let supportKey = req.headers['supportkey'];

    if (!ORDER_ID) {
        return res.status(400).send({
            code: 400,
            message: "ORDER_ID is required."
        });
    }

    if (!ORDER_TYPE) {
        return res.status(400).send({
            code: 400,
            message: "ORDER_TYPE is required."
        });
    }

    if (!IANA_CODE) {
        return res.status(302).send({
            code: 302,
            message: "Please provide the work order's timezone to proceed"
        });
    }
    let OrderFullName = "";
    let oldType = ""
    if (ORDER_TYPE === "G") {
        OrderFullName = "Work Order For Guest Technician";
    } else if (ORDER_TYPE === "N") {
        OrderFullName = "Normal Work Order";

    } else if (ORDER_TYPE === "R") {
        OrderFullName = "Remote Work Order";
    } else {
        return res.status(400).send({
            code: 400,
            message: "Invalid ORDER_TYPE value."
        });
    }

    if (OLD_ORDER_TYPE === "G") {
        oldType = "Work Order For Guest Technician";
    } else if (OLD_ORDER_TYPE === "N") {
        oldType = "Normal Work Order";
    } else if (OLD_ORDER_TYPE === "R") {
        oldType = "Remote Work Order";
    } else {
        return res.status(400).send({
            code: 400,
            message: "Invalid ORDER_TYPE value."
        });
    }

    try {
        mm.executeQueryData(`CALL Sp_GetOrderMaster(?)`, [ORDER_ID], supportKey, (error, resultsCheck) => {
            if (error) {
                logger.error(
                    supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                    applicationkey
                );
                return res.status(400).send({
                    code: 400,
                    message: "Failed to update orderMaster information."
                });
            }

            mm.executeQueryData(`CALL Sp_GetJobCardByOrder(?)`, [ORDER_ID], supportKey, (error, resultJob1) => {
                if (error) {
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).send({
                        code: 400,
                        message: "Failed to update orderMaster information."
                    });
                }

                if (resultsCheck[0].length === 0) {
                    return res.status(400).send({
                        code: 400,
                        message: "Order not found."
                    });
                }

                const order = resultsCheck[0][0];
                console.log(
                    "order", order
                )

                // BUSINESS RULE PRESERVED
                if (order.ORDER_STATUS_ID != 1 && order.ORDER_STATUS_ID != 2) {
                    return res.status(300).send({
                        code: 300,
                        message: "Order already in progress, cannot update order type."
                    });
                }

                let setData = "";
                let recordData = [];

                if (ORDER_TYPE === "G") {
                    setData = ` ORDER_TYPE = ?, GUEST_TECHNICIAN_NAME = ?, GUEST_TECHNICIAN_EMAIL = ?, GUEST_TECHNICIAN_CONTACT = ?, GUEST_TECHNICIAN_OTHER_DETAILS = ?, CREATED_MODIFIED_DATE = ?
                    `;
                    recordData = [ORDER_TYPE, GUEST_TECHNICIAN_NAME, GUEST_TECHNICIAN_EMAIL, GUEST_TECHNICIAN_CONTACT, GUEST_TECHNICIAN_OTHER_DETAILS, systemDate];
                } else {
                    setData = ` ORDER_TYPE = ?, CREATED_MODIFIED_DATE = ?
                    `;
                    recordData = [ORDER_TYPE, systemDate];
                }

                mm.executeQueryData(`CALL Sp_UpdateOrderType(?,?,?,?,?,?,?)`, [ORDER_TYPE, GUEST_TECHNICIAN_NAME, GUEST_TECHNICIAN_EMAIL, GUEST_TECHNICIAN_CONTACT, GUEST_TECHNICIAN_OTHER_DETAILS, systemDate, ORDER_ID], supportKey, (error) => {
                    if (error) {
                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );
                        return res.status(400).send({
                            code: 400,
                            message: "Failed to update orderMaster information."
                        });
                    }
                    var resultJob = resultJob1[0]

                    if (resultJob.length > 0 && (ORDER_TYPE === "R" || OLD_ORDER_TYPE === "R")) {
                        let IS_REMOTE_JOB = 0;
                        if (ORDER_TYPE === "R") {
                            IS_REMOTE_JOB = 1;
                        } else if (OLD_ORDER_TYPE === "R") {
                            IS_REMOTE_JOB = 0;
                        }
                        mm.executeQueryData(`CALL Sp_UpdateJobCardRemote(?,?,?)`, [IS_REMOTE_JOB, resultJob[0].ID, ORDER_ID], supportKey, (error) => {
                            if (error) {
                                logger.error(
                                    supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                                    applicationkey
                                );
                                return res.status(400).send({
                                    code: 400,
                                    message: "Failed to update orderMaster information."
                                });
                            }
                        });
                    }


                    const user = req.body.authData.data.UserData[0];
                    const ACTION_DETAILS = `The work order type has been updated from ${oldType} to ${OrderFullName} by ${user.NAME || user.USER_NAME} for the customer ${order.COMPANY_NAME}.`;

                    const logData = {
                        TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: order.ID, JOB_CARD_ID: 0, CUSTOMER_ID: order.CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS, USER_ID: user.USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: order.ORDER_MEDIUM, ORDER_STATUS: "Work order updated", PAYMENT_MODE: order.PAYMENT_MODE, PAYMENT_STATUS: order.PAYMENT_STATUS, TOTAL_AMOUNT: order.TOTAL_AMOUNT, ORDER_NUMBER: order.ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: null, USER_NAME: user.NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE
                    };
                    dbm.saveLog(logData, technicianActionLog);

                    return res.status(200).send({
                        code: 200,
                        message: "OrderMaster information updated successfully..."
                    });
                });
            });
        });
    } catch (error) {
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        return res.status(500).send({
            code: 500,
            message: "Something Went Wrong."
        });
    }
};


