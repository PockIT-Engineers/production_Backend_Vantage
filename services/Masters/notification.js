const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const async = require('async');
const admin = require('firebase-admin');
const applicationkey = process.env.APPLICATION_KEY;
var notificationMaster = "notification_master";
var viewNotificationMaster = "view_" + notificationMaster;

function reqData(req) {
    var data = {
        OWNER_ID: req.body.OWNER_ID,
        TITLE: req.body.TITLE,
        DESCRIPTION: req.body.DESCRIPTION,
        ORDER_ID: req.body.ORDER_ID,
        ATTACHMENT: req.body.ATTACHMENT,
        MEMBER_ID: req.body.MEMBER_ID,
        TYPE: req.body.TYPE,
        STATUS: req.body.STATUS,
        CLIENT_ID: req.body.CLIENT_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO
    }
    return data;
}

exports.validate = function () {
    return [
        body('TITLE').optional(),
        body('MESSAGE').optional(),
        body('NOTIFICATION_TYPE').optional(),
        body('SENDER_ID').isInt().optional(),
        body('RECEIVER_ID').isInt().optional(),
        body('SENT_DATE').optional(),
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

    if (IS_FILTER_WRONG !== "0")
        return res.send({ "code": 400,  "message": "Invalid filter parameter." });

    try {
        mm.executeQueryData(
            setContext + `CALL sp_notification_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400,  "message": "Failed to get notification information." });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const dataResult = resultSets[0] || [];

                let unique = [];
                let used = new Map();

                for (let row of dataResult) {
                    if (!used.has(row.DESCRIPTION)) {
                        used.set(row.DESCRIPTION, true);
                        unique.push(row);
                    }
                }

                let totalCount = unique.length;

                let start = 0;
                let end = totalCount;

                if (pageIndex !== '' && pageSize !== '') {
                    start = (pageIndex - 1) * pageSize;
                    end = start + pageSize;
                }

                let paginatedData = unique.slice(start, end);

                return res.send({
                    "code": 200,
                     "message": "success",
                    TAB_ID: 60,
                    count: totalCount,   
                    data: paginatedData 
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty())
        return res.send({ "code": 422,  "message": errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_notification_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.OWNER_ID, data.TITLE, data.DESCRIPTION, data.ORDER_ID,
                data.ATTACHMENT, data.MEMBER_ID, data.TYPE, data.STATUS,
                data.CLIENT_ID,data.NOTIFICATION_TYPE,data.MEDIA_TYPE,data.TOPIC_NAME, data.IS_ACTIVE, data.SEQ_NO
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400,  "message": "Failed to save notification information..." });
                }

                dbm.saveLog({
                    SOURCE_ID: result[0][0].ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} created notification ${data.TITLE}.`,
                    CATEGORY: "notification",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({ "code": 200,  "message": "notification information saved successfully..." });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.update = (req, res) => {
    const data = reqData(req);
    const ID = req.body.ID;
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!ID)
        return res.send({ "code": 400,  "message": "ID is required." });

    if (!errors.isEmpty())
        return res.send({ "code": 422,  "message": errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_notification_update(?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID, data.OWNER_ID, data.TITLE, data.DESCRIPTION, data.ORDER_ID,
                data.ATTACHMENT, data.MEMBER_ID, data.TYPE, data.STATUS,
                data.IS_ACTIVE, data.SEQ_NO
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.send({ "code": 400,  "message": "Failed to update notification information." });
                }

                dbm.saveLog({
                    SOURCE_ID: ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} updated notification ${data.TITLE}.`,
                    CATEGORY: "notification",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.send({ "code": 200,  "message": "notification information updated successfully..." });
            }
        );
    } catch (error) {
        console.log(error);
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};


exports.sendNotificationOld = (req, res) => {

    try {
        var data = req.body.data;
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();
        var TITLE = req.body.TITLE;
        var DESCRIPTION = req.body.DESCRIPTION;
        var MEDIA_TYPE = req.body.MEDIA_TYPE;
        var SHARING_TYPE = req.body.SHARING_TYPE;
        var TYPE = req.body.TYPE;
        var ATTACHMENT = req.body.ATTACHMENT || "";
        var TOPIC_NAME = req.body.TOPIC_NAME;
        var NOTIFIICATION_TYPE = req.body.NOTIFICATION_TYPE;
        if ((!TITLE && TITLE == undefined && TITLE == '') || (!DESCRIPTION && DESCRIPTION == undefined && DESCRIPTION == '') || (!SHARING_TYPE && SHARING_TYPE == undefined && SHARING_TYPE == '')) {
            res.send({
                "code": 400,
                "message": "data parameter missing ... "
            });
        } else {
            if (NOTIFIICATION_TYPE === 'C') {
                console.log("innnnnn")
                async.eachSeries(data, function iteratorOverElems(record, inner_callback) {
                    // Vendor
                    if (SHARING_TYPE == 1) {
                        mm.sendNotificationToVendor(req.body.authData.data.UserData[0].USER_ID, record, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                        inner_callback()
                    }
                    // backoffice
                    else if (SHARING_TYPE == 2) {
                        mm.sendNotificationToManager(req.body.authData.data.UserData[0].USER_ID, record, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                        inner_callback()
                    }
                    // customer
                    else if (SHARING_TYPE == 3) {
                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${record}_channel`, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", []);
                        mm.executeQueryData(`CALL sp_notification_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [req.body.authData.data.UserData[0].USER_ID, TITLE, DESCRIPTION, ATTACHMENT, record, "C", 1, 1, TYPE, MEDIA_TYPE, `customer_${record}_channel`,1,null], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                inner_callback(error)
                            }
                            else {
                                inner_callback()
                            }
                        });
                    }
                    // technician
                    else if (SHARING_TYPE == 4) {
                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, record, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", {});
                        inner_callback()
                    }

                }, function subCb(error) {
                    if (error) {
                        res.status(400).json({
                            "message": "Failed to send notification "
                        });
                    } else {
                        res.status(200).json({
                            "message": "Notification Sent successfully ...",
                        });
                    }
                });
            }
            else {
                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "TP", []);
                res.status(200).json({
                    "message": "Notification Sent successfully ...",
                });
            }
        }
    } catch (error) {
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to send notification "
        });
    }
}

exports.sendNotification = (req, res) => {
    try {
        var data = req.body.data;
        var supportKey = req.headers['supportkey'];
        var TITLE = req.body.TITLE;
        var DESCRIPTION = req.body.DESCRIPTION;
        var MEDIA_TYPE = req.body.MEDIA_TYPE;
        var SHARING_TYPE = req.body.SHARING_TYPE;
        var TYPE = req.body.TYPE;
        var ATTACHMENT = req.body.ATTACHMENT || "";
        var NOTIFIICATION_TYPE = req.body.NOTIFICATION_TYPE;
        var topicNames = [];
        if (Array.isArray(req.body.TOPIC_NAME) && req.body.TOPIC_NAME.length > 0) {
            topicNames = req.body.TOPIC_NAME;
        } else if (req.body.TOPIC_NAME) {
            topicNames = [req.body.TOPIC_NAME];
        }
        if (!TITLE || !DESCRIPTION || !SHARING_TYPE) {
            return res.send({ "code": 400, "message": "data parameter missing..." });
        }
        if (NOTIFIICATION_TYPE === 'C') {
            async.eachSeries(data, function iteratorOverElems(record, inner_callback) {
                if (SHARING_TYPE == 1) {
                    mm.sendNotificationToVendor(req.body.authData.data.UserData[0].USER_ID, record, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                    inner_callback();
                } else if (SHARING_TYPE == 2) {
                    mm.sendNotificationToManager(req.body.authData.data.UserData[0].USER_ID, record, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                    inner_callback();
                } else if (SHARING_TYPE == 3) {
                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${record}_channel`, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                    inner_callback();
                } else if (SHARING_TYPE == 4) {
                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, record, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                    inner_callback();
                } else {
                    inner_callback();
                }
            }, function subCb(error) {
                if (error) {
                    res.status(400).json({ "message": "Failed to send notification" });
                } else {
                    res.status(200).json({ "message": "Notification Sent successfully..." });
                }
            });
        } else {
            if (topicNames.length === 0) {
                return res.status(400).json({ "message": "No topic provided" });
            }
            async.eachSeries(topicNames, function (topic, cb) {
                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, topic, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "TP", req.body);
                cb();
            }, function (error) {
                if (error) {
                    res.status(400).json({ "message": "Failed to send notification" });
                } else {
                    res.status(200).json({ "message": "Notification Sent successfully..." });
                }
            });
        }
    } catch (error) {
        console.log(error);
        res.send({ "code": 400, "message": "Failed to send notification" });
    }
}

exports.subscribeMultiple = async (req, res) => {

    const { token, topics } = req.body;
    if (!token || !Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({ error: 'Token and at least one topic are required' });
    }

    try {
        console.log("topics",topics)
        const subscribePromises = topics.map((topic) =>
            admin.messaging().subscribeToTopic(token, topic)
        );
        console.log("subscribePromises",subscribePromises)
        await Promise.all(subscribePromises);
        console.log(`Subscribed to topics: ${topics.join(', ')}`);
        res.json({  "message": `Subscribed to topics: ${topics.join(', ')}` });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Subscription failed' });
    }
}

exports.unsubscribeMultiple = async (req, res) => {

    const { token, topics } = req.body;

    if (!token || !Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({ error: 'Token and at least one topic are required' });
    }

    try {
        const unsubscribePromises = topics.map((topic) =>
            admin.messaging().unsubscribeFromTopic(token, topic)
        );

        await Promise.all(unsubscribePromises);
        console.log(`Unsubscribed to topics: ${topics.join(', ')}`);
        res.json({  "message": `Unsubscribed to topics: ${topics.join(', ')}` });
    } catch (error) {
        console.error('Unsubscription error:', error);
        res.status(500).json({ error: 'Unsubscription failed' });
    }
}