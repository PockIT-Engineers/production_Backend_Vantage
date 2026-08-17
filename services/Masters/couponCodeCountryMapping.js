const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var couponCodeCountryMapping = "coupon_code_country_mapping";
var viewCouponCodeCountryMapping = "view_" + couponCodeCountryMapping;

function reqData(req) {
    var data = {
        COUPON_ID: req.body.COUPON_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('COUPON_ID').isInt().optional(),
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
            return res.status(400).json({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }


        mm.executeQueryData(
            setContext + 'CALL sp_couponCodeCountryMapping_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).send({ "code": 400, "message": 'Failed to fetch team' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 11,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.status(500).send({ "code": 500, "message": 'Something went wrong' });
    }
};

exports.create = (req, res) => {
    const errors = validationResult(req);
    const d = reqData(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ code: 422, message: errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_couponCodeCountryMapping_create(?,?,?,?)`,
            [d.COUPON_ID, d.COUNTRY_ID, d.IS_ACTIVE, d.CLIENT_ID],
            supportKey,
            (error, result) => {
                if (error) {
                    return res.send({ code: 400, message: "Failed to save coupon mapping" });
                }
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new coupon code for country mapping.`;
                var logCategory = "CouponCodeCountryMapping"

                let actionLog = {
                    "SOURCE_ID": result[0][0].INSERT_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                res.send({
                    "code": 200,
                    "message": "CouponCodeCountryMapping information saved successfully...",
                });

            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500, "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const d = reqData(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ code: 422, message: errors.errors });
    }

    try{
    mm.executeQueryData(
        `CALL sp_couponCodeCountryMapping_update(?,?,?,?,?)`,
        [req.body.ID, d.COUPON_ID, d.COUNTRY_ID, d.IS_ACTIVE, d.CLIENT_ID],
        supportKey,
        (error) => {
            if (error) {
                return res.send({ code: 400, message: "Failed to update coupon mapping" });
            }

            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME}  has updated the coupon code for country mapping.".`;
            var logCategory = "CouponCodeCountryMapping"

            let actionLog = {
                "SOURCE_ID": req.body.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
            }
            dbm.saveLog(actionLog, systemLog)

            res.send({
                "code": 200,
                "message": "CouponCodeCountryMapping information updated successfully...",
            });
        }
    );
        } catch (error) {
         console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};
