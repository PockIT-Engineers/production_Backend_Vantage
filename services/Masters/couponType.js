const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var couponTypeMaster = "coupon_type_master";
var viewCouponTypeMaster = "view_" + couponTypeMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').exists(), body('ID').optional(),
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
            setContext+'CALL sp_couponTypeMaster_get()',
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
                    "TAB_ID": 2,
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
    const supportKey = req.headers['supportkey'];

    mm.executeQueryData(
        `CALL sp_couponTypeMaster_create(?,?,?)`,
        [
            req.body.NAME,
            req.body.IS_ACTIVE ? '1' : '0',
            req.body.CLIENT_ID
        ],
        supportKey,
        (error, results) => {
            if (error) {
                console.log(error);
                return res.send({
                    code: 400,
                    message: "Failed to save couponType information"
                });
            }

            res.send({
                code: 200,
                message: "CouponType information saved successfully"
            });
        }
    );
};

exports.update = (req, res) => {
    const supportKey = req.headers['supportkey'];

    mm.executeQueryData(
        `CALL sp_couponTypeMaster_update(?,?,?,?)`,
        [
            req.body.ID,
            req.body.NAME,
            req.body.IS_ACTIVE ? '1' : '0',
            req.body.CLIENT_ID
        ],
        supportKey,
        (error) => {
            if (error) {
                console.log(error);
                return res.send({
                    code: 400,
                    message: "Failed to update couponType information"
                });
            }

            res.send({
                code: 200,
                message: "CouponType information updated successfully"
            });
        }
    );
};
