const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var inventoryTransactions = "inventory_transactions";
var viewInventoryTransactions = "view_" + inventoryTransactions;


function reqData(req) {

    var data = {
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        TRANSACTION_DATE: req.body.TRANSACTION_DATE,
        TRANSACTION_TYPE: req.body.TRANSACTION_TYPE,
        ITEM_ID: req.body.ITEM_ID,
        QUANTITY: req.body.QUANTITY,
        UNIT_ID: req.body.UNIT_ID,
        UNIT_COST: req.body.UNIT_COST ? req.body.UNIT_COST : 0,
        TOTAL_COST: req.body.TOTAL_COST ? req.body.TOTAL_COST : 0,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        VARIENT_ID: req.body.VARIENT_ID,
        VARIENT_DETAILS_ID: req.body.VARIENT_DETAILS_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [

        body('TRANSACTION_ID').isInt().optional(), body('TRANSACTION_DATE').optional(), body('TRANSACTION_TYPE').optional(), body('ITEM_ID').isInt().optional(), body('QUANTITY').isInt().optional(), body('UNIT_ID').isInt().optional(), body('UNIT_COST').isDecimal().optional(), body('TOTAL_COST').isDecimal().optional(), body('WAREHOUSE_ID').isInt().optional(), body('REMARKS').optional(), body('STATUS').optional(), body('ID').optional(),
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
            setContext + 'CALL sp_inventoryTransactions_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventoryTransactions data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 38,
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
        data.TRANSACTION_ID,
        data.TRANSACTION_DATE,
        data.TRANSACTION_TYPE,
        data.ITEM_ID,
        data.QUANTITY,
        data.UNIT_ID,
        data.UNIT_COST,
        data.TOTAL_COST,
        data.WAREHOUSE_ID,
        data.VARIENT_ID,
        data.VARIENT_DETAILS_ID,
        data.CUSTOMER_ID,
        data.STATUS,
        data.CLIENT_ID
    ];

    mm.executeQueryData(
        `CALL sp_inventoryTransactions_create (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        params,
        supportKey,
        (error) => {
            if (error) {
                console.log(error);
                return res.status(400).send({"code":400,  "message": "Failed to save inventoryTransactions" });
            }
            res.status(200).send({"code":200,  "message": "InventoryTransactions saved successfully" });
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
        data.TRANSACTION_ID,
        data.TRANSACTION_DATE,
        data.TRANSACTION_TYPE,
        data.ITEM_ID,
        data.QUANTITY,
        data.UNIT_ID,
        data.UNIT_COST,
        data.TOTAL_COST,
        data.WAREHOUSE_ID,
        data.VARIENT_ID,
        data.VARIENT_DETAILS_ID,
        data.CUSTOMER_ID,
        data.STATUS,
        data.CLIENT_ID
    ];

    mm.executeQueryData(
        `CALL sp_inventoryTransactions_update (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        params,
        supportKey,
        (error) => {
            if (error) {
                console.log(error);
                return res.status(400).send({"code":400,  "message": "Failed to update inventoryTransactions" });
            }
            res.status(200).send({"code":200,  "message": "InventoryTransactions updated successfully" });
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
