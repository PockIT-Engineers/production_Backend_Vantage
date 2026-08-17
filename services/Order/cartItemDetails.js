const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
var cartItemDetails = "cart_item_details";
var viewCartItemDetails = "view_" + cartItemDetails;
// Conversion Done 

function reqData(req) {

    var data = {
        CART_ID: req.body.CART_ID,
        SERVICE_ID: req.body.SERVICE_ID,
        QUANTITY: req.body.QUANTITY,
        UNIT_PRICE: req.body.UNIT_PRICE ? req.body.UNIT_PRICE : 0,
        UNIT_NAME: req.body.UNIT_NAME,
        TOTAL_PRICE: req.body.TOTAL_PRICE ? req.body.TOTAL_PRICE : 0,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CART_ID').isInt().optional(), 
        body('SERVICE_ID').isInt().optional(), 
        body('QUANTITY').isInt().optional(), 
        body('UNIT_PRICE').isDecimal().optional(), 
        body('UNIT_NAME').optional(), 
        body('TOTAL_PRICE').isDecimal().optional(), 
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {

    const supportKey = req.headers['supportkey'];

    let pageIndex = req.body.pageIndex || 0;
    let pageSize  = req.body.pageSize || 0;
    let sortKey   = req.body.sortKey || 'ID';
    let sortValue = req.body.sortValue || 'DESC';
    let filter    = (req.body.filter || '').trim();

    if (mm.sanitizeFilter(filter) !== "0") {
        return res.send({ code: 400, message: "Invalid filter parameter." });
    }

    const safeFilter = filter.replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex};
        SET @v_PAGE_SIZE  = ${pageSize};
        SET @v_SORT_KEY   = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER     = '${safeFilter}';
    `;

    mm.executeQueryData(
        setContext + `CALL sp_cartItemDetails_get();`,
        [],
        supportKey,
        (error, results) => {

            if (error) {
                return res.send({ code: 400, message: "Failed to get cartItemDetails information." });
            }

            const resultSets = results.filter(r => Array.isArray(r));
            const countResult = resultSets[0] || [];
            const dataResult  = resultSets[1] || [];

            res.send({
                code: 200,
                message: "success",
                TAB_ID: 5,
                count: countResult[0] ? countResult[0].cnt : 0,
                data: dataResult
            });
        }
    );
};

exports.create = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ code: 422, message: errors.errors });
    }

    mm.executeQueryData(
        `CALL sp_cartItemDetails_create(?,?,?,?,?,?,?)`,
        [
            data.CART_ID,
            data.SERVICE_ID,
            data.QUANTITY,
            data.UNIT_PRICE,
            data.UNIT_NAME,
            data.TOTAL_PRICE,
            data.CLIENT_ID
        ],
        supportKey,
        (error) => {

            if (error) {
                return res.send({ code: 400, message: "Failed to save cartItemDetails information." });
            }

            res.send({
                code: 200,
                message: "CartItemDetails information saved successfully..."
            });
        }
    );
};

exports.update = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ code: 422, message: errors.errors });
    }

    mm.executeQueryData(
        `CALL sp_cartItemDetails_update(?,?,?,?,?,?,?,?)`,
        [
            req.body.ID,
            data.CART_ID,
            data.SERVICE_ID,
            data.QUANTITY,
            data.UNIT_PRICE,
            data.UNIT_NAME,
            data.TOTAL_PRICE,
            data.CLIENT_ID
        ],
        supportKey,
        (error) => {

            if (error) {
                return res.send({ code: 400, message: "Failed to update cartItemDetails information." });
            }

            res.send({
                code: 200,
                message: "CartItemDetails information updated successfully..."
            });
        }
    );
};