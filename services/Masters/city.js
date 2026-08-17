const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
var cityMaster = "city_master";
var viewCityMaster = "view_" + cityMaster;
const systemLog = require("../../modules/systemLog")


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        SEQ_NO: req.body.SEQ_NO,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        STATE_ID: req.body.STATE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('SEQ_NO').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
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
        if (IS_FILTER_WRONG !== "0") {
            return res.send({
                "code": 400,
                 "message": "Invalid filter parameter."
            });
        }

        mm.executeQueryData(
            setContext+'CALL sp_cityMaster_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                     console.log("error",error)
                    return res.send({
                        "code": 400,
                         "message": "Failed to get city information."
                    });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 8,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
         console.log("Error in catch", error)
        res.send({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_cityMaster_create(?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.SEQ_NO,
                data.IS_ACTIVE,
                data.STATE_ID,
                data.COUNTRY_ID,
                data.DISTRICT_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                   console.log("error",error)
                    return res.send({ "code": 400,  "message": "Failed to save city." });
                }

                const response = result[0][0];
                if (response.code !== 200) {
                    return res.send(response);
                }

                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new city, ${data.NAME}.`;
                var logCategory = "city"

                let actionLog = {
                    "SOURCE_ID": response.CITY_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)

                res.send({
                    "code": 200,
                     "message": "City information saved successfully."
                });
            }
        );
    } catch (error) {
         console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const cityId = req.body.ID;

    if (!errors.isEmpty()) {
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_cityMaster_update(?,?,?,?,?,?,?,?)`,
            [
                cityId,
                data.NAME,
                data.SEQ_NO,
                data.IS_ACTIVE,
                data.STATE_ID,
                data.COUNTRY_ID,
                data.DISTRICT_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                   console.log("error",error)
                    return res.send({ "code": 400,  "message": "Failed to update city." });
                }
                const response = result[0][0];

                if (response.code !== 200) {
                    return res.send(response);
                }
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the city ${data.NAME}.`;
                var logCategory = "city"

                let actionLog = {
                    "SOURCE_ID": cityId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)

                res.send({
                    "code": 200,
                     "message": "City information updated successfully."
                });
            }
        );
    } catch (error) {
        console.log("error",error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};
