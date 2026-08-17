const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var roleMaster = "role_master";
var viewRoleMaster = "view_" + roleMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        PARENT_ID: req.body.PARENT_ID,
        TYPE: req.body.TYPE,
        DESCRIPTION: req.body.DESCRIPTION,
        CLIENT_ID: req.body.CLIENT_ID,
        START_PAGE: req.body.START_PAGE,
        ROLE_CREATED_DATE: req.body.ROLE_CREATED_DATE
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').exists(),
        body('PARENT_ID').isInt(),
        body('TYPE').optional(),
        body('DESCRIPTION').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var deviceid = req.headers['deviceid'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    try {

        filter = filter.replace(/'/g, "''");

        const setContext = `
            SET @v_PAGE_INDEX = '${pageIndex}';
            SET @v_PAGE_SIZE = '${pageSize}';
            SET @v_SORT_KEY = '${sortKey}';
            SET @v_SORT_VALUE = '${sortValue}';
            SET @v_FILTER = '${filter}';
        `;

        mm.executeQueryData(
            setContext + ` CALL sp_roleMaster_get(); `,
            [],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.send({
                        code: 400,
                        message: "Failed to get role information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r) && r.length);

                const count = resultSets[0]?.[0]?.cnt || 0;
                const data = resultSets[1] || [];

                res.send({
                    code: 200,
                    TAB_ID:87,
                    message: "success",
                    count: count,
                    data: data
                });

            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];
    var systemDate=mm.getSystemDate()
        data.CREATED_MODIFIED_DATE = systemDate;
        data.ROLE_CREATED_DATE = systemDate;
    if (!errors.isEmpty()) {
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData('CALL sp_roleMaster_create(?,?,?,?,?,?)', [data.NAME, data.PARENT_ID, data.TYPE, data.DESCRIPTION, data.CLIENT_ID, data.START_PAGE], supportKey, (error, results) => {

            if (error) {
                console.log("error", error)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.send({
                    code: 400,
                    message: "Failed to save role information..."
                });
            }

            res.send({
                    "code": results[0][0].code,
                    "message": results[0][0].MESSAGE,
                });

        }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);

    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();
    var ID = req.body.ID;

    if (!errors.isEmpty()) {
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData('CALL sp_roleMaster_update(?,?,?,?,?,?,?,?)', [ID, data.NAME || null, data.PARENT_ID || null, data.TYPE || null, data.DESCRIPTION || null, data.CLIENT_ID || null, data.START_PAGE || null, systemDate], supportKey, (error, results) => {

            if (error) {
                console.log("error", error)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.send({
                    code: 400,
                    message: "Failed to update role information."
                });
            }

            res.send({
                    "code": results[0][0].code,
                    "message": results[0][0].MESSAGE,
                });

        }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};
