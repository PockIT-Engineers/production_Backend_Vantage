const technicianLocationTrack = require("../modules/technicianActivityCalender");
const { validationResult, body } = require("express-validator");
const { sendNotificationToAdmin, sendNotificationToTerritory, sendNotificationToTerritoryManager } = require("../utilities/globalModule");
exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('DATE_OF_MONTH').optional(),
        body('WEEK_DAY').optional(),
        body('DAY_START_TIME').optional(),
        body('DAY_END_TIME').optional(),
        body('BREAK_START_TIME').optional(),
        body('BREAK_END_TIME').optional(),
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

        const totalCount = await technicianLocationTrack.countDocuments(filter);
        const data = await technicianLocationTrack.find(filter)
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
        if (data.DATE_OF_MONTH) {
            const date = new Date(data.DATE_OF_MONTH);
            data.DATE_OF_MONTH = date.toISOString().split('T')[0];
        }

        const newtechnicianLocationTrack = new technicianLocationTrack(data);

        const savedtechnicianLocationTrack = await newtechnicianLocationTrack.save();
        res.status(200).json({
            code: 200,
            message: "technicianLocationTrack information saved successfully."
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

        if (data.IS_SERIVCE_AVAILABLE === 'false') {
            sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Technician marks Holiday", `Hello Admin the technician ${data.TECHNICIAN_NAME} marks holiday on ${data.DATE_OF_MONTH}`, "", "J", '1234567890', "J", []);
            sendNotificationToTerritoryManager(data.TECHNICIAN_ID, "Technician marks Holiday", `Hello Admin the technician ${data.TECHNICIAN_NAME} marks holiday on ${data.DATE_OF_MONTH}`, "", "TA", "supportKey", "", "")
        }
        const updatedtechnicianLocationTrack = await technicianLocationTrack.findByIdAndUpdate(ID, data, { new: true });

        if (!updatedtechnicianLocationTrack) {
            return res.status(404).json({
                code: 404,
                message: "technicianLocationTrack not found.",
            });
        }

        res.status(200).json({
            code: 200,
            message: "technicianLocationTrack information updated successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong.",
        });
    }
};



const generateTechnicianActivity = (activities, year, month, techId) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const weekDay = date.toLocaleDateString("en-US", { weekday: "long" });

        // Find the activity that matches the date
        const activity = activities.find((a) => {
            const activityDate = new Date(a.DATE_OF_MONTH).toISOString().split("T")[0];
            return activityDate === formattedDate;
        });
        result.push({
            ID: activity?._id ?? null,
            TECHNICIAN_ID: techId,
            IS_SERIVCE_AVAILABLE: activity?.IS_SERIVCE_AVAILABLE ?? null,
            DATE_OF_MONTH: formattedDate,
            WEEK_DAY: weekDay,
            DAY_START_TIME: activity?.DAY_START_TIME ?? null,
            DAY_END_TIME: activity?.DAY_END_TIME ?? null,
            BREAK_START_TIME: activity?.BREAK_START_TIME ?? null,
            BREAK_END_TIME: activity?.BREAK_END_TIME ?? null,
        });
    }
    return result;
};

exports.getCalenderData = async (req, res) => {
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const YEAR = req.body.YEAR;
    const MONTH = req.body.MONTH;

    if (!TECHNICIAN_ID || !YEAR || !MONTH) {
        return res.status(400).json({
            message: "TECHNICIAN_ID, YEAR, and MONTH are required.",
        });
    }

    const supportKey = req.headers['supportkey'];

    try {

        const results = await technicianLocationTrack.find({
            TECHNICIAN_ID: TECHNICIAN_ID,
            DATE_OF_MONTH: {
                $gte: new Date(YEAR, MONTH - 1, 1),
                $lt: new Date(YEAR, MONTH, 1)
            }
        }).exec();

        const calenderData = generateTechnicianActivity(results, YEAR, MONTH, TECHNICIAN_ID);
        res.status(200).json({
            code: 200,
            message: "success",
            data: calenderData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
};