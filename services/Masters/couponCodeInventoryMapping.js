const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var couponCodeInventoryMapping = "coupon_code_inventory_mapping";
var viewcouponCodeInventoryMapping = "view_" + couponCodeInventoryMapping;

function reqData(req) {
    var data = {
        COUPON_ID: req.body.COUPON_ID,
        SERVICE_ID: req.body.SERVICE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        CATEGORY_ID: req.body.CATEGORY_ID,
        INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
        INVENTORY_SUB_CATEGORY_ID: req.body.INVENTORY_SUB_CATEGORY_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('COUPON_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('CATEGORY_ID').isInt().optional(),
        body('INVENTORY_CATEGORY_ID').isInt().optional(),
        body('INVENTORY_SUB_CATEGORY_ID').isInt().optional(),
        body('SERVICE_ID').isInt().optional(),
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
            setContext+'CALL sp_couponCodeInventoryMapping_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                     console.log("error",error)
                    return res.status(400).send({ "code": 400,  "message": 'Failed to fetch team' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 192,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.status(500).send({ "code": 500,  "message": 'Something went wrong' });
    }
};

exports.create = (req, res) => {
    const errors = validationResult(req);
    const d = reqData(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ code: 422, message: errors.errors });
    }

    try{
    mm.executeQueryData(
        `CALL sp_couponCodeInventoryMapping_create(?,?,?,?,?,?,?,?)`,
        [
            d.COUPON_ID,
            d.SERVICE_ID,
            d.COUNTRY_ID,
            d.STATUS,
            d.CLIENT_ID,
            d.CATEGORY_ID,
            d.INVENTORY_CATEGORY_ID,
            d.INVENTORY_SUB_CATEGORY_ID
        ],
        supportKey,
        (error, result) => {
            if (error) {
                return res.send({ code: 400, message: "Failed to save coupon inventory mapping" });
            }

            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped a new coupon to the inventory.`;
            var logCategory = "couponCodeInventoryMapping"

            let actionLog = {
                "SOURCE_ID": result[0][0].INSERT_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
            }
            dbm.saveLog(actionLog, systemLog)

            res.send({
                "code": 200,
                "message": "couponCodeInventoryMapping information saved successfully...",
            });
        }
    );
    } catch (error) {
         console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
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
        `CALL sp_couponCodeInventoryMapping_update(?,?,?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            d.COUPON_ID,
            d.SERVICE_ID,
            d.COUNTRY_ID,
            d.STATUS,
            d.CLIENT_ID,
            d.CATEGORY_ID,
            d.INVENTORY_CATEGORY_ID,
            d.INVENTORY_SUB_CATEGORY_ID
        ],
        supportKey,
        (error) => {
            if (error) {
                return res.send({ code: 400, message: "Failed to update coupon inventory mapping" });
            }

            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of inventory-coupon mapping.`;
            var logCategory = "couponCodeInventoryMapping"

            let actionLog = {
                "SOURCE_ID": req.body.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
            }
            dbm.saveLog(actionLog, systemLog)

            res.send({
                "code": 200,
                "message": "couponCodeInventoryMapping information updated successfully...",
            });
        }
    );
    } catch (error) {
         console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};
