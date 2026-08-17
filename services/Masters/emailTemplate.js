const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var emailTemplateMaster = "email_template_master";
var viewEmailTemplateMaster = "view_" + emailTemplateMaster;


function reqData(req) {
    var data = {
        TEMPLATE_NAME: req.body.TEMPLATE_NAME,
        SUBJECT: req.body.SUBJECT,
        BODY: req.body.BODY,
        ATTACHMENTS: req.body.ATTACHMENTS,
        PLACEHOLDERS: req.body.PLACEHOLDERS,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        TEMPLATE_STATUS: req.body.TEMPLATE_STATUS,
        SHORT_CODE: req.body.LANGUAGE_CODE,
        TEMPLATE_CATEGORY_ID: req.body.TEMPLATE_CATEGORY_ID,
        BODY_VALUES: req.body.BODY_VALUES,
        DESCRIPTION: req.body.DESCRIPTION,
        SUBJECT_VALUES: req.body.SUBJECT_VALUES,
    }
    return data;
}

exports.validate = function () {
    return [
        body('TEMPLATE_NAME').optional(),
        body('SUBJECT').optional(),
        body('BODY').optional(),
        body('ATTACHMENTS').optional(),
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
            setContext+`CALL sp_email_template_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400,  "message": "Failed to get emailTemplate information." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 26,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_email_template_create(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.TEMPLATE_NAME,
                data.SUBJECT,
                data.BODY,
                data.ATTACHMENTS,
                data.PLACEHOLDERS,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                data.TEMPLATE_STATUS,
                data.LANGUAGE_CODE,
                data.TEMPLATE_CATEGORY_ID,
                data.BODY_VALUES,
                data.DESCRIPTION,
                data.SUBJECT_VALUES
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400,  "message": "Failed to save emailTemplate information..." });
                }

                const r = result[0][0];

                dbm.saveLog({
                    SOURCE_ID: r.ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} has created new email template , ${data.TEMPLATE_NAME}.`,
                    CATEGORY: "Email Template",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({ "code": 200,  "message": "EmailTemplate information saved successfully..." });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!errors.isEmpty()) {
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_email_template_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.TEMPLATE_NAME,
                data.SUBJECT,
                data.BODY,
                data.ATTACHMENTS,
                data.PLACEHOLDERS,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                data.TEMPLATE_STATUS,
                data.LANGUAGE_CODE,
                data.TEMPLATE_CATEGORY_ID,
                data.BODY_VALUES,
                data.DESCRIPTION,
                data.SUBJECT_VALUES
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400,  "message": "Failed to update emailTemplate information." });
                }

                dbm.saveLog({
                    SOURCE_ID: ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} has updated details of email template , ${data.TEMPLATE_NAME}.`,
                    CATEGORY: "Email Template",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({ "code": 200,  "message": "EmailTemplate information updated successfully..." });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};