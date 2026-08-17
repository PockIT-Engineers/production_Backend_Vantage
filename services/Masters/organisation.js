const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
var organisationMaster = "organisation_master";
var viewOrganisationMaster = "view_" + organisationMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        EMAIL_ID: req.body.EMAIL_ID,
        PASSWORD: req.body.PASSWORD,
        ADDRESS: req.body.ADDRESS,
        CITY_ID: req.body.CITY_ID,
        STATE_ID: req.body.STATE_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        USER_ID: req.body.USER_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        SEQ_NO: req.body.SEQ_NO,
        DAY_START_TIME: req.body.DAY_START_TIME,
        DAY_END_TIME: req.body.DAY_END_TIME,
        DISTRICT_ID: req.body.DISTRICT_ID,
        CAN_CHANGE_SERVICE_PRICE: 1,
        PINCODE: req.body.PINCODE,

    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('EMAIL_ID').optional(),
        body('PASSWORD').optional(),
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

    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({  "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_organisation_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to get organisation data."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 76,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.getdata = (req, res) => {
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

    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({  "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_organisation_getData()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to get organisation data."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                var results = resultSets[1] || [];
                const results3 = resultSets[2] || [];
                let calendarDataMap = {};
                results3.forEach(item => {
                    if (!calendarDataMap[item.ORG_ID]) {
                        calendarDataMap[item.ORG_ID] = [];
                    }
                    calendarDataMap[item.ORG_ID].push(item);
                });

                results.forEach(item => {
                    item.WEEK_DAY_DATA = calendarDataMap[item.ID] || [];
                });
                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 16,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": results
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.create = async(req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_organisation_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.EMAIL_ID,
                // md5(process.env.DEFAULT_PASSWORD),
                await mm.hashPassword(process.env.DEFAULT_PASSWORD),
                data.ADDRESS,
                data.CITY_ID,
                data.STATE_ID,
                data.PINCODE_ID,
                data.COUNTRY_ID,
                data.DISTRICT_ID,
                data.PINCODE,
                data.SEQ_NO,
                data.DAY_START_TIME,
                data.DAY_END_TIME,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to save organisation." });
                }

                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created a organisation Master  ${data.NAME}.`;

                var logCategory = "Order Status"

                let actionLog = {
                    "SOURCE_ID": result[0][0].ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)

                return res.send({
                    "code": 200,
                     "message": "organisationMaster information created and logged successfully."
                });

            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_organisation_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.NAME,
                data.EMAIL_ID,
                data.ADDRESS,
                data.CITY_ID,
                data.STATE_ID,
                data.PINCODE_ID,
                data.COUNTRY_ID,
                data.DISTRICT_ID,
                data.PINCODE,
                data.SEQ_NO,
                data.DAY_START_TIME,
                data.DAY_END_TIME,
                data.IS_ACTIVE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to update organisation." });
                }
                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated a organisation Master  ${data.NAME}.`;

                var logCategory = "Order Status"

                let actionLog = {
                    "SOURCE_ID": ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)

                res.status(200).json({
                    "code": 200,
                     "message": "Organisation updated successfully."
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
}

exports.createOrg = async(req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        let data = reqData(req);
        // let PASSWORD = md5(process.env.DEFAULT_PASSWORD);
        let PASSWORD = await mm.hashPassword(process.env.DEFAULT_PASSWORD);
        let ROLE_ID = req.body.ROLE_ID ? req.body.ROLE_ID : "8";

        mm.executeQueryData(
             `CALL sp_organisation_createOrg(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.EMAIL_ID,
                PASSWORD,
                data.ADDRESS,
                data.CITY_ID,
                data.STATE_ID,
                data.PINCODE_ID,
                data.COUNTRY_ID,
                data.DISTRICT_ID,
                data.PINCODE,
                data.SEQ_NO,
                data.DAY_START_TIME,
                data.DAY_END_TIME,
                data.CLIENT_ID,
                ROLE_ID,
                data.CAN_CHANGE_SERVICE_PRICE
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({ "code": 400,  "message": "Failed to save vendor information..." });
                }

                if (results[0][0].STATUS === 'EXISTS') {
                    return res.send({ "code": 200,  "message": "Email already exists..." });
                }

                // ✅ Mongo action SAME
                let ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new organisation ${data.NAME}.`;
                dbm.saveLog({
                    SOURCE_ID: results[0][0].ORG_ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "organisation",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({ "code": 200,  "message": "organisationMaster information saved succesfully." });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.updateOrg = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        let data = reqData(req);
        
        let ROLE_ID = req.body.ROLE_ID ? req.body.ROLE_ID : "8";

        mm.executeQueryData(
            `CALL sp_organisation_updateOrg(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                
                req.body.ID,
                data.NAME,
                data.EMAIL_ID,
                data.ADDRESS,
                data.CITY_ID,
                data.STATE_ID,
                data.PINCODE_ID,
                data.COUNTRY_ID,
                data.DISTRICT_ID,
                data.PINCODE,
                data.SEQ_NO,
                data.DAY_START_TIME,
                data.DAY_END_TIME,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                ROLE_ID,
                data.CAN_CHANGE_SERVICE_PRICE
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({ "code": 400,  "message": "Failed to update vendor information." });
                }

                if (results[0][0].STATUS === 'EXISTS') {
                    return res.send({ "code": 200,  "message": "Email already exists..." });
                }

                // ✅ Mongo action SAME
                let ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of the organisation ${data.NAME}.`;
                dbm.saveLog({
                    SOURCE_ID: req.body.ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "organisation",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({ "code": 200,  "message": "Vendor information updated successfully..." });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};
