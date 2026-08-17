const mm = require('../utilities/globalModule');
const orderChat = require("../modules/orderChat");

exports.get = async (req, res) => {
  try {

    const {
      pageIndex = 1,
      pageSize,
      sortKey = "_id",
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

    const totalCount = await orderChat.countDocuments(filter);
    const data = await orderChat.find(filter)
      .sort({ [sortKey]: sortOrder })
      .skip(skip)
      .limit(parseInt(pageSize));

    res.status(200).json({
      code: 200,
      message: "success",
      count: totalCount,
      data
    });
  } catch (error) {
    console.error(error);
    ;
    res.status(500).json({
      code: 500,
      message: "Something went wrong.",
    });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const newOrderChat = new orderChat(data);
    const savedOrderChat = await newOrderChat.save();
    res.status(200).json({
      code: 200,

      message: "orderChat information saved successfully."
    });
    let TOPIC_NAME
    // TOPIC_NAME = data.BY_CUSTOMER == true ? `chat_${data.JOB_CARD_ID}_technician_${data.TECHNICIAN_ID}_channel` : `chat_${data.JOB_CARD_ID}_customer_${data.CUSTOMER_ID}_channel`
    if (data.BY_CUSTOMER == true) {
      if (data.IS_FIRST) {
         TOPIC_NAME = `technician_${data.TECHNICIAN_ID}_channel`
      }
      else {
         TOPIC_NAME = `chat_${data.JOB_CARD_ID}_technician_${data.TECHNICIAN_ID}_channel`

      }
    }
    else {
      if (data.IS_FIRST) {
        TOPIC_NAME = `customer_${data.CUSTOMER_ID}_channel`
      }
      else {
        TOPIC_NAME = `chat_${data.JOB_CARD_ID}_customer_${data.CUSTOMER_ID}_channel`

      }
    }
    console.log("TOPIC_NAME", TOPIC_NAME)
    let notificationData = {
      ORDER_ID: data.ORDER_ID,
      ORDER_NUMBER: req.body.ORDER_NUMBER,
      JOB_CARD_NUMBER: req.body.JOB_CARD_NUMBER,
      MSG_SEND_BY: data.MSG_SEND_BY,
      TECHNICIAN_ID: data.TECHNICIAN_ID,
      RECIPIENT_USER_ID: data.RECIPIENT_USER_ID,
      IS_FIRST: data.IS_FIRST,
      ORDER_STATUS: req.body.ORDER_STATUS || '',
      JOB_CARD_ID: data.JOB_CARD_ID,
      CUSTOMER_ID: data.CUSTOMER_ID,
      CUSTOMER_NAME: data.CUSTOMER_NAME,
      TECHNICIAN_NAME: data.TECHNICIAN_NAME,
      RECIPIENT_USER_NAME: data.RECIPIENT_USER_NAME
    }

    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, `New Message ${req.body.ORDER_NUMBER}-${req.body.JOB_CARD_NUMBER}`, `${data.MESSAGE}`, "", "J", '1234567890', "OC", "C", notificationData);

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

    const updateOrderchat = await orderChat.findByIdAndUpdate(ID, data, { new: true });

    if (!updateOrderchat) {
      return res.status(404).json({
        code: 404,
        message: "orderChat not found.",
      });
    }

    res.status(200).json({
      code: 200,
      message: "orderChat information updated successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      code: 500,
      message: "Something went wrong.",
    });
  }
};
