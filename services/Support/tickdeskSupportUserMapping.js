const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var tickdeskSupportUserMapping = "tickdesk_support_user_mapping";
var viewTickdeskSupportUserMapping = "view_" + tickdeskSupportUserMapping;

function reqData(req) {
    var data = {
        EMPLOYEE_ID: req.body.EMPLOYEE_ID,
        DEPARTMENT_ID: req.body.DEPARTMENT_ID,
        STATUS: req.body.STATUS,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('EMPLOYEE_ID').isInt(),
        body('DEPARTMENT_ID').isInt(),
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
            setContext + 'CALL sp_tickdeskSupportUserMapping_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 167,
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ "code": 422,  "message": errors.errors });

    const { EMPLOYEE_ID, DEPARTMENT_ID, STATUS, CLIENT_ID } = req.body;
    const supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(`CALL sp_tickdeskSupportUserMapping_create(?, ?, ?, ?)`,
            [EMPLOYEE_ID, DEPARTMENT_ID, STATUS, CLIENT_ID],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({  "message": "Failed to create mapping." });
                }
                res.status(200).json({
                    "code": 200,
                     "message": "Mapping created successfully.",
                    NEW_ID: results[0][0].NEW_ID
                });
            });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ "code": 422,  "message": errors.errors });

    const { ID, EMPLOYEE_ID, DEPARTMENT_ID, STATUS, CLIENT_ID } = req.body;
    const supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(`CALL sp_tickdeskSupportUserMapping_update(?, ?, ?, ?, ?)`,
            [ID, EMPLOYEE_ID, DEPARTMENT_ID, STATUS, CLIENT_ID],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({"code":400,  "message": "Failed to update mapping." });
                }
                res.status(200).json({
                    "code": 200,
                     "message": "Mapping updated successfully.",
                    ROWS_AFFECTED: results[0][0].ROWS_AFFECTED
                });
            });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.addBulk = async (req, res) => {
    try {
        const supportKey = req.headers['supportkey'];
        const data = req.body.data;
        const EMPLOYEE_ID = req.body.EMPLOYEE_ID;

        if (!EMPLOYEE_ID || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                "code":400,
                 "message": "EMPLOYEE_ID or data parameter missing"
            });
        }

        mm.executeQueryData(
            'CALL sp_tickdeskSupportUserMapping_addBulk(?, ?)',
            [EMPLOYEE_ID, JSON.stringify(data)],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code":400,
                         "message": "Failed to save tickdeskSupportUser details"
                    });
                }

                res.status(200).json({
                    "code":200,
                     "message": "tickdeskSupportUser details added successfully"
                });
            }
        );

    } catch (error) {
        console.log(error);
        res.status(500).json({
            "code":500,
             "message": "Something went wrong"
        });
    }
};

