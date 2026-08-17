const technicainDayLog = require("../modules/technicainDayLog");
const technicianActivity = require("../modules/technicianActionLog")
const technicianActivityCalender = require("../modules/technicianActivityCalender")
const { validationResult, body } = require("express-validator");
const mm = require('../utilities/globalModule');

exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('LOG_DATE_TIME').optional(),
        body('LOG_TEXT').optional(),
        body('STATUS').optional(),
        body('TYPE').optional(),
        body('USER_ID').optional(),
        body('ID').optional(),
    ]
}
exports.get = async (req, res) => {
    try {
        const {
            pageIndex = 1,
            pageSize,
            sortKey = "ID",
            sortValue = "DESC",
            searchValue = "",
        } = req.body;

        const sortOrder = sortValue.toLowerCase() === "desc" ? -1 : 1;
        const skip = (pageIndex - 1) * pageSize;
        let filter = req.body.filter || {};

        if (searchValue) {
            searchFilter = {
                $or: req.body.searchFields.map(field => ({
                    [field]: { $regex: searchValue, $options: "i" }
                }))
            };
            filter = { $and: [filter, searchFilter] }
        }

        const totalCount = await technicainDayLog.countDocuments(filter);
        const data = await technicainDayLog.find(filter)
            .sort({ [sortKey]: sortOrder })
            .skip(skip)
            .limit(parseInt(pageSize));

        res.status(200).json({
            code: 200,
            message: "success",
            count: totalCount,
            data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong.",
        });
    }
};


exports.create = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                code: 422,
                message: errors.array(),
            });
        }

        const data = req.body;

        const newtechnicainDayLog = new technicainDayLog(data);

        const savedtechnicainDayLog = await newtechnicainDayLog.save();
        res.status(200).json({
            code: 200,
            message: "technicainDayLog information saved successfully."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.update = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                code: 422,
                message: errors.array(),
            });
        }

        const { ID, ...data } = req.body;

        if (!ID) {
            return res.status(400).json({
                code: 400,
                message: "ID is required for updating.",
            });
        }

        const updatedtechnicainDayLog = await technicainDayLog.findByIdAndUpdate(ID, data, { new: true });

        if (!updatedtechnicainDayLog) {
            return res.status(404).json({
                code: 404,
                message: "technicainDayLog not found.",
            });
        }

        res.status(200).json({
            code: 200,
            message: "technicainDayLog information updated successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong.",
        });
    }
};


exports.addLog = async (req, res) => {
    let data = req.body;
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    data.LOG_DATE_TIME = new Date();
    if (!data.TECHNICIAN_ID) {
        return res.status(422).json({
            code: 422,
            message: "TECHNICIAN_ID is required"
        });
    }

    const IS_UPDATED_ADMIN = data.IS_UPDATED_ADMIN;
    let TECHNICIAN_STATUS, key = "";

    data.USER_ID = req.body.authData.data.UserData[0].USER_ID ? req.body.authData.data.UserData[0].USER_ID : data.TECHNICIAN_ID
    data.USER_NAME = IS_UPDATED_ADMIN === 1 ? req.body.authData.data.UserData[0].USER_NAME : req.body.authData.data.UserData[0].USER_NAME
    data.TECHNICIAN_NAME = IS_UPDATED_ADMIN === 1 ? req.body.TECHNICIAN_NAME : req.body.authData.data.UserData[0].USER_NAME


    if (data.STATUS === "EN") {
        key = IS_UPDATED_ADMIN === 1 ? "is enabled by you" : "has enabled himself";
        data.LOG_TEXT = IS_UPDATED_ADMIN === 1 ? "Technician " + data.TECHNICIAN_NAME + " Enabled by Admin" : "Technician " + data.TECHNICIAN_NAME + " Enabled himself";
        data.TYPE = IS_UPDATED_ADMIN === 1 ? "ADMIN" : "TECHNICIAN";
        TECHNICIAN_STATUS = 1;
    } else if (data.STATUS === "DE") {
        key = IS_UPDATED_ADMIN === 1 ? "is disabled by you" : "has disabled himself";
        data.LOG_TEXT = IS_UPDATED_ADMIN === 1 ? "Technician " + data.TECHNICIAN_NAME + " Disabled by Admin" : "Technician " + data.TECHNICIAN_NAME + " Disabled himself";
        data.TYPE = IS_UPDATED_ADMIN === 1 ? "ADMIN" : "TECHNICIAN";
        TECHNICIAN_STATUS = 0;
    } else {
        return res.status(422).json({
            code: 422,
            message: "Invalid Status"
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            code: 422,
            message: errors.array()
        });
    }

    try {

        const newLog = new technicainDayLog(data);
        await newLog.save();

        mm.executeQueryData('CALL sp_addLog_technician_update(?,?)', [TECHNICIAN_STATUS, data.TECHNICIAN_ID], supportKey, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(400).json({
                    code: 400,
                    message: "Failed to update technician_master information..."
                });
            }
            let notificationData = {
                TECHNICIAN_ID: data.TECHNICIAN_ID,
                TECHNICIAN_NAME: data.TECHNICIAN_NAME,
                STATUS: data.STATUS
            };
            // mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Technician Activity Notification", `Hello Admin, The technician ${data.TECHNICIAN_NAME} ${key}`, "", "TA", "", supportKey, "TA", data);
            mm.sendNotificationToChannel(0, 'admin_channel', "Technician Activity Notification", `Hello Admin, The technician ${req.body.TECHNICIAN_NAME} ${key}`, "", "TA", supportKey, "", "TA", notificationData);

            res.status(200).json({
                code: 200,
                message: "Successfully updated technician_master information..."
            });
        }
        );
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            code: 400,
            message: "Something went wrong."
        });
    }
};




exports.getDateWiseLogs = async (req, res) => {
    const pageIndex = req.body.pageIndex ? parseInt(req.body.pageIndex) : 1;
    const pageSize = req.body.pageSize ? parseInt(req.body.pageSize) : 10;
    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue === 'ASC' ? 1 : -1;
    const filter = req.body.filter || {};
    const supportKey = req.headers['supportkey'];

    try {

        const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
        if (IS_FILTER_WRONG === '0') {
            const matchCriteria = filter;
            const countResult = await technicainDayLog.aggregate([
                { $match: matchCriteria },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$LOG_DATE_TIME' } } } },
                { $count: 'cnt' }
            ]);

            const totalDistinctDates = countResult[0]?.cnt || 0;

            const dataResult = await technicainDayLog.aggregate([
                { $match: matchCriteria },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$LOG_DATE_TIME' } },
                        ACTION_LOGS: {
                            $push: {
                                ID: '$ID',
                                TECHNICIAN_ID: '$TECHNICIAN_ID',
                                TYPE: '$TYPE',
                                LOG_TEXT: '$LOG_TEXT',
                                STATUS: '$STATUS',
                                USER_ID: '$USER_ID',
                                USER_NAME: '$USER_NAME',
                                TECHNICIAN_NAME: '$TECHNICIAN_NAME',
                                TIME: { $dateToString: { format: '%H:%M:%S', date: '$LOG_DATE_TIME' } }
                            }
                        }
                    }
                },
                { $sort: { _id: sortValue } },
                { $skip: (pageIndex - 1) * pageSize },
                { $limit: pageSize }
            ]);

            res.status(200).send({
                code: 200,
                message: 'success',
                count: totalDistinctDates,
                data: dataResult
            });
        } else {
            res.status(422).send({
                code: 422,
                message: 'Invalid filter provided.'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            code: 500,
            message: 'Internal Server Error.'
        });
    }
};

exports.getTechnicianTimeSheet = async (req, res) => {
    let { TECHNICIAN_ID, FROM_DATE, TO_DATE, pageIndex, pageSize, sortKey = "_id", sortValue = "DESC" } = req.body;

    try {
        const sortOrder = sortValue.toLowerCase() === "desc" ? -1 : 1;

        const skip = pageIndex && pageSize ? (pageIndex - 1) * pageSize : 0;
        const limit = pageSize ? parseInt(pageSize) : 0;

        const filters = {
            $and: [
                {
                    $expr: {
                        $and: [
                            { $gte: [{ $dateToString: { format: "%Y-%m-%d", date: "$DATE_TIME" } }, FROM_DATE] },
                            { $lte: [{ $dateToString: { format: "%Y-%m-%d", date: "$DATE_TIME" } }, TO_DATE] }
                        ]
                    }
                },
                { LOG_TYPE: "Job" },
                { TECHNICIAN_ID: TECHNICIAN_ID }
            ]
        };

        const totalCount = await technicianActivity.countDocuments(filters);
        const aggregationPipeline = [
            { $match: filters },
            { $sort: { [sortKey]: sortOrder } },
            {
                $group: {
                    _id: "$JOB_CARD_ID",
                    TECHNICIAN_ID: { $first: "$TECHNICIAN_ID" },
                    INITIATE_DATE: {
                        $max: {
                            $cond: [{ $eq: ["$JOB_CARD_STATUS", "Technician has started traveling for the work order"] }, "$DATE_TIME", null]
                        }
                    },
                    REACHED_AT_LOCATION: {
                        $max: {
                            $cond: [{ $eq: ["$JOB_CARD_STATUS", "Technician has reached at customer location"] }, "$DATE_TIME", null]
                        }
                    },
                    START_JOB: {
                        $max: {
                            $cond: [{ $eq: ["$JOB_CARD_STATUS", "Technician has started the work order"] }, "$DATE_TIME", null]
                        }
                    },
                    PAUSE_JOB: {
                        $max: {
                            $cond: [{ $eq: ["$JOB_CARD_STATUS", "Technician has paused the work order"] }, "$DATE_TIME", null]
                        }
                    },
                    RESUME_JOB: {
                        $max: {
                            $cond: [{ $eq: ["$JOB_CARD_STATUS", "Technician has resumed the work order"] }, "$DATE_TIME", null]
                        }
                    },
                    //multiple pause and resume purpose 
                    // PAUSE_JOB: {
                    //     $push: {
                    //         $cond: [{ $eq: ["$JOB_CARD_STATUS", "Technician is paused the work order"] }, "$DATE_TIME", null]
                    //     }
                    // },
                    // RESUME_JOB: {
                    //     $push: {
                    //         $cond: [{ $eq: ["$JOB_CARD_STATUS", "Technician is resumed the work order"] }, "$DATE_TIME", null]
                    //     }
                    // },

                    END_JOB: {
                        $max: {
                            $cond: [{ $eq: ["$JOB_CARD_STATUS", "Technician has completed the work order"] }, "$DATE_TIME", null]
                        }
                    }
                }
            },
            { $sort: { [sortKey]: sortOrder } }
        ];

        if (pageIndex && pageSize) {
            aggregationPipeline.push({ $skip: skip }, { $limit: limit });
        }

        const logs = await technicianActivity.aggregate(aggregationPipeline);
        console.log("\n\n\n\n The Logs Are:", logs);
        let ids = logs
            .filter(log => log.TECHNICIAN_ID === TECHNICIAN_ID)
            .map(log => log._id);
        console.log(ids)
        if (ids.length > 0) {
            mm.executeQueryData( `CALL sp_getJobCardsByIds(?, ?)`,
            [IDS, TECHNICIAN_ID], "supportKey", (error, resultjob) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        message: "Failed to get work order number"
                    });
                } else {
                    let jobCardMap = {};
                    resultjob.forEach(job => {
                        jobCardMap[job.ID] = job;
                    });

                    logs.forEach(log => {
                        Object.assign(log, jobCardMap[log._id] || {});
                    });

                    const payload = {
                        "pageSize": req.body.pageSize,
                        "pageIndex": req.body.pageIndex,
                        "SEARCHVALUE": req.body.SEARCHVALUE,
                        "sortKey": req.body.sortKey,
                        "sortValue": req.body.sortValue,
                        "ORDER_ID": req.body.ORDER_ID,
                        "ORDER_NO": req.body.ORDER_NO,
                        "JOB_CARD_ID": req.body.JOB_CARD_ID,
                        "SERVICE_ID": req.body.SERVICE_ID,
                        "CUSTOMER_ID": req.body.CUSTOMER_ID,
                        "CUSTOMER_TYPE": req.body.CUSTOMER_TYPE,
                        "TERRITORY_ID": req.body.TERRITORY_ID,
                    };


                    const resultSort = sortAndFilterData(logs, payload);

                    return res.status(200).json({
                        code: 200,
                        message: "Data fetched successfully",
                        count: resultSort.length > 0 ? resultSort.length : 0,
                        data: resultSort
                    });
                }
            });
        } else {
            return res.status(200).json({
                code: 200,
                message: "No data found",
                count: totalCount,
                data: []
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

function sortAndFilterData(data, payload) {
    let filteredData = [...data];

    if (payload.TECHNICIAN_ID) {
        filteredData = filteredData.filter(item => item.TECHNICIAN_ID === payload.TECHNICIAN_ID);
    }

    if (payload.FROM_DATE && payload.TO_DATE) {
        const fromDate = new Date(payload.FROM_DATE).getTime();
        const toDate = new Date(payload.TO_DATE).getTime() + 86400000;

        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.INITIATE_DATE).getTime();
            return itemDate >= fromDate && itemDate < toDate;
        });
    }

    // if (payload.ORDER_ID && payload.ORDER_ID.length > 0) {
    //     filteredData = filteredData.filter(item => payload.ORDER_ID.includes(item.ORDER_ID));
    // }
    if (payload.ORDER_NO && payload.ORDER_NO.length > 0) {
        filteredData = filteredData.filter(item => payload.ORDER_NO.includes(item.ORDER_NO));
    }
    if (payload.JOB_CARD_ID && payload.JOB_CARD_ID.length > 0) {
        filteredData = filteredData.filter(item => payload.JOB_CARD_ID.includes(item.ID));
    }

    if (payload.SERVICE_ID && payload.SERVICE_ID.length > 0) {
        filteredData = filteredData.filter(item => payload.SERVICE_ID.includes(item.SERVICE_ID));
    }

    if (payload.CUSTOMER_ID && payload.CUSTOMER_ID.length > 0) {
        filteredData = filteredData.filter(item => payload.CUSTOMER_ID.includes(item.CUSTOMER_ID));
    }

    if (payload.CUSTOMER_TYPE && payload.CUSTOMER_TYPE.length > 0) {
        filteredData = filteredData.filter(item => payload.CUSTOMER_TYPE.includes(item.CUSTOMER_TYPE));
    }

    if (payload.SEARCHVALUE && payload.SEARCHVALUE.length > 0) {
        filteredData = filteredData.filter(item => {
            const searchValueLower = payload.SEARCHVALUE.toLowerCase();
            return Object.values(item).some(value => {
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(searchValueLower);
                }
                return false;
            });
        });
    }

    if (payload.TERRITORY_ID && payload.TERRITORY_ID.length > 0) {
        filteredData = filteredData.filter(item => payload.TERRITORY_ID.includes(item.TERRITORY_ID));
    }

    if (payload.sortKey && payload.sortValue) {
        const sortKey = payload.sortKey;
        const sortValue = payload.sortValue.toUpperCase();

        filteredData.sort((a, b) => {
            if (a[sortKey] < b[sortKey]) {
                return sortValue === 'ASC' ? -1 : 1;
            }
            if (a[sortKey] > b[sortKey]) {
                return sortValue === 'ASC' ? 1 : -1;
            }
            return 0;
        });
    }

    const pageSize = payload.pageSize || 10;
    const pageIndex = payload.pageIndex || 1;

    const startIndex = (pageIndex - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredData.slice(startIndex, endIndex);
}
