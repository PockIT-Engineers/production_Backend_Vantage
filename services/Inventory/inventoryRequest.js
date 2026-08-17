const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var inventoryRequest = "inventory_request_master";
var viewInventoryRequest = "view_" + inventoryRequest;
const technicianActionLog = require("../../modules/technicianActionLog")
const dbm = require('../../utilities/dbMongo');
const async = require('async');
const crypto = require('crypto');
var supportKey = "supportKey";


// HTML Templates for Email Responses
const alreadyApprovedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Request Already Approved</title>
<style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f4f6f9;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      text-align: center;
    }
    .card h2 {
      color: #28a745;
      margin-bottom: 10px;
    }
    .card p {
      color: #555;
      font-size: 14px;
      margin-bottom: 20px;
    }
</style>
</head>
<body>
  <div class="card">
    <span style="font-size: 40px;">✅</span>
    <h2>Already Approved</h2>
    <p>This request has already been approved.</p>
    <p>No further action is required.</p>
  </div>
</body>
</html>`;

const alreadyRejectedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Request Rejected</title>
<style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #fef2f2;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      text-align: center;
    }
    .card h2 {
      color: #dc3545;
      margin-bottom: 10px;
    }
    .card p {
      color: #555;
      font-size: 14px;
      margin-bottom: 20px;
    }
</style>
</head>
<body>
  <div class="card">
    <span style="font-size: 40px;">❌</span>
    <h2>Request Rejected</h2>
    <p>This request was already rejected.</p>
    <p>No further action is required.</p>
  </div>
</body>
</html>`;

const missingFields = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Request Cannot Be Processed</title>
<style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #fff8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 420px;
      text-align: center;
    }
    .card h2 {
      color: #ff6b35;
      margin-bottom: 10px;
    }
    .card p {
      color: #444;
      font-size: 14px;
      margin-bottom: 12px;
    }
</style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
    <h2>Action Not Allowed</h2>
    <p><strong>This request cannot be processed. Please contact to support team at servicedesk@ovationwps.com</strong></p>
  </div>
</body>
</html>`;

function reqData(req) {
    var data = {
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        TOTAL_RATE: req.body.TOTAL_RATE ? req.body.TOTAL_RATE : 0,
        TOTAL_TAX_RATE: req.body.TOTAL_TAX_RATE ? req.body.TOTAL_TAX_RATE : 0,
        REQUESTED_DATE_TIME: req.body.REQUESTED_DATE_TIME,
        PAYMENT_STATUS: req.body.PAYMENT_STATUS,
        STATUS: req.body.STATUS ? '1' : '0',
        REMARK: req.body.REMARK,
        CLIENT_ID: req.body.CLIENT_ID,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        VERIFICATION_DATE: req.body.VERIFICATION_DATE,
        TOTAL_ITEMS: req.body.TOTAL_ITEMS ? req.body.TOTAL_ITEMS : 0,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0
    }
    return data;
}


exports.validate = function () {
    return [
        body('JOB_CARD_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('QUANTITY').isInt().optional(),
        body('RATE').isDecimal().optional(),
        body('TAX_RATE').isDecimal().optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('REQUESTED_DATE_TIME').optional(),
        body('STATUS').optional(),
        body('REMARK').optional(),
        body('INVENTORY_ID').isInt().optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
    var supportKey = req.headers['supportkey'];

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
                setContext + `CALL sp_inventoryRequest_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 200,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.status(400).json({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }

    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    data.STATUS = "AP"
    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(
                `CALL sp_inventoryRequest_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.JOB_CARD_ID,
                    data.TECHNICIAN_ID,
                    data.CUSTOMER_ID,
                    data.TOTAL_RATE,
                    data.TOTAL_TAX_RATE,
                    data.REQUESTED_DATE_TIME,
                    data.PAYMENT_STATUS,
                    data.STATUS,
                    data.REMARK,
                    data.CLIENT_ID,
                    data.PAYMENT_MODE,
                    data.VERIFICATION_DATE,
                    data.TOTAL_ITEMS,
                    data.TOTAL_AMOUNT
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error)
                        return res.status(400).json({
                            code: 400,
                            message: "Failed to save inventoryRequest information"
                        });
                    }

                    res.status(200).json({
                        code: 200,
                        insertId: results[0][0].INSERT_ID,
                        message: "InventoryRequest saved successfully"
                    });
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something went wrong."
            });
        }
    }
}

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
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(
                `CALL sp_inventoryRequest_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    req.body.ID,
                    data.JOB_CARD_ID,
                    data.TECHNICIAN_ID,
                    data.CUSTOMER_ID,
                    data.TOTAL_RATE,
                    data.TOTAL_TAX_RATE,
                    data.REQUESTED_DATE_TIME,
                    data.PAYMENT_STATUS,
                    data.STATUS,
                    data.REMARK,
                    data.CLIENT_ID,
                    data.PAYMENT_MODE,
                    data.VERIFICATION_DATE,
                    data.TOTAL_ITEMS,
                    data.TOTAL_AMOUNT
                ],
                supportKey,
                (error) => {
                    if (error) {
                        return res.status(400).json({
                            code: 400,
                            message: "Failed to update inventoryRequest information"
                        });
                    }

                    res.status(200).json({
                        code: 200,
                        message: "InventoryRequest updated successfully"
                    });
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something went wrong."
            });
        }
    }
}


// HTML templates
const invalidTokenHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Invalid Request</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <h1 class="error">Invalid Request</h1>
    <p>This link is invalid or has expired.</p>
</body>
</html>`;


// Token management functions
async function storeTemporaryToken(token, requestMasterId, requestData, actionType) {
    console.log(`[storeTemporaryToken] Attempting to store token: ${token} for requestMasterId: ${requestMasterId}, actionType: ${actionType}`);
    const connection = mm.openConnection();
    try {
        console.log("[storeTemporaryToken] Connection opened for storing token.");
        await new Promise((resolve, reject) => {
            console.log("[storeTemporaryToken] Executing DML to insert token into inventory_request_tokens.");
            mm.executeDML(
                `CALL sp_inventoryRequest_storeTemporaryToken(?, ?, ?, ?, ?)`,
                [token, requestMasterId, JSON.stringify(requestData), actionType, new Date(requestData.expiresAt)],
                "supportKey",
                connection,
                (error, results) => {
                    if (error) {
                        console.error("[storeTemporaryToken] Error during DML execution for token insert:", error);
                        reject(error);
                    }
                    else {
                        console.log("[storeTemporaryToken] Token DML execution successful.");
                        resolve(results[0]);
                    }
                }
            );
        });
        mm.commitConnection(connection);
        console.log("[storeTemporaryToken] Transaction committed for token storage.");
    } catch (error) {
        console.error(`[storeTemporaryToken] Error storing temporary token for ${requestMasterId}:`, error);
        mm.rollbackConnection(connection);
        console.log("[storeTemporaryToken] Transaction rolled back due to error.");
        console.log(error);
        throw error;
    }
}

async function getAndValidateToken(token, requestMasterId, markAsUsed = false) {
    console.log(`[getAndValidateToken] Attempting to get and validate token: ${token} for requestMasterId: ${requestMasterId}`);
    const connection = mm.openConnection();
    try {
        console.log("[getAndValidateToken] Connection opened for token validation.");
        // Expire old tokens
        console.log("[getAndValidateToken] Expiring old tokens...");
        var result = await new Promise((resolve, reject) => {
            mm.executeDML(
                `CALL sp_inventoryRequest_getAndValidateToken(?, ?)`,
                [token, markAsUsed == true ? 1 : 0],
                "supportKey",
                connection,
                (error, results) => {
                    if (error) return reject(error);
                    console.log("[getAndValidateToken] Old tokens expiration DML successful.");
                    resolve(results);
                }
            );
        });

        if (result[0][0].code == 201) {
            console.log("[getAndValidateToken] Token not found, expired, or already used.");
            mm.commitConnection(connection);
            return null;
        }
        else {
            mm.commitConnection(connection);
            const requestData = result[0][0].request_data;
            console.log("[getAndValidateToken] Parsed request data from token:", requestData);

            return {
                ...requestData,
                STATUS: result[0][0].action_type === 'approve' ? 'A' : 'R'
            };
        }


    } catch (error) {
        mm.rollbackConnection(connection);
        console.error("[getAndValidateToken] Error:", error);
        throw error;
    }
}


// New token processing endpoint

exports.processTokenRequest = async (req, res) => {
    console.log("[processTokenRequest] Entering processTokenRequest endpoint.");
    const token = req.query.token;
    const requestMasterId = req.query.requestMasterId;
    console.log(`[processTokenRequest] Received token: ${token}, requestMasterId: ${requestMasterId}`);

    try {
        console.log("[processTokenRequest] Calling getAndValidateToken...");
        // const requestData = await getAndValidateToken(token, requestMasterId);
        const requestData = await getAndValidateToken(token, requestMasterId, false); // don't mark as used here

        if (!requestData) {
            console.log("[processTokenRequest] Token not valid. Checking request status to send proper response...");

            const statusCheck = await checkRequestStatus(requestMasterId, supportKey, mm.openConnection());

            if (statusCheck === 'AC') {
                console.log("[processTokenRequest] Request already approved.");
                return res.setHeader('Content-Type', 'text/html').send(alreadyApprovedHTML);
            }

            if (statusCheck === 'R') {
                console.log("[processTokenRequest] Request already rejected.");
                return res.setHeader('Content-Type', 'text/html').send(alreadyRejectedHTML);
            }

            console.log("[processTokenRequest] Token invalid and request not completed. Sending missingFieldsHTML.");
            return res.setHeader('Content-Type', 'text/html').send(missingFields);
        }


        console.log("[processTokenRequest] Token validated successfully. Preparing manual-submit form.");

        const actionLabel = requestData.STATUS === 'A' ? 'Approve' : 'Reject';
        const actionColor = requestData.STATUS === 'A' ? '#28a745' : '#dc3545';

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Confirm ${actionLabel} Request</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #f4f6f9;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    .card {
                        background: #fff;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 0 12px rgba(0, 0, 0, 0.15);
                        text-align: center;
                    }
                    .btn {
                        padding: 12px 24px;
                        background: ${actionColor};
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="card" style="padding-top:25px;">
                    <h2 style="font-weight:500">Click below to <b> ${actionLabel} </b>the part request</h2>
                    <form id="requestForm" action="/inventoryRequest/updateRequestStatusEmail?token=${token}&requestMasterId=${requestMasterId}" method="POST">
                        <input type="hidden" name="TECHNICIAN_ID" value="${requestData.TECHNICIAN_ID}">
                        <input type="hidden" name="JOB_CARD_ID" value="${requestData.JOB_CARD_ID}">
                        <input type="hidden" name="CUSTOMER_ID" value="${requestData.CUSTOMER_ID}">
                        <input type="hidden" name="REQUEST_MASTER_ID" value="${requestData.REQUEST_MASTER_ID}">
                        <input type="hidden" name="TECHNICIAN_NAME" value="${requestData.TECHNICIAN_NAME}">
                        <input type="hidden" name="JOB_CARD_NO" value="${requestData.JOB_CARD_NO}">
                        <input type="hidden" name="STATUS" value="${requestData.STATUS}">
                        <input type="hidden" name="ACTION_TAKEN_FROM_MAIL" value="1">
                        <input type="hidden" name="INVENTORY_IDS" value='${JSON.stringify(requestData.INVENTORY_IDS)}'>
                        <input type="hidden" name="IDS" value='${JSON.stringify(requestData.IDS)}'>
                        <button type="submit" class="btn">${actionLabel} Request</button>
                    </form>
                </div>
            </body>
            </html>
        `);
        console.log("[processTokenRequest] Form with button sent to client.");
    } catch (error) {
        console.error('[processTokenRequest] Error processing request token:', error);
        res.status(500).send('Internal server error');
    }
};


// Updated updateRequestStatusEmail function
exports.updateRequestStatusEmail = async (req, res) => {
    console.log("[updateRequestStatusEmail] Entering updateRequestStatusEmail endpoint.");
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const SECRET_KEY = process.env.REQUEST_SECRET_KEY;
    console.log(`[updateRequestStatusEmail] Received supportKey: ${supportKey}, SECRET_KEY: ${SECRET_KEY}`, req.body);

    let requestBody = req.body;
    let isFromEmail = false;

    // Process token-based requests
    if (req.query.token) {
        console.log("[updateRequestStatusEmail] Processing token-based request.");
        try {
            // After fixing the URL construction to use '&', req.query.token will be the clean token itself.
            // And req.query.requestMasterId will be directly available.
            const cleanToken = req.query.token;
            const requestMasterIdFromQuery = req.query.requestMasterId; // Correctly extract from query params

            console.log(`[updateRequestStatusEmail] Token found in query. cleanToken: ${cleanToken}, requestMasterIdFromQuery: ${requestMasterIdFromQuery}`);
            // const tokenData = await getAndValidateToken(cleanToken, requestMasterIdFromQuery); // Pass directly
            const tokenData = await getAndValidateToken(cleanToken, requestMasterIdFromQuery, true);
            if (!tokenData) {
                console.log("[updateRequestStatusEmail] Token is expired or already used. Checking if request already processed...");
                const statusCheck = await checkRequestStatus(requestMasterIdFromQuery, supportKey, mm.openConnection());

                if (statusCheck === 'AC') {
                    console.log("[updateRequestStatusEmail] Request already approved (from fallback).");
                    return res.setHeader('Content-Type', 'text/html').send(alreadyApprovedHTML);
                }

                if (statusCheck === 'R') {
                    console.log("[updateRequestStatusEmail] Request already rejected (from fallback).");
                    return res.setHeader('Content-Type', 'text/html').send(alreadyRejectedHTML);
                }

                console.log("[updateRequestStatusEmail] Token not usable and request not processed. Sending missingFieldsHTML.");
                return res.setHeader('Content-Type', 'text/html').send(missingFields);
            }
            // Proceed with request normally
            requestBody = tokenData;
            isFromEmail = true;

            let connection = null;
            console.log("[updateRequestStatusEmail] Checking if request is already processed...");
            const statusCheck = await checkRequestStatus(requestMasterIdFromQuery, supportKey, connection);

            if (statusCheck === 'AC') {
                console.log("[updateRequestStatusEmail] Request already approved.");
                return res.setHeader('Content-Type', 'text/html').send(alreadyApprovedHTML);
            }

            if (statusCheck === 'R') {
                console.log("[updateRequestStatusEmail] Request already rejected.");
                return res.setHeader('Content-Type', 'text/html').send(alreadyRejectedHTML);
            }

            console.log("[updateRequestStatusEmail] Token-based request data processed:", requestBody);
        } catch (error) {
            console.error("[updateRequestStatusEmail] Error processing token:", error);
            return handleEmailErrorResponse(res, 'Invalid request token');
        }
    }
    // Process encoded payload if coming from email
    else if (req.body.payload) {
        console.log("[updateRequestStatusEmail] Processing encoded payload from email.");
        try {
            // Decode the payload
            const decoded = Buffer.from(req.body.payload, 'base64').toString('utf8');
            const { data, signature } = JSON.parse(decoded);
            console.log("[updateRequestStatusEmail] Payload decoded. Verifying signature.");

            // Verify the signature
            const hmac = crypto.createHmac('sha256', SECRET_KEY);
            hmac.update(data);
            const expectedSignature = hmac.digest('hex');

            if (signature !== expectedSignature) {
                console.log("[updateRequestStatusEmail] Invalid request signature.");
                return handleEmailErrorResponse(res, 'Invalid request signature');
            }
            console.log("[updateRequestStatusEmail] Signature verified. Parsing data and checking expiration.");

            // Parse the data and check expiration
            requestBody = JSON.parse(data);
            const now = new Date();
            const expiresAt = new Date(requestBody.expiresAt);

            if (now > expiresAt) {
                console.log("[updateRequestStatusEmail] Request has expired.");
                return handleEmailErrorResponse(res, 'This request has expired');
            }

            isFromEmail = true;
            requestBody.ACTION_TAKEN_FROM_MAIL = '1';

            console.log("[updateRequestStatusEmail] Requested from email with decoded payload:", requestBody);

        } catch (error) {
            console.error("[updateRequestStatusEmail] Error processing encoded payload:", error);
            return handleEmailErrorResponse(res, 'Invalid payload format');
        }
    } else {
        console.log("[updateRequestStatusEmail] Direct API call (not from email).");
    }

    // Parse and validate arrays
    let inventoryIDs, IDS;
    try {
        console.log("[updateRequestStatusEmail] Parsing INVENTORY_IDS and IDS fields.");
        inventoryIDs = parseArrayField(requestBody.INVENTORY_IDS, 'INVENTORY_IDS');
        IDS = parseArrayField(requestBody.IDS, 'IDS');
        console.log("[updateRequestStatusEmail] Parsed INVENTORY_IDS:", inventoryIDs);
        console.log("[updateRequestStatusEmail] Parsed IDS:", IDS);
    } catch (e) {
        console.error(`[updateRequestStatusEmail] Error parsing array fields: ${e.message}`);
        return isFromEmail ?
            handleEmailErrorResponse(res, e.message) :
            res.status(400).send({ code: 400, message: e.message });
    }

    const ACTION_TAKEN_FROM_MAIL = requestBody.ACTION_TAKEN_FROM_MAIL === '1';

    console.log("\nPROCESSING REQUEST:", {
        REQUEST_MASTER_ID: requestBody.REQUEST_MASTER_ID,
        SOURCE: isFromEmail ? 'EMAIL' : 'DIRECT_API',
        ACTION: requestBody.STATUS === 'A' ? 'APPROVE' : 'REJECT'
    });

    const {
        TECHNICIAN_ID,
        JOB_CARD_ID,
        CUSTOMER_ID,
        STATUS,
        ORDER_ID,
        TECHNICIAN_NAME,
        JOB_CARD_NO,
        REQUEST_MASTER_ID
    } = requestBody;

    // Validate required fields
    console.log("[updateRequestStatusEmail] Validating required fields...");
    // if (!TECHNICIAN_ID || !JOB_CARD_ID || !STATUS || !CUSTOMER_ID || !IDS || IDS.length === 0 || !inventoryIDs || inventoryIDs.length === 0) {
    if (!TECHNICIAN_ID || !JOB_CARD_ID || !STATUS || !CUSTOMER_ID || !Array.isArray(IDS) || IDS.length === 0 || !Array.isArray(inventoryIDs) || inventoryIDs.length === 0) {

        console.log("[updateRequestStatusEmail] Missing required fields.");
        if (ACTION_TAKEN_FROM_MAIL) {
            return res.setHeader('Content-Type', 'text/html').send(missingFields); // Assuming missingFields is defined elsewhere
        }
        return res.send({
            code: 300,
            message: `Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, CUSTOMER_ID, IDS, INVENTORY_IDS`
        });
    }
    console.log("[updateRequestStatusEmail] Required fields present.");

    if (!errors.isEmpty()) {
        console.log("[updateRequestStatusEmail] Validation errors:", errors);
        return res.send({ code: 422, message: errors.errors });
    }

    const connection = mm.openConnection();
    let loggarry = [];

    console.log("[updateRequestStatusEmail] Database connection opened. System date:", mm.getSystemDate());

    try {

        console.log(`[updateRequestStatusEmail] Fetching job card details for ID: ${JOB_CARD_ID}`);
        const jobCard1 = await executeQuery(
            'CALL sp_jobCard_getById(?)',
            [JOB_CARD_ID],
            supportKey,
            connection
        );
        const jobCard = jobCard1[0]

        if (!jobCard || jobCard.length === 0) {
            // console.log("[updateRequestStatusEmail] Job card not found.");
            mm.rollbackConnection(connection);
            return handleErrorResponse(res, isFromEmail, "work order not found");
        }
        // console.log("[updateRequestStatusEmail] Job card found:", jobCard[0]);

        const systemDate = mm.getUTCDateFromTimezone(jobCard[0].IANA_CODE);
        // Check if request is already processed (for email requests)
        if (ACTION_TAKEN_FROM_MAIL) {
            console.log("[updateRequestStatusEmail] Checking if email request is already processed...");
            const statusCheck = await checkRequestStatus(REQUEST_MASTER_ID, supportKey, connection);
            if (statusCheck) {
                console.log(`[updateRequestStatusEmail] Request already processed with status: ${statusCheck}.`);
                mm.commitConnection(connection);
                res.setHeader('Content-Type', 'text/html');
                return res.send(statusCheck === 'AC' ? alreadyApprovedHTML : alreadyRejectedHTML); // Assuming these HTMLs are defined elsewhere
            }
            console.log("[updateRequestStatusEmail] Request not yet processed, proceeding.");
        }

        // Determine status code
        let STATUSZ;
        if (STATUS === "A") {
            STATUSZ = "AC";
        } else if (STATUS === "R") {
            STATUSZ = "R";
        } else if (STATUS === "AP") {
            STATUSZ = "AP";
        } else {
            console.log("[updateRequestStatusEmail] Invalid STATUS value provided:", STATUS);
            mm.commitConnection(connection);
            return res.send({ code: 400, message: "Invalid STATUS value." });
        }
        console.log("[updateRequestStatusEmail] Determined internal STATUSZ:", STATUSZ);

        // Update job card and inventory details

        // console.log(`[updateRequestStatusEmail] Updating job card INVENTORY_REQUESTED status for ID: ${JOB_CARD_ID}`);
        await executeDML(
            `CALL sp_inventoryRequest_updateStatus(?,?,?)`,
            [
                JOB_CARD_ID,
                STATUSZ,
                REQUEST_MASTER_ID
            ],
            supportKey,
            connection
        );
        // console.log("[updateRequestStatusEmail] Job card INVENTORY_REQUESTED status updated.");

        // Process each inventory item
        // console.log("[updateRequestStatusEmail] Processing each inventory item...");
        for (const id of IDS) {
            console.log(`[updateRequestStatusEmail] Updating inventory detail for ID: ${id}`);
            await updateInventoryDetail(
                id, STATUSZ, systemDate, CUSTOMER_ID, TECHNICIAN_ID,
                JOB_CARD_ID, REQUEST_MASTER_ID, supportKey, connection
            );
            console.log(`[updateRequestStatusEmail] Inventory detail ${id} updated.`);

            if (STATUS === 'A' || STATUS === 'AP') {
                console.log(`[updateRequestStatusEmail] Processing approval for inventory item ID: ${id}`);
                await processInventoryApproval(
                    id, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID,
                    REQUEST_MASTER_ID, JOB_CARD_NO, supportKey, connection
                );
                console.log(`[updateRequestStatusEmail] Inventory item ${id} approval processed.`);
            }

            const actionDetails = `${jobCard[0].COMPANY_NAME} has ${getActionVerb(STATUS)} the inventory request for work order ${JOB_CARD_NO}`;
            console.log(`[updateRequestStatusEmail] Logging action details for item ${id}: ${actionDetails}`);
            loggarry.push(createLogData(
                TECHNICIAN_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID,
                TECHNICIAN_NAME, jobCard[0].COMPANY_NAME,
                mm.getUTCDateFromTimezone(jobCard[0].IANA_CODE), STATUS, actionDetails, jobCard[0].IANA_CODE
            ));
        }
        console.log("[updateRequestStatusEmail] All inventory items processed.");

        // Update master record and send notifications
        console.log("[updateRequestStatusEmail] Updating master record.");
        await updateMasterRecord(
            TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID, REQUEST_MASTER_ID,
            STATUSZ, systemDate, supportKey, connection
        );
        console.log("[updateRequestStatusEmail] Master record updated.");

        const actionMessage = `${jobCard[0].CUSTOMER_NAME} has ${getActionVerb(STATUS)} the inventory request for work order ${JOB_CARD_NO}`;
        console.log("[updateRequestStatusEmail] Sending notifications to admin and technician.");

        mm.sendNotificationToAdmin(1,
            8,
            `Inventory Request ${getActionStatus(STATUS)}`,
            actionMessage,
            "", "J", supportKey, "I", []
        );

        mm.sendNotificationToSPOCChannel(1, ORDER_ID, `Inventory Request ${getActionStatus(STATUS)}`, actionMessage, "", "J", supportKey, "IR", "I", []);
        console.log("[updateRequestStatusEmail] Notification sent to admin.");

        let notificationData = {
            CUSTOMER_ID: jobCard[0].CUSTOMER_ID,
            TECHNICIAN_ID: TECHNICIAN_ID,
            ORDER_ID: ORDER_ID,
            ORDER_STATUS: jobCard[0].ORDER_STATUS || '',
            JOB_CARD_ID: JOB_CARD_ID,
            NOTIFICATION_TYPE: 'Inventory Request ' + getActionStatus(STATUS),
        }
        mm.sendNotificationToTechnician(
            jobCard[0].CUSTOMER_ID, 
            
            TECHNICIAN_ID,
            `Inventory Request ${getActionStatus(STATUS)}`,
            actionMessage,
            "", "J", supportKey, "N", "J", notificationData
        );
        console.log("[updateRequestStatusEmail] Notification sent to technician.");
        mm.sendDynamicEmail(64, REQUEST_MASTER_ID, supportKey)//technicianemail

        dbm.saveLog(loggarry, technicianActionLog); // Assuming technicianActionLog is defined
        console.log("[updateRequestStatusEmail] Logs saved to technicianActionLog.");
        mm.commitConnection(connection);
        console.log("[updateRequestStatusEmail] Transaction committed for updateRequestStatusEmail.");

        if (isFromEmail) {
            console.log("[updateRequestStatusEmail] Responding with HTML for email request success.");
            res.setHeader('Content-Type', 'text/html');
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Request ${getActionStatus(STATUS)}</title>
                    <style>
                        body {
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: #fef2f2;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        }
                        .card {
                        background: #fff;
                        padding: 30px 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        text-align: center;
                        }
                        .card h2 {
                        color: #dc3545;
                        margin-bottom: 10px;
                        }
                        .card p {
                        color: #555;
                        font-size: 14px;
                        margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <span style="font-size: 40px;">${STATUS === 'A' ? '✅' : '❌'}</span>
                        <h2>Request ${getActionStatus(STATUS)}</h2>
                        <p>Part request has been ${getActionVerb(STATUS)} successfully.</p>
                    </div>
                </body>
                </html>
            `);
        }

        console.log("[updateRequestStatusEmail] Responding with JSON for direct API call success.");
        // return res.status(200).send({ code: 200, message: "Inventory request updated." });
        res.setHeader('Content-Type', 'text/html');

        return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Request ${STATUS === 'A' ? 'Approved' : 'Rejected'}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f6f9;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .card {
          background: #fff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.15);
          text-align: center;
        }
        .card h2 {
          color: ${STATUS === 'A' ? '#28a745' : '#dc3545'};
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Inventory Request ${STATUS === 'A' ? 'Approved' : 'Rejected'}</h2>
        <p>The inventory request for work order <strong>${JOB_CARD_NO}</strong> has been successfully ${STATUS === 'A' ? 'approved' : 'rejected'}.</p>
      </div>
    </body>
    </html>
  `);


    } catch (error) {
        console.error("[updateRequestStatusEmail] Caught an unexpected error:", error);
        if (connection) {
            mm.rollbackConnection(connection);
            console.log("[updateRequestStatusEmail] Transaction rolled back due to unexpected error.");
        }

        if (isFromEmail) {
            return handleEmailErrorResponse(res, 'An error occurred processing your request');
        }
        return res.status(500).send({ code: 500, message: "An unexpected error occurred." });
    }
};

// Updated sendRequestEmail function
async function sendRequestEmail(
    TYPE,
    EMAIL_LIST,
    CUSTOMER_NAME,
    JOB_CARD_NO,
    INVENTORY_DATA = [],
    TECHNICIAN_NAME = '',
    TECHNICIAN_ID = '',
    JOB_CARD_ID = '',
    CUSTOMER_ID = '',
    REQUEST_MASTER_ID = '',
    INVENTORY_IDS = []
) {
    console.log("[sendRequestEmail] Entering sendRequestEmail function.");
    console.log(`[sendRequestEmail] Parameters: TYPE=${TYPE}, EMAIL_LIST=${EMAIL_LIST}, CUSTOMER_NAME=${CUSTOMER_NAME}, JOB_CARD_NO=${JOB_CARD_NO}, TECHNICIAN_NAME=${TECHNICIAN_NAME}, REQUEST_MASTER_ID=${REQUEST_MASTER_ID}`);

    // 1. Prepare the request data
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours expiration
    console.log("[sendRequestEmail] Token expiration set to:", expiresAt.toLocaleString());

    // Get inventory detail IDs
    let IDS = [];
    try {
        console.log(`[sendRequestEmail] Fetching inventory detail IDs for REQUEST_MASTER_ID: ${REQUEST_MASTER_ID}`);
        const detailsResults = await new Promise((resolve, reject) => {
            mm.executeQueryData(
                `CALL sp_inventoryRequest_getPendingIds(?)`,
                [REQUEST_MASTER_ID],
                "supportKey",
                (error, results) => {
                    if (error) {
                        console.error("[sendRequestEmail] Error during inventory detail IDs query:", error);
                        reject(error);
                    }
                    else {
                        console.log("[sendRequestEmail] Inventory detail IDs query successful.");
                        resolve(results);
                    }
                }
            );
        });
        IDS = detailsResults[0].map(item => item.ID);
        console.log("[sendRequestEmail] Fetched inventory detail IDS:", IDS);
    } catch (error) {
        console.error("[sendRequestEmail] Error fetching inventory detail IDs:", error);
    }

    const requestData = {
        TECHNICIAN_ID,
        JOB_CARD_ID,
        CUSTOMER_ID,
        JOB_CARD_NO,
        REQUEST_MASTER_ID,
        TECHNICIAN_NAME,
        INVENTORY_IDS: Array.isArray(INVENTORY_IDS) ? INVENTORY_IDS : [],
        IDS: Array.isArray(IDS) ? IDS : [],
        expiresAt: expiresAt.toISOString()
    };
    console.log("[sendRequestEmail] Prepared request data for token generation:", requestData);

    // 2. Generate and store tokens
    console.log("[sendRequestEmail] Generating and storing approve/reject tokens.");
    const approveToken = crypto.randomBytes(16).toString('hex');
    const rejectToken = crypto.randomBytes(16).toString('hex');
    console.log(`[sendRequestEmail] Approve Token: ${approveToken}, Reject Token: ${rejectToken}`);


    await storeTemporaryToken(approveToken, REQUEST_MASTER_ID, requestData, 'approve');
    console.log("[sendRequestEmail] Approve token stored successfully.");
    await storeTemporaryToken(rejectToken, REQUEST_MASTER_ID, requestData, 'reject');
    console.log("[sendRequestEmail] Reject token stored successfully.");

    // 3. Generate email content
    console.log("[sendRequestEmail] Generating inventory table HTML for email.");
    const partsHTML = generateInventoryTable(INVENTORY_DATA);
    const subject = `Part approval request for work order - ${JOB_CARD_NO}`;
    console.log("[sendRequestEmail] Email subject:", subject);

    const webApproveLink = `${process.env.API_URL}inventoryRequest/processTokenRequest?token=${approveToken}&requestMasterId=${REQUEST_MASTER_ID}`;
    const webRejectLink = `${process.env.API_URL}inventoryRequest/processTokenRequest?token=${rejectToken}&requestMasterId=${REQUEST_MASTER_ID}`;
    console.log("[sendRequestEmail] Generated Web Approve Link:", webApproveLink);
    console.log("[sendRequestEmail] Generated Web Reject Link:", webRejectLink);

    const emailBody = `
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
            <div style="text-align: center;">
                <img src="${process.env.FILE_URL}/logo/Vantage_Main_Logo.png" style="width: 122px; height: 35px;" alt="Logo">
                <h2>Part Approval Request</h2>
            </div>

            <div style="font-family: Arial, sans-serif; color: #333; font-size: 15px; line-height: 1.6;">
                <p><strong>Dear Team,</strong></p>
                <p>The technician <strong>${TECHNICIAN_NAME}</strong> has raised an part approval request for the work order <strong>${JOB_CARD_NO}</strong> for customer <strong>${CUSTOMER_NAME}</strong>.</p>
                
                ${partsHTML}

                <div style="margin: 30px 0; text-align: center;">
                    <p style="text-align: left;">Please approve or reject this request:</p>
                    
                    <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                        <a href="${webApproveLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
                            Approve Request
                        </a> &nbsp;&nbsp;
                        <a href="${webRejectLink}" style="background-color: #f44336; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
                            Reject Request
                        </a>
                    </div>

                    <div style="font-size: 12px; color: #666; background: #f9f9f9; padding: 10px; border-radius: 4px;">
                        <p><strong>Having trouble with the buttons?</strong> Copy and paste the link in browser:</p>
                        <p>Approve: ${webApproveLink}</p>
                        <p>Reject: ${webRejectLink}</p>
                    </div>
                </div>

                <p>If you need any assistance, please contact us at <strong>servicedesk@ovationwps.com</strong>.</p>
                <p><strong>Note:</strong> This request will expire on ${new Date(expiresAt).toLocaleString()}.</p>
            </div>
        </div>
    `;
    console.log("[sendRequestEmail] Email body generated.");

    // 4. Send emails
    const toEmails = EMAIL_LIST.split(',').map(email => email.trim()).filter(email => email);
    console.log("[sendRequestEmail] Sending emails to:", toEmails);
    toEmails.forEach(to => {
        mm.sendEmail(to, [], subject, emailBody, "", "", (error, results) => {
            if (error) {
                console.error(`[sendRequestEmail] Error sending email to ${to}:`, error);
                logger.error(`Error sending inventory request email to ${to}: ${JSON.stringify(error)}`, applicationkey);
            } else {
                console.log(`[sendRequestEmail] Email sent successfully to ${to}. Results:`, results);
                logger.info(`Inventory request email sent to ${to} for request ${REQUEST_MASTER_ID}`, applicationkey);
            }
        });
    });
    console.log("[sendRequestEmail] Email sending process initiated for all recipients.");
}

// Keep all your existing helper functions
function parseArrayField(field, fieldName) {
    console.log(`[parseArrayField] Attempting to parse field: '${fieldName}' with value:`, field);
    if (typeof field === 'string') {
        try {
            const parsed = JSON.parse(field);
            console.log(`[parseArrayField] Successfully parsed string field '${fieldName}':`, parsed);
            return parsed;
        } catch (e) {
            console.error(`[parseArrayField] Error parsing JSON string for '${fieldName}': ${e.message}`);
            throw new Error(`Invalid ${fieldName} format. Expected a JSON array string.`);
        }
    }
    const result = Array.isArray(field) ? field : [];
    console.log(`[parseArrayField] Field '${fieldName}' is already an array or defaulted to empty array:`, result);
    return result;
}

async function checkRequestStatus(requestMasterId, supportKey, connection) {

    console.log(`[checkRequestStatus] Checking status for requestMasterId: ${requestMasterId}`);

    const result = await executeQuery(
        `CALL sp_inventoryRequest_checkStatus(?)`,
        [requestMasterId],
        supportKey,
        connection
    );

    const status = result[0][0].STATUS;

    console.log(`[checkRequestStatus] Status for ${requestMasterId}:`, status);

    return status;
}

async function updateInventoryDetail(
    id,
    status,
    systemDate,
    customerId,
    technicianId,
    jobCardId,
    requestMasterId,
    supportKey,
    connection
) {

    console.log(`[updateInventoryDetail] Updating inventory detail ID: ${id} to status: ${status}`);

    const results = await executeDML(
        `CALL sp_inventoryRequestDetails_updateStatus(?,?,?,?,?,?,?)`,
        [
            id,
            status,
            systemDate,
            customerId,
            technicianId,
            jobCardId,
            requestMasterId
        ],
        supportKey,
        connection
    );

    console.log(`[updateInventoryDetail] Inventory detail ID: ${id} updated.`, results[0]);

    return results[0];
}

async function processInventoryApproval(id, customerId, technicianId, jobCardId, requestMasterId, jobCardNo, supportKey, connection) {
    // console.log(`[processInventoryApproval] Processing inventory approval for detail ID: ${id}, Job Card No: ${jobCardNo}`);
    // console.log(`[processInventoryApproval] Fetching inventory detail for ID: ${id}`);
    const [detail] = await executeQuery(
        `CALL sp_inventoryRequestDetail_get(?,?,?,?,?)`,
        [id, customerId, technicianId, jobCardId, requestMasterId],
        supportKey,
        connection
    );
    if (!detail || detail.length === 0) {
        console.error(`[processInventoryApproval] Inventory detail not found for ID: ${id}. Throwing error.`);
        throw new Error(`Inventory detail not found for ID: ${id}`);
    }
    console.log("[processInventoryApproval] Inventory detail found:", detail);
    const d = detail[0];
    console.log(`[processInventoryApproval] Updating inventory warehouse stock for item ID: ${detail.INVENTORY_ID}, Warehouse ID: ${detail.WAREHOUSE_ID}`);
    const stockUpdateResults = await executeDML(
        `CALL sp_inventoryWarehouseStock_update(?,?,?)`,
        [d.QUANTITY, d.INVENTORY_ID, d.WAREHOUSE_ID],
        supportKey,
        connection
    );
    console.log("[processInventoryApproval] Inventory warehouse stock updated. Results:", stockUpdateResults);

    const actionLog = `${jobCardNo} inventory request approved`;
    console.log("[processInventoryApproval] Prepared inventory account transaction data.");

    const transactionInsertResults = await executeDML(
        `CALL sp_inventoryAccountTransaction_createtransaction(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            jobCardNo,
            mm.getSystemDate(),
            d.INVENTORY_TRACKING_TYPE,
            technicianId,
            jobCardId,
            d.BATCH_NO,
            d.SERIAL_NO,
            d.INVENTORY_ID,
            d.QUANTITY,
            actionLog,
            1,
            d.ACTUAL_UNIT_ID,
            d.ACTUAL_UNIT_NAME,
            d.IS_VARIANT,
            d.PARENT_ID,
            d.QUANTITY_PER_UNIT
        ],
        supportKey,
        connection
    );
    console.log("[processInventoryApproval] Inventory account transaction inserted. Results:", transactionInsertResults);
    return transactionInsertResults;
}

async function updateMasterRecord(
    technicianId,
    customerId,
    jobCardId,
    requestMasterId,
    status,
    systemDate,
    supportKey,
    connection
) {
    console.log(`[updateMasterRecord] Updating master record for REQUEST_MASTER_ID: ${requestMasterId}, STATUS: ${status}`);
    // First check if there's already an approved master record
    console.log("[updateMasterRecord] Checking for existing approved master record.");
    const existingMaster = await executeQuery(
         `CALL sp_inventoryRequestMaster_checkApproved(?,?,?)`,
        [jobCardId, customerId, technicianId],
        supportKey,
        connection
    );

    if (existingMaster && existingMaster[0].length > 0) {
        console.log("[updateMasterRecord] Existing approved master record found. No update needed.");
        return;
    }
    console.log("[updateMasterRecord] No existing approved master record found.");

    // Update the master record
    const results = await executeDML(
         `CALL sp_inventoryRequestMaster_updateStatus(?,?,?,?,?,?)`,
        [
            requestMasterId,
            technicianId,
            customerId,
            jobCardId,
            status,
            systemDate
        ],
        supportKey,
        connection
    );
    console.log(`[updateMasterRecord] Master record for ${requestMasterId} updated. DML Results:`, results);
    return results;
}

function createLogData(technicianId, orderId, jobCardId, customerId, technicianName, customerName, dateTime, status, actionDetails, ianaCode) {
    const logData = {
        TECHNICIAN_ID: technicianId,
        ORDER_ID: orderId ? orderId : 0,
        JOB_CARD_ID: jobCardId,
        CUSTOMER_ID: customerId,
        LOG_TYPE: 'Inventory',
        ACTION_LOG_TYPE: 'User',
        ACTION_DETAILS: actionDetails,
        TECHNICIAN_NAME: technicianName,
        ORDER_STATUS: `Inventory request ${getActionStatus(status)}`,
        JOB_CARD_STATUS: `Inventory request ${getActionStatus(status)}`,
        USER_NAME: customerName,
        DATE_TIME: dateTime,
        supportKey: 0,
        IANA_CODE: ianaCode
    };
    console.log("[createLogData] Created log data:", logData);
    return logData;
}

function getActionVerb(status) {
    const verb = status === 'A' ? 'approved' : status === 'R' ? 'rejected' : 'auto-approved';
    console.log(`[getActionVerb] Status: ${status}, Verb: ${verb}`);
    return verb;
}

function getActionStatus(status) {
    const actionStatus = status === 'A' ? 'approved' : status === 'R' ? 'rejected' : 'auto-approved';
    console.log(`[getActionStatus] Status: ${status}, Action Status: ${actionStatus}`);
    return actionStatus;
}

function handleEmailErrorResponse(res, message) {
    console.error(`[handleEmailErrorResponse] Sending email error response: ${message}`);
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Request Error</title>
            <style>/* Your error styles */</style>
        </head>
        <body>
            <div class="card">
                <span style="font-size: 40px;">⚠️</span>
                <h2>Action Failed</h2>
                <p>${message}</p>
                <p>Please contact support if you need assistance.</p>
            </div>
        </body>
        </html>
    `);
}

// Promise-based wrappers for your database functions
function executeQuery(query, params, supportKey, connection) {
    console.log(`[executeQuery] Executing query: '${query}' with params:`, params);
    return new Promise((resolve, reject) => {
        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) {
                console.error(`[executeQuery] Error executing query: '${query}'`, error);
                reject(error);
            }
            else {
                console.log(`[executeQuery] Query successful for: '${query}'. Results count: ${results ? results.length : 0}`);
                resolve(results);
            }
        }, connection);
    });
}

function executeDML(query, params, supportKey, connection) {
    console.log(`[executeDML] Executing DML: '${query}' with params:`, params);
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, results) => {
            if (error) {
                console.error(`[executeDML] Error executing DML: '${query}'`, error);
                reject(error);
            }
            else {
                console.log(`[executeDML] DML successful for: '${query}'. Results:`, results);
                resolve(results);
            }
        });
    });
}


function handleErrorResponse(res, isFromEmail, message) {
    console.error(`[handleErrorResponse] Handling error response. isFromEmail: ${isFromEmail}, message: ${message}`);
    if (isFromEmail) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Request Error</title>
                <style>
                    body {
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: #fff8f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                    }
                    .card {
                        background: #fff;
                        padding: 30px 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        max-width: 420px;
                        text-align: center;
                    }
                    .card h2 {
                        color: #ff6b35;
                        margin-bottom: 10px;
                    }
                    .card p {
                        color: #444;
                        font-size: 14px;
                        margin-bottom: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h2>Processing Error</h2>
                    <p><strong>${message}</strong></p>
                    <p>Please contact support if you need assistance.</p>
                </div>
            </body>
            </html>
        `);
    } else {
        return res.status(400).send({
            code: 400,
            message: message
        });
    }
}

function generateInventoryTable(inventoryData) {
    let totalAmount = 0;
    const rows = inventoryData.map(item => {
        let Rate = parseFloat(item.RATE).toFixed(2)
        let amount = Rate * item.QUANTITY;
        totalAmount += amount;
        return `
            <tr>
                <td>${item.INVENTORY_NAME}</td>
                <td style="text-align: right;">${Rate}</td>
                <td style="text-align: center;">${item.QUANTITY}</td>
                <td style="text-align: right;">${amount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    return `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <thead style="background-color: #f2f2f2;">
                <tr>
                    <th>Part Name</th>
                    <th>Rate ($)</th>
                    <th>Quantity</th>
                    <th>Amount ($)</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr style="font-weight: bold;">
                    <td colspan="3" style="text-align: right;">Total</td>
                    <td style="text-align: right;">${totalAmount.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    `;
}



exports.addInventory = (req, res) => {
    const {
        INVENTORY_DATA,
        TECHNICIAN_ID,
        JOB_CARD_ID,
        CUSTOMER_ID,
        STATUS,
        ORDER_ID,
        TECHNICIAN_NAME,
        CLIENT_ID,
        JOB_CARD_NO,
        REMARK,
        CUSTOMER_NAME,
        EMAIL_LIST,
        IANA_CODE
    } = req.body;

    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();
    if (!IANA_CODE) {
        res.send({
            "code": 302,
            "message": "Please provide the order's timezone to proceed"
        });
        return;
    }
    var getUTCfromTimeZone = mm.getUTCFromTimezone(IANA_CODE);
    let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);
    if (!Array.isArray(INVENTORY_DATA) || INVENTORY_DATA.length === 0) {
        return res.status(400).json({
            code: 400,
            message: "Invalid or empty INVENTORY_DATA array."
        });
    }

    try {
        const connection = mm.openConnection();

        mm.executeDML(
            `CALL spAddInventory(?,?,?,?,?,?,?,?,?,?)`,
            [
                JOB_CARD_ID,
                TECHNICIAN_ID,
                CUSTOMER_ID,
                STATUS,
                ORDER_ID,
                TECHNICIAN_NAME,
                CLIENT_ID,
                JOB_CARD_NO,
                REMARK,
                JSON.stringify(INVENTORY_DATA)
            ],
            supportKey,
            connection,
            (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to save inventory request."
                    });
                }

                /*
                  results structure:
                  results[0] → view_order_details
                  results[1] → { REQUEST_MASTER_ID }
                */
                console.log("results", results)
                // const resultsGetOrder = results[1] || [];
                const REQUEST_MASTER_ID = results[0][0].REQUEST_MASTER_ID;

                var ACTION_DETAILS = ` ${TECHNICIAN_NAME} has added the inventory request for work order ${req.body.JOB_CARD_NO} .`;

                /* =============================
                   LOG DATA (UNCHANGED LOGIC)
                ============================= */
                var logData = {
                    TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID ? ORDER_ID : 0, JOB_CARD_ID, CUSTOMER_ID,
                    LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME,
                    ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null,
                    ORDER_MEDIUM: null, ORDER_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                    PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "",
                    TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "",
                    JOB_CARD_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                    ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME,
                    DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE
                };

                const INVENTORY_IDS = INVENTORY_DATA.map(i => i.INVENTORY_ID);

                /* =============================
                   EMAIL / NOTIFICATIONS
                ============================= */
                console.log("EMAIL_LIST", EMAIL_LIST)
                if (EMAIL_LIST) {
                    sendRequestEmail(
                        "E",
                        EMAIL_LIST,
                        CUSTOMER_NAME,
                        JOB_CARD_NO,
                        INVENTORY_DATA,
                        TECHNICIAN_NAME,
                        TECHNICIAN_ID,
                        JOB_CARD_ID,
                        CUSTOMER_ID,
                        REQUEST_MASTER_ID,
                        INVENTORY_IDS
                    );
                } else {
                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Inventory request for work order ${JOB_CARD_NO}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the work order ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "IR", "I", logData);
                    mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, ORDER_ID, `Inventory request for work order ${JOB_CARD_NO}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the work order ${JOB_CARD_NO}. This notification is shared with you as the POC for tracking and coordination.`, "", "J", supportKey, "IR", "I", []);
                    mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, `Inventory request for work order ${JOB_CARD_NO} by ${TECHNICIAN_NAME}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the work order ${JOB_CARD_NO}.`, "",  "IR", supportKey, "I", []);
                }

                dbm.saveLog(logData, technicianActionLog);
                mm.commitConnection(connection);

                return res.status(200).json({
                    code: 200,
                    message: "InventoryRequestDetails information saved successfully."
                });
            }
        );
    } catch (error) {
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        return res.status(500).json({
            message: "Something went wrong."
        });
    }
};


exports.updateRequestStatus = (req, res) => {
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var inventoryIDs = req.body.INVENTORY_IDS
    var IDS = req.body.IDS


    var { TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, STATUS, ORDER_ID, TECHNICIAN_NAME, JOB_CARD_NO, REQUEST_MASTER_ID, IANA_CODE } = req.body;
    // Parse and validate arrays
    // let inventoryIDs, IDS;
    if (!IANA_CODE) {
        res.send({
            "code": 302,
            "message": "Please provide the order's timezone to proceed"
        });
        return;
    }
    var getUTCfromTimeZone = mm.getUTCFromTimezone(IANA_CODE);
    let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);

    try {
        inventoryIDs = parseArrayField(req.body.INVENTORY_IDS, 'INVENTORY_IDS');
        IDS = parseArrayField(req.body.IDS, 'IDS');
    } catch (e) {
        console.error(e.message);
        return res.status(400).send({ code: 400, message: e.message });
    }

    var systemDate = mm.getSystemDate();
    if (!TECHNICIAN_ID || !JOB_CARD_ID || !STATUS || !CUSTOMER_ID || !IDS || !req.body.INVENTORY_IDS) {
        console.log("Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, ID, CUSTOMER_ID, ids");

        return res.send({
            code: 300,
            message: `Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, ID, CUSTOMER_ID, ids`
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {
        let setData = "";
        let recordData = [];
        let STATUSZ = "";

        if (STATUS === "A") {
            setData += "STATUS = ?,VERIFICATION_DATE = ?, ";
            recordData.push("AC", systemDate);
            STATUSZ = "AC";
        } else if (STATUS === "R") {
            setData += "STATUS = ?,VERIFICATION_DATE = ?, ";
            recordData.push("R", systemDate);
            STATUSZ = "R";
        } else if (STATUS === "AP") {
            setData += "STATUS = ?, ";
            recordData.push("AP");
            STATUSZ = "AP";
        } else {
            return res.send({
                code: 400,
                message: "Invalid STATUS value."
            });
        }

        var loggarry = []
        const connection = mm.openConnection();


        mm.executeDML(`CALL sp_inventoryRequest_updateJobCard(?,?,?)`,
            [TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save inventoryRequestMaster information."
                    });
                } else {
                    var resultsGetJobs = results[0]
                    if (IDS.length > 0) {
                        let ACTION_LOG = `${req.body.authData.data.UserData[0].USER_NAME} has approved the inventory part request for work order ${JOB_CARD_NO}.`;
                        async.eachSeries(IDS, (ids, callback) => {
                            mm.executeDML(`CALL sp_inventoryRequest_updateInventoryRequestDetails(?,?,?,?,?,?,?,?)`,
                                [ids, STATUSZ, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID, systemDate, ACTION_LOG], supportKey, connection, (error, results) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        callback(error);
                                    } else {
                                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the work order ${JOB_CARD_NO} .`;
                                        const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID ? ORDER_ID : 0, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE }
                                        loggarry.push(logData)
                                        callback();
                                    }
                                });
                        },
                            (error) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                    return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                } else {

                                    var filter = ` AND JOB_CARD_ID = ${JOB_CARD_ID} AND CUSTOMER_ID = ${CUSTOMER_ID} AND TECHNICIAN_ID = ${TECHNICIAN_ID} AND STATUS="A"`
                                    const setContext = `
                            SET @v_PAGE_INDEX = 0;
                            SET @v_PAGE_SIZE = 0;
                            SET @v_SORT_KEY = 'ID';
                            SET @v_SORT_VALUE = 'desc';
                            SET @v_FILTER = '${filter}';
                        `;
                                    mm.executeDML(setContext + `CALL sp_inventoryRequest_get()`, [], supportKey, connection, (error, resultsGet1) => {
                                        const resultSets = resultsGet1.filter(r => Array.isArray(r));

                                        var resultsGet = resultSets[1]
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            return res.status(400).json({
                                                "code": 400,
                                                "message": "Failed to save inventoryRequestMaster information."
                                            });
                                        } else {
                                            console.log("resultsGet", resultsGet)
                                            if (resultsGet.length > 0) {

                                                let notificationData = {
                                                    "JOB_CARD_ID": JOB_CARD_ID,
                                                    "CUSTOMER_ID": CUSTOMER_ID,
                                                    "TECHNICIAN_ID": TECHNICIAN_ID,
                                                    "STATUS": STATUS,
                                                    "JOB_CARD_NUMBER": JOB_CARD_NO,
                                                    "ORDER_NUMBER": resultsGetJobs[0].ORDER_NUMBER,
                                                    "ORDER_STATUS": resultsGetJobs[0].ORDER_STATUS,
                                                    "MSG_SEND_BY": "T",
                                                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                                    "USER_TYPE": "TECHNICIAN",
                                                    "ORDER_ID": ORDER_ID,
                                                    "ORDER_NUMBER": resultsGetJobs[0].ORDER_NUMBER,
                                                }
                                                var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the work order ${JOB_CARD_NO} .`;
                                                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J",  supportKey, "I", []);
                                                mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, ORDER_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the work order ${JOB_CARD_NO}. This notification is shared with you as the POC for tracking and coordination.`, "", "J", supportKey, "IR", "I", []);
                                                mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "I", "J", notificationData);

                                                // mm.sendDynamicEmail(49, REQUEST_MASTER_ID, supportKey)//customeremail
                                                mm.sendDynamicEmail(64, REQUEST_MASTER_ID, supportKey)//technicianemail
                                                // mm.sendDynamicEmail(64, JOB_CARD_ID, supportKey)//adminemail

                                                dbm.saveLog(loggarry, technicianActionLog);
                                                mm.commitConnection(connection);
                                                res.status(200).send({ code: 200, message: "Inventory request updated." });
                                            } else {
                                                console.log("trertyuiuytrertyu")

                                                mm.executeDML(`CALL sp_inventoryRequest_updateMasterRecord(?,?,?,?,?)`, [TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID, REQUEST_MASTER_ID, STATUS], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        console.log(error);
                                                        res.status(400).json({
                                                            "code": 400,
                                                            "message": "Failed to update inventoryRequestDetails information."
                                                        })
                                                    } else {

                                                        let notificationData = {
                                                            "JOB_CARD_ID": JOB_CARD_ID,
                                                            "CUSTOMER_ID": CUSTOMER_ID,
                                                            "TECHNICIAN_ID": TECHNICIAN_ID,
                                                            "STATUS": STATUS,
                                                            "JOB_CARD_NUMBER": JOB_CARD_NO,
                                                            "ORDER_NUMBER": resultsGetJobs[0].ORDER_NUMBER,
                                                            "ORDER_STATUS": resultsGetJobs[0].ORDER_STATUS,
                                                            "MSG_SEND_BY": "T",
                                                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                                            "USER_TYPE": "TECHNICIAN",
                                                            "ORDER_ID": ORDER_ID,
                                                            "ORDER_NUMBER": resultsGetJobs[0].ORDER_NUMBER,
                                                        }
                                                        var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the work order ${JOB_CARD_NO} .`;
                                                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J",  supportKey, "I", []);
                                                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", notificationData);
                                                        dbm.saveLog(loggarry, technicianActionLog);
                                                        mm.commitConnection(connection);
                                                        res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                    }
                                                })
                                            }
                                        }
                                    })
                                }
                            })
                    } else {
                        var filter = ` AND JOB_CARD_ID = ${JOB_CARD_ID} AND CUSTOMER_ID = ${CUSTOMER_ID} AND TECHNICIAN_ID = ${TECHNICIAN_ID}`
                        const setContext = `
                            SET @v_PAGE_INDEX = 0;
                            SET @v_PAGE_SIZE = 0;
                            SET @v_SORT_KEY = 'ID';
                            SET @v_SORT_VALUE = 'desc';
                            SET @v_FILTER = '${filter}';
                        `;
                        mm.executeDML(setContext + `CALL sp_inventoryRequest_get()`, [], supportKey, connection, (error, resultsGet1) => {
                            var resultsGet = resultsGet1[1]
                            if (error) {
                                mm.rollbackConnection(connection);
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                return res.status(400).json({
                                    "code": 400,
                                    "message": "Failed to save inventoryRequestMaster information."
                                });
                            } else {
                                if (resultsGet.length > 0) {
                                    mm.executeDML(`sp_inventoryRequest_updateRequestDetails(?,?,?,?,?)`[TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID, REQUEST_MASTER_ID, STATUS, systemDate], supportKey, connection, (error, results) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                            return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                        } else {
                                            var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the work order ${JOB_CARD_NO} .`;
                                            const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID ? ORDER_ID : 0, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: getUTCfromTimeZone, supportKey: 0, IANA_CODE: IANA_CODE }
                                            var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the work order ${JOB_CARD_NO} .`;
                                            mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "I", []);
                                            mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", logData);
                                            dbm.saveLog(logData, technicianActionLog);
                                            mm.commitConnection(connection);
                                            res.status(200).send({ code: 200, message: "Inventory request updated." });
                                        }
                                    })
                                } else {

                                    console.log("innnnnnnnnnnnnnnnnnnnnnnnnnnn")
                                    mm.executeDML(`sp_inventoryRequest_updateMasterRecord(?,?,?,?,?)`[TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID, REQUEST_MASTER_ID, STATUS], supportKey, connection, (error, results) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.status(400).json({
                                                "code": 400,
                                                "message": "Failed to update inventoryRequestDetails information."
                                            })
                                        } else {
                                            mm.executeDML(`sp_inventoryRequest_updateRequestDetails(?,?,?,?,?)`[TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID, REQUEST_MASTER_ID, STATUS, systemDate], supportKey, connection, (error, results) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection);
                                                    console.log(error);
                                                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                    return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                } else {
                                                    var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the work order ${JOB_CARD_NO} .`;
                                                    const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID ? ORDER_ID : 0, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: getUTCfromTimeZone, supportKey: 0, IANA_CODE: IANA_CODE }
                                                    var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the work order ${JOB_CARD_NO} .`;
                                                    mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", []);
                                                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", logData);
                                                    mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, ORDER_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}.`, "", "J", supportKey, "IR", "I", []);
                                                    dbm.saveLog(logData, technicianActionLog);
                                                    mm.commitConnection(connection);
                                                    res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                }
                                            })
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Internal Server Error."
        });
    }
}; 