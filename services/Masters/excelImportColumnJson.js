const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var excelMaster = "excel_import_column_json";
var viewexcelMaster = "view_excel_import_column_json";


function reqData(req) {

    var data = {
        TABLE_NAME: req.body.TABLE_NAME,
        SEQUENCE_NO: req.body.SEQUENCE_NO,
        EXCEL_URL: req.body.EXCEL_URL,
        COLUMN_JSON: req.body.COLUMN_JSON,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }

    return data;
}

function reqExcelData(req) {
    var excelData = {
        TABLE_ID: req.body.TABLE,
        EXCEL_URL: EXCEL_URL,
        UPLOADED_DATE_TIME: UPLOADED_DATE_TIME,
        UPLOADED_BY: UPLOADED_BY,
        UPLOADED_USER_ID: UPLOADED_USER_ID,
        STATUS: STATUS,
        CLIENT_ID: CLIENT_ID
    }
    return excelData
}

exports.validate = function () {
    return [

        body('IMAGE_URL').optional(), body('SEQ_NO').isInt().optional(), body('SHOW_ID').isInt().optional(), body('ID').optional(),


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
    try {
        if (IS_FILTER_WRONG !== "0") {
            return res.status(400).json({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }


        mm.executeQueryData(
            setContext + 'CALL sp_excelImportColumnJson_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).send({ "code": 400, "message": 'Failed to fetch team' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 2,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.status(500).send({ "code": 500, "message": 'Something went wrong' });
    }
};

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_excelImportColumnJson_create(?,?,?,?,?,?)`,
                [
                    data.TABLE_NAME,
                    data.SEQUENCE_NO,
                    data.EXCEL_URL,
                    data.COLUMN_JSON,
                    data.STATUS,
                    data.CLIENT_ID
                ], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to save excelMaster information..."
                        });
                    }
                    else {
                        res.status(200).json({
                            "code": 200,
                            "message": "excelMaster information saved successfully...",
                        });
                    }
                });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_excelImportColumnJson_update(?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            data.TABLE_NAME,
            data.SEQUENCE_NO,
            data.EXCEL_URL,
            data.COLUMN_JSON,
            data.STATUS,
            data.CLIENT_ID
        ], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update excelMaster information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "excelMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                // "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}

exports.uploadExcelRecord = (req, res) => {

    var data = reqExcelData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_uploadExcelMaster(?,?,?,?,?)`,
                [
                    data.TABLE_ID,
                    data.EXCEL_URL,
                    data.UPLOADED_DATE_TIME,
                    data.STATUS,
                    data.CLIENT_ID
                ], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save excelMaster information..."
                    });
                }
                else {
                    console.log(results);
                    res.status(200).json({
                        "code": 200,
                        "message": "excelMaster information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "message": "Something went wrong."
            });
        }
    }
}