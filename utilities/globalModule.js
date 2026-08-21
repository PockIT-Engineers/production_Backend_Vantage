const logger = require("./logger");
const request = require("request")
const firebase = require('./firebase');
var applicationkey = process.env.APPLICATION_KEY
var supportKey = "supportKey"
const async = require('async');
const channelSubscribedUsers = require('../modules/channelSubscribedUsers');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
var mysql = require('mysql2');
exports.dotenv = require('dotenv').config();
const axios = require("axios")
const bcrypt = require('bcrypt');

const saltRounds = 12;


const config = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: '+00:00',  // Set timezone to UTC
    multipleStatements: true,
    charset: 'utf8mb4',
    dateStrings: false,   // Changed to false to get proper Date objects
    port: process.env.MYSQL_PORT
};

// helper to set session tz
async function ensureUTC(connection) {
    return new Promise((resolve, reject) => {
        // Only set timezone if not already set in connection config
        connection.query("SET time_zone = '+00:00'", err => {
            if (err) {
                console.error("Failed to set UTC timezone:", err);
                reject(err);
            } else {
                console.log("UTC timezone set for connection");
                resolve();
            }
        });
    });
}

// ------------------------------
//  SHORT-LIVED CONNECTIONS (SIMPLIFIED)
// ------------------------------
exports.executeQueryData = (query, data, supportKey, callback) => {
    const connection = mysql.createConnection(config);

    connection.connect(err => {
        if (err) {
            console.error("Connection error:", err);
            return callback(err);
        }

        // Set timezone and execute query
        connection.query("SET time_zone = '+00:00'", tzErr => {
            if (tzErr) {
                console.error("Failed to set session tz:", tzErr);
                connection.end();
                return callback(tzErr);
            }

            console.log("Executing query with data:", query, data);
            connection.query(query, data, (error, results) => {
                connection.end();
                callback(error, results);
            });
        });
    });
};





// ------------------------------
//  OPEN CONNECTIONS
// ------------------------------
exports.openConnection = () => {
    try {
        const con = mysql.createConnection(config);
        // Session setup has to be queued synchronously, before this function returns.
        // mysql2's connect() only registers listeners - it queues nothing - so the
        // SET time_zone / START TRANSACTION that used to live in its callback were
        // queued only after the handshake, i.e. AFTER the caller had already queued
        // its first statements. Those statements ran in autocommit, outside the
        // transaction, so a later rollback could not undo them.
        con.on('error', err => {
            console.error("MySQL connection error:", err);
        });
        con.query("SET time_zone = '+00:00'", err => {
            if (err) console.error("Failed to set UTC timezone:", err);
        });
        con.query('START TRANSACTION', err => {
            if (err) console.error("Failed to start transaction:", err);
        });
        return con;
    } catch (error) {
        console.error(error);
    }
};

// ------------------------------
//  COMMIT / ROLLBACK
// ------------------------------
exports.commitConnection = (connection) => {
    try {
        connection.commit(() => connection.end());
    } catch (error) {
        console.error(error);
    }
};

exports.openConnectionAwait = async () => {
    const con = mysql.createConnection(config);
    return new Promise((resolve, reject) => {
        con.connect(async err => {
            if (err) {
                console.error("Connection error:", err);
                return reject(err);
            }
            try {
                await ensureUTC(con);
            } catch (tzErr) {
                console.error("Failed to set UTC session:", tzErr);
            }
            con.beginTransaction(err => {
                if (err) {
                    console.error("Transaction start error:", err);
                    return reject(err);
                }
                resolve(con);
            });
        });
    });
};

exports.rollbackConnection = (connection) => {
    try {
        connection.rollback(() => connection.end());
    } catch (error) {
        console.error(error);
    }
};

exports.commitConnectionAwait = (connection) => {
    return new Promise((resolve, reject) => {
        connection.commit(err => {
            if (err) return reject(err);
            connection.end();
            resolve();
        });
    });
};

exports.rollbackConnectionAwait = (connection) => {
    return new Promise(resolve => {
        connection.rollback(() => {
            connection.end();
            resolve();
        });
    });
};

// ------------------------------
//  QUERY EXECUTION HELPERS
// ------------------------------
exports.executeDML = (query, data, supportKey, connection, callback) => {
    try {
        console.log(query, data);
        connection.query(query, data, callback);
    } catch (error) {
        console.error("Exception in:", query, error);
        callback(error);
    }
};

exports.executeDMLPromise = (query, data, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        console.log(query, data);
        connection.query(query, data, (err, results) => {
            if (err) {
                console.error("Query Error:", err);
                return reject(err);
            }
            resolve(results);
        });
    });
};

// ------------------------------
//  SHORT-LIVED CONNECTIONS
// ------------------------------
exports.executeQuery = (query, supportKey, callback) => {
    const connection = mysql.createConnection(config);
    connection.connect(async (err) => {
        if (err) {
            console.error("Connection error:", err);
            return callback(err);
        }
        await ensureUTC(connection);
        console.log(query);
        connection.query(query, (error, result) => {
            connection.end();
            callback(error, result);
        });
    });
};

exports.executeQueryAsync = (query, supportKey) => {
    const connection = mysql.createConnection(config);
    return new Promise(async (resolve) => {
        try {
            connection.connect(async (err) => {
                if (err) {
                    console.error("Connection error:", err);
                    return resolve({ error: err });
                }
                await ensureUTC(connection);
                console.log(query);
                connection.query(query, (error, res) => {
                    connection.end();
                    if (error) return resolve({ error });
                    logger.database(query, applicationkey, supportKey);
                    resolve(res);
                });
            });
        } catch (error) {
            console.error("Exception in:", query, error);
            connection.end();
            resolve({ error });
        }
    });
};

// ------------------------------
//  TRANSACTIONAL EXECUTION
// ------------------------------
exports.executeQueryTransaction = async (query, connection) => {
    try {
        console.log(query);
        return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) {
                    console.error(error);
                    connection.rollback(() => connection.end());
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.error("Exception In:", query, error);
        connection.rollback(() => connection.end());
    }
};

exports.executeQueryDataTransaction = (query, data, connection) => {
    try {
        console.log(query, data);
        return new Promise((resolve, reject) => {
            connection.query(query, data, (error, results) => {
                if (error) {
                    console.error(error);
                    connection.rollback(() => connection.end());
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.error("Exception In:", query, error);
        connection.rollback(() => connection.end());
    }
};



exports.diff_hours = (dt2, dt1) => {

    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60);
    return Math.abs(diff);

}

exports.getFormmattedDate = function (inDate) {
    let date_ob = new Date(inDate);
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    let date_cur = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

    return date_cur;
}

exports.diff_minutes = (dt2, dt1) => {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(diff);

}

exports.diff_seconds = (dt2, dt1) => {

    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    return Math.abs(diff);

}

exports.sendRequest = (methodType, method, body, callback) => {
    try {

        var request = require('request');
        var options = {
            url: process.env.GM_API + method,
            headers: {
                "apikey": process.env.GM_API_KEY,
                "supportkey": process.env.SUPPORT_KEY,
            },
            body: body,
            method: methodType,
            json: true
        }

        request(options, (error, response, body) => {
            if (error) {
                console.log("request error -send email ", error);
                callback(error);
            } else {
                console.log(body);
                callback(null, body);
            }
        });
    } catch (error) {
        console.log(error);
    }
}


exports.getSystemDateIST = function (date) {
    let date_ob = date ? new Date(date) : new Date();
    let day = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    let date_cur = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    return date_cur;
}

exports.getSystemDate = function () {
    // Always use current UTC date
    let date_ob = new Date();

    // Use UTC methods to get UTC components
    let utc_year = date_ob.getUTCFullYear();
    let utc_month = ("0" + (date_ob.getUTCMonth() + 1)).slice(-2);
    let utc_day = ("0" + date_ob.getUTCDate()).slice(-2);
    let utc_hours = ("0" + date_ob.getUTCHours()).slice(-2);
    let utc_minutes = ("0" + date_ob.getUTCMinutes()).slice(-2);
    let utc_seconds = ("0" + date_ob.getUTCSeconds()).slice(-2);

    let date_cur = `${utc_year}-${utc_month}-${utc_day} ${utc_hours}:${utc_minutes}:${utc_seconds}`;

    console.log("Generated UTC Date:", date_cur);
    return date_cur;
};

exports.getOtp = function () {
    let RANDOM_OTP = Math.floor(1000 + Math.random() * 9000)
    //let RANDOM_OTP = 1234;

    // console.log("Generated UTC Date:", date_cur);
    return RANDOM_OTP;
};

exports.getUTCFromTimezone = function (tz) {
    const now = new Date();

    // Get the offset for the timezone at this specific time
    const offsetStr = now.toLocaleString("en-US", {
        timeZone: tz,
        timeZoneName: "longOffset"
    });

    // Parse the offset
    const match = offsetStr.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return formatDates(new Date());

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    const minutes = match[3] ? parseInt(match[3]) : 0;

    // Total offset in minutes
    const offsetMinutes = sign * (hours * 60 + minutes);

    // Get local time in the specified timezone
    const localTimeStr = now.toLocaleString("en-US", {
        timeZone: tz,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    // Parse local time
    const [dateStr, timeStr] = localTimeStr.split(', ');
    const [month, day, year] = dateStr.split('/').map(Number);
    const [hour, minute, second] = timeStr.split(':').map(Number);

    // Create a date as if local time were UTC
    const localAsUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // Adjust by the offset to get actual UTC
    const actualUTC = new Date(localAsUTC.getTime() - (offsetMinutes * 60 * 1000));

    // Format the date as YYYY-MM-DD HH:MM:SS
    return formatDates(actualUTC);
};

// Helper function to format date as YYYY-MM-DD HH:MM:SS
function formatDates(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// For MongoDB: Store UTC timestamp that represents local time in target timezone
exports.getUTCDateFromTimezone = function (tz) {
    const now = new Date();

    // Get the offset for LA at this specific time
    const offsetStr = now.toLocaleString("en-US", {
        timeZone: tz,
        timeZoneName: "longOffset"
    });

    console.log("Offset string for", tz, ":", offsetStr);
    // Should be: "1/12/2026, GMT-8" or similar

    // Parse the offset
    const match = offsetStr.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return new Date();

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    const minutes = match[3] ? parseInt(match[3]) : 0;

    // Total offset in minutes (LA: -480 minutes)
    const offsetMinutes = sign * (hours * 60 + minutes);

    // Get local time in LA
    const laTimeStr = now.toLocaleString("en-US", {
        timeZone: tz,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    console.log("LA time:", laTimeStr);

    // Parse LA time
    const [dateStr, timeStr] = laTimeStr.split(', ');
    const [month, day, year] = dateStr.split('/').map(Number);
    const [hour, minute, second] = timeStr.split(':').map(Number);

    // Create a date as if LA time were UTC
    const laAsUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    console.log("LA as UTC (wrong):", laAsUTC.toISOString());

    // Now adjust by the offset
    // If LA is -8 hours, then actual UTC = LA local time - (-8 hours) = LA time + 8 hours
    const actualUTC = new Date(laAsUTC.getTime() - (offsetMinutes * 60 * 1000));

    console.log("Actual UTC:", actualUTC.toISOString());
    return actualUTC;
};

exports.getTimeDate = function () {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    let date_cur = year + month + date + hours + minutes + seconds;
    return date_cur;
}

exports.intermediateDates = function (startDate, endDate) {
    var startDatea = new Date(startDate);
    var endDatea = new Date(endDate);
    var getDateArray = function (start, end) {
        var arr = new Array();
        var dt = new Date(start);
        while (dt <= end) {

            var tempDate = new Date(dt);
            let date = ("0" + tempDate.getDate()).slice(-2);
            let month = ("0" + (tempDate.getMonth() + 1)).slice(-2);
            let year = tempDate.getFullYear();

            arr.push(year + "-" + month + "-" + date);
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    }

    var dateArr = getDateArray(startDatea, endDatea);
    return dateArr;
}

exports.generateKey = function (size) {

    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = size; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    console.log('length = ', result.length);
    return result;

}

exports.sanitizeDataJson = (json) => {
    try {
        console.log("before jsondata", json)
        json.replace(/\\/g, '')
        console.log("jsondata", json)

        json = JSON.parse(json);

        return json;

    } catch (error) {
        console.log(error);
    }
}



exports.sendSMS = (to, body, callback) => {
    const request = require('request');
    console.log("in sms send method", body);
    var options = {
        url: process.env.GM_API + 'sendSms',
        headers: {
            "apikey": process.env.GM_API_KEY,
            "supportkey": process.env.SUPPORT_KEY,
            "applicationkey": process.env.APPLICATION_KEY
        },
        body: {
            KEY: body.search(/otp/i) ? process.env.SMS_SERVER_KEY_OTP : process.env.SMS_SERVER_KEY,
            TO: to,
            BODY: String.raw`${body}`
        },
        json: true
    };

    console.log(options);

    request.post(options, (error, response, responseBody) => {
        if (error) {
            this.executeQueryData(
                "CALL sp_globalModule_sendSMS(?,?,?,?,?,?,?)",
                [to, JSON.stringify(body), null, 0, JSON.stringify(error), null, 1],
                process.env.SUPPORT_KEY,
                (err, result) => {
                    if (err) console.log(err);
                    else callback(error);
                }
            );
        } else {
            if (response.body.code === 400) {
                this.executeQueryData(
                    "CALL sp_globalModule_sendSMS(?,?,?,?,?,?,?)",
                    [to, JSON.stringify(body), null, 0, JSON.stringify(response.body), null, 1],
                    process.env.SUPPORT_KEY,
                    (err, result) => {
                        if (err) console.log(err);
                        else callback(JSON.stringify(body), response.body);
                    }
                );
            } else {
                this.executeQueryData(
                    "CALL sp_globalModule_sendSMS(?,?,?,?,?,?,?)",
                    [to, JSON.stringify(body), null, 1, JSON.stringify(response.body), null, 1],
                    process.env.SUPPORT_KEY,
                    (err, result) => {
                        if (err) console.log(err);
                        else callback(null, JSON.stringify(body), response.body);
                    }
                );
            }
        }
    });
};

exports.sendCustomSMS = (to, body, callback) => {
    const request = require('request');
    console.log("in sms send method", body);
    var options = {
        url: process.env.GM_API + 'sendSms',
        headers: {
            "apikey": process.env.GM_API_KEY,
            "supportkey": process.env.SUPPORT_KEY,
            "applicationkey": process.env.APPLICATION_KEY
        },
        body: {
            KEY: process.env.SMS_SERVER_KEY_CUSTOM,
            TO: to,
            BODY: String.raw`${body}`
        },
        json: true
    };

    console.log(options);

    request.post(options, (error, response, responseBody) => {
        if (error) {
            this.executeQueryData(
                "CALL sp_globalModule_sendCustomSMS(?,?,?,?,?,?,?)",
                [to, JSON.stringify(body), null, 0, JSON.stringify(error), null, 1],
                process.env.SUPPORT_KEY,
                (err, result) => {
                    if (err) console.log(err);
                    else callback(error);
                }
            );
        } else {
            console.log("response body: ", response.body);
            if (response.body.code === 400) {
                this.executeQueryData(
                    "CALL sp_globalModule_sendCustomSMS(?,?,?,?,?,?,?)",
                    [to, JSON.stringify(body), null, 0, JSON.stringify(response.body), null, 1],
                    process.env.SUPPORT_KEY,
                    (err, result) => {
                        if (err) console.log(err);
                        else callback(JSON.stringify(body), response.body);
                    }
                );
            } else {
                this.executeQueryData(
                    "CALL sp_globalModule_sendCustomSMS(?,?,?,?,?,?,?)",
                    [to, JSON.stringify(body), null, 1, JSON.stringify(response.body), null, 1],
                    process.env.SUPPORT_KEY,
                    (err, result) => {
                        if (err) console.log(err);
                        else callback(null, JSON.stringify(body), response.body);
                    }
                );
            }
        }
    });
};



exports.sanitizeFilter = (input) => {
    if (!input || typeof input !== 'string') return "0";

    const dangerousPatterns = [
        /--/g,                              // SQL comments
        /;/g,                               // Query stacking
        /\/\*/g, /\*\//g,                   // Multi-line comments
        /\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|RENAME|GRANT|REVOKE|EXECUTE|UNION|ROLLBACK|COMMIT)\b/i,
        /\(\s*SELECT\b/i,                   // Subqueries
        /\bOR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i  // OR 1=1 or '1'='1'
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
            return "1"; // unsafe
        }
    }

    return "0"; // safe
};

// A work order stays cancellable until it is already cancelled or already completed.
// Kept here so the customer portal and the SDM console render the cancel button off one
// shared rule instead of each applying its own status check.
// Returns 1 (show the button) or 0 (hide it).
exports.isCancellable = (row) => {
    if (!row || typeof row !== 'object') return 0;

    // Already cancelled.
    if (row.CANCEL_DATE) return 0;

    // Already completed. JOB_COMPLETED_DATETIME is the primary signal; the other two
    // cover result sets that do not select it.
    if (row.JOB_COMPLETED_DATETIME) return 0;
    if (row.IS_JOB_COMPLETE == 1) return 0;
    if (row.JOB_STATUS_ID == 3) return 0;
    if (String(row.TECHNICIAN_STATUS || '').toUpperCase() === 'CO') return 0;

    return 1;
};

exports.sendWAToolSMS = (MOBILE_NO, TEMPLATE_NAME, wparams, TEMP_LANG, callback) => {
    var supportKey = ['supportkey'];
    try {
        console.log("im in try block");

        var options = {
            url: process.env.WA_TOOLS_PLATFORM_URL,
            headers: {
                apikey: process.env.WA_TOOLS_PLATFORM_API_KEY,
            },
            body: {
                API_KEY: process.env.WA_TOOLS_CLIENT_API_KEY,
                WP_CLIENT_ID: process.env.WA_TOOLS_CLIENT_ID,
                TEMPLATE_NAME: TEMPLATE_NAME,
                MOBILE_NO: MOBILE_NO,
                TEMP_PARA: wparams,
                TEMP_LANG: TEMP_LANG
            },
            json: true
        };
        console.log("\n\n TEMP_PARA ARE :", options.body.TEMP_PARA);

        console.log("OPTIONS ARE :", options);

        request.post(options, (error, response, body) => {
            var SEND_TO = options.body.MOBILE_NO
            var PARAMS = JSON.stringify(options.body.TEMP_PARA)
            if (error) {
                console.log(error);
                callback(error);
            }
            else {
                if (response.body.code == 200) {
                    console.log(error);
                    this.executeQueryData(`CALL sp_globalModule_sendWAToolSMS(?,?,?,?,?,?)`, [SEND_TO, PARAMS, TEMPLATE_NAME, '', 'S', JSON.stringify(body)], supportKey, (error, result) => {
                        if (error) {
                            console.log("Error :", body);
                            callback(error);
                        }
                        else {
                            console.log("success :", body);

                            callback(null, body);
                        }
                    })
                } else {
                    this.executeQueryData(`CALL sp_globalModule_sendWAToolSMS(?,?,?,?,?,?)`, [SEND_TO, PARAMS, TEMPLATE_NAME, '', 'F', JSON.stringify(body)], supportKey, (error, result) => {
                        if (error) {
                            callback(error);
                        }
                        else {
                            callback(error);
                        }
                    })

                }
            }
        });

    } catch (error) {
        console.log(error);
        callback(error);
    }
}

exports.sendNotificationToAdmin = async (SENDER_ID, ROLE_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, data3, data4) => {
    const TOPIC_NAME = `role_${ROLE_ID}_channel`
    try {
        const userIds = await channelSubscribedUsers.find({ CHANNEL_NAME: TOPIC_NAME, STATUS: true })
        var data = []
        for (let i = 0; i < userIds.length; i++) {
            data.push([SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, userIds[i].USER_ID, userIds[i].TYPE, 1, 1, TYPE, 'N', TOPIC_NAME])
        }
        if (data.length > 0) {
            this.executeQueryData(`CALL sp_globalModule_BulkInsertNotification(?)`,
                [JSON.stringify(data)], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                    } else {
                        let data3New = (data3 !== null && typeof data3 === 'object') ? JSON.stringify(data3) : data3;
                        firebase.generateNotification(TOPIC_NAME, "", "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, data3New, JSON.stringify(data4), '', '9', 'N', "");
                    }
                }
            );
        } else {
            console.log("\n\n\n\n\n\n\n\n NO channels subscribed users");

        }
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToTerritory = (PINCODE, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, data3, DATA) => {
    console.log("global Module => sendNotificationToTerritory method")
    try {
        const setContext = `
    SET @v_PINCODE = ${PINCODE};
`;
        this.executeQueryData(setContext + ` CALL sp_globalModule_GetActiveTerritoryTechnicians(); `, [], supportKey, (error, resultTechnician1) => {
            if (error) {
                console.log(error);
            }
            else {
                const resultSets = resultTechnician1.filter(r => Array.isArray(r));
                var resultTechnician = resultSets[0]
                if (resultTechnician.length > 0) {
                    async.eachSeries(resultTechnician, (technicians, inner_callback) => {
                        const setContext = `
                                SET @v_TECHNICIAN_ID = ${technicians.TECHNICIAN_ID};
                            `;
                        this.executeQueryData(setContext + ` CALL sp_globaModule_getTechnicianById(); `, [technicians.TECHNICIAN_ID], supportKey, (error, resultEmp1) => {
                            const resultSets = resultEmp1.filter(r => Array.isArray(r));
                            var resultEmp = resultSets[0]

                            if (error || !technicians.TECHNICIAN_ID || technicians.TECHNICIAN_ID.length === 0) {
                                console.log(`Error or no data found for TECHNICIAN_ID ${technicians.TECHNICIAN_ID}:`, error);
                                return inner_callback(error || new Error(`No service data found for SERVICE_ID: ${technicians.TECHNICIAN_ID}`));
                            } else {
                                this.executeQueryData(`CALL sp_globalModule_notificationInsert(?,?,?,?,?,?,?,?,?,?)`, [technicians.TECHNICIAN_ID, TITLE, DESCRIPTION, "", technicians.TECHNICIAN_ID, "T", 1, 1, TYPE, null], supportKey, (error, resultsMember1) => {
                                    if (error) {
                                        console.log(`Error sending notification to technician ${resultEmp[0].NAME}.`, error);
                                        inner_callback(error || new Error(`Error sending notification to technician ${resultEmp[0].NAME}.`));
                                    }
                                    else {
                                        if (resultEmp[0].CLOUD_ID) {
                                            firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, data3, JSON.stringify(DATA), '', '9', '', ATTACHMENT);
                                            console.log(`Notification sent successfully to technician ${resultEmp[0].NAME}.`);
                                            inner_callback();
                                        } else {
                                            console.log('Cloud Id Not Present');
                                            inner_callback();
                                        }
                                    }
                                })

                            }
                        });
                    }, (error) => {
                        if (error) {
                            console.log(`Error sending notification.`);
                        } else {
                            console.log(`Notification sent successfully.`);
                        }
                    });
                } else {
                    console.log(`No technician data found`);
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToTerritoryManager = (TECHNICIAN_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, data3, DATA) => {
    console.log("global Module => sendNotificationToTerritoryManager method")
    data3 ? data3 : '';
    data4 ? data4 : '';
    try {
        const setContext = `
    SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID};
`;

        this.executeQueryData(
            setContext + ` CALL sp_globalModule_GetBackofficeByTechnician(); `, [], supportKey, (error, resultTechnician1) => {
                if (error) {
                    console.log(error);
                }
                else {
                    const resultSets = resultTechnician1.filter(r => Array.isArray(r));
                    var resultTechnician = resultSets[0]
                    if (resultTechnician[0].length > 0) {
                        async.eachSeries(resultTechnician[0], (technicians, inner_callback) => {
                            const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND ID=${technicians.BACKOFFICE_ID}';
    `;
                            this.executeQueryData(setContext + ` CALL sp_userMaster_get(); `, [], supportKey, (error, resultEmp1) => {
                                const resultSets = resultEmp1.filter(r => Array.isArray(r));
                                var resultEmp = resultSets[1]
                                if (error || !technicians.BACKOFFICE_ID || technicians.BACKOFFICE_ID.length === 0) {
                                    console.log(`Error or no data found for BACKOFFICE_ID ${technicians.BACKOFFICE_ID}:`, error);
                                    return inner_callback(error || new Error(`No service data found for SERVICE_ID: ${technicians.BACKOFFICE_ID}`));
                                } else {
                                    this.executeQueryData(`CALL sp_globalModule_notificationInsert(?,?,?,?,?,?,?,?,?,?)`, [technicians.BACKOFFICE_ID, TITLE, DESCRIPTION, "", technicians.BACKOFFICE_ID, "T", 1, 1, TYPE, null], supportKey, (error, resultsMember1) => {
                                        if (error) {
                                            console.log(`Error sending notification to technician ${resultEmp[0].NAME}.`, error);
                                            inner_callback(error || new Error(`Error sending notification to technician ${resultEmp[0].NAME}.`));
                                        }
                                        else {
                                            if (resultEmp[0].CLOUD_ID) {
                                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, JSON.stringify(data3), JSON.stringify(DATA), '', '9', '', ATTACHMENT);
                                                console.log(`Notification sent successfully to technician ${resultEmp[0].NAME}.`);
                                                inner_callback();
                                            } else {
                                                console.log('Cloud Id Not Present');
                                                inner_callback();
                                            }
                                        }
                                    })

                                }
                            });
                        }, (error) => {
                            if (error) {
                                console.log(`Error sending notification.`);
                            } else {
                                console.log(`Notification sent successfully.`);
                            }
                        });
                    } else {
                        console.log(`No technician data found`);
                    }
                }
            });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToCustomer = (SENDER_ID, CUSTOMER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        data3 ? data3 : '';
        data4 ? data4 : '';
        const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND ID=${CUSTOMER_ID}';
    `;
        this.executeQueryData(setContext + ` CALL sp_customer_get(); `, [CUSTOMER_ID], supportKey, (error, resultEmp1) => {
            if (error) {
                console.log(error);
            }
            else {
                const resultSets = resultEmp1.filter(r => Array.isArray(r));
                var resultEmp = resultSets[0]
                this.executeQueryData(`CALL sp_globalModule_notificationInsert(?,?,?,?,?,?,?,?,?,?)`, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, CUSTOMER_ID, "C", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (resultEmp.length > 0) {
                            let data3New = (data3 !== null && typeof data3 === 'object') ? JSON.stringify(data3) : data3;
                            if (resultEmp[0].CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "C", data3New, JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            if (resultEmp[0].W_CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "C", data3New, JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            }
                        }
                    }
                })
            }
        });
    } catch (error) {
        console.log(error);
    }
}


exports.sendNotificationToTechnician = (SENDER_ID, TECHNICIAN_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        data3 ? data3 : '';
        data4 ? data4 : '';
        const setContext = `
                                SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID};
                            `;

        this.executeQueryData(
            setContext + ` CALL sp_globalModule_getTechnicianById(); `, [TECHNICIAN_ID], supportKey, (error, resultEmp1) => {
                if (error) {
                    console.log(error);
                }
                else {
                    const resultSets = resultEmp1.filter(r => Array.isArray(r));
                    var resultEmp = resultSets[0]
                    this.executeQueryData(`CALL sp_globalModule_notificationInsert(?,?,?,?,?,?,?,?,?,?)`, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, TECHNICIAN_ID, "T", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            if (resultEmp.length > 0) {
                                let data3New = (data3 !== null && typeof data3 === 'object') ? JSON.stringify(data3) : data3;

                                if (resultEmp[0].CLOUD_ID) {
                                    firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "T", data3New, JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                                }
                                // if (resultEmp[0].W_CLOUD_ID) {
                                //     firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "T", '', '', '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                                // }
                            }
                        }
                    })

                }
            });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToManager = (SENDER_ID, RECIVER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND ID=${RECIVER_ID}';
    `;
        this.executeQueryData(setContext + ` CALL sp_userMaster_get(); `, [], supportKey, (error, resultEmp1) => {
            if (error) {
                console.log(error);
            }
            else {
                const resultSets = resultEmp1.filter(r => Array.isArray(r));
                var resultEmp = resultSets[1]
                this.executeQueryData(`CALL sp_globalModule_notificationInsert(?,?,?,?,?,?,?,?,?,?) `, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, RECIVER_ID, "B", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (resultEmp.length > 0) {
                            if (resultEmp[0].CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            if (resultEmp[0].W_CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            }
                        }


                    }
                })
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToVendor = (SENDER_ID, RECIVER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        data3 ? data3 : '';
        data4 ? data4 : '';
        const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND ID=${RECIVER_ID}';
    `;
        this.executeQueryData(setContext + ` CALL sp_userMaster_get(); `, [], supportKey, (error, resultEmp1) => {
            if (error) {
                console.log(error);
            }
            else {
                const resultSets = resultEmp1.filter(r => Array.isArray(r));
                var resultEmp = resultSets[1]
                this.executeQueryData(`CALL sp_globalModule_notificationInsert(?,?,?,?,?,?,?,?,?,?) `, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, RECIVER_ID, "V", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (resultEmp.length > 0) {
                            if (resultEmp[0].CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "V", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            if (resultEmp[0].W_CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "V", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            }
                        }
                    }
                })
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToWManager = (SENDER_ID, RECIVER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        data3 ? data3 : '';
        data4 ? data4 : '';
        const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND ID=${RECIVER_ID}';
    `;
        this.executeQueryData(setContext + ` CALL sp_userMaster_get(); `, [], supportKey, (error, resultEmp1) => {
            if (error) {
                console.log(error);
            }
            else {
                const resultSets = resultEmp1.filter(r => Array.isArray(r));
                var resultEmp = resultSets[1]
                this.executeQueryData(`CALL sp_globalModule_notificationInsert(?,?,?,?,?,?,?,?,?,?)`, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, RECIVER_ID, "B", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (resultEmp.length > 0) {
                            if (resultEmp[0].CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '', '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            if (resultEmp[0].W_CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '', '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            }
                        }


                    }
                })
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToDepartment = (SENDER_ID, DEPARTMENT_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, data3, data4) => {
    try {
        data3 ? data3 : '';
        data4 ? data4 : '';
        const setContext = `
    SET @v_DEPARTMENT_ID = ${DEPARTMENT_ID};
`;

        this.executeQueryData(
            setContext + ` CALL sp_globalModule_GetBackofficeByDepartment(); `, [], supportKey, (error, resultbackoffice1) => {
                if (error) {
                    console.log(error);
                }
                else {
                    const resultSets = resultbackoffice1.filter(r => Array.isArray(r));
                    var resultbackoffice = resultSets[0]
                    if (resultbackoffice.length > 0) {
                        async.eachSeries(resultbackoffice, (backoffice, inner_callback) => {
                            const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND ID=${backoffice.BACKOFFICE_ID}';
    `;
                            this.executeQueryData(setContext + ` CALL sp_userMaster_get(); `, [], supportKey, (error, resultEmp1) => {

                                if (error || !backoffice.BACKOFFICE_ID || backoffice.BACKOFFICE_ID.length === 0) {
                                    console.log(`Error or no data found for BACKOFFICE_ID ${backoffice.BACKOFFICE_ID}:`, error);
                                    return inner_callback(error || new Error(`No service data found for SERVICE_ID: ${backoffice.BACKOFFICE_ID}`));
                                } else {
                                    const resultSets = resultEmp1.filter(r => Array.isArray(r));
                                    var resultEmp = resultSets[1]
                                    this.executeQueryData(`ICALL sp_globalModule_notificationInsert(?,?,?,?,?,?,?,?,?,?)`, [SENDER_ID, TITLE, DESCRIPTION, "", backoffice.BACKOFFICE_ID, "TC", 1, 1, "B", null], supportKey, (error, resultsMember1) => {
                                        if (error) {
                                            console.log(`Error sending notification to technician ${resultEmp[0].NAME}.`, error);
                                            inner_callback(error || new Error(`Error sending notification to department ${resultEmp[0].NAME}.`));
                                        }
                                        else {
                                            if (resultEmp[0].CLOUD_ID) {
                                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, '', '', '', '9');
                                                console.log(`Notification sent successfully to technician ${resultEmp[0].NAME}.`);
                                                inner_callback();
                                            } else {
                                                console.log('Cloud Id Not Present');
                                                inner_callback();
                                            }
                                        }
                                    })

                                }
                            });
                        }, (error) => {
                            if (error) {
                                console.log(`Error sending notification.`);
                            } else {
                                console.log(`Notification sent successfully.`);
                            }
                        });
                    } else {
                        console.log(`No technician data found`);
                    }
                }
            });
    } catch (error) {
        console.log(error);
    }
}

// extraRecipients (optional): { cc: [...] } - appended to the CC the template mapping
// resolves to (SPOC_EMAILS), so the mail still goes TO the customer. Used by the work order
// cancellation flow to copy in the customer's mapped service desk team.
exports.sendDynamicEmail = (templateID, referenceId, supportKey, extraRecipients) => {
    console.log("in senddynamic ", templateID)
    // ⭐ Format date exactly as DB UTC + append (UTC)
    const formatDateTimeUTC = (value) => {
        if (!value) return "";
        const d = new Date(value);
        if (isNaN(d)) return value;

        const pad = (n) => (n < 10 ? "0" + n : n);

        const formatted =
            d.getUTCFullYear() +
            "-" +
            pad(d.getUTCMonth() + 1) +
            "-" +
            pad(d.getUTCDate()) +
            " " +
            pad(d.getUTCHours()) +
            ":" +
            pad(d.getUTCMinutes()) +
            ":" +
            pad(d.getUTCSeconds());

        return formatted + " (UTC)";
    };

    // 1️⃣ Fetch the template
    this.executeQueryData(`
        call sp_globalModule_GetEmailTemplate(?)`,
        [templateID],
        supportKey,
        (error, template1) => {
            var template = template1[0]
            if (error || !template.length) return;

            let { TEMPLATE_CATEGORY_ID, SUBJECT, SUBJECT_VALUES, BODY, BODY_VALUES, ATTACHMENTS } = template[0];

            BODY_VALUES = JSON.parse(BODY_VALUES || "[]");
            SUBJECT_VALUES = JSON.parse(SUBJECT_VALUES || "[]");

            // 2️⃣ Fetch placeholder mappings
            this.executeQueryData(`
                call sp_globalModule_GetPlaceholderMappings(?)`,
                [TEMPLATE_CATEGORY_ID],
                supportKey,
                (error, mappings1) => {
                    var mappings = mappings1[0]
                    if (error || !mappings.length) return;

                    let tableQueries = {};
                    for (let { TABLE_COLUMN, TABLE_NAME } of mappings) {
                        if (!tableQueries[TABLE_NAME]) tableQueries[TABLE_NAME] = [];
                        tableQueries[TABLE_NAME].push(TABLE_COLUMN);
                    }

                    let values = {};
                    let queriesExecuted = 0;
                    let totalQueries = Object.keys(tableQueries).length;

                    let recipientEmail = "";
                    let CCEmail = "";

                    // 3️⃣ Fetch required table values
                    for (let table in tableQueries) {
                        this.executeQueryData(
                            `CALL sp_globalModule_GetDynamicTableData(?, ?, ?)`,
                            [
                                table,
                                tableQueries[table].join(", "),
                                referenceId
                            ],
                            supportKey,
                            (error, data1) => {
                                var data = data1[0]
                                if (data?.length) {
                                    Object.assign(values, data[0]);
                                    if (
                                        data[0].EMAIL_ID ||
                                        data[0].TECHNICIAN_EMAIL_ID ||
                                        data[0].ADMIN_EMAIL_IDS ||
                                        data[0].PINCODE_TECHNICIAN_EMAIL ||
                                        data[0].ROLE_25_EMAIL_IDS ||
                                        data[0].TRANSFER_USER_EMAIL ||
                                        data[0].ALL_TECHNICINANS
                                    ) {
                                        recipientEmail =
                                            normalizeEmails(data[0].EMAIL_ID) ||
                                            normalizeEmails(data[0].TECHNICIAN_EMAIL_ID) ||
                                            normalizeEmails(data[0].ADMIN_EMAIL_IDS) ||
                                            normalizeEmails(data[0].PINCODE_TECHNICIAN_EMAIL) ||
                                            normalizeEmails(data[0].ROLE_25_EMAIL_IDS) ||
                                            normalizeEmails(data[0].TRANSFER_USER_EMAIL) ||
                                            normalizeEmails(data[0].ALL_TECHNICINANS);
                                    }


                                    CCEmail = data[0].SPOC_EMAILS ? data[0].SPOC_EMAILS.split(",") : [];
                                }

                                queriesExecuted++;

                                if (queriesExecuted !== totalQueries) return;

                                // 4️⃣ Replace BODY placeholders
                                BODY_VALUES.forEach((key, index) => {
                                    const regex = new RegExp(`{{\\s*${index + 1}\\s*}}`, 'g');
                                    BODY = BODY.replace(regex, `{{${key}}}`);
                                });

                                if (templateID == 75 || templateID == 76 || templateID == 77 || templateID == 78 || templateID == 78 || templateID == 80 || templateID == 24) {
                                    // THIS CONDITION ID FOR NEW FUNCTONALITY
                                    if (values.URL) {
                                        values.URL = `
 
  <p>
<a href=${process.env.FILE_URL}/Ticket/${values.URL} style="color:#b30920;font-weight:bold;text-decoration:none;">
      Click here to download the attachment
</a>
</p>`;
                                    }

                                }
                                console.log("templateID", templateID)
                                Object.keys(values).forEach((key) => {
                                    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
                                    let value = values[key];

                                    // ❗ DO NOT CONVERT OR ADD (UTC) FOR THIS KEY
                                    if (key === "SCHEDULED_DATETIME") {
                                        BODY = BODY.replace(regex, value ?? "");
                                        return;
                                    }

                                    // ⭐ DATE / DATETIME detection
                                    if (
                                        value instanceof Date ||
                                        (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/))
                                    ) {
                                        value = formatDateTimeUTC(value);
                                    }

                                    BODY = BODY.replace(regex, value ?? "");
                                });

                                // 5️⃣ Replace SUBJECT placeholders
                                SUBJECT_VALUES.forEach((key, index) => {
                                    const regex = new RegExp(`{{\\s*${index + 1}\\s*}}`, 'g');
                                    SUBJECT = SUBJECT.replace(regex, `{{${key}}}`);
                                });

                                Object.keys(values).forEach((key) => {
                                    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
                                    let value = values[key];

                                    // ❗ DO NOT ADD UTC FOR SCHEDULED_DATETIME
                                    if (key === "SCHEDULED_DATETIME") {
                                        SUBJECT = SUBJECT.replace(regex, value ?? "");
                                        return;
                                    }

                                    if (
                                        value instanceof Date ||
                                        (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/))
                                    ) {
                                        value = formatDateTimeUTC(value);
                                    }

                                    SUBJECT = SUBJECT.replace(regex, value ?? "");
                                });

                                // 6️⃣ Send email
                                console.log("recipientEmail", recipientEmail)

                                // Caller supplied CC additions (the customer's mapped service desk
                                // team). Merged into the template's own CC so the customer stays on
                                // TO and everyone lands on a single mail. sendEmail de-duplicates
                                // CC against TO, so an address on both sides is safe.
                                const extraCC = (normalizeEmails(extraRecipients && extraRecipients.cc) || [])
                                    .map(email => String(email).trim())
                                    .filter(Boolean);

                                if (extraCC.length) {
                                    console.log("extra CC recipients", extraCC);
                                    CCEmail = [...(Array.isArray(CCEmail) ? CCEmail : []), ...extraCC];
                                }

                                if (!recipientEmail || !recipientEmail.length) {
                                    // No customer address on the template - still reach the mapped team.
                                    if (extraCC.length) {
                                        this.sendEmail(
                                            extraCC,
                                            [],
                                            SUBJECT,
                                            BODY,
                                            template[0].TEMPLATE_NAME,
                                            ATTACHMENTS,
                                            () => { }
                                        );
                                    }
                                    return;
                                }
                                if (recipientEmail.length > 1) {
                                    recipientEmail.forEach((email) => {
                                        this.sendEmail(
                                            [email],
                                            CCEmail,
                                            SUBJECT,
                                            BODY,
                                            template[0].TEMPLATE_NAME,
                                            ATTACHMENTS,
                                            () => { }
                                        );
                                    });
                                } else {
                                    this.sendEmail(
                                        recipientEmail,
                                        CCEmail,
                                        SUBJECT,
                                        BODY,
                                        template[0].TEMPLATE_NAME,
                                        ATTACHMENTS,
                                        () => { }
                                    );
                                }
                            }
                        );
                    }
                }
            );
        }
    );
};


exports.sendDynamicEmailORG = (templateID, referenceId, supportKey) => {
    console.log("in senddynamic ", templateID)
    // For backward compatibility, we can call the original function if the new one is not needed
};


function normalizeEmails(value) {
    if (!value) return null;

    // If already an array (JSON field)
    if (Array.isArray(value)) return value;

    // If it is a JSON string
    if (typeof value === "string" && value.trim().startsWith("[")) {
        try {
            return JSON.parse(value);
        } catch (e) {
            // If parsing fails, fall back to split
        }
    }

    // Normal comma-separated string
    return value.split(",");
}

exports.sendMultipleEmail = (to, cc, subject, body, TEMPLATE_NAME, ATTACHMENTS, callback) => {
    // console.log("to",to)
    // console.log("cc",cc)
    const systemDate = this.getSystemDate();
    const supportKey = 'mailshoottickdeskgttdata'
    var request = require('request');

    var options = {
        url: process.env.GM_API + 'sendMultipleEmailChain',
        headers: {
            "apikey": process.env.GM_API_KEY,
            "supportkey": process.env.SUPPORT_KEY,
            "applicationkey": process.env.APPLICATION_KEY
        },
        body: {
            KEY: process.env.EMAIL_SERVER_KEY,
            TO: to,
            CC: cc,
            SUBJECT: subject,
            BODY: body,
            inReplyMessageId: "",
            inReferenceMessageIds: ""
        },
        json: true
    }
    // console.log("body123456",options)
    request.post(options, (error, response, body) => {
        if (error) {
            console.log("request error -send email ", error, response, body);
            this.executeQueryData(
                `CALL sp_globalModule_AddEmailTransactionHistory(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    to,
                    JSON.stringify(body), // Serialized PARAMS
                    TEMPLATE_NAME,
                    subject,
                    JSON.stringify(body), // Serialized BODY to avoid invalid SQL
                    ATTACHMENTS || '',    // Ensure ATTACHMENTS is not undefined
                    JSON.stringify(response.body), // Serialized RESPONSE_DATA
                    0,                    // STATUS
                    1                     // CLIENT_ID
                ],
                supportKey,
                (error, result) => {
                    if (error) {
                        console.log("Error :", error);
                        callback(error);
                    } else {
                        console.log(result);
                        callback(null, response.body);
                    }
                }
            );
        } else {

            this.executeQueryData(
                `CALL sp_globalModule_AddEmailTransactionHistory(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    to,
                    JSON.stringify(body), // Serialized PARAMS
                    TEMPLATE_NAME,
                    subject,
                    JSON.stringify(body), // Serialized BODY to avoid invalid SQL
                    ATTACHMENTS || '',    // Ensure ATTACHMENTS is not undefined
                    JSON.stringify(response.body), // Serialized RESPONSE_DATA
                    1,                    // STATUS
                    1                     // CLIENT_ID
                ],
                supportKey,
                (error, result) => {
                    if (error) {
                        console.log("Error :", error);
                        callback(error);
                    } else {
                        console.log(result);
                        callback(null, response.body);
                    }
                }
            );

        }
    });
}

exports.sendEmail = (to, cc, subject, body, TEMPLATE_NAME, ATTACHMENTS, callback) => {
    console.log("to  ", to)
    console.log("cc  ", cc)
    console.log("TEMPLATE_NAME  ", TEMPLATE_NAME)
    // console.log("body ", body)
    console.log("Mail subject ", subject)

    // --- CLEANUP START ---
    // SendGrid rejects the whole message if an address appears more than once
    // across TO/CC/BCC, and it compares case-insensitively. So normalise
    // (trim + lowercase key) before de-duplicating, otherwise entries that
    // differ only by case/whitespace slip through and the send fails with
    // "Each email address in the personalization block should be unique".
    const cleanList = (value) => {
        const arr = Array.isArray(value) ? value : (value ? [value] : []);
        return arr
            .filter(Boolean)
            .map(e => String(e).trim())
            .filter(e => e !== '');
    };

    let toList = cleanList(to);
    let ccList = cleanList(cc);

    // 1️⃣ Remove duplicates inside TO (case-insensitive)
    const seenTo = new Set();
    toList = toList.filter(email => {
        const key = email.toLowerCase();
        if (seenTo.has(key)) return false;
        seenTo.add(key);
        return true;
    });

    // 2️⃣ Remove duplicates inside CC and drop anything already in TO
    const seenCc = new Set();
    ccList = ccList.filter(email => {
        const key = email.toLowerCase();
        if (seenTo.has(key) || seenCc.has(key)) return false;
        seenCc.add(key);
        return true;
    });

    // Assign back to original variables
    to = toList;
    cc = ccList;
    // --- CLEANUP END ---

    console.log("Final TO:", to);
    console.log("Final CC:", cc);


    sendEmailCallback(
        to,
        cc,
        subject,
        body,
        (err, response) => {
            if (err) {
                console.error('Callback Error:', err.response?.body || err);
                callback("EMAIL SEND ERROR.");
            } else {
                console.log('Callback Success:', response[0].statusCode, response);
                this.executeQueryData(
                    `CALL sp_globalModule_AddEmailTransactionHistory(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        to,
                        JSON.stringify(body), // Serialized PARAMS
                        TEMPLATE_NAME,
                        subject,
                        JSON.stringify(body), // Serialized BODY to avoid invalid SQL
                        ATTACHMENTS || '',    // Ensure ATTACHMENTS is not undefined
                        JSON.stringify(response), // Serialized RESPONSE_DATA
                        ((response[0].statusCode == 200 || response[0].statusCode == 202) ? 1 : 0),                    // STATUS
                        1                     // CLIENT_ID
                    ],
                    supportKey,
                    (error, result) => {
                        if (error) {
                            console.log("Error :", error);
                            callback(error);
                        } else {
                            console.log(result);
                            callback(null, response.body);
                        }
                    }
                );

            }
        }
    );
}

exports.sendNotificationToWManager = (TITLE, DESCRIPTION, ATTACHMENT, MEDIA_TYPE, data3, data4, CLOUD_ID, W_CLOUD_ID) => {
    try {
        data3 ? data3 : '';
        data4 ? data4 : '';
        if (CLOUD_ID) {
            firebase.generateNotification("", CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
        }
        if (W_CLOUD_ID) {
            firebase.generateNotification("", W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
        }
    } catch (error) {
        console.log(error);
    }
}

exports.userloginlogs = (USER_ID, USER_TYPE, DATE_TIME, STATUS, supportKey) => {
    try {
        this.executeQueryData(`CALL sp_globalModule_AddUserLoginLog(?, ?, ?, ?, ?)`, [USER_ID, USER_TYPE, DATE_TIME, STATUS, 1], supportKey, (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log("userloginlogs");
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendEmailSendGrid = (to, cc, subject, body, TEMPLATE_NAME, ATTACHMENTS, callback) => {
    console.log("to  ", to)
    console.log("cc  ", cc)
    console.log("body ", body)
    console.log("Mail subject ", subject)

    // Usage
    sendEmailCallback(
        to,
        cc,
        subject,
        body,
        (err, response) => {
            if (err) {
                console.error('Callback Error:', err.response?.body || err);
                callback("EMAIL SEND ERROR.");
            } else {
                console.log('Callback Success:', response[0].statusCode, response);
                this.executeQueryData(
                    `CALL sp_globalModule_AddEmailTransactionHistory(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        to,
                        JSON.stringify(body), // Serialized PARAMS
                        TEMPLATE_NAME,
                        subject,
                        JSON.stringify(body), // Serialized BODY to avoid invalid SQL
                        ATTACHMENTS || '',    // Ensure ATTACHMENTS is not undefined
                        JSON.stringify(response), // Serialized RESPONSE_DATA
                        ((response[0].statusCode == 200 || response[0].statusCode == 202) ? 1 : 0),                    // STATUS
                        1                     // CLIENT_ID
                    ],
                    supportKey,
                    (error, result) => {
                        if (error) {
                            console.log("Error :", error);
                            callback(error);
                        } else {
                            console.log(result);
                            callback(null, response.body);
                        }
                    }
                );

            }
        }
    );


}

function sendEmailCallback(to, cc, subject, html, callback) {
    const msg = {
        to,
        cc,
        from: process.env.FROM_EMAIL,
        subject,
        html
    };

    sgMail
        .send(msg)
        .then(response => callback(null, response))
        .catch(error => callback(error));
}

exports.sendNotificationToChannel = async (SENDER_ID, TOPIC_NAME, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        data3 ? data3 : '';
        data4 ? data4 : '';
        const userIds = await channelSubscribedUsers.find({ CHANNEL_NAME: TOPIC_NAME, STATUS: true })
        var data = []
        for (let i = 0; i < userIds.length; i++) {
            data.push([SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, userIds[i].USER_ID, userIds[i].TYPE, 1, 1, TYPE, MEDIA_TYPE, TOPIC_NAME])
        }
        console.log("\n\n\n\n\n\n\n\n channels subscribed users", userIds);
        if (data.length > 0) {
            this.executeQueryData(`CALL sp_globalModule_BulkInsertNotification(?)`,
                [JSON.stringify(data)], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                    } else {
                        let data3New = (data3 !== null && typeof data3 === 'object') ? JSON.stringify(data3) : data3;
                        firebase.generateNotification(TOPIC_NAME, "", "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, data3New, JSON.stringify(data4), '', '9', MEDIA_TYPE, "");
                    }
                }
            );
        } else {
            // firebase.generateNotification(TOPIC_NAME, "", "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, data3, JSON.stringify(data4), '', '9', MEDIA_TYPE, "");
            console.log("\n\n\n\n\n\n\n\n NO channels subscribed users");

        }
    } catch (error) {
        console.log("Error in send notification:", error);
    }
}


/* CC list for a work order's mails: everyone mapped to the order's customer under the
   customer's "Map Service Desk Team" tab (customer_spoc_mapping). Feed straight into
   sendDynamicEmail's extraRecipients.
   Always calls back with an object, empty list on failure, so mailing never blocks the
   flow. The stored procedure keeps its original cancellation name because it is
   deployed under that name, but it takes any ORDER_ID and is used for creation mails
   too. getCancellationEmailRecipients below is the old name, kept so nothing outside
   this repo breaks. */
exports.getMappedServiceDeskRecipients = (ORDER_ID, supportKey, callback) => {
    try {
        this.executeQueryData(
            `CALL sp_globalModule_getCancellationEmailRecipients(?)`,
            [ORDER_ID],
            supportKey,
            (error, data) => {
                if (error) {
                    console.log("getMappedServiceDeskRecipients error", error);
                    return callback({ cc: [] });
                }

                const row = data && data[0] && data[0][0] ? data[0][0] : {};

                callback({ cc: normalizeEmails(row.CC_EMAILS) || [] });
            }
        );
    } catch (error) {
        console.log("getMappedServiceDeskRecipients error", error);
        callback({ cc: [] });
    }
};

// Previous name of the helper above.
exports.getCancellationEmailRecipients = exports.getMappedServiceDeskRecipients;

exports.sendNotificationToSPOCChannel = async (
    SENDER_ID, ORDER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE,
    supportKey, MEDIA_TYPE, data3, data4
) => {
    try {
        console.log("sendNotificationToSPOCChannel")
        data3 ? data3 : '';
        data4 ? data4 : '';
        const query = `
              CALL sp_globalModule_getOrderSpocDetails(?)
        `;

        this.executeQueryData(query, [ORDER_ID], supportKey, (error, data) => {
            if (error) {
                console.log(error);
                return;
            }

            let results = data[0];
            if (!results || results.length === 0) {
                return;
            }

            console.log("SPOC DETAILS", results);

            let CUSTOMER_ID = results[0].CUSTOMER_ID;
            let spocJson = results[0].CUSTOMER_LEVEL_SPOC;

            if (!spocJson || spocJson.length === 0) {
                return;
            }

            // ⬅️ MUST PARSE JSON
            let spocList = JSON.parse(spocJson);

            for (let element of spocList) {
                let TOPIC_NAME = `customer_spoc_${CUSTOMER_ID}_${element.BACKOFFICE_ID}_channel`;

                let insertData = [
                    SENDER_ID,
                    TITLE,
                    DESCRIPTION,
                    ATTACHMENT,
                    element.BACKOFFICE_ID,
                    "B",
                    1,
                    1,
                    TYPE,
                    MEDIA_TYPE,
                    TOPIC_NAME
                ];



                // ⬅️ IMPORTANT: wrap in array for VALUES ?
                this.executeQueryData(
                    `CALL sp_globalModule_insertNotificationMaster(?,?,?,?,?,?,?,?,?,?,?)`,
                    insertData,
                    supportKey,
                    (error, insertResult) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log("\n\n\n\n\n Notification initiated for SPOC channel:", TOPIC_NAME, "with data:", TOPIC_NAME,
                                "",
                                "N",
                                TITLE,
                                DESCRIPTION,
                                ATTACHMENT,
                                TYPE,
                                data3,
                                JSON.stringify(data4),
                                "",
                                "9",
                                MEDIA_TYPE,
                                "");
                            firebase.generateNotification(
                                TOPIC_NAME,
                                "",
                                "N",
                                TITLE,
                                DESCRIPTION,
                                ATTACHMENT,
                                TYPE,
                                data3,
                                JSON.stringify(data4),
                                "",
                                "9",
                                MEDIA_TYPE,
                                "\n\n\n\n\n"
                            );
                        }
                    }
                );
            }
        });

    } catch (error) {
        console.log("Error in send notification:", error);
    }
};

exports.sendNotificationToSPOCrOL25Channel = async (
    SENDER_ID, ORDER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE,
    supportKey, MEDIA_TYPE, data3, data4
) => {
    try {
        data3 ? data3 : '';
        data4 ? data4 : '';
        const query = `
            CALL sp_globalModule_getOrderSpocDetails(?)
        `;

        this.executeQueryData(query, [ORDER_ID], supportKey, (error, data) => {
            if (error) {
                console.log(error);
                return;
            }
            let results = data[0];
            if (!results || results.length === 0) {
                return;
            }

            console.log("SPOC DETAILS", results);

            let CUSTOMER_ID = results[0].CUSTOMER_ID;
            let spocJson = results[0].CUSTOMER_LEVEL_SPOC;

            if (!spocJson || spocJson.length === 0) {
                return;
            }

            let spocList = JSON.parse(spocJson);

            for (let element of spocList) {
                const setContext = `
        SET @v_PAGE_INDEX =0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'DESC';
        SET @v_FILTER = ' AND USER_ID=${element.BACKOFFICE_ID}';
    `;
                this.executeQueryData(
                    setContext + ' CALL sp_backofficeTeam_get()',
                    [],
                    supportKey,
                    (error, result1) => {
                        if (error) {
                            console.log(error);
                        } else {
                            const resultSets = result1.filter(r => Array.isArray(r));
                            var result = resultSets[0]

                            if (result[0].ROLE_ID == 25) {
                                let TOPIC_NAME = `customer_spoc_${CUSTOMER_ID}_${element.BACKOFFICE_ID}_channel`;

                                let insertData = [
                                    SENDER_ID,
                                    TITLE,
                                    DESCRIPTION,
                                    ATTACHMENT,
                                    element.BACKOFFICE_ID,
                                    "B",
                                    1,
                                    1,
                                    TYPE,
                                    MEDIA_TYPE,
                                    TOPIC_NAME
                                ];

                                // ⬅️ IMPORTANT: wrap in array for VALUES ?
                                this.executeQueryData(
                                    `CALL sp_globalModule_insertNotificationMaster(?,?,?,?,?,?,?,?,?,?,?)`,
                                    [insertData],
                                    supportKey,
                                    (error, insertResult) => {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            firebase.generateNotification(
                                                TOPIC_NAME,
                                                "",
                                                "N",
                                                TITLE,
                                                DESCRIPTION,
                                                ATTACHMENT,
                                                TYPE,
                                                data3,
                                                JSON.stringify(data4),
                                                "",
                                                "9",
                                                MEDIA_TYPE,
                                                ""
                                            );
                                        }
                                    }
                                );
                            }

                        }
                    }
                );

            }
        });

    } catch (error) {
        console.log("Error in send notification:", error);
    }
};

exports.commitConnectionforImport = (connection) => {
    return new Promise((resolve, reject) => {
        connection.commit(err => {
            if (err) return reject(err);
            resolve(); // DO NOT close here
        });
    });
};

exports.rollbackConnectionforImport = (connection) => {
    return new Promise(resolve => {
        connection.rollback(() => resolve()); // DO NOT close
    });
};

exports.closeConnectionImport = (connection) => {
    try {
        if (connection) connection.end();
    } catch (e) {
        console.error("Close connection error", e);
    }
};


exports.geocodeAddress = async function (fullAddress) {
    try {
        if (!fullAddress || !fullAddress.trim()) {
            console.warn("❌ Empty address received");
            return fail("EMPTY_ADDRESS");
        }

        const normalizedSearchKey = fullAddress
            .replace(/\s+/g, " ")
            .replace(/,+/g, ",")
            .trim();

        console.log("🔎 Searching:", normalizedSearchKey);

        const geoResponse = await axios.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    address: normalizedSearchKey,
                    key: 'AIzaSyDT0rIRA3oOkwIhszO4xoZIiYfzkTc_4WY',
                    region: "in"   // improves India accuracy
                },
                timeout: 8000
            }
        );

        const status = geoResponse?.data?.status;
        console.log("📡 Google Status:", status);

        // ---- Handle Google errors properly ----
        if (status === "REQUEST_DENIED") {
            console.error("🔥 API KEY ISSUE:", geoResponse.data.error_message);
            return fail("API_KEY_ERROR");
        }

        if (status === "OVER_QUERY_LIMIT") {
            console.error("🔥 Quota exceeded");
            return fail("QUOTA_EXCEEDED");
        }

        if (status === "ZERO_RESULTS") {
            console.warn("⚠ No results found");
            return fail("NO_RESULTS");
        }

        if (status !== "OK") {
            console.error("🔥 Unknown Google error:", geoResponse.data);
            return fail(status);
        }

        // ---- Extract Best Result ----
        const result = geoResponse.data.results[0];

        const location = result.geometry.location;

        const response = {
            latitude: location.lat,
            longitude: location.lng,
            formattedAddress: result.formatted_address,
            accuracy: result.geometry.location_type, // ROOFTOP / APPROXIMATE
            status: "SUCCESS"
        };

        console.log("📍 Coordinates:", response);
        console.log("***********************************");

        return response;

    } catch (error) {
        console.error("🔥 Geocode Exception:", error.message);
        return fail("SERVER_ERROR");
    }
};

function fail(reason) {
    return {
        latitude: null,
        longitude: null,
        formattedAddress: null,
        accuracy: null,
        status: reason
    };
}

exports.hashPassword = (password) => {
  return bcrypt.hash(password, saltRounds)
    .then((hashed) => {
      return hashed;
    })
    .catch((error) => {
      console.log(error);
      throw error;
    });
};




/**
 * Offline-capable event timestamps.
 *
 * The technician app can start / pause / resume / complete a work order with no
 * network coverage. Those actions are queued on the device and replayed when the
 * technician is back in signal - possibly hours later. Stamping them with
 * getSystemDate() at that point records when the *sync* happened, not when the
 * work happened, which is why start/pause/resume used to land on the same
 * minute for an offline job.
 *
 * The app therefore sends the device time with every status change:
 *   JOB_STARTED_DATETIME      'YYYY-MM-DD HH:mm:ss' in UTC (also inside JOB_DATA[0])
 *   EVENT_AT_UTC              ISO-8601 UTC of the moment the technician tapped
 *   EVENT_AT_UTC_CORRECTED    the same instant adjusted for measured clock drift
 *   DEVICE_CLOCK_TRUSTED      false when the device clock is more than 3 min out
 *   CAPTURED_OFFLINE          true when the action was performed with no coverage
 *
 * A device clock is not trustworthy on its own, so the value is validated before
 * it is accepted; anything missing, unparseable, in the future or implausibly
 * old falls back to server time.
 */

/** A device time may run this far ahead of the server before we reject it. */
const EVENT_DATE_MAX_FUTURE_MS = 2 * 60 * 1000;
/** Queued work older than this is treated as a broken clock, not a long trip. */
const EVENT_DATE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const toUTCSqlDate = function (date) {
    const year = date.getUTCFullYear();
    const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
    const day = ("0" + date.getUTCDate()).slice(-2);
    const hours = ("0" + date.getUTCHours()).slice(-2);
    const minutes = ("0" + date.getUTCMinutes()).slice(-2);
    const seconds = ("0" + date.getUTCSeconds()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Picks the device-supplied timestamp for `columnName` out of the request body.
 *
 * Only offline-aware clients are trusted here. JOB_DATA[0] is the full job
 * record as the client last saw it, so it can carry a stale JOB_*_DATETIME from
 * an earlier cycle; it is read only when the client explicitly declared that
 * this is the column it stamped for this event (STATUS_DATETIME_COLUMN). Any
 * other caller - admin panel, older app build - gets server time exactly as
 * before.
 */
const pickEventCandidate = function (body, columnName) {
    const isOfflineAwareClient = Boolean(body.EVENT_AT_UTC || body.OFFLINE_TXN_ID);
    if (!isOfflineAwareClient) {
        return null;
    }

    // A device that knows its own clock is wrong tells us by how much.
    if (body.DEVICE_CLOCK_TRUSTED === false && body.EVENT_AT_UTC_CORRECTED) {
        return body.EVENT_AT_UTC_CORRECTED;
    }

    const declaredColumn = body.STATUS_DATETIME_COLUMN;
    if (columnName && declaredColumn === columnName) {
        if (body[columnName]) {
            return body[columnName];
        }
        if (Array.isArray(body.JOB_DATA) && body.JOB_DATA[0] && body.JOB_DATA[0][columnName]) {
            return body.JOB_DATA[0][columnName];
        }
    }

    // No column-specific stamp (a report submission, say) - use the moment the
    // technician performed the action.
    return body.EVENT_AT_UTC || null;
};

/**
 * Same resolution as resolveEventDate, returned as a Date rather than a SQL
 * string - for the Mongo activity log, which stores a real date. Keeping both
 * on one source means a log line can never disagree with the JOB_*_DATETIME
 * column written by the same request.
 */
exports.resolveEventDateObject = function (body, columnName) {
    const resolved = exports.resolveEventDate(body, columnName);
    const parsed = new Date(String(resolved).replace(' ', 'T') + 'Z');
    return isNaN(parsed.getTime()) ? new Date() : parsed;
};

/**
 * Returns the UTC 'YYYY-MM-DD HH:mm:ss' this event should be recorded at:
 * the technician's device time when it is present and plausible, otherwise
 * server time exactly as before. Safe to use on every status change - a client
 * that sends nothing keeps the old behaviour.
 */
exports.resolveEventDate = function (body, columnName) {
    const systemDate = exports.getSystemDate();
    if (!body || typeof body !== 'object') {
        return systemDate;
    }

    const candidate = pickEventCandidate(body, columnName);
    if (!candidate) {
        return systemDate;
    }

    // 'YYYY-MM-DD HH:mm:ss' carries no zone marker but is UTC by contract.
    const normalised = typeof candidate === 'string' && candidate.indexOf('T') === -1
        ? candidate.trim().replace(' ', 'T') + 'Z'
        : candidate;

    const eventMs = Date.parse(normalised);
    if (isNaN(eventMs)) {
        console.warn(`[eventDate] ${columnName}: unparseable device time "${candidate}", using server time`);
        return systemDate;
    }

    const now = Date.now();
    if (eventMs > now + EVENT_DATE_MAX_FUTURE_MS) {
        console.warn(`[eventDate] ${columnName}: device time "${candidate}" is in the future, using server time`);
        return systemDate;
    }
    if (eventMs < now - EVENT_DATE_MAX_AGE_MS) {
        console.warn(`[eventDate] ${columnName}: device time "${candidate}" is implausibly old, using server time`);
        return systemDate;
    }

    const resolved = toUTCSqlDate(new Date(eventMs));
    if (resolved !== systemDate) {
        console.log(`[eventDate] ${columnName}: using device time ${resolved} (server time ${systemDate}, offlineCapture=${body.CAPTURED_OFFLINE === true})`);
    }
    return resolved;
};
