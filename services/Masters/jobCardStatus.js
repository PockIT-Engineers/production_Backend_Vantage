const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var jobCardStatusMaster = "job_card_status_master";
var viewJobCardStatusMaster = "view_" + jobCardStatusMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        ICON: req.body.ICON,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('ICON').optional(),
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
            setContext+`CALL sp_job_card_status_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        "code": 400,
                         "message": "Failed to get jobCardStatus information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 53,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_job_card_status_create(?,?,?,?,?)`,
            [
                data.NAME,
                data.DESCRIPTION,
                data.IS_ACTIVE,
                data.ICON,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({
                        "code": 400,
                         "message": "Failed to save jobCardStatus information..."
                    });
                }

                const ACTION_DETAILS =
                    `User ${req.body.authData.data.UserData[0].NAME} has created a new work order status ${data.NAME}.`;

                dbm.saveLog({
                    SOURCE_ID: result[0][0].ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "Job Card Status",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({
                    "code": 200,
                     "message": "JobCardStatus information saved successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_job_card_status_update(?,?,?,?,?,?)`,
            [
                ID,
                data.NAME,
                data.DESCRIPTION,
                data.IS_ACTIVE,
                data.ICON,
                data.CLIENT_ID
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({
                        "code": 400,
                         "message": "Failed to update jobCardStatus information."
                    });
                }

                const ACTION_DETAILS =
                    `User ${req.body.authData.data.UserData[0].NAME} has updated details of work order status ${data.NAME}.`;

                dbm.saveLog({
                    SOURCE_ID: ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "Job Card Status",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({
                    "code": 200,
                     "message": "JobCardStatus information saved successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};