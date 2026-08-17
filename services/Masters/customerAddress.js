const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
const applicationkey = process.env.APPLICATION_KEY;
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
var customerAddressMaster = "customer_address_master";
var viewCustomerAddressMaster = "view_" + customerAddressMaster;

function reqData(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CONTACT_PERSON_NAME: req.body.CONTACT_PERSON_NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE_2: req.body.ADDRESS_LINE_2,
        COUNTRY_ID: req.body.COUNTRY_ID,
        STATE_ID: req.body.STATE_ID,
        CITY_ID: req.body.CITY_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        GEO_LOCATION: req.body.GEO_LOCATION,
        TYPE: req.body.TYPE,
        IS_DEFAULT: req.body.IS_DEFAULT ? "1" : "0",
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
        LANDMARK: req.body.LANDMARK,
        HOUSE_NO: req.body.HOUSE_NO,
        BUILDING: req.body.BUILDING,
        FLOOR: req.body.FLOOR,
        PINCODE: req.body.PINCODE,
        CITY_NAME: req.body.CITY_NAME,
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        STATUS: req.body.STATUS ? '1' : '0',
        PINCODE_FOR: req.body.PINCODE_FOR,
        SITE_NUMBER: req.body.SITE_NUMBER,
    }
    return data;
}

function reqDatalog(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        ADDRESS_ID: req.body.ADDRESS_ID,
        CONTACT_PERSON_NAME: req.body.CONTACT_PERSON_NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE_2: req.body.ADDRESS_LINE_2,
        COUNTRY_ID: req.body.COUNTRY_ID,
        STATE_ID: req.body.STATE_ID,
        CITY_ID: req.body.CITY_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        GEO_LOCATION: req.body.GEO_LOCATION,
        TYPE: req.body.TYPE,
        IS_DEFAULT: req.body.IS_DEFAULT ? "1" : "0",
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
        LANDMARK: req.body.LANDMARK,
        HOUSE_NO: req.body.HOUSE_NO,
        BUILDING: req.body.BUILDING,
        FLOOR: req.body.FLOOR,
        PINCODE: req.body.PINCODE,
        CITY_NAME: req.body.CITY_NAME,
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        STATUS: req.body.STATUS ? '1' : '0',
        PINCODE_FOR: req.body.PINCODE_FOR,
        SITE_NUMBER: req.body.SITE_NUMBER,
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('MOBILE_NO').optional(),
        body('EMAIL_ID').optional(),
        body('ADDRESS_LINE_1').optional(),
        body('ADDRESS_LINE_2').optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('CITY_ID').optional(),
        body('PINCODE_ID').optional(),
        body('GEO_LOCATION').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
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
    var supportKey = req.headers['supportkey'];

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_customerAddress_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get customerAddress count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 17,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.send({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.create = (req, res) => {
    var dataUpdate = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            dataUpdate.STATUS = 1;
            var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
            var USER_ID = req.body.authData.data.UserData[0].USER_ID;
            var systemDate = mm.getSystemDate();

            mm.executeQueryData(
                `CALL sp_customerAddress_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    dataUpdate.CUSTOMER_ID,
                    dataUpdate.CONTACT_PERSON_NAME,
                    dataUpdate.MOBILE_NO,
                    dataUpdate.EMAIL_ID,
                    dataUpdate.ADDRESS_LINE_1,
                    dataUpdate.ADDRESS_LINE_2,
                    dataUpdate.COUNTRY_ID,
                    dataUpdate.STATE_ID,
                    dataUpdate.CITY_ID,
                    dataUpdate.PINCODE_ID,
                    dataUpdate.GEO_LOCATION,
                    dataUpdate.TYPE,
                    dataUpdate.IS_DEFAULT,
                    dataUpdate.CLIENT_ID,
                    dataUpdate.DISTRICT_ID,
                    dataUpdate.LANDMARK,
                    dataUpdate.HOUSE_NO,
                    dataUpdate.BUILDING,
                    dataUpdate.FLOOR,
                    dataUpdate.PINCODE,
                    dataUpdate.CITY_NAME,
                    dataUpdate.CUSTOMER_DETAILS_ID,
                    dataUpdate.STATUS,
                    dataUpdate.PINCODE_FOR,
                    dataUpdate.SITE_NUMBER,
                    systemDate,
                    NAME,
                    USER_ID,
                    '@address_id', '@code', '@message', '@state_id', '@country_id', '@customer_name'
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save customerAddress information..."
                        });
                    } else {
                        // Extract output parameters (adjust based on your MySQL driver)
                        const resultData = results[0] && results[0][0] ? results[0][0] : {};
                        const addressId = resultData.address_id || 0;
                        const code = resultData.code || 200;
                        const message = resultData.message || '';
                        const stateId = dataUpdate.STATE_ID || 0;
                        const countryId = dataUpdate.COUNTRY_ID || 0;
                        const customerName = dataUpdate.CONTACT_PERSON_NAME || '';

                        if (code !== 200) {
                            res.send({
                                "code": code,
                                "message": message
                            });
                        } else {
                            // Create action log (EXACT same logic)
                            var ACTION_DETAILS = `User ${NAME} has created a new address.`;
                            var logCategory = "customer address";

                            let actionLog = {
                                "SOURCE_ID": addressId,
                                "LOG_DATE_TIME": systemDate,
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": USER_ID,
                                "supportKey": 0
                            };

                            dbm.saveLog(actionLog, systemLog);

                            // Channel subscription logic (EXACT same logic - stays in Node.js)
                            var CHANNEL_NAME = `promotion_state_${stateId}_channel`;
                            var CHANNEL_NAME2 = `promotion_country_${countryId}_channel`;
                            var data = {
                                "CHANNEL_NAME": CHANNEL_NAME,
                                "USER_ID": dataUpdate.CUSTOMER_ID,
                                "TYPE": "C"
                            };
                            var data2 = {
                                "CHANNEL_NAME": CHANNEL_NAME2,
                                "USER_ID": dataUpdate.CUSTOMER_ID,
                                "TYPE": "C"
                            };

                            channelSubscribedUsers.findOne(data)
                                .then(existingRecord => {
                                    if (existingRecord) {
                                        res.send({
                                            "code": 200,
                                            "message": "CustomerAddress information saved successfully...",
                                            "ID": addressId
                                        });
                                    } else {
                                        const chanelData = {
                                            CHANNEL_NAME: CHANNEL_NAME,
                                            USER_ID: dataUpdate.CUSTOMER_ID,
                                            TYPE: "C",
                                            STATUS: true,
                                            USER_NAME: customerName,
                                            CLIENT_ID: dataUpdate.CLIENT_ID,
                                            DATE: systemDate
                                        };
                                        const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                        newchannelSubscribedUsers.save();

                                        channelSubscribedUsers.findOne(data2)
                                            .then(existingRecord2 => {
                                                if (existingRecord2) {
                                                    res.send({
                                                        "code": 200,
                                                        "message": "CustomerAddress information saved successfully...",
                                                        "ID": addressId
                                                    });
                                                } else {
                                                    const chanelData2 = {
                                                        CHANNEL_NAME: CHANNEL_NAME2,
                                                        USER_ID: dataUpdate.CUSTOMER_ID,
                                                        TYPE: "C",
                                                        STATUS: true,
                                                        USER_NAME: customerName,
                                                        CLIENT_ID: dataUpdate.CLIENT_ID,
                                                        DATE: systemDate
                                                    };
                                                    const newchannelSubscribedUsers2 = new channelSubscribedUsers(chanelData2);
                                                    newchannelSubscribedUsers2.save();

                                                    res.send({
                                                        "code": 200,
                                                        "message": "CustomerAddress information saved successfully...",
                                                        "ID": addressId
                                                    });
                                                }
                                            })
                                            .catch(error => {
                                                console.error(error);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Something went wrong during country channel subscription"
                                                });
                                            });
                                    }
                                })
                                .catch(error => {
                                    console.error(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Something went wrong during state channel subscription"
                                    });
                                });
                        }
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};

exports.createAddress = async (req, res) => {
    var dataUpdate = reqData(req);
    var dataLog = reqDatalog(req);
    var CUSTOMER_NAME = req.body.CONTACT_PERSON_NAME;
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            const ln1 = dataUpdate.ADDRESS_LINE_1;
            const ln2 = dataUpdate.ADDRESS_LINE_2;
            const ct = dataUpdate.CITY_NAME;
            const ste = req.body.STATE_NAME;
            const cntry = req.body.COUNTRY_NAME;
            const pincd = dataUpdate.PINCODE;
            let fullAddress = "";
            if (!ln1 || !ste || !cntry || !pincd) {
                const reason = "The address must be complete and valid";
                return res.send({
                    "code": 400,
                    "message": reason
                });
            } else {
                fullAddress = [ln1, ln2, ct, ste, cntry, pincd].filter(Boolean).join(', ');
            }
            let GEO_LOCATION = ""
            if (!dataUpdate.GEO_LOCATION) {
                console.log(`\n\n\n\n **** Geocoding address for row  ${fullAddress}`);
                const geo = await mm.geocodeAddress(fullAddress);
                if (!geo.latitude || !geo.longitude) {
                    const reason = "Invalid address faild to fetch geolocation";
                    return res.send({
                        "code": 400,
                        "message": reason
                    });
                }
                GEO_LOCATION = geo.latitude + "," + geo.longitude;
                dataUpdate.GEO_LOCATION = GEO_LOCATION;
            } else {
                GEO_LOCATION = dataUpdate.GEO_LOCATION;
            }
            dataUpdate.STATUS = 1;
            var systemDate = mm.getSystemDate();
            var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
            var USER_ID = req.body.authData.data.UserData[0].USER_ID;

            // Call stored procedure
            mm.executeQueryData(
                `CALL sp_customerAddress_createAddress(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    // Address parameters
                    dataUpdate.CUSTOMER_ID,
                    dataUpdate.CONTACT_PERSON_NAME,
                    dataUpdate.MOBILE_NO,
                    dataUpdate.EMAIL_ID,
                    dataUpdate.ADDRESS_LINE_1,
                    dataUpdate.ADDRESS_LINE_2,
                    dataUpdate.COUNTRY_ID,
                    dataUpdate.STATE_ID,
                    dataUpdate.CITY_ID,
                    dataUpdate.PINCODE_ID,
                    dataUpdate.GEO_LOCATION,
                    dataUpdate.TYPE,
                    dataUpdate.IS_DEFAULT,
                    dataUpdate.CLIENT_ID,
                    dataUpdate.DISTRICT_ID,
                    dataUpdate.LANDMARK,
                    dataUpdate.HOUSE_NO,
                    dataUpdate.BUILDING,
                    dataUpdate.FLOOR,
                    dataUpdate.PINCODE,
                    dataUpdate.CITY_NAME,
                    dataUpdate.CUSTOMER_DETAILS_ID,
                    dataUpdate.STATUS,
                    dataUpdate.PINCODE_FOR,
                    dataUpdate.SITE_NUMBER
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save customerAddress information..."
                        });
                    } else {
                        // Extract output parameters
                        const resultData = results[0] && results[0][0] ? results[0][0] : {};
                        const addressId = resultData.address_id || 0;
                        const code = resultData.code || 200;
                        const message = resultData.message || '';
                        const isDefault = dataUpdate.IS_DEFAULT;
                        const stateId = dataUpdate.STATE_ID
                        const countryId = dataUpdate.COUNTRY_ID
                        const pincodeId = dataUpdate.PINCODE_ID
                        const customerName = CUSTOMER_NAME

                        if (code !== 200) {
                            res.send({
                                "code": code,
                                "message": message
                            });
                        } else {
                            // Create action log (EXACT same logic)
                            var ACTION_DETAILS = `User ${NAME} has created a new address.`;
                            var logCategory = "customer address";

                            let actionLog = {
                                "SOURCE_ID": addressId,
                                "LOG_DATE_TIME": systemDate,
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": USER_ID,
                                "supportKey": 0
                            };

                            dbm.saveLog(actionLog, systemLog);

                            // Channel subscription logic (EXACT same logic - stays in Node.js)
                            var SUBSCRIBED_CHANNELS = [];
                            var CHANNEL_NAME = `promotion_state_${stateId}_channel`;
                            var CHANNEL_NAME2 = `promotion_country_${countryId}_channel`;
                            var CHANNEL_NAME3 = `pincode_${pincodeId}_channel`;
                            var CHANNEL_NAME4 = `promotion_pincode_${pincodeId}_channel`;
                            var data = {
                                "CHANNEL_NAME": CHANNEL_NAME,
                                "USER_ID": dataUpdate.CUSTOMER_ID,
                                "TYPE": "C"
                            };
                            var data2 = {
                                "CHANNEL_NAME": CHANNEL_NAME2,
                                "USER_ID": dataUpdate.CUSTOMER_ID,
                                "TYPE": "C"
                            };
                            var data3 = {
                                "CHANNEL_NAME": CHANNEL_NAME3,
                                "USER_ID": dataUpdate.CUSTOMER_ID,
                                "TYPE": "C"
                            };

                            var data4 = {
                                "CHANNEL_NAME": CHANNEL_NAME4,
                                "USER_ID": dataUpdate.CUSTOMER_ID,
                                "TYPE": "C"
                            };

                            function subscribeUser(channelName, dataUpdate, SUBSCRIBED_CHANNELS) {
                                const channelData = {
                                    CHANNEL_NAME: channelName,
                                    USER_ID: dataUpdate.CUSTOMER_ID,
                                    TYPE: "C",
                                    STATUS: true,
                                    USER_NAME: customerName,
                                    CLIENT_ID: dataUpdate.CLIENT_ID,
                                    DATE: systemDate
                                };
                                const newChannel = new channelSubscribedUsers(channelData);
                                newChannel.save();
                                SUBSCRIBED_CHANNELS.push(channelData);
                            }

                            function handleError(res, error) {
                                console.error(error);
                                res.send({
                                    "code": 400,
                                    "message": "Something went wrong during channel subscription"
                                });
                            }

                            // Check if IS_DEFAULT was set to 1 (EXACT same logic)
                            if (isDefault === '1') {
                                console.log("IS_DEFAULT is set to 1. Other addresses have been updated.");
                            }

                            // Subscribe to channels (EXACT same logic)
                            channelSubscribedUsers.findOne(data).then(existingRecord => {
                                if (!existingRecord) {
                                    subscribeUser(CHANNEL_NAME, dataUpdate, SUBSCRIBED_CHANNELS);
                                }
                                channelSubscribedUsers.findOne(data2).then(existingRecord2 => {
                                    if (!existingRecord2) {
                                        subscribeUser(CHANNEL_NAME2, dataUpdate, SUBSCRIBED_CHANNELS);
                                    }
                                    channelSubscribedUsers.findOne(data3).then(existingRecord3 => {
                                        if (!existingRecord3) {
                                            subscribeUser(CHANNEL_NAME3, dataUpdate, SUBSCRIBED_CHANNELS);
                                        }
                                        channelSubscribedUsers.findOne(data4).then(existingRecord4 => {
                                            if (!existingRecord4) {
                                                subscribeUser(CHANNEL_NAME4, dataUpdate, SUBSCRIBED_CHANNELS);
                                            }
                                            return res.send({
                                                "code": 200,
                                                "message": "CustomerAddress information saved successfully...",
                                                "ID": addressId,
                                                "subscribedChannels": SUBSCRIBED_CHANNELS
                                            });
                                        }).catch(error => handleError(res, error));
                                    }).catch(error => handleError(res, error));
                                }).catch(error => handleError(res, error));
                            }).catch(error => handleError(res, error));
                        }
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};

exports.updateAddressDefault = (req, res) => {
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var ID = req.body.ID;
    var dataLog = reqDatalog(req);
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];

    try {
        // Call stored procedure
        mm.executeQueryData(
            `CALL sp_customerAddress_updateDefault(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                CUSTOMER_ID,
                ID,
                dataLog.ADDRESS_ID || ID,
                dataLog.ADDRESS_LINE_1,
                dataLog.ADDRESS_LINE_2,
                dataLog.COUNTRY_ID,
                dataLog.STATE_ID,
                dataLog.CITY_ID,
                dataLog.PINCODE_ID,
                dataLog.GEO_LOCATION,
                dataLog.TYPE,
                dataLog.IS_DEFAULT,
                dataLog.DISTRICT_ID,
                dataLog.LANDMARK,
                dataLog.HOUSE_NO,
                dataLog.BUILDING,
                dataLog.FLOOR,
                dataLog.PINCODE,
                dataLog.CITY_NAME,
                dataLog.STATUS,
                dataLog.PINCODE_FOR,
                dataLog.SITE_NUMBER,
                dataLog.CONTACT_PERSON_NAME,
                dataLog.MOBILE_NO,
                dataLog.EMAIL_ID

            ],
            supportKey,
            (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update customerAddress information."
                    });
                } else {
                    // Extract output parameters
                    const resultData = results[0] && results[0][0] ? results[0][0] : {};
                    const code = resultData.code || 200;
                    const message = resultData.message || '';
                    const insertId = resultData.insert_id || 0;

                    if (code !== 200) {
                        res.send({
                            "code": code,
                            "message": message
                        });
                    } else {
                        // Create action log (EXACT same logic)
                        var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                        var ACTION_DETAILS = `User ${NAME} has updated the default address.`;
                        var logCategory = "customer address";

                        let actionLog = {
                            "SOURCE_ID": CUSTOMER_ID,
                            "LOG_DATE_TIME": systemDate,
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": logCategory,
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        };

                        dbm.saveLog(actionLog, systemLog);

                        res.send({
                            "code": 200,
                            "message": "CustomerAddress information updated successfully...",
                            "ID": insertId
                        });
                    }
                }
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var dataLog = reqDatalog(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();
    var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
    var USER_ID = req.body.authData.data.UserData[0].USER_ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            mm.executeQueryData(
                `CALL sp_customerAddress_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    // Address parameters
                    req.body.ID,
                    data.CUSTOMER_ID,
                    data.CONTACT_PERSON_NAME,
                    data.MOBILE_NO,
                    data.EMAIL_ID,
                    data.ADDRESS_LINE_1,
                    data.ADDRESS_LINE_2,
                    data.COUNTRY_ID,
                    data.STATE_ID,
                    data.CITY_ID,
                    data.PINCODE_ID,
                    data.GEO_LOCATION,
                    data.TYPE,
                    data.IS_DEFAULT,
                    data.CLIENT_ID,
                    data.DISTRICT_ID,
                    data.LANDMARK,
                    data.HOUSE_NO,
                    data.BUILDING,
                    data.FLOOR,
                    data.PINCODE,
                    data.CITY_NAME,
                    data.CUSTOMER_DETAILS_ID,
                    data.STATUS,
                    data.PINCODE_FOR,
                    data.SITE_NUMBER,

                    // Log parameters
                    dataLog.ADDRESS_ID,
                    dataLog.OLD_ADDRESS_LINE_1,
                    dataLog.OLD_ADDRESS_LINE_2,
                    dataLog.OLD_COUNTRY_ID,
                    dataLog.OLD_STATE_ID,
                    dataLog.OLD_CITY_ID,
                    dataLog.OLD_PINCODE_ID,
                    dataLog.OLD_GEO_LOCATION,
                    dataLog.OLD_TYPE,
                    dataLog.OLD_IS_DEFAULT,
                    dataLog.OLD_DISTRICT_ID,
                    dataLog.OLD_LANDMARK,
                    dataLog.OLD_HOUSE_NO,
                    dataLog.OLD_BUILDING,
                    dataLog.OLD_FLOOR,
                    dataLog.OLD_PINCODE,
                    dataLog.OLD_CITY_NAME,
                    dataLog.OLD_STATUS,
                    dataLog.OLD_PINCODE_FOR,
                    dataLog.OLD_SITE_NUMBER,

                    // System parameters
                    systemDate,
                    NAME,
                    USER_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save customerAddress information..."
                        });
                    } else {
                        const resultData = results[0] && results[0][0] ? results[0][0] : {};
                        const code = resultData.code || 200;
                        const message = resultData.message || '';
                        const addressId = resultData.address_id || req.body.ID;

                        if (code !== 200) {
                            res.send({
                                "code": code,
                                "message": message
                            });
                        } else {
                            // Create action log (EXACT same logic)
                            var ACTION_DETAILS = `User ${NAME} has updated the address.`;
                            var logCategory = "customer address";

                            let actionLog = {
                                "SOURCE_ID": addressId,
                                "LOG_DATE_TIME": systemDate,
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": USER_ID,
                                "supportKey": 0
                            };

                            dbm.saveLog(actionLog, systemLog);

                            res.send({
                                "code": 200,
                                "message": "CustomerAddress information updated successfully...",
                                "ID": addressId
                            });
                        }
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};

exports.updateAddress = async (req, res) => {
    console.log("Request received for updating address:", req.body);

    const errors = validationResult(req);
    var data = reqData(req);
    var dataLog = reqDatalog(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();

    console.log("Data received from request:", data);

    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
        return;
    }

    try {
        const ln1 = data.ADDRESS_LINE_1;
        const ln2 = data.ADDRESS_LINE_2;
        const ct = data.CITY_NAME;
        const ste = req.body.STATE_NAME;
        const cntry = req.body.COUNTRY_NAME;
        const pincd = data.PINCODE;
        let fullAddress = "";
        if (!ln1 || !ste || !cntry || !pincd) {
            const reason = "The address must be complete and valid";
            return res.send({
                "code": 400,
                "message": reason
            });
        } else {
            fullAddress = [ln1, ln2, ct, ste, cntry, pincd].filter(Boolean).join(', ');
        }
        let GEO_LOCATION = ""
        if (!data.GEO_LOCATION) {
            console.log(`\n\n\n\n **** Geocoding address for row ${rowNum}: ${fullAddress}`);
            const geo = await mm.geocodeAddress(fullAddress);
            if (!geo.latitude || !geo.longitude) {
                const reason = "Invalid address faild to fetch geolocation";
                return res.send({
                    "code": 400,
                    "message": reason
                });
            }
            GEO_LOCATION = geo.latitude + "," + geo.longitude;
            data.GEO_LOCATION = geo.latitude + "," + geo.longitude;
            dataLog.GEO_LOCATION = geo.latitude + "," + geo.longitude;

        } else {
            GEO_LOCATION = data.GEO_LOCATION;
        }
        // Call stored procedure
        mm.executeQueryData(
            `CALL sp_customerAddress_updateAddress(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.CUSTOMER_ID,
                data.CONTACT_PERSON_NAME,
                data.MOBILE_NO,
                data.EMAIL_ID,
                data.ADDRESS_LINE_1,
                data.ADDRESS_LINE_2,
                data.COUNTRY_ID,
                data.STATE_ID,
                data.CITY_ID,
                data.PINCODE_ID,
                data.GEO_LOCATION,
                data.TYPE,
                data.IS_DEFAULT,
                data.CLIENT_ID,
                data.DISTRICT_ID,
                data.LANDMARK,
                data.HOUSE_NO,
                data.BUILDING,
                data.FLOOR,
                data.PINCODE,
                data.CITY_NAME,
                data.CUSTOMER_DETAILS_ID,
                data.STATUS,
                data.PINCODE_FOR,
                data.SITE_NUMBER
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("Error during address update:", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to update address information."
                    });
                } else {
                    // Extract output parameters
                    const resultData = results[0] && results[0][0] ? results[0][0] : {};
                    const code = resultData.code || 200;
                    const message = resultData.message || '';
                    const insertId = resultData.insert_id || 0;
                    const customerId = resultData.customer_id_out || data.CUSTOMER_ID;

                    if (code !== 200) {
                        res.send({
                            "code": code,
                            "message": message
                        });
                    } else {
                        // Check if IS_DEFAULT was set to 1 (EXACT same console.log)
                        if (data.IS_DEFAULT && (data.IS_DEFAULT == '1' || data.IS_DEFAULT == true)) {
                            console.log("IS_DEFAULT is set to 1. Other addresses have been updated.");
                        } else {
                            console.log("IS_DEFAULT is not set. Address updated directly.");
                        }

                        // Create action log (EXACT same logic)
                        var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                        var ACTION_DETAILS = `User ${NAME} has updated the address.`;
                        var logCategory = "customer address";

                        let actionLog = {
                            "SOURCE_ID": req.body.ID,
                            "LOG_DATE_TIME": systemDate,
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": logCategory,
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        };

                        console.log("Saving action log:", actionLog);
                        dbm.saveLog(actionLog, systemLog);

                        res.send({
                            "code": 200,
                            "message": "CustomerAddress information saved successfully...",
                            "ID": insertId
                        });
                    }
                }
            }
        );
    } catch (error) {
        console.log("Error in try-catch block:", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.deleteAddress = (req, res) => {

    var dataLog = reqDatalog(req);
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    const ADDRESS_ID = req.body.ADDRESS_ID;
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();

    try {
        mm.executeQueryData(
            `CALL sp_customerAddress_delete(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                CUSTOMER_ID,
                ADDRESS_ID,
                dataLog.CONTACT_PERSON_NAME,
                dataLog.MOBILE_NO,
                dataLog.EMAIL_ID,
                dataLog.ADDRESS_LINE_1,
                dataLog.ADDRESS_LINE_2,
                dataLog.COUNTRY_ID,
                dataLog.STATE_ID,
                dataLog.CITY_ID,
                dataLog.PINCODE_ID,
                dataLog.GEO_LOCATION,
                dataLog.TYPE,
                dataLog.IS_DEFAULT,
                dataLog.CLIENT_ID,
                dataLog.DISTRICT_ID,
                dataLog.LANDMARK,
                dataLog.HOUSE_NO,
                dataLog.BUILDING,
                dataLog.FLOOR,
                dataLog.PINCODE,
                dataLog.CITY_NAME,
                dataLog.CUSTOMER_DETAILS_ID,
                dataLog.STATUS,
                dataLog.PINCODE_FOR,
                dataLog.SITE_NUMBER
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save customerAddress information..."
                    });
                } else {
                    // Extract output parameters
                    const resultData = results[0] && results[0][0] ? results[0][0] : {};
                    const code = resultData.code || 200;
                    const message = resultData.message || '';
                    const insertId = resultData.insert_id || 0;

                    if (code === 400) {
                        res.send({
                            "code": 400,
                            "message": message || "Address not found or does not belong to customer"
                        });
                    } else if (code !== 200) {
                        res.send({
                            "code": code,
                            "message": message
                        });
                    } else {
                        // Create action log - EXACT same logic
                        var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                        var ACTION_DETAILS = `Customer ${NAME} has deleted the address.`;
                        var logCategory = "customer address";

                        let actionLog = {
                            "SOURCE_ID": ADDRESS_ID,
                            "LOG_DATE_TIME": systemDate,
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": logCategory,
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        };

                        dbm.saveLog(actionLog, systemLog);

                        res.send({
                            "code": 200,
                            "message": "Customer address information deleted successfully...",
                            "ID": insertId
                        });
                    }
                }
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (err, results) => {
            if (err) {
                reject(err);
                mm.rollbackConnection(connection);
            }
            else resolve(results);
        });
    });
};

async function syncChannels(dataUpdate, CUSTOMER_NAME, connection) {
    let SUBSCRIBED_CHANNELS = [];

    const CHANNELS = [
        `promotion_state_${dataUpdate.STATE_ID}_channel`,
        `promotion_country_${dataUpdate.COUNTRY_ID}_channel`,
        `pincode_${dataUpdate.PINCODE_ID}_channel`,
        `promotion_pincode_${dataUpdate.PINCODE_ID}_channel`
    ];

    for (let ch of CHANNELS) {
        let existing = await channelSubscribedUsers.findOne({
            CHANNEL_NAME: ch,
            USER_ID: dataUpdate.CUSTOMER_ID,
            TYPE: "C"
        });

        if (!existing) {
            const obj = {
                CHANNEL_NAME: ch,
                USER_ID: dataUpdate.CUSTOMER_ID,
                TYPE: "C",
                STATUS: true,
                USER_NAME: dataUpdate.CONTACT_PERSON_NAME || CUSTOMER_NAME,
                CLIENT_ID: dataUpdate.CLIENT_ID,
                DATE: mm.getSystemDate()
            };

            await new channelSubscribedUsers(obj).save();
            SUBSCRIBED_CHANNELS.push(obj);
        }
    }

    return SUBSCRIBED_CHANNELS;
}

exports.importCustomerAddress = async (req, res) => {
    console.log("=== IMPORT CUSTOMER ADDRESS STARTED ===");

    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME) {
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });
        }

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]], { defval: "" });

        const jsonData = rawRows.filter(r =>
            Object.values(r).some(v => String(v).trim() !== "")
        );

        if (!jsonData.length) {
            return res.status(200).json({ code: 200, message: "No data found" });
        }

        // respond immediately
        res.status(200).json({
            code: 200,
            message: "Customer Address import started...",
            EXCEL_MASTER_ID
        });

        let successfulRecords = 0, skippedRecords = 0, failedRecords = 0;
        let successData = [], skippedData = [], errorData = [], totalData = [];

        const chunkSize = 50;
        const isEdit = IMPORT_TYPE === "E";

        const normalize = v => v ? v.toString().trim() : "";

        const f = name => COLUMN_JSON?.find(c => c.TABLE_FIELD === name)?.EXCEL_FIELD;

        const ID_FIELD = f("ID");

        const fields = {
            CUSTOMER: f("CUSTOMER_ID"),
            EMAIL: f("CUSTOMER_EMAIL"),
            TYPE: f("TYPE"),
            LINE1: f("ADDRESS_LINE_1"),
            LINE2: f("ADDRESS_LINE_2"),
            LANDMARK: f("LANDMARK"),
            COUNTRY: f("COUNTRY_ID"),
            STATE: f("STATE_ID"),
            DISTRICT: f("DISTRICT_ID"),
            CITY: f("CITY_NAME"),
            PIN: f("PINCODE_ID"),
            SITE: f("SITE_NUMBER"),
            LONG: f("LONGITUDE"),
            LAT: f("LATITUDE"),
            CONTACT: f("CONTACT_PERSON_NAME"),
            MOBILE: f("MOBILE_NO"),
            DEFAULT: f("IS_DEFAULT"),
            STATUS: f("STATUS")
        };

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (let i = 0; i < chunk.length; i++) {
                const row = chunk[i];
                const rowNum = start + i + 2;
                const connection = mm.openConnection();

                try {
                    let ID = ID_FIELD ? normalize(row[ID_FIELD]) : null;
                    let CUSTOMER = normalize(row[fields.CUSTOMER]);
                    let EMAIL = normalize(row[fields.EMAIL]);

                    if (CUSTOMER) {
                        let custName = CUSTOMER.split("(");
                        CUSTOMER = custName[0].trim();
                    }

                    if (!CUSTOMER || !EMAIL) {
                        skippedRecords++;
                        const reason = "Missing CUSTOMER or EMAIL";
                        skippedData.push({ rowNum, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // resolve customer using SP
                    const cust = await runQuery(
                        `CALL sp_get_customer_by_name_email(?, ?)`,
                        [CUSTOMER, EMAIL],
                        supportKey,
                        connection
                    );

                    const custResult = cust && cust[0] ? cust[0] : [];

                    if (!custResult.length) {
                        skippedRecords++;
                        const reason = "Customer not found";
                        skippedData.push({ rowNum, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    let COUNTRY_ID = normalize(row[fields.COUNTRY]);
                    let STATE_ID = normalize(row[fields.STATE]);
                    let PINCODE_ID = normalize(row[fields.PIN]);
                    let DISTRICT_ID = normalize(row[fields.DISTRICT]);

                    // 🔑 MASTER LOOKUPS using SPs
                    const countryId = await getMasterIdByName(connection, "country_master", "ID", "NAME", COUNTRY_ID, supportKey);
                    const stateId = await getMasterIdByName(connection, "state_master", "ID", "NAME", STATE_ID, supportKey);
                    const districtId = await getMasterIdByName(connection, "district_master", "ID", "NAME", DISTRICT_ID, supportKey);
                    const pincodeId = await getMasterIdByName(connection, "pincode_master", "ID", "PINCODE", PINCODE_ID, supportKey);

                    // Check which masters are missing and build detailed error message
                    const missingMasters = [];
                    if (COUNTRY_ID && !countryId) missingMasters.push("Country");
                    if (STATE_ID && !stateId) missingMasters.push("State");
                    if (PINCODE_ID && !pincodeId) missingMasters.push("Postal Code");
                    if (DISTRICT_ID && !districtId) missingMasters.push("District");

                    if (missingMasters.length > 0) {
                        skippedRecords++;
                        const reason = `Data not found for ${missingMasters.join(', ')}`;
                        skippedData.push({ rowNumber: rowNum, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const CUSTOMER_ID = custResult[0].ID;
                    const ln1 = normalize(row[fields.LINE1]);
                    const ln2 = normalize(row[fields.LINE2]);
                    const ct = normalize(row[fields.CITY]);
                    const ste = normalize(row[fields.STATE]);
                    const cntry = normalize(row[fields.COUNTRY]);
                    const pincd = normalize(row[fields.PIN]);
                    let fullAddress = "";

                    if (!ln1 || !ste || !cntry || !pincd) {
                        skippedRecords++;
                        const reason = "The address must be complete and valid";
                        skippedData.push({ rowNum, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    } else {
                        fullAddress = [ln1, ln2, ct, ste, cntry, pincd].filter(Boolean).join(', ');
                    }

                    let GEO_LOCATION = "";
                    if (normalize(row[fields.LONG]) == "" || normalize(row[fields.LAT]) == "") {
                        console.log(`\n\n\n\n **** Geocoding address for row ${rowNum}: ${fullAddress}`);

                        const geo = await mm.geocodeAddress(fullAddress);
                        if (!geo.latitude || !geo.longitude) {
                            skippedRecords++;
                            const reason = "Invalid address failed to fetch geolocation";
                            skippedData.push({ rowNum, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        GEO_LOCATION = geo.longitude + ',' + geo.latitude;
                        row[fields.LONG] = geo.longitude;
                        row[fields.LAT] = geo.latitude;
                    } else {
                        GEO_LOCATION = normalize(row[fields.LONG]) + ',' + normalize(row[fields.LAT]);
                    }

                    var STATUS = 1;

                    // if (isEdit) {
                    //     STATUS = normalize(row[fields.STATUS] == "Active" ? 1 : 0);
                    // }

                    let dataUpdate = {
                        CUSTOMER_ID,
                        TYPE: normalize(row[fields.TYPE]),
                        ADDRESS_LINE_1: normalize(row[fields.LINE1]),
                        ADDRESS_LINE_2: normalize(row[fields.LINE2]),
                        LANDMARK: normalize(row[fields.LANDMARK]),
                        COUNTRY_ID: countryId,
                        STATE_ID: stateId,
                        PINCODE_ID: pincodeId,
                        PINCODE: normalize(row[fields.PIN]),
                        PINCODE_FOR: "B",
                        DISTRICT_ID: districtId,
                        CITY_NAME: normalize(row[fields.CITY]),
                        SITE_NUMBER: normalize(row[fields.SITE]),
                        GEO_LOCATION,
                        CONTACT_PERSON_NAME: normalize(row[fields.CONTACT]),
                        MOBILE_NO: normalize(row[fields.MOBILE]),
                        IS_DEFAULT: row[fields.DEFAULT] == "Yes" ? 1 : 0,
                        STATUS: STATUS,
                        CLIENT_ID: 1
                    };
                    dataUpdate.TYPE = dataUpdate.TYPE == "Home" ? "H" :
                        dataUpdate.TYPE == "Office" ? "F" : "O";

                    let dataLog = { ...dataUpdate };

                    if (isEdit) {
                        if (!ID) {
                            skippedRecords++;
                            const reason = "Missing ID in Edit";
                            skippedData.push({ rowNum, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        const existing = await runQuery(
                            `CALL sp_get_address_by_id(?)`,
                            [ID],
                            supportKey,
                            connection
                        );

                        const existingResult = existing && existing[0] ? existing[0] : [];

                        if (!existingResult.length) {
                            skippedRecords++;
                            const reason = "Address Not Found";
                            skippedData.push({ rowNum, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        const old = existingResult[0];

                        if (dataUpdate.IS_DEFAULT == 1) {
                            await runQuery(
                                `CALL sp_reset_default_addresses(?)`,
                                [CUSTOMER_ID],
                                supportKey,
                                connection
                            );

                            await runQuery(
                                `CALL sp_update_customer_address(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    ID,
                                    dataUpdate.CUSTOMER_ID,
                                    dataUpdate.TYPE,
                                    dataUpdate.ADDRESS_LINE_1,
                                    dataUpdate.ADDRESS_LINE_2,
                                    dataUpdate.LANDMARK,
                                    dataUpdate.COUNTRY_ID,
                                    dataUpdate.STATE_ID,
                                    dataUpdate.PINCODE_ID,
                                    dataUpdate.PINCODE,
                                    dataUpdate.PINCODE_FOR,
                                    dataUpdate.DISTRICT_ID,
                                    dataUpdate.CITY_NAME,
                                    dataUpdate.SITE_NUMBER,
                                    dataUpdate.GEO_LOCATION,
                                    dataUpdate.CONTACT_PERSON_NAME,
                                    dataUpdate.MOBILE_NO,
                                    dataUpdate.IS_DEFAULT,
                                    dataUpdate.STATUS,
                                    dataUpdate.CLIENT_ID
                                ],
                                supportKey,
                                connection
                            );
                        } else if (dataUpdate.IS_DEFAULT == 0) {
                            let existingDefault = await runQuery(
                                `CALL sp_check_default_address_exists(?)`,
                                [CUSTOMER_ID],
                                supportKey,
                                connection
                            );

                            const defaultResult = existingDefault && existingDefault[0] ? existingDefault[0] : [];

                            if (defaultResult.length) {
                                await runQuery(
                                    `CALL sp_update_customer_address(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                        ID,
                                        dataUpdate.CUSTOMER_ID,
                                        dataUpdate.TYPE,
                                        dataUpdate.ADDRESS_LINE_1,
                                        dataUpdate.ADDRESS_LINE_2,
                                        dataUpdate.LANDMARK,
                                        dataUpdate.COUNTRY_ID,
                                        dataUpdate.STATE_ID,
                                        dataUpdate.PINCODE_ID,
                                        dataUpdate.PINCODE,
                                        dataUpdate.PINCODE_FOR,
                                        dataUpdate.DISTRICT_ID,
                                        dataUpdate.CITY_NAME,
                                        dataUpdate.SITE_NUMBER,
                                        dataUpdate.GEO_LOCATION,
                                        dataUpdate.CONTACT_PERSON_NAME,
                                        dataUpdate.MOBILE_NO,
                                        dataUpdate.IS_DEFAULT,
                                        dataUpdate.STATUS,
                                        dataUpdate.CLIENT_ID
                                    ],
                                    supportKey,
                                    connection
                                );

                                await runQuery(
                                    `CALL sp_set_address_as_default(?)`,
                                    [defaultResult[0].ID],
                                    supportKey,
                                    connection
                                );
                            } else {
                                dataUpdate.IS_DEFAULT = 1;
                                await runQuery(
                                    `CALL sp_update_customer_address(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                        ID,
                                        dataUpdate.CUSTOMER_ID,
                                        dataUpdate.TYPE,
                                        dataUpdate.ADDRESS_LINE_1,
                                        dataUpdate.ADDRESS_LINE_2,
                                        dataUpdate.LANDMARK,
                                        dataUpdate.COUNTRY_ID,
                                        dataUpdate.STATE_ID,
                                        dataUpdate.PINCODE_ID,
                                        dataUpdate.PINCODE,
                                        dataUpdate.PINCODE_FOR,
                                        dataUpdate.DISTRICT_ID,
                                        dataUpdate.CITY_NAME,
                                        dataUpdate.SITE_NUMBER,
                                        dataUpdate.GEO_LOCATION,
                                        dataUpdate.CONTACT_PERSON_NAME,
                                        dataUpdate.MOBILE_NO,
                                        dataUpdate.IS_DEFAULT,
                                        dataUpdate.STATUS,
                                        dataUpdate.CLIENT_ID
                                    ],
                                    supportKey,
                                    connection
                                );
                            }
                        } else {
                            skippedRecords++;
                            const reason = "You must have at least one default address";
                            skippedData.push({ rowNum, row, reason });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Logging using SP
                        dataLog.ADDRESS_ID = ID;
                        await runQuery(
                            `CALL sp_insert_address_log(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                ID,
                                dataLog.CUSTOMER_ID,
                                dataLog.TYPE,
                                dataLog.ADDRESS_LINE_1,
                                dataLog.ADDRESS_LINE_2,
                                dataLog.LANDMARK,
                                dataLog.COUNTRY_ID,
                                dataLog.STATE_ID,
                                dataLog.PINCODE_ID,
                                dataLog.PINCODE,
                                dataLog.PINCODE_FOR,
                                dataLog.DISTRICT_ID,
                                dataLog.CITY_NAME,
                                dataLog.SITE_NUMBER,
                                dataLog.GEO_LOCATION,
                                dataLog.CONTACT_PERSON_NAME,
                                dataLog.MOBILE_NO,
                                dataLog.IS_DEFAULT,
                                dataLog.STATUS,
                                dataLog.CLIENT_ID
                            ],
                            supportKey,
                            connection
                        );

                        // Pincode migration (MongoDB - stays in API)
                        if (old.PINCODE_ID != dataUpdate.PINCODE_ID) {
                            await channelSubscribedUsers.findOneAndUpdate(
                                { CHANNEL_NAME: `pincode_${old.PINCODE_ID}_channel`, USER_ID: CUSTOMER_ID, TYPE: "C" },
                                { STATUS: false }
                            );

                            await channelSubscribedUsers.updateOne(
                                { CHANNEL_NAME: `pincode_${dataUpdate.PINCODE_ID}_channel`, USER_ID: CUSTOMER_ID, TYPE: "C" },
                                {
                                    $set: { STATUS: true, DATE: mm.getSystemDate() }
                                },
                                { upsert: true }
                            );


                            await channelSubscribedUsers.findOneAndUpdate(
                                { CHANNEL_NAME: `promotion_pincode_${old.PINCODE_ID}_channel`, USER_ID: CUSTOMER_ID, TYPE: "C" },
                                { STATUS: false }
                            );

                            await channelSubscribedUsers.updateOne(
                                { CHANNEL_NAME: `promotion_pincode_${dataUpdate.PINCODE_ID}_channel`, USER_ID: CUSTOMER_ID, TYPE: "C" },
                                {
                                    $set: { STATUS: true, DATE: mm.getSystemDate() }
                                },
                                { upsert: true }
                            );
                        }

                        successfulRecords++;
                        successData.push({ rowNum, row, ID });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                        mm.commitConnection(connection);
                        continue;
                    }

                    let AddressInsertResult = null;

                    if (dataUpdate.IS_DEFAULT == 1) {
                        await runQuery(
                            `CALL sp_reset_default_addresses(?)`,
                            [CUSTOMER_ID],
                            supportKey,
                            connection
                        );

                        const insertResult = await runQuery(
                            `CALL sp_insert_customer_address(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                dataUpdate.CUSTOMER_ID,
                                dataUpdate.TYPE,
                                dataUpdate.ADDRESS_LINE_1,
                                dataUpdate.ADDRESS_LINE_2,
                                dataUpdate.LANDMARK,
                                dataUpdate.COUNTRY_ID,
                                dataUpdate.STATE_ID,
                                dataUpdate.PINCODE_ID,
                                dataUpdate.PINCODE,
                                dataUpdate.PINCODE_FOR,
                                dataUpdate.DISTRICT_ID,
                                dataUpdate.CITY_NAME,
                                dataUpdate.SITE_NUMBER,
                                dataUpdate.GEO_LOCATION,
                                dataUpdate.CONTACT_PERSON_NAME,
                                dataUpdate.MOBILE_NO,
                                dataUpdate.IS_DEFAULT,
                                dataUpdate.STATUS,
                                dataUpdate.CLIENT_ID
                            ],
                            supportKey,
                            connection
                        );

                        AddressInsertResult = {
                            insertId: insertResult && insertResult[0] && insertResult[0][0] ?
                                insertResult[0][0].insertId : insertResult[0]?.insertId
                        };

                    } else if (dataUpdate.IS_DEFAULT == 0) {
                        let existingDefault = await runQuery(
                            `CALL sp_check_default_address_exists(?)`,
                            [CUSTOMER_ID],
                            supportKey,
                            connection
                        );

                        const defaultResult = existingDefault && existingDefault[0] ? existingDefault[0] : [];

                        if (defaultResult.length) {
                            const insertResult = await runQuery(
                                `CALL sp_insert_customer_address(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    dataUpdate.CUSTOMER_ID,
                                    dataUpdate.TYPE,
                                    dataUpdate.ADDRESS_LINE_1,
                                    dataUpdate.ADDRESS_LINE_2,
                                    dataUpdate.LANDMARK,
                                    dataUpdate.COUNTRY_ID,
                                    dataUpdate.STATE_ID,
                                    dataUpdate.PINCODE_ID,
                                    dataUpdate.PINCODE,
                                    dataUpdate.PINCODE_FOR,
                                    dataUpdate.DISTRICT_ID,
                                    dataUpdate.CITY_NAME,
                                    dataUpdate.SITE_NUMBER,
                                    dataUpdate.GEO_LOCATION,
                                    dataUpdate.CONTACT_PERSON_NAME,
                                    dataUpdate.MOBILE_NO,
                                    dataUpdate.IS_DEFAULT,
                                    dataUpdate.STATUS,
                                    dataUpdate.CLIENT_ID
                                ],
                                supportKey,
                                connection
                            );

                            AddressInsertResult = {
                                insertId: insertResult && insertResult[0] && insertResult[0][0] ?
                                    insertResult[0][0].insertId : insertResult[0]?.insertId
                            };
                        } else {
                            dataUpdate.IS_DEFAULT = 1;
                            const insertResult = await runQuery(
                                `CALL sp_insert_customer_address(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    dataUpdate.CUSTOMER_ID,
                                    dataUpdate.TYPE,
                                    dataUpdate.ADDRESS_LINE_1,
                                    dataUpdate.ADDRESS_LINE_2,
                                    dataUpdate.LANDMARK,
                                    dataUpdate.COUNTRY_ID,
                                    dataUpdate.STATE_ID,
                                    dataUpdate.PINCODE_ID,
                                    dataUpdate.PINCODE,
                                    dataUpdate.PINCODE_FOR,
                                    dataUpdate.DISTRICT_ID,
                                    dataUpdate.CITY_NAME,
                                    dataUpdate.SITE_NUMBER,
                                    dataUpdate.GEO_LOCATION,
                                    dataUpdate.CONTACT_PERSON_NAME,
                                    dataUpdate.MOBILE_NO,
                                    dataUpdate.IS_DEFAULT,
                                    dataUpdate.STATUS,
                                    dataUpdate.CLIENT_ID
                                ],
                                supportKey,
                                connection
                            );

                            AddressInsertResult = {
                                insertId: insertResult && insertResult[0] && insertResult[0][0] ?
                                    insertResult[0][0].insertId : insertResult[0]?.insertId
                            };
                        }
                    } else {
                        skippedRecords++;
                        const reason = "You must have at least one default address";
                        skippedData.push({ rowNum, row, reason });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const ADDRESS_ID = AddressInsertResult.insertId;

                    dataLog.ADDRESS_ID = ADDRESS_ID;
                    await runQuery(
                        `CALL sp_insert_address_log(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            ADDRESS_ID,
                            dataLog.CUSTOMER_ID,
                            dataLog.TYPE,
                            dataLog.ADDRESS_LINE_1,
                            dataLog.ADDRESS_LINE_2,
                            dataLog.LANDMARK,
                            dataLog.COUNTRY_ID,
                            dataLog.STATE_ID,
                            dataLog.PINCODE_ID,
                            dataLog.PINCODE,
                            dataLog.PINCODE_FOR,
                            dataLog.DISTRICT_ID,
                            dataLog.CITY_NAME,
                            dataLog.SITE_NUMBER,
                            dataLog.GEO_LOCATION,
                            dataLog.CONTACT_PERSON_NAME,
                            dataLog.MOBILE_NO,
                            dataLog.IS_DEFAULT,
                            dataLog.STATUS,
                            dataLog.CLIENT_ID
                        ],
                        supportKey,
                        connection
                    );

                    // MongoDB channel subscription - stays in API
                    await syncChannels(dataUpdate, CUSTOMER, connection);

                    successfulRecords++;
                    successData.push({ rowNum, row, ID: ADDRESS_ID });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                    mm.commitConnection(connection);

                } catch (err) {
                    failedRecords++;
                    errorData.push({ rowNum, row, reason: err.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
                    mm.rollbackConnection(connection);
                }
            }

            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: Math.round(((start + chunk.length) / jsonData.length) * 100),
                STATUS: "Processing"
            });
        }

        const response = {
            code: 200,
            message: "Customer Address import completed",
            totalRecords: jsonData.length,
            successfulRecords,
            skippedRecords,
            failedRecords,
            successData,
            skippedData,
            errorData,
            totalData
        };

        // console.log("Response:", response);

        const fs = require("fs");
        const path = require("path");

        const fileName = `${EXCEL_MASTER_ID}.json`;
        const filePath = path.join(
            __dirname,
            "../../uploads/ExcelImporResponse/",
            fileName
        );

        await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
            RESPONSE: fileName,
            TOTAL_RECORDS: jsonData.length,
            SUCCESSFUL_RECORDS: successfulRecords,
            SKIPPED_RECORDS: skippedRecords,
            FAILED_RECORDS: failedRecords,
            STATUS: "Completed",
            PROGRESS: 100
        });

        fs.writeFileSync(filePath, JSON.stringify(response, null, 2), "utf8");

        console.log("=== IMPORT COMPLETED ===");

    } catch (err) {
        console.error("FATAL:", err);
    }
};


async function getMasterIdByName(connection, table, idField, nameField, value, supportKey) {
    if (!value) return null;

    if (table === 'pincode_master') {
        const result = await runQuery(
            `CALL sp_get_pincode_id_by_pincode(?)`,
            [value],
            supportKey,
            connection
        );
        return result && result[0] && result[0][0] ? result[0][0].ID : null;
    } else {
        const result = await runQuery(
            `CALL sp_get_master_id_by_name(?, ?, ?, ?, ?)`,
            [table, idField, nameField, value, null],
            supportKey,
            connection
        );
        return result && result[0] && result[0][0] ? result[0][0][idField] : null;
    }
}





