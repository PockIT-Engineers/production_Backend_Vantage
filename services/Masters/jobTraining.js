const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var jobTrainingMaster = "job_training_master";
var viewJobTrainingMaster = "view_" + jobTrainingMaster;

function reqData(req) {
    var data = {
        CATEGORY_ID: req.body.CATEGORY_ID,
        SUBCATEGORY_ID: req.body.SUBCATEGORY_ID,
        TITLE: req.body.TITLE,
        DESCRIPTION: req.body.DESCRIPTION,
        LINK: req.body.LINK,
        STATUS: req.body.STATUS ? '1' : '0',
        SERVICE_ID: req.body.SERVICE_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        SOURCE_TYPE: req.body.SOURCE_TYPE,
        DOC_URL: req.body.DOC_URL

    }
    return data;
}

exports.validate = function () {
    return [
        body('CATEGORY_ID').isInt(),
        body('SUBCATEGORY_ID').isInt(),
        body('TITLE', ' parameter missing').exists(),
        body('DESCRIPTION', ' parameter missing').exists(),
        body('LINK', ' parameter missing').optional(),
        body('SERVICE_ID').isInt(), body('ID').optional(),
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
            setContext+`CALL sp_job_training_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({"code":400,  "message": "Failed to get jobTraining information." });
                }

               const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 177,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({"code":500,  "message": "Something went wrong." });
    }
};

exports.getTrainingServices = (req, res) => {

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
           setContext+ `CALL sp_job_training_services_Get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({"code":400,  "message": "Failed to get Service information." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 16,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({"code":500,  "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({"code":422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_job_training_create(?,?,?,?,?,?,?,?,?,?)`,
            [
                data.CATEGORY_ID,
                data.SUBCATEGORY_ID,
                data.TITLE,
                data.DESCRIPTION,
                data.LINK,
                data.STATUS,
                data.SERVICE_ID,
                data.CLIENT_ID,
                data.SOURCE_TYPE,
                data.DOC_URL
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({"code":400,  "message": "Failed to save jobTraining information..." });
                }

                res.status(200).json({
                    "code":200,
                     "message": "JobTraining information saved successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({"code":500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({"code":422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_job_training_update(?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.CATEGORY_ID,
                data.SUBCATEGORY_ID,
                data.TITLE,
                data.DESCRIPTION,
                data.LINK,
                data.STATUS,
                data.SERVICE_ID,
                data.CLIENT_ID,
                data.SOURCE_TYPE,
                data.DOC_URL
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({"code":400,  "message": "Failed to update jobTraining information." });
                }

                res.status(200).json({
                    "code":200,
                     "message": "JobTraining information updated successfully..."
                });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({"code":500,  "message": "Something went wrong." });
    }
};
