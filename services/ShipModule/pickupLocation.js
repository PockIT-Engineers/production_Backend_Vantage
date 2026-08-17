const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const token = require('./shiprocketLoginInfo')
const applicationkey = process.env.APPLICATION_KEY;
const request=require('request')
var pickupLocation = "pickup_location";
var viewPickupLocation = "view_" + pickupLocation;


function reqData(req) {

    var data = {
        PICKUP_LOCATION: req.body.PICKUP_LOCATION,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        PHONE: req.body.PHONE,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE1: req.body.ADDRESS_LINE1,
        CITY: req.body.CITY,
        STATE: req.body.STATE,
        COUNTRY: req.body.COUNTRY,
        PINCODE: req.body.PINCODE,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        ORDER_ID: req.body.ORDER_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('PICKUP_LOCATION', ' parameter missing').exists(), 
        body('NAME', ' parameter missing').exists(), 
        body('EMAIL', ' parameter missing').exists(), 
        body('PHONE', ' parameter missing').exists(), 
        body('ADDRESS_LINE_1', ' parameter missing').exists(), 
        body('ADDRESS_LINE1', ' parameter missing').exists(), 
        body('CITY', ' parameter missing').exists(), 
        body('STATE', ' parameter missing').exists(), 
        body('COUNTRY', ' parameter missing').exists(), 
        body('PINCODE', ' parameter missing').exists(), 
        body('WAREHOUSE_ID').isInt(), 
        body('ORDER_ID').isInt(), 
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
                setContext + ` CALL sp_pickupLocation_get(); `,
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
                        TAB_ID: 195,
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
        return res.status(422).json({
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            `CALL sp_pickupLocation_create(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.PICKUP_LOCATION,
                data.NAME,
                data.EMAIL,
                data.PHONE,
                data.ADDRESS_LINE_1,
                data.ADDRESS_LINE1,
                data.CITY,
                data.STATE,
                data.COUNTRY,
                data.PINCODE,
                data.WAREHOUSE_ID,
                data.ORDER_ID,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to save pickupLocation information..."
                    });
                }

                // token.createToken(supportKey, (error, result) => {

                //     if (error) {
                //         console.log("error", error);
                //         return res.status(400).json({
                //             code: 400,
                //             message: "Failed to save pickupLocation information..."
                //         });
                //     }

                //     const body = {
                //         pickup_location: data.PICKUP_LOCATION,
                //         name: data.NAME,
                //         email: data.EMAIL,
                //         phone: data.PHONE,
                //         address: data.ADDRESS_LINE_1,
                //         address_2: data.ADDRESS_LINE1,
                //         city: data.CITY,
                //         state: data.STATE,
                //         country: data.COUNTRY,
                //         pin_code: data.PINCODE
                //     };

                //     var options = {
                //         url: 'https://apiv2.shiprocket.in/v1/external/settings/company/addpickup',
                //         headers: {
                //             "Content-Type": "application/json",
                //             "Authorization": "Bearer " + result
                //         },
                //         body: body,
                //         method: "post",
                //         json: true
                //     };

                //     request(options, (error, response, body) => {

                //         if (error) {
                //             console.log(error);
                //             return res.status(400).json({
                //                 code: 400,
                //                 message: "Failed to save pickupLocation information..."
                //             });
                //         }

                //         res.status(200).json({
                //             code: 200,
                //             message: "PickupLocation information saved successfully..."
                //         });
                //     });

                // });
res.status(200).json({
                            code: 200,
                            message: "PickupLocation information saved successfully..."
                        });
            }
        );

    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
};


exports.update = (req, res) => {

    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            `CALL sp_pickupLocation_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.PICKUP_LOCATION,
                data.NAME,
                data.EMAIL,
                data.PHONE,
                data.ADDRESS_LINE_1,
                data.ADDRESS_LINE1,
                data.CITY,
                data.STATE,
                data.COUNTRY,
                data.PINCODE,
                data.WAREHOUSE_ID,
                data.ORDER_ID,
                data.CLIENT_ID,
                systemDate
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to update pickupLocation information."
                    });
                }

                res.status(200).json({
                    code: 200,
                    message: "PickupLocation information updated successfully..."
                });

            }
        );

    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
};
