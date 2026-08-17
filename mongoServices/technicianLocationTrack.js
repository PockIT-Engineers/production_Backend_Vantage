const technicianLocationTrack = require("../modules/technicianLocationTrack");
const { validationResult, body } = require("express-validator");
const mm = require('../utilities/globalModule');

exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('LOCATION_LATITUDE').optional(),
        body('LOCATION_LONG').optional(),
        body('DATE_TIME').optional(),
        body('ORDER_ID').optional(),
        body('JOB_CARD_ID').optional(),
        body('ID').optional(),

    ]
}
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

exports.getTechnicianLocationsByFilter = async (req, res) => {
    const ORDER_ID = req.body.ORDER_ID || '';
    const JOB_CARD_ID = req.body.JOB_CARD_ID || '';
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID || '';
    const filter = req.body.filter || {};
    const supportKey = req.headers['supportkey'];

    let query = {};

    if (ORDER_ID.length > 0) {
        query.ORDER_ID = { $in: ORDER_ID.split(',').map(Number) };
    }

    if (JOB_CARD_ID.length > 0) {
        query.JOB_CARD_ID = { $in: JOB_CARD_ID.split(',').map(Number) };
    }

    if (TECHNICIAN_ID.length > 0) {
        query.TECHNICIAN_ID = { $in: TECHNICIAN_ID.split(',').map(Number) };
    }

    try {

        const results = await technicianLocationTrack.aggregate([
            { $match: { ...query, ...filter } },
            {
                $group: {
                    _id: "$_id",
                    TECHNICIAN_ID: { $first: "$TECHNICIAN_ID" },
                    TECHNICIAN_NAME: { $first: "$TECHNICIAN_NAME" },
                    CITY_NAME: { $first: "$CITY_NAME" },
                    ORDER_ID: { $first: "$ORDER_ID" },
                    JOB_CARD_ID: { $first: "$JOB_CARD_ID" },
                    LOCATION_LATITUDE: { $first: "$LOCATION_LATITUDE" },
                    LOCATION_LONG: { $first: "$LOCATION_LONG" },
                    DATE_TIME: { $max: "$DATE_TIME" },
                }
            },
            { $sort: { DATE_TIME: -1 } }
        ]);

        res.status(200).send({
            code: 200,
            message: "success",
            data: results,
        });
    } catch (error) {
        console.error(error);
        res.status(400).send({
            code: 400,
            message: "Failed to get technicianLocationTrack count.",
        });
    }
};


exports.getTechnicianLocations = async (req, res) => {
    let PINCODE_ID = req.body.PINCODE_ID || "";
    let SKILL_ID = req.body.SKILL_ID || "";
    let TYPE = req.body.TYPE || "";
    let EXPERIANCE = req.body.EXPERIANCE || "";
    let LOGITUDE = req.body.LOGITUDE ? req.body.LOGITUDE : '';
    let LATITUDE = req.body.LATITUDE ? req.body.LATITUDE : '';
    let IS_ALL = req.body.IS_ALL ? req.body.IS_ALL : '0';
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery( `CALL sp_getTechnicians_dynamic(?, ?, ?, ?)`,
            [PINCODE_ID, SKILL_ID, TYPE, EXPERIANCE], async (error, technicians) => {
            if (error) {
                console.log(error);
                res.send({
                    code: 400,
                    message: "Failed to get technician data.",
                });
                return;
            }

            const technicianIds = technicians.map((tech) => tech.ID);

            if (technicianIds.length === 0) {
                res.send({
                    code: 200,
                    message: "No technicians found.",
                    data: [],
                });
                return;
            }

            try {
                const mongoQuery = [
                    { $match: { TECHNICIAN_ID: { $in: technicianIds } } },
                    { $sort: { DATE_TIME: -1 } },
                    {
                        $group: {
                            _id: "$_id",
                            TECHNICIAN_ID: { $first: "$TECHNICIAN_ID" },
                            LOCATION_LATITUDE: { $first: "$LOCATION_LATITUDE" },
                            LOCATION_LONG: { $first: "$LOCATION_LONG" },
                            DATE_TIME: { $first: "$DATE_TIME" },
                        },
                    },
                ];

                if (IS_ALL === '1') {
                    const nearbyFilter = {
                        $match: {
                            $expr: {
                                $lte: [
                                    {
                                        $multiply: [
                                            6371,
                                            {
                                                $acos: {
                                                    $add: [
                                                        {
                                                            $multiply: [
                                                                { $cos: { $toRadians: Number(LATITUDE) } },
                                                                { $cos: { $toRadians: "$LOCATION_LATITUDE" } },
                                                                {
                                                                    $cos: {
                                                                        $subtract: [
                                                                            { $toRadians: "$LOCATION_LONG" },
                                                                            { $toRadians: Number(LOGITUDE) },
                                                                        ],
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            $multiply: [
                                                                { $sin: { $toRadians: Number(LATITUDE) } },
                                                                { $sin: { $toRadians: "$LOCATION_LATITUDE" } },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                    50,
                                ],
                            },
                        },
                    };
                    mongoQuery.unshift(nearbyFilter);
                }

                const technicianLocations = await technicianLocationTrack.aggregate(mongoQuery);

                const mergedResults = technicians.map((tech) => {
                    const location = technicianLocations.find((loc) => loc.TECHNICIAN_ID === tech.ID);
                    return {
                        ...tech,
                        LOCATION_LATITUDE: location ? location.LOCATION_LATITUDE : null,
                        LOCATION_LONG: location ? location.LOCATION_LONG : null,
                        DATE_TIME: location ? location.DATE_TIME : null,
                    };
                });

                res.send({
                    code: 200,
                    message: "success",
                    data: mergedResults,
                });
            } catch (mongoError) {
                console.error(mongoError);
                res.send({
                    code: 400,
                    message: "Failed to fetch technician location data from MongoDB.",
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.send({
            code: 400,
            message: "Error occurred while fetching technician data.",
        });
    }
};
