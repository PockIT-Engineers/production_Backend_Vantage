const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const fs = require('fs');
const path = require('path');
const applicationkey = process.env.APPLICATION_KEY;
var appLanguageMaster = "app_language_master";
var viewAppLanguageMaster = "view_" + appLanguageMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        SHORT_CODE: req.body.SHORT_CODE,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO,
        DEAFULT_JSON: req.body.DEAFULT_JSON,
        DRAFT_JSON_URL: req.body.DRAFT_JSON_URL,
        LIVE_JSON_URL: req.body.LIVE_JSON_URL,
        APPLICATION_TYPE: req.body.APPLICATION_TYPE,
        ICON: req.body.ICON,
        CLIENT_ID: req.body.CLIENT_ID,
        SIGN: req.body.SIGN
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('SHORT_CODE').optional(),
        body('SEQ_NO').isInt().optional(),
        body('ID').optional(),
    ]
}

exports.getAll = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const pageIndex = req.body.pageIndex || null;
    const pageSize = req.body.pageSize || null;
    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue || 'DESC';
    const filter = req.body.filter || '';

    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    if (mm.sanitizeFilter(filter) !== "0") {
        return res.status(400).json({"code":400,  "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_appLanguage_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({ "code": 400,  "message": "Failed to get app language." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 1,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const ID = req.params.id;
    var pageIndex = req.params.pageIndex ? req.params.pageIndex : '';
    var pageSize = req.params.pageSize ? req.params.pageSize : '';

    let sortKey = req.params.sortKey ? req.params.sortKey : 'ID';
    let sortValue = req.params.sortValue ? req.params.sortValue : 'DESC';
    let filter = req.params.filter ? req.params.filter : '';

    filter = (filter || '').trim();

    const safeFilter = (filter || '').replace(/'/g, "\\'");
    const setContext = `
        SET @v_ID = ${ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;

    if (mm.sanitizeFilter(filter) !== "0") {
        return res.status(400).json({
            "code":400,
             "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_appLanguage_getById()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    return res.status(400).json({
                        "code": 400,
                         "message": "Failed to get app language information."
                    });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 1,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
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

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code":422, "message": errors.errors });
    }

    try {
        data.DEAFULT_JSON = 'Default.json';
        data.DRAFT_JSON_URL = 'Default.json';

        mm.executeQueryData(
            `CALL sp_appLanguage_create(?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.SHORT_CODE,
                data.SEQ_NO,
                data.IS_ACTIVE,
                data.DEAFULT_JSON,
                data.DRAFT_JSON_URL,
                data.LIVE_JSON_URL,
                data.APPLICATION_TYPE,
                data.ICON,
                data.CLIENT_ID,
                data.SIGN
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": "Failed to save app language." });
                }

                const r = result[0][0];
                if (r.code !== 200) return res.status(200).json(r);

                res.status(200).json({ "code": 200,  "message": "App language saved successfully..." });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.addAppLanguage = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            data.DEAFULT_JSON = 'DefaultEnglish.json'
            data.DRAFT_JSON_URL = `${data.NAME}.json`
            mm.executeQueryData(`CALL sp_appLanguage_create(?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.SHORT_CODE,
                data.SEQ_NO,
                data.IS_ACTIVE,
                data.DEAFULT_JSON,
                data.DRAFT_JSON_URL,
                data.LIVE_JSON_URL,
                data.APPLICATION_TYPE,
                data.ICON,
                data.CLIENT_ID,
                data.SIGN
            ], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code":400,
                         "message": "Failed to save app language information..",
                    });
                }
                else {
                    const fs = require('fs');
                    const SourceFileName = `Default.json`;
                    const sourceFilePath = path.join(__dirname, '../../uploads/DraftJson/', SourceFileName);
                    const DestinationFileName = data.NAME + '.json';
                    const destinationFilePath = path.join(__dirname, '../../uploads/DraftJson/', DestinationFileName);
                    fs.readFile(sourceFilePath, 'utf8', (error, data) => {
                        if (error) {
                            console.log("error", error)
                            res.status(400).json({
                                "code":400,
                                 "message": "Failed to save app language information..",
                            });
                        }
                        else {
                            const jsonData = JSON.parse(data);
                            fs.writeFile(destinationFilePath, JSON.stringify(jsonData, null, 2), 'utf8', (error) => {
                                if (error) {
                                    console.log("error", error)
                                    res.status(400).json({
                                        "code":400,
                                         "message": "Failed to save app language information..",
                                    });
                                }
                                else {
                                    console.log("sucess")
                                    res.status(200).json({
                                        "code":200,
                                     "message": "App language information saved successfully...",
                                    });
                                }

                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(500).json({
                "code":500,
                 "message": "Something went wrong."
            });
        }
    }
}

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({
            code: 422,
            message: errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_appLanguage_update(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.NAME,
                data.SHORT_CODE,
                data.SEQ_NO,
                data.IS_ACTIVE,
                data.DEAFULT_JSON,
                data.DRAFT_JSON_URL,
                data.LIVE_JSON_URL,
                data.APPLICATION_TYPE,
                data.ICON,
                data.CLIENT_ID,
                data.SIGN
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update app language information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "App language information updated successfully...",
                    });
                }
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.saveAsDraft = (req, res) => {
    const DRAFT_JSON = req.body.DRAFT_JSON;
    var LANGUAGE = req.body.LANGUAGE;
    var DRAFT_JSON_URL = req.body.DRAFT_JSON_URL;
    const supportKey = req.headers['supportkey'];
    try {
        if (!DRAFT_JSON || !LANGUAGE) {
            console.log("Missing parameters DEAFULT_JSON or LANGUAGE in request body.");
            res.status(400).json({
                "message": "Missing parameters DEAFULT_JSON or LANGUAGE in request body."
            });
        } else {
            const JSON_DATA = JSON.stringify(DRAFT_JSON);
            const filePath = path.join(__dirname, '../../uploads/DraftJson/', DRAFT_JSON_URL);
            fs.writeFile(filePath, JSON_DATA, (error) => {
                if (error) {
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "failed to write JSON file."
                    });
                } else {
                    res.status(200).json({
                        "code": 200,
                        "message": "App language information saved successfully and JSON file created.",
                    });
                }
            });
        }
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.saveAsFinal = (req, res) => {
    const DRAFT_JSON = req.body.DRAFT_JSON;
    const LANGUAGE = req.body.LANGUAGE;
    const LANGUAGE_ID = req.body.LANGUAGE_ID;
    const DRAFT_JSON_URL = req.body.DRAFT_JSON_URL;
    var supportKey = req.headers['supportkey'];
    try {
        if (!DRAFT_JSON) {
            console.log("Missing parameters DRAFT_JSON in request body.");
            res.send({
                "code": 400,
                "message": "Missing parameters DRAFT_JSON in request body."
            });
        } else {
            const JSON_DATA = JSON.stringify(DRAFT_JSON);

            const FinalJsonName = `${LANGUAGE}.json`;
            const DraftfilePath = path.join(__dirname, '../../uploads/DraftJson/', DRAFT_JSON_URL);
            const LivefilePath = path.join(__dirname, '../../uploads/LiveJson/', FinalJsonName);
            fs.writeFile(DraftfilePath, JSON_DATA, (error) => {
                if (error) {
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "failed to write JSON file."
                    });
                } else {
                    fs.writeFile(LivefilePath, JSON_DATA, (error) => {
                        if (error) {
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                            console.log(error);
                            res.status(400).json({
                                "code": 400,
                                "message": "failed to write JSON file."
                            });
                        } else {
                            mm.executeQueryData(`CALL sp_appLanguage_saveAsFinal(?, ?)`,
                                [LANGUAGE_ID, FinalJsonName], supportKey, (error, results) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        res.status(400).json({
                                            "code": 400,
                                            "message": "Failed to update app language information."
                                        });
                                    }
                                    else {
                                        res.status(200).json({
                                            "code": 200,
                                            "message": "App language information saved successfully and JSON file created.",
                                        });
                                    }
                                });
                        }
                    });
                }
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.getAppLanguageMaster = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var ID = req.params.id;
    var pageIndex = req.params.pageIndex ? req.params.pageIndex : '';
    var pageSize = req.params.pageSize ? req.params.pageSize : '';

    let sortKey = req.params.sortKey ? req.params.sortKey : 'ID';
    let sortValue = req.params.sortValue ? req.params.sortValue : 'DESC';
    let filter = req.params.filter ? req.params.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    filter = (filter || '').trim();

    var IS_FILTER_WRONG = IS_FILTER_WRONG = mm.sanitizeFilter(filter);


    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_ID = ${ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_appLanguage_getById()`,
                [], supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "code":400,
                             "message": "Failed to get app language count.",
                        });
                    }
                    else {
                        const resultSets = results1.filter(r => Array.isArray(r));
                        const results = resultSets[1] || [];
                        const countResult = resultSets[0] || [];
                        console.log("results[0].DEAFULT_JSON", results[0].DEAFULT_JSON)
                        fs.readFile(path.join(__dirname, '../../uploads/DraftJson/' + results[0].DEAFULT_JSON), (error, data1) => {
                            if (error) {
                                console.log("error in reading file");
                                res.status(400).json({
                                    "code":400,
                                     "message": "Failed to get app language information.",
                                });
                            } else {
                                fs.readFile(path.join(__dirname, '../../uploads/DraftJson/' + results[0].DRAFT_JSON_URL), (error, data2) => {
                                    if (error) {
                                        console.log("error in reading file");
                                        res.status(400).json({
                                            "code":400,
                                             "message": "Failed to get app language information.",
                                        });
                                    } else {
                                        res.status(200).json({
                                            "code": 200,
                                            "message": "success",
                                            "TAB_ID": 1,
                                            "count": countResult[0] ? countResult[0].cnt : 0,
                                            "data": results,
                                            "DEAFULT_JSON": JSON.parse(data1),
                                            "DRAFT_JSON": JSON.parse(data2),
                                        });
                                    }
                                })

                            }
                        });
                    }
                });
        }
        else {
            res.status(400).json({
                "code":400,
                 "message": "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}
