const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var inventoryUnitMapping = "inventory_unit_mapping";
var viewInventoryUnitMapping = "view_" + inventoryUnitMapping;


function reqData(req) {

    var data = {

        ITEM_ID: req.body.ITEM_ID,
        QUANTITY: req.body.QUANTITY,
        UNIT_ID: req.body.UNIT_ID,
        CATEGORY: req.body.CATEGORY,
        CATEGORY_ID: req.body.CATEGORY_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        RATIO_RATE: req.body.RATIO_RATE,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
        AVG_LEVEL: req.body.AVG_LEVEL,
        REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
        ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL

    }

    return data;

}

exports.validate = function () {
    return [

        body('ITEM_ID').isInt().optional(), body('QUANTITY').isInt().optional(), body('UNIT_ID').isInt().optional(), body('CATEGORY').optional(), body('ID').optional(),
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
    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_inventoryUnitMapping_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventoryUnitMapping data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 39,
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
    const supportKey = req.headers['supportkey'];

    try {
        const params = [
           data.ITEM_ID,
    data.QUANTITY,
    data.UNIT_ID,
    data.CATEGORY,
    data.CATEGORY_ID,
    data.CLIENT_ID,
    data.RATIO_RATE,
    data.QUANTITY_PER_UNIT,
    data.AVG_LEVEL,
    data.REORDER_STOCK_LEVEL,
    data.ALERT_STOCK_LEVEL
        ];

        mm.executeQueryData(
            'CALL sp_inventoryUnitMapping_create(?,?,?,?,?,?,?,?,?,?,?)',
            params,
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.status(400).send({
                        "code": 400,
                        "message": "Failed to save inventoryUnitMapping"
                    });
                }
                res.status(200).send({
                    "code": 200,
                    "message": "InventoryUnitMapping saved successfully"
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
    const supportKey = req.headers['supportkey'];

    try {
        const params = [
            req.body.ID,
           data.ITEM_ID,
    data.QUANTITY,
    data.UNIT_ID,
    data.CATEGORY,
    data.CATEGORY_ID,
    data.CLIENT_ID,
    data.RATIO_RATE,
    data.QUANTITY_PER_UNIT,
    data.AVG_LEVEL,
    data.REORDER_STOCK_LEVEL,
    data.ALERT_STOCK_LEVEL
        ];

        mm.executeQueryData(
            'CALL sp_inventoryUnitMapping_update (?,?,?,?,?,?,?,?,?,?,?,?)',
            params,
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.status(400).send({
                        "code": 400,
                        "message": "Failed to update inventoryUnitMapping"
                    });
                }
                res.status(200).send({
                    "code": 200,
                    "message": "InventoryUnitMapping updated successfully"
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
