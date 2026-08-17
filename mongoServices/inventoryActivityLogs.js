const inwardLogs = require("../modules/inwardLogs");
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
            filter = {
                $or: req.body.searchFields.map(field => ({
                    [field]: { $regex: searchValue, $options: "i" }
                }))
            };
        }

        const totalCount = await inwardLogs.countDocuments(filter);
        const data = await inwardLogs.find(filter)
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

        const newinwardLogs = new inwardLogs(data);

        const savedinwardLogs = await newinwardLogs.save();
        res.status(200).json({
            code: 200,
            message: "inwardLogs information saved successfully."
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

        const updatedinwardLogs = await inwardLogs.findByIdAndUpdate(ID, data, { new: true });

        if (!updatedinwardLogs) {
            return res.status(404).json({
                code: 404,
                message: "inwardLogs not found.",
            });
        }

        res.status(200).json({
            code: 200,
            message: "inwardLogs information updated successfully.",
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


        const newLog = new inwardLogs(data);
        await newLog.save();

        mm.executeQueryData('CALL sp_updateTechnicianStatus(?, ?)', [TECHNICIAN_STATUS, data.TECHNICIAN_ID], supportKey, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(400).json({
                    code: 400,
                    message: "Failed to update technician_master information..."
                });
            }

            mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Technician Activity Notification", `Hello Admin, The technician ${data.TECHNICIAN_NAME} ${key}`, "", "TA", supportKey, "T", []);

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

            const countResult = await inwardLogs.aggregate([
                { $match: matchCriteria },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$LOG_DATE_TIME' } } } },
                { $count: 'cnt' }
            ]);

            const totalDistinctDates = countResult[0]?.cnt || 0;

            const dataResult = await inwardLogs.aggregate([
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
