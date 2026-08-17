const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var formMaster = "form_master";
var viewFormMaster = "view_" + formMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        PARENT_ID: req.body.PARENT_ID,
        LINK: req.body.LINK,
        ICON: req.body.ICON,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').exists(), 
        body('PARENT_ID').isInt(), 
        body('LINK', ' parameter missing').exists(), 
        body('ICON').optional(), 
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
            setContext + ` CALL sp_formMaster_get(); `,
            [],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey,
                        supportKey,
                        deviceid
                    );
                    return res.send({
                        code: 400,
                        message: "Failed to get form information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r) && r.length);

                const count = resultSets[0]?.[0]?.cnt || 0;
                const data = resultSets[1] || [];

                res.send({
                    code: 200,
                    TAB_ID:27,
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

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            'CALL sp_formMaster_create(?,?,?,?,?)',
            [
                data.NAME,
                data.PARENT_ID,
                data.LINK,
                data.ICON,
                data.CLIENT_ID
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey,
                        supportKey,
                        deviceid
                    );
                    return res.send({
                        code: 400,
                        message: "Failed to save form information..."
                    });
                }

                res.send({
                    code: 200,
                    message: "Form information saved successfully...",
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
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {

        mm.executeQueryData(
            'CALL sp_formMaster_update(?,?,?,?,?,?,?)',
            [
                ID,
                data.NAME || null,
                data.PARENT_ID || null,
                data.LINK || null,
                data.ICON || null,
                data.CLIENT_ID || null,
                systemDate
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey,
                        supportKey,
                        deviceid
                    );
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to update form information."
                    });
                }

                res.send({
                    code: 200,
                    message: "Form information updated successfully...",
                });

            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};



