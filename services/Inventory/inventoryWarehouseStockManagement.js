const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var inventoryWarehouseStockManagement = "inventory_warehouse_stock_management";
var viewInventoryWarehouseStockManagement = "view_" + inventoryWarehouseStockManagement;

function reqData(req) {
    var data = {
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        ITEM_ID: req.body.ITEM_ID,
        TOTAL_INWARD: req.body.TOTAL_INWARD,
        CURRENT_STOCK: req.body.CURRENT_STOCK,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('WAREHOUSE_ID').isInt().optional(),
        body('ITEM_ID').isInt().optional(),
        body('ID').optional(),
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
            setContext + 'CALL sp_inventoryWarehouseStockManagement_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventoryWarehouseStockManagement data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 40,
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

    try{
    const params = [
        data.WAREHOUSE_ID,
        data.ITEM_ID,
        data.TOTAL_INWARD,
        data.CURRENT_STOCK,
        data.CLIENT_ID
    ];

    mm.executeQueryData(
        'CALL sp_inventoryWarehouseStockManagement_create (?,?,?,?,?)',
        params,
        supportKey,
        (error) => {
            if (error) {
                console.log(error);
                return res.send({
                    "code": 400,
                     "message": "Failed to save inventoryWarehouseStockManagement information..."
                });
            }
            res.send({
                "code": 200,
                 "message": "InventoryWarehouseStockManagement information saved successfully..."
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

    try{
    const params = [
        req.body.ID,
        data.WAREHOUSE_ID,
        data.ITEM_ID,
        data.TOTAL_INWARD,
        data.CURRENT_STOCK,
        data.CLIENT_ID
    ];

    mm.executeQueryData(
        'CALL sp_inventoryWarehouseStockManagement_update (?,?,?,?,?,?)',
        params,
        supportKey,
        (error) => {
            if (error) {
                console.log(error);
                return res.send({
                    "code": 400,
                     "message": "Failed to update inventoryWarehouseStockManagement information."
                });
            }
            res.send({
                "code": 200,
                 "message": "InventoryWarehouseStockManagement information updated successfully..."
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
