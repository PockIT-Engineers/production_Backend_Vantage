const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const technicianActionLog = require("../../modules/technicianActionLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var supportkey = "";
var jobCard = "job_card";
var viewJobCard = "view_" + jobCard;

function reqData(req) {
    var data = {
        JOB_CREATED_DATE: req.body.JOB_CREATED_DATE,
        EXPECTED_DATE_TIME: req.body.EXPECTED_DATE_TIME,
        TASK_DESCRIPTION: req.body.TASK_DESCRIPTION,
        JOB_STATUS_ID: req.body.JOB_STATUS_ID,
        ORDER_ID: req.body.ORDER_ID,
        ORDER_NO: req.body.ORDER_NO,
        JOB_CARD_NO: req.body.JOB_CARD_NO,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        CUSTOMER_NAME: req.body.CUSTOMER_NAME,
        SERVICE_ID: req.body.SERVICE_ID,
        SERVICE_ADDRESS: req.body.SERVICE_ADDRESS,
        LATTITUTE: req.body.LATTITUTE,
        LONGITUDE: req.body.LONGITUDE,
        SERVICE_SKILLS: req.body.SERVICE_SKILLS,
        SERVICE_FULL_NAME: req.body.SERVICE_FULL_NAME,
        SERVICE_NAME: req.body.SERVICE_NAME,
        PINCODE: req.body.PINCODE,
        PRIORITY: req.body.PRIORITY,
        TERRITORY_ID: req.body.TERRITORY_ID || 0,
        TERRITORY_NAME: req.body.TERRITORY_NAME,
        SERVICE_AMOUNT: req.body.SERVICE_AMOUNT,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        SCHEDULED_DATE_TIME: req.body.SCHEDULED_DATE_TIME,
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        ESTIMATED_TIME_IN_MIN: req.body.ESTIMATED_TIME_IN_MIN,
        EXECUTION_DATE_TIME: req.body.EXECUTION_DATE_TIME,
        CLIENT_ID: req.body.CLIENT_ID,
        ORDER_DETAILS_ID: req.body.ORDER_DETAILS_ID,
        TECHNICIAN_STATUS: req.body.TECHNICIAN_STATUS,
        USER_ID: req.body.USER_ID,
        ASSIGNED_DATE: req.body.ASSIGNED_DATE,
        ORGNISATION_ID: req.body.ORGNISATION_ID,
        TECHNICIAN_COST: req.body.TECHNICIAN_COST,
        VENDOR_COST: req.body.VENDOR_COST,
        VENDOR_ID: req.body.VENDOR_ID,
        JOB_PAYMENT_STATUS: req.body.JOB_PAYMENT_STATUS,
        IS_REMOTE_JOB: req.body.IS_REMOTE_JOB ? req.body.IS_REMOTE_JOB : 0,
        SITE_VISIT_REPORT_TYPE: req.body.SITE_VISIT_REPORT_TYPE


    }
    return data;
}

exports.validate = function () {

    return [
        body('TASK_DESCRIPTION').optional(),
        body('ORDER_ID').isInt().optional(),
        body('ORDER_NO').optional(),
        body('JOB_CARD_NO').optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('CUSTOMER_TYPE').optional(),
        body('CUSTOMER_NAME').optional(),
        body('SERVICE_ID').isInt().optional(),
        body('SERVICE_ADDRESS').optional(),
        body('SERVICE_SKILLS').optional(),
        body('SERVICE_FULL_NAME').optional(),
        body('SERVICE_NAME').optional(),
        body('PINCODE').optional(),
        body('PRIORITY').optional(),
        body('SERVICE_AMOUNT').isDecimal().optional(),
        body('ID').optional(),
    ]
}


exports.get = (req, res) => {

    const supportKey = req.headers['supportkey'];

    let pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    let pageSize = req.body.pageSize ? req.body.pageSize : '';

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    const safeFilter = filter.replace(/'/g, "\\'");

    if (mm.sanitizeFilter(filter) !== "0") {
        return res.status(400).json({
            code: 400,
            message: "Invalid filter parameter."
        });
    }

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE  = ${pageSize || 0};
        SET @v_SORT_KEY   = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER     = '${safeFilter}';
    `;

    try {

        mm.executeQueryData(
            setContext + `CALL sp_job_Card_get();`,
            [],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);

                    return res.status(400).json({
                        code: 400,
                        message: "Failed to get jobCard information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));

                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                // Server-driven cancel button visibility, so every portal agrees.
                const data = dataResult.map(row => ({
                    ...row,
                    IS_CANCELLABLE: mm.isCancellable(row)
                }));

                res.status(200).json({
                    code: 200,
                    message: "success",
                    TAB_ID: 44,
                    count: countResult[0] ? countResult[0].cnt : 0,
                    data: data
                });

            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.getJobsforDispatcher = (req, res) => {

    const supportKey = req.headers['supportkey'];

    let pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    let pageSize = req.body.pageSize ? req.body.pageSize : '';

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    const safeFilter = filter.replace(/'/g, "\\'");

    if (mm.sanitizeFilter(filter) !== "0") {

        return res.status(400).json({
            code: 400,
            message: "Invalid filter parameter."
        });

    }

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE  = ${pageSize || 0};
        SET @v_SORT_KEY   = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER     = '${safeFilter}';
    `;

    try {

        mm.executeQueryData(
            setContext + `CALL sp_jobCard_dispatcher_get();`,
            [],
            supportKey,
            (error, results) => {

                if (error) {

                    console.log(error);

                    return res.status(400).json({
                        code: 400,
                        message: "Failed to get jobCard information."
                    });

                }

                const resultSets = results.filter(r => Array.isArray(r));

                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                res.status(200).json({
                    code: 200,
                    message: "success",
                    TAB_ID: 44,
                    count: countResult[0] ? countResult[0].cnt : 0,
                    data: dataResult
                });

            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });

    }

};

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            `CALL sp_job_card_create(?)`,
            [JSON.stringify(data)],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);

                    return res.send({
                        code: 400,
                        message: "Failed to save jobCard information..."
                    });
                }

                let spResult = results[0][0];

                return res.send(spResult);

            });

    } catch (error) {

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }
};

exports.update = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            `CALL sp_job_card_update(?,?)`,
            [req.body.ID, JSON.stringify(data)],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);

                    return res.send({
                        code: 400,
                        message: "Failed to update jobCard information."
                    });
                }

                let spResult = results[0][0];

                return res.send(spResult);

            });

    } catch (error) {

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }
};


exports.createJobCard = (req, res) => {

    var data = reqData(req);
    var IANA_CODE = req.body.IANA_CODE;
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!IANA_CODE) {
        return res.send({
            code: 302,
            message: "Please provide the work order's timezone to proceed"
        });
    }

    let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);

    if (!errors.isEmpty()) {
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        const query = `CALL sp_create_job_card(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const params = [
            data.JOB_CREATED_DATE || null,
            data.EXPECTED_DATE_TIME || null,
            data.TASK_DESCRIPTION || null,
            data.ORDER_ID || null,
            data.ORDER_NO || null,
            data.CUSTOMER_ID || null,
            data.CUSTOMER_TYPE || null,
            data.CUSTOMER_NAME || null,
            data.SERVICE_ID || null,
            data.SERVICE_ADDRESS || null,
            data.LATTITUTE || null,
            data.LONGITUDE || null,
            data.SERVICE_SKILLS || null,
            data.SERVICE_FULL_NAME || null,
            data.SERVICE_NAME || null,
            data.PINCODE || null,
            data.PRIORITY || null,
            data.TERRITORY_ID || 0,
            data.TERRITORY_NAME || null,
            data.SERVICE_AMOUNT || null,
            data.TECHNICIAN_ID || null,
            data.TECHNICIAN_NAME || null,
            data.SCHEDULED_DATE_TIME || null,
            data.START_TIME || null,
            data.END_TIME || null,
            data.ESTIMATED_TIME_IN_MIN || null,
            data.EXECUTION_DATE_TIME || null,
            data.CLIENT_ID || null,
            data.ORDER_DETAILS_ID || null,
            data.USER_ID || null,
            data.ASSIGNED_DATE || null,
            data.ORGNISATION_ID || null,
            data.TECHNICIAN_COST || null,
            data.VENDOR_COST || null,
            data.VENDOR_ID || null,
            data.JOB_PAYMENT_STATUS || null,
            data.IS_REMOTE_JOB || 0,
            data.SITE_VISIT_REPORT_TYPE || null
        ];

        let connection = mm.openConnection();

        mm.executeDML(query, params, supportKey, connection, (error, result) => {

            if (error) {
                mm.rollbackConnection(connection);
                console.log(error);
                return res.send({
                    code: 400,
                    message: "Failed to create job card."
                });
            }

            let spResult = result[0][0];

            if (spResult.code !== 200) {
                mm.rollbackConnection(connection);
                return res.send(spResult);
            }

            let JOB_CARD_ID = spResult.JOB_CARD_ID;

            /* ---------- LOG DATA ---------- */

            var ACTION_DETAILS =
                `${req.body.authData.data.UserData[0].NAME} has generated a work order for service ${data.SERVICE_NAME} for customer ${spResult.COMPANY_NAME}.`;

            const logData = {
                TECHNICIAN_ID: 0,
                VENDOR_ID: 0,
                ORDER_ID: data.ORDER_ID,
                JOB_CARD_ID: JOB_CARD_ID,
                CUSTOMER_ID: data.CUSTOMER_ID,
                LOG_TYPE: "Job",
                ACTION_LOG_TYPE: "User",
                ACTION_DETAILS,
                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                TECHNICIAN_NAME: data.TECHNICIAN_NAME,
                ORDER_DATE_TIME: data.EXPECTED_DATE_TIME,
                EXPECTED_DATE_TIME: data.EXPECTED_DATE_TIME,
                ORDER_MEDIUM: spResult.ORDER_MEDIUM,
                ORDER_STATUS: "Work order created",
                PAYMENT_MODE: spResult.PAYMENT_MODE,
                PAYMENT_STATUS: spResult.PAYMENT_STATUS,
                TOTAL_AMOUNT: spResult.TOTAL_AMOUNT,
                ORDER_NUMBER: spResult.ORDER_NUMBER,
                TASK_DESCRIPTION: "",
                ESTIMATED_TIME_IN_MIN: 0,
                PRIORITY: "",
                JOB_CARD_STATUS: "Work order created",
                USER_NAME: req.body.authData.data.UserData[0].NAME,
                DATE_TIME: MongoLogDate,
                supportKey: 0,
                IANA_CODE: IANA_CODE
            };

            dbm.saveLog(logData, technicianActionLog);


            mm.sendDynamicEmail(56, JOB_CARD_ID, supportKey);


            if (spResult.ORDER_TYPE == "N") {

                let notificationData = {
                    JOB_CARD_ID,
                    ORDER_ID: data.ORDER_ID,
                    SERVICE_ID: data.SERVICE_ID,
                    ORDER_NO: data.ORDER_NO,
                    TECHNICIAN_ID: data.TECHNICIAN_ID,
                    TECHNICIAN_NAME: data.TECHNICIAN_NAME,
                    SCHEDULED_DATE_TIME: data.SCHEDULED_DATE_TIME,
                    PRIORITY: data.PRIORITY,
                    ORDER_STATUS: spResult.ORDER_STATUS,
                    CUSTOMER_ID: data.CUSTOMER_ID,
                };

                mm.sendNotificationToTerritory(
                    data.PINCODE,
                    "New Work Order Created",
                    `Dear Technician, a new work order has been created near your location.`,
                    "",
                    "J",
                    supportKey,
                    'PJ',
                    notificationData
                );
            }

            addGlobalData(JOB_CARD_ID, supportKey);

            mm.commitConnection(connection);

            return res.send({
                code: 200,
                message: "JobCard created successfully."
            });

        });

    } catch (error) {

        return res.send({
            code: 500,
            message: "Something went wrong."
        });

    }
};


function addGlobalData(JOB_ID, supportKey) {
    try {

        mm.executeQueryData(
            `CALL sp_get_job_global_data(?)`,
            [JOB_ID],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                }
                else {

                    let data = results[0];

                    if (data.length > 0) {

                        let logData = {
                            ID: JOB_ID,
                            CATEGORY: "Job",
                            TITLE: data[0].JOB_CARD_NO,
                            DATA: JSON.stringify(data[0]),
                            ROUTE: "/overview/jobs",
                            TERRITORY_ID: data[0].TERRITORY_ID
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
                    else {
                        console.log("no data found");
                    }
                }
            }
        );

    } catch (error) {
        console.log(error);
    }
}

exports.getAssignedJobs = (req, res) => {

    const supportKey = req.headers['supportkey'];

    let filter = req.body.filter ? req.body.filter : '';

    let SCHEDULED_DATE_TIME = req.body.SCHEDULED_DATE_TIME ? req.body.SCHEDULED_DATE_TIME : '';
    let START_TIME = req.body.START_TIME ? req.body.START_TIME : '';
    let END_TIME = req.body.END_TIME ? req.body.END_TIME : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';

    if (mm.sanitizeFilter(filter) !== "0") {
        return res.send({
            code: 400,
            message: "Invalid Filter."
        });
    }

    if (!(TECHNICIAN_ID && SCHEDULED_DATE_TIME && START_TIME && END_TIME)) {

        return res.send({
            code: 400,
            message: "Parameters are missing."
        });

    }

    const setContext = `
        SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID};
        SET @v_SCHEDULED_DATE = '${SCHEDULED_DATE_TIME}';
        SET @v_START_TIME = '${START_TIME}';
    `;

    try {

        mm.executeQueryData(
            setContext + `CALL sp_jobCard_getAssignedJobs();`,
            [],
            supportKey,
            (error, results) => {

                if (error) {

                    console.log(error);

                    return res.send({
                        code: 400,
                        message: "Failed to get jobCard information."
                    });

                }

                const resultSets = results.filter(r => Array.isArray(r));

                const countResult = resultSets[0] || [];
                const jobData = resultSets[1] || [];
                const locationData = resultSets[2] || [];

                if (jobData.length > 0) {

                    return res.send({
                        code: 300,
                        message: "JobCard is already assigned to the Technician.",
                        count: countResult[0] ? countResult[0].cnt : 0,
                        data: jobData
                    });

                } else {

                    return res.send({
                        code: 200,
                        message: "success",
                        TAB_ID: 44,
                        count: 1,
                        data: locationData
                    });

                }

            }
        );

    } catch (error) {

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }

};


exports.getBetweenJobs = (req, res) => {

    var supportKey = req.headers['supportkey'];

    let filter = req.body.filter ? req.body.filter : '';
    let SCHEDULED_DATE_TIME = req.body.SCHEDULED_DATE_TIME ? req.body.SCHEDULED_DATE_TIME : '';
    let EXPECTED_END_DATE = req.body.EXPECTED_END_DATE ? req.body.EXPECTED_END_DATE : '';
    let START_TIME = req.body.START_TIME ? req.body.START_TIME : '';
    let END_TIME = req.body.END_TIME ? req.body.END_TIME : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';
    let LATTITUTE = req.body.LATTITUTE ? req.body.LATTITUTE : '';
    let LONGITUDE = req.body.LONGITUDE ? req.body.LONGITUDE : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    let newJobStart = `${SCHEDULED_DATE_TIME} ${START_TIME}:00`;
    let newJobEnd = `${EXPECTED_END_DATE} ${END_TIME}:00`;

    if (IS_FILTER_WRONG != "0") {
        return res.send({
            code: 400,
            message: "Invalid Filter."
        });
    }

    if (!(TECHNICIAN_ID && SCHEDULED_DATE_TIME && START_TIME && END_TIME && EXPECTED_END_DATE)) {

        return res.send({
            code: 400,
            message: "Parameters are missing."
        });

    }

    const setContext = `
        SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID};
        SET @v_NEW_JOB_START = '${newJobStart}';
        SET @v_NEW_JOB_END   = '${newJobEnd}';
    `;

    try {

        mm.executeQueryData(
            setContext + `CALL sp_jobCard_getBetweenJobs();`,
            [],
            supportKey,
            (error, results) => {

                if (error) {

                    console.log(error);

                    return res.send({
                        code: 400,
                        message: "Failed to get jobCard information."
                    });

                }

                const resultSets = results.filter(r => Array.isArray(r));

                const countResult = resultSets[0] || [];
                const prevJob = resultSets[1] || [];
                const nextJob = resultSets[2] || [];

                var result = {};
                var result2 = {};

                if (prevJob.length > 0) {

                    result = getDistanceAndTime(
                        parseFloat(prevJob[0].LOCATION_LATITUDE),
                        parseFloat(prevJob[0].LOCATION_LONG),
                        parseFloat(LATTITUTE),
                        parseFloat(LONGITUDE),
                        60
                    );

                }

                if (nextJob.length > 0) {

                    result2 = getDistanceAndTime(
                        parseFloat(nextJob[0].LOCATION_LATITUDE),
                        parseFloat(nextJob[0].LOCATION_LONG),
                        parseFloat(LATTITUTE),
                        parseFloat(LONGITUDE),
                        60
                    );

                }

                var jobsData = [...prevJob, ...nextJob];

                res.send({
                    code: 200,
                    message: "JobCard information fetched successfully.",
                    data: jobsData,
                    preveousJob: result,
                    nextJob: result2
                });

            }
        );

    } catch (error) {

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }

};


exports.getJobsForTechnician = (req, res) => {

    var supportKey = req.headers['supportkey'];

    let pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    let pageSize = req.body.pageSize ? req.body.pageSize : '';

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';

    let filter = req.body.filter ? req.body.filter : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';

    if (mm.sanitizeFilter(filter) !== "0") {

        return res.send({
            code: 400,
            message: "Invalid Filter."
        });

    }

    if (!TECHNICIAN_ID) {

        return res.send({
            code: 400,
            message: "Parameters missing Technician ID."
        });

    }

    const safeFilter = filter.replace(/'/g, "\\'");

    const setContext = `
        SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE  = ${pageSize || 0};
        SET @v_SORT_KEY   = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER     = '${safeFilter}';
    `;

    try {

        mm.executeQueryData(
            setContext + `CALL sp_jobCard_getJobsForTechnician();`,
            [],
            supportKey,
            (error, results) => {

                if (error) {

                    console.log(error);

                    return res.send({
                        code: 400,
                        message: "Failed to get jobCard information."
                    });

                }

                const resultSets = results.filter(r => Array.isArray(r));

                const pincodeData = resultSets[0] || [];
                const jobCheck = resultSets[1] || [];
                const countResult = resultSets[2] || [];
                const jobData = resultSets[3] || [];

                if (pincodeData.length === 0) {

                    return res.send({
                        code: 400,
                        message: "Technician is not assigned to any Pincode."
                    });

                }

                let IS_ON_JOB = jobCheck.length > 0 ? 1 : 0;

                res.send({
                    code: 200,
                    message: "JobCard information fetched successfully.",
                    total: countResult[0] ? countResult[0].cnt : 0,
                    data: jobData,
                    IS_ON_JOB: IS_ON_JOB
                });

            }
        );

    } catch (error) {

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }

};

function getDistanceAndTime(lat1, lon1, lat2, lon2, averageSpeedKmph = 60) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const estimatedTimeHours = distance / averageSpeedKmph;

    return {
        distance: distance.toFixed(2),
        estimatedTimeHours: estimatedTimeHours.toFixed(2),
    };
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

exports.getjobDetailsWithFeedback = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var ORDER_ID = req.body.ORDER_ID;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var JOB_CARD_ID = req.body.JOB_CARD_ID;

    let filter = req.body.filter ? req.body.filter : '';

    if (mm.sanitizeFilter(filter) !== "0") {

        return res.send({
            code: 400,
            message: "Invalid filter parameter."
        });

    }

    const setContext = `
        SET @v_ORDER_ID = ${ORDER_ID};
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID};
        SET @v_JOB_CARD_ID = ${JOB_CARD_ID};
    `;

    try {

        mm.executeQueryData(
            setContext + `CALL sp_jobCard_getjobDetailsWithFeedback();`,
            [],
            supportKey,
            (error, results) => {

                if (error) {

                    console.log(error);

                    return res.send({
                        code: 400,
                        message: "Failed to get orderDetails information."
                    });

                }

                const resultSets = results.filter(r => Array.isArray(r));

                const techData = resultSets[0] || [];
                const feedbackData = resultSets[1] || [];
                const pendingRequests = resultSets[2] || [];
                const allRequests = resultSets[3] || [];
                const pendingPayments = resultSets[4] || [];
                const PaidPayment = resultSets[5] || [];

                let pendingPayment = pendingPayments.length > 0 ? 1 : 0;
                let inventoryReq = pendingRequests.length > 0 ? 1 : 0;

                return res.send({
                    code: 200,
                    message: "success",
                    techData: techData,
                    feedbackData: feedbackData,
                    inventoryReq: inventoryReq,
                    pendingPayment: pendingPayment,
                    jobData: allRequests,
                    pendingPayments: pendingPayments,
                    PaidPayment: PaidPayment
                });

            }
        );

    } catch (error) {

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }

};


exports.updatePaymentStatus = (req, res) => {

    var ORDER_ID = req.body.ORDER_ID;
    var JOB_CARD_ID = req.body.JOB_CARD_ID;
    var JOB_CARD_NO = req.body.JOB_CARD_NO;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var TECHNICIAN_NAME = req.body.TECHNICIAN_NAME;

    let STATUS = req.body.STATUS;
    let IS_UPDATED_BY_ADMIN = req.body.IS_UPDATED_BY_ADMIN;

    let USER_NAME =
        IS_UPDATED_BY_ADMIN === 1
            ? req.body.authData.data.UserData[0].USER_NAME
            : TECHNICIAN_NAME;

    var systemDate = mm.getSystemDate();

    let IANA_CODE = req.body.IANA_CODE;

    if (!IANA_CODE) {
        return res.send({
            code: 302,
            message: "Please provide the work order's timezone to proceed"
        });
    }

    var supportKey = req.headers['supportkey'];

    try {

        mm.executeQueryData(
            `CALL sp_update_job_payment_status(?)`,
            [JOB_CARD_ID],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        message: "Failed to update jobTransactionsTransactions information."
                    });
                }

                let spResult = result[0][0];

                if (spResult.code !== 200) {
                    return res.status(spResult.code).json({
                        message: spResult.message
                    });
                }

                /* -------- LOG PART (unchanged) -------- */

                let LOG_TYPE = IS_UPDATED_BY_ADMIN === 1 ? "User" : "Technician";

                const ACTION_DETAILS =
                    `${USER_NAME} has marked the payment status as completed for the job ${JOB_CARD_NO}.`;

                const logData = {
                    TECHNICIAN_ID: TECHNICIAN_ID,
                    VENDOR_ID: 0,
                    ORDER_ID: ORDER_ID,
                    JOB_CARD_ID: JOB_CARD_ID,
                    CUSTOMER_ID: CUSTOMER_ID,
                    LOG_TYPE: 'Job',
                    ACTION_LOG_TYPE: LOG_TYPE,
                    ACTION_DETAILS: ACTION_DETAILS,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    TECHNICIAN_NAME: "",
                    ORDER_DATE_TIME: null,
                    CART_ID: 0,
                    EXPECTED_DATE_TIME: null,
                    ORDER_MEDIUM: "",
                    ORDER_STATUS: null,
                    PAYMENT_MODE: "",
                    PAYMENT_STATUS: "",
                    TOTAL_AMOUNT: "",
                    ORDER_NUMBER: "",
                    TASK_DESCRIPTION: "",
                    ESTIMATED_TIME_IN_MIN: 0,
                    PRIORITY: "",
                    JOB_CARD_STATUS: `Payment completed for work order ${JOB_CARD_NO}`,
                    USER_NAME: req.body.authData.data.UserData[0].NAME,
                    DATE_TIME: systemDate,
                    supportKey: 0,
                    IANA_CODE: IANA_CODE
                };

                dbm.saveLog(logData, technicianActionLog);

                /* -------- NOTIFICATION -------- */

                mm.sendNotificationToChannel(
                    req.body.authData.data.UserData[0].USER_ID,
                    `customer_${CUSTOMER_ID}_channel`,
                    `Payment status updated`,
                    ACTION_DETAILS,
                    "",
                    "J",
                    supportKey,
                    "N",
                    "P",
                    logData
                );

                return res.status(200).json({
                    message: "jobreschedule information updated successfully..."
                });

            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Something Went Wrong."
        });
    }
};
