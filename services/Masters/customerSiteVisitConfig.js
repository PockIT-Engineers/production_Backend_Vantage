const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var customerSiteVisitConfig = "customer_site_visit_config";
var viewcustomerSiteVisitConfig = "view_" + customerSiteVisitConfig;

function reqData(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        TITLE: req.body.TITLE,
        LOGO: req.body.LOGO,
        EMAIL_ID: req.body.EMAIL_ID,
        DESCRIPTION: req.body.DESCRIPTION,
        TYPE: req.body.TYPE,
        CLIENT_ID: req.body.CLIENT_ID,
       
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().notEmpty(),
        body('TITLE').notEmpty(),
       // body('EMAIL_ID').isEmail().notEmpty(),
        body('CLIENT_ID').isInt().notEmpty(),
        body('ID').optional()
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
            setContext+`CALL sp_customerSiteVisitConfig_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error)
                {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to get data." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 228,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
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
            `CALL sp_customerSiteVisitConfig_create(?,?,?,?,?,?,?)`,
            [
                data.CUSTOMER_ID,
                data.TITLE,
                data.LOGO,
                data.EMAIL_ID,
                data.DESCRIPTION,
                data.TYPE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error)
                {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to save data." });
                }
                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created the new customer site visit config ${data.TITLE}.`;
                var logCategory = "customer_site_visit_config"

                let actionLog = {
                    "SOURCE_ID": results[0][0].ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": "987654327654"
                }
                res.status(200).json({
                    "code": 200,
                     "message": "Customer site visit config saved successfully."
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const id = req.body.ID;

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }
    try {
        mm.executeQueryData(
            `CALL sp_customerSiteVisitConfig_update(?,?,?,?,?,?,?,?)`,
            [
                id,
                data.CUSTOMER_ID,
                data.TITLE,
                data.LOGO,
                data.EMAIL_ID,
                data.DESCRIPTION,
                data.TYPE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": error.sqlMessage
                    });
                }

                const r = result[0][0];
                if (r.code == 404) {
                    return res.status(200).json(r);
                }
                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of the customer site visit config ${data.TITLE}.`;
                var logCategory = "customer_site_visit_config"

                let actionLog = {
                    "SOURCE_ID": id,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": "987654327654"
                }
                res.status(200).json({
                    "code": 200,
                    "message": "Customer site visit information updated successfully...",
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};
