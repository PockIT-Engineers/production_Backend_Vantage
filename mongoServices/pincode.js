const Pincode = require("../modules/pincode");
const { validationResult, body } = require("express-validator");
exports.validate = function () {
    return [
        body("OFFICE_NAME").optional(),
        body("PINCODE").optional(),
        body("DIVISION_NAME").optional(),
        body("CIRCLE_NAME").optional(),
        body("TALUKA").optional(),
        body("DISTRICT").optional(),
        body("STATE").optional(),
        body("COUNTRY_ID").isInt().optional(),
        body("SUB_OFFICE").optional(),
        body("HEAD_OFFICE").optional(),
        body("LONGITUDE").optional(),
        body("LATITUDE").optional(),  // Fixed the typo here
        body("IS_ACTIVE").optional(),
        body("CLIENT_ID").isInt().optional(),
        body("ID").optional(),
    ];
};

exports.get = async (req, res) => {
    try {
        const {
            pageIndex =1,
            pageSize ,
            sortKey = "_id",
            sortValue = "DESC",
            searchValue = "",
        } = req.body;
        
        const sortOrder = sortValue.toLowerCase() === "desc" ? -1 : 1;
        const skip = (pageIndex - 1) * pageSize;
        // console.log("fields",req.body.searchFields)
        let filter = req.body.filter|| {};
        console.log("\n\n\n\n",filter)

        if (searchValue) {
            filter = {
                $or: req.body.searchFields.map(field => ({
                    [field]: { $regex: searchValue, $options: "i" }
                }))
            };
        }

        const totalCount = await Pincode.countDocuments(filter);
        const data = await Pincode.find(filter)
            .sort({ [sortKey]: sortOrder })
            .skip(skip)
            .limit(parseInt(pageSize));

        res.status(200).json({
            "code": 200,
             "message": "success",
            count: totalCount,
            data,
            "TAB_ID": "6784f557b5d32a2987e5d416"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong.",
        });
    }
};


exports.create = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                "code": 422,
                 "message": errors.array(),
            });
        }

        const data = req.body;
        console.log("\n\nData: ", data)
        // data.created_modified_date= mm.getSystemDate()

        const newPincode = new Pincode(data);
        // console.log("\n\n newPincoe: ", newPincode)

        const savedPincode = await newPincode.save();
        // console.log("\n\saved: ", savedPincode)
        res.status(200).json({
            "code": 200,
             "message": "Pincode information saved successfully."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong.",
        });
    }
};

exports.update = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                "code": 422,
                 "message": errors.array(),
            });
        }

        const { ID, ...data } = req.body;

        if (!ID) {
            return res.status(400).json({
                "code": 400,
                 "message": "ID is required for updating.",
            });
        }

        const updatedPincode = await Pincode.findByIdAndUpdate(ID, data, { new: true });

        if (!updatedPincode) {
            return res.status(404).json({
                "code": 404,
                 "message": "Pincode not found.",
            });
        }

        res.status(200).json({
            "code": 200,
             "message": "Pincode information updated successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong.",
        });
    }
};
