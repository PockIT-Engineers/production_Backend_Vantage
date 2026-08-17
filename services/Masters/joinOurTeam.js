const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog");
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const applicationkey = process.env.APPLICATION_KEY;
var joinOurTeamTable = "join_our_team";
var viewJoinOurTeam = "view_" + joinOurTeamTable;

function reqData(req) {
    var data = {
        NAME: req.body.NAME ? req.body.NAME : '',
        EMAIL_ID: req.body.EMAIL_ID ? req.body.EMAIL_ID : '',
        MOBILE_NO: req.body.MOBILE_NO ? req.body.MOBILE_NO : '',
        ADDRESS: req.body.ADDRESS ? req.body.ADDRESS : '',
        DESIRED_LOCATION: req.body.DESIRED_LOCATION ? req.body.DESIRED_LOCATION : '',
        EXPERIENCE: req.body.EXPERIENCE ? req.body.EXPERIENCE : 0,
        RESUME: req.body.RESUME ? req.body.RESUME : '',
        CLIENT_ID: req.body.CLIENT_ID ? req.body.CLIENT_ID : 1,
    };
    return data;
}

exports.validate = function () {
    return [
        body('ID').optional(),
        body('NAME').notEmpty().withMessage('Name is required'),
        body('EMAIL_ID').optional().isEmail().withMessage('Valid email is required'),
        body('MOBILE_NO').notEmpty().withMessage('Mobile number is required'),
    ]
}


exports.get = (req, res) => {
 const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (IS_FILTER_WRONG !== "0")
        return res.status(400).json({  "message": "Invalid filter" });

    try {
        mm.executeQueryData(
            setContext+`CALL sp_joinOurTeam_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get join our team data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 16,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        res.status(500).json({ "code": 500,  "message": "Something went wrong" });
    }
};



exports.getById = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!ID) {
        return res.status(400).json({
            "code": 400,
             "message": "ID is required."
        });
    }

    try {
        const setContext = `SET @v_ID = ${ID};`;
        mm.executeQueryData(
           setContext +`CALL sp_joinOurteam_getById()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to get join our team information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                console.log("resultSets",resultSets)
                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 16,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};



exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty())
        return res.status(422).json({ "code":422, "message": errors.errors });

    try {
        mm.executeQueryData(
            `CALL sp_joinOurTeam_create(?,?,?,?,?,?,?,?)`,
            [
                data.NAME, data.EMAIL_ID, data.MOBILE_NO, data.ADDRESS,
                data.DESIRED_LOCATION, data.EXPERIENCE, data.RESUME, data.CLIENT_ID
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({ "code": 400,  "message": error.sqlMessage });
                }
                var ACTION_DETAILS = `New application received from ${data.NAME} (Public API).`;
                var logCategory = "join_our_team";

                let actionLog = {
                    "SOURCE_ID": result[0][0].ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": 0,
                    "supportKey": 0
                };

                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "Application submitted successfully. Thank you for your interest!",
                    "insertId": result[0][0].ID
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({ "code": 500,  "message": "Something went wrong" });
    }
};

exports.createWithResume = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const form = new formidable.IncomingForm();
    const uploadPath = path.join(__dirname, '../../uploads/Resume/');

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    form.parse(req, (error, fields, files) => {
        if (error) {
            console.log(error);
            logger.error(
                supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                applicationkey
            );
            return res.status(400).json({
                "code": 400,
                 "message": "Error parsing form data"
            });
        }

        try {
            const data = {
                NAME: fields.NAME || '',
                EMAIL_ID: fields.EMAIL_ID || '',
                MOBILE_NO: fields.MOBILE_NO || '',
                ADDRESS: fields.ADDRESS || '',
                DESIRED_LOCATION: fields.DESIRED_LOCATION || '',
                EXPERIENCE: fields.EXPERIENCE ? parseInt(fields.EXPERIENCE) : 0,
                RESUME: '',
                CLIENT_ID: fields.CLIENT_ID ? parseInt(fields.CLIENT_ID) : 1
            };

            if (!data.NAME || !data.MOBILE_NO) {
                return res.status(400).json({
                    "code": 400,
                     "message": "NAME and MOBILE_NO are required."
                });
            }

            /* Resume Upload */
            if (files.RESUME) {
                const oldPath = files.RESUME.filepath;
                const ext = path.extname(files.RESUME.originalFilename);
                const newFileName =
                    `${data.NAME.replace(/\s+/g, '_')}_${Date.now()}${ext}`;
                const newPath = path.join(uploadPath, newFileName);

                fs.writeFileSync(newPath, fs.readFileSync(oldPath));
                data.RESUME = newFileName;
            }

            mm.executeQueryData(
                `CALL sp_joinOurTeam_CreateWithResume(?,?,?,?,?,?,?,?)`,
                [
                    data.NAME,
                    data.EMAIL_ID,
                    data.MOBILE_NO,
                    data.ADDRESS,
                    data.DESIRED_LOCATION,
                    data.EXPERIENCE,
                    data.RESUME,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, result) => {
                    if (error) {
                        console.log("error", error);
                        logger.error(
                            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                            applicationkey
                        );
                        return res.status(400).json({
                            "code": 400,
                             "message": error.sqlMessage || "Failed to save join our team information."
                        });
                    }

                    const r = result[0][0];

                    /* Action Log */
                    dbm.saveLog({
                        SOURCE_ID: r.insertId,
                        LOG_DATE_TIME: mm.getSystemDate(),
                        LOG_TEXT: `New application received from ${data.NAME}.`,
                        CATEGORY: "join_our_team",
                        CLIENT_ID: 1,
                        USER_ID: 0,
                        supportKey: 0
                    }, systemLog);

                    res.status(200).json({
                        "code": 200,
                         "message": r.message,
                        insertId: r.insertId,
                        resumeFile: data.RESUME
                    });
                }
            );
        } catch (error) {
            console.log("Error in catch", error);
            logger.error(
                supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                applicationkey
            );
            res.status(500).json({
                "code": 500,
                 "message": "Something went wrong."
            });
        }
    });
};


exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!ID) {
        return res.status(400).json({
            "code": 400,
             "message": "ID is required for update."
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_joinOurTeam_update(?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.NAME,
                data.EMAIL_ID,
                data.MOBILE_NO,
                data.ADDRESS,
                data.DESIRED_LOCATION,
                data.EXPERIENCE,
                data.RESUME
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to update join our team information."
                    });
                }

                const r = result[0][0];

                if (r.code !== 200) {
                    return res.status(200).json(r);
                }

                var ACTION_DETAILS = `Application updated for ${data.NAME}.`;
                var logCategory = "join_our_team";

                let actionLog = {
                    "SOURCE_ID": ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                    "supportKey": 0
                };

                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "Application information updated successfully...",
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};



exports.delete = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;

    if (!ID) {
        return res.status(400).json({
            "code": 400,
             "message": "ID is required for deletion."
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_JoinOurTeam_delete(?)`,
            [ID],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to delete join our team information."
                    });
                }

                const r = result[0][0];

                /* Action Log */
                dbm.saveLog({
                    SOURCE_ID: ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `Application deleted with ID ${ID}.`,
                    CATEGORY: "join_our_team",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                }, systemLog);

                res.status(200).json({
                    "code": r.code,
                     "message": r.message
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        res.status(500).json({
            "code": 500,
             "message": "Something went wrong."
        });
    }
};
