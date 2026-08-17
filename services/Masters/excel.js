const { validationResult, body } = require('express-validator');
const excelMaster = require("../../modules/excelImportMaster"); // Your Mongoose model
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
const fs = require("fs");
const path = require("path");

exports.validate = function () {
    return [
        body('TABLE_ID').isInt().withMessage('TABLE_ID must be an integer').optional(),
        body('EXCEL_URL').isString().withMessage('EXCEL_URL must be a string').notEmpty(),
        body('UPLOADED_DATE_TIME').optional().isISO8601().withMessage('Invalid date format'),
        body('UPLOADED_BY').notEmpty(),
        body('STATUS').isString().withMessage('STATUS must be a string').optional(),
        body('CLIENT_ID').notEmpty(),
    ];
};


exports.getImportDetails = async (req, res) => {
    try {
        const {
            filter = {},
        } = req.body;


        let query = filter;

        if (Object.keys(filter).length > 0) {
            query = {
                $and: [filter]
            };
        } else {
            query = {
            };
        }


        const totalCount = await excelMaster.countDocuments(query);

        // 📦 Fetch paginated data
        const data = await excelMaster
            .find(query)
            .lean();

        let newData = [];
        // 📌 Attach RESPONSE from JSON file
        for (const row of data) {

            if (!row.RESPONSE || row.RESPONSE === '{}' || row.STATUS !== 'Completed') {
                row.RESPONSE = null;
                newData.push(row);
                continue;
            }

            const fileName = row.RESPONSE;
            const filePath = path.join(
                __dirname,
                "../../uploads/ExcelImporResponse/",
                fileName
            );
            if (fs.existsSync(filePath)) {
                row.RESPONSE = fs.readFileSync(filePath, "utf8");
            } else {
                row.RESPONSE = null;
            }

            newData.push(row);
        }
        res.status(200).json({
            code: 200,
            message: "success",
            TAB_ID: 37,
            count: totalCount,
            data: data
        });

    } catch (error) {
        logger.error("Error in GET /excelMaster: " + JSON.stringify(error), applicationkey);
        console.error(error);
        res.status(500).json({
            message: "Something went wrong."
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
            filter = {},
            searchFields = []
        } = req.body;

        const sortOrder = sortValue.toLowerCase() === "desc" ? -1 : 1;
        const skip = (pageIndex - 1) * pageSize;

        let query = filter;

        // 🔍 Apply search filter only if searchValue is not empty and searchFields has items
        if (searchValue && searchValue.trim() && searchFields.length > 0) {
            const searchRegex = { $regex: searchValue.trim(), $options: "i" };

            if (Object.keys(filter).length > 0) {
                // If filter exists, combine with search
                query = {
                    $and: [
                        filter,
                        {
                            $or: searchFields.map(field => ({
                                [field]: searchRegex
                            }))
                        }
                    ]
                };
            } else {
                // If no filter, just use search
                query = {
                    $or: searchFields.map(field => ({
                        [field]: searchRegex
                    }))
                };
            }
        }
        // If no search, query remains as filter (which could be empty or have conditions)

        // 📊 Get total count
        const totalCount = await excelMaster.countDocuments(query);

        // 📦 Fetch paginated data
        const data = await excelMaster
            .find(query)
            .sort({ [sortKey]: sortOrder })
            .skip(skip)
            .limit(parseInt(pageSize))
            .lean();

        // let newData = [];
        // // 📌 Attach RESPONSE from JSON file
        // for (const row of data) {

        //     if (!row.RESPONSE || row.RESPONSE === '{}' || row.STATUS !== 'Completed') {
        //         row.RESPONSE = null;
        //         newData.push(row);
        //         continue;
        //     }

        //     const fileName = row.RESPONSE;
        //     const filePath = path.join(
        //         __dirname,
        //         "../../uploads/ExcelImporResponse/",
        //         fileName
        //     );
        //     if (fs.existsSync(filePath)) {
        //         row.RESPONSE = fs.readFileSync(filePath, "utf8");
        //     } else {
        //         row.RESPONSE = null;
        //     }

        //     newData.push(row);
        // }


        res.status(200).json({
            code: 200,
            message: "success",
            TAB_ID: 37,
            count: totalCount,
            data: data
        });

    } catch (error) {
        logger.error("Error in GET /excelMaster: " + JSON.stringify(error), applicationkey);
        console.error(error);
        res.status(500).json({
            message: "Something went wrong."
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
        data.CREATED_MODIFIED_DATE = new Date();
        data.UPLOADED_DATE_TIME = data.UPLOADED_DATE_TIME || new Date();
        data.UPLOADED_BY = data.UPLOADED_BY || "System";
        const newRecord = new excelMaster(data);
        const savedRecord = await newRecord.save();

        res.status(200).json({
            code: 200,
            message: "excelMaster information saved successfully.",
            id: savedRecord._id,  // 👈 returning the MongoDB document _id
        });

    } catch (error) {
        logger.error("Error in CREATE /excelMaster: " + JSON.stringify(error), applicationkey);
        console.error(error);
        res.status(500).json({
            message: "Something went wrong."
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

        data.CREATED_MODIFIED_DATE = new Date();

        const updatedRecord = await excelMaster.findByIdAndUpdate(ID, data, { new: true });

        if (!updatedRecord) {
            return res.status(404).json({
                code: 404,
                message: "excelMaster record not found.",
            });
        }

        res.status(200).json({
            code: 200,
            message: "excelMaster information updated successfully."
        });

    } catch (error) {
        logger.error("Error in UPDATE /excelMaster: " + JSON.stringify(error), applicationkey);
        console.error(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
};
