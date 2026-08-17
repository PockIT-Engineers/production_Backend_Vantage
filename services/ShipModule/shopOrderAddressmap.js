const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var shopOrderMasterAddressMap = "shop_order_master_address_map";
var viewShopOrderMasterAddressMap = "view_" + shopOrderMasterAddressMap;


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
        CLIENT_ID: req.body.CLIENT_ID,
        PINCODE: req.body.PINCODE,
        ADDRESS_ID: req.body.ADDRESS_ID,
        BUILDING: req.body.BUILDING,
        HOUSE_NO: req.body.HOUSE_NO,
        CONTACT_PERSON_NAME: req.body.CONTACT_PERSON_NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        LANDMARK: req.body.LANDMARK,
        CITY_NAME: req.body.CITY_NAME
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

exports.getAll = (req, res) => {

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
                setContext + ` CALL sp_shopOrderAddress_get(); `,
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
                        TAB_ID: 186,
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


exports.get = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var ID = req.params.id;
    var pageIndex = req.query.pageIndex ? req.query.pageIndex : null;
    var pageSize = req.query.pageSize ? req.query.pageSize : null;
    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {

        if (IS_FILTER_WRONG == "0") {

            filter = filter.replace(/'/g, "''");

            const setContext = `
                SET @v_ID = '${ID}';
SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
                SET @v_SORT_KEY = '${sortKey}';
                SET @v_SORT_VALUE = '${sortValue}';
                SET @v_FILTER = '${filter}';
            `;

            mm.executeQueryData(
                setContext + ` CALL sp_shopOrderAddress_getById(); `,
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
                        TAB_ID: 186,
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
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_shopOrderAddress_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    data.ORDER_ID, data.ADDRESS_LINE_1, data.ADDRESS_LINE_2,
                    data.CITY_ID, data.STATE_ID, data.COUNTRY_ID,
                    data.PINCODE, data.LATITUDE, data.LONGITUDE,
                    data.CLIENT_ID, data.PINCODE, data.ADDRESS_ID, data.BUILDING, data.HOUSE_NO, data.CONTACT_PERSON_NAME, data.MOBILE_NO, data.LANDMARK, data.CITY_NAME
                ], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            code: 400,
                            "message": "Failed to save shopOrderAddressMap information..."
                        });
                    }
                    else {
                        res.status(200).json({
                            code: 200,
                            "message": "ShopOrderAddressMap information saved successfully...",
                        });
                    }
                });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                code: 500,
                message: "Something went wrong."
            });
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];


    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_shopOrderAddress_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    req.body.ID,
                    data.ADDRESS_LINE_1, data.ADDRESS_LINE_2,
                    data.CITY_ID, data.STATE_ID, data.COUNTRY_ID,
                    data.PINCODE, data.LATITUDE, data.LONGITUDE, data.PINCODE, data.ADDRESS_ID, data.BUILDING, data.HOUSE_NO, data.CONTACT_PERSON_NAME, data.MOBILE_NO, data.LANDMARK, data.CITY_NAME
                ], supportKey, (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.status(400).json({
                            code: 400,
                            "message": "Failed to update shopOrderAddressMap information."
                        });
                    }
                    else {
                        res.status(200).json({
                            code: 200,
                            "message": "ShopOrderAddressMap information updated successfully...",
                        });
                    }
                });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                code: 500,
                message: "Something went wrong."
            });
        }
    }
}