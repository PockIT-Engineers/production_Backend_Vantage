const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var customerSlaMaster = "customer_sla_master";
var viewcustomerSlaMaster = "view_" + customerSlaMaster;

function reqData(req) {

    var data = {
        SLA_NAME: req.body.SLA_NAME,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        START_DATE: req.body.START_DATE,
        END_DATE: req.body.END_DATE,
        STATUS: req.body.STATUS ? '1' : '0',
        DESCRIPTION: req.body.DESCRIPTION,
        DOCUMENT_PATH: req.body.DOCUMENT_PATH,
        CLIENT_ID: req.body.CLIENT_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('SLA_NAME').optional(),
        body('CUSTOMER_ID').optional(),
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
        return res.status(400).json({
            "code": 400,
             "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext+`CALL sp_customerSlaMaster_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to get customer SLA information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 209,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerSlaMaster_create(?,?,?,?,?,?,?,?,?,?)`,
            [
                data.SLA_NAME,
                data.CUSTOMER_ID,
                data.START_DATE,
                data.END_DATE,
                data.STATUS,
                data.DESCRIPTION,
                data.DOCUMENT_PATH,
                data.CLIENT_ID,
                data.SHORT_CODE,
                data.COUNTER_NO
            ],
            supportKey,
            (error,results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to save customer SLA information."
                    });
                }

                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customerSla ${data.NAME}`;
                var logCategory = "customerSla"

                let actionLog = {
                    "SOURCE_ID": results[0][0].ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                res.send({
                    "code": 200,
                    "message": "customerSla information saved successfully...",
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const id = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerSlaMaster_update(?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.SLA_NAME,
                data.CUSTOMER_ID,
                data.START_DATE,
                data.END_DATE,
                data.STATUS,
                data.DESCRIPTION,
                data.DOCUMENT_PATH,
                data.CLIENT_ID,
                data.SHORT_CODE,
                data.COUNTER_NO
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": error.sqlMessage || "Failed to update customer SLA."
                    });
                }

                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of the customerSla ${data.NAME}`;
                var logCategory = "customerSla"

                let actionLog = {
                    "SOURCE_ID": id, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                res.send({
                    "code": 200,
                    "message": "customerSla information updated successfully...",
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};
