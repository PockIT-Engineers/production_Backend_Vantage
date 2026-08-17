const mm = require('../../utilities/globalModule');
const logger = require('../../utilities/logger');
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require('../../modules/systemLog');
const changeLogsTable = 'customer_holiday_change_logs';
const viewChangeLogs = 'view_' + changeLogsTable;

function reqData(req) {
    return {
        CHANGED_BY: req.body.CHANGED_BY,
        DATE_TIME: req.body.DATE_TIME,
        USER_ID: req.body.USER_ID,
        OLD_DATA: JSON.stringify(req.body.OLD_DATA),
        NEW_DATA: JSON.stringify(req.body.NEW_DATA),
        CLIENT_ID: req.body.CLIENT_ID
    };
}

exports.validate = function () {
    return [
        body('CHANGED_BY').isString().optional(),
        body('USER_ID').isInt().notEmpty(),
        body('OLD_DATA').optional(),
        body('NEW_DATA').optional(),
        body('CLIENT_ID').isInt().notEmpty()
    ];
};


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
            setContext+`CALL sp_customerHolidayChangeLogs_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to get change logs." });
                }

                 const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 227,
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
            `CALL sp_customerHolidayChangeLogs_create(?,?,?,?,?,?)`,
            [
                data.DATE_TIME,
                data.CHANGED_BY,
                data.USER_ID,
                data.OLD_DATA,
                data.NEW_DATA,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to save change log." });
                }

                const actionLog = {
                    "SOURCE_ID": result[0][0].CHANGE_LOG_ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": `User ${req.body.authData.data.UserData[0].NAME} created a customer holiday change log.`,
                    "CATEGORY": "customer_holiday_change_log",
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID
                };
                dbm.saveLog(actionLog, systemLog);
                res.send({ "code": 200,  "message": "Customer holiday change log created successfully." });
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
            `CALL sp_customerHolidayChangeLogs_update(?,?,?,?,?,?,?)`,
            [
                id,
                data.DATE_TIME,
                data.CHANGED_BY,
                data.USER_ID,
                data.OLD_DATA,
                data.NEW_DATA,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to update change log." });
                }
                const actionLog = {
                    "SOURCE_ID": id,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": `User ${req.body.authData.data.UserData[0].NAME} updated a customer holiday change log.`,
                    "CATEGORY": "customer_holiday_change_log",
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID
                };
                dbm.saveLog(actionLog, systemLog);
                res.send({ "code": 200,  "message": "Customer holiday change log updated successfully." });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.delete = (req, res) => {
    const supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(
            `CALL sp_customerHolidayChangeLogs_delete(?)`,
            [req.body.ID],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to delete change log." });
                }

                const actionLog = {
                    "SOURCE_ID": req.body.ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": `User ${req.body.authData.data.UserData[0].NAME} deleted a customer holiday change log.`,
                    "CATEGORY": "customer_holiday_change_log",
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID
                };
                dbm.saveLog(actionLog, systemLog);
                res.send({ "code": 200,  "message": "Customer holiday change log deleted successfully." });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};
