const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var dashboardMaster = "dashboard_master";
var viewdashboardMaster = "view_" + dashboardMaster;

function reqData(req) {
    var data = {
        TITLE: req.body.TITLE,
        SNAPSHOT_LINK: req.body.SNAPSHOT_LINK,
        STATUS: req.body.STATUS  ? '1' : '0',
        ROLE_ID: req.body.ROLE_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TITLE', ' parameter missing').exists(),
        body('ROLE_ID', ' parameter missing').exists(),
        body('SNAPSHOT_LINK').exists(), body('ID').optional(),
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
        return res.status(400).json({  "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext+`CALL sp_dashboard_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({"code":400,  "message": "Failed to get dashboard data." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 179,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("catch error", error);
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
            `CALL sp_dashboard_create(?,?,?,?,?)`,
            [
                data.TITLE,
                data.SNAPSHOT_LINK,
                data.STATUS,
                data.ROLE_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({"code":400,  "message": "Failed to save dashboard." });
                }

                res.status(200).json({ "code":200,  "message": "Dashboard saved successfully..." });
            }
        );
    } catch (error) {
        console.log("catch error", error);
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
            `CALL sp_dashboard_update(?,?,?,?,?,?)`,
            [
                ID,
                data.TITLE,
                data.SNAPSHOT_LINK,
                data.STATUS,
                data.ROLE_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({"code":400,  "message": "Failed to update dashboard." });
                }

                res.status(200).json({"code":200,  "message": "Dashboard updated successfully..." });
            }
        );
    } catch (error) {
        console.log("catch error", error);
        res.status(500).json({"code":500,  "message": "Something went wrong." });
    }
};

exports.getList = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const ID = req.params.id;

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_ID = ${ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            "code":400,
             "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext+`CALL sp_dashboard_getById()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        "code":400,
                         "message": "Failed to get dashboard information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 179,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        res.status(500).json({
            "code":500,
             "message": "Something went wrong."
        });
    }
};