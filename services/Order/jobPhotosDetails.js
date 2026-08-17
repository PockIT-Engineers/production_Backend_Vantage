const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
var jobPhotosDetails = "job_photos_details";
var viewJobPhotosDetails = "view_" + jobPhotosDetails;
// Conversion Done

function reqData(req) {

    var data = {
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        UPLOADED_DATE_TIME: req.body.UPLOADED_DATE_TIME,
        PHOTOS_URL: req.body.PHOTOS_URL,
        STATUS: req.body.STATUS,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}



exports.validate = function () {
    return [
        body('JOB_CARD_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('ORDER_ID').isInt().optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('UPLOADED_DATE_TIME').optional(),
        body('PHOTOS').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const {
        pageIndex = '',
        pageSize = '',
        sortKey = 'ID',
        sortValue = 'DESC',
        filter = ''
    } = req.body;

    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            message: "Invalid filter parameter."
        });
    }

    const safeFilter = filter.replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey||'ID'}';
        SET @v_SORT_VALUE = '${sortValue||'DESC'}';
        SET @v_FILTER = '${safeFilter}';
    `;

    try {
        mm.executeQueryData(
            setContext + ` CALL spGetJobPhotosDetails(); `,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to get jobPhotosDetails information."
                    });
                }


                const resultSets = results.filter(r => Array.isArray(r));

                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                res.status(200).json({
                    code: 200,
                    message: "success",
                    count: countResult[0]?.cnt || 0,
                    data: dataResult
                });

            }
        );
    } catch (error) {
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        res.status(500).json({
            message: "Something went wrong."
        });
    }
};



exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_create_job_photo(?,?,?,?,?,?,?,?)`, [data.JOB_CARD_ID, data.TECHNICIAN_ID, data.ORDER_ID, data.CUSTOMER_ID, data.UPLOADED_DATE_TIME, data.PHOTOS_URL, data.STATUS, data.CLIENT_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save jobPhotosDetails information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has added job photos.`;
                    var logCategory = "job card photo details";
                    let actionLog = {
                        "SOURCE_ID": results[0][0].insertId,
                        "LOG_DATE_TIME": mm.getSystemDate(),
                        "LOG_TEXT": ACTION_DETAILS,
                        "CATEGORY": logCategory,
                        "CLIENT_ID": 1,
                        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.status(200).json({
                        "code": 200,
                        "message": "JobPhotosDetails information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something went wrong."
            });
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`CALL sp_update_job_photo(?,?,?,?,?,?,?,?,?,?)`, [criteria.ID, data.JOB_CARD_ID, data.TECHNICIAN_ID, data.ORDER_ID, data.CUSTOMER_ID, data.UPLOADED_DATE_TIME, data.PHOTOS_URL, data.STATUS, data.CLIENT_ID, systemDate], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update jobPhotosDetails information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated job photo details.`;
                    var logCategory = "job card photo details";
                    let actionLog = {
                        "SOURCE_ID": criteria.ID,
                        "LOG_DATE_TIME": mm.getSystemDate(),
                        "LOG_TEXT": ACTION_DETAILS,
                        "CATEGORY": logCategory,
                        "CLIENT_ID": 1,
                        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.status(200).json({
                        "code": 200,
                        "message": "JobPhotosDetails information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something went wrong."
            });
        }
    }
}


exports.addPhotos = (req, res) => {
    const { JOB_CARD_ID, TECHNICIAN_ID, CUSTOMER_ID, ORDER_ID, PHOTOS_DATA, STATUS, REMARK, authData } = req.body;
    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    if (!JOB_CARD_ID || !CUSTOMER_ID || !ORDER_ID || !STATUS) {
        return res.status(400).json({
            "code": 400,
            "message": "All required fields"
        });
    }

    try {
        const connection = mm.openConnection();

        const spSql = `CALL spAddJobPhotos(?, ?, ?, ?, ?, ?, ?, ?)`;
        const spParams = [
            JOB_CARD_ID,
            TECHNICIAN_ID,
            CUSTOMER_ID,
            ORDER_ID,
            STATUS,
            REMARK || '',
            JSON.stringify(PHOTOS_DATA || []),
            1
        ];

        mm.executeDML(spSql, spParams, supportKey, connection, (error, results) => {
            if (error) {
                console.error(error);
                mm.rollbackConnection(connection);
                return res.status(400).json({ "code": 400, "message": "Failed to save photos info." });
            }
            const ACTION_DETAILS = `User ${authData.data.UserData[0].NAME} has successfully saved the photos.`;
            const logCategory = "job card photo details";

            let actionLog = {
                "SOURCE_ID": JOB_CARD_ID,
                "LOG_DATE_TIME": systemDate,
                "LOG_TEXT": ACTION_DETAILS,
                "CATEGORY": logCategory,
                "CLIENT_ID": 1,
                "USER_ID": authData.data.UserData[0].USER_ID,
                "supportKey": 0
            };

            dbm.saveLog(actionLog, systemLog);
            mm.commitConnection(connection);

            return res.status(200).json({
                "code": 200,
                "message": "PHOTOS information saved successfully."
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ "message": "Something went wrong." });
    }
};


exports.deletePhoto = (req, res) => {
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };

    if (!criteria.ID) {
        return res.status(400).json({
            "code": 400,
            "message": "ID required fields"
        });
    }

    try {
        mm.executeQueryData(`CALL sp_delete_job_photo(?)`, [criteria.ID], supportKey, (error, results) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to delete jobPhotosDetails information."
                });
            }
            else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has deleted the photos.`;
                res.status(200).json({
                    "code": 200,
                    "message": "photo deleted successfully...",
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
}




