const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const jwt = require('jsonwebtoken');
exports.dotenv = require('dotenv').config();
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog");
const technicianActionLog = require("../../modules/technicianActionLog");
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
const async = require('async');
var technicianMaster = "technician_master";
var viewTechnicianMaster = "view_" + technicianMaster;
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
const path = require('path')
const bcrypt = require('bcrypt');


var systemDate = mm.getSystemDate();
function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        EXPERIENCE_LEVEL: req.body.EXPERIENCE_LEVEL,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE1: req.body.ADDRESS_LINE1,
        ADDRESS_LINE2: req.body.ADDRESS_LINE2,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        HIRE_DATE: systemDate,
        COUNTRY_ID: req.body.COUNTRY_ID,
        CITY_ID: req.body.CITY_ID,
        STATE_ID: req.body.STATE_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        AADHAR_NUMBER: req.body.AADHAR_NUMBER,
        GENDER: req.body.GENDER,
        DOB: req.body.DOB,
        IS_OWN_VEHICLE: req.body.IS_OWN_VEHICLE ? '1' : '0',
        PHOTO: req.body.PHOTO,
        PASSWORD: req.body.PASSWORD,
        VEHICLE_TYPE: req.body.VEHICLE_TYPE,
        VEHICLE_DETAILS: req.body.VEHICLE_DETAILS,
        VEHICLE_NO: req.body.VEHICLE_NO,
        VENDOR_ID: req.body.VENDOR_ID,
        REPORTING_PERSON_ID: req.body.REPORTING_PERSON_ID,
        CONTRACT_START_DATE: req.body.CONTRACT_START_DATE,
        CONTRACT_END_DATE: req.body.CONTRACT_END_DATE,
        TYPE: req.body.TYPE,
        DEVICE_ID: req.body.DEVICE_ID,
        CLOUD_ID: req.body.CLOUD_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        CURRENT_STATUS: req.body.CURRENT_STATUS,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        DISTRICT_ID: req.body.DISTRICT_ID,
        HOME_LATTITUDE: req.body.HOME_LATTITUDE,
        HOME_LONGITUDE: req.body.HOME_LONGITUDE,
        ORG_ID: req.body.ORG_ID,
        TECHNICIAN_STATUS: req.body.TECHNICIAN_STATUS ? '1' : '0',
        CREATED_DATE: req.body.CREATED_DATE,
        W_CLOUD_ID: req.body.CLOUD_ID,
        PINCODE: req.body.PINCODE,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        ASSIGNED_DATE: req.body.ASSIGNED_DATE,
        IS_UNIFORM_ASSIGNED: req.body.IS_UNIFORM_ASSIGNED ? '1' : '0',
        IS_TOOLKIT_ASSIGNED: req.body.IS_TOOLKIT_ASSIGNED ? '1' : '0',
        IS_PINCODE_MAPPED: req.body.IS_PINCODE_MAPPED ? '1' : '0',

    }
    return data;
}

function TechnicianreqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        DATE: req.body.DATE,
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        BREAK_START_TIME: req.body.BREAK_START_TIME,
        BREAK_END_TIME: req.body.BREAK_END_TIME,
        TOTAL_TIME: req.body.TOTAL_TIME,
        TYPE: req.body.TYPE,
        REMARK: req.body.REMARK,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').exists(),
        body('EXPERIENCE_LEVEL', ' parameter missing').exists(),
        body('MOBILE_NUMBER', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('CITY_ID').optional(),
        body('STATE_ID').isInt(),
        body('GENDER', ' parameter missing').exists(),
        body('HOME_LATTITUDE', ' parameter missing').exists(),
        body('HOME_LONGITUDE', ' parameter missing').exists(),
        body('ID').optional(),
    ]
}


exports.get = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? parseInt(req.body.pageIndex) : null;
    var pageSize = req.body.pageSize ? parseInt(req.body.pageSize) : null;
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    const TERRITORY_IDS = req.body.TERRITORY_IDS ? req.body.TERRITORY_IDS : null
    const IS_T_MANAGER = req.body.IS_T_MANAGER
    const IS_W_MANAGER = req.body.IS_W_MANAGER
    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");
    const setContext = `
        SET @v_TERRITORY_IDS = ${TERRITORY_IDS || 0};
        SET @v_IS_T_MANAGER = ${IS_T_MANAGER || 0};
        SET @v_IS_W_MANAGER = ${IS_W_MANAGER || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    try {


        if (IS_FILTER_WRONG == "0") {
            // Using stored procedure
            mm.executeQueryData(
                setContext + `CALL sp_technician_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get technician count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 114,
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


exports.getdata = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var TECHNICIAN_FILTER = ''
    var TECHNICIAN_FILTER2 = ''
    const TERRITORY_IDS = req.body.TERRITORY_IDS ? req.body.TERRITORY_IDS : []
    const IS_T_MANAGER = req.body.IS_T_MANAGER
    const IS_W_MANAGER = req.body.IS_W_MANAGER

    if (IS_T_MANAGER === 1) {
        TECHNICIAN_FILTER = ` AND (ID IN(SELECT TECHNICIAN_ID FROM technician_pincode_mapping WHERE PINCODE_ID IN(SELECT PINCODE_ID FROM territory_pincode_mapping WHERE TERRITORY_ID IN(${TERRITORY_IDS}) AND IS_ACTIVE=1) AND IS_ACTIVE=1)) OR IS_PINCODE_MAPPED=0`
    }
    if (IS_W_MANAGER == 1) {
        TECHNICIAN_FILTER2 = ` AND ID IN(SELECT TECHNICIAN_ID FROM inventory_technician_movement)`
    }

    let criteria = '';
    if (pageIndex === '' && pageSize === '')
        criteria = filter + TECHNICIAN_FILTER + TECHNICIAN_FILTER2 + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + TECHNICIAN_FILTER + TECHNICIAN_FILTER2 + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;


    var supportKey = req.headers['supportkey'];

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get organisation count.",
                    });
                } else {
                    mm.executeQuery('select * from ' + viewTechnicianMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get organisation information."
                            });
                        } else if (results.length > 0) {
                            // Fetch all calendar data for relevant ORG_IDs
                            let TECHNICIAN_ID = results.map(item => item.ID).join(',');
                            let calendarQuery = `select * from view_technician_service_calender where TECHNICIAN_ID IN (${TECHNICIAN_ID})`;
                            mm.executeQuery(calendarQuery, supportKey, (error, results3) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get TECHNICIAN calendar information."
                                    });
                                } else {
                                    res.send({
                                        "code": 200,
                                        "message": "success",
                                        "TAB_ID": 114,
                                        "count": results1[0].cnt,
                                        "data": results,
                                    });
                                }
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "message": "No data found.",
                                "count": 0,
                                "data": []
                            });
                        }
                    });
                }
            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
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

exports.getCalenderData = (req, res) => {
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
                setContext + `CALL sp_technicianServiceCalender_get()`,
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


exports.create = async (req, res) => {
    const systemDate = mm.getSystemDate();

    const data = reqData(req);
    const WEEK_DAY_DATA = req.body.WEEK_DAY_DATA;
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    console.log("create", req.body);

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        let fullAddress = "";
        const line1 = data.ADDRESS_LINE1;
        const ste = data.STATE_ID;
        const cntry = data.COUNTRY_ID;
        const pincd = data.PINCODE_ID;
        if (!data.HOME_LATTITUDE && !data.HOME_LONGITUDE) {
            data.HOME_LATTITUDE = "";
            data.HOME_LONGITUDE = "";
        }

        if (!line1 || !ste || !cntry || !pincd) {
            const reason = "The required fields are missing for getting geolocation";
            return res.send({
                "code": 400,
                "message": reason
            });
        } else {
            fullAddress = [line1, ste, cntry, pincd].filter(Boolean).join(', ');
        }

        if (data.HOME_LONGITUDE == "" || data.HOME_LATTITUDE == "") {
            console.log(`\n\n\n\n **** Geocoding address for ${fullAddress}`);
            const geo = await mm.geocodeAddress(fullAddress);
            if (!geo.latitude || !geo.longitude) {
                const reason = "Invalid address faild to fetch geolocation";
                return res.send({
                    "code": 400,
                    "message": reason
                });
            }
            data.HOME_LONGITUDE = geo.longitude;
            data.HOME_LATTITUDE = geo.latitude
        }
        // Call stored procedure to create technician
        const connection = mm.openConnection()
        mm.executeDML(
            `CALL sp_technician_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.EXPERIENCE_LEVEL,
                data.MOBILE_NUMBER,
                data.EMAIL_ID,
                data.ADDRESS_LINE1,
                data.ADDRESS_LINE2,
                data.IS_ACTIVE,
                data.HIRE_DATE,
                data.COUNTRY_ID,
                data.CITY_ID,
                data.STATE_ID,
                data.PINCODE_ID,
                data.AADHAR_NUMBER,
                data.GENDER,
                data.DOB,
                data.IS_OWN_VEHICLE,
                data.PHOTO,
                data.PASSWORD,
                data.VEHICLE_TYPE,
                data.VEHICLE_DETAILS,
                data.VEHICLE_NO,
                data.VENDOR_ID,
                data.REPORTING_PERSON_ID,
                data.CONTRACT_START_DATE,
                data.CONTRACT_END_DATE,
                data.TYPE,
                data.DEVICE_ID,
                data.CLOUD_ID,
                data.CLIENT_ID,
                data.CURRENT_STATUS,
                data.COUNTRY_CODE,
                data.DISTRICT_ID,
                data.HOME_LATTITUDE,
                data.HOME_LONGITUDE,
                data.ORG_ID,
                data.TECHNICIAN_STATUS,
                data.CREATED_DATE,
                data.W_CLOUD_ID,
                data.PINCODE,
                data.PROFILE_PHOTO,
                data.ASSIGNED_DATE,
                data.IS_UNIFORM_ASSIGNED,
                data.IS_TOOLKIT_ASSIGNED,
                data.IS_PINCODE_MAPPED
            ],
            supportKey,
            connection,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection)
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technician information."
                    });
                }

                const r = result[0][0];

                if (r.code === 300) {
                    mm.rollbackConnection(connection)
                    return res.status(200).json(r);
                }

                if (r.code !== 200) {
                    mm.rollbackConnection(connection)
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technician."
                    });
                }

                const technicianId = r.TECHNICIAN_ID;

                // Create calendar entries if provided
                if (WEEK_DAY_DATA && WEEK_DAY_DATA.length > 0) {
                    console.log("WEEK_DAY_DATA", WEEK_DAY_DATA)
                    // Convert WEEK_DAY_DATA to JSON string for stored procedure
                    const calendarJson = JSON.stringify(WEEK_DAY_DATA);

                    mm.executeDML(
                        `CALL sp_technician_calendar_batch_create(?,?,?)`,
                        [technicianId, data.CLIENT_ID, calendarJson],
                        supportKey,
                        connection,
                        (calendarError, result1) => {
                            console.log("result1", result1)
                            if (calendarError) {
                                console.log("Calendar error", calendarError);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(calendarError), applicationkey);
                                mm.rollbackConnection(connection)
                                return res.status(400).json({
                                    "code": 400,
                                    "message": "Technician created but failed to save calendar information."
                                });
                            }
                            else {


                                // Continue with other operations
                                mm.commitConnection(connection)
                                completeTechnicianCreation(technicianId, data, req, supportKey, res);
                            }
                        }
                    );
                } else {
                    mm.commitConnection(connection)
                    // Continue with other operations without calendar data
                    completeTechnicianCreation(technicianId, data, req, supportKey, res, connection);
                }
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Internal Server Error."
        });
    }
};

function completeTechnicianCreation(technicianId, data, req, supportKey, res) {
    // MongoDB logging
    const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has added new technician ${data.NAME}`;
    const actionLog = {
        "SOURCE_ID": technicianId,
        "LOG_DATE_TIME": mm.getSystemDate(),
        "LOG_TEXT": ACTION_DETAILS,
        "CATEGORY": "technician",
        "CLIENT_ID": 1,
        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
        "supportKey": 0
    };

    dbm.saveLog(actionLog, systemLog);

    // Send email
    mm.sendDynamicEmail(2, technicianId, supportKey);

    // Add global data
    addGlobalData(technicianId, supportKey);

    // Determine channel name based on type
    let CHANNEL_NAME = '';
    if (data.TYPE == 'F') {
        CHANNEL_NAME = 'freelancer_channel';
    } else if (data.TYPE == 'O') {
        CHANNEL_NAME = 'on_payroll_channel';
    } else {
        CHANNEL_NAME = 'vendor_managed_channel';
    }

    // Subscribe to channels
    const channels = [
        { CHANNEL_NAME: `pincode_${data.PINCODE_ID}_channel` },
        { CHANNEL_NAME: "system_alerts_channel" },
        { CHANNEL_NAME: CHANNEL_NAME },
        { CHANNEL_NAME: 'technician_channel' },
        { CHANNEL_NAME: `technician_${technicianId}_channel` }
    ];

    channels.forEach(channel => {
        const channelData = {
            ...channel,
            USER_ID: technicianId,
            TYPE: "T",
            STATUS: true,
            USER_NAME: data.NAME,
            CLIENT_ID: data.CLIENT_ID,
            DATE: mm.getSystemDate()
        };
        new channelSubscribedUsers(channelData).save();
    });

    res.status(200).json({
        "code": 200,
        "message": "Technician information created and logged successfully."
    });
}

exports.checkEmail = (req, res) => {
    const systemDate = mm.getSystemDate();

    const data = reqData(req);
    const supportKey = req.headers['supportkey'];
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const TYPE = req.body.TYPE;

    try {
        if (data.EMAIL_ID && data.MOBILE_NUMBER && TYPE) {
            mm.executeQueryData(
                `CALL sp_technician_checkEmailMobile(?,?,?,?)`,
                [data.EMAIL_ID, data.MOBILE_NUMBER, TECHNICIAN_ID, TYPE],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                            "code": 400,
                            "message": "Failed to validate technician email or mobile number."
                        });
                    }

                    const r = results[0][0];
                    res.status(r.code === 300 ? 200 : r.code).json(r);
                }
            );
        } else {
            res.status(400).json({
                "code": 400,
                "message": "The email or mobile number parameter is missing"
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Internal Server Error."
        });
    }
};

exports.createTechnician = (req, res) => {
    const systemDate = mm.getSystemDate();


    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        // Call the comprehensive stored procedure
        mm.executeQueryData(
            `CALL sp_technician_createTechnician(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.EXPERIENCE_LEVEL,
                data.MOBILE_NUMBER,
                data.EMAIL_ID,
                data.ADDRESS_LINE1,
                data.ADDRESS_LINE2,
                data.IS_ACTIVE,
                data.HIRE_DATE,
                data.COUNTRY_ID,
                data.CITY_ID,
                data.STATE_ID,
                data.PINCODE_ID,
                data.AADHAR_NUMBER,
                data.GENDER,
                data.DOB,
                data.IS_OWN_VEHICLE,
                data.PHOTO,
                data.PASSWORD,
                data.VEHICLE_TYPE,
                data.VEHICLE_DETAILS,
                data.VEHICLE_NO,
                data.VENDOR_ID,
                data.REPORTING_PERSON_ID,
                data.CONTRACT_START_DATE,
                data.CONTRACT_END_DATE,
                data.TYPE,
                data.DEVICE_ID,
                data.CLOUD_ID,
                data.CLIENT_ID,
                data.CURRENT_STATUS,
                data.COUNTRY_CODE,
                data.DISTRICT_ID,
                data.HOME_LATTITUDE,
                data.HOME_LONGITUDE,
                data.ORG_ID,
                data.TECHNICIAN_STATUS,
                data.CREATED_DATE,
                data.W_CLOUD_ID,
                data.PINCODE,
                data.PROFILE_PHOTO,
                data.ASSIGNED_DATE,
                data.IS_UNIFORM_ASSIGNED,
                data.IS_TOOLKIT_ASSIGNED,
                data.IS_PINCODE_MAPPED
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technician information..."
                    });
                }

                const r = result[0][0];

                if (r.code === 300) {
                    return res.status(200).json(r);
                }

                if (r.code !== 200) {
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technician information."
                    });
                }

                res.status(200).json({
                    "code": 200,
                    "message": "Technician information saved successfully...",
                    TECHNICIAN_ID: r.TECHNICIAN_ID,
                    USER_ID: r.USER_ID
                });
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.update = async (req, res) => {
    const systemDate = mm.getSystemDate();

    const errors = validationResult(req);
    const data = reqData(req);
    const WEEK_DAY_DATA = req.body.WEEK_DAY_DATA;
    const supportKey = req.headers['supportkey'];
    const criteria = {
        ID: req.body.ID,
    };

    console.log("update", req.body);

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        let fullAddress = "";
        const line1 = data.ADDRESS_LINE1;
        const ste = data.STATE_ID;
        const cntry = data.COUNTRY_ID;
        const pincd = data.PINCODE_ID;
        if (!data.HOME_LATTITUDE && !data.HOME_LONGITUDE) {
            data.HOME_LATTITUDE = "";
            data.HOME_LONGITUDE = "";
        }

        if (!line1 || !ste || !cntry || !pincd) {
            const reason = "The required fields are missing for getting geolocation";
            return res.send({
                "code": 400,
                "message": reason
            });
        } else {
            fullAddress = [line1, ste, cntry, pincd].filter(Boolean).join(', ');
        }

        if (data.HOME_LONGITUDE == "" || data.HOME_LATTITUDE == "") {
            console.log(`\n\n\n\n **** Geocoding address for ${fullAddress}`);
            const geo = await mm.geocodeAddress(fullAddress);
            if (!geo.latitude || !geo.longitude) {
                const reason = "Invalid address faild to fetch geolocation";
                return res.send({
                    "code": 400,
                    "message": reason
                });
            }
            data.HOME_LONGITUDE = geo.longitude;
            data.HOME_LATTITUDE = geo.latitude
        }
        const calendarJson = JSON.stringify(
            (WEEK_DAY_DATA || []).map(row => ({
                ...row,
                IS_SERIVCE_AVAILABLE: row.IS_SERIVCE_AVAILABLE ? 1 : 0
            }))
        );

        // Call stored procedure to update technician
        mm.executeQueryData(
            `CALL sp_technician_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                criteria.ID,
                data.NAME,
                data.EXPERIENCE_LEVEL,
                data.MOBILE_NUMBER,
                data.EMAIL_ID,
                data.ADDRESS_LINE1,
                data.ADDRESS_LINE2,
                data.IS_ACTIVE,
                data.HIRE_DATE,
                data.COUNTRY_ID,
                data.CITY_ID,
                data.STATE_ID,
                data.PINCODE_ID,
                data.AADHAR_NUMBER,
                data.GENDER,
                data.DOB,
                data.IS_OWN_VEHICLE,
                data.PHOTO,
                data.PASSWORD,
                data.VEHICLE_TYPE,
                data.VEHICLE_DETAILS,
                data.VEHICLE_NO,
                data.VENDOR_ID,
                data.REPORTING_PERSON_ID,
                data.CONTRACT_START_DATE,
                data.CONTRACT_END_DATE,
                data.TYPE,
                data.DEVICE_ID,
                data.CLOUD_ID,
                data.CLIENT_ID,
                data.CURRENT_STATUS,
                data.COUNTRY_CODE,
                data.DISTRICT_ID,
                data.HOME_LATTITUDE,
                data.HOME_LONGITUDE,
                data.ORG_ID,
                data.TECHNICIAN_STATUS,
                data.W_CLOUD_ID,
                data.PINCODE,
                data.PROFILE_PHOTO,
                data.ASSIGNED_DATE,
                data.IS_UNIFORM_ASSIGNED,
                data.IS_TOOLKIT_ASSIGNED,
                data.IS_PINCODE_MAPPED
            ],
            supportKey,
            async (error, result) => {
                if (error) {
                    console.log("error", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technician information."
                    });
                }

                const r = result[0][0];

                if (r.code === 300) {
                    return res.status(200).json(r);
                }

                if (r.code !== 200) {
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technician information."
                    });
                }

                // Update calendar data
                mm.executeQueryData(
                    `CALL sp_technician_calendar_update(?,?)`,
                    [criteria.ID, calendarJson],
                    supportKey,
                    async (calendarError) => {
                        if (calendarError) {
                            console.log("Calendar error", calendarError);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(calendarError), applicationkey);
                            return res.status(400).json({
                                "code": 400,
                                "message": "Technician updated but failed to save calendar information."
                            });
                        }

                        // MongoDB logging
                        const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of ${data.NAME}`;
                        const actionLog = {
                            "SOURCE_ID": criteria.ID,
                            "LOG_DATE_TIME": systemDate,
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": "technician",
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        };

                        dbm.saveLog(actionLog, systemLog);

                        // Add global data
                        addGlobalData(criteria.ID, supportKey);

                        // Handle channel subscription
                        await handleChannelUpdates(criteria.ID, data, req.body.OLD_TYPE);

                        res.status(200).json({
                            "code": 200,
                            "message": "Technician information updated successfully..."
                        });
                    }
                );
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

async function handleChannelUpdates(technicianId, data, oldType) {
    try {
        const typeChannelMap = {
            F: 'freelancer_channel',
            O: 'on_payroll_channel',
            V: 'vendor_managed_channel'
        };

        const currentChannel = typeChannelMap[data.TYPE] || 'vendor_managed_channel';
        const oldChannel = typeChannelMap[oldType];

        // 🔴 Step 1: If type changed → deactivate old channel
        if (oldType && oldType !== data.TYPE && oldChannel) {
            await channelSubscribedUsers.updateOne(
                {
                    CHANNEL_NAME: oldChannel,
                    USER_ID: technicianId,
                    TYPE: "T"
                },
                {
                    $set: {
                        STATUS: false,
                        UPDATED_DATE: mm.getSystemDate()
                    }
                }
            );

            console.log(`Old channel OFF: ${oldChannel}`);
        }

        // 🟢 Step 2: Prepare all channels
        const channels = [
            { CHANNEL_NAME: `pincode_${data.PINCODE_ID}_channel` },
            { CHANNEL_NAME: "system_alerts_channel" },
            { CHANNEL_NAME: currentChannel },
            { CHANNEL_NAME: 'technician_channel' },
            { CHANNEL_NAME: `technician_${technicianId}_channel` }
        ];

        // 🟢 Step 3: Upsert all channels (activate current ones)
        await Promise.all(
            channels.map(channel =>
                channelSubscribedUsers.updateOne(
                    {
                        CHANNEL_NAME: channel.CHANNEL_NAME,
                        USER_ID: technicianId,
                        TYPE: "T"
                    },
                    {
                        $set: {
                            STATUS: data.IS_ACTIVE == 1,
                            USER_NAME: data.NAME,
                            CLIENT_ID: data.CLIENT_ID,
                            UPDATED_DATE: mm.getSystemDate()
                        },
                        $setOnInsert: {
                            DATE: mm.getSystemDate()
                        }
                    },
                    { upsert: true }
                )
            )
        );

        console.log(`Current channel ON: ${currentChannel}`);

        return true;

    } catch (error) {
        console.error("Error in handleChannelUpdates:", error);
        return false;
    }
}

function addGlobalData(data_Id, supportKey) {
    const setContext = `
        SET @p_ID = '${data_Id}';
    `;

    console.log("Adding global data for technician ID:", setContext);

    mm.executeQueryData(
        setContext + 'CALL sp_technician_getGlobalData()',
        [],
        supportKey,
        (error, result) => {

            if (error) return console.log(error);

            console.log("Global data result for technician:", result);

            const resultSets = result.filter(r => Array.isArray(r));
            const data = resultSets[0];   // FIXED

            if (!data || !data.length) return;

            const row = data[0];

            const logData = {
                ID: data_Id,
                CATEGORY: "Technician",
                TITLE: row.NAME,
                DATA: JSON.stringify(row),
                ROUTE: "/masters/technician_master",
                TERRITORY_ID: 0
            };

            dbm.addDatainGlobalmongo(
                logData.ID,
                logData.CATEGORY,
                logData.TITLE,
                logData.DATA,
                logData.ROUTE,
                logData.TERRITORY_ID
            );
        }
    );
}


exports.login = (req, res) => {
    var supportKey = req.headers['supportkey'];

    try {
        let username = req.body.username;
        let password = req.body.password;
        let FIREBASE_REG_TOKEN = req.body.CLOUD_ID || '';
        let DEVICE_ID = req.body.DEVICE_ID || '';
        let CLOUD_ID = req.body.CLOUD_ID || '';

        if (!username || !password) {
            return res.send({
                "code": 400,
                "message": "username or password parameter missing"
            });
        }

        let md5pass = md5(password);

        mm.executeQueryData(
            `CALL sp_technician_getPassword(?)`,
            [
                username
            ],
            supportKey,
            async (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).send({
                        "code": 400,
                        "message": "Login failed"
                    });
                }
                var data = result[0][0]
                const isMatch = await bcrypt.compare(password, data.PASSWORD);
                if (!isMatch) {
                    return res.send({
                        "code": 404,
                        "message": "Incorrect username or password"
                    });
                }
                mm.executeQueryData(
                    `CALL sp_technician_login(?,?,?,?,?)`,
                    [
                        username,
                        md5pass,
                        FIREBASE_REG_TOKEN,
                        DEVICE_ID,
                        CLOUD_ID
                    ],
                    supportKey,
                    (error, result) => {
                        if (error) {
                            console.log(error);
                            return res.status(400).send({
                                "code": 400,
                                "message": "Login failed"
                            });
                        }

                        let user = result[0][0];

                        let userDetails = [{
                            USER_ID: user.USER_ID,
                            CLIENT_ID: user.CLIENT_ID,
                            ROLE_ID: user.ROLE_ID,
                            ROLE_NAME: user.ROLE_NAME,
                            NAME: user.NAME,
                            USER_NAME: user.USER_NAME,
                            EMAIL_ID: user.EMAIL_ID,
                            LAST_LOGIN_DATETIME: user.LAST_LOGIN_DATETIME,
                            ORG_ID: user.ORG_ID
                        }];

                        let tokenUser = [{
                            USER_ID: user.USER_ID,
                            NAME: user.NAME,
                            USER_NAME: user.USER_NAME
                        }];

                        generateToken(user.USER_ID, res, userDetails, null, tokenUser);
                    }
                );
            }
        );
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            "code": 400,
            "message": "Something went wrong"
        });
    }
};

function generateToken(userId, res, resultsUser, connection, userDetails1) {

    try {

        var data = {
            "USER_ID": userId,
            "UserData": userDetails1
        }

        jwt.sign({ data }, process.env.WEB_SECRET, (error, token) => {
            if (error) {
                console.log("token error", error);
                // db.rollbackConnection(connection)
                res.send({
                    "code": 400,
                    "message": "Failed to login.",

                });
            }
            else {
                // db.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "Logged in successfully.",
                    "data": [{
                        "token": token,
                        "UserData": resultsUser
                    }]
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.changePassword = async (req, res) => {
    const OLD_PASSWORD = req.body.OLD_PASSWORD;
    const NEW_PASSWORD = req.body.NEW_PASSWORD;
    const ID = req.body.ID;
    const systemDate = mm.getSystemDate();
    const deviceid = req.headers['deviceid'];
    const supportKey = req.headers['supportkey'];
    const USER_TYPE = req.body.USER_TYPE || 'technician'; // Optional: 'technician', 'customer', 'user'

    // Validation
    if (!OLD_PASSWORD || !NEW_PASSWORD || !ID) {
        return res.status(400).json({
            "code": 400,
            "message": "OLD_PASSWORD, NEW_PASSWORD, and ID parameters are required."
        });
    }

    // Hash passwords
    const oldPasswordMd5 = await mm.hashPassword(OLD_PASSWORD);
    const newPasswordMd5 = await mm.hashPassword(NEW_PASSWORD);

    try {
        // Option 1: Using basic technician change password
        mm.executeQueryData(
            `CALL sp_technician_change_password(?,?,?,?)`,
            [ID, oldPasswordMd5, newPasswordMd5, systemDate],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("Change password error:", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to change password."
                    });
                }

                const r = results[0][0];

                if (r.code === 200) {
                    res.status(200).json({
                        "code": 200,
                        "message": "Password changed successfully."
                    });
                } else {
                    res.status(400).json({
                        "code": r.code,
                        "message": r.message
                    });
                }
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        console.log("Catch error:", error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.updateTechnician = (req, res) => {
    const systemDate = mm.getSystemDate();

    const errors = validationResult(req);
    const data = reqData(req);
    const supportKey = req.headers['supportkey'];
    const criteria = {
        ID: req.body.ID,
    };

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        // Call stored procedure to update technician
        mm.executeQueryData(
            `CALL sp_technician_updateTechnician(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                criteria.ID,
                data.NAME,
                data.EXPERIENCE_LEVEL,
                data.MOBILE_NUMBER,
                data.EMAIL_ID,
                data.ADDRESS_LINE1,
                data.ADDRESS_LINE2,
                data.IS_ACTIVE,
                data.HIRE_DATE,
                data.COUNTRY_ID,
                data.CITY_ID,
                data.STATE_ID,
                data.PINCODE_ID,
                data.AADHAR_NUMBER,
                data.GENDER,
                data.DOB,
                data.IS_OWN_VEHICLE,
                data.PHOTO,
                data.PASSWORD,
                data.VEHICLE_TYPE,
                data.VEHICLE_DETAILS,
                data.VEHICLE_NO,
                data.VENDOR_ID,
                data.REPORTING_PERSON_ID,
                data.CONTRACT_START_DATE,
                data.CONTRACT_END_DATE,
                data.TYPE,
                data.DEVICE_ID,
                data.CLOUD_ID,
                data.CLIENT_ID,
                data.CURRENT_STATUS,
                data.COUNTRY_CODE,
                data.DISTRICT_ID,
                data.HOME_LATTITUDE,
                data.HOME_LONGITUDE,
                data.ORG_ID,
                data.TECHNICIAN_STATUS,
                data.W_CLOUD_ID,
                data.PINCODE,
                data.PROFILE_PHOTO,
                data.ASSIGNED_DATE,
                data.IS_UNIFORM_ASSIGNED,
                data.IS_TOOLKIT_ASSIGNED,
                data.IS_PINCODE_MAPPED,
                data.ROLE_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("Update error:", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technician information."
                    });
                }

                const r = result[0][0];

                if (r.code === 300) {
                    return res.status(200).json(r);
                }

                if (r.code !== 200) {
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technician information."
                    });
                }

                // MongoDB logging
                const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of ${data.NAME}`;
                const actionLog = {
                    "SOURCE_ID": criteria.ID,
                    "LOG_DATE_TIME": systemDate,
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": "technician",
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": 0
                };

                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "Technician information updated successfully...",
                    TECHNICIAN_ID: r.TECHNICIAN_ID
                });
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.unMappedpincodes = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const pageIndex = req.body.pageIndex || null;
    const pageSize = req.body.pageSize || null;
    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue || 'DESC';
    var filter = req.body.filter || '';
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const TERRITORY_ID = req.body.TERRITORY_ID || [];
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    const territoryIdsStr = Array.isArray(TERRITORY_ID) ? TERRITORY_ID.join(',') : TERRITORY_ID;

    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    if (!TECHNICIAN_ID || TECHNICIAN_ID === '') {
        return res.status(400).json({
            "code": 400,
            "message": "Technician ID is required."
        });
    }

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");
    console.log("territoryIdsStr", territoryIdsStr)
    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID}; 
        SET @v_TERRITORY_IDS = ${territoryIdsStr.length > 0 ? territoryIdsStr : null};
    `;
    try {
        mm.executeQueryData(
            setContext + `CALL sp_technician_unmapped_pincodes()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("Error:", error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get unmapped pincodes."
                    });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];
                res.status(200).json({
                    "code": 200,
                    "message": "success",
                    count: countResult[0] ? countResult[0].cnt : 0,
                    data: dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.unMappedSkills = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const pageIndex = req.body.pageIndex || null;
    const pageSize = req.body.pageSize || null;
    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue || 'DESC';
    var filter = req.body.filter || '';
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);


    // Validation
    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    if (!TECHNICIAN_ID || TECHNICIAN_ID === '') {
        return res.status(400).json({
            "code": 400,
            "message": "Technician ID is required."
        });
    }
    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");
    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID}; 
    `;

    try {
        mm.executeQueryData(
            setContext + `CALL sp_technician_unmapped_skills()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("Error:", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get unmapped skills."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];
                res.status(200).json({
                    "code": 200,
                    "message": "success",
                    count: countResult[0] ? countResult[0].cnt : 0,
                    data: dataResult
                });
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.getTechnicianCalendar = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? parseInt(req.body.pageIndex) : null;
    var pageSize = req.body.pageSize ? parseInt(req.body.pageSize) : null;
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_technician_calendar_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("Error:", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get technician calendar."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 97,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

function updateLogAndStatus(
    TECHNICIAN_ID,
    LOG_DATE_TIME,
    LOG_TEXT,
    STATUS,
    TYPE,
    TECHNICIAN_STATUS,
    supportKey,
    req,
    callback
) {
    mm.executeQueryData(
        'CALL sp_update_technician_log_status(?,?,?,?,?,?,?)',
        [
            TECHNICIAN_ID,
            LOG_DATE_TIME,
            LOG_TEXT,
            STATUS,
            TYPE,
            req.body.authData?.data?.USER_ID || 0,
            TECHNICIAN_STATUS
        ],
        supportKey,
        (error, result) => {
            if (error) return callback(error);
            callback(null, result[0][0]);
        }
    );
}

//p
exports.dayTrack = (req, res) => {
    try {
        const data = TechnicianreqData(req);
        const supportKey = req.headers['supportkey'];
        const LOG_DATE_TIME = mm.getSystemDate();

        let LOG_TEXT = '';
        let TECHNICIAN_STATUS = 1;
        let CATEGORY = 'TECHNICIAN';

        if (data.TYPE === "IN") {
            LOG_TEXT = "The day has been started by the technician.";
            TECHNICIAN_STATUS = 1;
        } else if (data.TYPE === "OUT") {
            LOG_TEXT = "The day has been ended by the technician.";
            TECHNICIAN_STATUS = 0;
        } else if (data.TYPE === "BS") {
            LOG_TEXT = "The break has been started by the technician.";
        } else if (data.TYPE === "BI") {
            LOG_TEXT = "The break has been ended by the technician.";
        } else {
            return res.status(422).json({
                "code": 422,
                "message": "Invalid TYPE",
            });
        }

        const currentDate = new Date().toISOString().split('T')[0];

        /* ---- SP PARAMS (NO STATUS LOGIC) ---- */
        const params = [
            data.TECHNICIAN_ID,
            currentDate,
            data.START_TIME || null,
            data.END_TIME || null,
            data.TOTAL_TIME || null,
            data.BREAK_START_TIME || null,
            data.BREAK_END_TIME || null,
            data.TYPE || null,
            data.REMARK || null,
            data.CLIENT_ID || 1,
            data.READ_ONLY || 0,
            data.ARCHIVE_FLAG || 0
        ];

        mm.executeQueryData(
            `CALL sp_technician_day_track(?,?,?,?,?,?,?,?,?,?,?,?)`,
            params,
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        "code": 400,
                        "message": "Failed to process technician day track",
                    });
                }

                updateLogAndStatus(
                    data.TECHNICIAN_ID,
                    LOG_DATE_TIME,
                    LOG_TEXT,
                    data.TYPE,
                    CATEGORY,
                    TECHNICIAN_STATUS,
                    supportKey,
                    req,
                    (error) => {
                        if (error) {
                            console.log(error);
                            return res.status(400).json({
                                "code": 400,
                                "message": "Day track saved but log update failed",
                            });
                        }

                        return res.status(200).json({
                            "code": 200,
                            "message": result[0][0].MESSAGE,
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.log(error);
        res.send({
            "code": 500,
            "message": "Internal Server Error",
        });
    }
};


exports.getDayTrack = (req, res) => {
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

    if (mm.sanitizeFilter(filter) !== "0") {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_technicianDayTrack_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    if (logger) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    }
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get technician day track information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 97,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        if (logger) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        }
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};


exports.verifyOTPToConfirm = (req, res) => {
    const data = reqData(req); // Use your existing reqData function if available
    const errors = validationResult(req); // Add validation if needed
    const supportKey = req.headers['supportkey'];

    // Extract required fields
    const {
        MOBILE_NUMBER,
        EMAIL_ID,
        TECHNICIAN_ID,
        JOB_CARD_NO,
        REMARK,
        OTP
    } = req.body;

    // Validation
    if (!MOBILE_NUMBER || !TECHNICIAN_ID || !JOB_CARD_NO || !OTP) {
        return res.status(400).json({
            "code": 400,
            "message": "Missing required fields: MOBILE_NUMBER, TECHNICIAN_ID, JOB_CARD_NO, and OTP are required."
        });
    }

    // If you have validation rules, use them
    if (errors && !errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
            "message": "Validation failed",
            errors: errors.array()
        });
    }

    try {
        // Call stored procedure for OTP verification
        mm.executeQueryData(
            `CALL sp_technician_verifyOTPToConfirm(?,?,?,?,?,?,?)`,
            [
                MOBILE_NUMBER,
                EMAIL_ID || null, // Handle optional email
                TECHNICIAN_ID,
                JOB_CARD_NO,
                REMARK || null, // Handle optional remark
                OTP,
                req.userId || null // Add user context if available
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error("Error verifying OTP:", error);

                    // Log error
                    if (logger) {
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    }

                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to verify OTP. Please try again."
                    });
                }

                // Assuming stored procedure returns structured response
                const result = results[0] && results[0][0] ? results[0][0] : {};

                if (result.code === 200) {
                    res.status(200).json({
                        "code": 200,
                        "message": result.message || "OTP verified successfully.",
                        data: result.data || null
                    });
                } else {
                    res.status(400).json({
                        "code": result.code || 400,
                        "message": result.message || "OTP verification failed."
                    });
                }
            }
        );
    } catch (error) {
        console.error("Unexpected error in verifyOTPToConfirm:", error);

        // Log error
        if (logger) {
            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        }

        res.status(500).json({
            "code": 500,
            "message": "Something went wrong. Please try again later."
        });
    }
};


exports.completeJobByGuestTechnician = (req, res) => {
    const data = reqData(req); // Use your existing reqData function
    const errors = validationResult(req); // Add validation if needed
    const supportKey = req.headers['supportkey'];

    // Extract required fields
    const {
        TECHNICIAN_ID,
        JOB_CARD_NO,
        REMARK
    } = req.body;

    // Validation
    if (!TECHNICIAN_ID || !JOB_CARD_NO) {
        return res.status(400).json({
            "code": 400,
            "message": "Missing required fields: TECHNICIAN_ID and JOB_CARD_NO are required."
        });
    }

    // If you have validation rules, use them
    if (errors && !errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
            "message": "Validation failed",
            errors: errors.array()
        });
    }

    try {
        // Call stored procedure for job completion
        mm.executeQueryData(
            `CALL sp_completeJobByGuestTechnician(?,?,?,?)`,
            [
                TECHNICIAN_ID,
                JOB_CARD_NO,
                REMARK || null, // Handle optional remark
                req.userId || null // Add user context if available
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error("Error completing job:", error);

                    // Log error
                    if (logger) {
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    }

                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to complete the job. Please try again."
                    });
                }

                // Assuming stored procedure returns structured response
                const result = results[0] && results[0][0] ? results[0][0] : {};

                if (result.code === 200) {
                    res.status(200).json({
                        "code": 200,
                        "message": result.message || "Job completed successfully.",
                        data: {
                            job_card_no: JOB_CARD_NO,
                            technician_id: TECHNICIAN_ID,
                            updated_at: new Date().toISOString()
                        }
                    });
                } else {
                    res.status(400).json({
                        "code": result.code || 400,
                        "message": result.message || "Failed to complete the job."
                    });
                }
            }
        );
    } catch (error) {
        console.error("Unexpected error in completeJobByGuestTechnician:", error);

        // Log error
        if (logger) {
            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        }

        res.status(500).json({
            "code": 500,
            "message": "Something went wrong. Please try again later."
        });
    }
};


exports.confirmByLink = (req, res) => {
    const data = reqData(req); // Use your existing reqData function
    const errors = validationResult(req); // Add validation if needed
    const supportKey = req.headers['supportkey'];

    // Extract required field
    const { HAPPY_CODE } = req.body;

    // Validation
    if (!HAPPY_CODE) {
        return res.status(400).json({
            "code": 400,
            "message": "Missing required field: HAPPY_CODE is required."
        });
    }

    // If you have validation rules, use them
    if (errors && !errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
            "message": "Validation failed",
            errors: errors.array()
        });
    }

    try {
        const setContext = `SET @v_HAPPY_CODE = ${HAPPY_CODE};SET @v_USER_ID = ${req.userId || null};`;
        // Call stored procedure for happy code verification
        mm.executeQueryData(
            setContext + `CALL sp_confirmByLink(?)`,
            [

                req.userId || null // Add user context if available
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error("Error confirming by link:", error);

                    // Log error
                    if (logger) {
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    }

                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to process confirmation. Please try again."
                    });
                }

                // Assuming stored procedure returns structured response
                const result = results[0] && results[0][0] ? results[0][0] : {};

                res.status(200).json({
                    "code": result.code || 400,
                    "message": result.message || "Confirmation failed.",
                    data: result.data || null
                });
            }
        );
    } catch (error) {
        console.error("Unexpected error in confirmByLink:", error);

        res.status(500).json({
            "code": 500,
            "message": "Something went wrong. Please try again later."
        });
    }
};


function sendWelcomeEmail(emailId, name, mobileNumber) {
    const to = emailId;
    const subject = `Welcome to Vantage – We’re Excited to Have You!`;
    const body = `
        <p>Hi ${name},</p>
        <p>Welcome to <strong>Vantage</strong>. Your account has been created successfully, and we’re thrilled to have you on board!</p>
        <p>If you have any questions or need assistance, feel free to reach out to us at any time. We look forward to working with you!</p>
        <br>
        <p>Best regards,</p>
        <p><strong>The Vantage Team</strong></p>`;
    const TEMPLATE_NAME = 'TECHNICIAN_WELCOME_EMAIL';
    const ATTACHMENTS = '';

    mm.sendEmail(to, [], subject, body, TEMPLATE_NAME, ATTACHMENTS, (error, results) => {
        if (error) {
            console.error('Failed to send welcome email:', error);
        } else {
            console.log('Welcome email sent successfully:', results);
        }
    });
}


function sendOtpTologin(encrypted, MOBILE_NUMBER, NAME, OTP, req, res) {
    const supportKey = "0980989890889";
    var otpText1 = `Dear ${NAME}, please share OTP ${OTP} with our technician to complete your order. For queries, contact Vantage Team.Team UVtechSoft.`
    mm.sendSMS(MOBILE_NUMBER, otpText1, (error, resultswsms) => {
        if (error) {
            console.log(error);
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        }
        else {
            console.log(resultswsms);
        }
    });
}


//d
exports.verifyOTP = async (req, res) => {

    const {
        TYPE,
        TYPE_VALUE,
        OTP,
        CLOUD_ID,
        DEVICE_TYPE,
        DEVICE_ID,
        DEVICE_NAME,
        DEVICE_IP,
        SESSION_KEY
    } = req.body;

    const supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();
        mm.executeDML(
            `CALL sp_verifyOTP(?,?,?,?,?)`,
            [TYPE, TYPE_VALUE, OTP, DEVICE_ID, CLOUD_ID],
            supportKey,
            connection,
            async (error, result) => {

                if (error) {
                    console.log("error", error);
                    mm.rollbackConnection(connection)
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to login..."
                    });
                }
                const technician = result[1][0];
                const r = result[0][0];


                if (r.code !== 200) {
                    mm.commitConnection(connection)
                    return res.status(200).json(r);
                }

                const TECHNICIAN_ID = r.TECHNICIAN_ID;


                const subscribedChannels = await channelSubscribedUsers.find({
                    USER_ID: TECHNICIAN_ID,
                    TYPE: "T",
                    STATUS: true
                });

                const userDetails = [{
                    USER_ID: technician.ID,
                    USER_NAME: technician.NAME,
                    MOBILE_NUMBER: technician.MOBILE_NUMBER,
                    CLIENT_ID: technician.CLIENT_ID,
                    FIRST_NAME: technician.FIRST_NAME,
                    FATHER_NAME: technician.FATHER_NAME,
                    SURNAME: technician.SURNAME,
                    EMAIL_ID: technician.EMAIL_ID,
                    SUBSCRIBED_CHANNELS: subscribedChannels
                }];

                const userDetails1 = [{
                    USER_ID: technician.ID,
                    USER_NAME: technician.NAME,
                    NAME: technician.NAME
                }];

                const sessionData = {
                    DEVICE_TYPE,
                    DEVICE_ID,
                    DEVICE_NAME,
                    DEVICE_IP,
                    SESSION_KEY
                };

                mm.userloginlogs(
                    TECHNICIAN_ID,
                    "T",
                    mm.getSystemDate(),
                    "L",
                    supportKey
                );

                updateLoginInfo(
                    req,
                    res,
                    connection,
                    supportKey,
                    TECHNICIAN_ID,
                    userDetails,
                    sessionData,
                    userDetails1
                );
            }
        );
    } catch (error) {
        console.log("catch error", error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

//d
function updateLoginInfo(req, res, connection, supportKey, userId, userData, sessionData, userDetails1) {
    try {
        const systemDate = mm.getSystemDate();

        if (!userId) {
            return res.send({
                "code": 400,
                "message": "parameter missing - data"
            });
        }
        mm.executeDML(
            'CALL sp_close_user_sessions(?,?)',
            [userId, systemDate],
            supportKey,
            connection,
            (error) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    return res.send({
                        "code": 400,
                        "message": "Failed to update user session details"
                    });
                }

                // 2️⃣ Create new session
                createUserSession(
                    req,
                    userId,
                    sessionData,
                    supportKey,
                    connection,
                    (error, sessionKey) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection)
                            return res.send({
                                "code": 400,
                                "message": "Failed to create user session"
                            });
                        }

                        userData[0].sessionKey = sessionKey;
                        mm.commitConnection(connection)
                        generateToken(userId, res, userData, "1", userDetails1);
                    }
                );
            }
        );
    } catch (error) {
        console.log(error);
    }
}

//d
function createUserSession(req, userId, sessionData, supportKey, connection, callback) {
    try {
        const systemDate = mm.getSystemDate();

        getSessionKey(req, supportKey, (error, sessionKey) => {
            if (error) return callback(error);

            mm.executeDML(
                'CALL sp_create_user_session(?,?,?,?,?,?,?,?)',
                [
                    userId,
                    sessionData.DEVICE_TYPE,
                    sessionData.DEVICE_ID,
                    sessionData.DEVICE_NAME,
                    sessionData.DEVICE_IP,
                    systemDate,
                    sessionKey,
                    1
                ],
                supportKey,
                connection,
                (error) => {
                    if (error) return callback(error);

                    // 🔹 SAME FILE LOGIC (UNCHANGED)
                    const pathName = path.join(__dirname, '../../userdata/sessionData.txt');
                    const fs = require('fs');

                    let data = fs.existsSync(pathName)
                        ? fs.readFileSync(pathName, { encoding: "utf8" })
                        : '';

                    let data1 = data.length > 0 ? JSON.parse(data) : [];

                    if (data1.length > 0) {
                        let index = -1;

                        if (sessionData.DEVICE_TYPE === "D" || sessionData.DEVICE_TYPE === "M") {
                            index = data1.findIndex(
                                c =>
                                    c.USER_ID === userId &&
                                    (c.DEVICE_TYPE === "D" || c.DEVICE_TYPE === "M")
                            );
                        } else {
                            index = data1.findIndex(
                                c => c.USER_ID === userId && c.DEVICE_TYPE === "W"
                            );
                        }

                        if (index >= 0) data1.splice(index, 1);
                    }

                    data1.push({
                        USER_ID: userId,
                        SESSION_KEY: sessionKey,
                        DEVICE_TYPE: sessionData.DEVICE_TYPE
                    });

                    fs.writeFileSync(pathName, JSON.stringify(data1));

                    callback(null, sessionKey);
                }
            );
        });
    } catch (error) {
        callback(error);
    }
}

//d
function getSessionKey(req, supportKey, callback) {

    const sessionKey = mm.generateKey(32);

    mm.executeQueryData(
        `CALL sp_userSession_checkKey(?)`,
        [sessionKey],
        supportKey,
        (error, results) => {

            if (error) {
                callback(error);
            } else {

                if (results[0].length > 0) {
                    // Key already exists → generate again
                    getSessionKey(req, supportKey, callback);
                } else {
                    callback(null, sessionKey);
                }

            }

        }
    );
}

//d
exports.logout = (req, res) => {

    const { SESSION_KEY, USER_ID } = req.body;
    const supportKey = req.headers["supportkey"];
    const systemDate = mm.getSystemDate();

    if (!SESSION_KEY || SESSION_KEY === " ") {
        return res.send({
            "code": 400,
            "message": "parameter missing.",
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_technician_logout(?,?)`,
            [SESSION_KEY, USER_ID],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        "code": 400,
                        "message": "Failed to logut from system ",
                    });
                }

                /* ---- FILE LOGIC (UNCHANGED) ---- */
                const fs = require("fs");
                const data = fs.readFileSync(
                    "./userdata/sessionData.txt",
                    { encoding: "utf8" }
                );

                let data1 = [];
                if (data && data.length > 0) {
                    data1 = JSON.parse(data);
                    const index = data1.findIndex(
                        (c) => c.SESSION_KEY === SESSION_KEY
                    );
                    if (index >= 0) {
                        data1.splice(index, 1);
                    }
                }

                fs.writeFileSync(
                    "./userdata/sessionData.txt",
                    JSON.stringify(data1),
                    "utf8"
                );

                /* ---- LOGIN LOG ---- */
                mm.userloginlogs(
                    USER_ID,
                    "T",
                    systemDate,
                    "O",
                    supportKey
                );

                res.send({
                    "code": 200,
                    "message": "Successfully logout from system ...",
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to logut from system.",
        });
    }
};

exports.updateTechnicianProfile = (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ "code": 422, "message": errors.errors });
    }

    const {
        ID,
        EMAIL_ID,
        MOBILE_NUMBER,
        NAME,
        PROFILE_PHOTO,
        GENDER
    } = req.body;

    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    try {
        const OTP = Math.floor(100000 + Math.random() * 900000);

        mm.executeQueryData(
            `CALL sp_updateTechnicianProfile(?,?,?,?,?,?,?)`,
            [
                ID,
                EMAIL_ID,
                MOBILE_NUMBER,
                NAME,
                PROFILE_PHOTO,
                GENDER,
                OTP
            ],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to validate technician email or mobile number."
                    });
                }

                const r = result[0][0];

                /* Validation responses */
                if (r.code === 400) {
                    return res.status(400).json({ "message": r.message });
                }

                /* Mobile changed → send OTP */
                if (r.is_new_mobile === 1) {
                    sendOtp(
                        "M",
                        MOBILE_NUMBER,
                        "OTP verify",
                        body,
                        OTP,
                        NAME,
                        supportKey,
                        (error) => {
                            if (error) {
                                return res.status(400).json({
                                    "message": "Failed to send OTP."
                                });
                            }

                            saveTechnicianLog(req, ID, NAME, systemDate);
                            res.status(201).json({
                                "message": "Technician information updated successfully...",
                                is_new_mobile: 1
                            });
                        }
                    );
                }
                /* Mobile unchanged */
                else {
                    saveTechnicianLog(req, ID, NAME, systemDate);
                    res.status(200).json({
                        "message": "Technician information updated successfully..."
                    });
                }
            }
        );

    } catch (error) {
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

function saveTechnicianLog(req, techId, name, systemDate) {
    const ACTION_DETAILS =
        `${req.body.authData.data.UserData[0].NAME} has updated the details of technician ${name}`;

    const actionLog = {
        SOURCE_ID: techId,
        LOG_DATE_TIME: systemDate,
        LOG_TEXT: ACTION_DETAILS,
        CATEGORY: "technician",
        CLIENT_ID: 1,
        USER_ID: req.body.authData.data.UserData[0].USER_ID,
        supportKey: 0
    };

    dbm.saveLog(actionLog, systemLog);
}


function sendOtp(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var subject = "Technician Otp Support"
    var otpText1
    if (TYPE == "M") {
        callback(null, OTP);
        otpText1 = `Your Profile Update Request OTP is ${OTP}. This code is valid for the next [5 minutes]. Please do not share it with anyone.`
    } else {
        callback(null, OTP);
        otpText1 = `<p style="text-align: justify;"><strong>Dear Technician,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: left;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with servicedesk@ovationwps.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Vantage</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"></p>`;
    }

}

exports.verifyProfileOTP = (req, res) => {
    try {
        const {
            OTP,
            MOBILE_NUMBER,
            TECHNICIAN_ID
        } = req.body;

        const supportKey = req.headers["supportkey"];

        if (!OTP || OTP === " " || !MOBILE_NUMBER || MOBILE_NUMBER === " ") {
            return res.status(400).json({
                "message": "mobileno or OTP parameter missing.",
            });
        }

        mm.executeQueryData(
            `CALL sp_verifyProfileOTP(?,?,?)`,
            [TECHNICIAN_ID, OTP, MOBILE_NUMBER],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    return res.status(400).send({
                        "code": 400,
                        "message": "Failed to get opt details ",
                    });
                }

                const r = result[0][0];

                if (r.code !== 200) {
                    return res.status(400).json({
                        "code": 400,
                        "message": r.message
                    });
                }

                res.status(200).json({
                    "code": 200,
                    "message": "OTP verified successfully..."
                });
            }
        );

    } catch (error) {
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};


exports.sendOTP = (req, res) => {

    const {
        TYPE,
        TYPE_VALUE,
        DEVICE_ID,
        COUNTRY_CODE
    } = req.body;

    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    try {
        if (!TYPE_VALUE || !TYPE || !DEVICE_ID) {
            return res.send({
                "code": 400,
                "message": "incorrect parameters"
            });
        }

        /* OTP logic unchanged */
        let OTP;
        if (
            TYPE_VALUE === "7020082803" ||
            TYPE_VALUE === "8618749880" ||
            TYPE_VALUE === "9359500960"
        ) {
            OTP = mm.getOtp();
        } else {
            OTP = mm.getOtp();
        }

        mm.executeQueryData(
            `CALL sp_sendOTP_technician(?,?,?,?,?,?)`,
            [
                TYPE,
                TYPE_VALUE,
                DEVICE_ID,
                COUNTRY_CODE,
                OTP,
                systemDate
            ],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        "code": 400,
                        "message": "Failed to get technician data.",
                    });
                }

                const r = result[0][0];
                console.log("r", r)

                if (r.code !== 200) {
                    return res.send({
                        "code": r.code,
                        "message": r.message
                    });
                }

                /* Send OTP (unchanged) */
                const body =
                    `Your one-time password (OTP) is ${OTP}. ` +
                    `Please enter this code to complete your login. ` +
                    `This code is valid for 10 minutes. Team UVtechSoft.`;

                sendOtpTologin(
                    "E",
                    r.EMAIL_ID,
                    "OTP Verify",
                    body,
                    OTP,
                    '',
                    supportKey,
                    (error) => {
                        if (error) {
                            console.log(error);
                            return res.send({
                                "code": 400,
                                "message": "Failed to send OTP",
                            });
                        }

                        res.send({
                            "code": 200,
                            "message": "Otp successfully sent",
                            type: 1,
                            EMAIL_ID: r.EMAIL_ID
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};



function sendSMSEmail(type, to, OTP, subject, body, callback) {
    if (type == "M") {
       callback(null, OTP);
    } else if (type == "E") {
        let data = {
            USER_ID: '',
            TYPE: 'text',
            ATTACHMENT: '',
        }
        mm.sendEmail(to, [], subject, body, 'technician login otp', "", (error, results) => {
            if (error) {
                console.log(error);
                callback(null, results);
            } else {
                callback(null, results);
            }
        });
    }
};

function sendOtpTologin(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    var subject = "Technician Login OTP"
    var otpText1
    if (TYPE == "M") {
        // var otpText1 = `Dear Technician, please share OTP ${OTP} with our technician to complete your order. For queries, contact Vantage Team.Team UVtechSoft.`
        otpText1 = `Your one-time password (OTP) is ${OTP}. Please enter this code to complete your login. This code is valid for 10 minutes. Team UVtechSoft.`;
    } else {
        otpText1 = `<p style="text-align: justify;"><strong>Dear Technician,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: left;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with servicedesk@ovationwps.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Vantage</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"></p>`;

    }
    sendSMSEmail(TYPE, TYPE_VALUE, OTP, subject, otpText1, (error, results) => {
        if (error) {
            callback(error);
        }
        else {
            callback(null);
        }
    });

}

//d
exports.clearId = (req, res) => {

    const { SESSION_KEY, USER_ID } = req.body;
    const supportKey = req.headers["supportkey"];

    try {
        if (!SESSION_KEY || SESSION_KEY === " ") {
            return res.send({
                "code": 400,
                "message": "parameter missing.",
            });
        }

        mm.executeQueryData(
            `CALL sp_clearTechnicianId(?,?)`,
            [SESSION_KEY, USER_ID],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        "code": 400,
                        "message": "Failed to logut from system ",
                    });
                }

                /* ---- FILE SESSION CLEANUP (UNCHANGED) ---- */
                const fs = require("fs");
                const data = fs.readFileSync(
                    "./userdata/sessionData.txt",
                    { encoding: "utf8" }
                );

                let data1 = [];
                if (data && data.length > 0) {
                    data1 = JSON.parse(data);
                    const index = data1.findIndex(
                        (c) => c.SESSION_KEY === SESSION_KEY
                    );
                    if (index >= 0) {
                        data1.splice(index, 1);
                    }
                }

                fs.writeFileSync(
                    "./userdata/sessionData.txt",
                    JSON.stringify(data1),
                    "utf8"
                );

                res.send({
                    "code": 200,
                    "message": "Successfully logout from system ...",
                });
            }
        );

    } catch (error) {
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to logut from system.",
        });
    }
};




exports.getUnAvailablityOfTechnician = (req, res) => {

    const supportKey = req.headers['supportkey'];

    const pageIndex = req.body.pageIndex ? parseInt(req.body.pageIndex) : null;
    const pageSize = req.body.pageSize ? parseInt(req.body.pageSize) : null;

    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue && req.body.sortValue.toUpperCase() === 'ASC'
        ? 'ASC'
        : 'DESC';


    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }
    var filter = req.body.filter || '';
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;

    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);


    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;

    try {
        if (IS_FILTER_WRONG !== "0") {
            return res.status(400).json({
                "message": "Invalid filter parameter."
            });
        }

        mm.executeQueryData(
            setContext + `CALL sp_getUnAvailablityOfTechnician()`,
            [],
            supportKey,
            (error, results) => {
                const resultSets = results.filter(r => Array.isArray(r));
                const resultsServiceCalender = resultSets[0] || [];
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get technician_service_calender data."
                    });
                }

                const mongoQuery = {
                    TECHNICIAN_ID: TECHNICIAN_ID
                };

                const sort = {};
                sort[sortKey] = sortValue === 'ASC' ? 1 : -1;

                require("../../modules/technicianActivityCalender")
                    .find(mongoQuery)
                    .skip(start)
                    .limit(end)
                    .sort(sort)
                    .then((resultsActivityCalender) => {
                        res.status(200).json({
                            "message": "success",
                            "DATA1": resultsServiceCalender,
                            "DATA2": resultsActivityCalender
                        });
                    })
                    .catch((error) => {
                        console.log(error);
                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );
                        res.status(500).json({
                            "message": "MongoDB query failed."
                        });
                    });
            }
        );

    } catch (error) {
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};



const runSP = (spName, params, supportKey, callback) => {
    const placeholders = params.map(() => '?').join(',');
    const query = `CALL ${spName}(${placeholders})`;
    mm.executeQueryData(query, params, supportKey, (error, results) => {
        if (error) {
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
};

exports.sendOTPtoConfirm = (req, res) => {
    console.log("\n\n\n\n\n\n req.body.authData : ", req.body);
    const MOBILE_NUMBER = req.body.MOBILE_NUMBER;
    const EMAIL_ID = req.body.EMAIL_ID;
    const CUST_TYPE = req.body.CUST_TYPE
    const TECHNICIAN_NAME = req.body.TECHNICIAN_NAME ? req.body.TECHNICIAN_NAME : "";
    const USER_ID = req.body.USER_ID;
    const COUNTRY_CODE = req.body.COUNTRY_CODE;
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    const CUSTOMER_NAME = req.body.CUSTOMER_NAME
    const ORDER_ID = req.body.ORDER_ID;
    const ORDER_NO = req.body.ORDER_NO;
    const JOB_CARD_NO = req.body.JOB_CARD_NO;
    const JOB_CARD_ID = req.body.ID;
    const SERVICE_ID = req.body.SERVICE_ID;
    const systemDate = mm.getSystemDate();
    const supportKey = req.headers['supportkey'];

    if (!MOBILE_NUMBER || !COUNTRY_CODE || !TECHNICIAN_ID || !CUSTOMER_ID || !ORDER_ID || !ORDER_NO || !JOB_CARD_NO || !SERVICE_ID) {
        return res.send({
            code: 400,
            message: "Missing required fields in the request body.",
        });
    }

    try {
        // Get customer data using SP
        runSP('sp_get_customer_by_mobile_id', [MOBILE_NUMBER, CUSTOMER_ID], supportKey, (error, results1) => {
            if (error) {
                console.error(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    code: 400,
                    message: "Failed to get customer data.",
                });
            } else {
                const customerData = results1[0] || [];
                if (customerData.length > 0) {
                    var OTP
                    if (MOBILE_NUMBER == "7020082803" || MOBILE_NUMBER == "8618749880" || MOBILE_NUMBER == "8669806792" || MOBILE_NUMBER == "9833998770" || MOBILE_NUMBER == "9156429948") {
                        OTP = mm.getOtp();
                    } else {
                        OTP = mm.getOtp();
                    }

                    // Insert OTP using SP
                    runSP('sp_insert_job_card_otp', [
                        MOBILE_NUMBER, TECHNICIAN_ID, CUSTOMER_ID, ORDER_ID, ORDER_NO,
                        JOB_CARD_NO, SERVICE_ID, OTP, systemDate, null, 'P', EMAIL_ID
                    ], supportKey, (error, resultsOtp1) => {
                        if (error) {
                            console.error(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                code: 400,
                                message: "Failed to save OTP information...",
                            });
                        } else {
                            if (resultsOtp1[0][0].code == 400) {
                                console.log("resultsOtp1[0][0].message", resultsOtp1[0][0].message)
                                return res.send({
                                    code: 400,
                                    message: resultsOtp1[0][0].message,
                                });
                            }
                            const crypto = require('crypto');

                            // Ensure the key is exactly 16 bytes
                            const secretKey = Buffer.alloc(16, 'SixteenCharKey!');
                            const iv = crypto.randomBytes(16); // Random Initialization Vector (IV)

                            // Function to filter and format encrypted string
                            function formatToAlphabetic(base64String) {
                                // Remove non-alphabetic characters
                                const alphabeticString = base64String.replace(/[^A-Za-z]/g, '');
                                // Ensure it's exactly 30 characters
                                return alphabeticString.slice(0, 30).padEnd(30, 'A'); // Pad with 'A' if needed
                            }

                            // Encrypt Function
                            function encrypt(text) {
                                const cipher = crypto.createCipheriv('aes-128-cbc', secretKey, iv);
                                let encrypted = cipher.update(text, 'utf8', 'base64');
                                encrypted += cipher.final('base64');
                                // Combine IV and Encrypted text
                                const combined = `${iv.toString('base64')}:${encrypted}`;
                                // Convert to alphabetic only
                                return formatToAlphabetic(combined);
                            }

                            // Example Usage
                            const encrypted = encrypt(JOB_CARD_NO);
                            console.log('\nEncrypted (Alphabetic 30):', encrypted);

                            // Update job card happy code using SP
                            runSP('sp_update_job_card_happy_code', [encrypted, JOB_CARD_NO], supportKey, (error, resultsUpdate) => {
                                if (error) {
                                    console.error(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        code: 400,
                                        message: "Failed to update work order data.",
                                    });
                                } else {
                                    console.log("\n\n\n\n\n\n req.body.authData : ", req.body);

                                    let notificationData = {
                                        "ORDER_ID": ORDER_ID,
                                        "ORDER_NO": ORDER_NO,
                                        "JOB_CARD_NO": JOB_CARD_NO,
                                        "CUSTOMER_NAME": CUSTOMER_NAME,
                                        "TECHNICIAN_NAME": TECHNICIAN_NAME,
                                        "MOBILE_NUMBER": MOBILE_NUMBER,
                                        "EMAIL_ID": EMAIL_ID,
                                        "CUST_TYPE": CUST_TYPE,
                                        "TECHNICIAN_ID": TECHNICIAN_ID,
                                        "ORDER_STATUS": req.body.ORDER_STATUS,
                                        "USER_ID": USER_ID,
                                        "COUNTRY_CODE": COUNTRY_CODE,
                                        "SERVICE_ID": SERVICE_ID,
                                        "JOB_CARD_ID": JOB_CARD_ID,
                                        "CUSTOMER_ID": CUSTOMER_ID
                                    };

                                    let ACTION_DETAILSs = `Dear ${customerData[0].NAME}, please share OTP ${OTP} with our technician ${TECHNICIAN_NAME} to complete your order. For queries, contact our support team at servicedesk@ovationwps.com.`

                                    mm.sendNotificationToChannel(TECHNICIAN_ID, `customer_${CUSTOMER_ID}_channel`, `Happy code for work order completion : ${OTP}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "J", "H", notificationData);

                                    sendHappycode("E", EMAIL_ID, OTP, customerData[0].NAME, supportKey, (error, results) => {
                                        if (error) {
                                            console.error(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                code: 400,
                                                message: "Failed to send email.",
                                            });
                                        }
                                    })

                                    res.send({
                                        code: 200,
                                        message: "OTP sent successfully.",
                                    });
                                }
                            });
                        }
                    });
                } else {
                    res.send({
                        code: 400,
                        message: "Invalid mobile number.",
                    });
                }
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.error(error);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};


function sendHappycode(TYPE, TYPE_VALUE, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    var subject = "Happy code for work order completion"
    var otpText1 = `<p style="text-align: justify;"><strong>Dear ${USER_NAME} ,</strong></p><p style="text-align: justify;">Your happy code for work order completion is</p><h1 style="text-align: left;"> ${OTP} </h1><p style="text-align: justify;">Please do share this happy code with technician to complete your work order.
</p><p>In case you need any further assistance for the same,
please do get in touch immediately with servicedesk@ovationwps.com.</p>
<strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Vantage</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"></p>`;
    var otpSendStatus = "S";

    sendSMSEmail(TYPE, TYPE_VALUE, OTP, subject, otpText1, (error, results) => {
        if (error) {
            callback(error);
        }
        else {
            callback(null);
        }
    });

}

exports.getInvoice = (req, res) => {
    var supportKey = req.headers['supportkey'];
    const { JOB_CARD_ID, ORDER_ID, JOB_CARD_NO, INVOICE_FOR, ORDER_NO } = req.body;
    let modifiedOrderNo = ORDER_NO.replace(/\//g, "-");
    let modifiedJobrNo = JOB_CARD_NO.replace(/\//g, "-");

    try {
        if (INVOICE_FOR === 'J') {
            const setContext = `SET @p_JOB_CARD_ID = ${JOB_CARD_ID};`;
            mm.executeQueryData(
                setContext + 'CALL sp_get_invoice_data_full()',
                [],
                supportKey,
                (error, results) => {
                    if (error || !results[0].length) {
                        return res.send({ "code": 400, "message": "Failed to get order data." });
                    }

                    const orderDetails = results[0];
                    const inventoryDetails = results[1] || [];

                    // 🔹 Amount calculation
                    const totalAmount = parseFloat(orderDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const totalAmount1 = parseFloat(inventoryDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const finalAmount = (parseFloat(totalAmount) + parseFloat(totalAmount1)).toFixed(2);
                    const invoiceTemplate = require('fs').readFileSync('templates/invoice.html', 'utf8');
                    const populatedHtml = invoiceTemplate
                        .replace('{{CustomerName}}', orderDetails[0]?.CUSTOMER_NAME || '')
                        .replace('{{BillingAddress}}', orderDetails[0]?.BILLING_ADDRESS_LINE_1 || '')
                        .replace('{{JobCardNo}}', orderDetails[0]?.JOB_CARD_NO || '')
                        .replace('{{OrderNumber}}', orderDetails[0]?.ORDER_NUMBER || '')
                        .replace('{{InvoiceDate}}', new Date().toLocaleDateString('en-GB'))
                        .replace('{{GstSection}}', orderDetails[0].IS_HAVE_GST == 1
                            ? `<h5 style="font-size: 18px !important">GST Details</h5>
                                <div class="row">
                                    <div class="col s6">
                                        <p><strong>Company Name:</strong> ${orderDetails[0]?.INDIVIDUAL_COMPANY_NAME || ''}</p>
                                        <p><strong>Company Address:</strong> ${orderDetails[0]?.COMPANY_ADDRESS || ''}</p>
                                        
                                    </div>
                                    <div class="col s6">
                                        <p><strong>GST No.:</strong> ${orderDetails[0]?.GST_NO || ''}</p>
                                        <p></p>
                                    </div>
                                </div>
                                <div class="divider"></div>`
                            : '')
                        .replace('{{OrderRows}}', orderDetails.map(order => `
                        <tr>
                            <td><span>${order.SERVICE_NAME}</span><br>
                        <span>HSN "code": ${order.HSN_CODE || '-'}</span></td>
                        <td style="text-align: center;">${order.QUANTITY}</td>
                        <td style="text-align: right;">${order.TAX_EXCLUSIVE_AMOUNT}</td>
                        <td style="text-align: right;">${order.EXPRESS_DELIVERY_CHARGES}</td>
                        <td style="text-align: right;">${order.TAX_RATE}</td>
                        <td style="text-align: right;">${order.TAX_AMOUNT}</td>
                        <td style="text-align: right;">${order.DISCOUNT_AMOUNT}</td>
                        <td style="text-align: right;">${order.TOTAL_AMOUNT}</td>
                        </tr>
                    `).join(''))
                        .replace('{{InventorySection}}', inventoryDetails.length > 0
                            ? `<h5 style="font-size: 18px !important">Part Details</h5>
                           <table class="striped">
                               <thead>
                                   <tr>
                                       <th>Part Name</th>
                                       <th>Quantity</th>
                                       <th>Tax</th>
                                       <th>Rate($)</th>
                                       <th>Total($)</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   ${inventoryDetails.map(item => `
                                       <tr>
                                           <td>${item.INVENTORY_NAME}</td>
                                           <td style="text-align: center;">${item.QUANTITY}</td>
                                           <td style="text-align: right;">${item.TAX_RATE}</td>
                                           <td style="text-align: right;">${item.RATE}</td>
                                           <td style="text-align: right;">${item.TOTAL_AMOUNT}</td>
                                       </tr>
                                   `).join('')}
                               </tbody>
                           </table>`
                            : '')
                        .replace('{{FinalAmount}}', finalAmount);
                    // Generate and Save PDF
                    const pdf = require('html-pdf');
                    const outputFilePath = `uploads/Invoices/${modifiedJobrNo}.pdf`;

                    pdf.create(populatedHtml, {
                        childProcessOptions: { env: { OPENSSL_CONF: '/dev/null' } }
                    }).toFile(outputFilePath, (error) => {
                        if (error) {
                            return res.send({ "code": 500, "message": "Failed to generate invoice PDF." });
                        }

                        // 🔹 Insert invoice + update inventory in one SP
                        mm.executeQueryData(
                            'CALL sp_insert_invoice_and_update_inventory(?,?,?,?,?,?,?,?,?,?)',
                            [
                                orderDetails[0].CUSTOMER_ID,
                                JOB_CARD_ID,
                                ORDER_ID,
                                orderDetails[0].SERVICE_ITEM_ID,
                                orderDetails[0].BILLING_ADDRESS_ID,
                                finalAmount,
                                finalAmount,
                                outputFilePath.split('/').pop(),
                                'J',
                                inventoryDetails.length > 0 ? inventoryDetails[0].REQUEST_MASTER_ID : null
                            ],
                            supportKey,
                            (error, insertResult) => {
                                if (error) {
                                    return res.send({ "code": 500, "message": "Failed to insert invoice record." });
                                }
                                if (inventoryDetails.length > 0) {
                                    let notificationData = {
                                        "ORDER_ID": ORDER_ID,
                                        "ORDER_NO": orderDetails[0]?.ORDER_NUMBER || '',
                                        "JOB_CARD_NO": JOB_CARD_NO,
                                        "CUSTOMER_NAME": orderDetails[0]?.CUSTOMER_NAME || '',
                                        "TECHNICIAN_NAME": req.body.authData.data.UserData[0].NAME,
                                        "MOBILE_NUMBER": orderDetails[0]?.MOBILE_NUMBER || '',
                                        "ORDER_STATUS": req.body.ORDER_STATUS,
                                        "EMAIL_ID": orderDetails[0]?.EMAIL_ID || '',
                                        "CUSTOMER_ID": orderDetails[0]?.CUSTOMER_ID || ''
                                    };
                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${orderDetails[0].CUSTOMER_ID}_channel`, `Inventory  Payment request for work order ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the work order ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "J", "J", notificationData);
                                    mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, `Part payment request for work order ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the work order ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "I", []);
                                    return res.send({
                                        "code": 200,
                                        "message": "Invoice generated successfully.",
                                        "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                    });
                                }
                                else {
                                    return res.send({
                                        "code": 200,
                                        "message": "Invoice generated successfully.",
                                        "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                    });
                                }

                            }
                        );
                    });
                }
            );
        }
        else if (INVOICE_FOR === 'P') {
            // Get order + inventory in one call
            mm.executeQueryData('CALL sp_get_invoice_data_for_P(?, ?)', [JOB_CARD_ID, ORDER_ID], supportKey, (error, results) => {
                if (error || !results[0].length) {
                    return res.send({ "code": 400, "message": "Failed to get order data." });
                }

                const orderDetails = results[0];
                const inventoryDetails = results[1] || [];

                const totalAmount = parseFloat(orderDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                const totalAmount1 = parseFloat(inventoryDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                const finalAmount = (parseFloat(totalAmount) + parseFloat(totalAmount1)).toFixed(2);
                const invoiceTemplate = require('fs').readFileSync('templates/invoice.html', 'utf8');
                const populatedHtml = invoiceTemplate
                    .replace('{{CustomerName}}', orderDetails[0]?.CUSTOMER_NAME || '')
                    .replace('{{BillingAddress}}', orderDetails[0]?.BILLING_ADDRESS_LINE_1 || '')
                    .replace('{{JobCardNo}}', orderDetails[0]?.JOB_CARD_NO || '')
                    .replace('{{OrderNumber}}', orderDetails[0]?.ORDER_NUMBER || '')
                    .replace('{{InvoiceDate}}', new Date().toLocaleDateString('en-GB'))
                    .replace('{{GstSection}}', orderDetails[0].IS_HAVE_GST == 1
                        ? `<h5 style="font-size: 18px !important">GST Details</h5>
                                <div class="row">
                                    <div class="col s6">
                                        <p><strong>Company Name:</strong> ${orderDetails[0]?.INDIVIDUAL_COMPANY_NAME || ''}</p>
                                        <p><strong>Company Address:</strong> ${orderDetails[0]?.COMPANY_ADDRESS || ''}</p>
                                        
                                    </div>
                                    <div class="col s6">
                                        <p><strong>GST No.:</strong> ${orderDetails[0]?.GST_NO || ''}</p>
                                        <p></p>
                                    </div>
                                </div>
                                <div class="divider"></div>`
                        : '')
                    .replace('{{OrderRows}}', orderDetails.map(order => `
                        <tr>
                            <td><span>${order.SERVICE_NAME}</span><br>
                        <span>HSN "code": ${order.HSN_CODE || '-'}</span></td>
                        <td style="text-align: center;">${order.QUANTITY}</td>
                        <td style="text-align: right;">${order.TAX_EXCLUSIVE_AMOUNT}</td>
                        <td style="text-align: right;">${order.EXPRESS_DELIVERY_CHARGES}</td>
                        <td style="text-align: right;">${order.TAX_RATE}</td>
                        <td style="text-align: right;">${order.TAX_AMOUNT}</td>
                        <td style="text-align: right;">${order.DISCOUNT_AMOUNT}</td>
                        <td style="text-align: right;">${order.TOTAL_AMOUNT}</td>
                        </tr>
                    `).join(''))
                    .replace('{{InventorySection}}', inventoryDetails.length > 0
                        ? `<h5 style="font-size: 18px !important">Part Details</h5>
                           <table class="striped">
                               <thead>
                                   <tr>
                                       <th>Part Name</th>
                                       <th>Quantity</th>
                                       <th>Tax</th>
                                       <th>Rate($)</th>
                                       <th>Total($)</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   ${inventoryDetails.map(item => `
                                       <tr>
                                           <td>${item.INVENTORY_NAME}</td>
                                           <td style="text-align: center;">${item.QUANTITY}</td>
                                           <td style="text-align: right;">${item.TAX_RATE}</td>
                                           <td style="text-align: right;">${item.RATE}</td>
                                           <td style="text-align: right;">${item.TOTAL_AMOUNT}</td>
                                       </tr>
                                   `).join('')}
                               </tbody>
                           </table>`
                        : '')
                    .replace('{{FinalAmount}}', finalAmount);
                // Generate and Save PDF


                const pdf = require('html-pdf');
                const outputFilePath = `uploads/Invoices/Invoice-${JOB_CARD_ID}-${ORDER_ID}.pdf`;
                pdf.create(populatedHtml, { childProcessOptions: { env: { OPENSSL_CONF: '/dev/null' } } })
                    .toFile(outputFilePath, (error) => {
                        if (error) {
                            return res.send({ "code": 500, "message": "Failed to generate invoice PDF." });
                        }

                        // Insert invoice + update inventory
                        mm.executeQueryData(
                            'CALL sp_insert_invoice_and_update_inventory_P(?,?,?,?,?,?,?,?,?,?)',
                            [
                                orderDetails[0].CUSTOMER_ID,
                                JOB_CARD_ID,
                                ORDER_ID,
                                orderDetails[0].SERVICE_ITEM_ID,
                                orderDetails[0].BILLING_ADDRESS_ID,
                                finalAmount,
                                finalAmount,
                                outputFilePath.split('/').pop(),
                                'P',
                                inventoryDetails.length > 0 ? inventoryDetails[0].REQUEST_MASTER_ID : null
                            ],
                            supportKey,
                            (error) => {
                                if (error) {
                                    return res.send({ "code": 500, "message": "Failed to insert invoice record." });
                                }

                                if (inventoryDetails.length > 1) {
                                    let notificationData = {
                                        "ORDER_ID": ORDER_ID,
                                        "ORDER_NO": orderDetails[0]?.ORDER_NUMBER || '',
                                        "JOB_CARD_NO": JOB_CARD_NO,
                                        "CUSTOMER_NAME": orderDetails[0]?.CUSTOMER_NAME || '',
                                        "TECHNICIAN_NAME": req.body.authData.data.UserData[0].NAME,
                                        "MOBILE_NUMBER": orderDetails[0]?.MOBILE_NUMBER || '',
                                        "ORDER_STATUS": req.body.ORDER_STATUS,
                                        "EMAIL_ID": orderDetails[0]?.EMAIL_ID || '',
                                        "CUSTOMER_ID": orderDetails[0]?.CUSTOMER_ID || ''
                                    };
                                    // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, orderDetails[0].CUSTOMER_ID, `Inventory  Payment request for work order ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the work order ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", req.body);
                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${orderDetails[0].CUSTOMER_ID}_channel`, `Inventory  Payment request for work order ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the work order ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "J", "J", notificationData);
                                    mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, `Inventory  Payment request for work order ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the work order ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "J", []);
                                    return res.send({
                                        "code": 200,
                                        "message": "Invoice generated successfully.",
                                        "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                    });
                                }
                                else {
                                    return res.send({
                                        "code": 200,
                                        "message": "Invoice generated successfully.",
                                        "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                    });
                                }


                            }
                        );
                    });
            });
        }
        else if (INVOICE_FOR === 'O') {
            const setContext = `SET @p_ORDER_ID = ${ORDER_ID};`;

            mm.executeQueryData(
                setContext + 'CALL sp_get_invoice_data_for_O(?)',
                [],
                supportKey,
                (error, results) => {
                    if (error || !results[0].length) {
                        return res.send({ "code": 400, "message": "Failed to get order data." });
                    }

                    const orderDetails = results[0];
                    const inventoryDetails = results[1] || [];

                    const totalAmount = parseFloat(orderDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const totalAmount1 = parseFloat(inventoryDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const finalAmount = (parseFloat(totalAmount) + parseFloat(totalAmount1)).toFixed(2);
                    const invoiceTemplate = require('fs').readFileSync('templates/order.html', 'utf8');
                    const populatedHtml = invoiceTemplate
                        .replace('{{CustomerName}}', orderDetails[0]?.CUSTOMER_NAME || '')
                        .replace('{{BillingAddress}}', orderDetails[0]?.BILLING_ADDRESS_LINE_1 || '')
                        .replace('{{OrderNumber}}', orderDetails[0]?.ORDER_NUMBER || '')
                        .replace('{{InvoiceDate}}', new Date().toLocaleDateString('en-GB'))
                        .replace('{{GstSection}}', orderDetails[0].IS_HAVE_GST == 1
                            ? `<h5 style="font-size: 18px !important">GST Details</h5>
                                <div class="row">
                                    <div class="col s6">
                                        <p><strong>Company Name:</strong> ${orderDetails[0]?.INDIVIDUAL_COMPANY_NAME || ''}</p>
                                        <p><strong>Company Address:</strong> ${orderDetails[0]?.COMPANY_ADDRESS || ''}</p>
                                        
                                    </div>
                                    <div class="col s6">
                                        <p><strong>GST No.:</strong> ${orderDetails[0]?.GST_NO || ''}</p>
                                        <p></p>
                                    </div>
                                </div>
                                <div class="divider"></div>`
                            : '')
                        .replace('{{OrderRows}}', orderDetails.map(order => `
                       <tr>
                        <td><span>${order.SERVICE_NAME}</span><br>
                        <span>HSN "code": ${order.HSN_CODE || '-'}</span></td>
                        <td style="text-align: center;">${order.QUANTITY}</td>
                        <td style="text-align: right;">${order.TAX_EXCLUSIVE_AMOUNT}</td>
                        <td style="text-align: right;">${order.EXPRESS_DELIVERY_CHARGES}</td>
                        <td style="text-align: right;">${order.TAX_RATE}</td>
                        <td style="text-align: right;">${order.TAX_AMOUNT}</td>
                        <td style="text-align: right;">${order.DISCOUNT_AMOUNT}</td>
                        <td style="text-align: right;">${order.TOTAL_AMOUNT}</td>
 
                    </tr>
                    `).join(''))
                        .replace('{{InventorySection}}', inventoryDetails.length > 0
                            ? `<h5 style="font-size: 18px !important">Part Details</h5>
                            <table class="striped">
                           <thead>
                               <tr>
                                   <th>Part Name</th>
                                   <th>work order No.</th>
                                   <th>Quantity</th>
                                   <th>Tax</th>
                                   <th>Rate($)</th>
                                   <th>Total($) </th>
                               </tr>
                           </thead>
                           <tbody>
                               ${inventoryDetails.map(item => `
                                   <tr>
                                       <td>${item.INVENTORY_NAME}</td>
                                       <td style="text-align: center;">${item.JOB_CARD_NO}</td>
                                       <td style="text-align: center;">${item.QUANTITY}</td>
                                       <td style="text-align: right;">${item.TAX_RATE}</td>
                                       <td style="text-align: right;">${item.RATE}</td>
                                       <td style="text-align: right;">${item.TOTAL_AMOUNT}</td>
                                   </tr>
                               `).join('')}
                           </tbody>
                       </table>`
                            : '')
                        .replace('{{FinalAmount}}', finalAmount);
                    // Generate and Save PDF
                    const fs = require('fs')
                    fs.writeFileSync('index.html', populatedHtml)
                    const pdf = require('html-pdf');
                    const outputFilePath = `uploads/Invoices/${modifiedOrderNo}.pdf`;

                    pdf.create(html, { childProcessOptions: { env: { OPENSSL_CONF: '/dev/null' } } })
                        .toFile(outputFilePath, () => {

                            mm.executeQueryData(
                                'CALL sp_insert_invoice_and_update_inventory_O(?,?,?,?,?,?,?,?,?,?)',
                                [
                                    orderDetails[0].CUSTOMER_ID,
                                    orderDetails[0].JOB_CARD_ID,
                                    ORDER_ID,
                                    orderDetails[0].SERVICE_ITEM_ID,
                                    orderDetails[0].BILLING_ADDRESS_ID,
                                    finalAmount,
                                    finalAmount,
                                    outputFilePath.split('/').pop(),
                                    'O',
                                    inventoryDetails.length ? inventoryDetails[0].REQUEST_MASTER_ID : null
                                ],
                                supportKey,
                                () => {
                                    if (inventoryDetails.length) {
                                        let notificationData = {
                                            "ORDER_ID": ORDER_ID,
                                            "ORDER_NO": orderDetails[0]?.ORDER_NUMBER || '',
                                            "JOB_CARD_NO": JOB_CARD_NO,
                                            "CUSTOMER_NAME": orderDetails[0]?.CUSTOMER_NAME || '',
                                            "TECHNICIAN_NAME": req.body.authData.data.UserData[0].NAME,
                                            "ORDER_STATUS": req.body.ORDER_STATUS,
                                            "MOBILE_NUMBER": orderDetails[0]?.MOBILE_NUMBER || '',
                                            "EMAIL_ID": orderDetails[0]?.EMAIL_ID || '',
                                            "CUSTOMER_ID": orderDetails[0]?.CUSTOMER_ID || ''
                                        };
                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, orderDetails[0].CUSTOMER_ID, `Inventory  Payment request for work order ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the work order ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", req.body);
                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${orderDetails[0].CUSTOMER_ID}_channel`, `Inventory  Payment request for work order ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the work order ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "J", "J", notificationData);
                                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, `Inventory  Payment request for work order ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the work order ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "J", []);
                                        return res.send({
                                            "code": 200,
                                            "message": "Invoice generated successfully.",
                                            "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                        });
                                    }
                                    else {
                                        return res.send({
                                            "code": 200,
                                            "message": "Invoice generated successfully.",
                                            "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                        });
                                    }
                                }
                            );
                        });
                }
            );
        }
        else {
            return res.send({
                "code": 400,
                "message": "Faild to generate invoice",
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

exports.verifyandCompleteByAdmin = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const STATUS = req.body.STATUS;
    const REMARK = req.body.REMARK || '';
    const ORDER_ID = req.body.ORDER_ID;
    const JOB_CARD_ID = req.body.ID;
    const USER_ID = req.body.USER_ID;
    const USER_NAME = req.body.USER_NAME;
    const IANA_CODE = req.body.IANA_CODE;
    const systemDate = mm.getSystemDate();
    const IS_UPDATED_BY_ADMIN = req.body.IS_UPDATED_BY_ADMIN || 0;

    if (!ORDER_ID || !STATUS || !JOB_CARD_ID) {
        return res.send({
            "code": 300,
            "message": `Required fields are missing. ORDER_ID, STATUS, ID`
        });
    }

    if (!IANA_CODE) {
        res.send({
            "code": 302,
            "message": "Please provide the order's timezone to proceed"
        });
        return;
    }
    var getUTCfromTimeZone = mm.getUTCFromTimezone(IANA_CODE);
    let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        const connection = mm.openConnection();
        let setData = "";
        let recordData = [];

        if (STATUS === "CO") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?, JOB_STATUS_ID = ?, JOB_COMPLETED_DATETIME = ?, USED_TIME = ?, REMARK = ?";
            recordData.push("EJ", "CO", 3, mm.getSystemDate(), 0, REMARK);
        } else {
            return res.send({
                "code": 400,
                "message": "Invalid STATUS value."
            });
        }
        const setContext = `
        SET @v_ORDER_ID = ${ORDER_ID};
        SET @v_JOB_CARD_ID = ${JOB_CARD_ID};
    `;
        mm.executeDML(setContext + 'call sp_customerOrderDetailsAdmin_get()', [], supportKey, connection, (error, OrderResult) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection);
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                return res.send({
                    "code": 400,
                    "message": "Failed to fetch order details."
                });
            }
            const resultSets = OrderResult.filter(r => Array.isArray(r));
            const order = resultSets[0][0];

            if (!resultSets[0] || resultSets[0].length === 0) {
                mm.rollbackConnection(connection);
                return res.send({
                    "code": 404,
                    "message": "Work order not found."
                });
            }

            // Extract order info


            const JOB_CARD_NO = order.JOB_CARD_NO;
            const TECHNICIAN_NAME = order.TECHNICIAN_NAME;
            const TECHNICIAN_ID = order.TECHNICIAN_ID;
            const formattedDate = mm.getFormmattedDate();

            const ACTION_DETAILS = `${USER_NAME} has completed the work order ${JOB_CARD_NO}`;
            const ORDER_STATUS_LOG = `${USER_NAME} has marked the work order ${JOB_CARD_NO} as completed.`;
            const LOG_TYPE = 'Job';
            const DESCRIPTION = `Dear Customer, your work order ${JOB_CARD_NO} has been completed successfully. Thank you for choosing our services.`;
            const TITLE = 'Work order completed by service desk team';

            if (STATUS === 'CO') {
                let notificationData = {
                    "ORDER_ID": ORDER_ID,
                    "ORDER_NO": order.ORDER_NUMBER,
                    "JOB_CARD_NO": JOB_CARD_NO,
                    "JOB_CARD_ID": JOB_CARD_ID,
                    "TECHNICIAN_ID": TECHNICIAN_ID,
                    "CUSTOMER_ID": order.CUSTOMER_ID,
                    "TECHNICIAN_NAME": TECHNICIAN_NAME,
                    "ORDER_STATUS": STATUS,
                    "CUSTOMER_NAME": order.CUSTOMER_NAME,
                    "TECHNICIAN_NAME": TECHNICIAN_NAME,
                    "MOBILE_NUMBER": order.MOBILE_NUMBER,
                    "EMAIL_ID": order.EMAIL_ID,
                    "CUSTOMER_ID": order.CUSTOMER_ID
                };
                // Send notification to customer
                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${order.CUSTOMER_ID}_channel`, `${TITLE}`, DESCRIPTION, "", "J", supportKey, "J", "J", notificationData);

                // Update order_master
                mm.executeDML(
                    `CALL sp_complete_order_after_job(?)`,
                    [ORDER_ID],
                    supportKey,
                    connection,
                    (error, spResult) => {
                        if (error) {
                            mm.rollbackConnection(connection);
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                            return res.status(400).send({
                                "code": 400,
                                "message": "Failed to update order information."
                            });
                        }

                        const getCountforinvoice = spResult[0][0];
                        const resultsjOBS = spResult[1];

                        mm.commitConnection(connection);

                        if (getCountforinvoice.length > 0) {
                            if (getCountforinvoice.some(item => item.JOB_CARD_STATUS === "Assigned")) {
                                console.log("The work order is in assigned stage, no invoice generated.");
                            } else {
                                mm.sendDynamicEmail(51, getCountforinvoice[0].ID, supportKey);
                            }
                        }

                        const ACTION_DETAILS1 = `${USER_NAME} has completed the work order ${JOB_CARD_NO}`;
                        let ORDER_STATUSS = '';

                        if (resultsjOBS.length === 0) {
                            ORDER_STATUSS = 'Work order is completed';
                        }

                        // Save logs
                        let logData = [{
                            TECHNICIAN_ID: TECHNICIAN_ID,
                            VENDOR_ID: 0,
                            ORDER_ID: order.ORDER_ID,
                            JOB_CARD_ID: order.ID,
                            CUSTOMER_ID: order.CUSTOMER_ID,
                            LOG_TYPE: resultsjOBS.length === 0 ? "Order" : LOG_TYPE,
                            ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician',
                            ACTION_DETAILS: resultsjOBS.length === 0 ? ACTION_DETAILS : ACTION_DETAILS1,
                            USER_ID: order.USER_ID,
                            TECHNICIAN_NAME: TECHNICIAN_NAME,
                            ORDER_DATE_TIME: order.EXPECTED_DATE_TIME,
                            CART_ID: 0,
                            EXPECTED_DATE_TIME: order.EXPECTED_DATE_TIME,
                            ORDER_MEDIUM: order.ORDER_MEDIUM,
                            ORDER_STATUS: ORDER_STATUSS,
                            PAYMENT_MODE: order.PAYMENT_MODE,
                            PAYMENT_STATUS: order.PAYMENT_STATUS,
                            TOTAL_AMOUNT: order.TOTAL_AMOUNT,
                            ORDER_NUMBER: order.ORDER_NUMBER,
                            TASK_DESCRIPTION: order.TASK_DESCRIPTION,
                            ESTIMATED_TIME_IN_MIN: order.ESTIMATED_TIME_IN_MIN,
                            PRIORITY: order.PRIORITY,
                            JOB_CARD_STATUS: ORDER_STATUS_LOG,
                            USER_NAME: TECHNICIAN_NAME,
                            DATE_TIME: MongoLogDate,
                            supportKey: 0,
                            IANA_CODE: IANA_CODE
                        }];

                        dbm.saveLog(logData, technicianActionLog);

                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, `${TITLE}`, DESCRIPTION, "", "J", supportKey, "J", []);

                        res.status(200).send({
                            "code": 200,
                            "message": "Successfully updated work order status."
                        });
                    }
                );

            } else {
                mm.commitConnection(connection);
                res.status(400).send({
                    "code": 400,
                    "message": "Wrong STATUS value."
                });
            }
        }
        );

    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.log(error);
        return res.status(400).send({
            "code": 400,
            "message": "Failed to update technician schedule information."
        });
    }
};


exports.updateJobStatusByGuest = (req, res) => {
    const errors = validationResult(req);
    const JOB_DATA = req.body.JOB_DATA;
    const IANA_CODE = req.body.IANA_CODE;
    var supportKey = req.headers['supportkey'];
    const TECHNICIAN_NAME = req.body.JOB_DATA[0].TECHNICIAN_NAME ? req.body.JOB_DATA[0].TECHNICIAN_NAME : req.body.TECHNICIAN_NAME ? req.body.TECHNICIAN_NAME : req.body.NAME;
    const fullJobCardNo = req.body.JOB_DATA[0].JOB_CARD_NO;
    const JOB_CARD_NO = fullJobCardNo.match(/JOB.*$/)?.[0] || fullJobCardNo;
    const TECHNICIAN_TYPE = req.body.TECHNICIAN_TYPE;
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    let ID = req.body.JOB_DATA[0].ID;
    let SERVICE_ID = req.body.JOB_DATA[0].SERVICE_ID;
    var ORDER_ID = req.body.JOB_DATA[0].ORDER_ID;
    var supportKey = req.headers['supportkey'];
    var STATUS = req.body.STATUS;
    let REMARK = req.body.REMARK ? req.body.REMARK : '';
    var systemDate = req.body.ACTIVITY_DATE_TIME;
    var ACTIVITY_DATE_TIME = req.body.ACTIVITY_DATE_TIME;
    var ACTIVITY_DATE_TIME_LOG = req.body.ACTIVITY_DATE_TIME_LOG;
    const IS_UPDATED_BY_ADMIN = req.body.IS_UPDATED_BY_ADMIN ? req.body.IS_UPDATED_BY_ADMIN : 0;
    let USER_NAME = IS_UPDATED_BY_ADMIN == 1 ? req.body.authData.data.UserData[0].USER_NAME : TECHNICIAN_NAME;
    if (!IANA_CODE || !ACTIVITY_DATE_TIME) {
        res.send({
            "code": 302,
            "message": "Please provide the order's timezone and activity date time to proceed"
        });
        return;
    }
    var getUTCfromTimeZone = ACTIVITY_DATE_TIME;
    if (!TECHNICIAN_ID || !ORDER_ID || !STATUS || !ID || !SERVICE_ID) {
        return res.send({
            "code": 300,
            "message": `Required fields are missing. TECHNICIAN_ID, ORDER_ID, STATUS, ID, SERVICE_ID`
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        const connection = mm.openConnection();
        let setData = "";
        let recordData = [];
        let ORDER_STATUS = '';

        if (STATUS === "AC" || STATUS === "AS") {
            setData += "JOB_STATUS_ID = ?, TECHNICIAN_STATUS = ?, ";
            recordData.push(2, "AS");
            ORDER_STATUS = "OS";
        } else if (STATUS === "ON") {
            setData += "TECHNICIAN_STATUS = ?, ";
            recordData.push("ON");
        } else if (STATUS === "CO" || STATUS === "EJ") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?, JOB_STATUS_ID = ?,JOB_COMPLETED_DATETIME = ?, USED_TIME = ?, REMARK = ?";
            recordData.push("EJ", "CO", 3, ACTIVITY_DATE_TIME, JOB_DATA[0].USED_TIME, REMARK);
        } else if (STATUS === "ST") {
            setData += "TRACK_STATUS = ?, JOB_INTIATED_DATETIME = ?,";
            recordData.push("ST", ACTIVITY_DATE_TIME);
        } else if (STATUS === "RD") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?, JOB_ARRIVED_DATETIME = ?,";
            ORDER_STATUS = "ON";
            recordData.push("RD", "ON", ACTIVITY_DATE_TIME);
        } else if (STATUS === "SJ") {
            setData += "TRACK_STATUS = ?, JOB_STARTED_DATETIME = ?,";
            recordData.push("SJ", ACTIVITY_DATE_TIME);
        } else if (STATUS === "EJ") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?, JOB_STATUS_ID = ?,JOB_COMPLETED_DATETIME = ?, USED_TIME = ?, REMARK = ?";
            recordData.push("EJ", "CO", 3, ACTIVITY_DATE_TIME, JOB_DATA[0].USED_TIME, REMARK);
        } else if (STATUS === "PJ") {
            setData += "TRACK_STATUS = ?, USED_TIME = ?,JOB_PAUSED_DATETIME = ?,";
            recordData.push("PJ", JOB_DATA[0].USED_TIME, ACTIVITY_DATE_TIME);
        } else if (STATUS === "RJ") {
            setData += "TRACK_STATUS = ?,JOB_RESUMED_DATETIME = ?,";
            recordData.push("SJ", ACTIVITY_DATE_TIME);
        } else {
            return res.send({
                "code": 400,
                "message": "Invalid STATUS value."
            });
        }

        let ACTION_DETAILS = '';
        let ORDER_STATUS_LOG = '';
        let ORDER_STATUSS = '';
        let LOG_TYPE = ''
        if (STATUS === 'AC' || STATUS === 'AS') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has accepted the work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has accepted the work order`;
            ORDER_STATUSS = `Work order is scheduled`;
            LOG_TYPE = 'Order';
        } else if (STATUS === 'ON') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} is working on work order ${JOB_CARD_NO}.`;
            ORDER_STATUS_LOG = `Technician is working on the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'CO') {
            ACTION_DETAILS = ` ${TECHNICIAN_NAME} has completed the work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has completed the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'EJ') {
            ACTION_DETAILS = ` ${TECHNICIAN_NAME} has completed the work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has completed the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'ST') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has started traveling for work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has started traveling for the work order`;
            ORDER_STATUSS = ``
            LOG_TYPE = 'Job';
        } else if (STATUS === 'SJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has started work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has started the work order`;
            ORDER_STATUSS = `Work order is ongoing`;
            LOG_TYPE = 'Order';
        } else if (STATUS === 'RD') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} reached at customer location.`;
            ORDER_STATUS_LOG = `Technician has reached at customer location`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'PJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has paused the work order ${JOB_CARD_NO}.`;
            ORDER_STATUS_LOG = `Technician is paused the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'RJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has resumed the work order ${JOB_CARD_NO}.`;
            ORDER_STATUS_LOG = `Technician has resumed the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else {
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        }
        var DESCRIPTION = '';
        var BO_DESCRIPTION = '';
        var TITLE = '';
        if (STATUS === "ST") {
            TITLE = 'Technician is On the Way'
            DESCRIPTION = `Our technician is on the way to your location for work order ${JOB_CARD_NO}.`
            BO_DESCRIPTION = `Our technician is on the way to your location for work order ${JOB_CARD_NO}. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "RD") {
            TITLE = 'Technician Has Arrived'
            DESCRIPTION = `Our technician has reached at your location for work order ${JOB_CARD_NO}.`
            BO_DESCRIPTION = `Our technician has reached at your location for work order ${JOB_CARD_NO}. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "SJ") {
            TITLE = 'Work Order Started'
            DESCRIPTION = `The work order ${JOB_CARD_NO} for has started. Our technician is working on it.`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} for has started. Our technician is working on it. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "EJ" || STATUS === "CO") {
            TITLE = 'Work Order Completed'
            DESCRIPTION = `The work order ${JOB_CARD_NO} has been successfully completed. Thank you for choosing our service!`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} has been successfully completed. Thank you for choosing our service!This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "PJ") {
            TITLE = 'Work Order Paused'
            DESCRIPTION = `The work order ${JOB_CARD_NO} is paused by our technician.`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} is paused by our technician. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "RJ") {
            TITLE = 'Work Order Resumed'
            DESCRIPTION = `The work order ${JOB_CARD_NO} is resumed by our technician.`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} is resumed by our technician. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "AS" || STATUS === "AC") {
            TITLE = 'Work Order Accepted'
            DESCRIPTION = `The work order ${JOB_CARD_NO} is accepted by technician.`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} is accepted by the technician. This notification is shared with you as the POC for tracking and coordination.`
        }

        const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'DESC';
        SET @v_FILTER = ' AND ORDER_ID = ${JOB_DATA[0].ORDER_ID} AND JOB_CARD_ID = ${JOB_DATA[0].ID}';
    `;

        mm.executeDML(setContext + 'call sp_OrderDetailsLite_get()', [], supportKey, connection, async (error, results) => {
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
                const resultSets = results.filter(r => Array.isArray(r));
                const OrderResult = resultSets[1] || [];
                if (TECHNICIAN_TYPE != "G") {
                    let notificationData = { ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, TECHNICIAN_ID: TECHNICIAN_ID, STATUS: STATUS, TITLE: TITLE, ORDER_STATUS: ORDER_STATUS, DESCRIPTION: DESCRIPTION, BO_DESCRIPTION: BO_DESCRIPTION }
                    if (STATUS === "ST") {
                        mm.sendDynamicEmail(40, JOB_DATA[0].ID, supportKey)
                    } else if (STATUS === "RD") {
                        mm.sendDynamicEmail(44, JOB_DATA[0].ID, supportKey)
                    } else if (STATUS === "SJ") {
                        mm.sendDynamicEmail(45, JOB_DATA[0].ID, supportKey)
                    } else if (STATUS === "PJ") {
                        mm.sendDynamicEmail(46, JOB_DATA[0].ID, supportKey)
                    } else if (STATUS === "RJ") {
                        mm.sendDynamicEmail(47, JOB_DATA[0].ID, supportKey)
                    }
                    else if (STATUS === "EJ" || STATUS === "CO") {
                        mm.sendDynamicEmail(50, JOB_DATA[0].ID, supportKey)
                    }
                    if (STATUS !== "AC" && STATUS !== "AS") {
                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${req.body.JOB_DATA[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "J", supportKey, "J", "J", notificationData);
                    }
                    mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, JOB_DATA[0].ORDER_ID, `${TITLE}`, `${BO_DESCRIPTION}`, "", "J", supportKey, "J", "J", []);
                }
                if (STATUS === 'AC' || STATUS === 'AS') {
                    mm.executeQueryData(
                        'CALL sp_technician_jobAcceptAssign(?,?,?,?,?,?)',
                        [
                            JOB_DATA[0].ORDER_ID,
                            JOB_DATA[0].ID,
                            TECHNICIAN_ID,
                            JOB_CARD_NO,
                            JOB_DATA[0].SERVICE_ID,
                            ACTIVITY_DATE_TIME
                        ],
                        supportKey,
                        (error, results) => {
                            if (error) {
                                console.error("Error in sp_job_updateAcceptanceStatus:", error);
                                return res.status(400).json({
                                    "code": 400,
                                    "message": "Failed to update job acceptance status."
                                });
                            }

                            const result = results[0][0];

                            if (result.code === 300) {
                                mm.rollbackConnection(connection);
                                return res.status(200).send({
                                    "code": 300,
                                    "message": "This work order is already accepted or scheduled to a different technician"
                                });
                            }

                            if (TECHNICIAN_TYPE != "G") {
                                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, `${TITLE}`, `${DESCRIPTION}`, "", "J", supportKey, "J", []);
                                mm.sendDynamicEmail(73, JOB_DATA[0].ID, supportKey)//customer and spoc email
                            }
                            mm.commitConnection(connection);
                            res.status(200).send({
                                "code": 200,
                                "message": "Technicianschedule information updated successfully...",
                            });
                        }
                    );
                } else if (STATUS === 'CO' || STATUS === 'EJ') {
                    try {
                        const jobRows1 = await new Promise((resolve, reject) => {
                            const setContext = `
                SET @v_PAGE_INDEX = 0;
                SET @v_PAGE_SIZE = 0;
                SET @v_SORT_KEY = 'ID';
                SET @v_SORT_VALUE = 'ASC';
                SET @v_FILTER = ' AND ID=${ID}';
            `;

                            mm.executeDML(
                                setContext + "call sp_jobCard_get()",
                                [],
                                supportKey,
                                connection,
                                (e, r) => e ? reject(e) : resolve(r)
                            );
                        });
                        const resultSets = jobRows1.filter(r => Array.isArray(r));
                        const jobRows = resultSets[1] || [];
                        if (!jobRows.length) {
                            mm.rollbackConnection(connection);
                            return res.status(404).send({ "code": 404, "message": "Job not found" });
                        }

                        const JOB = jobRows[0];
                        const JOB_CARD_NO = JOB.JOB_CARD_NO;
                        const CUSTOMER_MANAGER_ID = OrderResult[0].CUSTOMER_MANAGER_ID ?? 0;
                        const USER_ID = JOB.USER_ID;
                        const TECHNICIAN_ID = JOB.TECHNICIAN_ID;
                        const TECHNICIAN_NAME = JOB.TECHNICIAN_NAME;
                        const technicianschedule = "technicianschedule";

                        const COMPLETED_AT = convertUtcToIanaLocal(ACTIVITY_DATE_TIME, IANA_CODE);
                        const COMPLETED_DATE = COMPLETED_AT.substring(0, 10);
                        const completedTimeStr = COMPLETED_AT.substring(11, 16);

                        const normalizeDate = d => d ? new Date(d).toISOString().split("T")[0] : null;
                        const normalizeTime = t => t ? t.substring(0, 5) : "00:00";

                        const parseTime = t => {
                            const [h, m] = t.split(":").map(Number);
                            return h * 60 + m;
                        };

                        const roundUpToNext10 = min => Math.ceil(min / 10) * 10;

                        const START_DATE = normalizeDate(JOB.SCHEDULED_DATE_TIME);
                        const END_DATE = normalizeDate(JOB.EXPECTED_END_DATE);
                        const START_TIME = normalizeTime(JOB.START_TIME);
                        const END_TIME = normalizeTime(JOB.END_TIME);

                        let COMPLETE_MIN = parseTime(completedTimeStr);

                        const scheduleStartMin = parseTime(START_TIME);
                        if (COMPLETE_MIN < scheduleStartMin + 10)
                            COMPLETE_MIN = scheduleStartMin + 10;
                        else
                            COMPLETE_MIN = roundUpToNext10(COMPLETE_MIN);

                        const isSingleDay = START_DATE === END_DATE;

                        const buildRange = () => {
                            const range = [];
                            let dt = new Date(START_DATE);
                            const end = new Date(END_DATE);

                            while (dt <= end) {
                                const dateStr = dt.toISOString().split("T")[0];

                                range.push({
                                    date: dateStr,
                                    isFirstDay: dateStr === START_DATE,
                                    isLastDay: dateStr === END_DATE,
                                    start: dateStr === START_DATE ? START_TIME : "00:00",
                                    end: dateStr === END_DATE ? END_TIME : "23:50"
                                });

                                dt.setDate(dt.getDate() + 1);
                            }

                            return range;
                        };

                        const dateRange = buildRange();

                        const generateTimeSlots = (start, end) => {
                            const slots = [];
                            for (let i = parseTime(start); i <= parseTime(end); i += 10) {
                                const h = String(Math.floor(i / 60)).padStart(2, "0");
                                const m = String(i % 60).padStart(2, "0");
                                slots.push(`${h}:${m}`);
                            }
                            return slots;
                        };


                        for (const slot of dateRange) {
                            const allSlots = generateTimeSlots(slot.start, slot.end);
                            if (!allSlots.length) continue;

                            const completedSlots = [];
                            const clearedSlots = [];

                            const isCompletionDay = slot.date === COMPLETED_DATE;

                            for (const s of allSlots) {
                                const minute = parseTime(s);

                                if (isCompletionDay) {
                                    if (minute >= parseTime(slot.start) && minute <= COMPLETE_MIN) {
                                        completedSlots.push(s);
                                    } else {
                                        clearedSlots.push(s);
                                    }
                                }
                                else if (slot.date < COMPLETED_DATE) {
                                    completedSlots.push(s);
                                }
                                else {
                                    clearedSlots.push(s);
                                }
                            }

                            let setParts = [];

                            if (completedSlots.length) {
                                const val = `${JOB_CARD_NO},CO,${CUSTOMER_MANAGER_ID}`;

                                completedSlots.forEach(s => {
                                    setParts.push(`\`${s}\`='${val}'`);
                                });
                            }

                            if (clearedSlots.length) {
                                clearedSlots.forEach(s => {
                                    setParts.push(`\`${s}\`=NULL`);
                                });
                            }

                            if (setParts.length) {

                                const generatedQuery = `
                    UPDATE ${technicianschedule}
                    SET ${setParts.join(",")},
                    CREATED_MODIFIED_DATE='${COMPLETED_AT}'
                    WHERE TECHNICIAN_ID=${TECHNICIAN_ID}
                    AND DATE(DATE)='${slot.date}'
                `;

                                await new Promise((resolve, reject) => {
                                    mm.executeDML(
                                        `CALL sp_technician_JobCompleteEnd(?,?,?,?,?,?,?,?,?,?)`,
                                        [
                                            TECHNICIAN_ID,
                                            TECHNICIAN_NAME,
                                            slot.date,
                                            0,
                                            COMPLETED_AT,
                                            generatedQuery,
                                            ID,
                                            USER_ID,
                                            STATUS,
                                            ACTIVITY_DATE_TIME
                                        ],
                                        supportKey,
                                        connection,
                                        (e, r) => e ? reject(e) : resolve(r)
                                    );
                                });
                            }
                        }



                        const TITLE = "Work Order Completed";
                        const DESCRIPTION = `Work order ${JOB_CARD_NO} marked completed`;
                        if (TECHNICIAN_TYPE != "G") {
                            mm.sendDynamicEmail(12, JOB.ORDER_DETAILS_ID);
                            mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, TITLE, DESCRIPTION, "", "J", supportKey, "J", []);
                        }

                        var ACTION_DETAILS1 = ` ${TECHNICIAN_NAME} has resolved the work order ${JOB_CARD_NO}`
                        ORDER_STATUSS = `Work order is resolved`


                        let logdata2 = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS1, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUSS, USER_NAME: USER_NAME, DATE_TIME: ACTIVITY_DATE_TIME_LOG, supportKey: 0, IANA_CODE: IANA_CODE }]

                        dbm.saveLog(logdata2, technicianActionLog);

                        ORDER_STATUSS = `Awaiting service desk approval`

                        let logdata3 = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Order", ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: `Work order ${JOB_CARD_NO} is marked as completed by technician and Awaiting service desk approval.`, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUSS, USER_NAME: USER_NAME, DATE_TIME: ACTIVITY_DATE_TIME_LOG, supportKey: 0, IANA_CODE: IANA_CODE }]

                        dbm.saveLog(logdata3, technicianActionLog);

                        mm.commitConnection(connection);

                        return res.send({
                            "code": 200,
                            "message": "Technician schedule updated successfully"
                        });

                    } catch (error) {
                        console.error("updateScheduleJob ERROR:", error);
                        mm.rollbackConnection(connection);
                        return res.status(500).send({
                            "code": 500,
                            "message": "Something went wrong"
                        });
                    }
                }
                else if (STATUS === 'SJ') {

                    mm.executeDML(
                        'CALL sp_technician_jobStart(?,?,?,?,?,?)',
                        [
                            JOB_DATA[0].ID,
                            ORDER_ID,
                            SERVICE_ID,
                            TECHNICIAN_ID,
                            "SJ",
                            systemDate
                        ],
                        supportKey,
                        connection,
                        (error, spResult) => {

                            if (error) {
                                mm.rollbackConnection(connection);
                                logger.error(
                                    supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                                    applicationkey
                                );
                                console.log(error);
                                return res.send({
                                    "code": 400,
                                    "message": "Failed to update work order status."
                                });
                            }

                            const ORDER_DETAILS_ID = spResult[0][0].ORDER_DETAILS_ID;

                            mm.commitConnection(connection);
                            const logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Job", ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: ACTIVITY_DATE_TIME_LOG, supportKey: 0, IANA_CODE: IANA_CODE }
                            const logData3 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: '-', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: ACTIVITY_DATE_TIME_LOG, supportKey: 0, IANA_CODE: IANA_CODE }
                            const loggarry = [logData2, logData3];
                            dbm.saveLog(loggarry, technicianActionLog);
                            if (TECHNICIAN_TYPE != "G") {
                                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, `${TITLE}`, `${DESCRIPTION}`, "", "J", supportKey, "J", []);
                                mm.sendDynamicEmail(11, ORDER_DETAILS_ID, supportKey)
                            }
                            res.status(200).send({
                                "code": 200,
                                "message": "Technicianschedule information updated successfully...",
                            });
                        }
                    );
                }
                else if (STATUS === "PJ" || STATUS === "RJ") {

                    const TRACK_STATUS = STATUS == "PJ" ? "PJ" : "SJ";

                    mm.executeDML(
                        'CALL sp_technician_jobPauseResume(?,?,?,?,?,?,?,?,?)',
                        [
                            JOB_DATA[0].ID,
                            JOB_DATA[0].ORDER_ID,
                            JOB_DATA[0].SERVICE_ID,
                            JOB_DATA[0].TECHNICIAN_ID,
                            STATUS,
                            TRACK_STATUS,
                            JOB_DATA[0].USED_TIME,
                            ACTIVITY_DATE_TIME,
                            ACTION_DETAILS
                        ],
                        supportKey,
                        connection,
                        (error, spResult) => {

                            if (error) {
                                mm.rollbackConnection(connection);
                                logger.error(
                                    supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                                    applicationkey
                                );
                                console.log(error);
                                return res.send({
                                    "code": 400,
                                    "message": "Failed to update work order status."
                                });
                            }

                            mm.commitConnection(connection);
                            const logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: ACTIVITY_DATE_TIME_LOG, supportKey: 0, IANA_CODE: IANA_CODE };
                            dbm.saveLog(logData2, technicianActionLog);
                            res.status(200).send({
                                "code": 200,
                                "message": "Technicianschedule information updated successfully...",
                            });
                        }
                    );
                }
                else {

                    mm.executeDML(
                        'CALL sp_technician_updateJobStatus(?,?,?,?,?,?,?)',
                        [
                            JOB_DATA[0].ID,
                            JOB_DATA[0].ORDER_ID,
                            JOB_DATA[0].SERVICE_ID,
                            JOB_DATA[0].TECHNICIAN_ID,
                            STATUS,
                            systemDate,
                            REMARK
                        ],
                        supportKey,
                        connection,
                        (error, spResult) => {

                            if (error) {
                                mm.rollbackConnection(connection);
                                logger.error(
                                    supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                                    applicationkey
                                );
                                console.log(error);
                                return res.send({
                                    "code": 400,
                                    "message": "Failed to update work order status."
                                });
                            }

                            mm.commitConnection(connection);
                            const logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: ACTIVITY_DATE_TIME_LOG, supportKey: 0, IANA_CODE: IANA_CODE };
                            dbm.saveLog(logData2, technicianActionLog);
                            res.status(200).send({
                                "code": 200,
                                "message": "Technicianschedule information updated successfully...",
                            });
                        }
                    );
                }

            }
        });

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        return res.status(400).send({
            "code": 400,
            "message": "Failed to update technicianschedule information."
        });
    }
};

exports.updateJobStatusByGuestTechnician = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    const JOB_DATA = req.body.JOB_DATA;
    const STATUS = req.body.STATUS;
    const IANA_CODE = req.body.IANA_CODE;

    const TECHNICIAN_ID = 0; // Guest technician (by design)
    const TECHNICIAN_NAME = JOB_DATA?.[0]?.GUEST_TECHNICIAN_NAME || '';
    const fullJobCardNo = JOB_DATA?.[0]?.JOB_CARD_NO || '';
    const JOB_CARD_NO = fullJobCardNo.match(/JOB.*$/)?.[0] || fullJobCardNo;

    const ID = JOB_DATA?.[0]?.ID;
    const ORDER_ID = JOB_DATA?.[0]?.ORDER_ID;
    const REMARK = req.body.REMARK || '';
    const ORDER_DETAILS_ID = JOB_DATA?.[0]?.ORDER_DETAILS_ID || 0;

    const JOB_STARTED_DATETIME = req.body.JOB_STARTED_DATETIME || null;
    const JOB_COMPLETED_DATETIME = req.body.JOB_COMPLETED_DATETIME || null;
    const JOB_STARTED_DATETIME_LOG = req.body.JOB_STARTED_DATETIME_LOG || null;
    const JOB_COMPLETED_DATETIME_LOG = req.body.JOB_COMPLETED_DATETIME_LOG || null;

    const USER_ID = req.body.USER_ID || 0;
    const USER_NAME = req.body.USER_NAME || TECHNICIAN_NAME;
    const IS_UPDATED_BY_ADMIN = req.body.IS_UPDATED_BY_ADMIN || 0;

    if (!IANA_CODE) {
        return res.send({ code: 302, message: "Please provide the order's timezone to proceed" });
    }

    if (!ORDER_ID || !STATUS || !ID) {
        return res.send({ code: 300, message: "Required fields are missing." });
    }

    if (!errors.isEmpty()) {
        return res.send({ code: 422, message: errors.errors });
    }

    const connection = mm.openConnection();

    try {
        let setData = '';
        let recordData = [];

        if (STATUS === 'CO' || STATUS === 'EJ') {
            setData = ` JOB_STATUS_ID = 3, TECHNICIAN_STATUS = 'CO', TECHNICIAN_ID = ?, TECHNICIAN_NAME = ?, USER_ID = ?, TRACK_STATUS = ?, JOB_COMPLETED_DATETIME = ?, REMARK = ?, IS_JOB_COMPLETE = ?, USED_TIME = ?, `;
            recordData.push(TECHNICIAN_ID, TECHNICIAN_NAME, USER_ID, 'EJ', JOB_COMPLETED_DATETIME, REMARK, 1, 0);
        }
        else if (STATUS === 'SJ') {
            setData = ` TRACK_STATUS = ?, JOB_STARTED_DATETIME = ?, `;
            recordData.push('SJ', JOB_STARTED_DATETIME);
        }
        else {
            mm.rollbackConnection(connection);
            return res.send({ code: 400, message: "Invalid STATUS value." });
        }

        let ACTION_DETAILS = '';
        let ORDER_STATUS_LOG = '';
        let ORDER_STATUSS = '';
        let LOG_TYPE = '';
        let TITLE = '';
        let DESCRIPTION = '';
        let BO_DESCRIPTION = '';

        if (STATUS === 'CO' || STATUS === 'EJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has completed the work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = 'Technician has completed the work order';
            LOG_TYPE = 'Job';
            TITLE = "Work Order Completed";
            DESCRIPTION = `The work order ${JOB_CARD_NO} has been successfully completed. Thank you for choosing our service!`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} has been successfully completed. Thank you for choosing our service!This notification is shared with you as the POC for tracking and coordination.`
        } else {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has started work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = 'Technician has started the work order';
            ORDER_STATUSS = 'Work order is ongoing';
            LOG_TYPE = 'Order';
            TITLE = "Work Order Ongoing";
            DESCRIPTION = `The work order ${JOB_CARD_NO} has started. Our technician is working on it.`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} has started. Our technician is working on it. This notification is shared with you as the POC for tracking and coordination.`
        }

        mm.executeQueryData(
            `CALL sp_updateJobStatusByGuestTechnician(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                STATUS,
                ID, // Job Card ID
                ORDER_ID, // Order ID
                JOB_CARD_NO,
                TECHNICIAN_NAME,
                TECHNICIAN_ID,
                USER_ID || null,
                REMARK || null,
                JOB_STARTED_DATETIME,
                JOB_COMPLETED_DATETIME,
                IANA_CODE,
                0 // USED_TIME
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ code: 400, message: "Failed to update work order status." });
                }

                if (STATUS === 'SJ') {
                    mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, `${TITLE}`, `${DESCRIPTION}`, "", "J", supportKey, "J", []);
                    mm.sendDynamicEmail(11, ORDER_DETAILS_ID, supportKey)
                    mm.sendDynamicEmail(45, JOB_DATA[0].ID, supportKey)//customeremail
                    //Logs for start Work Order
                    let logdata1 = { TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Order", ACTION_LOG_TYPE: 'Guest Technician', ACTION_DETAILS: `${TECHNICIAN_NAME} has started work order ${JOB_CARD_NO}`, USER_ID: JOB_DATA[0].USER_ID, USER_NAME: TECHNICIAN_NAME, TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_STATUS: `Work order is ongoing`, JOB_CARD_STATUS: `Technician has started the work order`, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, DATE_TIME: JOB_STARTED_DATETIME_LOG, IANA_CODE: IANA_CODE };

                    let logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Job", ACTION_LOG_TYPE: 'Guest Technician', ACTION_DETAILS: `${TECHNICIAN_NAME} has started work order ${JOB_CARD_NO}`, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: `Work order is ongoing`, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: `Technician has started the work order`, USER_NAME: TECHNICIAN_NAME, DATE_TIME: JOB_STARTED_DATETIME_LOG, IANA_CODE: IANA_CODE };

                    let LogArray = [logdata1, logData2];
                    dbm.saveLog(LogArray, technicianActionLog);
                    return res.send({ code: 200, message: "Technician schedule updated successfully" });
                }
                mm.sendDynamicEmail(12, JOB_DATA[0].ORDER_DETAILS_ID);
                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, TITLE, DESCRIPTION, "", "J", supportKey, "J", []);
                mm.sendDynamicEmail(50, JOB_DATA[0].ID, supportKey)//technicianemail

                var ACTION_DETAILS1 = ` ${TECHNICIAN_NAME} has resolved the work order ${JOB_CARD_NO}`
                ORDER_STATUSS = `Work order is resolved`
                let logdata2 = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS1, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: JOB_COMPLETED_DATETIME_LOG, supportKey: 0, IANA_CODE: IANA_CODE }];
                console.log("logdata2", logdata2)
                dbm.saveLog(logdata2, technicianActionLog);

                ORDER_STATUSS = `Awaiting service desk approval`
                ACTION_DETAILS1 = `Work order ${JOB_CARD_NO} is marked as completed by technician and Awaiting service desk approval.`
                let logdata3 = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Order", ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS1, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: JOB_COMPLETED_DATETIME_LOG, supportKey: 0, IANA_CODE: IANA_CODE }]
                dbm.saveLog(logdata3, technicianActionLog);

                return res.send({ code: 200, message: "Technician schedule updated successfully" });
            }
        );
    } catch (error) {
        console.error("Unexpected error in updateJobStatusByGuestTechnician:", error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong. Please try again later."
        });
    }
};


exports.updateJobStatus = (req, res) => {
    const errors = validationResult(req);
    const JOB_DATA = req.body.JOB_DATA;
    const IANA_CODE = req.body.IANA_CODE;
    var supportKey = req.headers['supportkey'];
    const EXPECTED_DATE_TIME = req.body.JOB_DATA[0].EXPECTED_DATE_TIME;
    const TERRITORY_ID = req.body.JOB_DATA[0].TERRITORY_ID;
    const TECHNICIAN_NAME = req.body.JOB_DATA[0].TECHNICIAN_NAME ? req.body.JOB_DATA[0].TECHNICIAN_NAME : req.body.TECHNICIAN_NAME ? req.body.TECHNICIAN_NAME : req.body.NAME;
    const fullJobCardNo = req.body.JOB_DATA[0].JOB_CARD_NO;
    const JOB_CARD_NO = fullJobCardNo.match(/JOB.*$/)?.[0] || fullJobCardNo;
    var DATE = EXPECTED_DATE_TIME.substring(0, 10);
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    let ID = req.body.JOB_DATA[0].ID;
    let SERVICE_ID = req.body.JOB_DATA[0].SERVICE_ID;
    var ORDER_ID = req.body.JOB_DATA[0].ORDER_ID;
    var supportKey = req.headers['supportkey'];
    var STATUS = req.body.STATUS;
    let REMARK = req.body.REMARK ? req.body.REMARK : '';
    var systemDate = mm.getSystemDate();
    const IS_UPDATED_BY_ADMIN = req.body.IS_UPDATED_BY_ADMIN ? req.body.IS_UPDATED_BY_ADMIN : 0;
    let USER_NAME = IS_UPDATED_BY_ADMIN == 1 ? req.body.authData.data.UserData[0].USER_NAME : TECHNICIAN_NAME;

    if (!IANA_CODE) {
        res.send({
            "code": 302,
            "message": "Please provide the order's timezone to proceed"
        });
        return;
    }
    var getUTCfromTimeZone = mm.getUTCFromTimezone(IANA_CODE);
    // The moment the technician tapped the button, resolved once so the status
    // column and the activity-log line for this request always agree. Falls back
    // to server time for callers that send no device stamp (the admin panel).
    const EVENT_DATETIME_COLUMN = { ST: 'JOB_INTIATED_DATETIME', RD: 'JOB_ARRIVED_DATETIME', SJ: 'JOB_STARTED_DATETIME', PJ: 'JOB_PAUSED_DATETIME', RJ: 'JOB_RESUMED_DATETIME', EJ: 'JOB_COMPLETED_DATETIME', CO: 'JOB_COMPLETED_DATETIME' };
    const eventDate = mm.resolveEventDate(req.body, EVENT_DATETIME_COLUMN[STATUS] || null);
    let MongoLogDate = mm.resolveEventDateObject(req.body, EVENT_DATETIME_COLUMN[STATUS] || null);

    if (!TECHNICIAN_ID || !ORDER_ID || !STATUS || !ID || !SERVICE_ID) {
        return res.send({
            "code": 300,
            "message": `Required fields are missing. TECHNICIAN_ID, ORDER_ID, STATUS, ID, SERVICE_ID`
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        const connection = mm.openConnection();
        let setData = "";
        let recordData = [];
        let ORDER_STATUS = '';

        // The technician app can perform these actions with no coverage and sync
        // them later, so each event datetime comes from the device when it sent
        // one. mm.resolveEventDate validates it and falls back to server time,
        // which keeps older clients working exactly as before.
        if (STATUS === "AC" || STATUS === "AS") {
            setData += "JOB_STATUS_ID = ?, TECHNICIAN_STATUS = ?, ";
            recordData.push(2, "AS");
            ORDER_STATUS = "OS";
        } else if (STATUS === "ON") {
            setData += "TECHNICIAN_STATUS = ?, ";
            recordData.push("ON");
        } else if (STATUS === "CO" || STATUS === "EJ") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?, JOB_STATUS_ID = ?,JOB_COMPLETED_DATETIME = ?, USED_TIME = ?, REMARK = ?";
            recordData.push("EJ", "CO", 3, eventDate, JOB_DATA[0].USED_TIME, REMARK);
        } else if (STATUS === "ST") {
            setData += "TRACK_STATUS = ?, JOB_INTIATED_DATETIME = ?,";
            recordData.push("ST", mm.resolveEventDate(req.body, 'JOB_INTIATED_DATETIME'));
        } else if (STATUS === "RD") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?, JOB_ARRIVED_DATETIME = ?,";
            ORDER_STATUS = "ON";
            recordData.push("RD", "ON", mm.resolveEventDate(req.body, 'JOB_ARRIVED_DATETIME'));
        } else if (STATUS === "SJ") {
            setData += "TRACK_STATUS = ?, JOB_STARTED_DATETIME = ?,";
            recordData.push("SJ", mm.resolveEventDate(req.body, 'JOB_STARTED_DATETIME'));
        } else if (STATUS === "EJ") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?, JOB_STATUS_ID = ?,JOB_COMPLETED_DATETIME = ?, USED_TIME = ?, REMARK = ?";
            recordData.push("EJ", "CO", 3, mm.resolveEventDate(req.body, 'JOB_COMPLETED_DATETIME'), JOB_DATA[0].USED_TIME, REMARK);
        } else if (STATUS === "PJ") {
            setData += "TRACK_STATUS = ?, USED_TIME = ?,JOB_PAUSED_DATETIME = ?,";
            recordData.push("PJ", JOB_DATA[0].USED_TIME, mm.resolveEventDate(req.body, 'JOB_PAUSED_DATETIME'));
        } else if (STATUS === "RJ") {
            setData += "TRACK_STATUS = ?,JOB_RESUMED_DATETIME = ?,";
            recordData.push("SJ", mm.resolveEventDate(req.body, 'JOB_RESUMED_DATETIME'));
        } else {
            return res.send({
                "code": 400,
                "message": "Invalid STATUS value."
            });
        }

        let ACTION_DETAILS = '';
        let ORDER_STATUS_LOG = '';
        let ORDER_STATUSS = '';
        let LOG_TYPE = ''
        if (STATUS === 'AC' || STATUS === 'AS') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has accepted the work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has accepted the work order`;
            ORDER_STATUSS = `Work order is scheduled`;
            LOG_TYPE = 'Order';
        } else if (STATUS === 'ON') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} is working on work order ${JOB_CARD_NO}.`;
            ORDER_STATUS_LOG = `Technician is working on the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'CO') {
            ACTION_DETAILS = ` ${TECHNICIAN_NAME} has completed the work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has completed the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'EJ') {
            ACTION_DETAILS = ` ${TECHNICIAN_NAME} has completed the work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has completed the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'ST') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has started traveling for work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has started traveling for the work order`;
            ORDER_STATUSS = ``
            LOG_TYPE = 'Job';
        } else if (STATUS === 'SJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has started work order ${JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has started the work order`;
            ORDER_STATUSS = `Work order is ongoing`;
            LOG_TYPE = 'Order';
        } else if (STATUS === 'RD') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} reached at customer location.`;
            ORDER_STATUS_LOG = `Technician has reached at customer location`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'PJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has paused the work order ${JOB_CARD_NO}.`;
            ORDER_STATUS_LOG = `Technician is paused the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'RJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has resumed the work order ${JOB_CARD_NO}.`;
            ORDER_STATUS_LOG = `Technician has resumed the work order`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else {
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        }
        var DESCRIPTION = '';
        var BO_DESCRIPTION = '';
        var TITLE = '';
        if (STATUS === "ST") {
            TITLE = 'Technician is On the Way'
            DESCRIPTION = `Our technician is on the way to your location for work order ${JOB_CARD_NO}.`
            BO_DESCRIPTION = `Our technician is on the way to your location for work order ${JOB_CARD_NO}. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "RD") {
            TITLE = 'Technician Has Arrived'
            DESCRIPTION = `Our technician has reached at your location for work order ${JOB_CARD_NO}.`
            BO_DESCRIPTION = `Our technician has reached at your location for work order ${JOB_CARD_NO}. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "SJ") {
            TITLE = 'Work Order Started'
            DESCRIPTION = `The work order ${JOB_CARD_NO} for has started. Our technician is working on it.`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} for has started. Our technician is working on it. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "EJ" || STATUS === "CO") {
            TITLE = 'Work Order Completed'
            DESCRIPTION = `The work order ${JOB_CARD_NO} has been successfully completed. Thank you for choosing our service!`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} has been successfully completed. Thank you for choosing our service!This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "PJ") {
            TITLE = 'Work Order Paused'
            DESCRIPTION = `The work order ${JOB_CARD_NO} is paused by our technician.`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} is paused by our technician. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "RJ") {
            TITLE = 'Work Order Resumed'
            DESCRIPTION = `The work order ${JOB_CARD_NO} is resumed by our technician.`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} is resumed by our technician. This notification is shared with you as the POC for tracking and coordination.`
        } else if (STATUS === "AS" || STATUS === "AC") {
            TITLE = 'Work Order Accepted'
            DESCRIPTION = `The work order ${JOB_CARD_NO} is accepted by technician.`
            BO_DESCRIPTION = `The work order ${JOB_CARD_NO} is accepted by the technician. This notification is shared with you as the POC for tracking and coordination.`
        }
        const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'DESC';
        SET @v_FILTER = ' AND ORDER_ID = ${JOB_DATA[0].ORDER_ID} AND JOB_CARD_ID = ${JOB_DATA[0].ID}';
    `;

        mm.executeDML(setContext + 'call sp_OrderDetailsLite_get()', [], supportKey, connection, async (error, results) => {
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
                const resultSets = results.filter(r => Array.isArray(r));
                const OrderResult = resultSets[1] || [];
                let notificationData = {
                    ORDER_ID: JOB_DATA[0].ORDER_ID,
                    JOB_CARD_ID: JOB_DATA[0].ID,
                    CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID,
                    TECHNICIAN_ID: TECHNICIAN_ID,
                    STATUS: STATUS,
                    TITLE: TITLE,
                    ORDER_STATUS: ORDER_STATUS,
                    DESCRIPTION: DESCRIPTION,
                    BO_DESCRIPTION: BO_DESCRIPTION,
                }
                if (STATUS === "ST") {
                    mm.sendDynamicEmail(40, JOB_DATA[0].ID, supportKey)//customeremail
                } else if (STATUS === "RD") {
                    mm.sendDynamicEmail(44, JOB_DATA[0].ID, supportKey)//customeremail
                } else if (STATUS === "SJ") {
                    mm.sendDynamicEmail(45, JOB_DATA[0].ID, supportKey)//customeremail
                } else if (STATUS === "PJ") {
                    mm.sendDynamicEmail(46, JOB_DATA[0].ID, supportKey)//customeremail
                } else if (STATUS === "RJ") {
                    mm.sendDynamicEmail(47, JOB_DATA[0].ID, supportKey)//customeremail
                }
                else if (STATUS === "EJ" || STATUS === "CO") {
                    mm.sendDynamicEmail(50, JOB_DATA[0].ID, supportKey)//technicianemail
                }
                if (STATUS !== "AC" && STATUS !== "AS") {
                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${req.body.JOB_DATA[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "J", supportKey, "J", "J", notificationData);
                }
                mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, JOB_DATA[0].ORDER_ID, `${TITLE}`, `${BO_DESCRIPTION}`, "", "J", supportKey, "J", "J", []);

                if (STATUS === 'AC' || STATUS === 'AS') {

                    mm.executeDML(
                        'CALL sp_technician_jobAcceptAssign(?,?,?,?,?,?)',
                        [
                            JOB_DATA[0].ORDER_ID,
                            JOB_DATA[0].ID,
                            TECHNICIAN_ID,
                            JOB_CARD_NO,
                            JOB_DATA[0].SERVICE_ID,
                            mm.getSystemDate()
                        ],
                        supportKey,
                        connection,
                        (error, result) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                return res.status(400).send({
                                    "code": 400,
                                    "message": "Failed to accept job"
                                });
                            }

                            const r = result[0][0];

                            if (r.code !== 200) {
                                mm.rollbackConnection(connection);
                                return res.status(200).send({
                                    "code": 300,
                                    "message": "This work order is already accepted or scheduled to a different technician"
                                });
                            }
                            else {
                                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, `${TITLE}`, `${DESCRIPTION}`, "", "J", supportKey, "J", []);
                                mm.sendDynamicEmail(73, JOB_DATA[0].ID, supportKey)//customer and spoc email
                                mm.commitConnection(connection);
                                res.status(200).send({
                                    "code": 200,
                                    "message": "Technicianschedule information updated successfully...",
                                });
                            }
                        }
                    );
                }
                else if (STATUS === 'CO' || STATUS === 'EJ') {
                    try {

                        const jobRows1 = await new Promise((resolve, reject) => {
                            const setContext = `
                                SET @v_ID = ${ID};
                            `;

                            mm.executeDML(
                                setContext + "call sp_jobCardLite_get()",
                                [],
                                supportKey,
                                connection,
                                (e, r) => e ? reject(e) : resolve(r)
                            );
                        });
                        const resultSets = jobRows1.filter(r => Array.isArray(r));
                        const jobRows = resultSets[0] || [];

                        if (!jobRows.length) {
                            mm.rollbackConnection(connection);
                            return res.status(404).send({ "code": 404, "message": "Job not found" });
                        }

                        const JOB = jobRows[0];
                        const JOB_CARD_NO = JOB.JOB_CARD_NO;
                        const CUSTOMER_MANAGER_ID = OrderResult[0].CUSTOMER_MANAGER_ID ?? 0;
                        const USER_ID = JOB.USER_ID;
                        const TECHNICIAN_ID = JOB.TECHNICIAN_ID;
                        const TECHNICIAN_NAME = JOB.TECHNICIAN_NAME;
                        const technicianschedule = "technicianschedule";

                        const COMPLETED_AT = getTimeInTimezone(IANA_CODE);
                        const completedTimeStr = COMPLETED_AT.substring(11, 16);
                        const COMPLETED_DATE = COMPLETED_AT.substring(0, 10);

                        const normalizeDate = d => d ? new Date(d).toISOString().split("T")[0] : null;
                        const normalizeTime = t => t ? t.substring(0, 5) : "00:00";

                        const parseTime = t => {
                            const [h, m] = t.split(":").map(Number);
                            return h * 60 + m;
                        };

                        const roundUpToNext10 = min => Math.ceil(min / 10) * 10;

                        const START_DATE = normalizeDate(JOB.SCHEDULED_DATE_TIME);
                        const END_DATE = normalizeDate(JOB.EXPECTED_END_DATE);
                        const START_TIME = normalizeTime(JOB.START_TIME);
                        const END_TIME = normalizeTime(JOB.END_TIME);

                        let COMPLETE_MIN = parseTime(completedTimeStr);

                        const scheduleStartMin = parseTime(START_TIME);
                        if (COMPLETE_MIN < scheduleStartMin + 10)
                            COMPLETE_MIN = scheduleStartMin + 10;
                        else
                            COMPLETE_MIN = roundUpToNext10(COMPLETE_MIN);

                        const buildRange = () => {
                            const range = [];
                            let dt = new Date(START_DATE);
                            const end = new Date(END_DATE);

                            while (dt <= end) {
                                const dateStr = dt.toISOString().split("T")[0];

                                range.push({
                                    date: dateStr,
                                    isFirstDay: dateStr === START_DATE,
                                    isLastDay: dateStr === END_DATE,
                                    start: dateStr === START_DATE ? START_TIME : "00:00",
                                    end: dateStr === END_DATE ? END_TIME : "23:50"
                                });

                                dt.setDate(dt.getDate() + 1);
                            }

                            return range;
                        };

                        const dateRange = buildRange();

                        const generateTimeSlots = (start, end) => {
                            const slots = [];
                            for (let i = parseTime(start); i <= parseTime(end); i += 10) {
                                const h = String(Math.floor(i / 60)).padStart(2, "0");
                                const m = String(i % 60).padStart(2, "0");
                                slots.push(`${h}:${m}`);
                            }
                            return slots;
                        };

                        for (const slot of dateRange) {

                            const allSlots = generateTimeSlots(slot.start, slot.end);
                            if (!allSlots.length) continue;

                            const completedSlots = [];
                            const clearedSlots = [];

                            const isCompletionDay = slot.date === COMPLETED_DATE;

                            for (const s of allSlots) {
                                const minute = parseTime(s);

                                if (isCompletionDay) {
                                    if (minute >= parseTime(slot.start) && minute <= COMPLETE_MIN) {
                                        completedSlots.push(s);
                                    } else {
                                        clearedSlots.push(s);
                                    }
                                }
                                else if (slot.date < COMPLETED_DATE) {
                                    completedSlots.push(s);
                                }
                                else {
                                    clearedSlots.push(s);
                                }
                            }

                            /* -------- Generate dynamic update query -------- */

                            let setParts = [];

                            if (completedSlots.length) {
                                const val = `${JOB_CARD_NO},CO,${CUSTOMER_MANAGER_ID}`;

                                completedSlots.forEach(s => {
                                    setParts.push(`\`${s}\`='${val}'`);
                                });
                            }

                            if (clearedSlots.length) {
                                clearedSlots.forEach(s => {
                                    setParts.push(`\`${s}\`=NULL`);
                                });
                            }

                            if (setParts.length) {

                                const generatedQuery = `
                    UPDATE ${technicianschedule}
                    SET ${setParts.join(",")},
                    CREATED_MODIFIED_DATE='${COMPLETED_AT}'
                    WHERE TECHNICIAN_ID=${TECHNICIAN_ID}
                    AND DATE(DATE)='${slot.date}'
                `;

                                await new Promise((resolve, reject) => {
                                    mm.executeDML(
                                        `CALL sp_technician_JobCompleteEnd(?,?,?,?,?,?,?,?,?,?)`,
                                        [
                                            TECHNICIAN_ID,
                                            TECHNICIAN_NAME,
                                            slot.date,
                                            0,
                                            COMPLETED_AT,
                                            generatedQuery,
                                            ID,
                                            USER_ID,
                                            STATUS,
                                            eventDate
                                        ],
                                        supportKey,
                                        connection,
                                        (e, r) => e ? reject(e) : resolve(r)
                                    );
                                });
                            }
                        }

                        const TITLE = "Work Order Completed";
                        const DESCRIPTION = `Work order ${JOB_CARD_NO} marked completed`;

                        mm.sendDynamicEmail(12, JOB.ORDER_DETAILS_ID);
                        mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, TITLE, DESCRIPTION, "", "J", supportKey, "J", []);

                        var ACTION_DETAILS1 = ` ${TECHNICIAN_NAME} has resolved the work order ${JOB_CARD_NO}`
                        ORDER_STATUSS = `Work order is resolved`
                        let logdata2 = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS1, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE }];
                        dbm.saveLog(logdata2, technicianActionLog);

                        ORDER_STATUSS = `Awaiting service desk approval`
                        ACTION_DETAILS1 = `Work order ${JOB_CARD_NO} is marked as completed by technician and Awaiting service desk approval.`
                        let logdata3 = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Order", ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS1, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE }]
                        dbm.saveLog(logdata3, technicianActionLog);
                        mm.commitConnection(connection);

                        return res.send({
                            code: 200,
                            message: "Technician schedule updated successfully"
                        });

                    } catch (error) {
                        console.error("updateScheduleJob ERROR:", error);
                        mm.rollbackConnection(connection);
                        return res.status(500).send({
                            "code": 500,
                            "message": "Something went wrong"
                        });
                    }
                }
                else if (STATUS === 'SJ') {
                    mm.executeDML(
                        'CALL sp_technician_jobStart(?,?,?,?,?,?)',
                        [
                            JOB_DATA[0].ID,
                            ORDER_ID,
                            SERVICE_ID,
                            TECHNICIAN_ID,
                            "SJ",
                            eventDate
                        ],
                        supportKey,
                        connection,
                        (error, result) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                return res.send({
                                    "code": 400,
                                    "message": "Failed to update work order status."
                                });
                            }

                            const resultsjOBS = result[0];

                            mm.commitConnection(connection);
                            const logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Job", ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE }
                            const logData3 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: '-', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE }
                            const loggarry = [logData2, logData3];
                            dbm.saveLog(loggarry, technicianActionLog);
                            mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID, 8, `${TITLE}`, `${DESCRIPTION}`, "", "J", supportKey, "J", []);
                            mm.sendDynamicEmail(11, resultsjOBS[0].ORDER_DETAILS_ID, supportKey)
                            res.status(200).send({
                                "code": 200,
                                "message": "Technicianschedule information updated successfully...",
                            });
                        }
                    );
                }
                else if (STATUS === "PJ" || STATUS === "RJ") {

                    let TRACK_STATUS = STATUS === "PJ" ? "PJ" : "SJ";

                    mm.executeDML(
                        'CALL sp_technician_jobPauseResume(?,?,?,?,?,?,?,?,?)',
                        [
                            JOB_DATA[0].ID,
                            JOB_DATA[0].ORDER_ID,
                            JOB_DATA[0].SERVICE_ID,
                            JOB_DATA[0].TECHNICIAN_ID,
                            STATUS,
                            TRACK_STATUS,
                            JOB_DATA[0].USED_TIME,
                            eventDate,
                            ACTION_DETAILS
                        ],
                        supportKey,
                        connection,
                        (error, result) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                return res.send({
                                    "code": 400,
                                    "message": "Failed to update job status."
                                });
                            }

                            const r = result[0][0];

                            if (r.code !== 200) {
                                mm.rollbackConnection(connection);
                                return res.status(200).send(r);
                            }

                            mm.commitConnection(connection);

                            const logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE };
                            let actionLog = {
                                "SOURCE_ID": TECHNICIAN_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "JobstatusUpdate", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }
                            // dbm.saveLog(actionLog, systemLog);
                            console.log("ACTION : ", ACTION_DETAILS);
                            dbm.saveLog(logData2, technicianActionLog);
                            res.status(200).send({
                                "code": 200,
                                "message": "Technicianschedule information updated successfully...",
                            });
                        }
                    );
                }
                else {

                    mm.executeDML(
                        'CALL sp_technician_updateJobStatus(?,?,?,?,?,?,?)',
                        [
                            JOB_DATA[0].ID,
                            JOB_DATA[0].ORDER_ID,
                            JOB_DATA[0].SERVICE_ID,
                            JOB_DATA[0].TECHNICIAN_ID,
                            STATUS,
                            eventDate,
                            REMARK
                        ],
                        supportKey,
                        connection,
                        (error, result) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                return res.send({
                                    "code": 400,
                                    "message": "Failed to update work order status."
                                });
                            }

                            mm.commitConnection(connection);
                            const logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: USER_NAME, DATE_TIME: MongoLogDate, supportKey: 0, IANA_CODE: IANA_CODE }
                            let actionLog = {
                                "SOURCE_ID": TECHNICIAN_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "JobstatusUpdate", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }
                            // dbm.saveLog(actionLog, systemLog);
                            console.log("ACTION : ", ACTION_DETAILS);
                            dbm.saveLog(logData2, technicianActionLog);
                            res.status(200).send({
                                "code": 200,
                                "message": "Technicianschedule information updated successfully...",
                            });
                        }
                    );
                }

            }
        });

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        return res.status(400).send({
            "code": 400,
            "message": "Failed to update technicianschedule information."
        });
    }
};

function getTimeInTimezone(tz) {
    const now = new Date();

    // Format directly to YYYY-MM-DD HH:mm:ss in the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23' // 24-hour format
    });

    // en-CA format: YYYY-MM-DD, HH:mm:ss
    return formatter.format(now).replace(', ', ' ');
}

function convertUtcToIanaLocal(utcDateTime, ianaTimeZone) {
    if (!utcDateTime || !ianaTimeZone) return null;

    const utcDate = new Date(utcDateTime);

    if (isNaN(utcDate)) return null;

    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: ianaTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    const parts = formatter.formatToParts(utcDate);

    const get = (type) => parts.find(p => p.type === type)?.value;

    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}


function toValidTime(value) {

    if (value === null || value === undefined || value === '') return null;

    // Trim & convert to string once
    let str = value.toString().trim();

    
    const validHMS = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    if (validHMS.test(str)) {
        return str;
    }

    
    const validHM = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (validHM.test(str)) {
        return str + ":00";
    }

    
    if (!isNaN(value)) {
        let num = Number(value);

        // Excel stores time as fraction of a day
        if (num >= 0 && num < 1) {

            let totalSeconds = Math.round(num * 24 * 60 * 60);

            let hours = Math.floor(totalSeconds / 3600);
            let minutes = Math.floor((totalSeconds % 3600) / 60);
            let seconds = totalSeconds % 60;

            return [
                hours.toString().padStart(2, '0'),
                minutes.toString().padStart(2, '0'),
                seconds.toString().padStart(2, '0')
            ].join(':');
        }
    }

    
    return null;
}

function createTechnicianChannels(technicianId, data) {
    let CHANNEL_NAME = data.TYPE == 'F' ? 'freelancer_channel' : data.TYPE == 'O' ? 'on_payroll_channel' : 'vendor_managed_channel';
    [
        `pincode_${data.PINCODE_ID}_channel`,
        "system_alerts_channel",
        CHANNEL_NAME,
        "technician_channel",
        `technician_${technicianId}_channel`
    ].forEach(ch => {
        new channelSubscribedUsers({
            CHANNEL_NAME: ch,
            USER_ID: technicianId,
            TYPE: "T",
            STATUS: true,
            USER_NAME: data.NAME,
            CLIENT_ID: data.CLIENT_ID,
            DATE: mm.getSystemDate()
        }).save();
    });
}

async function updateTechnicianChannels(data) {
    if (!data.OLD_TYPE) return;
    let OLD_CHANNEL = data.OLD_TYPE == 'F' ? 'freelancer_channel' : data.OLD_TYPE == 'O' ? 'on_payroll_channel' : 'vendor_managed_channel';
    await channelSubscribedUsers.updateMany(
        { CHANNEL_NAME: OLD_CHANNEL, USER_ID: data.ID, TYPE: "T" },
        { STATUS: false }
    );
    let NEW_CHANNEL = data.TYPE == 'F' ? 'freelancer_channel' : data.TYPE == 'O' ? 'on_payroll_channel' : 'vendor_managed_channel';
    await new channelSubscribedUsers({
        CHANNEL_NAME: NEW_CHANNEL,
        USER_ID: data.ID,
        TYPE: "T",
        STATUS: true,
        USER_NAME: data.NAME,
        CLIENT_ID: data.CLIENT_ID,
        DATE: mm.getSystemDate()
    }).save();
}

function normalizeExcelDate(value) {
    if (!value) return null;

    // Excel serial number
    if (typeof value === "number" && value > 25569) {
        const d = new Date(Date.UTC(1899, 11, 30 + value));
        return d.toISOString().slice(0, 10);
    }

    // Already ISO date
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    // DD/MM/YYYY or DD-MM-YYYY
    if (typeof value === "string") {
        const m = value.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    }

    return null;
}

async function getMasterIdByName(table, idField, nameField, value, email, supportKey) {
    if (!value) return null;

    const result = await new Promise((resolve, reject) => {
        mm.executeQueryData(
            `CALL sp_get_master_id_by_name(?, ?, ?, ?, ?)`,
            [table, idField, nameField, value, email],
            supportKey,
            (e, r) => e ? reject(e) : resolve(r)
        );
    });

    return result[0] && result[0].length ? result[0][0][idField] : null;
}

exports.importTechnician = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const { EXCEL_FILE_NAME, id, COLUMN_JSON, IMPORT_TYPE } = req.body;
    const EXCEL_MASTER_ID = id;

    let successCount = 0, skippedCount = 0;
    let successDetails = [], skippedDetails = [], errorDetails = [], errorData = [], totalData = [];

    try {
        // const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }
        );

        const jsonData = cleanedRows.filter(row =>
            Object.values(row).some(
                val => val !== null && val !== undefined && String(val).trim() !== ""
            )
        );
        const excelData = jsonData

        excelData.forEach(row => {
            Object.keys(row).forEach(key => {
                const k = key.toLowerCase();
                if (k.includes("date") || k.includes("dob")) {
                    row[key] = normalizeExcelDate(row[key]);
                }
            });
        });

        res.status(200).json({ code: 200, message: "Import started. Processing in background...", EXCEL_MASTER_ID: EXCEL_MASTER_ID });

        const chunkSize = 5;
        console.log(`Total records to process:`, excelData);

        for (let start = 0; start < excelData.length; start += chunkSize) {
            const chunk = excelData.slice(start, start + chunkSize);

            for (const [index, row] of chunk.entries()) {
                const rowNum = start + index + 2;
                const connection = mm.openConnection();

                try {
                    const data = {};
                    COLUMN_JSON.forEach(c => data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null);

                    if (!data.NAME || !data.EMAIL_ID || !data.MOBILE_NUMBER) {
                        skippedCount++;
                        let missingFields = [];
                        if (!data.NAME) missingFields.push("Name");
                        if (!data.EMAIL_ID) missingFields.push("Email");
                        if (!data.MOBILE_NUMBER) missingFields.push("Mobile");
                        const reason = `Missing mandatory fields: ${missingFields.join(', ')}`;
                        skippedDetails.push({ rowNumber: rowNum, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: reason });
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    // Yes/No normalization
                    data.IS_TOOLKIT_ASSIGNED = data.IS_TOOLKIT_ASSIGNED === 'Yes' ? 1 : 0;
                    data.IS_UNIFORM_ASSIGNED = data.IS_UNIFORM_ASSIGNED === 'Yes' ? 1 : 0;
                    const line1 = data.ADDRESS_LINE1;
                    const ste = data.STATE_ID;
                    const cntry = data.COUNTRY_ID;
                    const pincd = data.PINCODE_ID;
                    if (!data.HOME_LATTITUDE && !data.HOME_LONGITUDE) {
                        data.HOME_LATTITUDE = "";
                        data.HOME_LONGITUDE = "";
                    }
                    console.log("Data after normalization and before master lookups:", data);
                    console.log("\n\nOriginal row data:", row);

                    const vendorId = await getMasterIdByName("vendor_master", "ID", "NAME", data.VENDOR_ID, data.VENDOR_EMAIL, supportKey);
                    const countryId = await getMasterIdByName("country_master", "ID", "NAME", data.COUNTRY_ID, "", supportKey);
                    const stateId = await getMasterIdByName("state_master", "ID", "NAME", data.STATE_ID, "", supportKey);
                    const pincodeId = await getMasterIdByName("pincode_master", "ID", "PINCODE", data.PINCODE_ID, "", supportKey);
                    const districtId = await getMasterIdByName("pincode_master", "DISTRICT", "PINCODE", data.PINCODE_ID, "", supportKey);
                    let PINCODE_VALUE = data.PINCODE_ID;

                    // Check which masters are missing and build detailed error message
                    const missingMasters = [];
                    if (data.VENDOR_ID && !vendorId) missingMasters.push("Vendor");
                    if (data.COUNTRY_ID && !countryId) missingMasters.push("Country");
                    if (data.STATE_ID && !stateId) missingMasters.push("State");
                    if (data.PINCODE_ID && !pincodeId) missingMasters.push("Postal Code");
                    if (data.DISTRICT_ID && !districtId) missingMasters.push("District");

                    if (missingMasters.length > 0) {
                        skippedCount++;
                        const reason = `Data not found for ${missingMasters.join(', ')}`;
                        skippedDetails.push({ rowNumber: rowNum, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // Assign IDs
                    data.VENDOR_ID = vendorId;
                    data.COUNTRY_ID = countryId;
                    data.STATE_ID = stateId;
                    data.PINCODE_ID = pincodeId;
                    data.TYPE = data.TYPE == 'On Payroll' ? 'O' : data.TYPE == 'Freelancer' ? 'F' : data.TYPE == 'Vendor Managed' ? 'V' : data.TYPE == 'Remote Technician' ? 'R' : 'O';
                    data.IS_OWN_VEHICLE = data.IS_OWN_VEHICLE === "Yes" ? 1 : 0;    
                    data.CLIENT_ID = 1;
                    data.GENDER = data.GENDER === "Male" ? "M" : data.GENDER === "Female" ? "F" : data.GENDER === "Other" ? "O" : null;
                    data.ORG_ID = 1;
                    data.PINCODE = pincodeId ? PINCODE_VALUE : null;
                    data.EXPERIENCE_LEVEL = data.EXPERIENCE_LEVEL == "Fresher" ? "F" : data.EXPERIENCE_LEVEL == "Junior" ? "J" : data.EXPERIENCE_LEVEL == "Mid-Level" ? "M" : data.EXPERIENCE_LEVEL == "Senior" ? "S" : data.EXPERIENCE_LEVEL == "Lead" ? "L" : data.EXPERIENCE_LEVEL == "Expert" ? "E" : null;
                    data.COUNTRY_CODE = data.COUNTRY_CODE ? data.COUNTRY_CODE : null;
                    data.DISTRICT_ID = districtId ? districtId : null;
                    data.HOME_LATTITUDE = data.HOME_LATTITUDE ? data.HOME_LATTITUDE : null;
                    data.HOME_LONGITUDE = data.HOME_LONGITUDE ? data.HOME_LONGITUDE : null;
                    data.CONTRACT_START_DATE = data.CONTRACT_START_DATE ? data.CONTRACT_START_DATE : null;
                    data.CONTRACT_END_DATE = data.CONTRACT_END_DATE ? data.CONTRACT_END_DATE : null;

                    console.log("\n\nData after master lookups and final transformations:", data);
                    if (IMPORT_TYPE === "E") {
                        data.IS_ACTIVE = (data.IS_ACTIVE === "Yes" || data.IS_ACTIVE === "Active") ? 1 : 0;
                        if (!data.ID) throw new Error("Missing Technician ID");
                        ["DOB", "HIRE_DATE", "CREATED_DATE"].forEach(f => {
                            if (data[f] === "" || data[f] === null) {
                                delete data[f];
                            }
                        });

                        // STEP 1: Check if ID exists (NEW SP)
                        const idCheck = await new Promise((resolve, reject) => {
                            mm.executeDML(
                                `CALL sp_check_technician_id_exists(?)`,
                                [data.ID],
                                supportKey,
                                connection,
                                (e, r) => e ? reject(e) : resolve(r)
                            );
                        });

                        const idResult = idCheck[0] || [];

                        if (!idResult.length) {
                            skippedCount++;
                            let reason = "Technician ID does not exist";
                            skippedDetails.push({ rowNumber: rowNum, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }


                        // STEP 2: Check duplicate (EXISTING SP)
                        const existing = await new Promise((resolve, reject) => {
                            mm.executeDML(
                                `CALL sp_check_technician_exists(?, ?, ?)`,
                                [data.EMAIL_ID, data.MOBILE_NUMBER, data.ID],
                                supportKey,
                                connection,
                                (e, r) => e ? reject(e) : resolve(r)
                            );
                        });

                        const existingTechnicians = existing[0] || [];


                        // STEP 3: Duplicate validation (UNCHANGED LOGIC, slightly cleaned)
                        if (existingTechnicians.length > 0) {

                            const isEmailExists = existingTechnicians.some(
                                tech => tech.EMAIL_ID === data.EMAIL_ID && tech.ID != data.ID
                            );

                            const isMobileExists = existingTechnicians.some(
                                tech => String(tech.MOBILE_NUMBER) === String(data.MOBILE_NUMBER) && tech.ID != data.ID
                            );

                            if (isEmailExists || isMobileExists) {
                                skippedCount++;

                                let reason = "";
                                if (isEmailExists && isMobileExists) {
                                    reason = "Technician already exists with same email and mobile number";
                                } else if (isEmailExists) {
                                    reason = "Technician already exists with same email";
                                } else if (isMobileExists) {
                                    reason = "Technician already exists with same mobile number";
                                }

                                skippedDetails.push({ rowNumber: rowNum, row, reason });
                                totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                                mm.rollbackConnection(connection);
                                continue;
                            }
                        }
                        // Get geolocation details
                        let fullAddress = "";

                        if (!line1 || !ste || !cntry || !pincd) {
                            const reason = "The required fields are missing for getting geolocation";
                            skippedCount++;
                            skippedDetails.push({ rowNumber: rowNum, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        } else {
                            fullAddress = [line1, ste, cntry, pincd].filter(Boolean).join(', ');
                        }

                        if (data.HOME_LONGITUDE == "" || data.HOME_LATTITUDE == "" || data.HOME_LONGITUDE == null || data.HOME_LATTITUDE == null) {
                            console.log(`\n\n\n\n **** Geocoding address for row ${rowNum}: ${fullAddress}`);
                            const geo = await mm.geocodeAddress(fullAddress);
                            if (!geo.latitude || !geo.longitude) {
                                const reason = "Invalid address faild to fetch geolocation";
                                skippedCount++;
                                skippedDetails.push({ rowNumber: rowNum, row, reason });
                                totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                                mm.rollbackConnection(connection);
                                continue;
                            }
                            data.HOME_LONGITUDE = geo.longitude;
                            data.HOME_LATTITUDE = geo.latitude
                            row.Longitude = geo.longitude;
                            row.Latitude = geo.latitude
                        }
                        const values = [
                            data.ID, data.NAME, data.EMAIL_ID, data.MOBILE_NUMBER,
                            data.GENDER, data.DOB, data.HIRE_DATE, data.CREATED_DATE, data.ADDRESS_LINE1,
                            data.ADDRESS_LINE2, data.COUNTRY_ID, data.STATE_ID, data.CITY_ID,
                            data.PINCODE_ID, data.HOME_LATTITUDE, data.HOME_LONGITUDE, data.TYPE, data.IS_OWN_VEHICLE,
                            data.VEHICLE_DETAILS, data.IS_TOOLKIT_ASSIGNED, data.IS_UNIFORM_ASSIGNED, data.ASSIGNED_DATE,
                            data.ORG_ID, data.CLIENT_ID, data.PINCODE, data.EXPERIENCE_LEVEL, data.VENDOR_ID,
                            data.IS_ACTIVE, data.IS_PINCODE_MAPPED, data.PASSWORD,
                            data.COUNTRY_CODE,
                            data.DISTRICT_ID,
                            data.CONTRACT_START_DATE,
                            data.CONTRACT_END_DATE,


                        ].map(v => v === undefined ? null : v);
                        // Update technician using SP
                        await new Promise((resolve, reject) => {
                            mm.executeDML(
                                `CALL sp_update_technician( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ?, ?, ?, ?)`,
                                values,
                                supportKey,
                                connection,
                                e => e ? reject(e) : resolve()
                            );
                        });

                        await updateTechnicianChannels(data);
                        addGlobalData(data.ID, supportKey);
                    } else {
                        data.ASSIGNED_DATE = data.IS_TOOLKIT_ASSIGNED == 1 && data.IS_UNIFORM_ASSIGNED == 1 ? mm.getSystemDate() : null;
                        data.HIRE_DATE = mm.getSystemDate();
                        data.CREATED_DATE = mm.getSystemDate();
                        data.IS_ACTIVE = 1;
                        data.IS_PINCODE_MAPPED = 0;
                        data.PASSWORD = data.PASSWORD ? await mm.hashPassword(data.PASSWORD) : null;

                        // Check if technician exists using SP
                        const existing = await new Promise((resolve, reject) => {
                            mm.executeDML(
                                `CALL sp_check_technician_exists(?, ?, NULL)`,
                                [data.EMAIL_ID, data.MOBILE_NUMBER],
                                supportKey,
                                connection,
                                (e, r) => e ? reject(e) : resolve(r)
                            );
                        });

                        const existingTechnicians = existing[0] || [];

                        if (existingTechnicians.length) {
                            skippedCount++;
                            const isEmailExists = existingTechnicians.some(tech => tech.EMAIL_ID === data.EMAIL_ID);
                            const isMobileExists = existingTechnicians.some(tech => String(tech.MOBILE_NUMBER) === String(data.MOBILE_NUMBER));
                            let reason = "";
                            if (isEmailExists && isMobileExists) {
                                reason = "Technician already exists with same email and mobile number";
                            } else if (isEmailExists) {
                                reason = "Technician already exists with same email";
                            } else if (isMobileExists) {
                                reason = "Technician already exists with same mobile number";
                            }
                            skippedDetails.push({ rowNumber: rowNum, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        const values = [
                            data.NAME,
                            data.EMAIL_ID,
                            data.MOBILE_NUMBER,
                            data.GENDER,
                            data.DOB,
                            data.HIRE_DATE,
                            data.CREATED_DATE,
                            data.ADDRESS_LINE1,
                            data.ADDRESS_LINE2,
                            data.COUNTRY_ID,
                            data.STATE_ID,
                            data.CITY_ID,
                            data.PINCODE_ID,
                            data.HOME_LATTITUDE,
                            data.HOME_LONGITUDE,
                            data.TYPE,
                            data.IS_OWN_VEHICLE,
                            data.VEHICLE_DETAILS,
                            data.IS_TOOLKIT_ASSIGNED,
                            data.IS_UNIFORM_ASSIGNED,
                            data.ASSIGNED_DATE,
                            data.ORG_ID,
                            data.CLIENT_ID,
                            data.PINCODE,
                            data.EXPERIENCE_LEVEL,
                            data.VENDOR_ID,
                            data.IS_ACTIVE,
                            data.IS_PINCODE_MAPPED,
                            data.PASSWORD,
                            data.COUNTRY_CODE,
                            data.DISTRICT_ID,
                            data.CONTRACT_START_DATE,
                            data.CONTRACT_END_DATE,
                        ].map(v => v === undefined ? null : v);
                        // Insert technician using SP
                        const ins = await new Promise((resolve, reject) => {
                            mm.executeDML(
                                `CALL sp_insert_technician( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
                                values,
                                supportKey,
                                connection,
                                (e, r) => e ? reject(e) : resolve(r)
                            );
                        });

                        const techId = ins[0][0].insertId;

                        // Insert technician calendar using SP
                        await new Promise((resolve, reject) => {
                            mm.executeDML(
                                `CALL sp_insert_technician_calendar(?, ?)`,
                                [techId, data.CLIENT_ID],
                                supportKey,
                                connection,
                                e => e ? reject(e) : resolve()
                            );
                        });

                        createTechnicianChannels(techId, data);
                        addGlobalData(techId, supportKey);
                    }

                    mm.commitConnection(connection);
                    successCount++;
                    successDetails.push({ rowNumber: rowNum, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (err) {
                    mm.rollbackConnection(connection);
                    errorDetails.push({ rowNumber: rowNum, error: err.message });
                    errorData.push({ rowNumber: rowNum, data: row, reason: err.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
                }
            }

            if (EXCEL_MASTER_ID) {
                const progress = Math.round(((start + chunk.length) / excelData.length) * 100);
                await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, { PROGRESS: progress, STATUS: "Processing" });
            }
        }

        let response = {
            code: 200,
            message: "Technician import process completed.",
            totalRecords: excelData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: errorDetails.length,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            totalData: totalData,
            errorData: errorData
        };

        if (EXCEL_MASTER_ID) {
            const fs = require("fs");
            const path = require("path");

            const fileName = `${EXCEL_MASTER_ID}.json`;
            const filePathn = path.join(
                __dirname,
                "../../uploads/ExcelImporResponse/",
                fileName
            );
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                STATUS: "Completed",
                PROGRESS: 100,
                TOTAL_RECORDS: excelData.length,
                SUCCESSFUL_RECORDS: successCount,
                SKIPPED_RECORDS: skippedCount,
                FAILED_RECORDS: errorDetails.length,
                RESPONSE: fileName
            });

            fs.writeFileSync(filePathn, JSON.stringify(response, null, 2), "utf8");
        }

    } catch (err) {
        console.error(err);
    }
};

exports.importSkillMapping = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const {
            EXCEL_FILE_NAME,
            IMPORT_TYPE,
            COLUMN_JSON
        } = req.body;

        let EXCEL_MASTER_ID = req.body.id;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });

        // Create a mapping from COLUMN_JSON for ALL fields
        const columnMapping = {};
        if (COLUMN_JSON && Array.isArray(COLUMN_JSON)) {
            COLUMN_JSON.forEach(col => {
                columnMapping[col.TABLE_FIELD] = col.EXCEL_FIELD;
            });
        }

        // Get ALL Excel column names from mapping with fallbacks
        const excelTechField = columnMapping.TECHNICIAN_ID || "Technician Name";
        const excelEmailField = columnMapping.TECHNICIAN_EMAIL || "Email";
        const excelSkillField = columnMapping.SKILL_ID || "Skill Name";
        const excelSkillLevelField = columnMapping.SKILL_LEVEL || "Skill Level";
        const excelActiveField = columnMapping.IS_ACTIVE || "Is Active";
        const excelStatusField = columnMapping.STATUS || "Status";

        // Helper function to get value from row with multiple possible column names
        const getColumnValue = (row, possibleNames) => {
            for (const name of possibleNames) {
                if (row[name] !== undefined) {
                    return row[name];
                }
            }
            return undefined;
        };

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }   // ensures undefined cells become empty strings
        );

        // remove empty rows
        const rows = cleanedRows.filter(row =>
            Object.values(row).some(
                val => val !== null && val !== undefined && String(val).trim() !== ""
            )
        );

        console.log("Clean rows:", rows);

        if (!rows.length)
            return res.status(200).json({ code: 200, message: "No data found" });

        res.status(200).json({
            code: 200,
            message: "Technician Skill import started",
            EXCEL_MASTER_ID: EXCEL_MASTER_ID
        });

        // Detailed reporting arrays
        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        let successDetails = [];
        let errorDetails = [];
        let errorData = [];
        let skippedDetails = [];
        let totalData = [];
        const chunkSize = 50;
        let total = rows.length;

        const isEdit = IMPORT_TYPE === "E";

        // Helper function to normalize text
        const normalizeText = (text) => text ? text.toString().trim() : '';

        // Helper function to run queries using SPs
        const runSP = (spName, params, supportKey) => {
            return new Promise((resolve, reject) => {
                const placeholders = params.map(() => '?').join(',');
                const query = `CALL ${spName}(${placeholders})`;
                mm.executeQueryData(query, params, supportKey, (error, results) => {
                    if (error) {
                        console.log("error", error);
                        reject(error);
                    }
                    else resolve(results);
                });
            });
        };

        for (let start = 0; start < rows.length; start += chunkSize) {
            const chunk = rows.slice(start, start + chunkSize);

            for (const [i, row] of chunk.entries()) {
                const rowNumber = start + i + 2;

                try {
                    console.log("\n\n\n **** Processing row:", rowNumber, row);

                    // Get ALL values using dynamic column name resolution from COLUMN_JSON
                    let TECHNICIAN_NAME = getColumnValue(row, [
                        excelTechField,
                        'Technician Name',
                        'TECHNICIAN_NAME',
                        'Technician',
                        'TECHNICIAN',
                        'Technician ID',
                        'TECHNICIAN_ID'
                    ]);

                    let TECHNICIAN_EMAIL = getColumnValue(row, [
                        excelEmailField,
                        'Technician Email',
                        'TECHNICIAN_EMAIL',
                        'Email',
                        'EMAIL',
                        'Email ID',
                        'EMAIL_ID'
                    ]);

                    let SKILL_NAME = getColumnValue(row, [
                        excelSkillField,
                        'Skill Name',
                        'SKILL_NAME',
                        'Skill',
                        'SKILL',
                        'Skill ID',
                        'SKILL_ID'
                    ]);

                    let SKILL_LEVEL = getColumnValue(row, [
                        excelSkillLevelField,
                        'Skill Level',
                        'SKILL_LEVEL',
                        'Level',
                        'LEVEL'
                    ]) || "M";

                    let IS_ACTIVE = getColumnValue(row, [
                        excelActiveField,
                        'Is Active',
                        'IS_ACTIVE',
                        'Active',
                        'ACTIVE',
                        'IsActive'
                    ]);

                    let STATUS = getColumnValue(row, [
                        excelStatusField,
                        'Status',
                        'STATUS'
                    ]) || "M";
                    let ID = getColumnValue(row, ['ID', 'Id', 'id']);

                    // Store original row data for reporting
                    const originalRowData = { ...row };

                    // Normalize inputs
                    TECHNICIAN_NAME = normalizeText(TECHNICIAN_NAME);
                    SKILL_NAME = normalizeText(SKILL_NAME);
                    STATUS = normalizeText(STATUS);
                    SKILL_LEVEL = normalizeText(SKILL_LEVEL);
                    TECHNICIAN_EMAIL = normalizeText(TECHNICIAN_EMAIL);

                    // Convert IS_ACTIVE
                    let isActiveValue;

                    if (IMPORT_TYPE === "E") {
                        isActiveValue = IS_ACTIVE == "Yes" ? 1 : 0;
                    } else {
                        isActiveValue = 1;
                    }

                    // Validate required fields
                    if (!TECHNICIAN_NAME || !SKILL_NAME || !STATUS || !TECHNICIAN_EMAIL) {
                        const missingFields = [
                            !TECHNICIAN_NAME && "TECHNICIAN_NAME",
                            !SKILL_NAME && "SKILL_NAME",
                            !STATUS && "STATUS",
                            !TECHNICIAN_EMAIL && "TECHNICIAN_EMAIL"
                        ].filter(Boolean);

                        const reason = `Missing required fields: ${missingFields.join(", ")}`;
                        skippedDetails.push({ rowNumber, row: row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                   
                    // Resolve Technician using SP
                   
                    const techResult = await runSP(
                        'sp_get_technician_by_name_email',
                        [TECHNICIAN_NAME, TECHNICIAN_EMAIL],
                        supportKey
                    );

                    const tech = techResult[0] || [];

                    if (!tech.length) {
                        const reason = `Technician not found: "${originalRowData[excelTechField] || originalRowData['Technician Name'] || TECHNICIAN_NAME} having email "${originalRowData[excelEmailField] || originalRowData['Email'] || TECHNICIAN_EMAIL}"`;
                        skippedDetails.push({
                            rowNumber,
                            row: row,
                            reason
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                   
                    // Resolve Skill using SP
                   
                    const skillResult = await runSP(
                        'sp_get_skill_by_name',
                        [SKILL_NAME],
                        supportKey
                    );

                    const skill = skillResult[0] || [];

                    if (!skill.length) {
                        const reason = `Skill not found: "${originalRowData[excelSkillField] || originalRowData['Skill Name'] || SKILL_NAME}"`;
                        skippedDetails.push({
                            rowNumber,
                            row: row,
                            reason
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                    const TECHNICIAN_ID = tech[0].ID;
                    const actualTechName = tech[0].NAME; // Actual name from DB
                    const SKILL_ID = skill[0].ID;
                    const actualSkillName = skill[0].NAME; // Actual skill name from DB

                   
                    // Check Existing Mapping using SP
                   
                    let mappingResult;
                    if (isEdit && ID) {
                        mappingResult = await runSP(
                            'sp_check_skill_mapping_exists',
                            [TECHNICIAN_ID, SKILL_ID, ID],
                            supportKey
                        );
                    } else {
                        mappingResult = await runSP(
                            'sp_check_skill_mapping_exists',
                            [TECHNICIAN_ID, SKILL_ID, null],
                            supportKey
                        );
                    }

                    const mapping = mappingResult[0] || [];

                    if (isEdit && !mapping.length) {
                        const reason = "Skill mapping not found for ID: " + ID + " and skill: " + SKILL_NAME;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                    const operationData = {
                        TECHNICIAN_ID,
                        TECHNICIAN_NAME: actualTechName, // Use DB name
                        SKILL_ID,
                        SKILL_NAME: actualSkillName, // Use DB skill name
                        SKILL_LEVEL,
                        IS_ACTIVE: isActiveValue,
                        STATUS
                    };

                   
                    // UPDATE using SP
                   
                    if (mapping.length) {
                        await runSP(
                            'sp_update_skill_mapping',
                            [
                                mapping[0].ID,
                                SKILL_LEVEL,
                                isActiveValue,
                                STATUS,
                                1
                            ],
                            supportKey
                        );

                        successCount++;
                        successDetails.push({
                            rowNumber: rowNumber,
                            row: row,
                            ID: mapping[0].ID
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }
                   
                    // INSERT using SP
                   
                    else {
                        if (isEdit) {
                            const reason = "Mapping not found for update";
                            skippedDetails.push({
                                rowNumber,
                                row: row,
                                reason
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            skippedCount++;
                            continue;
                        }

                        const insertResult = await runSP(
                            'sp_insert_skill_mapping',
                            [
                                TECHNICIAN_ID,
                                SKILL_ID,
                                SKILL_LEVEL,
                                isActiveValue,
                                STATUS,
                                1
                            ],
                            supportKey
                        );

                        const insertId = insertResult[0][0].insertId;

                        successCount++;
                        successDetails.push({
                            rowNumber: rowNumber,
                            row: row,
                            ID: insertId
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }

                } catch (err) {
                    failedCount++;
                    errorDetails.push({
                        rowNumber,
                        error: err.message
                    });
                    errorData.push({
                        rowNumber,
                        row: row,
                        reason: err.message
                    });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
                }
            }

            // Update progress
            const progress = Math.min(100, Math.round(((start + chunk.length) / rows.length) * 100));
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

       
        // Prepare final response
       
        let response = {
            code: 200,
            message: "Technician Skill import process completed.",
            totalRecords: rows.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: failedCount,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            totalData: totalData,
            errorData: errorData
        };

       
        // Final Status Update
       
        const fs = require("fs");
        const path = require("path");

        // unique file name
        const fileName = `${EXCEL_MASTER_ID}.json`;
        const filePathn = path.join(
            __dirname,
            "../../uploads/ExcelImporResponse/",
            fileName
        );
        await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
            STATUS: "Completed",
            PROGRESS: 100,
            TOTAL_RECORDS: rows.length,
            SUCCESSFUL_RECORDS: successCount,
            SKIPPED_RECORDS: skippedCount,
            FAILED_RECORDS: errorDetails.length,
            RESPONSE: fileName
        });

        // write JSON file (pretty format for readability)
        fs.writeFileSync(filePathn, JSON.stringify(response, null, 2), "utf8");


        console.log("Technician Skill import completed:", response.message);

    } catch (error) {
        console.error("Error importing Technician Skill mapping:", error);

        // Update excel master with error status if EXCEL_MASTER_ID exists
        if (req.body.id) {
            await excelMaster.findByIdAndUpdate(req.body.id, {
                STATUS: "Failed",
                RESPONSE: JSON.stringify({
                    code: 500,
                    message: "Import failed due to system error",
                    error: error.message
                })
            });
        }
    }
};

exports.importTechnicianWeeklyCalendar = async (req, res) => {
    const supportKey = req.headers["supportkey"];
    const { EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE, COLUMN_JSON } = req.body;

    if (!EXCEL_FILE_NAME)
        return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });

    if (!COLUMN_JSON || !Array.isArray(COLUMN_JSON))
        return res.status(400).json({ code: 400, message: "Missing or invalid COLUMN_JSON" });

    try {
        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        // const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);
        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }
        );

        // remove empty rows
        const rows = cleanedRows.filter(row =>
            Object.values(row).some(
                val => val !== null && val !== undefined && String(val).trim() !== ""
            )
        );

        if (!rows.length)
            return res.status(200).json({ code: 200, message: "No data found" });

        res.status(200).json({
            code: 200,
            message: "Technician weekly calendar import started",
            EXCEL_MASTER_ID: EXCEL_MASTER_ID
        });

        // Create mapping from COLUMN_JSON
        const columnMapping = {};
        COLUMN_JSON.forEach(column => {
            columnMapping[column.TABLE_FIELD] = column.EXCEL_FIELD;
        });

        console.log("Column Mapping:", columnMapping);

        // Detailed reporting arrays
        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        let successDetails = [];
        let errorDetails = [];
        let errorData = [];
        let skippedDetails = [];
        let totalData = [];
        const chunkSize = 50;

        const isEdit = IMPORT_TYPE === "E";

        console.log(`\n\n\n @@@Excel Data:`, rows);

        // Helper function to normalize text
        const normalizeText = (text) => text ? text.toString().trim() : '';

        // Helper function to run queries using SPs
        const runSP = (spName, params, supportKey) => {
            return new Promise((resolve, reject) => {
                const placeholders = params.map(() => '?').join(',');
                const query = `CALL ${spName}(${placeholders})`;
                mm.executeQueryData(query, params, supportKey, (error, results) => {
                    if (error) {
                        console.log("error", error);
                        reject(error);
                    }
                    else resolve(results);
                });
            });
        };

        for (let start = 0; start < rows.length; start += chunkSize) {
            const chunk = rows.slice(start, start + chunkSize);

            for (const [i, row] of chunk.entries()) {
                const rowNumber = start + i + 2;
                const originalRowData = { ...row };

                try {
                    // USE THE MAPPING TO EXTRACT DATA
                    let ID = normalizeText(row[columnMapping.ID]);
                    let TECHNICIAN_NAME = normalizeText(row[columnMapping.TECHNICIAN_ID]);
                    let WEEK_DAY = normalizeText(row[columnMapping.WEEK_DAY]);
                    let IS_SERIVCE_AVAILABLE = normalizeText(row[columnMapping.IS_SERIVCE_AVAILABLE]);
                    let DAY_START_TIME = normalizeText(row[columnMapping.DAY_START_TIME]);
                    let DAY_END_TIME = normalizeText(row[columnMapping.DAY_END_TIME]);
                    let BREAK_START_TIME = normalizeText(row[columnMapping.BREAK_START_TIME]);
                    let BREAK_END_TIME = normalizeText(row[columnMapping.BREAK_END_TIME]);
                    let TECHNICIAN_EMAIL = normalizeText(row[columnMapping.TECHNICIAN_EMAIL]);

                    // Helper function for missing fields
                    const getMissingFieldsReason = () => {
                        const missing = [];
                        if (!ID && isEdit) missing.push("ID");
                        if (!TECHNICIAN_NAME) missing.push("TECHNICIAN_NAME");
                        if (!WEEK_DAY) missing.push("WEEK_DAY");
                        if (!TECHNICIAN_EMAIL) missing.push("TECHNICIAN_EMAIL");
                        return missing.length > 0 ? `Missing required fields: ${missing.join(", ")}` : null;
                    };

                    /* ------------------------------
                       Mandatory checks
                    ------------------------------ */
                    if (WEEK_DAY == "Monday") WEEK_DAY = "Mo";
                    else if (WEEK_DAY == "Tuesday") WEEK_DAY = "Tu";
                    else if (WEEK_DAY == "Wednesday") WEEK_DAY = "We";
                    else if (WEEK_DAY == "Thursday") WEEK_DAY = "Th";
                    else if (WEEK_DAY == "Friday") WEEK_DAY = "Fr";
                    else if (WEEK_DAY == "Saturday") WEEK_DAY = "Sa";
                    else if (WEEK_DAY == "Sunday") WEEK_DAY = "Su";
                    else if (!["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].includes(WEEK_DAY)) {
                        const reason = `Invalid WEEK_DAY value: "${WEEK_DAY}"`;
                        skippedDetails.push({
                            rowNumber,
                            row: originalRowData,
                            reason
                        });
                        totalData.push({ ...originalRowData, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                    const missingFieldsReason = getMissingFieldsReason();
                    if (missingFieldsReason) {
                        skippedDetails.push({
                            rowNumber,
                            row: originalRowData,
                            reason: missingFieldsReason
                        });
                        totalData.push({ ...originalRowData, IMPORT_STATUS: "Skipped", reason: missingFieldsReason });
                        skippedCount++;
                        continue;
                    }

                    console.log(`\n\n\n **** Processing Row ${rowNumber}: Technician="${TECHNICIAN_NAME}", WeekDay="${WEEK_DAY}", ID="${ID}"`);

                    /* ------------------------------
                       Validate Technician Master using SP
                    ------------------------------ */
                    const technicianResult = await runSP(
                        'sp_get_technician_by_name_email',
                        [TECHNICIAN_NAME, TECHNICIAN_EMAIL],
                        supportKey
                    );

                    const technician = technicianResult[0] || [];

                    if (!technician.length) {
                        let reason = `Technician not found: "${originalRowData[columnMapping.TECHNICIAN_ID] || TECHNICIAN_NAME}" with email "${originalRowData[columnMapping.TECHNICIAN_EMAIL] || TECHNICIAN_EMAIL}"`;
                        skippedDetails.push({
                            rowNumber,
                            row: originalRowData,
                            reason: reason
                        });
                        totalData.push({ ...originalRowData, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                    const TECHNICIAN_ID = technician[0].ID;
                    const actualTechName = technician[0].NAME; // Actual name from DB

                    /* ------------------------------
                       Validate Calendar ID (for edit mode) using SP
                    ------------------------------ */
                    if (isEdit && ID) {
                        const calendarResult = await runSP(
                            'sp_check_calendar_exists',
                            [parseInt(ID), null, null],
                            supportKey
                        );

                        const calendar = calendarResult[0] || [];

                        if (!calendar.length) {
                            const reason = `Calendar ID not found: ${ID}`;
                            skippedDetails.push({
                                rowNumber,
                                row: originalRowData,
                                reason
                            });
                            totalData.push({ ...originalRowData, IMPORT_STATUS: "Skipped", reason });
                            skippedCount++;
                            continue;
                        }
                    }

                    // Convert Service Available to 1/0
                    const IS_AVAILABLE = (IS_SERIVCE_AVAILABLE &&
                        (IS_SERIVCE_AVAILABLE.toLowerCase() === 'yes' ||
                            IS_SERIVCE_AVAILABLE === '1')) ? 1 : 0;

                    // Prepare data for logging
                    const operationData = {
                        TECHNICIAN_NAME: actualTechName,
                        TECHNICIAN_ID,
                        IS_SERIVCE_AVAILABLE: IS_AVAILABLE,
                        WEEK_DAY,
                        DAY_START_TIME: IS_AVAILABLE ? toValidTime(DAY_START_TIME) : null,
                        DAY_END_TIME: IS_AVAILABLE ? toValidTime(DAY_END_TIME) : null,
                        BREAK_START_TIME: IS_AVAILABLE ? toValidTime(BREAK_START_TIME) : null,
                        BREAK_END_TIME: IS_AVAILABLE ? toValidTime(BREAK_END_TIME) : null
                    };
                    console.log(`\n\n\n\n\n %%%%Operation Data for Row ${rowNumber}:`, operationData);

                    let resultId = "";

                    /* ------------------------------
                       Check if record exists by ID (edit mode) or Technician+WeekDay using SP
                    ------------------------------ */
                    let existingRecordResult;
                    if (isEdit && ID) {
                        existingRecordResult = await runSP(
                            'sp_check_calendar_exists',
                            [parseInt(ID), null, null],
                            supportKey
                        );
                    } else {
                        existingRecordResult = await runSP(
                            'sp_check_calendar_exists',
                            [null, TECHNICIAN_ID, WEEK_DAY],
                            supportKey
                        );
                    }

                    const existingRecord = existingRecordResult[0] || [];

                    /* ------------------------------
                       UPDATE or INSERT using SPs
                    ------------------------------ */
                    if (existingRecord.length > 0) {
                        // UPDATE existing record
                        resultId = existingRecord[0].ID;

                        await runSP(
                            'sp_update_calendar_record',
                            [
                                resultId,
                                TECHNICIAN_ID,
                                IS_AVAILABLE,
                                WEEK_DAY,
                                operationData.DAY_START_TIME,
                                operationData.DAY_END_TIME,
                                operationData.BREAK_START_TIME,
                                operationData.BREAK_END_TIME
                            ],
                            supportKey
                        );
                    } else {
                        // INSERT new record (only if not in edit mode or edit with new ID)
                        if (isEdit && !ID) {
                            const reason = "ID required for update in edit mode";
                            skippedDetails.push({
                                rowNumber,
                                row: originalRowData,
                                reason
                            });
                            totalData.push({ ...originalRowData, IMPORT_STATUS: "Skipped", reason });
                            skippedCount++;
                            continue;
                        }

                        const insertResult = await runSP(
                            'sp_insert_calendar_record',
                            [
                                TECHNICIAN_ID,
                                IS_AVAILABLE,
                                WEEK_DAY,
                                operationData.DAY_START_TIME,
                                operationData.DAY_END_TIME,
                                operationData.BREAK_START_TIME,
                                operationData.BREAK_END_TIME
                            ],
                            supportKey
                        );

                        resultId = insertResult[0][0].insertId;
                    }

                    successCount++;
                    successDetails.push({ rowNumber: rowNumber, row: originalRowData, ID: resultId });
                    totalData.push({ ...originalRowData, IMPORT_STATUS: "Success" });

                } catch (err) {
                    failedCount++;
                    errorDetails.push({
                        rowNumber,
                        reason: err.message
                    });
                    errorData.push({
                        rowNumber,
                        row: originalRowData,
                        reason: err.message
                    });
                    totalData.push({ ...originalRowData, IMPORT_STATUS: "Failed", reason: err.message });
                }
            }

            // Update progress
            const progress = Math.min(100, Math.round(((start + chunk.length) / rows.length) * 100));
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

       
        // Prepare final response
       
        let response = {
            code: 200,
            message: "Technician weekly calendar import process completed.",
            totalRecords: rows.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: failedCount,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            totalData: totalData,
            errorData: errorData
        };

       
        // Final Status Update
       
        const fs = require("fs");
        const path = require("path");

        // unique file name
        const fileName = `${EXCEL_MASTER_ID}.json`;
        const filePathn = path.join(
            __dirname,
            "../../uploads/ExcelImporResponse/",
            fileName
        );
        await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
            STATUS: "Completed",
            PROGRESS: 100,
            TOTAL_RECORDS: rows.length,
            SUCCESSFUL_RECORDS: successCount,
            SKIPPED_RECORDS: skippedCount,
            FAILED_RECORDS: errorDetails.length,
            RESPONSE: fileName
        });

        // write JSON file (pretty format for readability)
        fs.writeFileSync(filePathn, JSON.stringify(response, null, 2), "utf8");


        console.log("Technician weekly calendar import completed:", response.message);

    } catch (error) {
        console.error("Error importing Technician weekly calendar:", error);

        // Update excel master with error status if EXCEL_MASTER_ID exists
        if (EXCEL_MASTER_ID) {
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                STATUS: "Failed",
                RESPONSE: JSON.stringify({
                    code: 500,
                    message: "Import failed due to system error",
                    error: error.message
                })
            });
        }
    }
};

exports.importTechnicianPincodeMapping = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE, COLUMN_JSON } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });

        // Add validation for COLUMN_JSON
        if (!COLUMN_JSON || !Array.isArray(COLUMN_JSON))
            return res.status(400).json({ code: 400, message: "Missing or invalid COLUMN_JSON" });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        // const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }   // ensures undefined cells become empty strings
        );

        // remove empty rows
        const rows = cleanedRows.filter(row =>
            Object.values(row).some(
                val => val !== null && val !== undefined && String(val).trim() !== ""
            )
        );
        if (!rows.length)
            return res.status(200).json({ code: 200, message: "No data found" });

        res.status(200).json({
            code: 200,
            message: "Technician postal code import started",
            EXCEL_MASTER_ID
        });

        // Create mapping from COLUMN_JSON
        const columnMapping = {};
        COLUMN_JSON.forEach(column => {
            columnMapping[column.TABLE_FIELD] = column.EXCEL_FIELD;
        });

        console.log("Column Mapping:", columnMapping);
        console.log("Excel Data:", rows);

        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        let successDetails = [];
        let skippedDetails = [];
        let errorDetails = [];
        let totalData = [];
        let errorData = [];

        const chunkSize = 50;
        const isEdit = IMPORT_TYPE === "E";

        const normalizeText = (v) => v ? v.toString().trim() : "";

        // Helper function to run queries using SPs
        const runSP = (spName, params, supportKey) => {
            return new Promise((resolve, reject) => {
                const placeholders = params.map(() => '?').join(',');
                const query = `CALL ${spName}(${placeholders})`;
                mm.executeQueryData(query, params, supportKey, (error, results) => {
                    if (error) {
                        console.log("error", error);
                        reject(error);
                    }
                    else resolve(results);
                });
            });
        };

        for (let start = 0; start < rows.length; start += chunkSize) {
            const chunk = rows.slice(start, start + chunkSize);

            for (const [i, row] of chunk.entries()) {
                const rowNumber = start + i + 2;
                const originalRow = { ...row };

                try {

                    let isActiveValue

                    if (IMPORT_TYPE === "E") {
                        isActiveValue = (row[columnMapping.IS_ACTIVE] === 'Yes' ? 1 : 0)
                    } else {
                        isActiveValue = 1; // For Import, set active by default
                    }

                    let TECHNICIAN_NAME = normalizeText(row[columnMapping.TECHNICIAN_ID]);
                    let PINCODE = normalizeText(row[columnMapping.PINCODE]);
                    let TECHNICIAN_EMAIL = normalizeText(row[columnMapping.TECHNICIAN_EMAIL]);
                    let ID = row[columnMapping.ID]

                    console.log(`Extracted: Technician="${TECHNICIAN_NAME}", Postal code="${PINCODE}", Email="${TECHNICIAN_EMAIL}"`);

                    console.log(`Row ${rowNumber}: TECHNICIAN_NAME="${TECHNICIAN_NAME}", PINCODE="${PINCODE}", TECHNICIAN_EMAIL="${TECHNICIAN_EMAIL}"`);
                    console.log(`TECHNICIAN_NAME is empty: ${!TECHNICIAN_NAME}, PINCODE is empty: ${!PINCODE}, TECHNICIAN_EMAIL is empty: ${!TECHNICIAN_EMAIL}`);

                    if (!TECHNICIAN_NAME || !PINCODE || !TECHNICIAN_EMAIL) {
                        const reason = `Missing TECHNICIAN_NAME or PINCODE or TECHNICIAN_EMAIL (Tech: "${TECHNICIAN_NAME}", Postal code: "${PINCODE}", Email: "${TECHNICIAN_EMAIL}")`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                    /* ---------------- Technician Resolve using SP ---------------- */
                    const techResult = await runSP(
                        'sp_get_technician_by_name_email',
                        [TECHNICIAN_NAME, TECHNICIAN_EMAIL],
                        supportKey
                    );

                    const tech = techResult[0] || [];

                    if (!tech.length) {
                        const reason = `Technician "${TECHNICIAN_NAME}" having email "${TECHNICIAN_EMAIL}" not found`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                    const TECHNICIAN_ID = tech[0].ID;

                    /* ---------------- Postal code Resolve using SP ---------------- */
                    const pincodeResult = await runSP(
                        'sp_get_pincode_by_code',
                        [PINCODE],
                        supportKey
                    );

                    const pincode = pincodeResult[0] || [];

                    if (!pincode.length) {
                        const reason = `Postal code not found: ${PINCODE}`;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                    const pm = pincode[0];
                    console.log(`\n\n\n **** Processing Row ${rowNumber}: Technician="${TECHNICIAN_NAME}", Postal code="${PINCODE}"`);

                    /* ---------------- Existing Mapping using SP ---------------- */
                    let mappingResult;
                    if (isEdit && ID) {
                        mappingResult = await runSP(
                            'sp_check_pincode_mapping_exists',
                            [TECHNICIAN_ID, pm.ID, ID],
                            supportKey
                        );
                    } else {
                        mappingResult = await runSP(
                            'sp_check_pincode_mapping_exists',
                            [TECHNICIAN_ID, pm.ID, null],
                            supportKey
                        );
                    }

                    const mapping = mappingResult[0] || [];

                    if (isEdit && !mapping.length) {
                        const reason = "Postal code mapping not found for ID: " + ID + " and Postal code: " + PINCODE;
                        skippedDetails.push({ rowNumber, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        skippedCount++;
                        continue;
                    }

                    /* ---------------- UPDATE using SPs ---------------- */
                    if (mapping.length && isEdit) {
                        await runSP(
                            'sp_update_pincode_mapping',
                            [mapping[0].ID, isActiveValue, 1],
                            supportKey
                        );

                        await runSP(
                            'sp_update_technician_pincode_status',
                            [TECHNICIAN_ID, 1],
                            supportKey
                        );

                        successCount++;
                        successDetails.push({
                            rowNumber,
                            row,
                            ID: mapping[0].ID
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Success", });
                    }
                    /* ---------------- INSERT using SPs ---------------- */
                    else {
                        if (mapping.length) {
                            const reason = "The postal code: " + PINCODE + " is already mapped to the technician: " + TECHNICIAN_NAME + ".";
                            skippedDetails.push({ rowNumber, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            skippedCount++;
                            continue;
                        }

                        const insertResult = await runSP(
                            'sp_insert_pincode_mapping',
                            [
                                TECHNICIAN_ID,
                                pm.ID,
                                isActiveValue,
                                1,
                                pm.PINCODE,
                                pm.COUNTRY_NAME,
                                pm.COUNTRY_ID,
                                pm.STATE,
                                pm.STATE_NAME,
                                pm.OFFICE_NAME,
                                pm.CIRCLE_NAME,
                                pm.DIVISION_NAME || null,
                                pm.TALUKA || null,
                                pm.DISTRICT || null,
                                pm.DISTRICT_NAME || null
                            ],
                            supportKey
                        );

                        const insertId = insertResult[0][0].insertId;

                        await runSP(
                            'sp_update_technician_pincode_status',
                            [TECHNICIAN_ID, 1],
                            supportKey
                        );

                        successCount++;
                        successDetails.push({
                            rowNumber,
                            row,
                            ID: insertId
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }

                } catch (err) {
                    failedCount++;
                    errorDetails.push({ rowNumber, reason: err.message });
                    errorData.push({
                        rowNumber,
                        row: row,
                        reason: err.message
                    });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / rows.length) * 100);
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: Math.min(progress, 100),
                STATUS: "Processing"
            });
        }

        let response = {
            code: 200,
            message: "Technician postal code import process completed.",
            totalRecords: rows.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: failedCount,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            totalData: totalData,
            errorData: errorData
        };

        const fs = require("fs");
        const path = require("path");

        // unique file name
        const fileName = `${EXCEL_MASTER_ID}.json`;
        const filePathn = path.join(
            __dirname,
            "../../uploads/ExcelImporResponse/",
            fileName
        );
        await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
            STATUS: "Completed",
            PROGRESS: 100,
            TOTAL_RECORDS: rows.length,
            SUCCESSFUL_RECORDS: successCount,
            SKIPPED_RECORDS: skippedCount,
            FAILED_RECORDS: errorDetails.length,
            RESPONSE: fileName
        });

        // write JSON file (pretty format for readability)
        fs.writeFileSync(filePathn, JSON.stringify(response, null, 2), "utf8");


        console.log("Technician Postal code import completed");

    } catch (error) {
        console.error("Import failed:", error);
    }
};




