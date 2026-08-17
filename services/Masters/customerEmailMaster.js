const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var customerEmailMaster = "customer_email_master";
var viewcustomerEmailMaster = "view_" + customerEmailMaster;

function reqData(req) {
    var data = {
        CUSTOMER_CATEGORY_ID: req.body.CUSTOMER_CATEGORY_ID,
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        SALUTATION: req.body.SALUTATION,
        MOBILE_NO: req.body.MOBILE_NO,
        ACCOUNT_STATUS: req.body.ACCOUNT_STATUS ? '1' : '0',
        COMPANY_NAME: req.body.COMPANY_NAME,
        PAN: req.body.PAN,
        GST_NO: req.body.GST_NO,
        PASSWORD: req.body.PASSWORD,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        ALTCOUNTRY_CODE: req.body.ALTCOUNTRY_CODE,
        IS_SPECIAL_CATALOGUE: req.body.IS_SPECIAL_CATALOGUE,
        IS_PARENT: req.body.IS_PARENT,
        CUSTOMER_MANAGER_ID: req.body.CUSTOMER_MANAGER_ID,
        IS_DELETED_BY_CUSTOMER: req.body.IS_DELETED_BY_CUSTOMER,
        SHORT_CODE: req.body.SHORT_CODE,
        INDIVIDUAL_COMPANY_NAME: req.body.INDIVIDUAL_COMPANY_NAME,
        COMPANY_ADDRESS: req.body.COMPANY_ADDRESS,
        IS_HAVE_GST: req.body.IS_HAVE_GST,
        VAT_NUMBER: req.body.VAT_NUMBER,
        SITE_NUMBER: req.body.SITE_NUMBER,
        PARENT_CUSTOMER_ID: req.body.PARENT_CUSTOMER_ID,
        SHORT_CODE: req.body.SHORT_CODE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('EMAIL', ' parameter missing').exists(), body('MOBILE_NO', ' parameter missing').exists(), body('ID').optional(),
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
    if (IS_FILTER_WRONG !== '0') {
        return res.status(400).json({ "code": 400, "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_customerEmailMaster_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to fetch customer emails' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];
                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 203,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.status(500).json({ "code": 500, "message": 'Something went wrong' });
    }
};


exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty())
        return res.status(422).json({ "code": 422, "message": errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_customerEmailMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.CUSTOMER_CATEGORY_ID,
                data.CUSTOMER_TYPE,
                data.NAME,
                data.EMAIL,
                data.SALUTATION,
                data.MOBILE_NO,
                mm.getSystemDate(),
                data.ACCOUNT_STATUS,
                data.COMPANY_NAME,
                data.ALTERNATE_MOBILE_NO,
                data.CURRENT_ADDRESS_ID,
                data.PAN,
                data.GST_NO,
                data.PASSWORD,
                data.PROFILE_PHOTO,
                data.CLOUD_ID,
                data.W_CLOUD_ID,
                data.DEVICE_ID,
                data.LOGOUT_DATETIME,
                data.COUNTRY_CODE,
                data.ALTCOUNTRY_CODE,
                data.IS_SPECIAL_CATALOGUE,
                data.IS_PARENT,
                data.CUSTOMER_MANAGER_ID,
                data.IS_DELETED_BY_CUSTOMER,
                data.SHORT_CODE,
                data.INDIVIDUAL_COMPANY_NAME,
                data.COMPANY_ADDRESS,
                data.IS_HAVE_GST,
                data.VAT_NUMBER,
                data.SITE_NUMBER,
                data.WEEKLY_HOLIDAY,
                data.PARENT_CUSTOMER_ID,
                data.STATUS,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                console.log(error)
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400, "message": 'Failed to create customer' });
                }
                res.status(200).json(result[0][0]);
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.status(500).json({ "code": 500, "message": 'Something went wrong' });
    }
};


exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!ID) return res.status(400).json({ "code": 400, "message": 'ID is required for update' });
    if (!errors.isEmpty())
        return res.status(422).json({ "code": 422, "message": errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_customerEmailMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.CUSTOMER_CATEGORY_ID,
                data.CUSTOMER_TYPE,
                data.NAME,
                data.EMAIL,
                data.SALUTATION,
                data.MOBILE_NO,
                data.REGISTRATION_DATE,
                data.ACCOUNT_STATUS,
                data.COMPANY_NAME,
                data.ALTERNATE_MOBILE_NO,
                data.CURRENT_ADDRESS_ID,
                data.PAN,
                data.GST_NO,
                data.PASSWORD,
                data.PROFILE_PHOTO,
                data.CLOUD_ID,
                data.W_CLOUD_ID,
                data.DEVICE_ID,
                data.LOGOUT_DATETIME,
                data.COUNTRY_CODE,
                data.ALTCOUNTRY_CODE,
                data.IS_SPECIAL_CATALOGUE,
                data.IS_PARENT,
                data.CUSTOMER_MANAGER_ID,
                data.IS_DELETED_BY_CUSTOMER,
                data.SHORT_CODE,
                data.INDIVIDUAL_COMPANY_NAME,
                data.COMPANY_ADDRESS,
                data.IS_HAVE_GST,
                data.VAT_NUMBER,
                data.SITE_NUMBER,
                data.WEEKLY_HOLIDAY,
                data.PARENT_CUSTOMER_ID,
                data.STATUS,
                data.CREATED_DATE,
                data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400, "message": 'Failed to update customer' });
                }
                res.status(200).json(result[0][0]);
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.status(500).json({ "code": 500, "message": 'Something went wrong' });
    }
};

function customerData(req) {
    var data = {
        CUSTOMER_CATEGORY_ID: req.body.CUSTOMER_CATEGORY_ID,
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        SALUTATION: req.body.SALUTATION,
        MOBILE_NO: req.body.MOBILE_NO,
        REGISTRATION_DATE: req.body.REGISTRATION_DATE,
        ACCOUNT_STATUS: req.body.ACCOUNT_STATUS ? '1' : '0',
        COMPANY_NAME: req.body.COMPANY_NAME,
        ALTERNATE_MOBILE_NO: req.body.ALTERNATE_MOBILE_NO,
        CURRENT_ADDRESS_ID: req.body.CURRENT_ADDRESS_ID,
        PASSWORD: req.body.PASSWORD,
        PAN: req.body.PAN,
        GST_NO: req.body.GST_NO,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        CLOUD_ID: req.body.CLOUD_ID,
        DEVICE_ID: req.body.DEVICE_ID,
        LOGOUT_DATETIME: req.body.LOGOUT_DATETIME,
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        ALTCOUNTRY_CODE: req.body.ALTCOUNTRY_CODE,
        IS_SPECIAL_CATALOGUE: req.body.IS_SPECIAL_CATALOGUE ? '1' : '0',
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        IS_PARENT: req.body.IS_PARENT,
        CUSTOMER_MANAGER_ID: req.body.CUSTOMER_MANAGER_ID,
        SHORT_CODE: req.body.SHORT_CODE,
        SITE_NUMBER: req.body.SITE_NUMBER,
        WEEKLY_HOLIDAY: req.body.WEEKLY_HOLIDAY,
        PARENT_CUSTOMER_ID: req.body.PARENT_CUSTOMER_ID,
        VAT_NUMBER: req.body.VAT_NUMBER,
        IS_HAVE_GST: req.body.IS_HAVE_GST ? '1' : '0'
    }
    return data;
}

exports.createDetails = async (req, res) => {
    const data = customerData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    // data.PASSWORD = data.PASSWORD ? md5(data.PASSWORD) : null;
    data.PASSWORD = data.PASSWORD ? await mm.hashPassword(data.PASSWORD) : null;

    if (!errors.isEmpty()) return res.status(422).send({ "code": 422, "message": errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_createCustomerDetails(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.CUSTOMER_CATEGORY_ID, data.CUSTOMER_TYPE, data.NAME, data.EMAIL, data.SALUTATION,
                data.MOBILE_NO, data.REGISTRATION_DATE, data.ACCOUNT_STATUS, data.COMPANY_NAME, data.ALTERNATE_MOBILE_NO,
                data.CURRENT_ADDRESS_ID, data.PASSWORD, data.PAN, data.GST_NO, data.PROFILE_PHOTO,
                data.CLOUD_ID, data.DEVICE_ID, data.LOGOUT_DATETIME, data.CLIENT_ID, data.COUNTRY_CODE,
                data.ALTCOUNTRY_CODE, data.IS_SPECIAL_CATALOGUE, 0, data.CUSTOMER_MANAGER_ID,
                data.SHORT_CODE, data.SITE_NUMBER, data.WEEKLY_HOLIDAY, data.PARENT_CUSTOMER_ID, data.CUSTOMER_DETAILS_ID, data.VAT_NUMBER, data.IS_HAVE_GST
            ],
            supportKey,
            async(error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.send({ "code": 400, "message": "Failed to create customer." });
                }
                var INSERT_ID = results[0][0].INSERT_ID
                if (results[0][0].code == 300) {
                    return res.send(results[0][0])
                }
                mm.sendDynamicEmail(1, INSERT_ID, supportKey)
                addGlobalData(INSERT_ID, supportKey)
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created  new customer  ${data.NAME}.`;
                var logCategory = "customer"

                let actionLog = {
                    SOURCE_ID: INSERT_ID, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654", CUSTOMER_DETAILS_ID: INSERT_ID
                }
                dbm.saveLog(actionLog, systemLog)
                const chanelData = {
                    CHANNEL_NAME: `customer_channel`,
                    USER_ID: INSERT_ID,
                    TYPE: "C",
                    STATUS: true,
                    USER_NAME: data.NAME,
                    CLIENT_ID: data.CLIENT_ID,
                    DATE: mm.getSystemDate()
                }
                const chanel = new channelSubscribedUsers(chanelData);
                chanel.save()
                const chanelData2 = {
                    CHANNEL_NAME: 'system_alerts_channel',
                    USER_ID: INSERT_ID,
                    TYPE: "C",
                    STATUS: true,
                    USER_NAME: data.NAME,
                    CLIENT_ID: data.CLIENT_ID,
                    DATE: mm.getSystemDate()
                }
                const chanel2 = new channelSubscribedUsers(chanelData2);
                chanel2.save()

                const chanelData3 = {
                    CHANNEL_NAME: `customer_${INSERT_ID}_channel`,
                    USER_ID: INSERT_ID,
                    TYPE: "C",
                    STATUS: true,
                    USER_NAME: data.NAME,
                    CLIENT_ID: 1,
                    DATE: mm.getSystemDate()
                }
                const chanel3 = new channelSubscribedUsers(chanelData3);
                chanel3.save()

                async function subscribeIfNotExists(channelName, userId, clientId, userName) {
                    const exist = await channelSubscribedUsers.findOne({
                        CHANNEL_NAME: channelName,
                        USER_ID: userId,
                        TYPE: "C"
                    });

                    if (!exist) {
                        const newEntry = new channelSubscribedUsers({
                            CHANNEL_NAME: channelName,
                            USER_ID: userId,
                            TYPE: "C",
                            STATUS: true,
                            USER_NAME: userName,
                            CLIENT_ID: clientId,
                            DATE: mm.getSystemDate()
                        });
                        await newEntry.save();
                    }
                }

                try {
                    for (const row of addressChannelData) {
                        if (!row) continue;

                        const CHANNEL_NAME = `promotion_state_${row.STATE_ID}_channel`;
                        const CHANNEL_NAME2 = `promotion_country_${row.COUNTRY_ID}_channel`;
                        const CHANNEL_NAME3 = `pincode_${row.PINCODE_ID}_channel`;
                        const CHANNEL_NAME4 = `promotion_pincode_${row.PINCODE_ID}_channel`;

                        await subscribeIfNotExists(CHANNEL_NAME, CUSTOMER_ID, row.CLIENT_ID || 1, req.body.NAME);
                        await subscribeIfNotExists(CHANNEL_NAME2, CUSTOMER_ID, row.CLIENT_ID || 1, req.body.NAME);
                        await subscribeIfNotExists(CHANNEL_NAME3, CUSTOMER_ID, row.CLIENT_ID || 1, req.body.NAME);
                        await subscribeIfNotExists(CHANNEL_NAME4, CUSTOMER_ID, row.CLIENT_ID || 1, req.body.NAME);
                    }
                } catch (e) {
                    console.log(e);
                }
                res.send({
                    "code": 200,
                    "message": "Customer information saved successfully.",
                    // "ID": results1.insertId,
                    "CUSTOMER_DETAILS_ID": INSERT_ID
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500, "message": "Internal server error." });
    }
};

exports.updateDetails = async (req, res) => {
    const data = customerData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;
    // data.PASSWORD = data.PASSWORD ? md5(data.PASSWORD) : null;
    data.PASSWORD = data.PASSWORD ? await mm.hashPassword(data.PASSWORD) : null;

    if (!errors.isEmpty()) return res.status(422).send({ "code": 422, "message": errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_updateCustomerDetails(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID, data.CUSTOMER_CATEGORY_ID, data.CUSTOMER_TYPE, data.NAME, data.EMAIL, data.SALUTATION,
                data.MOBILE_NO, data.ACCOUNT_STATUS, data.COMPANY_NAME, data.ALTERNATE_MOBILE_NO,
                data.CURRENT_ADDRESS_ID, data.PASSWORD, data.PAN, data.GST_NO, data.PROFILE_PHOTO,
                data.CLOUD_ID, data.DEVICE_ID, data.LOGOUT_DATETIME, data.CLIENT_ID, data.COUNTRY_CODE,
                data.ALTCOUNTRY_CODE, data.IS_SPECIAL_CATALOGUE, data.IS_PARENT, data.CUSTOMER_MANAGER_ID,
                data.SHORT_CODE, data.SITE_NUMBER, data.WEEKLY_HOLIDAY, data.PARENT_CUSTOMER_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.send({ "code": 400, "message": "Failed to update customer." });
                }


                if (results[0][0].code == 300) {
                    res.send(results[0][0]);
                }
                addGlobalData(ID, supportKey)
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of ${data.NAME}.`;
                var logCategory = "customer"

                let actionLog = {
                    "SOURCE_ID": ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                res.send({ "code": 200, "message": "Customer updated successfully" });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500, "message": "Internal server error." });
    }
};


function addGlobalData(data_Id, supportKey) {
    try {
        const setContext = `
        SET @v_PAGE_INDEX =0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = "ID";
        SET @v_SORT_VALUE = "desc";
        SET @v_FILTER = ' AND ID=${data_Id}';
    `;
        mm.executeQueryData(setContext + 'CALL sp_customer_get()', [], supportKey, (error, results1) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("data retrieved");
                const resultSets = results1.filter(r => Array.isArray(r));
                const results5 = resultSets[1] || [];
                if (results5.length > 0) {
                    console.log("\n\n\n\n jhasgdjag &&&data found", results5);
                    // require('../global').addDatainGlobal(data_Id, "Customer", results5[0].NAME, JSON.stringify(results5[0]), "/masters/customer",0, supportKey)
                    let logData = { ID: data_Id, CATEGORY: "Customer", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/customer", TERRITORY_ID: 0 };
                    dbm.addDatainGlobalmongo(logData.ID, logData.CATEGORY, logData.TITLE, logData.DATA, logData.ROUTE, logData.TERRITORY_ID)
                        .then(() => {
                            console.log("Data added/updated successfully.");
                        })
                        .catch(error => {
                            console.error("Error in addDatainGlobalmongo:", error);
                        });
                } else {
                    console.log(" no data found");
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}
