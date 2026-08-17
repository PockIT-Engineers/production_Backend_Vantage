const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const axios = require('axios');
const async = require('async');
const technicianActionLog = require("../../modules/technicianActionLog")
const dbm = require('../../utilities/dbMongo');
const technicianActivityCalender = require('../../modules/technicianActivityCalender');
const applicationkey = process.env.APPLICATION_KEY;
var technicianschedule = "technicianschedule";
var viewTechnicianschedule = "view_" + technicianschedule;


function reqData(req) {
    var data = {
        ID: req.body.ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        TERRITORY_ID: req.body.TERRITORY_ID,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        DATE: req.body.DATE,
        '00:00': req.body['00:00'],
        '00:10': req.body['00:10'],
        '00:20': req.body['00:20'],
        '00:30': req.body['00:30'],
        '00:40': req.body['00:40'],
        '00:50': req.body['00:50'],
        '01:00': req.body['01:00'],
        '01:10': req.body['01:10'],
        '01:20': req.body['01:20'],
        '01:30': req.body['01:30'],
        '01:40': req.body['01:40'],
        '01:50': req.body['01:50'],
        '02:00': req.body['02:00'],
        '02:10': req.body['02:10'],
        '02:20': req.body['02:20'],
        '02:30': req.body['02:30'],
        '02:40': req.body['02:40'],
        '02:50': req.body['02:50'],
        '03:00': req.body['03:00'],
        '03:10': req.body['03:10'],
        '03:20': req.body['03:20'],
        '03:30': req.body['03:30'],
        '03:40': req.body['03:40'],
        '03:50': req.body['03:50'],
        '04:00': req.body['04:00'],
        '04:10': req.body['04:10'],
        '04:20': req.body['04:20'],
        '04:30': req.body['04:30'],
        '04:40': req.body['04:40'],
        '04:50': req.body['04:50'],
        '05:00': req.body['05:00'],
        '05:10': req.body['05:10'],
        '05:20': req.body['05:20'],
        '05:30': req.body['05:30'],
        '05:40': req.body['05:40'],
        '05:50': req.body['05:50'],
        '06:00': req.body['06:00'],
        '06:10': req.body['06:10'],
        '06:20': req.body['06:20'],
        '06:30': req.body['06:30'],
        '06:40': req.body['06:40'],
        '06:50': req.body['06:50'],
        '07:00': req.body['07:00'],
        '07:10': req.body['07:10'],
        '07:20': req.body['07:20'],
        '07:30': req.body['07:30'],
        '07:40': req.body['07:40'],
        '07:50': req.body['07:50'],
        '08:00': req.body['08:00'],
        '08:10': req.body['08:10'],
        '08:20': req.body['08:20'],
        '08:30': req.body['08:30'],
        '08:40': req.body['08:40'],
        '08:50': req.body['08:50'],
        '09:00': req.body['09:00'],
        '09:10': req.body['09:10'],
        '09:20': req.body['09:20'],
        '09:30': req.body['09:30'],
        '09:40': req.body['09:40'],
        '09:50': req.body['09:50'],
        '10:00': req.body['10:00'],
        '10:10': req.body['10:10'],
        '10:20': req.body['10:20'],
        '10:30': req.body['10:30'],
        '10:40': req.body['10:40'],
        '10:50': req.body['10:50'],
        '11:00': req.body['11:00'],
        '11:10': req.body['11:10'],
        '11:20': req.body['11:20'],
        '11:30': req.body['11:30'],
        '11:40': req.body['11:40'],
        '11:50': req.body['11:50'],
        '12:00': req.body['12:00'],
        '12:10': req.body['12:10'],
        '12:20': req.body['12:20'],
        '12:30': req.body['12:30'],
        '12:40': req.body['12:40'],
        '12:50': req.body['12:50'],
        '13:00': req.body['13:00'],
        '13:10': req.body['13:10'],
        '13:20': req.body['13:20'],
        '13:30': req.body['13:30'],
        '13:40': req.body['13:40'],
        '13:50': req.body['13:50'],
        '14:00': req.body['14:00'],
        '14:10': req.body['14:10'],
        '14:20': req.body['14:20'],
        '14:30': req.body['14:30'],
        '14:40': req.body['14:40'],
        '14:50': req.body['14:50'],
        '15:00': req.body['15:00'],
        '15:10': req.body['15:10'],
        '15:20': req.body['15:20'],
        '15:30': req.body['15:30'],
        '15:40': req.body['15:40'],
        '15:50': req.body['15:50'],
        '16:00': req.body['16:00'],
        '16:10': req.body['16:10'],
        '16:20': req.body['16:20'],
        '16:30': req.body['16:30'],
        '16:40': req.body['16:40'],
        '16:50': req.body['16:50'],
        '17:00': req.body['17:00'],
        '17:10': req.body['17:10'],
        '17:20': req.body['17:20'],
        '17:30': req.body['17:30'],
        '17:40': req.body['17:40'],
        '17:50': req.body['17:50'],
        '18:00': req.body['18:00'],
        '18:10': req.body['18:10'],
        '18:20': req.body['18:20'],
        '18:30': req.body['18:30'],
        '18:40': req.body['18:40'],
        '18:50': req.body['18:50'],
        '19:00': req.body['19:00'],
        '19:10': req.body['19:10'],
        '19:20': req.body['19:20'],
        '19:30': req.body['19:30'],
        '19:40': req.body['19:40'],
        '19:50': req.body['19:50'],
        '20:00': req.body['20:00'],
        '20:10': req.body['20:10'],
        '20:20': req.body['20:20'],
        '20:30': req.body['20:30'],
        '20:40': req.body['20:40'],
        '20:50': req.body['20:50'],
        '21:00': req.body['21:00'],
        '21:10': req.body['21:10'],
        '21:20': req.body['21:20'],
        '21:30': req.body['21:30'],
        '21:40': req.body['21:40'],
        '21:50': req.body['21:50'],
        '22:00': req.body['22:00'],
        '22:10': req.body['22:10'],
        '22:20': req.body['22:20'],
        '22:30': req.body['22:30'],
        '22:40': req.body['22:40'],
        '22:50': req.body['22:50'],
        '23:00': req.body['23:00'],
        '23:10': req.body['23:10'],
        '23:20': req.body['23:20'],
        '23:30': req.body['23:30'],
        '23:40': req.body['23:40'],
        '23:50': req.body['23:50'],
        CLIENT_ID: req.body.CLIENT_ID
    };
    return data;
}


exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('DATE').exists(),
        body('ID').optional(),
    ]
}

exports.get = async (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
        var pageSize = req.body.pageSize ? req.body.pageSize : '';
        let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
        let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
        let filter = req.body.filter ? req.body.filter : '';
        let VENDOR_ID = req.body.VENDOR_ID;
        var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
        const safeFilter = (filter || '').replace(/'/g, "\\'");
        const setContext = `
            SET @v_PAGE_INDEX = ${pageIndex || 0};
            SET @v_PAGE_SIZE = ${pageSize || 0};
            SET @v_SORT_KEY = '${sortKey}';
            SET @v_SORT_VALUE = '${sortValue}';
            SET @v_FILTER = '${safeFilter}';
            SET @v_VENDOR_ID = ${VENDOR_ID || 0};
        `;
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(setContext + ` CALL sp_get_technician_job_schedules(); `, [], supportKey, async (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianschedule information."
                    });
                }
                else {
                    const resultSets = results.filter(r => Array.isArray(r));
                    const results1 = resultSets[0] || [];
                    const resultsData = resultSets[1] || [];
                    const techdata = resultSets[2] || [];
                    const validTechnicianIds = techdata.map(t => t.ID);
                    const timeSlots = [
                        '00:00', '00:10', '00:20', '00:30', '00:40', '00:50',
                        '01:00', '01:10', '01:20', '01:30', '01:40', '01:50',
                        '02:00', '02:10', '02:20', '02:30', '02:40', '02:50',
                        '03:00', '03:10', '03:20', '03:30', '03:40', '03:50',
                        '04:00', '04:10', '04:20', '04:30', '04:40', '04:50',
                        '05:00', '05:10', '05:20', '05:30', '05:40', '05:50',
                        '06:00', '06:10', '06:20', '06:30', '06:40', '06:50',
                        '07:00', '07:10', '07:20', '07:30', '07:40', '07:50',
                        '08:00', '08:10', '08:20', '08:30', '08:40', '08:50',
                        '09:00', '09:10', '09:20', '09:30', '09:40', '09:50',
                        '10:00', '10:10', '10:20', '10:30', '10:40', '10:50',
                        '11:00', '11:10', '11:20', '11:30', '11:40', '11:50',
                        '12:00', '12:10', '12:20', '12:30', '12:40', '12:50',
                        '13:00', '13:10', '13:20', '13:30', '13:40', '13:50',
                        '14:00', '14:10', '14:20', '14:30', '14:40', '14:50',
                        '15:00', '15:10', '15:20', '15:30', '15:40', '15:50',
                        '16:00', '16:10', '16:20', '16:30', '16:40', '16:50',
                        '17:00', '17:10', '17:20', '17:30', '17:40', '17:50',
                        '18:00', '18:10', '18:20', '18:30', '18:40', '18:50',
                        '19:00', '19:10', '19:20', '19:30', '19:40', '19:50',
                        '20:00', '20:10', '20:20', '20:30', '20:40', '20:50',
                        '21:00', '21:10', '21:20', '21:30', '21:40', '21:50',
                        '22:00', '22:10', '22:20', '22:30', '22:40', '22:50',
                        '23:00', '23:10', '23:20', '23:30', '23:40', '23:50'
                    ];
                    const filteredData = resultsData.filter(record => {
                        const hasActiveSlot = timeSlots.some(slot => record[slot] !== null);
                        if (VENDOR_ID) {
                            const isTechMatch = validTechnicianIds.includes(record.TECHNICIAN_ID);
                            return isTechMatch && hasActiveSlot;
                        }
                        return hasActiveSlot;
                    });
                    res.send({
                        "code": 200,
                        "message": "success",
                        "count": filteredData.length,
                        "data": filteredData
                    });
                }
            }
            );
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            });
        }
    }
    catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }

}


exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {

        console.log(errors);

        res.send({
            "code": 422,
            "message": errors.errors
        });

    }
    else {

        try {

            mm.executeQueryData(
                `CALL sp_create_technicianschedule(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                Object.values(data),
                supportKey,
                (error, results) => {

                    if (error) {

                        console.log(error);

                        logger.error(
                            supportKey + ' ' +
                            req.method + " " +
                            req.url + ' ' +
                            JSON.stringify(error),
                            applicationkey
                        );

                        res.send({
                            "code": 400,
                            "message": "Failed to save technicianschedule information..."
                        });

                    }
                    else {

                        res.send({
                            "code": 200,
                            "message": "technicianschedule information saved successfully..."
                        });

                    }

                }
            );

        }
        catch (error) {

            logger.error(
                supportKey + ' ' +
                req.method + " " +
                req.url + ' ' +
                JSON.stringify(error),
                applicationkey
            );

            console.log(error)

            res.send({
                code: 500,
                message: "Something Went Wrong."
            })

        }

    }

}

exports.update = (req, res) => {

    const errors = validationResult(req);

    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {

        console.log(errors);

        res.send({
            "code": 422,
            "message": errors.errors
        });

    }
    else {

        try {

            mm.executeQueryData(
                `CALL sp_update_technicianschedule(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [...Object.values(data), systemDate],
                supportKey,
                (error, results) => {

                    if (error) {

                        console.log(error);

                        logger.error(
                            supportKey + ' ' +
                            req.method + " " +
                            req.url + ' ' +
                            JSON.stringify(error),
                            applicationkey
                        );

                        res.send({
                            "code": 400,
                            "message": "Failed to update technicianschedule information."
                        });

                    }
                    else {

                        res.send({
                            "code": 200,
                            "message": "technicianschedule information updated successfully..."
                        });

                    }

                }
            );

        }
        catch (error) {

            console.log(error);

            logger.error(
                supportKey + ' ' +
                req.method + " " +
                req.url + ' ' +
                JSON.stringify(error),
                applicationkey
            );

            res.send({
                code: 500,
                message: "Something Went Wrong."
            });

        }

    }

}

exports.getJobCounts = (req, res) => {

    const supportKey = req.headers['supportkey'];

    let pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    let pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let DATE = req.body.DATE ? req.body.DATE : '';
    let CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : '';

    const safeFilter = (filter || '').trim().replace(/'/g, "\\'");

    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE  = ${pageSize || 0};
        SET @v_SORT_KEY   = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER     = '${safeFilter}';
        SET @v_DATE       = '${DATE}';
        SET @v_CUSTOMER_ID = '${CUSTOMER_ID}';
    `;

    try {

        if (IS_FILTER_WRONG == "0") {

            mm.executeQueryData(
                setContext + `CALL sp_job_card_get_counts();`,
                [],
                supportKey,
                (error, results) => {

                    if (error) {

                        console.log(error);

                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );

                        return res.send({
                            code: 400,
                            message: "Failed to get technicianschedule count."
                        });

                    }

                    const resultSets = results.filter(r => Array.isArray(r));
                    const dataResult = resultSets[0] || [];

                    res.send({
                        code: 200,
                        message: "success",
                        data: dataResult
                    });

                }
            );

        } else {

            res.send({
                code: 400,
                message: "Invalid filter parameter."
            });

        }

    } catch (error) {

        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );

        console.log(error);

        res.send({
            code: 500,
            message: "Something Went Wrong."
        });

    }

};


exports.getTechniciansSchedule = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const pageIndex = req.body.pageIndex || '';
    const pageSize = req.body.pageSize || '';
    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue || 'DESC';
    const filter = req.body.filter || '';
    const PINCODE = req.body.PINCODE;
    const EXPECTED_DATE_TIME = req.body.SERVICE_DATA[0].EXPECTED_DATE_TIME;
    const ESTIMATED_TIME_IN_MIN = req.body.SERVICE_DATA[0].ESTIMATED_TIME_IN_MIN;
    const startTime = new Date(EXPECTED_DATE_TIME);
    const SERVICE_START_TIME = startTime.toTimeString().split(' ')[0];
    const endTime = new Date(startTime.getTime() + ESTIMATED_TIME_IN_MIN * 60000);
    const SERVICE_END_TIME = endTime.toTimeString().split(' ')[0];
    const SERVICE_LAT = req.body.SERVICE_DATA[0].LATTITUTE;
    const SERVICE_LONG = req.body.SERVICE_DATA[0].LONGITUDE;
    const SortOrder = req.body.SortOrder;
    const adjustedStartTime = new Date(startTime.getTime() + ESTIMATED_TIME_IN_MIN * 60000);
    const isoString = adjustedStartTime.toISOString();
    var MONGOFILTER_DATE = isoString.split('T');
    var JOB_DATE = isoString.split('T');
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    const TECHNICIAN_TYPE = req.body.TECHNICIAN_TYPE;
    const VENDOR_ID = req.body.VENDOR_ID;
    const IS_SCHEDULED_BY = req.body.IS_SCHEDULED_BY;
    let start = 0;
    let end = 0;
    let criteria = '';

    if (pageIndex && pageSize) {
        start = (pageIndex - 1) * pageSize;
        end = parseInt(pageSize);
    }

    criteria = pageIndex && pageSize
        ? `${filter} ORDER BY ${sortKey} ${sortValue} LIMIT ${start}, ${end}`
        : `${filter} ORDER BY ${sortKey} ${sortValue}`;

    try {
        if (IS_FILTER_WRONG === '0') {
            if (req.body.SERVICE_DATA && req.body.TECHNICIAN_TYPE && req.body.PINCODE) {
                let technicianFilter = '';
                let techVertualFilter = '';
                let vendorFilter = '';

                if (TECHNICIAN_TYPE === "M") {
                    technicianFilter = ` AND TECHNICIAN_ID IN (SELECT TECHNICIAN_ID FROM customer_technician_mapping WHERE STATUS = 'M' AND IS_ACTIVE = 1 AND CUSTOMER_ID = ${req.body.CUSTOMER_ID}) `;
                }
                if (IS_SCHEDULED_BY === "V") {
                    vendorFilter = ` AND TECHNICIAN_ID IN (SELECT ID FROM technician_master WHERE VENDOR_ID = ${VENDOR_ID} AND IS_ACTIVE = 1) `;
                }
                if (TECHNICIAN_TYPE === "R" || TECHNICIAN_TYPE === "AR") {
                    techVertualFilter = ` AND TECHNICIAN_ID IN (SELECT ID FROM technician_master WHERE 1 AND IS_ACTIVE = 1 AND TYPE = 'R') `;
                }
                if (TECHNICIAN_TYPE === "MR") {
                    techVertualFilter = ` AND TECHNICIAN_ID IN (SELECT TECHNICIAN_ID FROM customer_technician_mapping WHERE STATUS = 'M' AND IS_ACTIVE = 1 AND CUSTOMER_ID = ${req.body.CUSTOMER_ID}) AND TECHNICIAN_ID IN (SELECT ID FROM technician_master WHERE 1 AND IS_ACTIVE = 1 AND TYPE = 'R') `;
                }

                const technicianData = await executeQueryDataAsync(
                    `CALL Sp_GetTechniciansByPincode(?,?)`,
                    [PINCODE, technicianFilter + vendorFilter + techVertualFilter],
                    supportKey
                );

                const technicians = technicianData[0];

                if (technicians.length === 0) {
                    return res.status(200).send({ code: 300, message: 'No technicians found.' });
                }
                const TECHNICIAN_DATA = [];
                const technicianProcessingPromises = technicians.map(async (record) => {
                    try {
                        let DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME;
                        const filterM = {
                            TECHNICIAN_ID: record.TECHNICIAN_ID,
                            $expr: {
                                $eq: [
                                    { $dateToString: { format: "%Y-%m-%d", date: "$DATE_OF_MONTH" } },
                                    MONGOFILTER_DATE[0]
                                ]
                            }
                        };
                        const techCalendardata = await technicianActivityCalender.findOne(filterM);

                        const calendarDataSP = await executeQueryDataAsync(
                            `CALL Sp_GetTechnicianCalendar(?,?)`,
                            [JOB_DATE[0], record.TECHNICIAN_ID],
                            supportKey
                        );

                        const calendarData = calendarDataSP[0];

                        if (calendarData.length === 0) return;
                        if (techCalendardata) {
                            // console.log("\n\n\n\n techCalendardata is present : ",techCalendardata)
                            // TECHNICIAN_STATUS = techCalendardata.IS_SERIVCE_AVAILABLE === 1 || techCalendardata.IS_SERIVCE_AVAILABLE === true ? 0 : 1
                            // IS_SERIVCE_AVAILABLE = techCalendardata.IS_SERIVCE_AVAILABLE === 1 || techCalendardata.IS_SERIVCE_AVAILABLE === true ? 1 : 0
                            ({ DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME } = techCalendardata);
                        } else {
                            // TECHNICIAN_STATUS = calendarData[0].IS_SERIVCE_AVAILABLE === 0 ? 0 : 1
                            // IS_SERIVCE_AVAILABLE = calendarData[0].IS_SERIVCE_AVAILABLE === 0 ? 0 : 1
                            ({ DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME } = calendarData[0]);
                        }

                        const systemDate = mm.getSystemDate();
                        const SERVICE_START = new Date(`${systemDate.split(' ')[0]} ${SERVICE_START_TIME}`);
                        const SERVICE_END = new Date(`${systemDate.split(' ')[0]} ${SERVICE_END_TIME}`);
                        const DAY_START = new Date(`${systemDate.split(' ')[0]} ${DAY_START_TIME}`);
                        const DAY_END = new Date(`${systemDate.split(' ')[0]} ${DAY_END_TIME}`);
                        const BREAK_START = new Date(`${systemDate.split(' ')[0]} ${BREAK_START_TIME}`);
                        const BREAK_END = new Date(`${systemDate.split(' ')[0]} ${BREAK_END_TIME}`);

                        if (DAY_END <= DAY_START) DAY_END.setDate(DAY_END.getDate() + 1);
                        if (BREAK_END <= BREAK_START) BREAK_END.setDate(BREAK_END.getDate() + 1);
                        let working_deviation = 0;
                        let break_deviation = 0;
                        let overlap_start = null;
                        let overlap_end = null;
                        let BREAK_EARLY_OR_LATE = 'NA';
                        let break_overlap_duration = 0;
                        let DAY_EARLY_OR_LATE = 'NA';
                        let SST = DAY_START;
                        let SET = DAY_END;
                        let BST = BREAK_START;
                        let BET = BREAK_END;
                        let JST = SERVICE_START;
                        let JET = SERVICE_END;
                        if (JST >= SST && JET <= SET) {
                            working_deviation = 0;

                            if (JST < BST && JET > BST && JET < BET) {
                                overlap_start = BST;
                                overlap_end = JET;
                                break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                break_deviation = break_overlap_duration;
                                BREAK_EARLY_OR_LATE = 'E';
                            } else if (JST > BST && JST < BET && JET <= BET) {
                                if (JST > BST && JET < BET) {
                                    overlap_start = JST;
                                    overlap_end = JET;
                                    break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                    break_deviation = break_overlap_duration;
                                    BREAK_EARLY_OR_LATE = 'E';
                                } else if (JST > BST && JET <= BET) {
                                    overlap_start = JST;
                                    overlap_end = JET;
                                    break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                    break_deviation = break_overlap_duration;
                                    BREAK_EARLY_OR_LATE = 'E';
                                } else {
                                    overlap_start = BST;
                                    overlap_end = JET;
                                    break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                    break_deviation = break_overlap_duration;
                                    BREAK_EARLY_OR_LATE = 'L';
                                }
                            } else if (
                                JST <= BST && JET >= BET) {
                                overlap_start = BST;
                                overlap_end = BET;
                                break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                break_deviation = 1000;
                            } else if (JST > BST && JET <= SET && BET <= JET) {
                                if (JET < SET) {
                                    break_deviation = 0;

                                } else {
                                    overlap_start = JST;
                                    overlap_end = BET;
                                    break_overlap_duration = (overlap_end - overlap_start) / 60000; // ms to minutes
                                    break_deviation = break_overlap_duration;
                                    BREAK_EARLY_OR_LATE = 'E';
                                }

                            }
                        } else if (JST < SST && JET > BST && JET <= BET && JET >= SET) {
                            working_deviation = 1000;
                            break_deviation = (JET - BST) / 60000;
                            BREAK_EARLY_OR_LATE = 'L';
                        } else if (JST < SST && JET > BST && JET <= BET && JET <= SET) {
                            working_deviation = (SST - JST) / 60000;
                            break_deviation = (JET - BST) / 60000;
                            overlap_start = BST;
                            overlap_end = JET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            BREAK_EARLY_OR_LATE = 'L';
                            DAY_EARLY_OR_LATE = 'E';
                        } else if (JST >= SST && JST < BST && JET > BET && JET <= SET) {
                            working_deviation = 0;
                            break_deviation = 1000;
                            BREAK_EARLY_OR_LATE = 'E';
                        } else if (JST >= SST && JST < BST && JET > BET && JET > SET) {
                            working_deviation = (JET - SET) / 60000;
                            break_deviation = 1000;
                            overlap_start = BST;
                            overlap_end = BET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            DAY_EARLY_OR_LATE = 'L';
                        } else if (JST >= SST && BST >= JST) {
                            working_deviation = (JET - SET) / 60000;
                            break_deviation = 1000;
                            overlap_start = BST;
                            overlap_end = BET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            DAY_EARLY_OR_LATE = 'L';
                        } else if (JET <= SET && BET >= SET) {
                            working_deviation = (SST - JST) / 60000;
                            DAY_EARLY_OR_LATE = 'E';
                        } else if (JST <= SST && BET <= JET && BST.getTime() !== JET.getTime()) {
                            working_deviation = (SST - JST) / 60000;
                            break_deviation = 1000;
                            overlap_start = BST;
                            overlap_end = BET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            DAY_EARLY_OR_LATE = 'E';
                            BREAK_EARLY_OR_LATE = 'NA';
                        } else if ((JET < SST || JST > SET) && (JST < BST || JET > BET)) {
                            working_deviation = 1000;
                            break_deviation = 1000;
                        } else if (JST <= SST && JET <= BET) {
                            working_deviation = (SST - JST) / 60000;
                            DAY_EARLY_OR_LATE = 'E';
                        } else if (JST <= BET && JET >= SET) {
                            if (BST <= JST && JET >= SET) {
                                working_deviation = (JET - SET) / 60000;
                                overlap_start = JST;
                                overlap_end = BET;
                                break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                break_deviation = break_overlap_duration;
                                DAY_EARLY_OR_LATE = 'L';
                                BREAK_EARLY_OR_LATE = 'E';
                            } else {
                                working_deviation = (JET - SET) / 60000;
                                DAY_EARLY_OR_LATE = 'L';
                            }
                        } else if (JST > BET && JET > SET) {
                            working_deviation = (JET - SET) / 60000;
                            DAY_EARLY_OR_LATE = 'L';
                        } else if (JST <= SST && BET <= SET && BST.getTime() == JET.getTime()) {
                            working_deviation = (SST - JST) / 60000;
                            break_deviation = (BST - JET) / 6000;
                            overlap_start = BST;
                            overlap_end = JET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            DAY_EARLY_OR_LATE = 'E';
                            BREAK_EARLY_OR_LATE = 'NA';
                        } else {
                            working_deviation = 1000;
                        }

                        const jobDataSP = await executeQueryDataAsync(
                            `CALL Sp_GetTechnicianLastJob(?,?,?)`,
                            [record.TECHNICIAN_ID, JOB_DATE[0], SERVICE_START_TIME],
                            supportKey
                        );

                        const jobData = jobDataSP[0];

                        const parseJobTime = jobTime => new Date(`${systemDate.split(' ')[0]} ${jobTime}`);

                        const IS_JOB_CONFLICT = jobData.some(job => {
                            const JOB_START = parseJobTime(job.START_TIME);
                            const JOB_END = parseJobTime(job.END_TIME);
                            return SERVICE_START < JOB_END && SERVICE_END > JOB_START;
                        }) ? 1 : 0;

                        const currentTime = new Date(systemDate);
                        const IS_ON_JOB = jobData.some(job => {
                            const JOB_START = parseJobTime(job.START_TIME);
                            const JOB_END = parseJobTime(job.END_TIME);
                            return currentTime >= JOB_START && currentTime <= JOB_END;
                        }) ? 1 : 0;

                        const skillDataSP = await executeQueryDataAsync(
                            `CALL Sp_GetTechnicianSkills(?)`,
                            [record.TECHNICIAN_ID],
                            supportKey
                        );

                        const skillData = skillDataSP[0];

                        const DataTechnicianSP = await executeQueryDataAsync(
                            `CALL Sp_GetTechnicianMaster(?)`,
                            [record.TECHNICIAN_ID],
                            supportKey
                        );

                        const DataTechnician = DataTechnicianSP[0];

                        if (skillData.length === 0 || skillData[0].SKILLS == null || skillData[0].SKILLS === '' || skillData[0].SKILLS.length === 0 || DataTechnician.length === 0) {
                            return; // Skip this technician if essential data is missing
                        }
                        let LOC_LAT = (jobData.length && jobData[0].LATTITUTE)
                            ? jobData[0].LATTITUTE
                            : (DataTechnician[0] ? DataTechnician[0].HOME_LATTITUDE : null);

                        let LOC_LONG = (jobData.length && jobData[0].LONGITUDE)
                            ? jobData[0].LONGITUDE
                            : (DataTechnician[0] ? DataTechnician[0].HOME_LONGITUDE : null);

                        const distanceResult = await getDistanceAndTimeAsync(parseFloat(LOC_LAT), parseFloat(LOC_LONG), parseFloat(SERVICE_LAT), parseFloat(SERVICE_LONG), 60);
                        const googleDistance = await getDistanceDataFromGoogleAPI(parseFloat(LOC_LAT), parseFloat(LOC_LONG), parseFloat(SERVICE_LAT), parseFloat(SERVICE_LONG));
                        const distanceInKm = `${distanceResult.distance}km`;
                        const hrs = distanceResult.estimatedTimeHours.split('.')[0];
                        const mins = distanceResult.estimatedTimeHours.split('.')[1];
                        const TimeInHours = `${hrs} hours ${mins} mins`;
                        const GoogleDistance = googleDistance ? googleDistance.distance : distanceInKm;
                        const GoogleDuration = googleDistance ? googleDistance.duration : TimeInHours;

                        const TECHNICIAN_SKILLS = skillData[0].SKILLS.split(',').map(skill => skill.trim().toLowerCase());

                        const SERVICE_SKILLS = req.body.SERVICE_DATA[0].SERVICE_SKILLS.split(',').map(skill => skill.trim().toLowerCase());

                        const matchedSkills = SERVICE_SKILLS.filter(skill => TECHNICIAN_SKILLS.includes(skill)).length;

                        const SKILL_RATIO = `${matchedSkills}/${SERVICE_SKILLS.length}`;
                        // console.log("SERVICE_SKILLS:", SERVICE_SKILLS);

                        const BREAK_TIME = `${BREAK_START_TIME} to ${BREAK_END_TIME}`;
                        const currentSystemDate = new Date(systemDate);
                        const IS_ON_BREAK = currentSystemDate >= BREAK_START && currentSystemDate <= BREAK_END ? 1 : 0;

                        const formattedWorkingDeviation = formatMinutesToHoursAndMinutes(Math.round(working_deviation));
                        const formattedBreakDeviation = formatMinutesToHoursAndMinutes(Math.round(break_deviation));
                        const formattedBreakOverlapDuration = formatMinutesToHoursAndMinutes(Math.round(break_overlap_duration));
                        console.log(`Technician ID: ${record.TECHNICIAN_ID}, Working Deviation: ${formattedWorkingDeviation}, Break Deviation: ${formattedBreakDeviation}, Break Overlap Duration: ${formattedBreakOverlapDuration}, Matched Skills: ${matchedSkills}`);

                        if (matchedSkills == 0) {
                            return; // Skip this technician if essential data is missing
                        }

                        TECHNICIAN_DATA.push({
                            ...DataTechnician[0],
                            TECHNICIAN_ID: record.TECHNICIAN_ID,
                            WORK_DEVIATIONS: working_deviation,
                            BREAK_DEVIATIONS: break_deviation,
                            BREAK_OVERLAP_DURATIONS: break_overlap_duration,
                            working_deviation: formattedWorkingDeviation,
                            break_deviation: formattedBreakDeviation,
                            break_overlap_duration: formattedBreakOverlapDuration,
                            BREAK_EARLY_OR_LATE,
                            DAY_EARLY_OR_LATE,
                            IS_JOB_CONFLICT,
                            IS_ON_JOB,
                            DISTANCE: GoogleDistance,
                            DISTANCE_IN_KM: GoogleDistance,
                            ESTIMATED_TIME_TRAVAL: GoogleDuration,
                            // DISTANCE: distanceInKm,
                            // DISTANCE_IN_KM: distanceResult.distance,
                            // ESTIMATED_TIME_TRAVAL: TimeInHours,
                            SKILL_RATIO,
                            MATCHED_SKILLS: matchedSkills,
                            BREAK_TIME,
                            IS_ON_BREAK,
                            DAY_START_TIME: DAY_START_TIME,
                            DAY_END_TIME: DAY_END_TIME,
                            DAY_START_END: `${DAY_START_TIME} to ${DAY_END_TIME}`,
                            CURRENT_LATITUDE: LOC_LAT,
                            CURRENT_LONGITUDE: LOC_LONG,
                            IS_SERIVCE_AVAILABLE: techCalendardata && techCalendardata.IS_SERIVCE_AVAILABLE !== undefined ? (techCalendardata.IS_SERIVCE_AVAILABLE ? 1 : 0) : calendarData[0].IS_SERIVCE_AVAILABLE,
                            TECHNICIAN_STATUS: techCalendardata && techCalendardata.IS_SERIVCE_AVAILABLE !== undefined ? (techCalendardata.IS_SERIVCE_AVAILABLE ? 1 : 0) : calendarData[0].IS_SERIVCE_AVAILABLE,
                        });
                    } catch (innerError) {
                        console.error("Error processing technician:", innerError);
                        // Optionally handle errors for individual technicians, e.g., log and continue
                    }
                });
                await Promise.all(technicianProcessingPromises);
                // const filteredTechnicians = TECHNICIAN_DATA.filter(technician => technician.IS_SERIVCE_AVAILABLE === 1);
                // const filteredData = TECHNICIAN_DATA.filter(item => {
                //     const [matched, total] = item.SKILL_RATIO.split('/').map(Number);
                //     return matched !== 0; // skip if 0
                // });

                const sortedTechnicians = sortTechnicians(TECHNICIAN_DATA, SortOrder);
                res.status(200).send({ code: 200, data: sortedTechnicians });
            } else {
                res.status(400).send({ code: 400, message: 'Please provide a valid parameter.' });
            }
        } else {
            res.status(400).send({ code: 400, message: 'Invalid filter parameter.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ code: 500, message: 'Something went wrong.' });
    }
};

exports.scheduleJob = (req, res) => {
    console.log("=== SCHEDULE JOB API STARTED ===");
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers["supportkey"];

    const {
        TERRITORY_ID, TECHNICIAN_ID, TECHNICIAN_NAME, DATE, EXPECTED_END_DATE,
        START_TIME, END_TIME, JOB_CARD_NO, ORDER_ID, ID, CUSTOMER_ID,
        CUSTOMER_MANAGER_ID, CLIENT_ID, USER_ID, ORGNISATION_ID, VENDOR_ID, IANA_CODE
    } = req.body;

    if (!IANA_CODE) {
        return res.send({ code: 302, message: "Please provide the work order's timezone to proceed" });
    }
    if (!errors.isEmpty()) {
        return res.status(422).send({ code: 422, message: errors.errors });
    }
    let MongoLogDate = mm.getUTCDateFromTimezone(IANA_CODE);
    try {
        const connection = mm.openConnection();

        if (req.body.IS_ORDER_JOB === "J") {
            let startDate = new Date(DATE);
            let endDate = new Date(EXPECTED_END_DATE);
            let allDates = [];
            let temp = new Date(startDate);
            while (temp <= endDate) { allDates.push(formatDate(temp)); temp.setDate(temp.getDate() + 1); }

            let slotPayload = [];
            allDates.forEach((d, index) => {
                if (index === 0) {
                    slotPayload.push({ date: d, start: START_TIME, end: d === EXPECTED_END_DATE ? END_TIME : "23:50" });
                } else if (index === allDates.length - 1) {
                    slotPayload.push({ date: d, start: "00:00", end: END_TIME });
                } else {
                    slotPayload.push({ date: d, start: "00:00", end: "23:50" });
                }
            });

            async.eachSeries(slotPayload, (slot, cb) => {
                const start = parseTime(slot.start);
                const end = parseTime(slot.end);
                const timeSlots = generateTimeSlots(start, end);

                // OVERLAP CHECK
                mm.executeDML(`CALL GetTechnicianSchedule(?,?)`, [TECHNICIAN_ID, slot.date], supportKey, connection, (errSched, rowsSched) => {
                    if (errSched) return cb(errSched);
                    console.log("\n\n\n\n ^^^^^^^Fetched technician schedule for overlap check:", rowsSched, "^^^^^^^ \n\n\n\n");
                    const rows = rowsSched[0];   // get actual data rows

                    console.log("Fetched technician schedule:", rows);
                    if (rows.length > 0) {
                        const row = rows[0];
                        let overlap = false;
                        timeSlots.forEach(ts => {
                            if (row[ts] !== null && row[ts] !== "" && row[ts] !== undefined) overlap = true;
                        });
                        if (overlap) {
                            mm.rollbackConnection(connection);
                            return res.status(300).send({
                                code: 300,
                                message: `Technician ${TECHNICIAN_NAME} already has a work order on ${slot.date} between ${slot.start} and ${slot.end}.`
                            });
                        }
                    }

                    // AFTER OVERLAP → FETCH FOR INSERT/UPDATE
                    mm.executeDML(`CALL GetTechnicianSchedule(?,?)`, [TECHNICIAN_ID, slot.date], supportKey, connection, (errRow, row) => {
                        if (errRow) return cb(errRow);

                        let query = "";
                        const slotValue = `${JOB_CARD_NO},AS,${CUSTOMER_MANAGER_ID}`;
                        const setHere = timeSlots.map(t => `\`${t}\`='${slotValue}'`).join(",");
                        let techrows = row[0];
                        if (techrows.length > 0) {
                            query = ` UPDATE technicianschedule  SET ${setHere}, DATE='${slot.date}', CREATED_MODIFIED_DATE='${mm.getSystemDate()}' WHERE TERRITORY_ID=${TERRITORY_ID} AND TECHNICIAN_ID=${TECHNICIAN_ID} AND DATE='${slot.date}'`;
                        } else {
                            const cols = timeSlots.map(t => `\`${t}\``).join(",");
                            const vals = timeSlots.map(() => `'${slotValue}'`).join(",");
                            query = `INSERT INTO technicianschedule (${cols}, TECHNICIAN_NAME, DATE, CREATED_MODIFIED_DATE, TERRITORY_ID, TECHNICIAN_ID, CLIENT_ID)VALUES (${vals}, '${TECHNICIAN_NAME}', '${slot.date}', '${mm.getSystemDate()}', ${TERRITORY_ID}, ${TECHNICIAN_ID}, ${CLIENT_ID})`;
                        }
                        mm.executeDML(`CALL Sp_ExecuteTechnicianSchedule(?)`, [query], supportKey, connection, (err2) => {
                            if (err2) {
                                console.log(err2)
                                return cb(err2);
                            }
                            cb();
                        })
                    });
                });
            },
                (finalErr) => {
                    if (finalErr) {
                        mm.rollbackConnection(connection);
                        return res.status(400).send({ code: 400, message: "Failed to schedule technician slots." });
                    }

                    mm.executeDML(`CALL Sp_ScheduleUpdateJobCard(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                        [2, "AS", TECHNICIAN_ID, TECHNICIAN_NAME, DATE, START_TIME, END_TIME, EXPECTED_END_DATE, USER_ID, mm.getSystemDate(), ORGNISATION_ID, VENDOR_ID, ID, 4, ORDER_ID],
                        supportKey,
                        connection,
                        (errJob) => {
                            if (errJob) {
                                mm.rollbackConnection(connection);
                                return res.status(400).send({ code: 400, message: "Failed to update work order master." });
                            }
                            mm.executeDML(
                                `CALL Sp_ScheduleGetOrderSummary(?)`,
                                [ORDER_ID],
                                supportKey,
                                connection,
                                (errSummary, orderSummary) => {
                                    if (errSummary) {
                                        mm.rollbackConnection(connection);
                                        return res.status(400).send({ code: 400, message: "Failed to fetch work order details." });
                                    }

                                    const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has assigned work order ${JOB_CARD_NO} to technician ${TECHNICIAN_NAME}.`;

                                    const logarray = [{
                                        TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID, JOB_CARD_ID: ID, CUSTOMER_ID,
                                        LOG_TYPE: "Job", ACTION_LOG_TYPE: "User", ACTION_DETAILS,
                                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                        TECHNICIAN_NAME, ORDER_DATE_TIME: DATE, CART_ID: 0,
                                        EXPECTED_DATE_TIME: DATE, ORDER_MEDIUM: orderSummary[0][0].ORDER_MEDIUM,
                                        ORDER_STATUS: "Work order scheduled", PAYMENT_MODE: orderSummary[0][0].PAYMENT_MODE,
                                        PAYMENT_STATUS: orderSummary[0][0].PAYMENT_STATUS, TOTAL_AMOUNT: orderSummary[0][0].TOTAL_AMOUNT,
                                        ORDER_NUMBER: orderSummary[0][0].ORDER_NUMBER, TASK_DESCRIPTION: "",
                                        ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Work order assigned to technician",
                                        USER_NAME: req.body.authData.data.UserData[0].NAME,
                                        DATE_TIME: MongoLogDate, IANA_CODE, supportKey: 0
                                    }];
                                    mm.sendDynamicEmail(39, ID, supportKey)
                                    mm.sendDynamicEmail(57, ID, supportKey)
                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, "Work Order Scheduled", `Your work order for ${orderSummary[0][0].ORDER_NUMBER} has been scheduled for ${DATE}.Technician Assigned: ${TECHNICIAN_NAME}.`, "", "J", supportKey, "N", "J", logarray[0]);
                                    mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, ORDER_ID, "Work Order Scheduled", `Work order for ${orderSummary[0][0].ORDER_NUMBER} has been scheduled for ${DATE}.Technician Assigned: ${TECHNICIAN_NAME}. This notification is shared with you as the POC for tracking and coordination.`, "", "J", supportKey, "N", "J", []);
                                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "Work Order Scheduled for You", `A work order has been scheduled for ${orderSummary[0][0].ORDER_NUMBER}. \n Scheduled Date & Time: ${DATE}${START_TIME}.`, "", "J", supportKey, "N", "J", logarray[0]);

                                    dbm.saveLog(logarray, technicianActionLog);
                                    mm.commitConnection(connection);

                                    return res.status(200).send({ code: 200, message: "Technician schedule updated successfully." });
                                }
                            );
                        }
                    );
                }
            );
        }
        else if (req.body.IS_ORDER_JOB === "O") {
            return res.status(400).send({ code: 400, message: "ORDER level scheduling not implemented." });
        }

        else {
            mm.rollbackConnection(connection);
            return res.status(400).send({ code: 400, message: "Invalid ORDER_STATUS." });
        }
    } catch (e) {
        console.log("Global Error", e);
        return res.status(500).send({ code: 500, message: "Something went wrong." });
    }
};


exports.updateScheduleJobBACKUP = (req, res) => {

    const systemDate = mm.getSystemDate();
    const supportKey = req.headers['supportkey'];

    const {
        TERRITORY_ID, TECHNICIAN_ID, DATE, EXPECTED_END_DATE, START_TIME, END_TIME,
        JOB_CARD_NO, ORDER_ID, SERVICE_ID, ID, TECHNICIAN_NAME,
        ORGNISATION_ID, USER_ID, CUSTOMER_MANAGER_ID, VENDOR_ID,
        REASON, IANA_CODE
    } = req.body;

    try {

        if (!IANA_CODE) {
            return res.send({ code: 302, message: "Please provide the work order's timezone to proceed" });
        }

        const connection = mm.openConnection();

        //-------------------------------------------------
        // Helper: Normalize date
        //-------------------------------------------------

        const normalizeDate = (d) => {
            if (!d) return null;
            if (typeof d === "string") return d.split("T")[0];
            if (d instanceof Date) return d.toISOString().split("T")[0];
            return new Date(d).toISOString().split("T")[0];
        };

        //-------------------------------------------------
        // Helper: Normalize time
        //-------------------------------------------------

        const normalizeTime = (t) => {
            if (!t) return "00:00";
            if (t.length === 8) return t.substring(0, 5);
            return t;
        };

        //-------------------------------------------------
        // Load OLD_DATA from DB (SP)
        //-------------------------------------------------

        mm.executeDML(
            `CALL Sp_UpdateSchedule_GetJobCard(?)`,
            [ID],
            supportKey,
            connection,
            (err, rows) => {

                if (err) {
                    mm.rollbackConnection(connection);
                    return res.status(400).send({ code: 400, message: "Error reading job card." });
                }

                const OLD_DATA = rows[0][0];

                console.log("@@@ OLD DATA:", OLD_DATA);

                //-------------------------------------------------
                // Normalize old values
                //-------------------------------------------------

                const OLD_START = normalizeTime(OLD_DATA.START_TIME);
                const OLD_END = normalizeTime(OLD_DATA.END_TIME);
                const OLD_START_DATE = normalizeDate(OLD_DATA.SCHEDULED_DATE_TIME);
                const OLD_END_DATE = normalizeDate(OLD_DATA.EXPECTED_END_DATE);

                //-------------------------------------------------
                // Normalize new values
                //-------------------------------------------------

                const NEW_START = normalizeTime(START_TIME);
                const NEW_END = normalizeTime(END_TIME);
                const NEW_START_DATE = normalizeDate(DATE);
                const NEW_END_DATE = normalizeDate(EXPECTED_END_DATE);

                //-------------------------------------------------
                // Build date ranges
                //-------------------------------------------------

                const buildRange = (startDate, endDate, startTime, endTime) => {

                    const range = [];
                    let start = new Date(startDate);
                    let end = new Date(endDate);
                    let dt = new Date(start);

                    while (dt <= end) {

                        const day = dt.toISOString().split("T")[0];

                        if (day === startDate && day === endDate) {
                            range.push({ date: day, start: startTime, end: endTime });

                        } else if (day === startDate) {
                            range.push({ date: day, start: startTime, end: "23:50" });

                        } else if (day === endDate) {
                            range.push({ date: day, start: "00:00", end: endTime });

                        } else {
                            range.push({ date: day, start: "00:00", end: "23:50" });
                        }

                        dt.setDate(dt.getDate() + 1);
                    }

                    return range;
                };

                const oldRange = buildRange(OLD_START_DATE, OLD_END_DATE, OLD_START, OLD_END);
                const newRange = buildRange(NEW_START_DATE, NEW_END_DATE, NEW_START, NEW_END);

                //-------------------------------------------------
                // STEP 1: Clear old slots
                //-------------------------------------------------

                async.eachSeries(oldRange, (slot, cbOld) => {

                    const start = parseTime(slot.start);
                    const end = parseTime(slot.end);
                    const slots = generateTimeSlots(start, end);

                    const clearClause = slots.map(s => `\`${s}\`=NULL`).join(",");

                    const query = `
                        UPDATE technicianschedule
                        SET ${clearClause}, CREATED_MODIFIED_DATE='${mm.getSystemDate()}'
                        WHERE TERRITORY_ID=${OLD_DATA.TERRITORY_ID}
                        AND TECHNICIAN_ID=${OLD_DATA.TECHNICIAN_ID}
                        AND DATE(DATE)='${slot.date}'
                    `;

                    mm.executeDML(
                        `CALL Sp_UpdateSchedule_ExecuteSchedule(?)`,
                        [query],
                        supportKey,
                        connection,
                        () => cbOld()
                    );

                }, () => {

                    //-------------------------------------------------
                    // STEP 2: Insert / Update new schedule
                    //-------------------------------------------------

                    async.eachSeries(newRange, (slot, cbNew) => {

                        const start = parseTime(slot.start);
                        const end = parseTime(slot.end);
                        const slots = generateTimeSlots(start, end);

                        mm.executeDML(
                            `CALL GetTechnicianSchedule(?,?)`,
                            [TECHNICIAN_ID, slot.date],
                            supportKey,
                            connection,
                            (err, rows) => {

                                if (err) return cbNew(err);

                                const values = slots.map(() => `${JOB_CARD_NO},AS,${CUSTOMER_MANAGER_ID}`);

                                let query;

                                if (rows[0].length > 0) {

                                    const setClause = slots.map(
                                        (s, i) => `\`${s}\`='${values[i]}'`
                                    ).join(",");

                                    query = `
                                        UPDATE technicianschedule
                                        SET ${setClause},
                                        DATE='${slot.date}',
                                        CREATED_MODIFIED_DATE='${mm.getSystemDate()}'
                                        WHERE TERRITORY_ID=${TERRITORY_ID}
                                        AND TECHNICIAN_ID=${TECHNICIAN_ID}
                                        AND DATE(DATE)='${slot.date}'
                                    `;

                                } else {

                                    const columns = slots.map(s => `\`${s}\``).join(",");
                                    const vals = values.map(v => `'${v}'`).join(",");

                                    query = `
                                        INSERT INTO technicianschedule
                                        (${columns}, TECHNICIAN_NAME, DATE, CREATED_MODIFIED_DATE, TERRITORY_ID, TECHNICIAN_ID)
                                        VALUES (${vals}, '${TECHNICIAN_NAME}', '${slot.date}', '${mm.getSystemDate()}', ${TERRITORY_ID}, ${TECHNICIAN_ID})
                                    `;
                                }

                                mm.executeDML(
                                    `CALL Sp_UpdateSchedule_ExecuteSchedule(?)`,
                                    [query],
                                    supportKey,
                                    connection,
                                    () => cbNew()
                                );

                            }
                        );

                    }, () => {

                        //-------------------------------------------------
                        // STEP 3: Update Job Card
                        //-------------------------------------------------

                        mm.executeDML(
                            `CALL Sp_UpdateSchedule_UpdateJobCard(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                            [
                                2,
                                "AS",
                                TECHNICIAN_ID,
                                TECHNICIAN_NAME,
                                NEW_START_DATE,
                                NEW_START,
                                NEW_END,
                                NEW_END_DATE,
                                USER_ID,
                                mm.getSystemDate(),
                                ORGNISATION_ID,
                                VENDOR_ID,
                                REASON || "",
                                ID
                            ],
                            supportKey,
                            connection,
                            () => {

                                mm.commitConnection(connection);

                                res.send({
                                    code: 200,
                                    message: "Technician schedule updated successfully"
                                });

                            }
                        );

                    });

                });

            }
        );

    }
    catch (err) {

        console.error("ERROR in updateScheduleJob:", err);

        return res.status(500).send({
            code: 500,
            message: "Something went wrong."
        });

    }

};

exports.updateScheduleJob = (req, res) => {

    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    const {
        TERRITORY_ID, TECHNICIAN_ID, DATE, EXPECTED_END_DATE,
        START_TIME, END_TIME, JOB_CARD_NO, ID,
        TECHNICIAN_NAME, ORGNISATION_ID, USER_ID,
        CUSTOMER_MANAGER_ID, VENDOR_ID, REASON, IANA_CODE, ORDER_ID, CUSTOMER_ID
    } = req.body;

    try {

        if (!IANA_CODE) {
            return res.send({ code: 302, message: "Please provide the work order's timezone to proceed" });
        }

        const connection = mm.openConnection();

        //------------------------------------------------
        // Helper functions
        //------------------------------------------------

        const normalizeDate = (d) => {
            if (!d) return null;
            if (typeof d === "string") return d.split("T")[0];
            if (d instanceof Date) return d.toISOString().split("T")[0];
            return new Date(d).toISOString().split("T")[0];
        };

        const normalizeTime = (t) => {
            if (!t) return "00:00";
            if (t.length === 8) return t.substring(0, 5);
            return t;
        };

        //------------------------------------------------
        // Get old job card
        //------------------------------------------------

        mm.executeDML(
            `CALL Sp_UpdateSchedule_GetJobCard(?)`,
            [ID],
            supportKey,
            connection,
            (err, rows) => {

                if (err) {
                    mm.rollbackConnection(connection);
                    return res.status(400).send({ code: 400, message: "Error reading job card." });
                }

                if (!rows[0] || rows[0].length === 0) {
                    mm.rollbackConnection(connection);
                    return res.status(404).send({ code: 404, message: "Job card not found" });
                }

                const OLD_DATA = rows[0][0];
                const OLD_START = normalizeTime(OLD_DATA.START_TIME);
                const OLD_END = normalizeTime(OLD_DATA.END_TIME);
                const OLD_START_DATE = normalizeDate(OLD_DATA.SCHEDULED_DATE_TIME);
                const OLD_END_DATE = normalizeDate(OLD_DATA.EXPECTED_END_DATE);

                const NEW_START = normalizeTime(START_TIME);
                const NEW_END = normalizeTime(END_TIME);
                const NEW_START_DATE = normalizeDate(DATE);
                const NEW_END_DATE = normalizeDate(EXPECTED_END_DATE);

                //------------------------------------------------
                // Build date ranges
                //------------------------------------------------

                const buildRange = (startDate, endDate, startTime, endTime) => {

                    const range = [];
                    let start = new Date(startDate);
                    let end = new Date(endDate);
                    let dt = new Date(start);

                    while (dt <= end) {

                        const day = dt.toISOString().split("T")[0];

                        if (day === startDate && day === endDate) {
                            range.push({ date: day, start: startTime, end: endTime });
                        }
                        else if (day === startDate) {
                            range.push({ date: day, start: startTime, end: "23:50" });
                        }
                        else if (day === endDate) {
                            range.push({ date: day, start: "00:00", end: endTime });
                        }
                        else {
                            range.push({ date: day, start: "00:00", end: "23:50" });
                        }

                        dt.setDate(dt.getDate() + 1);
                    }

                    return range;
                };

                const oldRange = buildRange(OLD_START_DATE, OLD_END_DATE, OLD_START, OLD_END);
                const newRange = buildRange(NEW_START_DATE, NEW_END_DATE, NEW_START, NEW_END);

                //------------------------------------------------
                // STEP 1 : Clear old slots
                //------------------------------------------------

                async.eachSeries(oldRange, (slot, cbOld) => {

                    const start = parseTime(slot.start);
                    const end = parseTime(slot.end);
                    const slots = generateTimeSlots(start, end);

                    const clearClause = slots.map(s => `\`${s}\`=NULL`).join(",");

                    const query = `
                        UPDATE technicianschedule
                        SET ${clearClause},
                        CREATED_MODIFIED_DATE='${systemDate}'
                        WHERE TERRITORY_ID=${OLD_DATA.TERRITORY_ID}
                        AND TECHNICIAN_ID=${OLD_DATA.TECHNICIAN_ID}
                        AND DATE(DATE)='${slot.date}'
                    `;

                    mm.executeDML(
                        `CALL Sp_UpdateSchedule_ExecuteSchedule(?)`,
                        [query],
                        supportKey,
                        connection,
                        (err) => {
                            if (err) return cbOld(err);
                            cbOld();
                        }
                    );

                }, (err) => {

                    if (err) {
                        mm.rollbackConnection(connection);
                        return res.status(400).send({ code: 400, message: "Failed to clear old schedule." });
                    }

                    //------------------------------------------------
                    // STEP 2 : Insert / Update new schedule
                    //------------------------------------------------

                    async.eachSeries(newRange, (slot, cbNew) => {

                        const start = parseTime(slot.start);
                        const end = parseTime(slot.end);
                        const slots = generateTimeSlots(start, end);

                        mm.executeDML(
                            `CALL GetTechnicianScheduleForUpdate(?,?)`,
                            [TECHNICIAN_ID, slot.date],
                            supportKey,
                            connection,
                            (err, rows) => {

                                if (err) return cbNew(err);

                                const values = slots.map(() => `${JOB_CARD_NO},AS,${CUSTOMER_MANAGER_ID}`);

                                let query;

                                if (rows[0].length > 0) {

                                    const setClause = slots.map((s, i) => `\`${s}\`='${values[i]}'`).join(",");

                                    query = `
                                        UPDATE technicianschedule
                                        SET ${setClause},
                                        DATE='${slot.date}',
                                        CREATED_MODIFIED_DATE='${systemDate}'
                                        WHERE TERRITORY_ID=${TERRITORY_ID}
                                        AND TECHNICIAN_ID=${TECHNICIAN_ID}
                                        AND DATE(DATE)='${slot.date}'
                                    `;

                                }
                                else {

                                    const columns = slots.map(s => `\`${s}\``).join(",");
                                    const vals = values.map(v => `'${v}'`).join(",");

                                    query = `
                                        INSERT INTO technicianschedule
                                        (${columns},TECHNICIAN_NAME,DATE,CREATED_MODIFIED_DATE,TERRITORY_ID,TECHNICIAN_ID)
                                        VALUES (${vals},'${TECHNICIAN_NAME}','${slot.date}','${systemDate}',${TERRITORY_ID},${TECHNICIAN_ID})
                                    `;

                                }

                                mm.executeDML(
                                    `CALL Sp_UpdateSchedule_ExecuteSchedule(?)`,
                                    [query],
                                    supportKey,
                                    connection,
                                    (err) => {
                                        if (err) return cbNew(err);
                                        cbNew();
                                    }
                                );

                            }
                        );

                    }, (err) => {

                        if (err) {
                            mm.rollbackConnection(connection);
                            return res.status(400).send({ code: 400, message: "Failed to update technician schedule." });
                        }

                        //------------------------------------------------
                        // STEP 3 : Update job card
                        //------------------------------------------------

                        mm.executeDML(
                            `CALL Sp_UpdateSchedule_UpdateJobCard(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                            [
                                2,
                                "AS",
                                TECHNICIAN_ID,
                                TECHNICIAN_NAME,
                                NEW_START_DATE,
                                NEW_START,
                                NEW_END,
                                NEW_END_DATE,
                                USER_ID,
                                systemDate,
                                ORGNISATION_ID,
                                VENDOR_ID,
                                REASON || "",
                                ID
                            ],
                            supportKey,
                            connection,
                            (err) => {

                                if (err) {
                                    mm.rollbackConnection(connection);
                                    return res.status(400).send({ code: 400, message: "Failed to update job card." });
                                }

                                mm.executeDML(
                                    `CALL Sp_ScheduleGetOrderSummary(?)`,
                                    [ORDER_ID],
                                    supportKey,
                                    connection,
                                    (errSummary, orderRows) => {
                                        if (errSummary) {
                                            mm.rollbackConnection(connection);
                                            return res.status(400).send({ code: 400, message: "Failed to fetch work order details." });
                                        }
                                        console.log("@@@ Order Summary:", orderRows);
                                        orderRows = orderRows[0]; // extract actual rows

                                        const getUTCfromTimeZone = mm.getUTCDateFromTimezone(IANA_CODE);


                                        const ACTION_DETAILS =
                                            `${req.body.authData.data.UserData[0].NAME} has removed job ${JOB_CARD_NO} from technician ${OLD_DATA.TECHNICIAN_NAME} and reassigned to technician ${TECHNICIAN_NAME}.`;

                                        const logData = {
                                            TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID, JOB_CARD_ID: ID,
                                            CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User',
                                            ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                            TECHNICIAN_NAME, ORDER_DATE_TIME: DATE, CART_ID: 0,
                                            EXPECTED_DATE_TIME: DATE, ORDER_MEDIUM: "",
                                            ORDER_STATUS: "Job rescheduled to another technician",
                                            ORDER_NUMBER: orderRows[0].ORDER_NUMBER,
                                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                                            DATE_TIME: getUTCfromTimeZone,
                                            IANA_CODE,
                                            supportKey: 0
                                        };
                                        mm.sendDynamicEmail(39, ID, supportKey)
                                        mm.sendDynamicEmail(57, ID, supportKey)

                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, "Job Scheduled", `Your job for ${orderRows[0].ORDER_NUMBER} has been scheduled for ${DATE}.Technician Assigned: ${TECHNICIAN_NAME}.`, "", "J", supportKey, "N", "J", orderRows);
                                        mm.sendNotificationToSPOCChannel(req.body.authData.data.UserData[0].USER_ID, ORDER_ID, "Job Scheduled", `Job for ${orderRows[0].ORDER_NUMBER} has been scheduled for ${DATE}.Technician Assigned: ${TECHNICIAN_NAME}.This notification is shared with you as the POC for tracking and coordination.`, "", "J", supportKey, "N", "J", orderRows);
                                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "Job Scheduled for You", `A job has been scheduled for ${orderRows[0].ORDER_NUMBER}. \n Scheduled Date & Time: ${DATE}${START_TIME}.`, "", "J", supportKey, "N", "J", orderRows);
                                        dbm.saveLog(logData, technicianActionLog);
                                        mm.commitConnection(connection);


                                        res.send({
                                            code: 200,
                                            message: "Technician schedule updated successfully"
                                        });

                                    }
                                );

                            });

                    });

                });
            });
    }
    catch (err) {

        console.error("ERROR in updateScheduleJob:", err);

        return res.status(500).send({
            code: 500,
            message: "Something went wrong."
        });

    }

};

mm.executeQueryPromise = function (query, supportKey) {
    return new Promise((resolve, reject) => {
        mm.executeQuery(query, supportKey, (err, result) => {
            if (err) reject(err);
            else resolve([result]);
        });
    });
};

// Helper function to promisify mm.executeQueryData
const executeQueryDataAsync = (query, params, supportKey) => {
    return new Promise((resolve, reject) => {
        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results);
        });
    });
};

// Helper function for distance and time (assuming it's synchronous or promisified)
const getDistanceAndTimeAsync = (lat1, lon1, lat2, lon2, speed) => {
    // If getDistanceAndTime is callback-based, promisify it similarly to executeQueryDataAsync
    return new Promise((resolve) => {
        resolve(getDistanceAndTime(lat1, lon1, lat2, lon2, speed));
    });
};


function formatMinutesToHoursAndMinutes(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}hr${hrs > 1 ? 's' : ''} ${mins}min` : `${mins}min`;
}

async function getDistanceDataFromGoogleAPI(lat1, lon1, lat2, lon2) {
    // const API_KEYOLD = 'AIzaSyA1EJJ0RMDQwzsDd00Oziy1pytYn_Ozi-g';
    const API_KEY = 'AIzaSyDT0rIRA3oOkwIhszO4xoZIiYfzkTc_4WY';
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=${API_KEY}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === "OK" && response.data.rows[0].elements[0].status === "OK") {
            const element = response.data.rows[0].elements[0];
            return {
                distance: element.distance.text,
                duration: element.duration.text || "Unknown",
            };
        } else {
            throw new Error(`Distance Matrix API error: ${response.data.status}`);
        }
    } catch (error) {
        console.error("Error fetching data from Google Maps API:", error.message);
        return { distance: "N/A", duration: "N/A" };
    }
}


function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}


function parseTime(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return { hours: h, minutes: m };
}

function generateTimeSlots(start, end) {
    const slots = [];
    let current = new Date(0, 0, 0, start.hours, start.minutes);

    while (current <= new Date(0, 0, 0, end.hours, end.minutes)) {
        slots.push(
            `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`
        );
        current.setMinutes(current.getMinutes() + 10);
    }
    return slots;
}

function getNumericDistance(value) {
    if (!value) return Infinity; // handle null/undefined

    return parseFloat(
        value
            .toString()
            .replace(/,/g, '')      // remove commas
            .replace(/[^\d.]/g, '') // remove 'km', spaces, etc.
    ) || Infinity; // fallback if NaN
}

function sortTechnicians(technicianData, sortOrder) {
    return technicianData.sort((a, b) => {
        for (const { KEY } of sortOrder) {
            switch (KEY) {
                case 'SK': {
                    const aSkill = parseInt(a.MATCHED_SKILLS);
                    const bSkill = parseInt(b.MATCHED_SKILLS);
                    if (aSkill !== bSkill) return bSkill - aSkill;
                    break;
                }
                case 'D': {
                    const aDistance = getNumericDistance(a.DISTANCE_IN_KM);
                    const bDistance = getNumericDistance(b.DISTANCE_IN_KM);
                    if (aDistance !== bDistance) return aDistance - bDistance;
                    break;
                }
                case 'S': {
                    if (a.WORK_DEVIATIONS !== b.WORK_DEVIATIONS) {
                        return a.WORK_DEVIATIONS - b.WORK_DEVIATIONS;
                    }
                    break;
                }
                case 'B': {
                    if (a.BREAK_DEVIATIONS !== b.BREAK_DEVIATIONS) {
                        return a.BREAK_DEVIATIONS - b.BREAK_DEVIATIONS;
                    }
                    break;
                }
                case 'R': {
                    if (a.AVG_RATINGS !== b.AVG_RATINGS) {
                        return b.AVG_RATINGS - a.AVG_RATINGS;
                    }
                    break;
                }
            }
        }
        if (technicianData.length <= 1) {
            return technicianData;
        } else {
            return 0;
        }
    });
}

function getDistanceAndTime(lat1, lon1, lat2, lon2, averageSpeedKmph = 60) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const estimatedTimeHours = distance / averageSpeedKmph;

    return {
        distance: distance.toFixed(2),
        estimatedTimeHours: estimatedTimeHours.toFixed(2),
    };
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

