var scheduler = require('node-schedule');
const mm = require('../utilities/globalModule');
const db = require('../utilities/globalModule');
const fs = require('fs')
const async = require('async');
const TechnicianActivityCalendar = require('../modules/technicianActivityCalender');
const TechnicianDayLog = require('../modules/technicainDayLog');
var log = "schedularLog";
const dbm = require('../utilities/dbMongo')
exports.schedulerJob = (req, res) => {
    try {
        console.log("scheduler started");
        var j = scheduler.scheduleJob(" */1 * * * *", getSchedulerMaster);
    } catch (error) {
        console.log(error);
    }
}

function getSchedulerMaster() {
    try {

        var systemdate = mm.getSystemDate();
        var todayDate = new Date(systemdate);

        var dayName = todayDate.toString().split(' ')[0];

        var dateTime = systemdate.toString().split(' ');
        var dateParts = dateTime[0].split('-');
        var timeNow = dateTime[1];

        var day = dateParts[2];                   // 25
        var monthDay = dateParts[1] + "-" + dateParts[2];  // 06-25
        var fullDate = dateTime[0];               // 2026-06-25

        // Next execution time (+1 minute)
        var nextTimeObj = new Date(todayDate.getTime() + (60 * 1000));
        var nextTime =
            ("0" + nextTimeObj.getHours()).slice(-2) + ":" +
            ("0" + nextTimeObj.getMinutes()).slice(-2) + ":" +
            ("0" + nextTimeObj.getSeconds()).slice(-2);

        mm.executeQueryData(
            `CALL sp_scheduler_GetSchedulerMaster(?, ?, ?, ?, ?, ?)`,
            [timeNow, dayName, day, monthDay, fullDate, nextTime],
            log,
            (error, results) => {
                console.log("results", results)
                if (error) {
                    console.log(error);
                } else {

                    if (results[0].length > 0) {

                        for (let i = 0; i < results[0].length; i++) {
                            executeTask(results[0][i]);
                        }

                    } else {
                        console.log("No record");
                    }

                }

            }
        );

    } catch (error) {
        console.log(error);
    }
}

function executeTask(data) {
    var supportKey = "schedular"
    var systemDate = mm.getSystemDate();
    // var today = systemDate.split(' ')[0];
    var CURRENT_TIME = mm.getSystemDate().split(' ')[1]
    CURRENT_TIME = CURRENT_TIME.slice(0, 5) + ":00";
    var today = new Date();
    var shortDayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    var day = shortDayNames[today.getDay()];
    switch (data.NOTIFICATION_TYPE_ID) {

        // FOR technician day start and end by system
        case 1:
            try {
                const connection = mm.openConnection();
                mm.executeDML('CALL sp_GetActiveTechnicians()', [], supportKey, connection, (error, technicianIds1) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.error('Failed to retrieve technician IDs:', error);
                        return;
                    }
                    var technicianIds = technicianIds1[0]
                    if (!technicianIds || technicianIds.length === 0) {
                        mm.rollbackConnection(connection);
                        console.log('No Technician IDs found.');
                        return;
                    }

                    let today = new Date();
                    let todayDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

                    let currentWeekDay = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][today.getDay()];

                    async.eachSeries(technicianIds, function processTechnician(technician, inner_callback) {
                        let TECHNICIAN_ID = technician.ID;
                        TechnicianActivityCalendar.find({
                            TECHNICIAN_ID,
                            $expr: {
                                $eq: [
                                    { $dateToString: { format: "%Y-%m-%d", date: "$DATE_OF_MONTH" } },
                                    todayDate
                                ]
                            }
                        }).then((activityData) => {
                            if (activityData.length > 0) {
                                let activity = activityData[0];
                                if (activity.DAY_START_TIME === CURRENT_TIME) {
                                    mm.executeDML('CALL sp_CheckStartTrack(?)', [TECHNICIAN_ID], supportKey, connection, (error, trackData1) => {
                                        var trackData = trackData1[0]
                                        if (error || (trackData && trackData.length > 0)) return inner_callback(error);

                                        mm.executeDML('CALL sp_UpsertDayStart(?)', [TECHNICIAN_ID], supportKey, connection, (error, result1) => {
                                            if (error) return inner_callback(error);
                                            let logdata = { TECHNICIAN_ID, LOG_TEXT: 'Day start by system', STATUS: 'DS', TYPE: 'SYSTEM', CLIENT_ID: 1, USER_ID: 0 };
                                            dbm.saveLog(logdata, TechnicianDayLog);
                                            inner_callback(null);
                                        }
                                        );


                                    }
                                    );
                                } else if (activity.DAY_END_TIME === CURRENT_TIME) {
                                    mm.executeDML('CALL sp_CheckEndTrack(?)', [TECHNICIAN_ID], supportKey, connection, (error, trackData1) => {
                                        var trackData = trackData1[0]
                                        if (error || (trackData && trackData.length > 0 && trackData[0].END_TIME != null))
                                            return inner_callback(error);

                                        mm.executeDML('CALL sp_UpsertDayEnd(?)', [TECHNICIAN_ID], supportKey, connection, (error, result4) => {
                                            if (error) return inner_callback(error);

                                            let logdata = { TECHNICIAN_ID, LOG_TEXT: 'Day end by system', STATUS: 'DE', TYPE: 'SYSTEM', CLIENT_ID: 1, USER_ID: 0 };
                                            dbm.saveLog(logdata, TechnicianDayLog);
                                            inner_callback(null);
                                        }
                                        );
                                    }
                                    );
                                } else {

                                    inner_callback(null);
                                }
                            } else {
                                mm.executeDML('CALL sp_getTrack(?,?)', [TECHNICIAN_ID, currentWeekDay], supportKey, connection, (error, serviceData) => {
                                    if (error || serviceData[0].length === 0) return inner_callback(error);

                                    let service = serviceData[0][0];


                                    if (service.DAY_START_TIME === CURRENT_TIME) {
                                        mm.executeDML('CALL sp_UpsertDayStart(?)', [TECHNICIAN_ID], supportKey, connection, (error, result4) => {
                                            if (error) return inner_callback(error);

                                            let logdata = { TECHNICIAN_ID, LOG_TEXT: 'Day start by system', STATUS: 'DS', TYPE: 'SYSTEM', CLIENT_ID: 1, USER_ID: 0 };
                                            dbm.saveLog(logdata, TechnicianDayLog);
                                            inner_callback(null);
                                        }
                                        );

                                    } else if (service.DAY_END_TIME === CURRENT_TIME) {
                                        mm.executeDML('CALL sp_UpsertDayEnd(?)', [TECHNICIAN_ID], supportKey, connection, (error, result4) => {
                                            if (error) return inner_callback(error);

                                            let logdata = { TECHNICIAN_ID, LOG_TEXT: 'Day end by system', STATUS: 'DE', TYPE: 'SYSTEM', CLIENT_ID: 1, USER_ID: 0 };
                                            dbm.saveLog(logdata, TechnicianDayLog);
                                            inner_callback(null);
                                        }
                                        );
                                    } else {
                                        inner_callback(null);
                                    }
                                }
                                );
                            }
                        });
                    },
                        (err) => {
                            if (err) {
                                mm.rollbackConnection(connection);
                                console.error('Error processing technicians:', err);
                            } else {
                                mm.commitConnection(connection);
                                console.log('Technician processing completed successfully.');
                            }
                        }
                    );
                }
                );
            } catch (error) {
                console.error("Error in technicianScheduler:", error);
            }

            break;

        // FOR technician day end by system not in use
        case 2:
            // for day end of technician not using 
            try {
                const connection = mm.openConnection();
                mm.executeDML('SELECT ID FROM technician_master where IS_SYSTEM_END !=1  ', [], supportKey, connection, (error, technicianIds) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.error('Failed to retrieve technician IDs:', error);
                    } else {
                        if (!technicianIds || technicianIds.length === 0) {
                            mm.rollbackConnection(connection);
                            console.log('No Technician IDs found.');
                        } else {
                            let todayDate = today.toISOString().split("T")[0];
                            async.eachSeries(technicianIds, function processTechnician(technician, inner_callback) {
                                var TECHNICIAN_ID = technician.ID;
                                (async function () {
                                    try {
                                        activityData = require("../modules/technicianActivityCalender").find({
                                            TECHNICIAN_ID,
                                            $expr: {
                                                $eq: [
                                                    { $dateToString: { format: "%Y-%m-%d", date: "$DATE_OF_MONTH" } },
                                                    todayDate
                                                ]
                                            }
                                        }).then((activityData) => {
                                            if (activityData && activityData.length > 0 && activityData[0].DAY_END_TIME == CURRENT_TIME) {
                                                console.log("\n\n\n\n\n act      ", activityData)

                                                console.log("\n\n\n\nn\n\n", "calender")
                                                mm.executeDML('SELECT END_TIME FROM technician_daystart_track WHERE DATE = CURDATE()  AND TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, async (error, trackData) => {
                                                    if (error) {
                                                        console.error(
                                                            `Error checking daystart track for technician ${TECHNICIAN_ID}:`,
                                                            error
                                                        );
                                                        return inner_callback(error);
                                                    } else {
                                                        if (trackData && trackData.length > 0 && trackData[0].END_TIME == CURRENT_TIME) {
                                                            console.log("\n\n\n\n\n\n trackdata", trackData)
                                                            return inner_callback(null);
                                                        } else {
                                                            // Step 4: Insert into tech_daystart_track
                                                            mm.executeDML('update technician_daystart_track SET END_TIME = ? where TECHNICIAN_ID=? AND DATE=CURDATE() ', [CURRENT_TIME, TECHNICIAN_ID], supportKey, connection, (error) => {
                                                                if (error) {
                                                                    console.error(
                                                                        `Error inserting day start track for technician ${TECHNICIAN_ID}:`,
                                                                        error
                                                                    );
                                                                    return inner_callback(error);
                                                                } else {
                                                                    console.log('i am in MongoDB operations');
                                                                    var LOG_TEXT = 'Day end by system';
                                                                    var STATUS = 'DE';
                                                                    var TYPE = 'SYSTEM';
                                                                    logdata = { TECHNICIAN_ID, LOG_TEXT, STATUS, TYPE, CLIENT_ID: 1, USER_ID: 0 }
                                                                    dbm.saveLog(logdata, TechnicianDayLog)
                                                                    console.log(
                                                                        `Logged day END for technician ${TECHNICIAN_ID}`
                                                                    );

                                                                    mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 0, IS_SYSTEM_START=0 ,  IS_SYSTEM_END=1 WHERE ID =?', [TECHNICIAN_ID], supportKey, connection, (error) => {
                                                                        if (error) {
                                                                            console.error(
                                                                                `Error updating technician status for ID ${TECHNICIAN_ID}:`,
                                                                                error
                                                                            );
                                                                            return inner_callback(error);
                                                                        } else {
                                                                            inner_callback(null);
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }
                                                })
                                            } else {
                                                mm.executeDML('SELECT DAY_END_TIME FROM technician_service_calender WHERE TECHNICIAN_ID = ? AND WEEK_DAY = ? AND IS_SERIVCE_AVAILABLE = 1', [TECHNICIAN_ID, day], supportKey, connection, async (error, serviceData) => {
                                                    if (error) {
                                                        console.error(`Error retrieving service data for technician ${TECHNICIAN_ID}:`, error);
                                                        return inner_callback(error);
                                                    }
                                                    if (!serviceData || serviceData.length === 0 || !serviceData[0].DAY_END_TIME) {
                                                        return inner_callback(null);
                                                    }

                                                    const DAY_END_TIME = serviceData[0].DAY_END_TIME;
                                                    mm.executeDML('SELECT END_TIME FROM technician_daystart_track WHERE DATE = CURDATE() AND TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, async (error, trackData) => {
                                                        if (error) {
                                                            console.error(
                                                                `Error checking daystart track for technician ${TECHNICIAN_ID}:`,
                                                                error
                                                            );
                                                            return inner_callback(error);
                                                        }
                                                        if (trackData && trackData.length > 0 && trackData[0].END_TIME != null) {
                                                            return inner_callback(null);
                                                        }
                                                        // console.log("\n\n\n\nDay start time:", DAY_END_TIME);
                                                        // console.log("\n\n\n\nDay CURRENT_TIME:", CURRENT_TIME);
                                                        if (DAY_END_TIME === CURRENT_TIME) {
                                                            try {
                                                                mm.executeDML('update technician_daystart_track set  END_TIME=? where TECHNICIAN_ID=? AND DATE=CURDATE()', [CURRENT_TIME, TECHNICIAN_ID], supportKey, connection, (error, resultsInsert) => {
                                                                    if (error) {

                                                                        console.log(`Error inserting day start track for technician ${TECHNICIAN_ID}:`, error);
                                                                        return inner_callback(error);
                                                                    } else {
                                                                        console.log("\n\n\n\n\n\n\n\n\n resultsInsert", resultsInsert);

                                                                        console.log('i am in MongoDB operations');
                                                                        var LOG_TEXT = 'Day end by system';
                                                                        var STATUS = 'DE';
                                                                        var TYPE = 'SYSTEM';
                                                                        logdata = { TECHNICIAN_ID, LOG_TEXT, STATUS, TYPE, CLIENT_ID: 1, USER_ID: 0 }
                                                                        dbm.saveLog(logdata, TechnicianDayLog)
                                                                        console.log(
                                                                            `Logged day start for technician ${TECHNICIAN_ID}`
                                                                        );

                                                                        mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 0,IS_SYSTEM_START=0,IS_SYSTEM_END=1 WHERE ID = ?', [TECHNICIAN_ID], supportKey, connection, (error) => {
                                                                            if (error) {
                                                                                console.error(
                                                                                    `Error updating technician status for ID ${TECHNICIAN_ID}:`,
                                                                                    error
                                                                                );
                                                                                return inner_callback(error);
                                                                            }
                                                                            inner_callback(null);
                                                                        });
                                                                    }
                                                                });
                                                            } catch (mongoError) {
                                                                console.error(
                                                                    'MongoDB operation error:',
                                                                    mongoError
                                                                );
                                                                return inner_callback(mongoError);
                                                            }
                                                        } else {
                                                            return inner_callback(null);
                                                        }
                                                    });
                                                });
                                            }
                                        })

                                    } catch (e) {
                                        console.error('Internal async error:', e);
                                        return inner_callback(e);
                                    }
                                })(); // IIFE
                            },
                                function finalCallback(error) {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        console.error('Failed to process technician day start by system.');
                                    } else {
                                        mm.commitConnection(connection);

                                        console.log('Technician day END by system processed successfully.');
                                    }
                                });
                        }
                    }
                });
            } catch (error) {
                console.error('System error:', error);
            }
            break;

        // insert the next days data in activity calendar for all technicians
        case 3:
            try {
                const connection = mm.openConnection();
                mm.executeDML('CALL sp_GetTechnician();', [], supportKey, connection, async (error, technicianIds1) => {
                    var technicianIds = technicianIds1[0]
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.log("Failed to retrieve technician IDs.");
                    } else if (!technicianIds || technicianIds.length === 0) {
                        mm.rollbackConnection(connection);
                        console.log("No technicians found.");
                    } else {
                        const nextDt = new Date();
                        nextDt.setDate(nextDt.getDate() + 1);
                        const nextDate = nextDt.toISOString().split("T")[0];  // Use only the date part (YYYY-MM-DD)
                        const day2 = shortDayNames[nextDt.getDay()];

                        // Use async.eachSeries to process each technician ID
                        async.eachSeries(technicianIds, (technician, inner_callback) => {
                            const TECHNICIAN_ID = technician.ID;

                            // Wrap async function in a promise to use await within the callback correctly
                            (async () => {
                                try {
                                    // Check for existing activity data in MongoDB
                                    const activityData = await TechnicianActivityCalendar.find({
                                        TECHNICIAN_ID,
                                        DATE_OF_MONTH: nextDate
                                    });

                                    if (activityData && activityData.length > 0) {
                                        // If activity data exists for technician on the given date, skip to the next one
                                        inner_callback(null);  // Continue to next technician
                                    } else {
                                        // If no activity data exists, check the service calendar for availability
                                        const serviceData = await new Promise((resolve, reject) => {
                                            mm.executeDML('CALL sp_GetTechnicianServiceCalendar(?, ?)', [TECHNICIAN_ID, day2], supportKey, connection, (err, result1) => {
                                                var result = result1[0]
                                                if (err) {
                                                    reject(err);
                                                } else {
                                                    resolve(result);
                                                }
                                            });
                                        });

                                        if (serviceData && serviceData.length > 0) {
                                            // Destructure data from service calendar to populate new activity
                                            const { DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME, IS_SERIVCE_AVAILABLE, WEEK_DAY } = serviceData[0];

                                            // Insert new activity into TechnicianActivityCalendar collection
                                            const newActivity = new TechnicianActivityCalendar({
                                                TECHNICIAN_ID,
                                                DATE_OF_MONTH: nextDate,
                                                DAY_START_TIME,
                                                DAY_END_TIME,
                                                BREAK_START_TIME,
                                                BREAK_END_TIME,
                                                IS_SERIVCE_AVAILABLE,
                                                WEEK_DAY,
                                                CLIENT_ID: 1 // Assuming CLIENT_ID is static, adjust as needed
                                            });

                                            // Save new activity calendar entry
                                            await newActivity.save();
                                            console.log(`Activity calendar updated for technician ${TECHNICIAN_ID}.`);
                                        } else {
                                            console.log(`No service calendar found for technician ${TECHNICIAN_ID}.`);
                                        }

                                        inner_callback(null);  // Continue to next technician
                                    }
                                } catch (error) {
                                    console.log(`Error processing technician ${TECHNICIAN_ID}:`, error);
                                    inner_callback(error);  // If error occurs, stop iteration
                                }
                            })();  // Immediately Invoked Function Expression (IIFE) for async/await

                        }, function finalCallback(error) {
                            if (error) {
                                mm.rollbackConnection(connection);
                                console.log("Failed to process activity calendar update.");
                            } else {
                                mm.commitConnection(connection);
                                console.log("Activity calendar updated successfully for all technicians.");
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("System error:", error);
            }

            break;

        // send notification to warehouse manager and admin when AVG_LEVEL stock level is reached
        case 4:
            try {

                mm.executeQuery(`CALL sp_ProcessAvgLevelStock()`, supportKey, (err, result) => {

                    if (err) {
                        console.log("SQL Error:", err);
                        return;
                    }

                    const rows = result[1]; // second result set

                    if (!rows || rows.length === 0) {
                        console.log("No records found matching AVG_LEVEL == CURRENT_STOCK.");
                        return;
                    }

                    console.log("Notifications inserted successfully.");

                    for (let i = 0; i < rows.length; i++) {

                        const row = rows[i];

                        mm.sendNotificationToWManager(
                            'Critical Low Stock for Average Level',
                            `${row.ITEM_NAME} is almost out of stock! Only ${row.CURRENT_STOCK} left. Take action over it`,
                            "",
                            "",
                            "ALT",
                            row,
                            row.CLOUD_ID,
                            row.W_CLOUD_ID
                        );
                    }

                });

            } catch (error) {
                console.error("System error:", error);
            }
            break;

        //send notification to warehouse manager and admin when REORDER_STOCK_LEVEL stock level is reached
        case 5:
            try {

                mm.executeQuery(`CALL sp_ProcessReorderLevelStock()`, supportKey, (err, result) => {

                    if (err) {
                        console.log("SQL Error:", err);
                        return;
                    }

                    const rows = result[1]; // second result set

                    if (!rows || rows.length === 0) {
                        console.log("No records found matching REORDER_STOCK_LEVEL == CURRENT_STOCK.");
                        return;
                    }

                    console.log("Notifications inserted successfully.");

                    for (let i = 0; i < rows.length; i++) {

                        const row = rows[i];

                        mm.sendNotificationToWManager(
                            'Critical Low Stock for Reorder Level',
                            `${row.ITEM_NAME} is almost out of stock! Only ${row.CURRENT_STOCK} left. Take action over it`,
                            "",
                            "",
                            "ALT",
                            row,
                            row.CLOUD_ID,
                            row.W_CLOUD_ID
                        );
                    }

                });

            } catch (error) {
                console.error("System error:", error);
            }
            break;

        //send notification to warehouse manager and admin when ALERT_STOCK_LEVEL stock level is reached
        case 6:
            try {

                mm.executeQuery(`CALL sp_ProcessAlertLevelStock()`, supportKey, (err, result) => {

                    if (err) {
                        console.log("SQL Error:", err);
                        return;
                    }

                    const rows = result[1]; // second result set

                    if (!rows || rows.length === 0) {
                        console.log("No records found matching ALERT_STOCK_LEVEL == CURRENT_STOCK.");
                        return;
                    }

                    console.log("Notifications inserted successfully.");

                    for (let i = 0; i < rows.length; i++) {

                        const row = rows[i];

                        mm.sendNotificationToWManager(
                            'Critical Low Stock for Alert Stock Level',
                            `${row.ITEM_NAME} is almost out of stock! Only ${row.CURRENT_STOCK} left. Take action over it`,
                            "",
                            "",
                            "ALT",
                            row,
                            row.CLOUD_ID,
                            row.W_CLOUD_ID
                        );
                    }

                });

            } catch (error) {
                console.error("System error:", error);
            }
            break;

        // Empty wil use thi case for future use 
        case 7:
            try {

            } catch (error) {
                console.error("System error:", error);
            }
            break;

        case 8:
            try {

                const supportKey = "1023456789";
                const axios = require("axios");
                const async = require("async");
                const technicianActionLog = require("../modules/technicianActionLog");
                const dbm = require("../utilities/dbMongo");

                mm.executeQuery(`CALL sp_scheduler_getAutoCloseJobs()`, supportKey, (error, jobs1) => {

                    if (error) return console.log("Fetch error:", error);

                    var jobs = jobs1[0];

                    if (!jobs || jobs.length === 0) return console.log("No jobs pending.");

                    console.log(`Scheduler started for ${jobs.length} job(s)`);

                    async.eachSeries(jobs, (jobData, nextJob) => {

                        try {

                            const connection = mm.openConnection();
                            const getUTC = mm.getUTCDateFromTimezone(jobData.IANA_CODE);

                            mm.executeDML(`CALL sp_scheduler_getOrderDetails(?, ?)`,
                                [jobData.ORDER_ID, jobData.ID],
                                supportKey,
                                connection,
                                (err, orderRes1) => {

                                    if (err) {
                                        console.log(err);
                                        mm.rollbackConnection(connection);
                                        return nextJob();
                                    }

                                    var orderRes = orderRes1[0];

                                    if (!orderRes || orderRes.length === 0) {
                                        mm.rollbackConnection(connection);
                                        return nextJob();
                                    }

                                    const o = orderRes[0];

                                    const JOB_CARD_NO = o.JOB_CARD_NO;
                                    const ORDER_ID = o.ORDER_ID;
                                    const TECHNICIAN_ID = o.TECHNICIAN_ID;
                                    const TECHNICIAN_NAME = o.TECHNICIAN_NAME;

                                    const TITLE = 'Work order completed by service desk team';
                                    const DESC = 'Dear Customer, your work order has been completed successfully. Thank you for choosing our services.';
                                    const ACTION = `The work order ${JOB_CARD_NO} has been successfully completed by system.`;
                                    const STATUS_LOG = `The work order ${JOB_CARD_NO} has been successfully completed by system.`;

                                    mm.sendNotificationToChannel(
                                        1,
                                        `customer_${o.CUSTOMER_ID}_channel`,
                                        TITLE,
                                        DESC,
                                        "",
                                        "J",
                                        supportKey,
                                        "J",
                                        "J",
                                        {
                                            ORDER_ID,
                                            ORDER_NO: o.ORDER_NUMBER,
                                            JOB_CARD_NO,
                                            TECHNICIAN_ID,
                                            CUSTOMER_ID: o.CUSTOMER_ID,
                                            TECHNICIAN_NAME,
                                            ORDER_STATUS: "CO",
                                            CUSTOMER_NAME: o.CUSTOMER_NAME,
                                            MOBILE_NUMBER: o.MOBILE_NUMBER,
                                            EMAIL_ID: o.EMAIL_ID,
                                            JOB_CARD_ID: jobData.ID
                                        }
                                    );

                                    mm.executeDML(`CALL sp_scheduler_updateJobCardCompleted(?)`,
                                        [jobData.ID],
                                        supportKey,
                                        connection,
                                        (err1) => {

                                            if (err1) {
                                                console.log(err1);
                                                mm.rollbackConnection(connection);
                                                return nextJob();
                                            }

                                            mm.executeDML(`CALL sp_scheduler_updateOrderStatus(?)`,
                                                [ORDER_ID],
                                                supportKey,
                                                connection,
                                                (err2) => {

                                                    if (err2) {
                                                        console.log(err2);
                                                        mm.rollbackConnection(connection);
                                                        return nextJob();
                                                    }

                                                    mm.executeDML(`CALL sp_scheduler_getOrderJobs(?)`,
                                                        [ORDER_ID],
                                                        supportKey,
                                                        connection,
                                                        (err3, invList1) => {

                                                            if (err3) {
                                                                console.log(err3);
                                                                mm.rollbackConnection(connection);
                                                                return nextJob();
                                                            }

                                                            var invList = invList1[0];

                                                            if (invList.length > 0 && !invList.some(i => i.JOB_CARD_STATUS === "Assigned")) {
                                                                mm.sendDynamicEmail(51, invList[0].ID, supportKey);
                                                            }

                                                            mm.executeDML(`CALL sp_scheduler_getRemainingJobs(?)`,
                                                                [ORDER_ID],
                                                                supportKey,
                                                                connection,
                                                                (err4, remaining1) => {

                                                                    if (err4) {
                                                                        console.log(err4);
                                                                        mm.rollbackConnection(connection);
                                                                        return nextJob();
                                                                    }

                                                                    var remaining = remaining1[0];

                                                                    mm.commitConnection(connection);

                                                                    const ORDER_STATUSS = remaining.length === 0 ? "Work order is completed" : "";

                                                                    dbm.saveLog([{
                                                                        TECHNICIAN_ID,
                                                                        VENDOR_ID: 0,
                                                                        ORDER_ID,
                                                                        JOB_CARD_ID: o.ID,
                                                                        CUSTOMER_ID: o.CUSTOMER_ID,
                                                                        LOG_TYPE: remaining.length === 0 ? "Order" : "Job",
                                                                        ACTION_LOG_TYPE: "User",
                                                                        ACTION_DETAILS: ACTION,
                                                                        USER_ID: o.USER_ID,
                                                                        TECHNICIAN_NAME,
                                                                        ORDER_DATE_TIME: o.EXPECTED_DATE_TIME,
                                                                        CART_ID: 0,
                                                                        EXPECTED_DATE_TIME: o.EXPECTED_DATE_TIME,
                                                                        ORDER_MEDIUM: o.ORDER_MEDIUM,
                                                                        ORDER_STATUS: ORDER_STATUSS,
                                                                        PAYMENT_MODE: o.PAYMENT_MODE,
                                                                        PAYMENT_STATUS: o.PAYMENT_STATUS,
                                                                        TOTAL_AMOUNT: o.TOTAL_AMOUNT,
                                                                        ORDER_NUMBER: o.ORDER_NUMBER,
                                                                        TASK_DESCRIPTION: o.TASK_DESCRIPTION,
                                                                        ESTIMATED_TIME_IN_MIN: o.ESTIMATED_TIME_IN_MIN,
                                                                        PRIORITY: o.PRIORITY,
                                                                        JOB_CARD_STATUS: STATUS_LOG,
                                                                        USER_NAME: TECHNICIAN_NAME,
                                                                        DATE_TIME: getUTC,
                                                                        supportKey: 0,
                                                                        IANA_CODE: o.IANA_CODE
                                                                    }], technicianActionLog);

                                                                    mm.sendNotificationToAdmin(
                                                                        8,
                                                                        TITLE,
                                                                        DESC,
                                                                        "",
                                                                        "J",
                                                                        supportKey,
                                                                        "J",
                                                                        []
                                                                    );

                                                                    console.log(`JOB_CARD_ID ${jobData.ID} processed.`);

                                                                    nextJob();
                                                                });
                                                        });
                                                });
                                        });
                                });

                        } catch (err) {
                            console.log("Scheduler job error:", err);
                            nextJob();
                        }

                    }, () => {
                        console.log("All jobs processed successfully.");
                    });

                });

            } catch (error) {
                console.error(`Scheduler failed: ${error.message}`);
            }

            break;

        default:
            break;

    }
}

