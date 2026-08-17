const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const path = require('path');
const servicelog = require("../../modules/serviceLog")
const dbm = require('../../utilities/dbMongo');
const excelMaster = require("../../modules/excelImportMaster");
const mysql = require("mysql");
const xlsx = require('xlsx')
const applicationkey = process.env.APPLICATION_KEY;
var serviceMaster = "service_master";
var viewserviceMaster = "view_" + serviceMaster;


function reqData(req) {

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
        SERVICE_TYPE: req.body.SERVICE_TYPE ? req.body.SERVICE_TYPE : 'B',
        PREPARATION_MINUTES: req.body.PREPARATION_MINUTES,
        PREPARATION_HOURS: req.body.PREPARATION_HOURS,
        IS_FOR_B2B: req.body.IS_FOR_B2B,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        SERVICE_HTML_URL: req.body.SERVICE_HTML_URL,
        IS_JOB_CREATED_DIRECTLY: req.body.IS_JOB_CREATED_DIRECTLY ? '1' : '0',
        CREATED_DATE: req.body.CREATED_DATE,
        HSN_CODE_ID: req.body.HSN_CODE_ID,
        HSN_CODE: req.body.HSN_CODE,
        SERVICE_DETAILS_IMAGE: req.body.SERVICE_DETAILS_IMAGE,
        WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
        GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
        WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
        GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
        JOB_CLOSURE_TIME: req.body.JOB_CLOSURE_TIME,
        SITE_VISIT_REPORT_TYPE: req.body.SITE_VISIT_REPORT_TYPE



    }

    return data;
}

function reqDataB2b(req) {

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
        SERVICE_TYPE: req.body.SERVICE_TYPE ? req.body.SERVICE_TYPE : 'B',
        PREPARATION_MINUTES: req.body.PREPARATION_MINUTES,
        PREPARATION_HOURS: req.body.PREPARATION_HOURS,
        HSN_CODE_ID: req.body.HSN_CODE_ID,
        HSN_CODE: req.body.HSN_CODE,
        SERVICE_DETAILS_IMAGE: req.body.SERVICE_DETAILS_IMAGE,
        WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
        GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
        WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
        GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
        JOB_CLOSURE_TIME: req.body.JOB_CLOSURE_TIME,
        SITE_VISIT_REPORT_TYPE: req.body.SITE_VISIT_REPORT_TYPE,
        IS_FOR_B2B: req.body.IS_FOR_B2B ? '1' : '0',
        SHORT_CODE: req.body.SHORT_CODE,
        IS_JOB_CREATED_DIRECTLY: req.body.IS_JOB_CREATED_DIRECTLY ? '1' : '0',
        MAX_QTY: req.body.MAX_QTY,
        CLIENT_ID: req.body.CLIENT_ID,
        UNIT_ID: req.body.UNIT_ID,
        TAX_ID: req.body.TAX_ID


    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('SERVICE_ID').isInt().optional(),
        body('ITEM_CODE').optional(),
        body('UNIT_ID').optional(),
        body('SEQ_NO').isInt().optional(),
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
                setContext + `CALL sp_service_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get serviceItem count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 89,
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

exports.getServices = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID ? req.body.SUB_CATEGORY_ID : '';


    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_SUB_CATEGORY_ID = ${SUB_CATEGORY_ID || 0};
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_service_getBySubCategory()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get serviceItem count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
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

exports.getData = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let ID = req.body.ID;
    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_ID = ${ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);


    if (!ID) {
        res.send({
            "code": 400,
            "message": "ID is required."
        });
        return;
    }

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_service_getById()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get serviceItem count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
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


exports.getPoppulerServices = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = 0;
    var pageSize = 2;
    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';

    let TERRITORY_ID = 0;
    let CUSTOMER_ID = req.params.CUSTOMER_ID ? req.params.CUSTOMER_ID : 0;
    let CUSTOMER_TYPE = req.params.CUSTOMER_TYPE ? req.params.CUSTOMER_TYPE : "I";

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID}; 
        SET @v_TERRITORY_ID = ${TERRITORY_ID}; 
        SET @v_CUSTOMER_TYPE = '${CUSTOMER_TYPE}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_service_getPopularServices()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).send({
                            "message": "Failed to get serviceItem count.",
                        });
                    } else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        } else {
            console.log("\n\n\n\n\n\nasdasdsadjasdkjhashjsad");
            res.status(400).send({
                "message": "Invalid filter parameter or territory id or customerId"
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};


exports.getPoppulerServicesForWeb = (req, res) => {
    console.log(req.body);

    var TERRITORY_ID = req.body.TERRITORY_ID;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID;
    var SEARCHKEY = req.body.SEARCHKEY;
    var PARENT_ID = req.body.PARENT_ID;
    var CUSTOMER_TYPE = req.body.CUSTOMER_TYPE ? req.body.CUSTOMER_TYPE : "I";
    var supportKey = req.headers['supportkey'];
    var deviceid = req.headers['deviceid'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
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
        SET @v_TERRITORY_ID = ${TERRITORY_ID};
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID};
        SET @v_SUB_CATEGORY_ID = ${SUB_CATEGORY_ID};
        SET @v_SEARCHKEY = ${SEARCHKEY};
        SET @v_PARENT_ID = ${PARENT_ID};
        SET @v_SEARCHKEY = ${SEARCHKEY}; 
        SET @v_PARENT_ID = ${PARENT_ID}; 
        SET @v_CUSTOMER_TYPE = '${CUSTOMER_TYPE}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter); s
    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }
    try {

        if (((CUSTOMER_TYPE == 'I' && TERRITORY_ID) || (customerCategoryType != 'I' && CUSTOMER_ID))) {
            mm.executeQueryData(
                setContext + `CALL sp_service_getPopularServicesForWeb(?,?,?,?)`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get services count.",
                        });
                    } else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing- teritory_id, subcategory_id ."
            });
        }
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            "code": 500,
            "message": "Something went wrong.",
        });
    }
};

exports.create = async (req, res) => {
    const data = reqData(req);
    const dataB2b = reqDataB2b(req);
    const TERRITORY_ID = req.body.TERRITORY_ID;
    const SERVICE_SKILLS = req.body.SERVICE_SKILLS;
    const UNIT_NAME = req.body.UNIT_NAME;
    const TAX_NAME = req.body.TAX_NAME;
    const SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME;
    const CATEGORY_NAME = req.body.CATEGORY_NAME;
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    // Create file name
    const fileName = `${data.NAME.replace(/[\s\/,\.&@\$\%#!^\*\-\+=\\]/g, '_').replace(/_+$/, '').replace(/[^a-zA-Z0-9]$/, 'Service')}.html`;
    data.SERVICE_HTML_URL = fileName;

    console.log("\n\n\n req body:", data);

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        data.CREATED_DATE = systemDate;

        // Convert SERVICE_SKILLS array to JSON string for SP
        let serviceSkillsJson = '[]';
        if (SERVICE_SKILLS && Array.isArray(SERVICE_SKILLS) && SERVICE_SKILLS.length > 0) {
            serviceSkillsJson = JSON.stringify(SERVICE_SKILLS);
        }

        // Call stored procedure (includes service skills)
        mm.executeQueryData(
            `CALL sp_service_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                // Service data
                data.NAME,
                data.DESCRIPTION,
                data.SUB_CATEGORY_ID,
                data.B2B_PRICE,
                data.B2C_PRICE,
                data.EXPRESS_COST,
                data.DURARTION_HOUR,
                data.DURARTION_MIN,
                data.SERVICE_IMAGE,
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
                data.PARENT_ID || 0,
                data.IS_PARENT,
                data.CLIENT_ID,
                data.ORG_ID,
                data.QTY,
                data.SERVICE_TYPE,
                data.PREPARATION_MINUTES,
                data.PREPARATION_HOURS,
                data.IS_FOR_B2B,
                data.CUSTOMER_ID,
                data.SERVICE_HTML_URL,
                data.IS_JOB_CREATED_DIRECTLY,
                data.CREATED_DATE,
                data.HSN_CODE_ID,
                data.HSN_CODE,
                data.SERVICE_DETAILS_IMAGE,
                data.WARRANTY_ALLOWED,
                data.GUARANTEE_ALLOWED,
                data.WARRANTY_PERIOD,
                data.GUARANTEE_PERIOD,
                data.JOB_CLOSURE_TIME,
                data.SITE_VISIT_REPORT_TYPE,

                // B2B data
                dataB2b.CUSTOMER_ID,
                dataB2b.IS_AVAILABLE,
                dataB2b.START_TIME,
                dataB2b.END_TIME,
                dataB2b.B2B_PRICE,
                dataB2b.B2C_PRICE,
                dataB2b.TECHNICIAN_COST,
                dataB2b.VENDOR_COST,
                dataB2b.EXPRESS_COST,
                dataB2b.CATEGORY_NAME,
                dataB2b.SUB_CATEGORY_NAME,
                dataB2b.IS_EXPRESS,
                dataB2b.NAME,
                dataB2b.DESCRIPTION,
                dataB2b.SERVICE_IMAGE,
                dataB2b.SERVICE_TYPE,
                dataB2b.PREPARATION_MINUTES,
                dataB2b.PREPARATION_HOURS,
                dataB2b.HSN_CODE_ID,
                dataB2b.HSN_CODE,
                dataB2b.JOB_CLOSURE_TIME,
                dataB2b.SITE_VISIT_REPORT_TYPE,
                dataB2b.CLIENT_ID,    
                dataB2b.UNIT_ID,
                dataB2b.TAX_ID,
                dataB2b.SERVICE_DETAILS_IMAGE,
                dataB2b.WARRANTY_ALLOWED,
                dataB2b.GUARANTEE_ALLOWED,
                dataB2b.WARRANTY_PERIOD,
                dataB2b.GUARANTEE_PERIOD,
                dataB2b.IS_JOB_CREATED_DIRECTLY,
                dataB2b.MAX_QTY,
                dataB2b.IS_FOR_B2B,
                dataB2b.SHORT_CODE,
              

                // Service skills
                serviceSkillsJson
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({
                        "code": 400,
                        "message": "Failed to save service information..."
                    });
                }

                const r = result[0][0];

                if (r.code === 300) {
                    return res.send({
                        "code": 300,
                        "message": r.message
                    });
                }

                if (r.code !== 200) {
                    return res.send({
                        "code": 400,
                        "message": "Failed to save service."
                    });
                }

                const serviceId = r.SERVICE_ID;
                const b2bId = r.B2B_ID;

                // MongoDB logging (kept in API)
                const logType = data.IS_FOR_B2B == 1 ? 'B2B' : 'MAIN';
                const logCategory = data.IS_FOR_B2B == 1 ? "b2bAvailabilityMapping" : "serviceMaster";
                const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created a new service ${data.NAME}.`;

                const logData = {
                    "LOG_DATE_TIME": systemDate,
                    "LOG_TEXT": ACTION_DETAILS,
                    "LOG_TYPE": logType,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "ADDED_BY": req.body.authData.data.UserData[0].NAME,
                    "SERVICE_ID": serviceId,
                    "CUSTOMER_ID": data.CUSTOMER_ID,
                    "TERRITORY_ID": TERRITORY_ID,
                    "NAME": data.NAME,
                    "DESCRIPTION": data.DESCRIPTION,
                    "CATEGORY_NAME": CATEGORY_NAME,
                    "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME,
                    "SUB_CATEGORY_ID": data.SUB_CATEGORY_ID,
                    "B2B_PRICE": data.B2B_PRICE,
                    "B2C_PRICE": data.B2C_PRICE,
                    "TECHNICIAN_COST": data.TECHNICIAN_COST,
                    "VENDOR_COST": data.VENDOR_COST,
                    "EXPRESS_COST": data.EXPRESS_COST,
                    "IS_EXPRESS": data.IS_EXPRESS,
                    "SERVICE_TYPE": data.SERVICE_TYPE,
                    "DURATION_HOUR": data.DURARTION_HOUR,
                    "DURATION_MIN": data.DURARTION_MIN,
                    "PREPARATION_MINUTES": data.PREPARATION_MINUTES,
                    "PREPARATION_HOURS": data.PREPARATION_HOURS,
                    "UNIT_ID": data.UNIT_ID,
                    "UNIT_NAME": UNIT_NAME,
                    "SHORT_CODE": data.SHORT_CODE,
                    "MAX_QTY": data.MAX_QTY,
                    "TAX_ID": data.TAX_ID,
                    "TAX_NAME": TAX_NAME,
                    "START_TIME": data.START_TIME,
                    "END_TIME": data.END_TIME,
                    "IS_NEW": data.IS_NEW,
                    "PARENT_ID": data.PARENT_ID,
                    "IS_PARENT": data.IS_PARENT,
                    "SERVICE_IMAGE": data.SERVICE_IMAGE,
                    "IS_FOR_B2B": data.IS_FOR_B2B,
                    "IS_JOB_CREATED_DIRECTLY": data.IS_JOB_CREATED_DIRECTLY,
                    "IS_AVAILABLE": 1,
                    "ORG_ID": data.ORG_ID,
                    "QTY": data.QTY,
                    "STATUS": data.STATUS,
                    "CLIENT_ID": 1,
                    "HSN_CODE_ID": data.HSN_CODE_ID,
                    "HSN_CODE": data.HSN_CODE,
                    "SERVICE_DETAILS_IMAGE": data.SERVICE_DETAILS_IMAGE,
                    "WARRANTY_ALLOWED": data.WARRANTY_ALLOWED,
                    "GUARANTEE_ALLOWED": data.GUARANTEE_ALLOWED,
                    "WARRANTY_PERIOD": data.WARRANTY_PERIOD,
                    "GUARANTEE_PERIOD": data.GUARANTEE_PERIOD,
                    "SITE_VISIT_REPORT_TYPE": data.SITE_VISIT_REPORT_TYPE
                };

                // Save to MongoDB (kept in API)
                dbm.saveLog(logData, servicelog);

                // Call addGlobalData
                if (data.IS_FOR_B2B == 1) {
                    addGlobalData(b2bId, "B2B", supportKey);
                } else {
                    addGlobalData(serviceId, "MAIN", supportKey);
                }

                return res.send({
                    "code": 200,
                    "message": "ServiceItem information created and logged successfully."
                });
            }
        );
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME;
    const CATEGORY_NAME = req.body.CATEGORY_NAME;
    const TERRITORY_ID = req.body.TERRITORY_ID;
    const data = reqData(req);
    const oldservicename = req.body.OLD_SERVICE_NAME;
    const UNIT_NAME = req.body.UNIT_NAME;
    const TAX_NAME = req.body.TAX_NAME;
    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        const id = req.body.ID;
        const serviceName = data.NAME || 'service';

        // Create new file name if service name changed
        const fileName = `${serviceName.replace(/[\s\/,\.&@\$\%#!^\*\-\+=\\]/g, '_').replace(/_+$/, '').replace(/[^a-zA-Z0-9]$/, 'Service')}.html`;
        data.SERVICE_HTML_URL = fileName;

        // Call stored procedure
        mm.executeQueryData(
            `CALL sp_service_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.NAME,
                data.DESCRIPTION,
                data.SUB_CATEGORY_ID,
                data.B2B_PRICE,
                data.B2C_PRICE,
                data.EXPRESS_COST,
                data.DURARTION_HOUR,
                data.DURARTION_MIN,
                data.SERVICE_IMAGE,
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
                data.CUSTOMER_ID,
                data.SERVICE_HTML_URL,
                data.IS_JOB_CREATED_DIRECTLY,
                data.HSN_CODE_ID,
                data.HSN_CODE,
                data.SERVICE_DETAILS_IMAGE,
                data.WARRANTY_ALLOWED,
                data.GUARANTEE_ALLOWED,
                data.WARRANTY_PERIOD,
                data.GUARANTEE_PERIOD,
                data.JOB_CLOSURE_TIME,
                data.SITE_VISIT_REPORT_TYPE
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({
                        "code": 400,
                        "message": "Failed to save service information..."
                    });
                }

                const r = result[0][0];

                if (r.code === 300) {
                    return res.send({
                        "code": 300,
                        "message": r.message
                    });
                }

                if (r.code !== 200) {
                    return res.send({
                        "code": 400,
                        "message": "Failed to update service."
                    });
                }

                // MongoDB logging (kept in API)
                const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of ${data.NAME || oldservicename}.`;
                const logType = data.IS_FOR_B2B == 1 ? 'B2B' : 'MAIN';

                const logData = {
                    "LOG_DATE_TIME": systemDate,
                    "LOG_TEXT": ACTION_DETAILS,
                    "LOG_TYPE": logType,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "ADDED_BY": req.body.authData.data.UserData[0].NAME,
                    "SERVICE_ID": id,
                    "CUSTOMER_ID": data.CUSTOMER_ID,
                    "TERRITORY_ID": TERRITORY_ID,
                    "NAME": data.NAME || oldservicename,
                    "DESCRIPTION": data.DESCRIPTION,
                    "CATEGORY_NAME": CATEGORY_NAME,
                    "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME,
                    "SUB_CATEGORY_ID": data.SUB_CATEGORY_ID,
                    "B2B_PRICE": data.B2B_PRICE,
                    "B2C_PRICE": data.B2C_PRICE,
                    "TECHNICIAN_COST": data.TECHNICIAN_COST,
                    "VENDOR_COST": data.VENDOR_COST,
                    "EXPRESS_COST": data.EXPRESS_COST,
                    "IS_EXPRESS": data.IS_EXPRESS,
                    "SERVICE_TYPE": data.SERVICE_TYPE,
                    "DURATION_HOUR": data.DURARTION_HOUR,
                    "DURATION_MIN": data.DURARTION_MIN,
                    "PREPARATION_MINUTES": data.PREPARATION_MINUTES,
                    "PREPARATION_HOURS": data.PREPARATION_HOURS,
                    "UNIT_ID": data.UNIT_ID,
                    "UNIT_NAME": UNIT_NAME,
                    "SHORT_CODE": data.SHORT_CODE,
                    "MAX_QTY": data.MAX_QTY,
                    "TAX_ID": data.TAX_ID,
                    "TAX_NAME": TAX_NAME,
                    "START_TIME": data.START_TIME,
                    "END_TIME": data.END_TIME,
                    "IS_NEW": data.IS_NEW,
                    "PARENT_ID": data.PARENT_ID,
                    "IS_PARENT": data.IS_PARENT,
                    "SERVICE_IMAGE": data.SERVICE_IMAGE,
                    "IS_FOR_B2B": data.IS_FOR_B2B,
                    "IS_JOB_CREATED_DIRECTLY": data.IS_JOB_CREATED_DIRECTLY,
                    "IS_AVAILABLE": 1,
                    "ORG_ID": data.ORG_ID,
                    "QTY": data.QTY,
                    "STATUS": data.STATUS,
                    "CLIENT_ID": 1,
                    "HSN_CODE_ID": data.HSN_CODE_ID,
                    "HSN_CODE": data.HSN_CODE,
                    "SERVICE_DETAILS_IMAGE": data.SERVICE_DETAILS_IMAGE,
                    "WARRANTY_ALLOWED": data.WARRANTY_ALLOWED,
                    "GUARANTEE_ALLOWED": data.GUARANTEE_ALLOWED,
                    "WARRANTY_PERIOD": data.WARRANTY_PERIOD,
                    "GUARANTEE_PERIOD": data.GUARANTEE_PERIOD,
                    "SITE_VISIT_REPORT_TYPE": data.SITE_VISIT_REPORT_TYPE
                };

                // Save to MongoDB (kept in API)
                dbm.saveLog(logData, servicelog);

                // Call addGlobalData
                addGlobalData(id, "MAIN", supportKey);

                return res.send({
                    "code": 200,
                    "message": "ServiceItem information updated and logged successfully."
                });
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.serviceHirarchy = (req, res) => {
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
                setContext + `CALL sp_service_getHierarchy()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get serviceItem count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
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

exports.serviceList = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var TERRITORY_ID = req.body.TERRITORY_ID;
    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_TERRITORY_ID = ${TERRITORY_ID || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_service_getList()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get serviceItem count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
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

exports.unMappedSkills = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var SERVICE_ID = req.body.SERVICE_ID;
    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_SERVICE_ID = ${SERVICE_ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0" && SERVICE_ID != '') {
            mm.executeQueryData(
                setContext + `CALL sp_service_getUnmappedSkills()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).send({
                            "code": 400,
                            "message": "Failed to get skill count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.status(400).send({
                "code": 400,
                "message": "Invalid filter parameter or service id."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};


exports.getMappedServices = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    const TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : '';
    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_TERRITORY_ID = ${TERRITORY_ID || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    try {

        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_service_getMappedServices()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get serviceCatalog count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        } else {
            res.send({
                "code": 400,
                "message": "Invalid filter.",
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

exports.b2bserviceList = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
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
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID};
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (CUSTOMER_ID) {
            if (IS_FILTER_WRONG == "0") {
                mm.executeQueryData(
                    setContext + `CALL sp_service_getB2BList()`,
                    [],
                    supportKey,
                    (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get serviceItem count.",
                            });
                        }
                        else {
                            const resultSets = results.filter(r => Array.isArray(r));
                            const countResult = resultSets[0] || [];
                            const dataResult = resultSets[1] || [];

                            return res.status(200).json({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 16,
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
        } else {
            res.send({
                "code": 400,
                "message": "Invalid parameter."
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

exports.getCategoriesHierarchy = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var deviceid = req.headers['deviceid'];

        mm.executeQueryData(
            `CALL sp_service_getCategoriesHierarchy()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    res.send({
                        "code": 400,
                        "message": "Failed to get Data",
                    });
                }
                else {
                    var json = results[0] && results[0][0] ? results[0][0].data : null;
                    if (json) {
                        json = json.replace(/\\/g, '');
                        json = json.replace(/\"true\"/g, true).replace(/\"false\"/g, false);
                    }

                    res.send({
                        "code": 200,
                        "message": "success",
                        data: json ? JSON.parse(json) : []
                    });
                }
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            "code": 500,
            "message": "Something went wrong.",
        });
    }
};

exports.getServiceLogs = async (req, res) => {
    try {
        const {
            pageIndex = 1,
            pageSize = 10,
            sortKey = "_id",
            sortValue = "DESC",
            searchValue = "",
        } = req.body;

        const sortOrder = sortValue.toLowerCase() === "desc" ? -1 : 1;
        const skip = (pageIndex - 1) * pageSize;

        let baseFilter = req.body.filter || {};
        // console.log("Base Filter Before Search:", JSON.stringify(baseFilter, null, 2));

        // If searchValue is provided
        if (searchValue) {
            const searchFilter = {
                $or: req.body.searchFields.map(field => ({
                    [field]: { $regex: searchValue, $options: "i" },
                })),
            };

            // Preserve existing filter with `$and`
            baseFilter = {
                $and: [
                    baseFilter,
                    searchFilter,
                ],
            };
        }

        // console.log("Final Filter After Search:", JSON.stringify(baseFilter, null, 2));

        const totalCount = await servicelog.countDocuments(baseFilter);
        const data = await servicelog.find(baseFilter)
            .sort({ [sortKey]: sortOrder })
            .skip(skip)
            .limit(parseInt(pageSize));

        res.status(200).json({
            "code": 200,
            "message": "success",
            count: totalCount,
            data,
            "TAB_ID": "678c8276d5fa6d645850e972"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong.",
        });
    }
};

function addGlobalData(data_Id, TYPE, supportKey) {
    try {
        console.log("\n\n\n\n IN addGlobalData");

        mm.executeQueryData(
            `CALL sp_get_global_data_service(?, ?)`,
            [data_Id, TYPE],
            supportKey,
            (error, results5) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log("data retrieved");

                    // SP returns nested array
                    let data = results5[0];

                    if (data.length > 0) {
                        let row = data[0];

                        let logData = {
                            ID: data_Id,
                            CATEGORY: "Service",
                            TITLE: row.NAME,
                            DATA: JSON.stringify(row),
                            ROUTE: "/masters/service-master",
                            TERRITORY_ID: 0
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
        console.error(error);
    }
}

exports.getServiceHirechy = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var deviceid = req.headers['deviceid'];
        var TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : 0;
        const setContext = `SET @v_TERRITORY_ID = ${TERRITORY_ID};`;
        mm.executeQueryData(
            setContext + `CALL sp_service_getServiceHierarchy()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to get Data",
                    });
                } else {
                    // Extract categories from results
                    const categories = results[0] && results[0][0] ? results[0][0].categories : null;

                    // Clean up the response to remove any children that have no valid data
                    let cleanedResults = [];
                    if (categories) {
                        try {
                            const parsedCategories = JSON.parse(categories);
                            cleanedResults = parsedCategories.filter(categoryItem => {
                                if (categoryItem.children) {
                                    categoryItem.children = categoryItem.children.filter(subchild => {
                                        // Check if children exists (previously servicechildren)
                                        if (subchild.children && subchild.children.length > 0) {
                                            return true; // Keep subchild if it has children
                                        }
                                        return false; // Remove subchild if it has no children
                                    });
                                    return categoryItem.children.length > 0; // Keep category item if it has children
                                }
                                return false; // Remove category if it has no valid children
                            });
                        } catch (parseError) {
                            console.log("Error parsing JSON:", parseError);
                            cleanedResults = [];
                        }
                    }

                    res.send({
                        "code": 200,
                        "message": "Success",
                        data: cleanedResults,
                    });
                }
            }
        );

    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            "code": 500,
            "message": "Something went wrong.",
        });
    }
};

exports.getb2bServiceHirechy = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var deviceid = req.headers['deviceid'];
        var CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : 0;
        const setContext = `SET @v_CUSTOMER_ID = ${CUSTOMER_ID};`;
        if (CUSTOMER_ID) {
            mm.executeQueryData(
                setContext + `CALL sp_service_getB2BServiceHierarchy()`,
                [],
                supportKey,
                (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                        res.send({
                            "code": 400,
                            "message": "Failed to get Data",
                        });
                    } else {
                        const resultSets = results1.filter(r => Array.isArray(r));
                        console.log("results1", results1)
                        // Extract categories from results
                        const results = resultSets[0]

                        const cleanedResults = results.map(category => {
                            if (category.categories) {
                                category.categories = category.categories.filter(categoryItem => {
                                    if (categoryItem.children) {
                                        categoryItem.children = categoryItem.children.filter(subchild => {
                                            // For each subchild, we are now consolidating subchildren and servicechildren into children
                                            // Check if servicechildren exists
                                            if (subchild.children && subchild.children.length > 0) {
                                                return true; // Keep subchild if it has servicechildren (now treated as children)
                                            }
                                            return false; // Remove subchild if it has no servicechildren
                                        });
                                        return categoryItem.children.length > 0; // Keep category item if it has children
                                    }
                                    return false; // Remove category if it has no valid children
                                });
                            }
                            return category;
                        });

                        res.send({
                            code: 200,
                            message: "Success",
                            data: cleanedResults,
                        });
                    }
                }
            );
        } else {
            res.send({
                "code": 400,
                "message": "Invalid parameter."
            });
        }
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            "code": 500,
            "message": "Something went wrong.",
        });
    }
};




const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (err, results) => {
            if (err) {
                reject(err);
            }
            else resolve(results);
        });
    });
};

const checkServiceDuplicate = async (SHORT_CODE, ID, isEdit, supportKey, connection) => {
    const result = await runQuery(
        `CALL sp_check_service_duplicate(?, ?, ?)`,
        [SHORT_CODE, ID || null, isEdit],
        supportKey,
        connection
    );

    const duplicates = result && result[0] ? result[0] : [];
    return duplicates.length > 0 ? "A service with the same short code already exists." : null;
};

exports.importService = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing parameter: EXCEL_FILE_NAME." });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found in the Excel file." });

        res.status(200).json({
            code: 200,
            message: "Import started. Processing in background...",
            EXCEL_MASTER_ID: EXCEL_MASTER_ID
        });

        let successCount = 0;
        let skippedCount = 0;
        let successDetails = [];
        let errorDetails = [];
        let skippedDetails = [];
        let totalData = [];
        let errorData = [];
        let TERRITORY_ID = 0;

        console.log("\n\n\n\n Json data", jsonData);

        const chunkSize = 50;
        const isEdit = IMPORT_TYPE === "E";

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (const [index, row] of chunk.entries()) {
                const rowNumber = start + index + 2;
                const connection = mm.openConnection();
                
                try {
                    const data = {};

                    COLUMN_JSON.forEach(c => {
                        data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                    });

                    if (!data.SHORT_CODE) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber, reason: "Missing required fields", row });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing required fields" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const dupMsg = await checkServiceDuplicate(
                        data.SHORT_CODE,
                        data.ID,
                        isEdit,
                        supportKey,
                        connection
                    );

                    if (dupMsg) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber, reason: dupMsg, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: dupMsg });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // =============================
                    // 🔍 MASTER LOOKUPS USING SPs
                    // =============================
                    // The excel mapping sends names, not ids: "Category Name" arrives as
                    // CATEGORY_ID and "Subcategory Name" as SUB_CATEGORY_ID. CATEGORY_NAME is
                    // accepted too in case a mapping is set up against that field name.
                    const excelCategoryName = data.CATEGORY_ID || data.CATEGORY_NAME || null;

                    let sub = [];
                    if (data.SUB_CATEGORY_ID) {
                        // Sub category names are only unique within a category, so the category
                        // narrows the lookup. Passing null keeps the old name-only behaviour for
                        // templates that do not carry the column yet.
                        const subResult = await runQuery(
                            `CALL sp_get_sub_category_by_name(?, ?)`,
                            [data.SUB_CATEGORY_ID, excelCategoryName],
                            supportKey,
                            connection
                        );
                        sub = subResult && subResult[0] ? subResult[0] : [];
                    }

                    let unit = [];
                    if (data.UNIT_NAME) {
                        const unitResult = await runQuery(
                            `CALL sp_get_unit_by_name(?)`,
                            [data.UNIT_NAME],
                            supportKey,
                            connection
                        );
                        unit = unitResult && unitResult[0] ? unitResult[0] : [];
                    }

                    let tax = [];
                    if (data.TAX_ID) {
                        const taxResult = await runQuery(
                            `CALL sp_get_tax_by_name(?)`,
                            [data.TAX_ID],
                            supportKey,
                            connection
                        );
                        tax = taxResult && taxResult[0] ? taxResult[0] : [];
                    }

                    let HSN = [];
                    if (data.HSN_CODE) {
                        const hsnResult = await runQuery(
                            `CALL sp_get_hsn_by_code(?)`,
                            [data.HSN_CODE],
                            supportKey,
                            connection
                        );
                        HSN = hsnResult && hsnResult[0] ? hsnResult[0] : [];
                    }

                    // Validation for master lookups
                    if (data.SUB_CATEGORY_ID && sub.length === 0) {
                        const reason = excelCategoryName
                            ? `Sub Category not exist in category '${excelCategoryName}'`
                            : "Sub Category not exist";
                        skippedCount++;
                        skippedDetails.push({ rowNumber, reason, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // The same sub category name can sit under more than one category. Without a
                    // Category Name there is nothing to pick the right one by, so skip rather
                    // than attach the service to whichever row the DB happened to return first.
                    if (sub.length > 1) {
                        const reason = "Sub Category name exists in multiple categories, provide Category Name";
                        skippedCount++;
                        skippedDetails.push({ rowNumber, reason, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    if (data.UNIT_NAME && unit.length === 0) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber, reason: "Unit not exist", row });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Unit not exist" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    if (data.TAX_ID && tax.length === 0) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber, reason: "Tax not exist", row });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Tax not exist" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    if (data.HSN_CODE && HSN.length === 0) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber, reason: "HSN not exist", row });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "HSN not exist" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // Set IDs from lookups
                    data.SUB_CATEGORY_ID = sub.length > 0 ? sub[0].ID : null;
                    data.UNIT_ID = unit.length > 0 ? unit[0].ID : null;
                    data.TAX_ID = tax.length > 0 ? tax[0].ID : null;
                    data.HSN_CODE_ID = HSN.length > 0 ? HSN[0].ID : null;
                    
                    data.PARENT_ID = 0;
                    data.IS_PARENT = 0;
                    data.IS_JOB_CREATED_DIRECTLY = data.IS_JOB_CREATED_DIRECTLY == "Yes" ? 1 : 0;
                    data.SITE_VISIT_REPORT_TYPE = data.SITE_VISIT_REPORT_TYPE;
                    data.WARRANTY_ALLOWED = data.WARRANTY_ALLOWED == 'Yes' ? 1 : 0;
                    data.GUARANTEE_ALLOWED = data.GUARANTEE_ALLOWED == 'Yes' ? 1 : 0;
                    data.STATUS = isEdit ? (data.STATUS == 'Active' ? 1 : 0) : 1;
                    data.SERVICE_TYPE = data.SERVICE_TYPE ? data.SERVICE_TYPE : "B";
                    data.CLIENT_ID = 1;
                    
                    const systemDate = mm.getSystemDate();
                    
                    // Store names for logs before deletion
                    const categoryName = sub.length > 0 ? sub[0].CATEGORY_NAME : '';
                    const subCategoryName = sub.length > 0 ? sub[0].NAME : '';
                    const unitName = unit.length > 0 ? unit[0].NAME : '';
                    const taxName = tax.length > 0 ? tax[0].NAME : '';
                    
                    delete data.UNIT_NAME;
                    // Lookup-only columns. service_master has no category field at all, and the
                    // INSERT/UPDATE below are built from Object.keys(data), so leaving these in
                    // would put the category NAME into a column that does not exist.
                    delete data.CATEGORY_ID;
                    delete data.CATEGORY_NAME;
                    console.log("\n\n\n\n Processed data", data);

                    if (!isEdit) {
                        // INSERT MODE - Generate dynamic INSERT query and pass to sp_executeDynamicQuery
                        data.CREATED_DATE = systemDate;
                        
                        let columns = [];
                        let values = [];

                        Object.keys(data).forEach(key => {
                            if (data[key] !== undefined && data[key] !== null) {
                                columns.push(key);
                                values.push(mysql.escape(data[key]));
                            }
                        });

                        let finalQuery = `INSERT INTO service_master (${columns.join(", ")}) VALUES (${values.join(", ")})`;
                        
                        const insertService = await runQuery(
                            `CALL sp_executeDynamicQuery(?)`,
                            [finalQuery],
                            supportKey,
                            connection
                        );

                        // Get the inserted ID - need to query it separately
                        const idResult = await runQuery(
                            `SELECT LAST_INSERT_ID() as insertId`,
                            [],
                            supportKey,
                            connection
                        );
                        
                        const SERVICE_ID = idResult && idResult[0] ? idResult[0].insertId : null;
                        
                        // Service log (MongoDB - stays in API)
                        var logType = data.IS_FOR_B2B == 1 ? 'B2B' : 'MAIN';
                        var ACTION_DETAILS = `${req.body.authData?.data?.UserData[0]?.NAME} has created a new service ${data.NAME}.`;
                        
                        let logData = {
                            LOG_DATE_TIME: systemDate,
                            LOG_TEXT: ACTION_DETAILS,
                            LOG_TYPE: logType,
                            USER_ID: req.body.authData?.data?.UserData[0]?.USER_ID,
                            ADDED_BY: req.body.authData?.data?.UserData[0]?.NAME,
                            SERVICE_ID: SERVICE_ID,
                            CUSTOMER_ID: 0,
                            TERRITORY_ID: 0,
                            NAME: data.NAME,
                            DESCRIPTION: data.DESCRIPTION || '',
                            CATEGORY_NAME: categoryName,
                            SUB_CATEGORY_NAME: subCategoryName,
                            SUB_CATEGORY_ID: data.SUB_CATEGORY_ID,
                            B2B_PRICE: data.B2B_PRICE || 0,
                            TECHNICIAN_COST: data.TECHNICIAN_COST || 0,
                            VENDOR_COST: data.VENDOR_COST || 0,
                            UNIT_ID: data.UNIT_ID,
                            UNIT_NAME: unitName,
                            SHORT_CODE: data.SHORT_CODE,
                            MAX_QTY: data.MAX_QTY || 0,
                            TAX_ID: data.TAX_ID || 0,
                            TAX_NAME: taxName,
                            IS_JOB_CREATED_DIRECTLY: data.IS_JOB_CREATED_DIRECTLY,
                            QTY: data.QTY || 1,
                            STATUS: data.STATUS,
                            CLIENT_ID: data.CLIENT_ID,
                            HSN_CODE_ID: data.HSN_CODE_ID,
                            HSN_CODE: data.HSN_CODE,
                            WARRANTY_ALLOWED: data.WARRANTY_ALLOWED,
                            GUARANTEE_ALLOWED: data.GUARANTEE_ALLOWED,
                            WARRANTY_PERIOD: data.WARRANTY_PERIOD || 0,
                            GUARANTEE_PERIOD: data.GUARANTEE_PERIOD || 0,
                            SITE_VISIT_REPORT_TYPE: data.SITE_VISIT_REPORT_TYPE || 'None',
                            IS_AVAILABLE: 1
                        };
                        
                        mm.commitConnection(connection);
                        dbm.saveLog(logData, servicelog);
                        addGlobalData(SERVICE_ID, "MAIN", supportKey);
                        
                        successCount++;
                        successDetails.push({ rowNumber, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });

                    } else {
                        // EDIT MODE
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: "Missing ID for update",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing ID for update" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Check if service exists using SP
                        const getData = await runQuery(
                            `CALL sp_get_service_by_id(?)`,
                            [data.ID],
                            supportKey,
                            connection
                        );

                        const existingResult = getData && getData[0] ? getData[0] : [];

                        if (!existingResult.length) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Service does not exist for ID ${data.ID}`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Service does not exist for ID " + data.ID });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Generate dynamic UPDATE query and pass to sp_executeDynamicQuery
                        let setData = "";

                        Object.keys(data).forEach(key => {
                            if (key !== "ID" && data[key] !== undefined && data[key] !== null) {
                                setData += `${key} = ${mysql.escape(data[key])}, `;
                            }
                        });

                        setData = setData.slice(0, -2);
                        setData += `, CREATED_MODIFIED_DATE = ${mysql.escape(systemDate)}`;

                        let finalQuery = `UPDATE service_master SET ${setData} WHERE ID = ${mysql.escape(data.ID)}`;
                        
                        await runQuery(
                            `CALL sp_executeDynamicQuery(?)`,
                            [finalQuery],
                            supportKey,
                            connection
                        );
                        
                        // Service log (MongoDB - stays in API)
                        var ACTION_DETAILS = `${req.body.authData?.data?.UserData[0]?.NAME} has updated the details of ${data.NAME}.`;
                        var logType = data.IS_FOR_B2B == 1 ? 'B2B' : 'MAIN';
                        
                        let logData = {
                            LOG_DATE_TIME: systemDate,
                            LOG_TEXT: ACTION_DETAILS,
                            LOG_TYPE: logType,
                            USER_ID: req.body.authData?.data?.UserData[0]?.USER_ID,
                            ADDED_BY: req.body.authData?.data?.UserData[0]?.NAME,
                            SERVICE_ID: data.ID,
                            CUSTOMER_ID: 0,
                            TERRITORY_ID: TERRITORY_ID || 0,
                            NAME: data.NAME,
                            DESCRIPTION: data.DESCRIPTION || '',
                            CATEGORY_NAME: categoryName,
                            SUB_CATEGORY_NAME: subCategoryName,
                            SUB_CATEGORY_ID: data.SUB_CATEGORY_ID,
                            B2B_PRICE: data.B2B_PRICE || 0,
                            TECHNICIAN_COST: data.TECHNICIAN_COST || 0,
                            VENDOR_COST: data.VENDOR_COST || 0,
                            UNIT_ID: data.UNIT_ID,
                            UNIT_NAME: unitName,
                            SHORT_CODE: data.SHORT_CODE,
                            MAX_QTY: data.MAX_QTY || 0,
                            TAX_ID: data.TAX_ID || 0,
                            TAX_NAME: taxName,
                            IS_JOB_CREATED_DIRECTLY: data.IS_JOB_CREATED_DIRECTLY,
                            QTY: data.QTY || 1,
                            STATUS: data.STATUS,
                            CLIENT_ID: data.CLIENT_ID,
                            HSN_CODE_ID: data.HSN_CODE_ID,
                            HSN_CODE: data.HSN_CODE,
                            WARRANTY_ALLOWED: data.WARRANTY_ALLOWED,
                            GUARANTEE_ALLOWED: data.GUARANTEE_ALLOWED,
                            WARRANTY_PERIOD: data.WARRANTY_PERIOD || 0,
                            GUARANTEE_PERIOD: data.GUARANTEE_PERIOD || 0,
                            SITE_VISIT_REPORT_TYPE: data.SITE_VISIT_REPORT_TYPE || 'None',
                            IS_AVAILABLE: 1
                        };
                        
                        mm.commitConnection(connection);
                        dbm.saveLog(logData, servicelog);
                        addGlobalData(data.ID, "MAIN", supportKey);
                        
                        successCount++;
                        successDetails.push({ rowNumber, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }

                } catch (err) {
                    mm.rollbackConnection(connection);
                    console.error(`Row ${rowNumber} failed:`, err.message);
                    errorDetails.push({ rowNumber: rowNumber, reason: err.message });
                    errorData.push({ rowNumber: rowNumber, row, reason: err.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

        const response = {
            code: 200,
            message: "Service import process completed.",
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

    } catch (error) {
        console.log(error);
    }
};
