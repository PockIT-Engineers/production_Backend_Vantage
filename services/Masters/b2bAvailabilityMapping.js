const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const servicelog = require("../../modules/serviceLog")
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
var b2bAvailabilityMapping = "b2b_availability_mapping";
var viewb2bAvailabilityMapping = "view_" + b2bAvailabilityMapping;
const xlsx = require('xlsx');
const excelMaster = require("../../modules/excelImportMaster");

// b2bdata
function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        SERVICE_ID: req.body.SERVICE_ID,
        IS_AVAILABLE: req.body.IS_AVAILABLE ? '1' : '0',
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        B2B_PRICE: req.body.B2B_PRICE ? req.body.B2B_PRICE : 0,
        B2C_PRICE: req.body.B2C_PRICE ? req.body.B2C_PRICE : 0,
        TECHNICIAN_COST: req.body.TECHNICIAN_COST ? req.body.TECHNICIAN_COST : 0,
        VENDOR_COST: req.body.VENDOR_COST ? req.body.VENDOR_COST : 0,
        EXPRESS_COST: req.body.EXPRESS_COST ? req.body.EXPRESS_COST : 0,
        CATEGORY_NAME: req.body.CATEGORY_NAME,
        SUB_CATEGORY_NAME: req.body.SUB_CATEGORY_NAME,
        IS_EXPRESS: req.body.IS_EXPRESS ? '1' : '0',
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        SERVICE_IMAGE: req.body.SERVICE_IMAGE,
        SERVICE_TYPE: req.body.SERVICE_TYPE,
        PREPARATION_MINUTES: req.body.PREPARATION_MINUTES,
        PREPARATION_HOURS: req.body.PREPARATION_HOURS,
        HSN_CODE_ID: req.body.HSN_CODE_ID,
        HSN_CODE: req.body.HSN_CODE,
        UNIT_ID: req.body.UNIT_ID,
        TAX_ID: req.body.TAX_ID,
        SERVICE_DETAILS_IMAGE: req.body.SERVICE_DETAILS_IMAGE,
        WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED ? '1' : '0',
        GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED ? '1' : '0',
        WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
        GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
        JOB_CLOSURE_TIME: req.body.JOB_CLOSURE_TIME,
        SITE_VISIT_REPORT_TYPE: req.body.SITE_VISIT_REPORT_TYPE,
        IS_FOR_B2B: req.body.IS_FOR_B2B ? '1' : '0',
        SHORT_CODE: req.body.SHORT_CODE,
        IS_JOB_CREATED_DIRECTLY: req.body.IS_JOB_CREATED_DIRECTLY ? '1' : '0',
        MAX_QTY: req.body.MAX_QTY,
        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

// setdata
function reqDataService(req) {

    var data = {
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        SUB_CATEGORY_ID: req.body.SUB_CATEGORY_ID,
        B2B_PRICE: req.body.B2B_PRICE,
        B2C_PRICE: req.body.B2C_PRICE,
        EXPRESS_COST: req.body.EXPRESS_COST,
        DURARTION_HOUR: req.body.DURARTION_HOUR,
        DURARTION_MIN: req.body.DURARTION_MIN,
        SERVICE_IMAGE: req.body.SERVICE_IMAGE,
        STATUS: req.body.STATUS ? "1" : "0",
        UNIT_ID: req.body.UNIT_ID,

        SHORT_CODE: req.body.SHORT_CODE,
        MAX_QTY: req.body.MAX_QTY,
        VENDOR_COST: req.body.VENDOR_COST,
        TECHNICIAN_COST: req.body.TECHNICIAN_COST,
        TAX_ID: req.body.TAX_ID,

        DETAILS_DESIGNER: req.body.DETAILS_DESIGNER,
        IS_EXPRESS: req.body.IS_EXPRESS ? "1" : "0",
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        IS_NEW: req.body.IS_NEW ? "1" : "0",
        PARENT_ID: req.body.PARENT_ID,
        IS_PARENT: req.body.IS_PARENT ? "1" : "0",
        CLIENT_ID: req.body.CLIENT_ID,
        ORG_ID: req.body.ORG_ID,
        QTY: req.body.QTY,
        SERVICE_TYPE: req.body.SERVICE_TYPE,
        PREPARATION_MINUTES: req.body.PREPARATION_MINUTES,
        PREPARATION_HOURS: req.body.PREPARATION_HOURS,
        IS_FOR_B2B: req.body.IS_FOR_B2B ? '1' : '0',
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        SERVICE_HTML_URL: req.body.SERVICE_HTML_URL,
        IS_JOB_CREATED_DIRECTLY: req.body.IS_JOB_CREATED_DIRECTLY ? '1' : '0',
        CREATED_DATE: req.body.CREATED_DATE,
        HSN_CODE_ID: req.body.HSN_CODE_ID,
        HSN_CODE: req.body.HSN_CODE,
        SERVICE_DETAILS_IMAGE: req.body.SERVICE_DETAILS_IMAGE,
        WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED ? '1' : '0',
        GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED ? '1' : '0',
        WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
        GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
        JOB_CLOSURE_TIME: req.body.JOB_CLOSURE_TIME,
        SITE_VISIT_REPORT_TYPE: req.body.SITE_VISIT_REPORT_TYPE



    }

    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('SERVICE_ID').isInt().optional(),
        body('START_TIME').optional(),
        body('END_TIME').optional(),
        body('B2B_PRICE').isDecimal().optional(),
        body('B2C_PRICE').isDecimal().optional(),
        body('TECHNICIAN_COST').isDecimal().optional(),
        body('VENDOR_COST').isDecimal().optional(),
        body('EXPRESS_COST').isDecimal().optional(),
        body('CATEGORY_NAME').optional(),
        body('SUB_CATEGORY_NAME').optional(),
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('SERVICE_IMAGE').optional(),
        body('SERVICE_TYPE').optional(),
        body('PREPARATION_MINUTES').isInt().optional(),
        body('PREPARATION_HOURS').isInt().optional(),
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
            setContext + `CALL sp_b2b_availability_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    logger.error(
                        `${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`,
                        applicationkey
                    );
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get B2B availability mapping."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 214,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        logger.error(
            `${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`,
            applicationkey
        );
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};


exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    var CATEGORY_NAME = req.body.CATEGORY_NAME
    var SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME
    var SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID
    var DURARTION_HOUR = req.body.DURARTION_HOUR
    var DURARTION_MIN = req.body.DURARTION_MIN
    var UNIT_ID = req.body.UNIT_ID
    var SHORT_CODE = req.body.SHORT_CODE
    var MAX_QTY = req.body.MAX_QTY
    var TAX_ID = req.body.TAX_ID
    var IS_NEW = req.body.IS_NEW
    var PARENT_ID = req.body.PARENT_ID
    var IS_PARENT = req.body.IS_PARENT
    var IS_FOR_B2B = req.body.IS_FOR_B2B
    var IS_JOB_CREATED_DIRECTLY = req.body.IS_JOB_CREATED_DIRECTLY
    var ORG_ID = req.body.ORG_ID
    var QTY = req.body.QTY
    var STATUS = req.body.STATUS
    var TAX_NAME = req.body.TAX_NAME
    var UNIT_NAME = req.body.UNIT_NAME
    var TERRITORY_ID = req.body.TERRITORY_ID
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_b2b_availability_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.CUSTOMER_ID,
                data.SERVICE_ID,
                data.IS_AVAILABLE,
                data.START_TIME,
                data.END_TIME,
                data.B2B_PRICE,
                data.B2C_PRICE,
                data.TECHNICIAN_COST,
                data.VENDOR_COST,
                data.EXPRESS_COST,
                data.CATEGORY_NAME,
                data.SUB_CATEGORY_NAME,
                data.IS_EXPRESS,
                data.NAME,
                data.DESCRIPTION,
                data.SERVICE_IMAGE,
                data.SERVICE_TYPE,
                data.PREPARATION_MINUTES,
                data.PREPARATION_HOURS,

                data.CLIENT_ID,
                data.HSN_CODE_ID,
                data.HSN_CODE,
                data.UNIT_ID,
                data.TAX_ID,
                data.JOB_CLOSURE_TIME,
                data.SITE_VISIT_REPORT_TYPE,
                data.SERVICE_DETAILS_IMAGE,
                data.WARRANTY_ALLOWED,
                data.GUARANTEE_ALLOWED,
                data.WARRANTY_PERIOD,
                data.GUARANTEE_PERIOD,
                data.IS_JOB_CREATED_DIRECTLY,
                data.MAX_QTY,
                data.IS_FOR_B2B,
                data.SHORT_CODE
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    return res.status(400).json({ "code": 400, "message": "Create failed." });
                }

                const insertId = result[0][0].INSERT_ID;
                var systemDate = mm.getSystemDate();
                var ACTION_DETAILS = `A new service has been created by ${req.body.authData.data.UserData[0].NAME}.`;
                let logData2 = {
                    "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": 'B2BM', "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": data.SERVICE_ID, "CUSTOMER_ID": data.CUSTOMER_ID, "TERRITORY_ID": TERRITORY_ID,
                    "NAME": data.NAME, "DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME, "SUB_CATEGORY_ID": SUB_CATEGORY_ID,
                    "B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE, "TECHNICIAN_COST": data.TECHNICIAN_COST, "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
                    "IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": DURARTION_HOUR,
                    "DURATION_MIN": DURARTION_MIN, "PREPARATION_MINUTES": data.PREPARATION_MINUTES, "PREPARATION_HOURS": data.PREPARATION_HOURS,
                    "UNIT_ID": UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": SHORT_CODE, "MAX_QTY": MAX_QTY, "TAX_ID": TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME,
                    "END_TIME": data.END_TIME, "IS_NEW": IS_NEW, "PARENT_ID": PARENT_ID, "IS_PARENT": IS_PARENT,
                    "SERVICE_IMAGE": data.SERVICE_IMAGE, "IS_FOR_B2B": IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": IS_JOB_CREATED_DIRECTLY,
                    "IS_AVAILABLE": data.IS_AVAILABLE, "ORG_ID": ORG_ID, "QTY": QTY, "STATUS": STATUS, "HSN_CODE": data.HSN_CODE, "HSN_CODE_ID": data.HSN_CODE_ID, "SUPPORT_KEY": supportKey,
                    "JOB_CLOSURE_TIME": data.JOB_CLOSURE_TIME, "SITE_VISIT_REPORT_TYPE": data.SITE_VISIT_REPORT_TYPE, "SERVICE_DETAILS_IMAGE": data.SERVICE_DETAILS_IMAGE, "WARRANTY_ALLOWED": data.WARRANTY_ALLOWED,
                    "GUARANTEE_ALLOWED": data.GUARANTEE_ALLOWED, "WARRANTY_PERIOD": data.WARRANTY_PERIOD, "GUARANTEE_PERIOD": data.GUARANTEE_PERIOD
                };
                dbm.saveLog(logData2, servicelog)
                addGlobalData(insertId, "B2B", supportKey)

                res.status(200).json({
                    "code": 200,
                    "message": "Service created successfully."
                });
            }
        );
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    var CATEGORY_NAME = req.body.CATEGORY_NAME
    var TERRITORY_ID = req.body.TERRITORY_ID
    var SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME
    var SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID
    var DURARTION_HOUR = req.body.DURARTION_HOUR
    var DURARTION_MIN = req.body.DURARTION_MIN
    var UNIT_ID = req.body.UNIT_ID
    var SHORT_CODE = req.body.SHORT_CODE
    var MAX_QTY = req.body.MAX_QTY
    var TAX_ID = req.body.TAX_ID
    var IS_NEW = req.body.IS_NEW
    var PARENT_ID = req.body.PARENT_ID
    var IS_PARENT = req.body.IS_PARENT
    var IS_FOR_B2B = req.body.IS_FOR_B2B
    var IS_JOB_CREATED_DIRECTLY = req.body.IS_JOB_CREATED_DIRECTLY
    var ORG_ID = req.body.ORG_ID
    var QTY = req.body.QTY
    var STATUS = req.body.STATUS
    var UNIT_NAME = req.body.UNIT_NAME
    var TAX_NAME = req.body.TAX_NAME
    var supportKey = req.headers['supportkey'];
    delete data.IS_FOR_B2B;
    delete data.SHORT_CODE;
    var systemDate = mm.getSystemDate();
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_b2b_availability_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.CUSTOMER_ID,
                data.SERVICE_ID,
                data.IS_AVAILABLE,
                data.START_TIME,
                data.END_TIME,
                data.B2B_PRICE,
                data.B2C_PRICE,
                data.TECHNICIAN_COST,
                data.VENDOR_COST,
                data.EXPRESS_COST,
                data.CATEGORY_NAME,
                data.SUB_CATEGORY_NAME,
                data.IS_EXPRESS,
                data.NAME,
                data.DESCRIPTION,
                data.SERVICE_IMAGE,
                data.SERVICE_TYPE,
                data.PREPARATION_MINUTES,
                data.PREPARATION_HOURS,
                data.CLIENT_ID,
                data.HSN_CODE_ID,
                data.HSN_CODE,
                data.UNIT_ID,
                data.TAX_ID,
                data.JOB_CLOSURE_TIME,
                data.SITE_VISIT_REPORT_TYPE,
                data.SERVICE_DETAILS_IMAGE,
                data.WARRANTY_ALLOWED,
                data.GUARANTEE_ALLOWED,
                data.WARRANTY_PERIOD,
                data.GUARANTEE_PERIOD,
                data.IS_JOB_CREATED_DIRECTLY,
                data.MAX_QTY,
                data.IS_FOR_B2B,
                data.SHORT_CODE
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error)
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    return res.status(400).json({ "code": 400, "message": "Update failed." });
                }

                var systemDate = mm.getSystemDate();
                var ACTION_DETAILS = `The service has been updated by ${req.body.authData.data.UserData[0].NAME}`;
                let logData2 = {
                    "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": 'B2BM', "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": data.SERVICE_ID, "CUSTOMER_ID": data.CUSTOMER_ID, "TERRITORY_ID": TERRITORY_ID,
                    "NAME": data.NAME, "DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME, "SUB_CATEGORY_ID": SUB_CATEGORY_ID,
                    "B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE, "TECHNICIAN_COST": data.TECHNICIAN_COST, "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
                    "IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": DURARTION_HOUR,
                    "DURATION_MIN": DURARTION_MIN, "PREPARATION_MINUTES": data.PREPARATION_MINUTES, "PREPARATION_HOURS": data.PREPARATION_HOURS,
                    "UNIT_ID": UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": SHORT_CODE, "MAX_QTY": MAX_QTY, "TAX_ID": TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME,
                    "END_TIME": data.END_TIME, "IS_NEW": IS_NEW, "PARENT_ID": PARENT_ID, "IS_PARENT": IS_PARENT,
                    "SERVICE_IMAGE": data.SERVICE_IMAGE, "IS_FOR_B2B": IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": IS_JOB_CREATED_DIRECTLY,
                    "IS_AVAILABLE": data.IS_AVAILABLE, "ORG_ID": ORG_ID, "QTY": QTY, "STATUS": STATUS, "HSN_CODE": data.HSN_CODE, "HSN_CODE_ID": data.HSN_CODE_ID, "SUPPORT_KEY": supportKey,
                    "JOB_CLOSURE_TIME": data.JOB_CLOSURE_TIME, "SITE_VISIT_REPORT_TYPE": data.SITE_VISIT_REPORT_TYPE, "SERVICE_DETAILS_IMAGE": data.SERVICE_DETAILS_IMAGE, "WARRANTY_ALLOWED": data.WARRANTY_ALLOWED,
                    "GUARANTEE_ALLOWED": data.GUARANTEE_ALLOWED, "WARRANTY_PERIOD": data.WARRANTY_PERIOD, "GUARANTEE_PERIOD": data.GUARANTEE_PERIOD
                };

                dbm.saveLog(logData2, servicelog)
                addGlobalData(req.body.ID, "B2B", supportKey)

                res.status(200).json({
                    "code": 200,
                    "message": "Service updated successfully."
                });
            }
        );
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

exports.mapServicesCustomer = (req, res) => {
    const { CUSTOMER_ID, service_ids, CLIENT_ID } = req.body;
    const supportKey = req.headers['supportkey'];

    if (!Array.isArray(service_ids) || service_ids.length === 0) {
        return res.send({
            code: 400,
            message: "service_ids must be a non-empty array."
        });
    }

    try {
        let SERVICE_LOGS = [];
        const connection = mm.openConnection();

        async.eachSeries(service_ids, (SERVICE_ID, cb) => {

            mm.executeDML(
                `CALL sp_b2b_availability_mapServicesCustomer(?,?,?)`,
                [CUSTOMER_ID, SERVICE_ID, CLIENT_ID],
                supportKey,
                connection,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        return cb(error);
                    }

                    const service = results[0][0];
                    const systemDate = mm.getSystemDate();

                    const actionDetails =
                        `${req.body.authData.data.UserData[0].NAME} has mapped service ${service.NAME}.`;

                    /* Mongo log object (UNCHANGED) */
                    console.log("CUSTOMER_ID", CUSTOMER_ID)
                    delete service.CUSTOMER_ID;
                    SERVICE_LOGS.push({
                        LOG_DATE_TIME: systemDate,
                        LOG_TEXT: actionDetails,
                        LOG_TYPE: 'B2BBL',
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        ADDED_BY: req.body.authData.data.UserData[0].NAME,
                        SERVICE_ID: SERVICE_ID,
                        CUSTOMER_ID: CUSTOMER_ID,
                        ...service,
                        SUPPORT_KEY: supportKey
                    });

                    cb();
                }
            );
        }, (error) => {
            if (error) {
                mm.rollbackConnection(connection);
                return res.send({
                    code: 400,
                    message: "Failed to insert/update B2B availability mapping."
                });
            }
            console.log("SERVICE_LOGS", SERVICE_LOGS)
            dbm.saveLog(SERVICE_LOGS, servicelog);
            mm.commitConnection(connection);

            res.send({
                code: 200,
                message: "Services mapped successfully."
            });
        });

    } catch (error) {
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong."
        });
    }
};



exports.addBulkService = (req, res) => {
    const { CUSTOMER_ID, data, CLIENT_ID, authData } = req.body;
    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    if (!CUSTOMER_ID) {
        return res.status(400).send({
            code: 400,
            message: "Parameter missing.",
        });
    }

    const connection = mm.openConnection();

    try {
        var SERVICE_LOGS = [];

        async.eachSeries(
            data,
            (services, callback) => {

                mm.executeDML(
                    `CALL sp_b2bAvailabilityMapping_addBulkService(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        CUSTOMER_ID,
                        services.SERVICE_ID,
                        services.IS_AVAILABLE ? 1 : 0,
                        services.START_TIME,
                        services.END_TIME,
                        services.B2B_PRICE,
                        services.B2C_PRICE,
                        services.TECHNICIAN_COST,
                        services.VENDOR_COST,
                        services.EXPRESS_COST,
                        services.IS_EXPRESS ? 1 : 0,
                        services.NAME,
                        services.DESCRIPTION,
                        services.SERVICE_IMAGE,
                        services.SERVICE_TYPE,
                        services.PREPARATION_MINUTES,
                        services.PREPARATION_HOURS,
                        CLIENT_ID,
                        services.CATEGORY_NAME,
                        services.SUB_CATEGORY_NAME,
                        services.HSN_CODE_ID,
                        services.HSN_CODE,
                        services.UNIT_ID,
                        services.TAX_ID,
                        services.JOB_CLOSURE_TIME,
                        services.SITE_VISIT_REPORT_TYPE,
                        services.SERVICE_DETAILS_IMAGE,
                        services.WARRANTY_ALLOWED,
                        services.GUARANTEE_ALLOWED,
                        services.WARRANTY_PERIOD,
                        services.GUARANTEE_PERIOD,
                        services.IS_JOB_CREATED_DIRECTLY,
                        services.MAX_QTY,
                        services.IS_FOR_B2B,
                        services.SHORT_CODE
                    ],
                    supportKey,
                    connection,
                    (error, results) => {

                        if (error) {
                            console.log("error", error)
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                            return callback(error);
                        }

                        const actionResult = results[0][0];
                        const isUpdate = actionResult.ACTION_TYPE === 'U';
                        const insertedId = actionResult.NEW_ID ? actionResult.NEW_ID : services.SERVICE_ID;

                        const ACTION_DETAILS = `${authData.data.UserData[0].NAME} has ${isUpdate ? 'updated' : 'created'} service ${services.NAME}.`;

                        const logData = {
                            LOG_DATE_TIME: systemDate,
                            LOG_TEXT: ACTION_DETAILS,
                            LOG_TYPE: 'B2BBL',
                            USER_ID: authData.data.UserData[0].USER_ID,
                            ADDED_BY: authData.data.UserData[0].NAME,
                            SERVICE_ID: insertedId,
                            CUSTOMER_ID: CUSTOMER_ID,
                            TERRITORY_ID: services.TERRITORY_ID,
                            NAME: services.NAME,
                            DESCRIPTION: services.DESCRIPTION,
                            CATEGORY_NAME: services.CATEGORY_NAME,
                            SUB_CATEGORY_NAME: services.SUB_CATEGORY_NAME,
                            SUB_CATEGORY_ID: services.SUB_CATEGORY_ID,
                            B2B_PRICE: services.B2B_PRICE,
                            B2C_PRICE: services.B2C_PRICE,
                            TECHNICIAN_COST: services.TECHNICIAN_COST,
                            VENDOR_COST: services.VENDOR_COST,
                            EXPRESS_COST: services.EXPRESS_COST,
                            IS_EXPRESS: services.IS_EXPRESS,
                            SERVICE_TYPE: services.SERVICE_TYPE,
                            DURATION_HOUR: services.DURATION_HOUR,
                            DURATION_MIN: services.DURATION_MIN,
                            PREPARATION_MINUTES: services.PREPARATION_MINUTES,
                            PREPARATION_HOURS: services.PREPARATION_HOURS,
                            UNIT_ID: services.UNIT_ID,
                            UNIT_NAME: services.UNIT_NAME,
                            SHORT_CODE: services.SHORT_CODE,
                            MAX_QTY: services.MAX_QTY,
                            TAX_ID: services.TAX_ID,
                            TAX_NAME: services.TAX_NAME,
                            START_TIME: services.START_TIME,
                            END_TIME: services.END_TIME,
                            IS_NEW: services.IS_NEW,
                            PARENT_ID: services.PARENT_ID,
                            IS_PARENT: services.IS_PARENT,
                            SERVICE_IMAGE: services.SERVICE_IMAGE,
                            IS_FOR_B2B: services.IS_FOR_B2B,
                            IS_JOB_CREATED_DIRECTLY: services.IS_JOB_CREATED_DIRECTLY,
                            IS_AVAILABLE: services.IS_AVAILABLE,
                            ORG_ID: services.ORG_ID,
                            QTY: services.QTY,
                            STATUS: services.STATUS,
                            HSN_CODE: services.HSN_CODE,
                            HSN_CODE_ID: services.HSN_CODE_ID,
                            SUPPORT_KEY: supportKey,
                            JOB_CLOSURE_TIME: services.JOB_CLOSURE_TIME, SITE_VISIT_REPORT_TYPE: services.SITE_VISIT_REPORT_TYPE, SERVICE_DETAILS_IMAGE: services.SERVICE_DETAILS_IMAGE, WARRANTY_ALLOWED: services.WARRANTY_ALLOWED,
                            GUARANTEE_ALLOWED: services.GUARANTEE_ALLOWED, WARRANTY_PERIOD: services.WARRANTY_PERIOD, GUARANTEE_PERIOD: services.GUARANTEE_PERIOD
                        };

                        SERVICE_LOGS.push(logData);

                        callback();
                    }
                );
            },
            (err) => {
                if (err) {
                    mm.rollbackConnection(connection);
                    res.status(400).send({
                        code: 400,
                        message: "Failed to save vendor information.",
                    });
                } else {
                    dbm.saveLog(SERVICE_LOGS, servicelog);
                    mm.commitConnection(connection);
                    res.status(200).send({
                        code: 200,
                        message: "Vendor information updated/inserted successfully.",
                    });
                }
            }
        );

    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};


exports.serviceDetails = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const pageIndex = req.body.pageIndex || 0;
    const pageSize = req.body.pageSize || 0;
    const sortKey = req.body.sortKey || 'SM.ID';
    const sortValue = req.body.sortValue || 'DESC';
    const filter = req.body.filter || '';
    const CUSTOMER_ID = req.body.CUSTOMER_ID || 0;

    if (mm.sanitizeFilter(filter) !== "0") {
        return res.send({
            code: 400,
            message: "Invalid filter parameter."
        });
    }

    try {
        const setParamsQuery = `
            SET @v_PAGE_INDEX = ?;
            SET @v_PAGE_SIZE = ?;
            SET @v_SORT_KEY = ?;
            SET @v_SORT_VALUE = ?;
            SET @v_FILTER = ?;
            SET @v_CUSTOMER_ID = ?;
        `;

        mm.executeQueryData(
            setParamsQuery,
            [pageIndex, pageSize, sortKey, sortValue, filter, CUSTOMER_ID],
            supportKey,
            () => {
                mm.executeQueryData(
                    "CALL sp_b2b_availability_serviceDetails()",
                    [],
                    supportKey,
                    (error, results) => {
                        if (error) {
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                            return res.send({
                                code: 400,
                                message: "Failed to get service details."
                            });
                        }

                        res.send({
                            code: 200,
                            message: "success",
                            count: results[0][0].cnt,
                            data: results[1]
                        });
                    }
                );
            }
        );
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.send({
            code: 500,
            message: "Something went wrong."
        });
    }
};


async function addGlobalData(data_Id, TYPE, supportKey) {
    try {

        const query = `CALL sp_b2bAvailabilityMapping_getGlobalServiceData(?, ?)`;

        mm.executeQueryData(query, [data_Id, TYPE], supportKey, async (error, results) => {

            if (error) {
                console.error(error);
                return;
            }

            let data = results[0][0];

            if (!data) {
                console.log("no data found");
                return;
            }

            let logData = {
                ID: data.ID,
                CATEGORY: data.CATEGORY,
                TITLE: data.TITLE,
                DATA: JSON.stringify(data.DATA),
                ROUTE: data.ROUTE,
                TERRITORY_ID: data.TERRITORY_ID
            };

            try {
                await dbm.addDatainGlobalmongo(
                    logData.ID,
                    logData.CATEGORY,
                    logData.TITLE,
                    logData.DATA,
                    logData.ROUTE,
                    logData.TERRITORY_ID
                );

                console.log("Data added/updated successfully.");

            } catch (err) {
                console.error("Error in add data in globalmongo:", err);
            }

        });

    } catch (error) {
        console.error(error);
    }
}


exports.updateB2BService = async (req, res) => {
    var data = reqDataService(req);
    var dataB2b = reqData(req);
    var TERRITORY_ID = req.body.TERRITORY_ID;
    var SERVICE_SKILLS = req.body.SERVICE_SKILLS;
    var UNIT_NAME = req.body.UNIT_NAME
    var TAX_NAME = req.body.TAX_NAME
    const SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME;
    const CATEGORY_NAME = req.body.CATEGORY_NAME;
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();
    const fileName = `${data.NAME.replace(/[\s\/,\.&@\$\%#!^\*\-\+=\\]/g, '_').replace(/_+$/, '').replace(/[^a-zA-Z0-9]$/, 'Service')}.html`;
    // const filePath = path.join('uploads/ServiceHtml', fileName);
    data.SERVICE_HTML_URL = fileName;
    console.log("\n\n\n req body:", data)
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

    try {
        const connection = mm.openConnection();
        data.CREATED_DATE = systemDate;
        data.SERVICE_ID = criteria.ID;
        mm.executeDML('CALL sp_checkServiceShortCode(?, ?)', [data.SHORT_CODE, criteria.ID], supportKey, connection, (error, resultsCheck1) => {
            console.log("resultsCheck1", resultsCheck1)
            var resultsCheck = resultsCheck1[0]
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to save service information..."
                });
            }
            else if (resultsCheck.length > 0) {
                mm.rollbackConnection(connection);
                return res.send({
                    "code": 300,
                    "message": "A service with the same short code already exists."
                });
            }
            else {
                mm.executeDML(`call sp_b2bAvailabilityMapping_updateB2BService(
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?
    )`, [
                    req.body.ID,
                    dataB2b.CUSTOMER_ID,
                    data.NAME,
                    data.DESCRIPTION,
                    data.SUB_CATEGORY_ID,
                    data.STATUS,
                    data.UNIT_ID,
                    data.SHORT_CODE,
                    data.MAX_QTY,
                    data.VENDOR_COST,
                    data.TECHNICIAN_COST,
                    data.TAX_ID,
                    data.DETAILS_DESIGNER,
                    data.IS_EXPRESS,
                    data.START_TIME,
                    data.END_TIME,
                    data.IS_NEW,
                    data.PARENT_ID,
                    data.IS_PARENT,
                    data.CLIENT_ID,
                    data.ORG_ID,
                    data.QTY,
                    data.SERVICE_TYPE,
                    data.PREPARATION_MINUTES,
                    data.PREPARATION_HOURS,
                    data.IS_FOR_B2B,
                    data.SERVICE_HTML_URL,
                    data.IS_JOB_CREATED_DIRECTLY,
                    data.HSN_CODE_ID,
                    data.HSN_CODE,
                    data.SERVICE_IMAGE,
                    data.SERVICE_DETAILS_IMAGE,
                    data.WARRANTY_ALLOWED,
                    data.GUARANTEE_ALLOWED,
                    data.WARRANTY_PERIOD,
                    data.GUARANTEE_PERIOD,
                    data.JOB_CLOSURE_TIME,
                    data.SITE_VISIT_REPORT_TYPE,
                    dataB2b.B2B_PRICE,
                    dataB2b.B2C_PRICE,
                    dataB2b.EXPRESS_COST,
                    data.DURARTION_HOUR,
                    data.DURARTION_MIN,
                    dataB2b.IS_AVAILABLE,
                    dataB2b.CATEGORY_NAME,
                    dataB2b.SUB_CATEGORY_NAME,
                    new Date(),
                    SERVICE_SKILLS
                ], supportKey, connection, (error, results) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.log(error);
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                        return res.send({
                            code: 400,
                            message: "Failed to save serviceItem information..."
                        });
                    } else {
                        var logType = data.IS_FOR_B2B == 1 ? 'B2B' : 'MAIN';
                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created a new service ${data.NAME}.`;
                        let logData = {
                            "LOG_DATE_TIME": systemDate,
                            "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": logType, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": criteria.ID, "CUSTOMER_ID": data.CUSTOMER_ID, "TERRITORY_ID": TERRITORY_ID, "NAME": data.NAME, "DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME,
                            "SUB_CATEGORY_ID": dataB2b.SUB_CATEGORY_ID, "B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE, "TECHNICIAN_COST": data.TECHNICIAN_COST,
                            "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
                            "IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": dataB2b.DURARTION_HOUR, "DURATION_MIN": dataB2b.DURARTION_MIN, "PREPARATION_MINUTES": data.PREPARATION_MINUTES, "PREPARATION_HOURS": data.PREPARATION_HOURS,
                            "UNIT_ID": data.UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": data.SHORT_CODE, "MAX_QTY": dataB2b.MAX_QTY, "TAX_ID": data.TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME,
                            "END_TIME": data.END_TIME, "IS_NEW": dataB2b.IS_NEW, "PARENT_ID": dataB2b.PARENT_ID, "IS_PARENT": dataB2b.IS_PARENT, "SERVICE_IMAGE": data.SERVICE_IMAGE, "IS_FOR_B2B": data.IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": dataB2b.IS_JOB_CREATED_DIRECTLY, "IS_AVAILABLE": 1, "ORG_ID": dataB2b.ORG_ID, "QTY": dataB2b.QTY, "STATUS": dataB2b.STATUS, "CLIENT_ID": 1, "HSN_CODE_ID": data.HSN_CODE_ID, "HSN_CODE": data.HSN_CODE,
                            "SERVICE_DETAILS_IMAGE": data.SERVICE_DETAILS_IMAGE, "WARRANTY_ALLOWED": data.WARRANTY_ALLOWED, "GUARANTEE_ALLOWED": data.GUARANTEE_ALLOWED, "WARRANTY_PERIOD": data.WARRANTY_PERIOD, "GUARANTEE_PERIOD": data.GUARANTEE_PERIOD, SITE_VISIT_REPORT_TYPE: data.SITE_VISIT_REPORT_TYPE
                        }
                        dbm.saveLog(logData, servicelog)
                        if (data.IS_FOR_B2B == 1) {
                            addGlobalData(criteria.ID, "B2B", supportKey)
                        } else {
                            addGlobalData(criteria.ID, "MAIN", supportKey)

                        }
                        mm.commitConnection(connection);
                        return res.send({
                            code: 200,
                            message: "ServiceItem information created and logged successfully."
                        });
                    }
                });
            }
        })
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.importB2BAvailabilityMapping = async (req, res) => {
    console.log("=== IMPORT B2B AVAILABILITY MAPPING STARTED ===");

    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE, authData } = req.body;

        if (!EXCEL_FILE_NAME) {
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });
        }

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }
        );

        const jsonData = cleanedRows.filter(row =>
            Object.values(row).some(v => String(v || "").trim() !== "")
        );

        if (!jsonData.length) {
            return res.status(200).json({ code: 200, message: "No data found" });
        }

        if (!authData || !authData.data || !authData.data.UserData || !authData.data.UserData.length) {
            return res.status(400).json({
                code: 400,
                message: "Invalid authData"
            });
        }

        // Immediate response
        res.status(200).json({
            code: 200,
            message: "B2B Availability Mapping import started...",
            EXCEL_MASTER_ID
        });

        const isEdit = IMPORT_TYPE === "E";
        const chunkSize = 50;
        const systemDate = mm.getSystemDate();

        let successCount = 0,
            skippedCount = 0,
            errorDetails = [],
            skippedDetails = [],
            successDetails = [],
            totalData = [],
            errorData = [];

        let SERVICE_LOGS = [];

        const normalize = v => v ? v.toString().trim() : "";

        const splitNameCode = (value = "") => {
            const match = value.match(/^(.*?)\s*\((.*?)\)$/);
            return {
                name: match ? match[1].trim() : value.trim(),
                code: match ? match[2].trim() : null
            };
        };

        // Column mapping
        const excelCustomerField = COLUMN_JSON.find(c => c.TABLE_FIELD === "CUSTOMER_ID")?.EXCEL_FIELD;
        const excelIdField = COLUMN_JSON.find(c => c.TABLE_FIELD === "ID")?.EXCEL_FIELD;
        const excelServiceField = COLUMN_JSON.find(c => c.TABLE_FIELD === "SERVICE_ID")?.EXCEL_FIELD;
        const excelShortCodeField = COLUMN_JSON.find(c => c.TABLE_FIELD === "SHORT_CODE")?.EXCEL_FIELD;
        const excelAvailableField = COLUMN_JSON.find(c => c.TABLE_FIELD === "IS_AVAILABLE")?.EXCEL_FIELD;
        const excelB2BPriceField = COLUMN_JSON.find(c => c.TABLE_FIELD === "B2B_PRICE")?.EXCEL_FIELD;
        const excelMaxQtyField = COLUMN_JSON.find(c => c.TABLE_FIELD === "MAX_QTY")?.EXCEL_FIELD;
        const excelJobClosureField = COLUMN_JSON.find(c => c.TABLE_FIELD === "JOB_CLOSURE_TIME")?.EXCEL_FIELD;
        const excelVisitReportField = COLUMN_JSON.find(c => c.TABLE_FIELD === "SITE_VISIT_REPORT_TYPE")?.EXCEL_FIELD;
        const excelDirectJobField = COLUMN_JSON.find(c => c.TABLE_FIELD === "IS_JOB_CREATED_DIRECTLY")?.EXCEL_FIELD;
        const excelTechicianCostField = COLUMN_JSON.find(c => c.TABLE_FIELD === "TECHNICIAN_COST")?.EXCEL_FIELD;
        const excelVendorCostField = COLUMN_JSON.find(c => c.TABLE_FIELD === "VENDOR_COST")?.EXCEL_FIELD;

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);
            for (let i = 0; i < chunk.length; i++) {
                const row = chunk[i];
                const rowNumber = start + i + 2;
                const connection = mm.openConnection();

                try {
                    let CUSTOMER_RAW = normalize(row[excelCustomerField]);
                    let SERVICE_RAW = normalize(row[excelServiceField]);

                    if (!CUSTOMER_RAW || !SERVICE_RAW) {
                        skipOperation("Missing Customer or Service", row, rowNumber, connection);
                        continue;
                    }

                    // ---------------- CUSTOMER ----------------
                    const custSplit = splitNameCode(CUSTOMER_RAW);
                    const customer = await runQuery(
                        `CALL sp_get_customer_by_name(?)`,
                        [custSplit.name],
                        supportKey,
                        connection
                    );

                    // Extract customer from result (handle stored procedure result structure)
                    const customerResult = customer && customer[0] ? customer[0] : [];
                    if (!customerResult.length) {
                        skipOperation(`Customer not found: ${custSplit.name}`, row, rowNumber, connection);
                        continue;
                    }

                    const CUSTOMER_ID = customerResult[0].CUSTOMER_DETAILS_ID;

                    // ---------------- SERVICE ----------------
                    const serviceSplit = splitNameCode(SERVICE_RAW);
                    const service = await runQuery(
                        `CALL sp_get_service_by_name_or_code(?, ?)`,
                        [serviceSplit.name, serviceSplit.code],
                        supportKey,
                        connection
                    );

                    // Extract service from result
                    const serviceResult = service && service[0] ? service[0] : [];
                    if (!serviceResult.length) {
                        skipOperation(`Service not found: ${serviceSplit.name}`, row, rowNumber, connection);
                        continue;
                    }

                    let isJobCreatedDirectly = normalize(row[excelDirectJobField]) === "Yes" ? 1 : 0;
                    const svc = serviceResult[0];

                    const services = {
                        SERVICE_ID: svc.ID,
                        NAME: svc.NAME,
                        DESCRIPTION: svc.DESCRIPTION,
                        CATEGORY_NAME: svc.CATEGORY_NAME,
                        SUB_CATEGORY_NAME: svc.SUB_CATEGORY_NAME,
                        B2B_PRICE: normalize(row[excelB2BPriceField]) || svc.B2B_PRICE,
                        B2C_PRICE: svc.B2C_PRICE,
                        TECHNICIAN_COST: isEdit ? normalize(row[excelTechicianCostField]) : svc.TECHNICIAN_COST,
                        VENDOR_COST: isEdit ? normalize(row[excelVendorCostField]) : svc.VENDOR_COST,
                        EXPRESS_COST: svc.EXPRESS_COST,
                        IS_EXPRESS: svc.IS_EXPRESS,
                        SERVICE_TYPE: svc.SERVICE_TYPE,
                        PREPARATION_MINUTES: svc.PREPARATION_MINUTES,
                        PREPARATION_HOURS: svc.PREPARATION_HOURS,
                        UNIT_ID: svc.UNIT_ID,
                        TAX_ID: svc.TAX_ID,
                        SHORT_CODE: svc.SHORT_CODE,
                        MAX_QTY: isEdit ? normalize(row[excelMaxQtyField]) : svc.MAX_QTY,
                        IS_AVAILABLE: isEdit ? normalize(row[excelAvailableField]) === "Yes" ? 1 : 0 : svc.STATUS,
                        IS_JOB_CREATED_DIRECTLY: isEdit ? isJobCreatedDirectly : svc.IS_JOB_CREATED_DIRECTLY,
                        JOB_CLOSURE_TIME: isEdit ? normalize(row[excelJobClosureField]) : svc.JOB_CLOSURE_TIME,
                        SITE_VISIT_REPORT_TYPE: isEdit ? normalize(row[excelVisitReportField]) : svc.SITE_VISIT_REPORT_TYPE,
                        IS_FOR_B2B: 1,
                        SERVICE_TYPE: svc.SERVICE_TYPE ? svc.SERVICE_TYPE : "B",
                        SERVICE_DETAILS_IMAGE: svc.SERVICE_DETAILS_IMAGE,
                        WARRANTY_ALLOWED: svc.WARRANTY_ALLOWED,
                        GUARANTEE_ALLOWED: svc.GUARANTEE_ALLOWED,
                        WARRANTY_PERIOD: svc.WARRANTY_PERIOD,
                        GUARANTEE_PERIOD: svc.GUARANTEE_PERIOD,
                        SERVICE_IMAGE: svc.SERVICE_IMAGE,
                        CLIENT_ID: 1,
                        UMIT_ID: svc.UNIT_ID,
                        HSN_CODE_ID: svc.HSN_CODE_ID,
                        HSN_CODE: svc.HSN_CODE,
                        START_TIME: svc.START_TIME,
                        END_TIME: svc.END_TIME
                    };

                    // ---------------- CHECK EXISTENCE ----------------
                    const mappingId = isEdit ? normalize(row[excelIdField]) : null;
                    const exists = await runQuery(
                        `CALL sp_check_b2b_mapping_exists(?, ?, ?, ?)`,
                        [
                            CUSTOMER_ID,
                            services.SERVICE_ID,
                            mappingId,
                            isEdit
                        ],
                        supportKey,
                        connection
                    );

                    const existsResult = exists && exists[0] ? exists[0] : [];

                    if (isEdit && !existsResult.length) {
                        skipOperation("Record not found for update", row, rowNumber, connection);
                        continue;
                    }

                    if (!isEdit && existsResult.length) {
                        skipOperation(`This service is already mapped for this customer ${custSplit.name}`, row, rowNumber, connection);
                        continue;
                    }

                    // ---------------- INSERT / UPDATE USING SPs ----------------
                    if (isEdit) {
                        await runQuery(
                            `CALL sp_update_b2b_mapping(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                existsResult[0].ID,
                                CUSTOMER_ID,
                                services.SERVICE_ID,
                                services.IS_AVAILABLE,
                                services.B2B_PRICE ? services.B2B_PRICE : 0,
                                services.MAX_QTY ? services.MAX_QTY : 0,
                                services.IS_JOB_CREATED_DIRECTLY,
                                services.JOB_CLOSURE_TIME ? services.JOB_CLOSURE_TIME : null,
                                services.SITE_VISIT_REPORT_TYPE,
                                1,
                                services.TECHNICIAN_COST ? services.TECHNICIAN_COST : 0,
                                services.VENDOR_COST ? services.VENDOR_COST : 0
                            ],
                            supportKey,
                            connection
                        );
                    } else {
                        await runQuery(
                            `CALL sp_insert_b2b_mapping(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                CUSTOMER_ID,
                                services.SERVICE_ID,
                                services.IS_AVAILABLE ? 1 : 0,
                                services.START_TIME,
                                services.END_TIME,
                                services.B2B_PRICE,
                                services.B2C_PRICE,
                                services.TECHNICIAN_COST,
                                services.VENDOR_COST,
                                services.EXPRESS_COST,
                                services.IS_EXPRESS ? 1 : 0,
                                services.NAME,
                                services.DESCRIPTION,
                                services.SERVICE_IMAGE,
                                services.SERVICE_TYPE,
                                services.PREPARATION_MINUTES,
                                services.PREPARATION_HOURS,
                                services.CLIENT_ID,
                                services.CATEGORY_NAME,
                                services.SUB_CATEGORY_NAME,
                                services.HSN_CODE_ID,
                                services.HSN_CODE,
                                services.UMIT_ID,
                                services.TAX_ID,
                                services.JOB_CLOSURE_TIME,
                                services.SITE_VISIT_REPORT_TYPE,
                                services.SERVICE_DETAILS_IMAGE,
                                services.WARRANTY_ALLOWED,
                                services.GUARANTEE_ALLOWED,
                                services.WARRANTY_PERIOD,
                                services.GUARANTEE_PERIOD,
                                services.IS_JOB_CREATED_DIRECTLY,
                                services.MAX_QTY,
                                services.IS_FOR_B2B,
                                services.SHORT_CODE
                            ],
                            supportKey,
                            connection
                        );
                    }

                    // ---------------- SERVICE LOG ----------------
                    const ACTION_DETAILS = `${authData.data.UserData[0].NAME} has ${isEdit ? 'updated' : 'created'} service ${services.NAME}.`;

                    SERVICE_LOGS.push({
                        LOG_DATE_TIME: systemDate,
                        LOG_TEXT: ACTION_DETAILS,
                        LOG_TYPE: 'B2BBL',
                        USER_ID: authData.data.UserData[0].USER_ID,
                        ADDED_BY: authData.data.UserData[0].NAME,
                        SERVICE_ID: services.SERVICE_ID,
                        CUSTOMER_ID: CUSTOMER_ID,
                        NAME: services.NAME,
                        DESCRIPTION: services.DESCRIPTION,
                        CATEGORY_NAME: services.CATEGORY_NAME,
                        SUB_CATEGORY_NAME: services.SUB_CATEGORY_NAME,
                        B2B_PRICE: services.B2B_PRICE,
                        B2C_PRICE: services.B2C_PRICE,
                        TECHNICIAN_COST: services.TECHNICIAN_COST,
                        VENDOR_COST: services.VENDOR_COST,
                        SHORT_CODE: services.SHORT_CODE,
                        MAX_QTY: services.MAX_QTY,
                        IS_JOB_CREATED_DIRECTLY: services.IS_JOB_CREATED_DIRECTLY,
                        IS_AVAILABLE: services.IS_AVAILABLE,
                        SUPPORT_KEY: supportKey
                    });

                    mm.commitConnection(connection);

                    successCount++;
                    successDetails.push({ rowNumber, row, IMPORT_STATUS: "Success" });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    mm.rollbackConnection(connection);
                    errorDetails.push({ rowNumber, row, reason: error.message });
                    errorData.push({ rowNumber, row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                }
            }

            // Helper function for skip operations
            function skipOperation(reason, row, rowNumber, connection) {
                skippedCount++;
                skippedDetails.push({ rowNumber, row, reason });
                totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                mm.rollbackConnection(connection);
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

        // Save SERVICE LOGS
        if (SERVICE_LOGS.length) {
            dbm.saveLog(SERVICE_LOGS, servicelog);
        }

        const response = {
            code: 200,
            message: "B2B Availability Mapping import completed.",
            totalRecords: jsonData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: errorDetails.length,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            totalData,
            errorData
        };

        const fs = require("fs");
        const path = require("path");

        const fileName = `${EXCEL_MASTER_ID}.json`;
        const filePath = path.join(
            __dirname,
            "../../uploads/ExcelImporResponse/",
            fileName
        );

        await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
            STATUS: "Completed",
            PROGRESS: 100,
            TOTAL_RECORDS: jsonData.length,
            SUCCESSFUL_RECORDS: successCount,
            SKIPPED_RECORDS: skippedCount,
            FAILED_RECORDS: errorDetails.length,
            RESPONSE: fileName
        });

        fs.writeFileSync(filePath, JSON.stringify(response, null, 2), "utf8");

        console.log("=== IMPORT B2B AVAILABILITY MAPPING COMPLETED ===");

    } catch (error) {
        console.error("FATAL IMPORT ERROR:", error);
    }
};


const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};
