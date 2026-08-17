const mm = require('../utilities/globalModule');
const excelImportMaster = require("../modules/excelImportMaster");
const fs = require("fs");
const path = require("path");


exports.getOLD = async (req, res) => {
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
    console.log("filter123456", filter)
    const totalCount = await excelImportMaster.countDocuments(filter);
    const data = await excelImportMaster.find(filter)
      .sort({ [sortKey]: sortOrder })
      .skip(skip)
      .limit(parseInt(pageSize));

    let JSON_FILE_NAME = data[0]?._id + ".json";

    data.RESPONSE =
      res.status(200).json({
        message: "success",
        count: totalCount,
        data
      });
  } catch (error) {
    console.error("error123456", error);
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

exports.get = async (req, res) => {
  try {
    const {
      pageIndex = 1,
      pageSize = 10,
      sortKey = "_id",
      sortValue = "DESC",
      searchValue = "",
    } = req.body;

    const sortOrder = sortValue.toLowerCase() === "desc" ? -1 : 1;
    const skip = (pageIndex - 1) * pageSize;
    let filter = req.body.filter || {};

    if (searchValue && Array.isArray(req.body.searchFields)) {
      filter = {
        $or: req.body.searchFields.map(field => ({
          [field]: { $regex: searchValue, $options: "i" }
        }))
      };
    }

    const totalCount = await excelImportMaster.countDocuments(filter);

    const data = await excelImportMaster.find(filter)
      .sort({ [sortKey]: sortOrder })
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean(); // ✅ important (plain JS object)

    // 📌 Attach RESPONSE from JSON file
    let NewData = [];
    for (const row of data) {
      try {
        const fileName = `${row._id}.json`;
        const filePath = path.join(
          __dirname,
          "../uploads/ExcelImporResponse/",
          fileName
        );
        console.log("\n\n\n\nfilePath", filePath)
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, "utf8");
          row.RESPONSE = fileContent; // already string
          NewData.push(row);
        } else {
          row.RESPONSE = null;
          NewData.push(row);
        }
      } catch (err) {
        row.RESPONSE = null;
        NewData.push(row);
      }
    }

    return res.status(200).json({
      message: "success",
      count: totalCount,
      data: NewData
    });

  } catch (error) {
    console.error("error123456", error);
    return res.status(500).json({
      message: "Something went wrong."
    });
  }
};



exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: errors.array(),
      });
    }
    const data = req.body;
    const newexcelImportMaster = new excelImportMaster(data);
    const savedexcelImportMaster = await newexcelImportMaster.save();
    res.status(200).json({
      message: "excelImportMaster information saved successfully."
    });
  } catch (error) {
    console.error("error", error);
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
        message: "ID is required for updating.",
      });
    }

    const updateexcelImportMaster = await excelImportMaster.findByIdAndUpdate(ID, data, { new: true });

    if (!updateexcelImportMaster) {
      return res.status(404).json({
        message: "excelImportMaster not found.",
      });
    }

    res.status(200).json({
      message: "excelImportMaster information updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      message: "Something went wrong.",
    });
  }
};
