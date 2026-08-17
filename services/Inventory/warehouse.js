const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const token = require('../ShipModule/shiprocketLoginInfo')
const applicationkey = process.env.APPLICATION_KEY;
const request = require('request')
var warehouseMaster = "warehouse_master";
var viewWarehouseMaster = "view_" + warehouseMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        PICKUP_LOCATION: req.body.PICKUP_LOCATION,
        ADDRESS_LINE1: req.body.ADDRESS_LINE1,
        ADDRESS_LINE2: req.body.ADDRESS_LINE2,
        CITY_NAME: req.body.CITY_NAME,
        STATE_ID: req.body.STATE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        PIN_CODE_ID: req.body.PIN_CODE_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        PIN_CODE_ID: req.body.PIN_CODE_ID,
        WAREHOUSE_MANAGER_NAME: req.body.WAREHOUSE_MANAGER_NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
        PINCODE: req.body.PINCODE,
        WAREHOUSE_MANAGER_ID: req.body.WAREHOUSE_MANAGER_ID,
        LATITUDE: req.body.LATITUDE,
        LONGITUDE: req.body.LONGITUDE



    }
    return data;
}

exports.validate = function () {
    return [

        // body('NAME', ' parameter missing').exists(), body('ADDRESS_LINE1', ' parameter missing').exists(), body('ADDRESS_LINE2', ' parameter missing').exists(), body('CITY_ID').isInt(), body('STATE_ID').isInt(), body('COUNTRY_ID').isInt(), body('PIN_CODE_ID').isInt(), body('COUNTRY_ID').isInt(), body('PIN_CODE_ID').isInt(), body('WAREHOUSE_MANAGER_NAME', ' parameter missing').exists(), body('MOBILE_NO', ' parameter missing').exists(), body('EMAIL_ID', ' parameter missing').exists(), body('STATUS', ' parameter missing').exists(), body('ID').optional(),
        body('NAME', ' parameter missing').exists(),
        body('ADDRESS_LINE1', ' parameter missing').exists(),
        body('ADDRESS_LINE2').optional(),
        body('CITY_ID').optional(),
        body('STATE_ID').isInt(),
        body('COUNTRY_ID').isInt(),
        body('COUNTRY_ID').isInt(),
        body('WAREHOUSE_MANAGER_NAME', ' parameter missing').exists(),
        body('MOBILE_NO', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('STATUS', ' parameter missing').exists(),
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
    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_warehouseMaster_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get warehouse data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 136,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    const data = reqData(req);
    const supportKey = req.headers['supportkey'];

    try {
        const params = [
            data.NAME,
            data.PICKUP_LOCATION,
            data.ADDRESS_LINE1,
            data.ADDRESS_LINE2,
            data.CITY_NAME,
            data.STATE_ID,
            data.COUNTRY_ID,
            data.PIN_CODE_ID,
            data.COUNTRY_CODE,
            data.WAREHOUSE_MANAGER_NAME,
            data.MOBILE_NO,
            data.EMAIL_ID,
            data.STATUS,
            data.CLIENT_ID,
            data.DISTRICT_ID,
            data.PINCODE,
            data.WAREHOUSE_MANAGER_ID,
            data.LATITUDE,
            data.LONGITUDE
        ];

        mm.executeQueryData(
            'CALL sp_warehouseMaster_create (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            params,
            supportKey,
            (error) => {
                if (error) {
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save warehouse information"
                    });
                }
                res.status(200).json({
                    "code": 200,
                    "message": "warehouse information saved successfully"
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.update = async(req, res) => {
    const data = reqData(req);
    const supportKey = req.headers['supportkey'];

    try {
        let fullAddress = "";
        const line1 = data.ADDRESS_LINE1;
        const ste = req.body.STATE_NAME;
        const cntry = req.body.COUNTRY_NAME;
        const pincd = data.PINCODE;
        if (!data.LATITUDE && !data.LONGITUDE) {
            data.LATITUDE = "";
            data.LONGITUDE = "";
        }

        if (!line1 || !ste || !cntry || !pincd) {
            const reason = "The required fields are missing for getting geolocation";
            return res.send({
                "code": 400,
                "message": reason
            });
        } else {
            fullAddress = [line1, ste, cntry, pincd].filter(Boolean).join(', ');
        }

        if (data.LATITUDE == "" || data.LONGITUDE == "") {
            console.log(`\n\n\n\n **** Geocoding address for ${fullAddress}`);
            const geo = await mm.geocodeAddress(fullAddress);
            if (!geo.latitude || !geo.longitude) {
                const reason = "Invalid address faild to fetch geolocation";
                return res.send({
                    "code": 400,
                    "message": reason
                });
            }
            data.LONGITUDE = geo.longitude;
            data.LATITUDE = geo.latitude
        }
        const params = [
            req.body.ID,
            data.NAME,
            data.PICKUP_LOCATION,
            data.ADDRESS_LINE1,
            data.ADDRESS_LINE2,
            data.CITY_NAME,
            data.STATE_ID,
            data.COUNTRY_ID,
            data.PIN_CODE_ID,
            data.COUNTRY_CODE,
            data.WAREHOUSE_MANAGER_NAME,
            data.MOBILE_NO,
            data.EMAIL_ID,
            data.STATUS,
            data.CLIENT_ID,
            data.DISTRICT_ID,
            data.PINCODE,
            data.WAREHOUSE_MANAGER_ID,
            data.LATITUDE,
            data.LONGITUDE
        ];

        mm.executeQueryData(
            'CALL sp_warehouseMaster_update (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            params,
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update warehouse information"
                    });
                }
                res.status(200).json({
                    "code": 200,
                    "message": "warehouse information updated successfully"
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.createWarehouse = async (req, res) => {
    const data = reqData(req);
    const supportKey = req.headers['supportkey'];

    try {
        let fullAddress = "";
        const line1 = data.ADDRESS_LINE1;
        const ste = req.body.STATE_NAME;
        const cntry = req.body.COUNTRY_NAME;
        const pincd = data.PINCODE;
        if (!data.LATITUDE && !data.LONGITUDE) {
            data.LATITUDE = "";
            data.LONGITUDE = "";
        }

        if (!line1 || !ste || !cntry || !pincd) {
            const reason = "The required fields are missing for getting geolocation";
            return res.send({
                "code": 400,
                "message": reason
            });
        } else {
            fullAddress = [line1, ste, cntry, pincd].filter(Boolean).join(', ');
        }

        if (data.LATITUDE == "" || data.LONGITUDE == "") {
            console.log(`\n\n\n\n **** Geocoding address for ${fullAddress}`);
            const geo = await mm.geocodeAddress(fullAddress);
            if (!geo.latitude || !geo.longitude) {
                const reason = "Invalid address faild to fetch geolocation";
                return res.send({
                    "code": 400,
                    "message": reason
                });
            }
            data.LONGITUDE = geo.longitude;
            data.LATITUDE = geo.latitude
        }
        const params = [
            data.NAME,
            data.PICKUP_LOCATION,
            data.ADDRESS_LINE1,
            data.ADDRESS_LINE2,
            data.CITY_NAME,
            data.STATE_ID,
            data.COUNTRY_ID,
            data.PIN_CODE_ID,
            data.COUNTRY_CODE,
            data.WAREHOUSE_MANAGER_NAME,
            data.MOBILE_NO,
            data.EMAIL_ID,
            data.STATUS,
            data.CLIENT_ID,
            data.DISTRICT_ID,
            data.PINCODE,
            data.WAREHOUSE_MANAGER_ID,
            data.LATITUDE,
            data.LONGITUDE
        ];

        mm.executeQueryData(
            'CALL sp_warehouseMaster_createWarehouse (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            params,
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                        "message": error.message || 'Failed to save warehouse information'
                    });
                }

                res.status(200).json({
                    "code": 200,
                    "message": 'warehouse information saved successfully'
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

