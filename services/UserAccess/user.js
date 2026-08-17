const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const jwt = require('jsonwebtoken');

const applicationkey = process.env.APPLICATION_KEY;
let channelSubscribedUsers = require('../../modules/channelSubscribedUsers');

function reqData(req) {
    var data = {
        ROLE_ID: req.body.ROLE_ID,
        NAME: req.body.NAME,
        EMAIL_ID: req.body.EMAIL_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        PASSWORD: req.body.PASSWORD,
        CLIENT_ID: req.body.CLIENT_ID,
        FIREBASE_REG_TOKEN: req.body.FIREBASE_REG_TOKEN,
        LAST_LOGIN_DATETIME: req.body.LAST_LOGIN_DATETIME,
        LOGOUT_DATE_TIME: req.body.LOGOUT_DATE_TIME,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        ORG_ID: req.body.ORG_ID,
        ORGANISATION_ID: req.body.ORG_ID,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER
    }
    return data;
}

exports.validate = function () {
    return [
        body('ROLE_ID').isInt(),
        body('NAME', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('PASSWORD', ' parameter missing').optional(),
        body('ORG_ID', ' parameter missing').exists(),
        body('ID').optional()
    ]
}

exports.get = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var deviceid = req.headers['deviceid'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    try {

        filter = filter.replace(/'/g, "''");

        const setContext = `
            SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
            SET @v_SORT_KEY = '${sortKey}';
            SET @v_SORT_VALUE = '${sortValue}';
            SET @v_FILTER = '${filter}';
        `;

        mm.executeQueryData(
            setContext + ` CALL sp_userMaster_get(); `,
            [],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey,
                        supportKey,
                        deviceid
                    );
                    return res.send({
                        code: 400,
                        message: "Failed to get form information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r) && r.length);

                const count = resultSets[0]?.[0]?.cnt || 0;
                const data = resultSets[1] || [];

                res.send({
                    code: 200,
                    message: "success",
                    TAB_ID: 129,
                    count: count,
                    data: data
                });

            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.create = async (req, res) => {
    const errors = validationResult(req);
    let deviceid = req.headers['deviceid'];
    let supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {
        let data = reqData(req);
        // data.PASSWORD = md5(data.PASSWORD);
        data.PASSWORD = await mm.hashPassword(data.PASSWORD);

        mm.executeQueryData(
            `CALL sp_userMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.ROLE_ID,
                data.NAME,
                data.EMAIL_ID,
                data.IS_ACTIVE,
                data.PASSWORD,
                data.CLIENT_ID,
                data.FIREBASE_REG_TOKEN,
                data.LAST_LOGIN_DATETIME,
                data.LOGOUT_DATE_TIME,
                data.PROFILE_PHOTO,
                data.ORG_ID,
                data.ORGANISATION_ID,
                data.MOBILE_NUMBER
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey,
                        supportKey,
                        deviceid
                    );
                    return res.send({
                        code: 400,
                        message: "Failed to save user information..."
                    });
                }

                const status = results[0][0].STATUS;

                if (status === 'EXISTS') {
                    res.send({
                        code: 401,
                        message: "Entered email already present."
                    });
                } else {
                    if (data.ROLE_ID == 8) {
                        const chanelData1 = {
                            CHANNEL_NAME: 'role_8_channel',
                            USER_ID: USER_ID,
                            TYPE: "A",
                            STATUS: true,
                            USER_NAME: data.NAME,
                            CLIENT_ID: data.CLIENT_ID,
                            DATE: mm.getSystemDate()
                        };
                        const chanel1 = new channelSubscribedUsers(chanelData1);
                        chanel1.save();
                    }
                    res.send({
                        code: 200,
                        message: "User information saved successfully..."
                    });
                }
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    let supportKey = req.headers['supportkey'];
    let deviceid = req.headers['deviceid'];

    if (!errors.isEmpty()) {
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {
        let data = reqData(req);

        mm.executeQueryData(
            `CALL sp_userMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.ROLE_ID,
                data.NAME,
                data.EMAIL_ID,
                data.IS_ACTIVE,
                data.PASSWORD,
                data.CLIENT_ID,
                data.FIREBASE_REG_TOKEN,
                data.LAST_LOGIN_DATETIME,
                data.LOGOUT_DATE_TIME,
                data.PROFILE_PHOTO,
                data.ORG_ID,
                data.ORGANISATION_ID,
                data.MOBILE_NUMBER
            ],
            supportKey,
            async (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: error.sqlMessage || "Failed to update user information."
                    });
                }
                console.log("results", results);

                const status = results[0][0].STATUS;

                if (status === 'EXISTS') {
                    return res.send({
                        code: 401,
                        message: "Entered email already present."
                    });
                }
                try {
                    const existingChannel = await channelSubscribedUsers.findOne({
                        USER_ID: req.body.ID,
                        CHANNEL_NAME: 'role_8_channel'
                    });

                    if (data.ROLE_ID == 8) {
                        if (existingChannel) {
                            await channelSubscribedUsers.updateOne(
                                { USER_ID: req.body.ID, CHANNEL_NAME: 'role_8_channel' },
                                { $set: { STATUS: true, DATE: mm.getSystemDate() } }
                            );
                        } else {
                            const chanelData1 = {
                                CHANNEL_NAME: 'role_8_channel',
                                USER_ID: req.body.ID,
                                TYPE: "A",
                                STATUS: true,
                                USER_NAME: data.NAME,
                                CLIENT_ID: data.CLIENT_ID,
                                DATE: mm.getSystemDate()
                            };
                            const chanel1 = new channelSubscribedUsers(chanelData1);
                            await chanel1.save();                   // ✅ awaited
                        }
                    } else {
                        if (existingChannel) {
                            await channelSubscribedUsers.updateOne(
                                { USER_ID: req.body.ID, CHANNEL_NAME: 'role_8_channel' },
                                { $set: { STATUS: false, DATE: mm.getSystemDate() } }
                            );
                        }
                    }
                } catch (mongoErr) {
                    console.log("MongoDB channel operation error:", mongoErr);
                }
                res.send({
                    code: 200,
                    message: "User information updated successfully..."
                });
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

const bcrypt = require('bcrypt');
exports.login = async (req, res) => {
    try {
        let { username, password, type, cloudid, DEVICE_ID } = req.body;
        let FIREBASE_REG_TOKEN = cloudid || '';
        let supportKey = req.headers['supportkey'];
        let systemDate = mm.getSystemDate();

        if (!username || !password || !type) {
            return res.send({
                code: 400,
                message: "username or password or type parameter missing."
            });
        }

        // password = await mm.hashPassword(password);
        // console.log("mm.hashPassword(password)", mm.hashPassword(password))

        mm.executeQueryData(
            `CALL sp_userMaster_getPassword(?)`,
            [
                username
            ],
            supportKey,
            async (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Login failed"
                    });
                }
                if (!results || !results[0] || results[0].length === 0) {
                    return res.send({
                        code: 404,
                        message: "Invalid username or password"
                    });
                }
                const storedHash = results[0][0].PASSWORD
                const isMatch = await bcrypt.compare(password, storedHash);
                if (isMatch) {
                    mm.executeQueryData(
                        `CALL sp_userMaster_login(?,?,?,?,?)`,
                        [
                            FIREBASE_REG_TOKEN,
                            DEVICE_ID,
                            cloudid,
                            systemDate,
                            results[0][0].ID
                        ],
                        supportKey,
                        async (error, results) => {
                            if (error) {
                                console.log(error);
                                return res.send({
                                    code: 400,
                                    message: "Login failed"
                                });
                            }

                            let data = results[0];

                            let user = data[0];

                            /* Identify user type */
                            let USER_TYPE = user.VENDOR_ID
                                ? 'V'
                                : user.BACKOFFICE_TEAM_ID
                                    ? 'B'
                                    : 'A';

                            /* Fetch subscribed channels */
                            const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
                            const subscribedChannels = await channelSubscribedUsers.find({
                                USER_ID: user.ID,
                                TYPE: USER_TYPE,
                                STATUS: true
                            });
                            console.log("subscribedChannels", subscribedChannels)
                            let userDetails = [{
                                USER_ID: user.ID,
                                USER_NAME: user.NAME,
                                NAME: user.NAME,
                                MOBILE_NUMBER: user.MOBILE_NUMBER,
                                PROFILE_PHOTO: user.PROFILE_PHOTO,
                                CLIENT_ID: user.CLIENT_ID,
                                ROLE_ID: user.ROLE_ID,
                                ROLE_NAME: user.ROLE_NAME,
                                EMAIL_ID: user.EMAIL_ID,
                                LAST_LOGIN_DATETIME: user.LAST_LOGIN_DATETIME,
                                ORGANISATION_ID: user.ORG_ID,
                                STATE_ID: user.STATE_ID,
                                CAN_CHANGE_SERVICE_PRICE: user.CAN_CHANGE_SERVICE_PRICE,
                                VENDOR_ID: user.VENDOR_ID,
                                BACKOFFICE_TEAM_ID: user.BACKOFFICE_TEAM_ID,
                                SUBSCRIBED_CHANNELS: subscribedChannels
                            }];

                            let TYPE =
                                user.ROLE_ID == 8 ? 'A' :
                                    user.ROLE_ID == 9 ? 'V' : 'B';

                            mm.userloginlogs(user.ID, TYPE, systemDate, "L", supportKey);

                            generateToken(user.ID, res, userDetails, null, [{
                                USER_ID: user.ID,
                                USER_NAME: user.NAME,
                                NAME: user.NAME
                            }]);
                        }
                    );
                }
                else {
                    return res.send({
                        code: 404,
                        message: "Invalid username or password"
                    });
                }
            }
        );
    } catch (error) {
        console.log(error);
        res.send({
            code: 500,
            message: "Internal server error"
        });
    }
};



exports.testWebhook = (req, res) => {
    console.log("WEBHOOK CALLED", req.body)
}

function generateToken(userId, res, resultsUser, connection, userDetails1) {
    try {
        var data = {
            "USER_ID": userId,
            "UserData": userDetails1,
            "source": 'panel'
        }

        jwt.sign({ data }, process.env.PANEL_SECRET, { expiresIn: '24h' }, (error, token) => {
            if (error) {
                console.log("token error", error);
                res.send({
                    "code": 400,
                    "message": "Failed to login.",
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "Logged in successfully.",
                    "data": [{
                        "token": token,
                        "UserData": resultsUser
                    }]
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.getForms = (req, res) => {
    try {
        let { ROLE_ID } = req.body;
        let supportKey = req.headers['supportkey'];

        if (!ROLE_ID) {
            return res.send({
                code: 400,
                message: "Parameter missing - ROLE_ID"
            });
        }

        mm.executeQueryData(
            `CALL sp_userMaster_getFormsByRole(?)`,
            [ROLE_ID],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.send({
                        code: 400,
                        message: "Failed to get Record."
                    });
                }

                if (results && results[0] && results[0][0]?.data) {
                    let json = results[0][0].data;

                    json = json.replace(/\\/g, '');
                    json = JSON.parse(json);

                    return res.send({
                        code: 200,
                        message: "SUCCESS",
                        data: json
                    });
                } else {
                    return res.send({
                        code: 400,
                        message: "No Data"
                    });
                }
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.logout = (req, res) => {
    try {
        let systemDate = mm.getSystemDate();
        let { USER_ID, ROLE_ID } = req.body;
        let supportKey = req.headers['supportkey'];

        if (!USER_ID || USER_ID === ' ') {
            return res.send({
                code: 400,
                message: "USER_ID parameter missing."
            });
        }

        mm.executeQueryData(
            `CALL sp_userMaster_Logout(?, ?)`,
            [USER_ID, systemDate],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to logout."
                    });
                }

                let TYPE = ROLE_ID == 8 ? 'A' : ROLE_ID == 9 ? 'V' : 'B';

                mm.userloginlogs(
                    USER_ID,
                    TYPE,
                    systemDate,
                    "O",
                    supportKey
                );

                return res.send({
                    code: 200,
                    message: "Logout successfully."
                });
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.sendOTPToDevice = (req, res) => {
    try {
        let TYPE = "E";
        let TYPE_VALUE = req.body.EMAIL_ID;
        let supportKey = req.headers["supportkey"];
        let systemDate = mm.getSystemDate();

        if (!TYPE_VALUE) {
            return res.send({
                code: 400,
                message: "EMAIL_ID parameter missing."
            });
        }

        let OTP = mm.getOtp();
        let body = `Your one-time password (OTP) is ${OTP}. 
This code is valid for 10 minutes.
Team UVtechSoft.`;

        mm.executeQueryData(
            `CALL sp_userMaster_sendOtp(?, ?, ?, ?, ?, ?, ?, ?)`,
            [0, 'Customer', TYPE_VALUE, 0, null, OTP, systemDate, TYPE],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to generate OTP"
                    });
                }

                let response = results[0][0];

                if (response.code !== 200) {
                    return res.send(response);
                }

                /* Send OTP Email */
                sendOtp(
                    TYPE,
                    TYPE_VALUE,
                    "OTP Verify",
                    body,
                    OTP,
                    response.USER_NAME,
                    supportKey,
                    (error) => {
                        if (error) {
                            return res.send({
                                code: 400,
                                message: "OTP generated but failed to send email"
                            });
                        }

                        return res.send({
                            code: 200,
                            USER_ID: response.USER_ID,
                            USER_NAME: response.USER_NAME,
                            message: "OTP sent to Email."
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

function sendOtp(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    console.log("TYPE : ", TYPE, "TYPE_VALUE :", TYPE_VALUE);
    var subject = "Your One Time Password (OTP)";
    var otpText1
    if (TYPE == "M") {
        otpText1 = `Dear Admin, please share OTP ${OTP} with our technician to complete your order. For queries, contact Vantage Team.Team UVtechSoft.`;
    } else {
        otpText1 = `<p style="text-align: justify;"><strong>Dear User,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: left;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with servicedesk@ovationwps.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Vantage</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"></p>`;
    }
    var otpSendStatus = "S";
    mm.executeQueryData(`CALL sp_registrationOtp_create(?,?,?,?,?,?,?,?,?)`,
        [TYPE, TYPE_VALUE, OTP, otpText1, systemDate, 1, 'S', '0', 'C'], supportKey, (error, insertOtpDetails) => {
            if (error) {
                callback(error);
            }
            else {
                sendSMSEmail(TYPE, TYPE_VALUE, subject, otpText1, (error, results) => {
                    if (error) {
                        callback(error);
                    }
                    else {
                        const VID = insertOtpDetails.insertId;
                        callback(null, VID);
                    }
                });
            }
        });
}

function sendSMSEmail(type, to, subject, body, callback) {
    if (type == "M") {
       callback(null, "SMS Sent");
    } else if (type == "E") {
        let data = {
            USER_ID: '',
            TYPE: 'text',
            ATTACHMENT: '',
        }
        mm.sendEmail(to, [], subject, body, '', "", (error, results) => {
            if (error) {
                console.log(error);
                callback(null, results);
            } else {
                callback(null, results);
            }
        });
    }
};

exports.verifyOTP = (req, res) => {
    try {
        let TYPE = "E";
        let TYPE_VALUE = req.body.EMAIL_ID;
        let OTP = req.body.OTP;
        let supportKey = req.headers["supportkey"];
        let systemDate = mm.getSystemDate();

        if (!TYPE_VALUE || !OTP) {
            return res.status(400).send({
                code: 400,
                message: "OTP or EMAIL_ID parameter missing."
            });
        }

        mm.executeQueryData(
            `CALL sp_userMaster_verifyOtp(?, ?, ?, ?)`,
            [TYPE, TYPE_VALUE, OTP, systemDate],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).send({
                        code: 400,
                        message: "Failed to verify OTP"
                    });
                }

                let response = results[0][0];
                return res.status(response.code === 200 ? 200 : 400).send(response);
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};



exports.changePassword = async (req, res) => {
    try {
        let { USER_ID, USER_NAME, NEW_PASSWORD } = req.body;
        let supportKey = req.headers['supportkey'];
        let deviceid = req.headers['deviceid'];
        let systemDate = mm.getSystemDate();

        if (!USER_ID || !NEW_PASSWORD) {
            return res.send({
                code: 400,
                message: "USER_ID or NEW_PASSWORD missing"
            });
        }

        // NEW_PASSWORD = md5(NEW_PASSWORD);
        NEW_PASSWORD = await mm.hashPassword(NEW_PASSWORD);

        mm.executeQueryData(
            `CALL sp_userMaster_changePassword(?, ?, ?)`,
            [USER_ID, NEW_PASSWORD, systemDate],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to update password"
                    });
                }

                let response = results[0][0];

                if (response.code !== 200) {
                    return res.send(response);
                }

                // Optional action log
                let ACTION_DETAILS = `User ${USER_NAME} changed their password.`;
                let logCategory = "customer";

                let actionLog = {
                    SOURCE_ID: USER_ID,
                    LOG_DATE_TIME: systemDate,
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: logCategory,
                    CLIENT_ID: 1,
                    USER_ID: USER_ID,
                    supportKey: 0
                };

                return res.send({
                    code: 200,
                    message: "Password updated successfully",
                    USER_ID: USER_ID
                });
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};
