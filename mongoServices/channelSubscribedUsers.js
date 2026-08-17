const mm = require('../utilities/globalModule');
const channelSubscribedUsers = require("../modules/channelSubscribedUsers");

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
    console.log("filter", filter)
    const totalCount = await channelSubscribedUsers.countDocuments(filter);
    const data = await channelSubscribedUsers.find(filter)
      .sort({ [sortKey]: sortOrder })
      .skip(skip)
      .limit(parseInt(pageSize));
    console.log("data", data)
    res.status(200).json({
      message: "success",
      count: totalCount,
      data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
};


exports.create = async (req, res) => {
  try {

    const data = req.body;
    const newchannelSubscribedUsers = new channelSubscribedUsers(data);
    const savedchannelSubscribedUsers = await newchannelSubscribedUsers.save();
    res.status(200).json({
      message: "channelSubscribedUsers information saved successfully."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
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

    const updatechannelSubscribedUsers = await channelSubscribedUsers.findByIdAndUpdate(ID, data, { new: true });

    if (!updatechannelSubscribedUsers) {
      return res.status(404).json({
        message: "channelSubscribedUsers not found.",
      });
    }

    res.status(200).json({
      message: "channelSubscribedUsers information updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      message: "Something went wrong.",
    });
  }
};

exports.subscribeToChanel = (req, res) => {

  const { CHANNEL_NAME, USER_ID, TYPE } = req.body;


  channelSubscribedUsers.findOne({ CHANNEL_NAME, USER_ID, TYPE })
    .then(existingRecord => {
      if (existingRecord) {
        return res.status(200).json({
          message: "Channel alreday subscribed.",
        });
      }
      else {
        const newchannelSubscribedUsers = new channelSubscribedUsers(req.body);
        newchannelSubscribedUsers.save();
        return res.status(200).json({
          message: "Channel subscribed succesfully.",
        });
      }
    })

    .catch(error => {
      console.error(error);
      res.status(500).json({
        message: "Something went wrong.",
      });
    });
};


exports.updateSubscribedChannel = (req, res) => {
  const { OLD_CHANNEL_NAME, CHANNEL_NAME, USER_ID, TYPE, STATUS, USER_NAME, CLIENT_ID } = req.body;

  if (OLD_CHANNEL_NAME === CHANNEL_NAME) {
    return res.status(200).json({
      message: "You are already subscribed to this channel.",
    });
  }
  else {
    channelSubscribedUsers
      .findOneAndUpdate({ CHANNEL_NAME: OLD_CHANNEL_NAME, USER_ID: USER_ID, TYPE: TYPE }, { STATUS: false })
      .then(() => {
        const newChannel = new channelSubscribedUsers(req.body);
        newChannel.save();
        return res.status(200).json({
          message: "Channel subscribed successfully, and old channel deactivated.",
        });
      })

      .catch((error) => {
        console.error(error);
        res.status(500).json({
          message: "Something went wrong.",
        });
      });
  }
};

