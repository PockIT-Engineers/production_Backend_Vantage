const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var orderMasterAddressMap = "order_master_address_map";
var viewOrderMasterAddressMap = "view_" + orderMasterAddressMap;
// Conversion Done 

function reqData(req) {
    var data = {
        ORDER_ID: req.body.ORDER_ID,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE_2: req.body.ADDRESS_LINE_2,
        CITY_ID: req.body.CITY_ID,
        STATE_ID: req.body.STATE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        LATITUDE: req.body.LATITUDE,
        LONGITUDE: req.body.LONGITUDE,
        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID').isInt().optional(),
        body('ADDRESS_LINE_1').optional(),
        body('ADDRESS_LINE_2').optional(),
        body('CITY_ID').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('PINCODE_ID').isInt().optional(),
        body('LATITUDE').optional(),
        body('LONGITUDE').optional(),
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

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(setContext + ` CALL sp_get_order_master_address_map(); `, [], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderMasterAddressMap information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];

                    res.send({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 68,
                        "count": countResult[0] ? countResult[0].cnt : 0,
                        "data": dataResult
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        })
    }

}


exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_create_order_master_address_map(?,?,?,?,?,?,?,?,?,?)`, [data.ORDER_ID, data.ADDRESS_LINE_1, data.ADDRESS_LINE_2, data.CITY_ID, data.STATE_ID, data.COUNTRY_ID, data.PINCODE_ID, data.LATITUDE, data.LONGITUDE, data.CLIENT_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderMasterAddressMap information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped new address.`;
                    var logCategory = "order master address map";
                    let actionLog = {
                        "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "OrderMasterAddressMap information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_update_order_master_address_map(?,?,?,?,?,?,?,?,?,?,?,?)`, [criteria.ID, data.ORDER_ID, data.ADDRESS_LINE_1, data.ADDRESS_LINE_2, data.CITY_ID, data.STATE_ID, data.COUNTRY_ID, data.PINCODE_ID, data.LATITUDE, data.LONGITUDE, data.CLIENT_ID, systemDate], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update orderMasterAddressMap information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of order address.`;
                    var logCategory = "order master address map";
                    let actionLog = {
                        "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "OrderMasterAddressMap information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
        }
    }
}