const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var technicianLocationTrack = "technician_location_track";
var viewTechnicianLocationTrack = "view_" + technicianLocationTrack;

// Conversion Done / 
function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        LOCATION_LATITUDE: req.body.LOCATION_LATITUDE,
        LOCATION_LONG: req.body.LOCATION_LONG,
        DATE_TIME: req.body.DATE_TIME,
        ORDER_ID: req.body.ORDER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        SERVICE_ID: req.body.SERVICE_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('LOCATION_LATITUDE').optional(),
        body('LOCATION_LONG').optional(),
        body('DATE_TIME').optional(),
        body('ORDER_ID').optional(),
        body('JOB_CARD_ID').optional(),
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
            mm.executeQueryData(setContext + ` CALL sp_get_technician_location_track(); `, [], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianLocationTrack information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const countResult = resultSets[0] || [];
                    const dataResult = resultSets[1] || [];
                    res.send({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 113,
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
            });
        }
    }
    catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        });
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
            mm.executeQueryData(`CALL sp_create_technician_location_track(?,?,?,?,?,?,?,?)`, [data.TECHNICIAN_ID, data.LOCATION_LATITUDE, data.LOCATION_LONG, data.DATE_TIME, data.ORDER_ID, data.JOB_CARD_ID, data.CLIENT_ID, data.SERVICE_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save technicianLocationTrack information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "TechnicianLocationTrack information saved successfully..."
                    });
                }
            });
        }
        catch (error) {
            console.log(error);
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            res.send({
                code: 500,
                message: "Something Went Wrong."
            });
        }
    }
}


exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_update_technician_location_track(?,?,?,?,?,?,?,?,?)`, [req.body.ID, data.TECHNICIAN_ID, data.LOCATION_LATITUDE, data.LOCATION_LONG, data.DATE_TIME, data.ORDER_ID, data.JOB_CARD_ID, data.CLIENT_ID, data.SERVICE_ID, systemDate], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to update technicianLocationTrack information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "TechnicianLocationTrack information updated successfully..."
                    });
                }
            });
        }
        catch (error) {
            console.log(error);
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            res.send({
                code: 500,
                message: "Something Went Wrong."
            });
        }
    }
}


exports.getTechnicianLocations = (req, res) => {

    let PINCODE_ID = req.body.PINCODE_ID ? req.body.PINCODE_ID : [];
    let SKILL_ID = req.body.SKILL_ID ? req.body.SKILL_ID : '';
    let TYPE = req.body.TYPE ? req.body.TYPE : '';
    let EXPERIANCE = req.body.EXPERIANCE ? req.body.EXPERIANCE : '';
    let LOGITUDE = req.body.LOGITUDE ? req.body.LOGITUDE : '';
    let LATITUDE = req.body.LATITUDE ? req.body.LATITUDE : '';
    let IS_ALL = req.body.IS_ALL ? req.body.IS_ALL : '0';
    var supportKey = req.headers['supportkey'];

    var filterPincode = PINCODE_ID.length > 0 ? String(PINCODE_ID) : '';
    var filterSkill = SKILL_ID.length > 0 ? String(SKILL_ID) : '';
    var filterType = TYPE.length > 0 ? String(TYPE) : '';
    var filterExperience = EXPERIANCE.length > 0 ? String(EXPERIANCE) : '';

    try {
        mm.executeQuery(`CALL sp_get_technician_locations(?, ?, ?, ?, ?, ?, ?)`, [filterPincode, filterSkill, filterType, filterExperience, IS_ALL, LATITUDE, LOGITUDE], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get technicianLocationTrack count.",
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "success",
                    "data": Array.isArray(results[0]) ? results[0] : results
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to get technicianLocationTrack count.",
        });
    }
}



exports.getTechnicianLocationsByFilter = (req, res) => {

    let ORDER_ID = req.body.ORDER_ID ? req.body.ORDER_ID : '';
    let JOB_CARD_ID = req.body.JOB_CARD_ID ? req.body.JOB_CARD_ID : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';
    var supportKey = req.headers['supportkey'];
    var filter = req.body.filter ? req.body.filter : '';

    try {

        var Query = `CALL sp_get_technician_locations_by_filter(?, ?, ?, ?)`
        mm.executeQuery(Query, [String(ORDER_ID), String(JOB_CARD_ID), String(TECHNICIAN_ID), String(filter)], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get technicianLocationTrack count.",
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "success",
                    "data": Array.isArray(results[0]) ? results[0] : results
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to get technicianLocationTrack count.",
        });
    }
}