const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
var customerHolidayMapping = "customer_holiday_mapping";
var viewcustomerHolidayMapping = "view_" + customerHolidayMapping;
const systemLog = require("../../modules/systemLog")
var customerHolidayChangeLogs = "customer_holiday_change_logs";


function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        DATE: req.body.DATE,
        REASON: req.body.REASON,
        IS_HOLIDAY: req.body.IS_HOLIDAY ? '1' : '0',
        STATUS: req.body.STATUS,
        CLIENT_ID: req.body.CLIENT_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('SEQ_NO').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
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
            setContext+`CALL sp_customer_holiday_mapping_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error)
                {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to get customer holiday mapping." });
                }

                 const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 211,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customer_holiday_mapping_create(?,?,?,?,?,?)`,
            [
                data.CUSTOMER_ID,
                data.DATE,
                data.REASON,
                data.IS_HOLIDAY,
                data.STATUS,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": "Failed to save customer holiday mapping." });
                }


                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customerHolidayMapping.`;
                var logCategory = "customerHolidayMapping"
                let actionLog = {
                    "SOURCE_ID": results[0][0].ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog);

                var changedBy = req.body.authData.data.UserData[0].ROLE || 'Admin';
                var newDataWithId = { ...data, ID: results[0][0].ID };

                saveChangeLog(
                    null,
                    newDataWithId,
                    req.body.authData.data.UserData[0].USER_ID,
                    changedBy,
                    data.CLIENT_ID || 1,
                    supportKey
                );

                res.send({
                    "code": 200,
                    "message": "customerHolidayMapping information saved successfully...",
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const id = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customer_holiday_mapping_update(?,?,?,?,?,?,?)`,
            [
                id,
                data.CUSTOMER_ID,
                data.DATE,
                data.REASON,
                data.IS_HOLIDAY,
                data.STATUS,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error)
                {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to update customer holiday mapping." });
                }

                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the customerHolidayMapping.`;
                var logCategory = "customerHolidayMapping"

                let actionLog = {
                    "SOURCE_ID": id,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog);

                var changedBy = req.body.authData.data.UserData[0].ROLE || 'Admin';
                var newDataWithId = { ...data, ID: id };

                saveChangeLog(
                    result[0][0].OLD_DATA,
                    newDataWithId,
                    req.body.authData.data.UserData[0].USER_ID,
                    changedBy,
                    data.CLIENT_ID || 1,
                    supportKey
                );

                res.send({
                    "code": 200,
                    "message": "customerHolidayMapping information updated successfully...",
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

function saveChangeLog(oldData, newData, userId, changedBy, clientId, supportKey, callback) {
    try {

        const OLD_DATA = oldData ? JSON.stringify(oldData) : null;
        const NEW_DATA = JSON.stringify(newData);
        const DATE_TIME = mm.getSystemDate();

        mm.executeQueryData(
            'CALL sp_customer_holiday_change_log_save(?,?,?,?,?,?)',
            [
                OLD_DATA,
                NEW_DATA,
                userId,
                changedBy,
                clientId,
                DATE_TIME
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log("Error saving change log:", error);
                    logger.error(
                        supportKey +
                        ' Error saving customer_holiday_change_logs: ' +
                        JSON.stringify(error),
                        applicationkey
                    );
                }

                if (callback) callback(error, results);
            }
        );

    } catch (error) {
        console.log("Exception in saveChangeLog:", error);
        if (callback) callback(error, null);
    }
}
