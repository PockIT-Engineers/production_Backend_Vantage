const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const { createOrder } = require('./order');
const technicianActionLog = require("../../modules/technicianActionLog")
const shopActionLog = require("../../modules/shopOrderActionLog")
const dbm = require('../../utilities/dbMongo')
const applicationkey = process.env.APPLICATION_KEY;
var cartMaster = "cart_master";
var viewCartMaster = "view_" + cartMaster;
// Conversion Done 

function formatDate(dateInput) {
    const date = new Date(dateInput);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}


function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        CREATED_DATE: req.body.CREATED_DATE,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID


    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('CREATED_DATE').optional(),
        body('STATUS').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {

    const supportKey = req.headers['supportkey'];

    let pageIndex = req.body.pageIndex || 0;
    let pageSize = req.body.pageSize || 0;
    let sortKey = req.body.sortKey || 'ID';
    let sortValue = req.body.sortValue || 'DESC';
    let filter = (req.body.filter || '').trim();

    if (mm.sanitizeFilter(filter) !== "0") {
        return res.send({ code: 400, message: "Invalid filter parameter." });
    }

    const safeFilter = filter.replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex};
        SET @v_PAGE_SIZE  = ${pageSize};
        SET @v_SORT_KEY   = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER     = '${safeFilter}';
    `;

    mm.executeQueryData(
        setContext + `CALL sp_cart_get();`,
        [],
        supportKey,
        (error, results) => {
            if (error) {
                return res.send({ code: 400, message: "Failed to get cart information." });
            }

            const resultSets = results.filter(r => Array.isArray(r));
            const countResult = resultSets[0] || [];
            const dataResult = resultSets[1] || [];

            res.send({
                code: 200,
                message: "success",
                TAB_ID: 6,
                count: countResult[0] ? countResult[0].cnt : 0,
                data: dataResult
            });
        }
    );
};


exports.create = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ code: 422, message: errors.errors });
    }

    mm.executeQueryData(
        `CALL sp_cart_create(?,?,?,?,?)`,
        [
            data.CUSTOMER_ID,
            data.TOTAL_AMOUNT,
            data.CREATED_DATE,
            data.STATUS,
            data.CLIENT_ID
        ],
        supportKey,
        (error, result) => {
            if (error) {
                return res.send({ code: 400, message: "Failed to save cart information." });
            }

            res.send({
                code: 200,
                message: "Cart information saved successfully..."
            });
        }
    );
};

exports.update = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ code: 422, message: errors.errors });
    }

    mm.executeQueryData(
        `CALL sp_cart_update(?,?,?,?,?,?)`,
        [
            req.body.ID,
            data.CUSTOMER_ID,
            data.TOTAL_AMOUNT,
            data.CREATED_DATE,
            data.STATUS,
            data.CLIENT_ID
        ],
        supportKey,
        (error, result) => {
            if (error) {
                return res.send({ code: 400, message: "Failed to update cart information." });
            }

            res.send({
                code: 200,
                message: "Cart information updated successfully..."
            });
        }
    );
};


exports.addToCart = (req, res) => {
    try {
        const {
            CUSTOMER_ID,
            SERVICE_ID,
            INVENTORY_ID,
            TERITORY_ID,
            QUANTITY,
            STATE_ID,
            IS_TEMP_CART = 0,
            TYPE = 'S',
            QUANTITY_PER_UNIT = 0,
            UNIT_ID = 0,
            UNIT_NAME = '',
            BRAND_NAME = '',
            MODEL_NUMBER = '',
            SERVICE_PHOTO_FILE = '',
            DESCRIPTION = '',
            ADDRESS_ID,
            DOCUMENT_NAME = '',
        } = req.body;
        let IANA_CODE = req.body.IANA_CODE
        if (!IANA_CODE) {
            res.send({
                "code": 302,
                "message": "Please provide the order's timezone to proceed"
            });
            return;
        }
        // var systemDate = mm.getUTCFromTimezone(IANA_CODE);
        let systemDate = mm.getUTCDateFromTimezone(IANA_CODE);

        const supportKey = req.headers['supportkey'];
        // const systemDate = mm.getSystemDate();
        // Validate required parameters based on TYPE
        if (TYPE === 'S') {
            if (!CUSTOMER_ID || !SERVICE_ID || !QUANTITY || !STATE_ID || !ADDRESS_ID) {
                return res.status(400).send({
                    code: 400,
                    message: "Missing required parameters for cart service: CUSTOMER_ID, SERVICE_ID, TERITORY_ID, QUANTITY, STATE_ID, ADDRESS_ID"
                });
            }
        } else {
            if (!CUSTOMER_ID || !INVENTORY_ID || !QUANTITY || !STATE_ID || !ADDRESS_ID || !QUANTITY_PER_UNIT || !UNIT_ID || !UNIT_NAME) {
                return res.status(400).send({
                    code: 400,
                    message: "Missing required parameters for cart inventory: CUSTOMER_ID, INVENTORY_ID, TERITORY_ID, QUANTITY, STATE_ID, ADDRESS_ID, QUANTITY_PER_UNIT, UNIT_ID, UNIT_NAME"
                });
            }
        }

        const connection = mm.openConnection();
        let query = '';
        let queryData = [];

        if (TYPE === 'S') {
            query = `CALL spAddToCart_new(?,?,?,?,?,?,?,?,?,?,?,?)`;
            queryData = [
                CUSTOMER_ID, SERVICE_ID, TERITORY_ID, QUANTITY, STATE_ID,
                IS_TEMP_CART, BRAND_NAME, MODEL_NUMBER, SERVICE_PHOTO_FILE,
                DESCRIPTION, ADDRESS_ID, DOCUMENT_NAME
            ];
        } else {
            query = `CALL spAddToCart_shop(?,?,?,?,?,?,?,?,?,?)`;
            queryData = [
                CUSTOMER_ID, INVENTORY_ID, QUANTITY, STATE_ID, IS_TEMP_CART,
                ADDRESS_ID, TERITORY_ID, QUANTITY_PER_UNIT, UNIT_ID, UNIT_NAME
            ];
        }

        mm.executeDML(query, queryData, supportKey, connection, (error, results) => {
            if (error) {
                console.error("Database Error:", error);
                mm.rollbackConnection(connection);
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);

                return res.status(400).send({
                    code: 400,
                    message: "Failed to save cart information."
                });
            }

            const cartId = results[0][0].CART_ID;
            const userData = req.body.authData.data.UserData[0];
            const actionDetails = `Customer ${userData.USER_NAME} has created a cart.`;

            const logData = {
                CUSTOMER_ID,
                USER_ID: userData.USER_ID,
                USER_NAME: userData.USER_NAME,
                CART_ID: cartId,
                DATE_TIME: systemDate,
                LOG_TYPE: 'Cart',
                ACTION_LOG_TYPE: 'Customer',
                ACTION_DETAILS: actionDetails,
                ORDER_STATUS: TYPE === 'S' ? "Services added to cart" : "Product added to cart",
                TOTAL_AMOUNT: 0,
                IANA_CODE: IANA_CODE
            };

            const module = TYPE === 'S' ? technicianActionLog : shopActionLog;
            dbm.saveLog(logData, module);

            mm.commitConnection(connection);

            res.status(200).send({
                code: 200,
                message: "Cart information saved successfully.",
                data: {
                    CART_ID: cartId
                }
            });
        });
    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong. Please try again."
        });
    }
};


exports.getCartDetails = (req, res) => {
    try {

        const CUSTOMER_ID = req.body.CUSTOMER_ID || null;
        const CART_ID = req.body.CART_ID || null;
        const IS_CART_PAGE = req.body.IS_CART_PAGE ? 1 : 0;
        const supportKey = req.headers['supportkey'];

        mm.executeQueryData(
            `CALL sp_getCartDetails(?,?,?)`,
            [CUSTOMER_ID, CART_ID, IS_CART_PAGE],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to get cart information..."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));

                /* If only message returned */
                if (resultSets.length === 1 && resultSets[0][0]?.message) {
                    return res.send(resultSets[0][0]);
                }

                const cartInfo = resultSets[0] || [];
                const cartDetails = resultSets[1] || [];
                const typeResult = resultSets[2] || [];

                res.send({
                    code: 200,
                    message: "Cart information fetched successfully...",
                    data: {
                        CART_INFO: cartInfo,
                        CART_DETAILS: cartDetails,
                        TYPE: typeResult[0] ? typeResult[0].TYPE : null
                    }
                });
            }
        );

    } catch (error) {
        console.log("Error in getCartDetails :- ", error);
        res.send({
            code: 400,
            message: "Something went wrong, Please try again."
        });
    }
};


exports.deleteCartItem = (req, res) => {
    try {

        const {
            CUSTOMER_ID,
            INVENTORY_ID,
            SERVICE_ID,
            CART_ID,
            CART_ITEM_ID,
            TYPE = 'S',
            IANA_CODE
        } = req.body;

        const supportKey = req.headers['supportkey'];

        if (!IANA_CODE) {
            return res.send({
                code: 302,
                message: "Please provide the order's timezone to proceed"
            });
        }

        let systemDate = mm.getUTCDateFromTimezone(IANA_CODE);

        mm.executeQueryData(
            `CALL sp_deleteCartItem(?,?,?,?,?,?)`,
            [
                CUSTOMER_ID || null,
                SERVICE_ID || null,
                INVENTORY_ID || null,
                CART_ID || null,
                CART_ITEM_ID || null,
                TYPE
            ],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to delete cart information..."
                    });
                }

                const r = result[0][0];

                if (r.code !== 200) {
                    return res.send(r);
                }

                /* -------- MONGO LOG (UNCHANGED) -------- */

                let logdata = {};
                let module = '';

                const userData = req.body.authData.data.UserData[0];

                if (TYPE === 'S') {

                    logdata = {
                        CUSTOMER_ID,
                        LOG_TYPE: 'Cart',
                        ACTION_LOG_TYPE: 'Customer',
                        ACTION_DETAILS: `Customer ${userData.USER_NAME} has deleted a cart.`,
                        USER_ID: userData.USER_ID,
                        CART_ID,
                        ORDER_STATUS: "Service removed from cart",
                        USER_NAME: userData.USER_NAME,
                        DATE_TIME: systemDate,
                        IANA_CODE
                    };

                    module = technicianActionLog;

                } else {

                    logdata = {
                        CUSTOMER_ID,
                        LOG_TYPE: 'Cart',
                        ACTION_LOG_TYPE: 'Customer',
                        ACTION_DETAILS: `Customer ${userData.USER_NAME} has deleted a cart.`,
                        USER_ID: userData.USER_ID,
                        CART_ID,
                        ORDER_STATUS: "Product removed from cart",
                        USER_NAME: userData.USER_NAME,
                        DATE_TIME: systemDate,
                        IANA_CODE
                    };

                    module = shopActionLog;
                }

                dbm.saveLog(logdata, module);

                res.send(r);
            }
        );

    } catch (error) {
        console.log("Error in delete :- ", error);
        res.send({
            code: 400,
            message: "Something went wrong, Please try again."
        });
    }
};

exports.updateCartItem = (req, res) => {
    try {

        const {
            CUSTOMER_ID,
            INVENTORY_ID,
            SERVICE_ID,
            CART_ID,
            CART_ITEM_ID,
            QUANTITY,
            TYPE = 'S',
            IANA_CODE
        } = req.body;

        const supportKey = req.headers['supportkey'];

        if (!IANA_CODE) {
            return res.send({
                code: 302,
                message: "Please provide the order's timezone to proceed"
            });
        }

        let systemDate = mm.getUTCDateFromTimezone(IANA_CODE);

        mm.executeQueryData(
            `CALL sp_updateCartItem(?,?,?,?,?,?,?)`,
            [
                CUSTOMER_ID || null,
                SERVICE_ID || null,
                INVENTORY_ID || null,
                CART_ID || null,
                CART_ITEM_ID || null,
                QUANTITY || null,
                TYPE
            ],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to update cart information..."
                    });
                }

                const r = result[0][0];

                if (r.code !== 200) {
                    return res.send(r);
                }

                /* -------- MONGO LOG (UNCHANGED) -------- */

                const userData = req.body.authData.data.UserData[0];
                let logdata = {};
                let module = '';

                if (TYPE === 'S') {

                    logdata = {
                        CUSTOMER_ID,
                        LOG_TYPE: 'Cart',
                        ACTION_LOG_TYPE: 'Customer',
                        ACTION_DETAILS: `Customer ${userData.USER_NAME} has updated a cart.`,
                        USER_ID: userData.USER_ID,
                        CART_ID,
                        ORDER_STATUS: "Cart updated",
                        USER_NAME: userData.USER_NAME,
                        DATE_TIME: systemDate,
                        IANA_CODE
                    };

                    module = technicianActionLog;

                } else {

                    logdata = {
                        CUSTOMER_ID,
                        LOG_TYPE: 'Cart',
                        ACTION_LOG_TYPE: 'Customer',
                        ACTION_DETAILS: `Customer ${userData.USER_NAME} has updated a cart.`,
                        USER_ID: userData.USER_ID,
                        CART_ID,
                        ORDER_STATUS: "Cart updated",
                        USER_NAME: userData.USER_NAME,
                        DATE_TIME: systemDate,
                        IANA_CODE
                    };

                    module = shopActionLog;
                }

                dbm.saveLog(logdata, module);

                res.send(r);
            }
        );

    } catch (error) {
        console.log("Error in updateCart :- ", error);
        res.send({
            code: 400,
            message: "Something went wrong, Please try again."
        });
    }
};


exports.updateServiceDetails = (req, res) => {
    try {

        const CART_ID = req.body.CART_ID;
        const SCHEDULE_DATE = req.body.SCHEDULE_DATE;
        const SCHEDULE_START_TIME = req.body.PREFERED_START_TIME;
        const SCHEDULE_END_TIME = req.body.SCHEDULE_END_TIME;
        const EXPECTED_DATE_TIME = req.body.PREFERED_START_TIME;
        const REMARK = req.body.REMARK ? typeof req.body.REMARK === 'string' ? req.body.REMARK : JSON.stringify(req.body.REMARK) : null;
        const IS_EXPRESS = req.body.IS_EXPRESS ? 1 : 0;
        const PRIORITY_MAPPING_ID = req.body.PRIORITY_MAPPING_ID
        const PRIORITY_NAME = req.body.PRIORITY_NAME
        const RESPONSE_TIME = req.body.RESPONSE_TIME
        const ACKNOWLEDGEMENT_TIME = req.body.ACKNOWLEDGEMENT_TIME
        const PREFERED_START_TIME = req.body.PREFERED_START_TIME
        const CUSTOMER_LEVEL_SPOC = req.body.CUSTOMER_LEVEL_SPOC
        const ADDRESS_LEVEL_SPOC = req.body.ADDRESS_LEVEL_SPOC
        const DOCUMENT_NAME = req.body.DOCUMENT_NAME ? req.body.DOCUMENT_NAME : '';
        const SPOC_EMAILS = req.body.SPOC_EMAILS ? req.body.SPOC_EMAILS : '';
        const CUSTOMER_LEVEL_SPOC_EMAILS = req.body.CUSTOMER_LEVEL_SPOC_EMAILS ? req.body.CUSTOMER_LEVEL_SPOC_EMAILS : '';


        var supportKey = req.headers['supportkey'];
        // var systemDate = mm.getSystemDate();
        let IANA_CODE = req.body.IANA_CODE
        if (!IANA_CODE) {
            res.send({
                "code": 302,
                "message": "Please provide the order's timezone to proceed"
            });
            return;
        }
        var systemDate = mm.getUTCDateFromTimezone(IANA_CODE);

        if (CART_ID && SCHEDULE_DATE && SCHEDULE_START_TIME && EXPECTED_DATE_TIME) {
            var Queryz = `call  spUpdateExpressCharge_new(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?); `;
            var qdata = [CART_ID, IS_EXPRESS, SCHEDULE_DATE, SCHEDULE_START_TIME, SCHEDULE_END_TIME, EXPECTED_DATE_TIME, REMARK, DOCUMENT_NAME, PRIORITY_MAPPING_ID, PRIORITY_NAME, RESPONSE_TIME, PREFERED_START_TIME, JSON.stringify(CUSTOMER_LEVEL_SPOC), JSON.stringify(ADDRESS_LEVEL_SPOC), SPOC_EMAILS, CUSTOMER_LEVEL_SPOC_EMAILS, ACKNOWLEDGEMENT_TIME]


            mm.executeQueryData(Queryz, qdata, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to update cart information..."
                    });
                }
                else {
                    const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has updated a cart.`;
                    logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Cart updated", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0, IANA_CODE: IANA_CODE }

                    dbm.saveLog(logdata, technicianActionLog)
                    res.send({
                        "code": 200,
                        "message": "Cart information updated successfully...",
                    });
                }
            });

        } else {
            res.send({
                "code": 200,
                "message": "parameter missing- ID",
            });
        }

    } catch (error) {
        console.log("Error in updateServiceDetails :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}

exports.createOrder = (req, res) => {
    try {

        const {
            Razorpay_ID,
            CUSTOMER_ID,
            CART_ID,
            PAYMENT_METHOD,
            TYPE = 'S',
            DOCUMENT_NAME = '',
            CREATED_FROM = 'W',
            IANA_CODE
        } = req.body;

        const supportKey = req.headers['supportkey'];

        if (!IANA_CODE) {
            return res.send({
                code: 302,
                message: "Please provide the order's timezone to proceed"
            });
        }

        const utcTime = mm.getUTCFromTimezone(IANA_CODE);
        const systemDate = mm.getUTCDateFromTimezone(IANA_CODE);

        mm.executeQueryData(
            `CALL sp_createOrder_master(?,?,?,?,?,?,?,?)`,
            [
                CUSTOMER_ID || null,
                CART_ID || null,
                PAYMENT_METHOD || null,
                TYPE,
                DOCUMENT_NAME,
                CREATED_FROM,
                utcTime,
                Razorpay_ID || null
            ],
            supportKey,
            async (error, result) => {

                if (error) {
                    return res.send({
                        code: 400,
                        message: "Failed to create order..."
                    });
                }

                console.log("Create Order Result:", result);

                // const r = result?.[1]?.[0];
                const insertedOrderId = result?.[0]?.[0]?.NEW_ORDER_ID;
                const r = result?.[1]?.[0];

                if (!r) {
                    return res.send({
                        code: 500,
                        message: "Invalid response from stored procedure"
                    });
                }

                if (r.code !== 200) {
                    return res.send(r);
                }



                const NEW_ORDER_ID = insertedOrderId;

                const TABLE_NAME = r.TABLE_NAME;

                /* -------- Fetch Order Details -------- */

                mm.executeQueryData(
                    `CALL sp_get_order_by_dynamic_table(?, ?)`,
                    [TABLE_NAME, NEW_ORDER_ID],
                    supportKey,
                    (err2, orderData) => {

                        if (err2) {
                            console.log("err2",err2)
                            return res.send({
                                code: 400,
                                message: "Failed to fetch order..."
                            });
                        }

                        const order = orderData?.[0]?.[0];

                        if (!order) {
                            return res.send({
                                code: 400,
                                message: "Order Data not found..."
                            });
                        }

                        addGlobalData(NEW_ORDER_ID, supportKey);

                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,
                            8,
                            "Work Order Created",
                            `Hello Admin, a work order has been created`,
                            "",
                            "TA",
                            supportKey,
                            "O",
                            []
                        );

                        // CC the customer's mapped "Map Service Desk Team" members.
                        mm.getMappedServiceDeskRecipients(NEW_ORDER_ID, supportKey, (recipients) => {
                            mm.sendDynamicEmail(29, NEW_ORDER_ID, supportKey, recipients);
                        });

                        /* Mongo Log */
                        const userData = req.body.authData.data.UserData[0];

                        const logdata = {
                            ORDER_ID: NEW_ORDER_ID,
                            CUSTOMER_ID,
                            LOG_TYPE: 'Order',
                            ACTION_LOG_TYPE: 'Customer',
                            ACTION_DETAILS: `Customer ${order.COMPANY_NAME} has created a work order.`,
                            USER_ID: userData.USER_ID,
                            CART_ID,
                            ORDER_STATUS: "Work order created successfully",
                            USER_NAME: order.COMPANY_NAME,
                            DATE_TIME: systemDate,
                            IANA_CODE
                        };

                        const module =
                            TYPE === 'S'
                                ? technicianActionLog
                                : shopActionLog;

                        dbm.saveLog(logdata, module);

                        res.send({
                            code: 200,
                            message: "Work order created successfully..."
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.log("Error in createOrder :- ", error);
        res.send({
            code: 400,
            message: "Something went wrong, Please try again."
        });
    }
};


function addGlobalData(ORDER_ID, supportKey) {
    try {

        mm.executeQueryData(
            `CALL sp_getOrderGlobalData(?)`,
            [ORDER_ID],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log("Error fetching order data:", error);
                    return;
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const data = resultSets[0][0];

                if (!data || data.code !== 200) {
                    console.log("No data found");
                    return;
                }

                let logData = {
                    ID: ORDER_ID,
                    CATEGORY: "Order",
                    TITLE: data.ORDER_NUMBER,
                    DATA: JSON.stringify({
                        ORDER_NUMBER: data.ORDER_NUMBER,
                        CUSTOMER_NAME: data.CUSTOMER_NAME,
                        MOBILE_NO: data.MOBILE_NO,
                        EMAIL: data.EMAIL,
                        TERRITORY_NAME: data.TERRITORY_NAME,
                        SERVICE_ADDRESS: data.SERVICE_ADDRESS,
                        TERRITORY_ID: data.TERRITORY_ID
                    }),
                    ROUTE: "/order-list",
                    TERRITORY_ID: data.TERRITORY_ID
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

            }
        );

    } catch (error) {
        console.log(error);
    }
}

exports.getSlots = (req, res) => {
    try {

        const { CUSTOMER_ID, TERRITORY_ID } = req.body;
        const supportKey = req.headers['supportkey'];

        mm.executeQueryData(
            `CALL sp_getSlots(?,?)`,
            [
                CUSTOMER_ID || null,
                TERRITORY_ID || null
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to get slots."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const meta = resultSets[0][0];

                /* If validation error */
                if (meta.code !== 200) {
                    return res.send(meta);
                }

                const slotData = resultSets[1] || [];

                if (slotData.length > 0) {
                    return res.send({
                        code: 200,
                        message: "Slots fetched successfully...",
                        data: slotData
                    });
                } else {
                    return res.send({
                        code: 200,
                        message: "No slots available...",
                        data: []
                    });
                }
            }
        );

    } catch (error) {
        console.log("Error in getSlots :- ", error);
        res.send({
            code: 400,
            message: "Something went wrong, Please try again."
        });
    }
};

exports.getCouponList = (req, res) => {
    try {

        const {
            CUSTOMER_ID,
            CART_ID,
            COUNTRY_ID,
            TYPE = 'S'
        } = req.body;

        const supportKey = req.headers['supportkey'];

        mm.executeQueryData(
            `CALL sp_getCouponList(?,?,?,?)`,
            [
                CUSTOMER_ID || null,
                CART_ID || null,
                COUNTRY_ID || null,
                TYPE
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to get coupon list."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const meta = resultSets[0][0];

                if (meta.code !== 200) {
                    return res.send(meta);
                }

                const couponData = resultSets[1] || [];

                if (couponData.length > 0) {
                    return res.send({
                        code: 200,
                        message: "Coupon list fetched successfully...",
                        data: couponData
                    });
                } else {
                    return res.send({
                        code: 200,
                        message: "No coupon available...",
                        data: []
                    });
                }
            }
        );

    } catch (error) {
        console.log("Error in getCouponList :- ", error);
        res.send({
            code: 400,
            message: "Something went wrong, Please try again."
        });
    }
};

exports.applyCoupon = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const COUNTRY_ID = req.body.COUNTRY_ID;
        const CART_ID = req.body.CART_ID;
        const COUPON_CODE = req.body.COUPON_CODE;
        const TYPE = req.body.TYPE ? req.body.TYPE : 'S';
        var supportKey = req.headers['supportkey'];
        // var systemDate = mm.getSystemDate();
        let IANA_CODE = req.body.IANA_CODE
        if (!IANA_CODE) {
            res.send({
                "code": 302,
                "message": "Please provide the order's timezone to proceed"
            });
            return;
        }
        var systemDate = mm.getUTCDateFromTimezone(IANA_CODE);
        if (CUSTOMER_ID && CART_ID && COUPON_CODE && COUNTRY_ID && TYPE) {
            var Queryz = '';
            var qdata = [];

            if (TYPE == 'S') {
                Queryz = `call spValidateCoupon(?,?,?,?)`;
                qdata = [COUPON_CODE, CUSTOMER_ID, CART_ID, COUNTRY_ID];
            } else {
                Queryz = `call spValidateCoupon_shop(?,?,?,?)`;
                qdata = [COUPON_CODE, CUSTOMER_ID, CART_ID, COUNTRY_ID];
            }

            mm.executeQueryData(Queryz, qdata, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to apply coupon..."
                    });
                }
                else {
                    var ACTION_DETAILS = '';
                    var logdata = {};
                    var module = ''
                    if (TYPE == 'S') {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has applied a coupon.`;
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Coupon applied", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0, IANA_CODE: IANA_CODE }
                        module = technicianActionLog
                    } else {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has applied a coupon.`;
                        logdata = { ORDER_ID: 0, CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Coupon applied", TOTAL_AMOUNT: 0, ORDER_NUMBER: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, IANA_CODE: IANA_CODE }
                        module = shopActionLog
                    }

                    dbm.saveLog(logdata, module)
                    if (results && results[0][0].status_code == 200) {
                        res.send({
                            "code": 200,
                            "message": "Coupon applied successfully...",
                        });
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": results[0][0].coupon_status,
                        });
                    }
                }
            });
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing- customerID, cartid, couponCode",
            });
        }
    } catch (error) {
        console.log("Error in applyCoupon :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}

exports.removeCoupon = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const CART_ID = req.body.CART_ID;
        const COUPON_CODE = req.body.COUPON_CODE;
        const TYPE = req.body.TYPE ? req.body.TYPE : 'S';
        var supportKey = req.headers['supportkey'];
        // var systemDate = mm.getSystemDate();
        let IANA_CODE = req.body.IANA_CODE
        if (!IANA_CODE) {
            res.send({
                "code": 302,
                "message": "Please provide the order's timezone to proceed"
            });
            return;
        }
        var systemDate = mm.getUTCDateFromTimezone(IANA_CODE);

        if (CUSTOMER_ID && CART_ID && COUPON_CODE && TYPE) {
            var Queryz = '';
            var qdata = [];

            if (TYPE == 'S') {
                Queryz = `call spCancelCoupon(?,?,?)`;
                qdata = [CUSTOMER_ID, COUPON_CODE, CART_ID];
            } else {
                Queryz = `call spCancelCoupon_shop(?,?,?)`;
                qdata = [CUSTOMER_ID, COUPON_CODE, CART_ID];
            }

            mm.executeQueryData(Queryz, qdata, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to remove coupon..."
                    });
                }
                else {
                    var ACTION_DETAILS = '';
                    var logdata = {};
                    if (TYPE == 'S') {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has removed a coupon.`
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Coupon removed", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0, IANA_CODE: IANA_CODE }
                    } else {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has removed a coupon.`
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Coupon removed", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0, IANA_CODE: IANA_CODE }
                    }

                    dbm.saveLog(logdata, technicianActionLog)
                    res.send({
                        "code": 200,
                        "message": "Coupon removed successfully...",
                    });
                }
            }
            );
        }
        else {
            res.send({
                "code": 400,
                "message": "parameter missing- customerID, cartid",
            });
        }
    }
    catch (error) {
        console.log("Error in removeCoupon :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}

exports.updateAddress = (req, res) => {
    try {

        const {
            CUSTOMER_ID,
            ADDRESS_ID,
            CART_ID,
            NEW_TERRITORY_ID,
            OLD_TERRITORY_ID,
            TYPE,
            IANA_CODE
        } = req.body;

        const supportKey = req.headers['supportkey'];

        if (!IANA_CODE) {
            return res.send({
                code: 302,
                message: "Please provide the order's timezone to proceed"
            });
        }

        const systemDate = mm.getUTCDateFromTimezone(IANA_CODE);

        mm.executeQueryData(
            `CALL sp_updateAddress(?,?,?,?,?,?,?)`,
            [
                CUSTOMER_ID || null,
                ADDRESS_ID || null,
                CART_ID || null,
                NEW_TERRITORY_ID,
                OLD_TERRITORY_ID,
                TYPE || null,
                systemDate
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    return res.send({
                        code: 400,
                        message: "Failed to update address..."
                    });
                }

                const r = results[0][0];

                if (r.code !== 200) {
                    return res.send(r);
                }

                /* ---- Mongo Log (unchanged) ---- */

                const userData = req.body.authData.data.UserData[0];

                const logdata = {
                    CUSTOMER_ID,
                    LOG_TYPE: 'Address',
                    ACTION_LOG_TYPE: 'Customer',
                    ACTION_DETAILS: `Customer ${userData.USER_NAME} has updated an address.`,
                    USER_ID: userData.USER_ID,
                    ORDER_STATUS: "Address updated",
                    USER_NAME: userData.USER_NAME,
                    DATE_TIME: systemDate,
                    IANA_CODE
                };

                dbm.saveLog(logdata, technicianActionLog);

                res.send(r);
            }
        );

    } catch (error) {
        console.log("Error in updateAddress :- ", error);
        res.send({
            code: 400,
            message: "Something went wrong, Please try again."
        });
    }
};

exports.discardCart = (req, res) => {
    try {

        const {
            CUSTOMER_ID,
            CART_ID,
            IANA_CODE
        } = req.body;

        const supportKey = req.headers['supportkey'];

        if (!IANA_CODE) {
            return res.send({
                code: 302,
                message: "Please provide the order's timezone to proceed"
            });
        }

        const systemDate = mm.getUTCDateFromTimezone(IANA_CODE);

        mm.executeQueryData(
            `CALL sp_discardCart(?,?)`,
            [
                CUSTOMER_ID || null,
                CART_ID || null
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    return res.send({
                        code: 400,
                        message: "Failed to discard cart..."
                    });
                }

                const r = results[0][0];

                if (r.code !== 200) {
                    return res.send(r);
                }

                /* -------- Mongo Log (unchanged logic) -------- */

                const userData = req.body.authData.data.UserData[0];
                const TYPE = r.CART_TYPE;

                let logdata = {};
                let module = '';
                let ACTION_DETAILS = '';

                if (TYPE === 'S') {

                    ACTION_DETAILS =
                        `Customer ${userData.USER_NAME} has created an order for a service.`;

                    logdata = {
                        CUSTOMER_ID,
                        LOG_TYPE: 'Order',
                        ACTION_LOG_TYPE: 'Customer',
                        ACTION_DETAILS,
                        USER_ID: userData.USER_ID,
                        CART_ID,
                        ORDER_STATUS: "Work order created successfully",
                        USER_NAME: userData.USER_NAME,
                        DATE_TIME: systemDate,
                        IANA_CODE
                    };

                    module = technicianActionLog;

                } else {

                    ACTION_DETAILS =
                        `Customer ${userData.USER_NAME} has created an order for a shop.`;

                    logdata = {
                        CUSTOMER_ID,
                        LOG_TYPE: 'Order',
                        ACTION_LOG_TYPE: 'Customer',
                        ACTION_DETAILS,
                        USER_ID: userData.USER_ID,
                        CART_ID,
                        ORDER_STATUS: "Work order created successfully",
                        USER_NAME: userData.USER_NAME,
                        DATE_TIME: systemDate,
                        IANA_CODE
                    };

                    module = shopActionLog;
                }

                dbm.saveLog(logdata, module);

                res.send({
                    code: 200,
                    message: r.message
                });
            }
        );

    } catch (error) {
        console.log("Error in discardCart :- ", error);
        res.send({
            code: 400,
            message: "Something went wrong, Please try again."
        });
    }
};
