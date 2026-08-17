const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var tickdeskDepartmentAdminMapping = "tickdesk_department_admin_mapping";
var viewTickdeskDepartmentAdminMapping = "view_" + tickdeskDepartmentAdminMapping;

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
            setContext + 'CALL sp_tickdeskDepartmentAdmin_get()',
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
                    "TAB_ID": 166,
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
    try {
        var data=reqData(req)
        const errors = validationResult(req);
        var supportKey = req.headers['supportkey'];

        if (!errors.isEmpty()) {
            return res.status(422).json({ "code": 422,  "message": errors.errors });
        }

        const {
            EMPLOYEE_ID,
            DEPARTMENT_ID,
            STATUS,
            CLIENT_ID
        } = req.body;

        mm.executeQueryData(
            `CALL sp_tickdeskDepartmentAdmin_create(?,?,?,?)`,
            [EMPLOYEE_ID, DEPARTMENT_ID, STATUS, CLIENT_ID],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to save tickdeskDepartmentAdminMapping information..."
                    });
                }

                res.status(200).json({
                    "code": 200,
                     "message": "TickdeskDepartmentAdminMapping information saved successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    try {
        var data=reqData(req)
        const errors = validationResult(req);
        var supportKey = req.headers['supportkey'];

        if (!errors.isEmpty()) {
            return res.status(422).json({ "code": 422,  "message": errors.errors });
        }
        
        const {
            ID
        } = req.body;

        mm.executeQueryData(
            `CALL sp_tickdeskDepartmentAdmin_update(?,?,?,?,?)`,
            [ID, data.EMPLOYEE_ID, data.DEPARTMENT_ID, data.STATUS , data.CLIENT_ID],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to update tickdeskDepartmentAdminMapping information."
                    });
                }

                res.status(200).json({
                    "code": 200,
                     "message": "TickdeskDepartmentAdminMapping information updated successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.addBulk = (req, res) => {
    try {
        const supportKey = req.headers['supportkey'];
        const EMPLOYEE_ID = req.body.EMPLOYEE_ID;
        const data = req.body.data;

        if (!EMPLOYEE_ID || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                "code":400,
                 "message": "EMPLOYEE_ID or data parameter missing"
            });
        }


        mm.executeQueryData(
            `CALL sp_tickdeskDepartmentAdmin_addBulk(?, ?)`,
            [EMPLOYEE_ID, JSON.stringify(data)],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code":400,
                         "message": "Failed to save tickdeskDepartmentAdmin details..."
                    });
                }

                res.status(200).json({
                    "code":200,
                     "message": "tickdeskDepartmentAdmin details added successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "code":500,
             "message": "Something went wrong."
        });
    }
};

