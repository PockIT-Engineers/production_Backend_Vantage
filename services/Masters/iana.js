const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var ianaMaster = "iana_master";
var viewianaMaster = "view_" + ianaMaster;

function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        SEQUENCE_NO: req.body.SEQUENCE_NO,
        STATUS: req.body.STATUS ? '1' : '0',
        SHORT_CODE: req.body.SHORT_CODE,
        CLIENT_ID: req.body.CLIENT_ID,
        TITLE: req.body.TITLE,
    };

    return data;
}

exports.validate = function () {
    return [
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
        return res.status(400).json({"code":400,  "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext+`CALL sp_iana_master_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({"code":400,  "message": "Failed to get ianaMaster information." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 218,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({"code":500,  "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_iana_master_create(?,?,?,?,?,?)`,
            [
                data.NAME,
                data.SEQUENCE_NO,
                data.STATUS,
                data.SHORT_CODE,
                data.CLIENT_ID,
                data.TITLE
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({"code":400,  "message": "Failed to save ianaMaster information..." });
                }

                const code = result[0][0].code;
                if (code !== 200) {
                    return res.send({
                        code,
                         "message":
                            code === 304 ? "Sequence No Already Exist" :
                            code === 301 ? "Time Zone Already Exist" :
                            "Short Code Already Exist"
                    });
                }

                res.status(200).json({
                    "code": 200,
                     "message": "ianaMaster information saved successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({"code":500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_iana_master_update(?,?,?,?,?,?,?)`,
            [
                ID,
                data.NAME,
                data.SEQUENCE_NO,
                data.STATUS,
                data.SHORT_CODE,
                data.CLIENT_ID,
                data.TITLE
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({  "message": "Failed to update ianaMaster information." });
                }

                const code = result[0][0].code;
                if (code !== 200) {
                    return res.send({
                        code,
                         "message":
                            code === 304 ? "Sequence No Already Exist" :
                            code === 301 ? "Time Zone Already Exist" :
                            "Short Code Already Exist"
                    });
                }

                res.status(200).json({
                    "code": 200,
                     "message": "ianaMaster information updated successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({"code":500,  "message": "Something went wrong." });
    }
};