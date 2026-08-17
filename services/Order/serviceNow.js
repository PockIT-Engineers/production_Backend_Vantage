const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const technicianActionLog = require("../../modules/technicianActionLog")
const dbm = require('../../utilities/dbMongo')
const applicationkey = process.env.APPLICATION_KEY;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


exports.placeOrder = async (req, res) => {
    const connection = await mm.openConnectionAwait();
    const supportKey = req.headers['supportkey'];

    try {
        let {
            CUSTOMER_ID,
            ADDRESS_ID,
            SERVICE_ID,
            TYPE = "S",
            QUANTITY,
            IS_TEMP_CART = 1,
            SERVICE_PHOTO_FILE = null,
            DESCRIPTION = null,
            IANA_CODE,
            SCHEDULE_DATE,
            SCHEDULE_END_TIME = null,
            REMARK,
            PREFERED_START_TIME,
            DOCUMENT_NAME,
            CREATED_FROM,
            CUSTOMER_EMAIL,
            BRAND_NAME = null,
            MODEL_NUMBER = null,
            PRIORITY_MAPPING_ID,
            ADDRESS_LEVEL_SPOC = [],
            CLIENT_SOURCE_TICKET_NUMBER = null,
            GROUP_ID = null
        } = req.body;

        // spValidateAndPrepareOrderData now validates the address/SPOCs against a
        // group of customer IDs via FIND_IN_SET(CUSTOMER_ID, p_GROUP_ID). Accept a
        // client-supplied GROUP_ID (array or comma-separated string); otherwise fall
        // back to the single CUSTOMER_ID so single-customer orders behave as before.
        if (Array.isArray(GROUP_ID)) {
            GROUP_ID = GROUP_ID.filter(Boolean).join(',');
        }
        // FIND_IN_SET compares list items literally, so " 102" never matches 102. Strip
        // whitespace and empty entries, otherwise a customer that IS in the group reads
        // as "address does not belong to the given customer".
        GROUP_ID = String(GROUP_ID || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean)
            .join(',');
        if (!GROUP_ID) {
            GROUP_ID = String(CUSTOMER_ID).trim();
        }

        let systemDate = mm.getUTCDateFromTimezone(IANA_CODE);

        // Required parameter validation (remains in API for immediate response)
        if (!CUSTOMER_ID || !ADDRESS_ID || !SERVICE_ID || !QUANTITY || !PRIORITY_MAPPING_ID || !PREFERED_START_TIME || !IANA_CODE) {
            await mm.rollbackConnectionAwait(connection);
            return res.send({
                code: 400,
                message: "Missing required parameters to place order"
            });
        }

        // ADDRESS_LEVEL_SPOC structure validation (remains in API for immediate response)
        if (!Array.isArray(ADDRESS_LEVEL_SPOC) || ADDRESS_LEVEL_SPOC.length === 0) {
            await mm.rollbackConnectionAwait(connection);
            return res.send({
                code: 400,
                message: "ADDRESS_LEVEL_SPOC is required and must be a non-empty array."
            });
        }

        const addressSpocIds = ADDRESS_LEVEL_SPOC.map(s => s.ID).filter(Boolean);
        if (addressSpocIds.length !== ADDRESS_LEVEL_SPOC.length) {
            await mm.rollbackConnectionAwait(connection);
            return res.send({
                code: 400,
                message: "Invalid ADDRESS_LEVEL_SPOC structure. Each SPOC must contain a valid ID."
            });
        }

        // Call validation stored procedure
        const validationResult = await executeDMLAsync(
            'CALL spValidateAndPrepareOrderData(?,?,?,?,?,?,?)',
            [
                CUSTOMER_ID,
                GROUP_ID,
                CUSTOMER_EMAIL,
                ADDRESS_ID,
                SERVICE_ID,
                PRIORITY_MAPPING_ID,
                JSON.stringify(ADDRESS_LEVEL_SPOC)
            ],
            supportKey,
            connection
        );

        const result = validationResult[0][0];

        // Check if validation failed (non-200 code)
        if (result.result_code !== 200) {
            await mm.rollbackConnectionAwait(connection);
            return res.send({
                code: result.result_code,
                message: result.result_message
            });
        }

        // Extract validated data
        let IS_EXPRESS = result.service_is_express;
        let PRIORITY_NAME = result.sla_priority_name;
        let ACKNOWLEDGEMENT_TIME = result.sla_ack_time;
        let RESPONSE_TIME = result.sla_response_time;
        let STATE_ID = result.address_state_id;
        // customer_spoc_json may come back as null, a JSON string, or an already-parsed array
        // depending on the column type / driver — normalize all three to an array.
        let CUSTOMER_LEVEL_SPOC = result.customer_spoc_json;
        if (typeof CUSTOMER_LEVEL_SPOC === 'string') {
            try {
                CUSTOMER_LEVEL_SPOC = JSON.parse(CUSTOMER_LEVEL_SPOC || '[]');
            } catch (e) {
                CUSTOMER_LEVEL_SPOC = [];
            }
        }
        if (!Array.isArray(CUSTOMER_LEVEL_SPOC)) {
            CUSTOMER_LEVEL_SPOC = [];
        }

        // Prepare SPOC emails
        console.log("result", CUSTOMER_LEVEL_SPOC)
        let SPOC_EMAILS = ADDRESS_LEVEL_SPOC.map(s => s.EMAIL_ID).join(',');
        let CUSTOMER_LEVEL_SPOC_EMAILS = CUSTOMER_LEVEL_SPOC.map(s => s.EMAIL_ID).join(',');
        SPOC_EMAILS = SPOC_EMAILS + (CUSTOMER_LEVEL_SPOC_EMAILS ? ',' + CUSTOMER_LEVEL_SPOC_EMAILS : '');

        /** ---------------- CART CREATION ---------------- */
        const resultsAddCart = await executeDMLAsync(
            'CALL spAddToCart_new(?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                CUSTOMER_ID, SERVICE_ID, 0, QUANTITY, STATE_ID,
                IS_TEMP_CART, BRAND_NAME, MODEL_NUMBER,
                SERVICE_PHOTO_FILE, DESCRIPTION, ADDRESS_ID, DOCUMENT_NAME
            ],
            supportKey,
            connection
        );

        const CART_ID = resultsAddCart[0][0].CART_ID;

        const userData = req.body.authData?.data?.UserData?.[0] ||
            { USER_ID: 0, USER_NAME: 'Service Now' };

        // Mongo Log – Cart Created
        await dbm.saveLog({
            CUSTOMER_ID,
            USER_ID: userData.USER_ID,
            USER_NAME: userData.USER_NAME,
            CART_ID,
            DATE_TIME: systemDate,
            LOG_TYPE: 'Cart',
            ACTION_LOG_TYPE: 'Customer',
            ACTION_DETAILS: `Customer ${userData.USER_NAME} has created a cart.`,
            ORDER_STATUS: TYPE === 'S' ? "Services added to cart" : "Product added to cart",
            TOTAL_AMOUNT: 0,
            IANA_CODE
        }, technicianActionLog);

        /** ---------------- UPDATE CART ---------------- */
        REMARK = REMARK ? (typeof REMARK === 'string' ? REMARK : JSON.stringify(REMARK)) : null;

        await executeDMLAsync(
            'CALL spUpdateExpressCharge_new(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                CART_ID, IS_EXPRESS, PREFERED_START_TIME, PREFERED_START_TIME,
                SCHEDULE_END_TIME, PREFERED_START_TIME, REMARK,
                DOCUMENT_NAME, PRIORITY_MAPPING_ID, PRIORITY_NAME,
                RESPONSE_TIME, PREFERED_START_TIME,
                JSON.stringify(CUSTOMER_LEVEL_SPOC),
                JSON.stringify(ADDRESS_LEVEL_SPOC),
                SPOC_EMAILS, CUSTOMER_LEVEL_SPOC_EMAILS,
                ACKNOWLEDGEMENT_TIME
            ],
            supportKey,
            connection
        );

        // Mongo Log – Cart Updated
        await dbm.saveLog({
            TECHNICIAN_ID: 0,
            VENDOR_ID: 0,
            ORDER_ID: 0,
            JOB_CARD_ID: 0,
            CUSTOMER_ID: 0,
            LOG_TYPE: 'Cart',
            ACTION_LOG_TYPE: 'Customer',
            ACTION_DETAILS: `Customer ${userData.USER_NAME} has updated a cart.`,
            USER_ID: userData.USER_ID,
            CART_ID,
            ORDER_STATUS: "Cart updated",
            USER_NAME: userData.USER_NAME,
            DATE_TIME: systemDate,
            IANA_CODE
        }, technicianActionLog);

        /** ---------------- CREATE ORDER ---------------- */
        const utcDate = mm.getUTCFromTimezone(IANA_CODE);
        CREATED_FROM = CREATED_FROM === "A" ? "A" : "SN";

        const resultsOrder = await executeDMLAsync(
            'CALL spCreateOrder_new(?,?,?,?,?,?,?)',
            [CUSTOMER_ID, CART_ID, "COD", DOCUMENT_NAME, utcDate, CREATED_FROM, CLIENT_SOURCE_TICKET_NUMBER],
            supportKey,
            connection
        );

        const NEW_ORDER_ID = resultsOrder[0][0].NEW_ORDER_ID;

        let resultsCart = await executeDMLAsync(
            'CALL sp_get_order_master_by_id(?)',
            [NEW_ORDER_ID],
            supportKey,
            connection
        );
        resultsCart = resultsCart[0];

        // Notifications + Email (remain in API)
        mm.sendNotificationToAdmin(userData.USER_ID,
            8,
            "Work Order Created",
            `Hello Admin, a work order has been created by ${resultsCart[0].COMPANY_NAME}, kindly take action over it`,
            "",
            "TA",
            supportKey,
            "O",
            []
        );

        /* Everyone mapped to this customer under "Map Service Desk Team" is CC'd on the
           work order created mail, the same audience the cancellation mails use. The
           customer stays on TO; the mail still goes out if the lookup finds nobody. */
        mm.getMappedServiceDeskRecipients(NEW_ORDER_ID, supportKey, (recipients) => {
            mm.sendDynamicEmail(29, NEW_ORDER_ID, supportKey, recipients);
        });
        addGlobalData(NEW_ORDER_ID, supportKey);

        let fromOrder = CREATED_FROM == "A" ?
            `${req.body.authData.data.UserData[0].NAME} has created a work order for ${resultsCart[0].COMPANY_NAME}` :
            `Customer ${resultsCart[0].COMPANY_NAME} has created a work order from service now.`;

        // Mongo Log – Order Created
        await dbm.saveLog({
            ORDER_ID: NEW_ORDER_ID,
            CUSTOMER_ID,
            LOG_TYPE: 'Order',
            ACTION_LOG_TYPE: 'Customer',
            ACTION_DETAILS: fromOrder,
            USER_ID: userData.USER_ID,
            CART_ID,
            ORDER_STATUS: "Work order created successfully",
            USER_NAME: resultsCart[0].COMPANY_NAME,
            DATE_TIME: systemDate,
            IANA_CODE
        }, technicianActionLog);

        await mm.commitConnectionAwait(connection);

        return res.send({
            code: 200,
            message: "Work order created successfully...",
            orderDetails: {
                ORDER_ID: NEW_ORDER_ID,
                ORDER_NUMBER: resultsCart[0].ORDER_NUMBER,
                CUSTOMER_ID,
                ACTION_DETAILS: fromOrder,
                USER_NAME: resultsCart[0].COMPANY_NAME
            }
        });

    } catch (error) {
        console.error(error);
        await mm.rollbackConnectionAwait(connection);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);

        return res.send({
            code: 500,
            message: "Something went wrong. Please try again."
        });
    }
};



const executeDMLAsync = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};



function addGlobalData(ORDER_ID, supportKey) {

    try {

        mm.executeQueryData(
            `CALL sp_get_order_global_data(?)`,
            [ORDER_ID],
            supportKey,
            (error, results) => {

                if (error) {

                    console.log(`Error to find work order data`, error);

                }
                else {

                    console.log("data retrieved");

                    const resultSets = results.filter(r => Array.isArray(r));
                    const results5 = resultSets[0] || [];

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

                        console.log("no data found");

                    }
                }
            }
        );

    } catch (error) {

        console.log(error);

    }

}


function generateToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,   // keep this secure
        { expiresIn: '24h' }       // ✅ 24 hours validity
    );

    return token;
}


exports.generateToken = async (req, res) => {

    let { client_email, client_password } = req.body;

    // client_password = md5(client_password);
    // client_password = await mm.hashPassword(client_password);

    try {

        mm.executeQueryData(
            `CALL sp_user_generateToken(?,?)`,
            [client_email, client_password],
            req.headers['supportkey'],
            async(err, results) => {

                if (err) {

                    console.error('Database error:', err);

                    return res.status(500).json({
                        success: false,
                        message: 'Internal server error'
                    });

                }

                const resultSets = results.filter(r => Array.isArray(r));
                const user = resultSets[0] || [];
                console.log("client_password",client_password)
                console.log("client_password",user[0].PASSWORD)
                const isMatch = await bcrypt.compare(client_password,user[0].PASSWORD);
                console.log("isMatch",isMatch)

                if (!isMatch) {

                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials'
                    });

                }

                /* ---------- TOKEN GENERATION ---------- */

                const token = generateToken(user);

                res.json({
                    success: true,
                    token: token,
                    expiresIn: 30
                });

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

    }

};




