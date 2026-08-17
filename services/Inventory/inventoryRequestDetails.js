const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var inventoryRequestDetails = "inventory_request_details";
var viewInventoryRequestDetails = "view_" + inventoryRequestDetails;


function reqData(req) {

    var data = {
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        QUANTITY: req.body.QUANTITY,
        RATE: req.body.RATE ? req.body.RATE : 0,
        TAX_RATE: req.body.TAX_RATE ? req.body.TAX_RATE : 0,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        REQUESTED_DATE_TIME: req.body.REQUESTED_DATE_TIME,
        STATUS: req.body.STATUS ? '1' : '0',
        REMARK: req.body.REMARK,
        INVENTORY_ID: req.body.INVENTORY_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('JOB_CARD_ID').isInt().optional(), body('TECHNICIAN_ID').isInt().optional(), body('CUSTOMER_ID').isInt().optional(), body('QUANTITY').isInt().optional(), body('RATE').isDecimal().optional(), body('TAX_RATE').isDecimal().optional(), body('TOTAL_AMOUNT').isDecimal().optional(), body('REQUESTED_DATE_TIME').optional(), body('STATUS').optional(), body('REMARK').optional(), body('INVENTORY_ID').isInt().optional(), body('ID').optional(),
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
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;

    try {
        mm.executeQueryData(
            setContext + ` CALL sp_inventoryRequestDetails_get(); `,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to get inventoryRequestDetails information."
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                res.status(200).json({
                    code: 200,
                    message: "success",
                    TAB_ID: 199,
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
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_inventoryRequestDetails_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.JOB_CARD_ID,
                data.INVENTORY_ID,
                data.INVENTORY_NAME,
                data.TECHNICIAN_ID,
                data.CUSTOMER_ID,
                data.QUANTITY,
                data.RATE,
                data.TAX_RATE,
                data.WAREHOUSE_ID,
                data.REQUEST_MASTER_ID,
                data.REQUESTED_DATE_TIME,
                'AP',
                data.REMARK,
                data.CLIENT_ID,
                data.BATCH_NO,
                data.SERIAL_NO,
                data.ACTUAL_UNIT_ID,
                data.ACTUAL_UNIT_NAME,
                data.INVENTORY_TRACKING_TYPE,
                data.IS_VARIANT,
                data.PARENT_ID,
                data.QUANTITY_PER_UNIT,
                data.TECHNICIAN_MOVEMENT_ID
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save inventory request."
                    });
                }
                res.status(200).json({
                    "code": 200,
                    "message": "InventoryRequestDetails saved successfully.",
                    data: results[0][0]
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

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_inventoryRequestDetails_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.JOB_CARD_ID,
                data.INVENTORY_ID,
                data.INVENTORY_NAME,
                data.TECHNICIAN_ID,
                data.CUSTOMER_ID,
                data.QUANTITY,
                data.RATE,
                data.TAX_RATE,
                data.WAREHOUSE_ID,
                data.REQUEST_MASTER_ID,
                data.REQUESTED_DATE_TIME,
                'AP',
                data.REMARK,
                data.CLIENT_ID,
                data.BATCH_NO,
                data.SERIAL_NO,
                data.ACTUAL_UNIT_ID,
                data.ACTUAL_UNIT_NAME,
                data.INVENTORY_TRACKING_TYPE,
                data.IS_VARIANT,
                data.PARENT_ID,
                data.QUANTITY_PER_UNIT,
                data.TECHNICIAN_MOVEMENT_ID
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update inventory request."
                    });
                }
                res.status(200).json({
                    "code": 200,
                    "message": "InventoryRequestDetails updated successfully."
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




