const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const request = require('request');

const applicationkey = process.env.APPLICATION_KEY;

var shiprocketLoginInfo = "shiprocket_login_info";
var viewShiprocketLoginInfo = "view_" + shiprocketLoginInfo;


function reqData(req) {

    var data = {
        COMPANY_ID: req.body.COMPANY_ID,
        CREATED_AT: req.body.CREATED_AT,
        EMAIL: req.body.EMAIL,
        FIRST_NAME: req.body.FIRST_NAME,
        SHIPROCKET_ID: req.body.SHIPROCKET_ID,
        LAST_NAME: req.body.LAST_NAME,
        TOKEN: req.body.TOKEN,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('COMPANY_ID').optional(), 
        body('CREATED_AT').optional(), 
        body('EMAIL').optional(), 
        body('FIRST_NAME	').optional(), 
        body('SHIPROCKET_ID	').isInt().optional(), 
        body('LAST_NAME	').optional(), 
        body('TOKEN	').optional(), body('ID').optional(),
    ]
}

exports.get = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {

        if (IS_FILTER_WRONG == "0") {

            filter = filter.replace(/'/g, "''");

            const setContext = `
SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
                SET @v_SORT_KEY = '${sortKey}';
                SET @v_SORT_VALUE = '${sortValue}';
                SET @v_FILTER = '${filter}';
            `;

            mm.executeQueryData(
                setContext + ` CALL sp_shiprocketLoginInfo_get(); `,
                [],
                supportKey,
                (error, results) => {

                    if (error) {
                        console.log("error",error)
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                            code: 400,
                            message: "Failed to get information."
                        });
                    }

                    const resultSets = results.filter(r => Array.isArray(r) && r.length);

                    const count = resultSets[0]?.[0]?.cnt || 0;
                    const data = resultSets[1] || [];

                    res.status(200).json({
                        "code": 200,
                        message: "success",
                        TAB_ID: 1,
                        count: count,
                        data: data
                    });

                }
            );

        } else {

            res.status(400).json({
                code: 400,
                message: "Invalid filter parameter."
            });

        }

    } catch (error) {
        console.log("error",error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            `CALL sp_shiprocketLoginInfo_create(?,?,?,?,?,?,?,?)`,
            [
                data.COMPANY_ID,
                data.CREATED_AT,
                data.EMAIL,
                data.FIRST_NAME,
                data.SHIPROCKET_ID,
                data.LAST_NAME,
                data.TOKEN,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to save shiprocketLoginInfo information..."
                    });
                }

                res.status(200).json({
                    code: 200,
                    message: "ShiprocketLoginInfo information saved successfully..."
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
            message: "Something went wrong."
        });
    }
};

exports.update = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            `CALL sp_shiprocketLoginInfo_update(?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.COMPANY_ID,
                data.CREATED_AT,
                data.EMAIL,
                data.FIRST_NAME,
                data.SHIPROCKET_ID,
                data.LAST_NAME,
                data.TOKEN,
                data.CLIENT_ID,
                systemDate
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to update shiprocketLoginInfo information."
                    });
                }

                res.status(200).json({
                    code: 200,
                    message: "ShiprocketLoginInfo information updated successfully..."
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
            message: "Something went wrong."
        });
    }
};


exports.createToken = (supportKey, callback) => {

    const systemDate = mm.getSystemDate().split(" ")[0];

    try {

        // Step 1: Check Existing Token
        mm.executeQueryData(
            `CALL sp_shiprocketLoginInfo_gettoken(?)`,
            [systemDate],
            supportKey,
            async (error, results) => {

                if (error) {
                    return callback(error, null);
                }

                // If token exists
                if (results[0].length > 0) {
                    return callback(null, results[0][0].TOKEN);
                }

                // Step 2: Call Shiprocket Login API
                const options = {
                    url: 'https://apiv2.shiprocket.in/v1/external/auth/login',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: {
                        email: "developer@pockitengineers.com",
                        password: "RcPRNX8lg9STtRl^"
                    },
                    method: "post",
                    json: true
                };

                request(options, (error, response, body) => {

                    if (error) {
                        return callback(error, null);
                    }

                    // Step 3: Insert New Token using SP
                    mm.executeQueryData(
                        `CALL sp_shiprocket_create(?,?,?,?,?,?,?,?)`,
                        [
                            body.company_id,
                            body.created_at,
                            body.email,
                            body.first_name,
                            body.id,
                            body.last_name,
                            body.token,
                            1
                        ],
                        supportKey,
                        (error, results) => {

                            if (error) {
                                return callback(error, null);
                            }

                            return callback(null, body.token);
                        }
                    );

                });

            }
        );

    } catch (error) {
        return callback(error, null);
    }
};

