const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var departmentMaster = "department_master";
var viewDepartmentMaster = "view_" + departmentMaster;

function reqData(req) {
    var data = {
        ORG_ID: req.body.ORG_ID,
        NAME: req.body.NAME,
        SHORT_CODE: req.body.SHORT_CODE,
        STATUS: req.body.STATUS ? '1' : '0',
        SEQUENCE_NO: req.body.SEQUENCE_NO,
        CLIENT_ID: req.body.CLIENT_ID,
        TICKET_TIME_PERIOD: req.body.TICKET_TIME_PERIOD,
        TYPE: req.body.TYPE
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORG_ID').isInt(),
        body('NAME', ' parameter missing').exists(),
        body('SHORT_CODE', ' parameter missing').exists(),
        body('SEQUENCE_NO', ' parameter missing').exists(),
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
            setContext + 'CALL sp_departmentMaster_get()',
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
                    "TAB_ID": 175,
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

exports.create = async (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            'CALL sp_department_create(?,?,?,?,?,?,?,?)',
            [
                data.ORG_ID,
                data.NAME,
                data.SHORT_CODE,
                data.STATUS ? 1 : 0,
                data.SEQUENCE_NO,
                data.CLIENT_ID,
                data.TICKET_TIME_PERIOD,
                data.TYPE
            ],
            supportKey,
            (error, results) => {
                if (error) {
                   console.log("error",error)
                    return res.status(400).json({
                        "code": 400,
                         "message": 'Failed to save department information'
                    });
                }

                 else
                {
                    return res.status(200).json({"code":200,  "message": 'department information saved successfully...' });
                }
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({"code":200,  "message": 'Something went wrong' });
    }
};

exports.update = async (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            'CALL sp_department_update(?,?,?,?,?,?,?,?,?)',
            [
                req.body.ID,
                data.ORG_ID,
                data.NAME,
                data.SHORT_CODE,
                data.STATUS ? 1 : 0,
                data.SEQUENCE_NO,
                data.CLIENT_ID,
                data.TICKET_TIME_PERIOD,
                data.TYPE
            ],
            supportKey,
            (error, results) => {
                if (error) {
                     console.log("error",error)
                    return res.status(400).json({
                        "code": 400,
                         "message": 'Failed to updatse department information'
                    });
                }
 else
                {
                    return res.status(200).json({"code":200,  "message": 'department information updated successfully...' });
                }
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({"code":500,  "message": 'Something went wrong' });
    }
};
