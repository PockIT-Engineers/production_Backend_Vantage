const mm = require('../utilities/globalModule');
const InventoryTrack = require("../modules/InventoryTrack");

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
            searchFilter = {
                $or: req.body.searchFields.map(field => ({
                    [field]: { $regex: searchValue, $options: "i" }
                }))
            };
            filter = { $and: [filter, searchFilter] }
        }

        const totalCount = await InventoryTrack.countDocuments(filter);
        const data = await InventoryTrack.find(filter)
            .sort({ [sortKey]: sortOrder })
            .skip(skip)
            .limit(parseInt(pageSize));

        res.status(200).json({
            message: "success",
            "TAB_ID": "67ce938026fe415bc5612796",
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: errors.array(),
            });
        }
        const data = req.body;
        const newInventoryTrack = new InventoryTrack(data);
        const savedInventoryTrack = await newInventoryTrack.save();
        res.status(200).json({
            message: "InventoryTrack information saved successfully."
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
                message: "ID is required for updating.",
            });
        }

        const updateInventoryTrack = await InventoryTrack.findByIdAndUpdate(ID, data, { new: true });

        if (!updateInventoryTrack) {
            return res.status(404).json({
                message: "InventoryTrack not found.",
            });
        }

        res.status(200).json({
            message: "InventoryTrack information updated successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong.",
        });
    }
};






