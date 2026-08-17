const jobCardChat = require("../modules/jobCardChat");
const { validationResult } = require("express-validator");
const mm = require('../utilities/globalModule');
const { log } = require("async");


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

        const totalCount = await jobCardChat.countDocuments(filter);
        const data = await jobCardChat.find(filter)
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

exports.createold = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                code: 422,
                message: errors.array(),
            });
        }
        const data = req.body;
        const newJobChat = new jobCardChat(data);
        const savedJobChat = await newJobChat.save();
        let firebaseID
        let methodcall = ''

        if (data.MSG_SEND_BY === "B") {
            firebaseID = data.TECHNICIAN_ID;
            mm.sendNotificationToTechnician(8,
                data.TECHNICIAN_ID,
                "New Message",
                `${data.MESSAGE}`,
                "",
                "J",
                '1234567890',
                "JC"
            );
        } else {
            firebaseID = data.RECIPIENT_USER_ID;
            mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,
                8,
                "New Message",
                `${data.MESSAGE}`,
                "",
                "J",
                '1234567890'
            );
        }

        res.status(200).json({
            code: 200,
            message: "jobCardChat information saved successfully."
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
        const newJobChat = new jobCardChat(data);
        const savedJobChat = await newJobChat.save();
        let firebaseID
        let methodcall = ''
        console.log("data", data)
        let notificationData = {
            JOB_CARD_ID: data.JOB_CARD_ID,
            JOB_CARD_NUMBER: req.body.JOB_CARD_NUMBER,
            ORDER_NUMBER: req.body.ORDER_NUMBER,
            ORDER_STATUS: req.body.ORDER_STATUS || '',
            MSG_SEND_BY: data.MSG_SEND_BY,
            TECHNICIAN_ID: data.TECHNICIAN_ID,
            CUSTOMER_ID: data.CUSTOMER_ID,
            CUSTOMER_NAME: data.CUSTOMER_NAME,
            TECHNICIAN_NAME: data.TECHNICIAN_NAME,
            RECIPIENT_USER_NAME: data.RECIPIENT_USER_NAME,
            RECIPIENT_USER_ID: data.RECIPIENT_USER_ID,
            IS_FIRST: data.IS_FIRST
        }
        if (data.MSG_SEND_BY === "B") {
            var TOPIC_NAME = `support_chat_${data.JOB_CARD_ID}_technician_${data.TECHNICIAN_ID}_channel`
            console.log("TOPIC_NAME", TOPIC_NAME)
            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, `New Message ${req.body.ORDER_NUMBER}-${req.body.JOB_CARD_NUMBER}`, `${data.MESSAGE}`, "", "J", '1234567890', "N", "BC", notificationData);
            firebaseID = data.TECHNICIAN_ID;
        } else {
            if (data.IS_FIRST == 1) {
                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, 'backoffice_chat_channel', "New Message", `${data.MESSAGE}`, "", "J", '1234567890', "N", "BC", notificationData);
            }
            else {
                console.log("345678ytrertyu")
                let channelto = data.RECIPIENT_USER_ID ? `support_chat_${data.JOB_CARD_ID}_backoffice_${data.RECIPIENT_USER_ID}_channel` : `job_chat_${data.JOB_CARD_ID}_initiate_channel`
                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, channelto, `New Message ${req.body.ORDER_NUMBER}-${req.body.JOB_CARD_NUMBER}`, `${data.MESSAGE}`, "", "J", '1234567890', "N", "BC", notificationData);
                firebaseID = data.RECIPIENT_USER_ID;
            }
        }

        res.status(200).json({
            code: 200,
            message: "jobCardChat information saved successfully."
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

        const updatedtechnicianLocationTrack = await jobCardChat.findByIdAndUpdate(ID, data, { new: true });

        if (!updatedtechnicianLocationTrack) {
            return res.status(404).json({
                code: 404,
                message: "jobCardChat not found.",
            });
        }

        res.status(200).json({
            code: 200,
            message: "jobCardChat information updated successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong.",
        });
    }
};




