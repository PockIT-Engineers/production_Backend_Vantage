const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
var csdTable = "customer_Support_Document";
var viewCsdTable = "view_" + csdTable;
const systemLog = require("../../modules/systemLog")

function reqData(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        DOCUMENT_NAME: req.body.DOCUMENT_NAME,
        STATUS: req.body.STATUS ? '1' : '0',
        DOCUMENT_URL: req.body.DOCUMENT_URL,
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('DOCUMENT_NAME').optional(),
        body('STATUS').optional(),
        body('DOCUMENT_URL').optional(),
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
        return res.send({ "code": 400,  "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext+`CALL sp_customerDocument_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error",error)
                    return res.send({ "code": 400,  "message": "Failed to get data." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 207,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.send({ "code": 500,  "message": "Something went wrong." });
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
            `CALL sp_customerDocument_create(?,?,?,?)`,
            [
                data.CUSTOMER_ID,
                data.DOCUMENT_NAME,
                data.DOCUMENT_URL,
                data.STATUS
            ],
            supportKey,
            (error, result) => {
                if (error) 
                    {
                        console.log("error", error);
                        return res.send({ "code": 400,  "message": "Failed to save data." });
                    }

                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer support document, ${data.DOCUMENT_NAME}.`;
                var logCategory = "customerSupportDocument"
                let actionLog = {
                    "SOURCE_ID": result[0][0].ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                res.send({
                    "code": 200,
                    "message": "Customer support document information saved successfully...",
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_customerDocument_update(?,?,?,?,?)`,
            [
                req.body.ID,
                data.CUSTOMER_ID,
                data.DOCUMENT_NAME,
                data.DOCUMENT_URL,
                data.STATUS
            ],
            supportKey,
            (error, result) => {

                if (error) {
                    console.log("error", error);
                    return res.send({ "code": 400,  "message": "Failed to update data." });
                }

                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the customer support document ${data.DOCUMENT_NAME}.`;
                var logCategory = "customerSupportDocument"

                let actionLog = {
                    "SOURCE_ID": req.body.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                res.send({
                    "code": 200,
                    "message": "Customer support document information updated successfully...",
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};
