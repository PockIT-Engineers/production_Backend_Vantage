const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var taxMaster = "tax_master";
var viewTaxMaster = "view_" + taxMaster;

function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        COUNTRY_ID: req.body.COUNTRY_ID,
        IGST: req.body.IGST,
        SGST: req.body.SGST,
        CGST: req.body.CGST,
        CESS: req.body.CESS,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        SHORT_CODE: req.body.SHORT_CODE,
        CLIENT_ID: req.body.CLIENT_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('SHORT_CODE').optional(),
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
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext+`CALL sp_taxMaster_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get taxMaster count.",
                        });
                    }
                    else {
                         const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 105,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
                    }
                }
            );
        }
        else {
            res.status(400).json({
                "code": 400,
                 "message": "Invalid filter parameter."
            });
        }
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

// Create tax using stored procedure
exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(errors.errors)}`, applicationkey);
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';
        
        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_taxMaster_create(?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.COUNTRY_ID,
                data.IGST,
                data.SGST,
                data.CGST,
                data.CESS,
                data.IS_ACTIVE,
                data.SHORT_CODE,
                data.CLIENT_ID,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to save tax information..."
                    });
                }
                
                const resultData = results[0][0];
                if (resultData.code === 300) {
                    return res.status(200).json({
                        "code": 300,
                         "message": resultData.message
                    });
                }
                
                // Save Action Log
                const ACTION_DETAILS = `User ${userName} has created a new tax ${data.NAME}`;
                const logCategory = "Tax";

                const actionLog = {
                    SOURCE_ID: resultData.TAX_ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: logCategory,
                    CLIENT_ID: 1,
                    USER_ID: userId,
                    supportKey: 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                return res.status(200).json({
                    "code": 200,
                     "message": "Tax information saved successfully...",
                    TAX_ID: resultData.TAX_ID
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        return res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

// Update tax using stored procedure
exports.update = (req, res) => {
    const errors = validationResult(req);
    let data = reqData(req);
    const supportKey = req.headers['supportkey'];
    const id = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(errors.errors)}`, applicationkey);
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';
        
        // Clean up data - remove undefined/null/empty values
        Object.keys(data).forEach(key => {
            if (data[key] === undefined || data[key] === null || data[key] === '') {
                delete data[key];
            }
        });
        
        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_taxMaster_update(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.NAME || null,
                data.COUNTRY_ID || null,
                data.IGST || null,
                data.SGST || null,
                data.CGST || null,
                data.CESS || null,
                data.IS_ACTIVE || null,
                data.SHORT_CODE || null,
                data.CLIENT_ID || null,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to update tax information."
                    });
                }
                
                const resultData = results[0][0];
                if (resultData.code === 300) {
                    return res.status(200).json({
                        "code": 300,
                         "message": resultData.message
                    });
                }
                
                // Action log
                const ACTION_DETAILS = `User ${userName} has updated details of the tax ${data.NAME || 'unknown'}`;
                const logCategory = "Tax";

                const actionLog = {
                    SOURCE_ID: id,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: logCategory,
                    CLIENT_ID: 1,
                    USER_ID: userId,
                    supportKey: 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                return res.status(200).json({
                    "code": 200,
                     "message": "Tax information updated successfully...",
                    TAX_ID: resultData.TAX_ID
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        return res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};