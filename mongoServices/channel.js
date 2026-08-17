const mm = require('../utilities/globalModule');
const channel = require("../modules/channel");

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

    const totalCount = await channel.countDocuments(filter);
    const data = await channel.find(filter)
      .sort({ [sortKey]: sortOrder })
      .skip(skip)
      .limit(parseInt(pageSize));

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
    const newchannel = new channel(data);
    const savedchannel = await newchannel.save();
    res.status(200).json({
      message: "channel information saved successfully."
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

    const { ID, ...data } = req.body;

    if (!ID) {
      return res.status(400).json({
        message: "ID is required for updating.",
      });
    }

    const updatechannel = await channel.findByIdAndUpdate(ID, data, { new: true });

    if (!updatechannel) {
      return res.status(404).json({
        message: "channel not found.",
      });
    }

    res.status(200).json({
      message: "channel information updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      message: "Something went wrong.",
    });
  }
};
