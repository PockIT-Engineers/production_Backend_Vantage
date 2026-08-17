const shopOrderActionLog = require("../modules/shopOrderActionLog");
const { validationResult, body } = require("express-validator");
const mm = require('../utilities/globalModule');
const { json } = require("body-parser");

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
            filter = {
                $or: req.body.searchFields.map(field => ({
                    [field]: { $regex: searchValue, $options: "i" }
                }))
            };
        }

        const totalCount = await shopOrderActionLog.countDocuments(filter);
        const data = await shopOrderActionLog.find(filter)
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

        const newshopOrderActionLog = new shopOrderActionLog(data);

        const savedshopOrderActionLog = await newshopOrderActionLog.save();
        res.status(200).json({
            code: 200,
            message: "shopOrderActionLog information saved successfully."
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

        const updatedshopOrderActionLog = await shopOrderActionLog.findByIdAndUpdate(ID, data, { new: true });

        if (!updatedshopOrderActionLog) {
            return res.status(404).json({
                code: 404,
                message: "shopOrderActionLog not found.",
            });
        }

        res.status(200).json({
            code: 200,
            message: "shopOrderActionLog information updated successfully.",
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
        data.USER_ID = req.body.authData.data.UserData[0].USER_ID ? req.body.authData.data.UserData[0].USER_ID : data.TECHNICIAN_ID
        data.USER_NAME = IS_UPDATED_ADMIN === 1 ? req.body.authData.data.UserData[0].USER_NAME : req.body.authData.data.UserData[0].USER_NAME
        data.TECHNICIAN_NAME = IS_UPDATED_ADMIN === 1 ? req.body.TECHNICIAN_NAME : req.body.authData.data.UserData[0].USER_NAME

        const newLog = new shopOrderActionLog(data);
        await newLog.save();
        mm.executeQueryData('CALL sp_updateTechnicianStatus(?, ?)', [TECHNICIAN_STATUS, data.TECHNICIAN_ID], supportKey, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(400).json({
                    code: 400,
                    message: "Failed to update technician_master information..."
                });
            }

            mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Technician Activity Notification", `Hello Admin, The technician ${data.TECHNICIAN_NAME} ${key}`, "", "TA", supportKey, "TA", []);

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
    var filter = req.body.filter || {};
    const supportKey = req.headers['supportkey'];

    try {
        filter = JSON.parse(filter);
        const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
        if (IS_FILTER_WRONG === '0') {
            const matchCriteria = filter;
            const countResult = await shopOrderActionLog.aggregate([
                { $match: matchCriteria },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$DATE_TIME' } } } },
                { $count: 'cnt' }
            ]);

            const totalDistinctDates = countResult[0]?.cnt || 0;

            const dataResult = await shopOrderActionLog.aggregate([
                { $match: matchCriteria },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$DATE_TIME' } },
                        ACTION_LOGS: {
                            $push: {
                                ORDER_ID: `$ORDER_ID`,
                                CUSTOMER_ID: `$CUSTOMER_ID`,
                                DATE_TIME: `$DATE_TIME`,
                                LOG_TYPE: `$LOG_TYPE`,
                                ACTION_LOG_TYPE: `$ACTION_LOG_TYPE`,
                                ACTION_DETAILS: `$ACTION_DETAILS`,
                                CLIENT_ID: `$CLIENT_ID`,
                                USER_ID: `$USER_ID`,
                                ORDER_DATE_TIME: `$ORDER_DATE_TIME`,
                                CART_ID: `$CART_ID`,
                                EXPECTED_DATE_TIME: `$EXPECTED_DATE_TIME`,
                                ORDER_MEDIUM: `$ORDER_MEDIUM`,
                                ORDER_STATUS: `$ORDER_STATUS`,
                                TOTAL_AMOUNT: `$TOTAL_AMOUNT`,
                                ORDER_NUMBER: `$ORDER_NUMBER`,
                                PAYMENT_MODE: `$PAYMENT_MODE`,
                                PAYMENT_STATUS: `$PAYMENT_STATUS`,
                                USER_NAME: `$USER_NAME`,
                                EXPECTED_PREAPARATION_DATETIME: `$EXPECTED_PREAPARATION_DATETIME`,
                                EXPECTED_PACKAGING_DATETIME: `$EXPECTED_PACKAGING_DATETIME`,
                                EXPECTED_DISPATCH_DATETIME: `$EXPECTED_DISPATCH_DATETIME`,
                                ACTUAL_PREAPARATION_DATETIME: `$ACTUAL_PREAPARATION_DATETIME`,
                                ACTUAL_PACKAGING_DATETIME: `$ACTUAL_PACKAGING_DATETIME`,
                                ACTUAL_DISPATCH_DATETIME: `$ACTUAL_DISPATCH_DATETIME`
                            }

                        }
                    }
                },
                { $sort: { _id: sortValue } },
                { $skip: (pageIndex - 1) * pageSize },
                { $limit: pageSize }
            ]);

            res.status(200).send({
                message: 'success',
                count: totalDistinctDates,
                data: dataResult
            });
        } else {
            res.status(422).send({
                message: 'Invalid filter provided.'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: 'Internal Server Error.'
        });
    }
};


exports.getorderLogsforCustomer = async (req, res) => {
    const pageIndex = parseInt(req.body.pageIndex) || 1;
    const pageSize = parseInt(req.body.pageSize) || 10;
    const sortKey = req.body.sortKey || 'DATE_TIME';
    const sortValue = req.body.sortValue === 'ASC' ? 1 : -1;
    let filter = req.body.filter || '{}';
    let IS_ORDER_OR_JOB = req.body.IS_ORDER_OR_JOB
    let ORDER_ID = req.body.ORDER_ID
    const supportKey = req.headers['supportkey'];

    try {

        const collection = shopOrderActionLog;

        const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

        if (IS_FILTER_WRONG === "0") {
            const countQuery = [
                { $match: filter },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$DATE_TIME" } } } },
                { $count: "cnt" }
            ];

            const countResult = await collection.aggregate(countQuery).exec();
            const totalCount = countResult.length > 0 ? countResult[0].cnt : 0;

            const dataQueryOLD = [
                { $match: filter },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$DATE_TIME" } },
                        ACTION_LOGS: {
                            $push: {
                                TECHNICIAN_ID: "$TECHNICIAN_ID",
                                ORDER_ID: "$ORDER_ID",
                                CUSTOMER_ID: "$CUSTOMER_ID",
                                DATE_TIME: "$DATE_TIME",
                                LOG_TYPE: "$LOG_TYPE",
                                ACTION_LOG_TYPE: "$ACTION_LOG_TYPE",
                                ACTION_DETAILS: "$ACTION_DETAILS",
                                TECHNICIAN_NAME: "$TECHNICIAN_NAME",
                                ORDER_STATUS: "$ORDER_STATUS",
                                ORDER_NUMBER: "$ORDER_NUMBER",
                                JOB_CARD_STATUS: "$JOB_CARD_STATUS",
                                USER_NAME: "$USER_NAME"
                            }
                        }
                    }
                },
                { $sort: { [sortKey]: sortValue } },
                { $skip: (pageIndex - 1) * pageSize },
                { $limit: pageSize },
            ];
            let GroupClumn = ''
            IS_ORDER_OR_JOB === "O" ? GroupClumn = "$ORDER_STATUS" : GroupClumn = "$JOB_CARD_STATUS"

            const dataQuery = [
                { $match: filter },
                {
                    $group: {
                        _id: GroupClumn,
                        ID: { $first: "$_id" },
                        ORDER_STATUS: { $first: "$ORDER_STATUS" },
                        ORDER_ID: { $first: "$ORDER_ID" },
                        CUSTOMER_ID: { $first: "$CUSTOMER_ID" },
                        DATE_TIME: { $first: "$DATE_TIME" },
                        LOG_TYPE: { $first: "$LOG_TYPE" },
                        ACTION_LOG_TYPE: { $first: "$ACTION_LOG_TYPE" },
                        ACTION_DETAILS: { $first: "$ACTION_DETAILS" },
                        USER_NAME: { $first: "$USER_NAME" }
                    }
                },
                { $sort: { [sortKey]: sortValue } },
                { $skip: (pageIndex - 1) * pageSize },
                { $limit: pageSize }
            ];



            const dataResults = await collection.aggregate(dataQuery).exec();

        } else {
            res.send({
                code: 400,
                message: "Invalid filter provided."
            });
        }
    } catch (error) {
        console.error("Error fetching date-wise logs:", error);
        res.send({
            code: 500,
            message: "Internal Server Error."
        });
    }
};
