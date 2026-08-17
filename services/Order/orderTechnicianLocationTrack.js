const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var orderTechnicianLocationTrack = "order_technician_location_track";
var viewOrderTechnicianLocationTrack = "view_" + orderTechnicianLocationTrack;
// Conversion Done  

function reqData(req) {
    var data = {
        ORDER_ID: req.body.ORDER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        LOCATION_LAT: req.body.LOCATION_LAT,
        LOCATION_LONG: req.body.LOCATION_LONG,
        DATE_TIME: req.body.DATE_TIME,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID').isInt().optional(),
        body('JOB_CARD_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('LOCATION_LAT').optional(),
        body('LOCATION_LONG').optional(),
        body('DATE_TIME').optional(),
        body('STATUS').optional(),
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
            mm.executeQueryData(setContext + ` CALL sp_get_order_technician_location_track(); `, [], supportKey, (error, results) => {

                if (error) {
                    res.send({
                        code: 400,
                        message: "Failed to get orderTechnicianLocationTrack information."
                    });
                }
                else {

                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];

                    res.send({
                        code: 200,
                        message: "success",
                        TAB_ID: 75,
                        count: countResult[0] ? countResult[0].cnt : 0,
                        data: dataResult
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
    }
    catch (error) {
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
            mm.executeQueryData(`CALL sp_create_order_technician_location_track(?,?,?,?,?,?,?,?)`,
                [
                    data.ORDER_ID,
                    data.JOB_CARD_ID,
                    data.TECHNICIAN_ID,
                    data.LOCATION_LAT,
                    data.LOCATION_LONG,
                    data.DATE_TIME,
                    data.STATUS,
                    data.CLIENT_ID
                ], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save orderTechnicianLocationTrack information..."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new order technician location track.`;

                        var logCategory = "order technician Location Track";

                        let actionLog = {
                            "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        dbm.saveLog(actionLog, systemLog)
                        res.send({
                            "code": 200,
                            "message": "OrderTechnicianLocationTrack information saved successfully...",
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
    Object.keys(data).forEach(key => {
        data[key] ? setData += `${key}= ? , ` : true;
        data[key] ? recordData.push(data[key]) : true;
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_update_order_technician_location_track(?,?,?,?,?,?,?,?,?,?)`,
                [
                    criteria.ID,
                    data.ORDER_ID,
                    data.JOB_CARD_ID,
                    data.TECHNICIAN_ID,
                    data.LOCATION_LAT,
                    data.LOCATION_LONG,
                    data.DATE_TIME,
                    data.STATUS,
                    data.CLIENT_ID,
                    systemDate
                ], supportKey, (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update orderTechnicianLocationTrack information."
                        });
                    }
                    else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of order technician location track.`;


                        var logCategory = "order technician Location Track";

                        let actionLog = {
                            "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        dbm.saveLog(actionLog, systemLog)
                        res.send({
                            "code": 200,
                            "message": "OrderTechnicianLocationTrack information saved successfully...",
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