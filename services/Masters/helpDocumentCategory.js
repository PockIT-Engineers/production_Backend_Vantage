const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var helpDocumentCategory = "help_document_category";
var viewHelpDocumentCategory = "view_" + helpDocumentCategory;

function reqData(req) {
    var data = {
        HELP_CATEGORY_NAME: req.body.HELP_CATEGORY_NAME,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('HELP_CATEGORY_NAME').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
    var supportKey = req.headers['supportkey'];
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
        if (IS_FILTER_WRONG == "0") {
            // Using stored procedure
            mm.executeQueryData(
                setContext + `CALL sp_helpDocumentCategory_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "message": "Failed to get helpDocumentCategory count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 181,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.status(400).json({
                 "message": "Invalid filter parameter.",
            });
        }
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
             "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        return res.status(422).json({
            "message": errors.errors
        });
    }

    try {
        // Get user information from auth data (if available)
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_helpDocumentCategory_create(?,?,?,?,?)`,
            [
                data.HELP_CATEGORY_NAME,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "message": "Failed to save helpDocumentCategory information..."
                    });
                }

                const resultData = results[0][0];
                if (resultData.code === 300) {
                    return res.status(400).json({
                        "code": 300,
                        "message": resultData.message
                    });
                }

                res.status(200).json({
                    "code": 200,
                    "message": "HelpDocumentCategory information saved successfully...",
                    "CATEGORY_ID": resultData.CATEGORY_ID
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
             "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var id = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        return res.status(422).json({
            "message": errors.errors
        });
    }

    try {
        // Get user information from auth data (if available)
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Clean up data - remove undefined/null values
        Object.keys(data).forEach(key => {
            if (data[key] === undefined || data[key] === null) {
                delete data[key];
            }
        });

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_helpDocumentCategory_update(?,?,?,?,?,?)`,
            [
                id,
                data.HELP_CATEGORY_NAME || null,
                data.IS_ACTIVE || null,
                data.CLIENT_ID || null,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "message": "Failed to update helpDocumentCategory information."
                    });
                }

                const resultData = results[0][0];
                if (resultData.code === 300) {
                    return res.status(400).json({
                        "code": 300,
                        "message": resultData.message
                    });
                }

                console.log("Update successful");
                res.status(200).json({
                    "message": "HelpDocumentCategory information updated successfully...",
                    "CATEGORY_ID": resultData.CATEGORY_ID
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
             "message": "Something went wrong."
        });
    }
};