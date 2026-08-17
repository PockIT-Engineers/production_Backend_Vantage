const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const InventoryTrack = require("../../modules/InventoryTrack");
const inwardLogSchema = require("../../modules/inwardLogs")
const dbm = require('../../utilities/dbMongo');
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
var inventoryMaster = "inventory_master";
var viewInventoryMaster = "view_" + inventoryMaster;

function reqData(req) {
    var data = {
        ITEM_NAME: req.body.ITEM_NAME,
        INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
        INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
        DATE_OF_ENTRY: req.body.DATE_OF_ENTRY,
        STATUS: req.body.STATUS ? '1' : '0',
        SELLING_PRICE: req.body.SELLING_PRICE,
        CLIENT_ID: req.body.CLIENT_ID,
        DESCRIPTION: req.body.DESCRIPTION,
        INVENTORY_CATEGORY_NAME: req.body.INVENTORY_CATEGORY_NAME,
        INVENTRY_SUB_CATEGORY_NAME: req.body.INVENTRY_SUB_CATEGORY_NAME,
        BASE_UNIT_ID: req.body.BASE_UNIT_ID,
        BASE_UNIT_NAME: req.body.BASE_UNIT_NAME,
        BASE_QUANTITY: req.body.BASE_QUANTITY,
        PARENT_ID: req.body.PARENT_ID,
        SHORT_CODE: req.body.SHORT_CODE,
        AVG_LEVEL: req.body.AVG_LEVEL,
        REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
        ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL,
        HSN_ID: req.body.HSN_ID,
        HSN_NAME: req.body.HSN_NAME,
        TAX_PREFERENCE: req.body.TAX_PREFERENCE,
        TAX_ID: req.body.TAX_ID,
        TAX_NAME: req.body.TAX_NAME,
        IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS ? '1' : '0',
        IS_SET: req.body.IS_SET,
        SKU_CODE: req.body.SKU_CODE,
        IS_NEW: req.body.IS_NEW ? "1" : "0",
        VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
        INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
        WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED ? '1' : '0',
        GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED ? '1' : '0',
        EXPIRY_DATE_ALLOWED: req.body.EXPIRY_DATE_ALLOWED ? '1' : '0',
        INVENTORY_TYPE: req.body.INVENTORY_TYPE,
        RETURN_ALOW: req.body.RETURN_ALOW ? '1' : '0',
        BRAND_ID: req.body.BRAND_ID,
        BRAND_NAME: req.body.BRAND_NAME,
        WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
        GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
        DISCOUNT_ALLOWED: req.body.DISCOUNT_ALLOWED,
        DISCOUNTED_PRICE: req.body.DISCOUNTED_PRICE,
        RETURN_ALLOW_PERIOD: req.body.RETURN_ALLOW_PERIOD,
        REPLACEMENT_ALLOW: req.body.REPLACEMENT_ALLOW ? '1' : '0',
        REPLACEMENT_PERIOD: req.body.REPLACEMENT_PERIOD,
        EXPECTED_DELIVERY_IN_DAYS: req.body.EXPECTED_DELIVERY_IN_DAYS,
        WARRANTY_CARD: req.body.WARRANTY_CARD,
        RATING: req.body.RATING,
        BASE_PRICE: req.body.BASE_PRICE,
        DISCOUNTED_PERCENTAGE: req.body.DISCOUNTED_PERCENTAGE,
        WEIGHT: req.body.WEIGHT,
        LENGTH: req.body.LENGTH,
        BREADTH: req.body.BREADTH,
        HEIGHT: req.body.HEIGHT,
        EXPECTED_DELIVERY_CHARGES: req.body.EXPECTED_DELIVERY_CHARGES,
        INVENTORY_DETAILS_IMAGE: req.body.INVENTORY_DETAILS_IMAGE,
        IS_REFURBISHED: req.body.IS_REFURBISHED ? '1' : '0'
    }
    return data;
}


exports.validate = function () {
    return [
        body('ITEM_NAME').optional(),
        body('INVENTORY_CATEGORY_ID').optional(),
        body('INVENTRY_SUB_CATEGORY_ID').optional(),
        body('QUANTITY').optional(),
        body('PURCHASE_PRICE').optional(),
        body('SELLING_PRICE').optional(),
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
        return res.send({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_inventory_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400, "message": 'Failed to get inventory data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 32,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.getForCart = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : 0
    let INVENTORY_ID = req.body.INVENTORY_ID ? req.body.INVENTORY_ID : 0
    let UNIT_ID = req.body.UNIT_ID
    let QUANTITY_PER_UNIT = req.body.QUANTITY_PER_UNIT

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID || 0};
        SET @v_INVENTORY_ID = ${INVENTORY_ID || 0};
        SET @v_UNIT_ID = ${UNIT_ID || 0};
        SET @v_QUANTITY_PER_UNIT = ${QUANTITY_PER_UNIT || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    if (IS_FILTER_WRONG !== "0") {
        return res.send({
            "code": 400,
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_inventory_getForCart()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400, "message": 'Failed to get inventory cart data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 32,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({
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
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL   sp_inventoryMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.ITEM_NAME,
                data.INVENTORY_CATEGORY_ID,
                data.INVENTRY_SUB_CATEGORY_ID,
                data.DATE_OF_ENTRY,
                data.STATUS,
                data.SELLING_PRICE,
                data.CLIENT_ID,
                data.DESCRIPTION,
                data.INVENTORY_CATEGORY_NAME,
                data.INVENTRY_SUB_CATEGORY_NAME,
                data.BASE_UNIT_ID,
                data.BASE_UNIT_NAME,
                data.BASE_QUANTITY,
                data.PARENT_ID,
                data.SHORT_CODE,
                data.AVG_LEVEL,
                data.REORDER_STOCK_LEVEL,
                data.ALERT_STOCK_LEVEL,
                data.HSN_ID,
                data.HSN_NAME,
                data.TAX_PREFERENCE,
                data.TAX_ID,
                data.TAX_NAME,
                data.IS_HAVE_VARIANTS,
                data.IS_SET,
                data.SKU_CODE,
                data.IS_NEW,
                data.VARIANT_COMBINATION,
                data.INVENTORY_TRACKING_TYPE,
                data.WARRANTY_ALLOWED,
                data.GUARANTEE_ALLOWED,
                data.EXPIRY_DATE_ALLOWED,
                data.INVENTORY_TYPE,
                data.RETURN_ALOW,
                data.BRAND_ID,
                data.BRAND_NAME,
                data.WARRANTY_PERIOD,
                data.GUARANTEE_PERIOD,
                data.DISCOUNT_ALLOWED,
                data.DISCOUNTED_PRICE,
                data.RETURN_ALLOW_PERIOD,
                data.REPLACEMENT_ALLOW,
                data.REPLACEMENT_PERIOD,
                data.EXPECTED_DELIVERY_IN_DAYS,
                data.WARRANTY_CARD,
                data.RATING,
                data.BASE_PRICE,
                data.DISCOUNTED_PERCENTAGE,
                data.WEIGHT,
                data.LENGTH,
                data.BREADTH,
                data.HEIGHT,
                data.EXPECTED_DELIVERY_CHARGES,
                data.INVENTORY_DETAILS_IMAGE,
                data.IS_REFURBISHED,
                data.QUANTITY
            ],
            supportKey,
            async (error, results) => {

                if (error) {
                    console.log("error", error)
                    logger.error(
                        supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        "code": 400,
                        "message": 'Failed to save inventory information...'
                    });
                }


                const r = results[0][0];
                console.log("r", r)
                if (r.ID === -1) {
                    return res.send({
                        "code": 300,
                        "message": "An item with the same short code already exists."
                    });
                }

                trackData = {
                    ITEM_NAME: req.body.ITEM_NAME,
                    WAREHOUSE_ID: req.body.WAREHOUSE_ID,
                    INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
                    INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
                    DATE_OF_ENTRY: mm.getSystemDate(),
                    STATUS: req.body.STATUS,
                    SELLING_PRICE: req.body.SELLING_PRICE,
                    DESCRIPTION: req.body.DESCRIPTION,
                    INVENTORY_CATEGORY_NAME: req.body.INVENTORY_CATEGORY_NAME,
                    INVENTRY_SUB_CATEGORY_NAME: req.body.INVENTRY_SUB_CATEGORY_NAME,
                    BASE_UNIT_ID: req.body.BASE_UNIT_ID,
                    BASE_UNIT_NAME: req.body.BASE_UNIT_NAME,
                    BASE_QUANTITY: req.body.BASE_QUANTITY,
                    PARENT_ID: req.body.PARENT_ID,
                    SHORT_CODE: req.body.SHORT_CODE,
                    AVG_LEVEL: req.body.AVG_LEVEL,
                    REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
                    ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL,
                    HSN_ID: req.body.HSN_ID,
                    HSN_NAME: req.body.HSN_NAME,
                    TAX_PREFERENCE: req.body.TAX_PREFERENCE,
                    TAX_ID: req.body.TAX_ID,
                    TAX_NAME: req.body.TAX_NAME,
                    WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
                    IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS,
                    IS_SET: req.body.IS_SET,
                    SKU_CODE: req.body.SKU_CODE,
                    IS_NEW: req.body.IS_NEW,
                    VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
                    INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
                    WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
                    GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
                    EXPIRY_DATE_ALLOWED: req.body.EXPIRY_DATE_ALLOWED,
                    INVENTORY_TYPE: req.body.INVENTORY_TYPE,
                    RETURN_ALOW: req.body.RETURN_ALOW,
                    BRAND_ID: req.body.BRAND_ID,
                    BRAND_NAME: req.body.BRAND_NAME,
                    WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
                    GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
                    DISCOUNT_ALLOWED: req.body.DISCOUNT_ALLOWED,
                    DISCOUNTED_PRICE: req.body.DISCOUNTED_PRICE,
                    RETURN_ALLOW_PERIOD: req.body.RETURN_ALLOW_PERIOD,
                    REPLACEMENT_ALLOW: req.body.REPLACEMENT_ALLOW,
                    REPLACEMENT_PERIOD: req.body.REPLACEMENT_PERIOD,
                    EXPECTED_DELIVERY_IN_DAYS: req.body.EXPECTED_DELIVERY_IN_DAYS,
                    WARRANTY_CARD: req.body.WARRANTY_CARD,
                    RATING: req.body.RATING,
                    BASE_PRICE: req.body.BASE_PRICE,
                    DISCOUNTED_PERCENTAGE: req.body.DISCOUNTED_PERCENTAGE,
                    WEIGHT: req.body.WEIGHT,
                    LENGTH: req.body.LENGTH,
                    BREADTH: req.body.BREADTH,
                    HEIGHT: req.body.HEIGHT,
                    EXPECTED_DELIVERY_CHARGES: req.body.EXPECTED_DELIVERY_CHARGES,
                    IS_REFURBISHED: req.body.IS_REFURBISHED
                }

                dbm.saveLog(trackData, InventoryTrack);
                const actionLog = {
                    SOURCE_ID: r.ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} has created a new inventory item ${data.ITEM_NAME}.`,
                    CATEGORY: 'inventory',
                    CLIENT_ID: data.CLIENT_ID || 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0
                };

                // dbm.saveLog(actionLog, systemLog);

                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,
                    8,
                    'New Inventory Added',
                    `Hello Admin, New inventory item ${data.ITEM_NAME} was added on ${mm.getSystemDate()}.`,
                    '',
                    'I',
                    supportKey,
                    'I',
                    []
                );

                res.status(200).json({
                    'ID': r.ID,
                    "code": 200,
                    "message": "Inventory information saved successfully...",
                });
            }
        );

    } catch (error) {
        return res.status(500).json({
            "code": 500,
            "message": 'Something went wrong.'
        });
    }
};

exports.update = (req, res) => {

    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const ID = req.body.ID;
    const systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_inventoryMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                ID,
                data.ITEM_NAME,
                data.INVENTORY_CATEGORY_ID,
                data.INVENTRY_SUB_CATEGORY_ID,
                data.STATUS,
                data.SELLING_PRICE,
                data.CLIENT_ID,
                data.DESCRIPTION,
                data.INVENTORY_CATEGORY_NAME,
                data.INVENTRY_SUB_CATEGORY_NAME,
                data.BASE_UNIT_ID,
                data.BASE_UNIT_NAME,
                data.BASE_QUANTITY,
                data.PARENT_ID,
                data.SHORT_CODE,
                data.AVG_LEVEL,
                data.REORDER_STOCK_LEVEL,
                data.ALERT_STOCK_LEVEL,
                data.HSN_ID,
                data.HSN_NAME,
                data.TAX_PREFERENCE,
                data.TAX_ID,
                data.TAX_NAME,
                data.IS_HAVE_VARIANTS,
                data.IS_SET,
                data.SKU_CODE,
                data.IS_NEW,
                data.VARIANT_COMBINATION,
                data.INVENTORY_TRACKING_TYPE,
                data.WARRANTY_ALLOWED,
                data.GUARANTEE_ALLOWED,
                data.EXPIRY_DATE_ALLOWED,
                data.INVENTORY_TYPE,
                data.RETURN_ALOW,
                data.BRAND_ID,
                data.BRAND_NAME,
                data.WARRANTY_PERIOD,
                data.GUARANTEE_PERIOD,
                data.DISCOUNT_ALLOWED,
                data.DISCOUNTED_PRICE,
                data.RETURN_ALLOW_PERIOD,
                data.REPLACEMENT_ALLOW,
                data.REPLACEMENT_PERIOD,
                data.EXPECTED_DELIVERY_IN_DAYS,
                data.WARRANTY_CARD,
                data.RATING,
                data.BASE_PRICE,
                data.DISCOUNTED_PERCENTAGE,
                data.WEIGHT,
                data.LENGTH,
                data.BREADTH,
                data.HEIGHT,
                data.EXPECTED_DELIVERY_CHARGES,
                data.IS_REFURBISHED,
                systemDate,
                data.INVENTORY_DETAILS_IMAGE,
                systemDate
            ],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log("error", error)
                    return res.send({
                        "code": 400,
                        "message": 'Failed to update inventory information.'
                    });
                }
                console.log("results", results)
                const r = results[0][0];
                if (r.ID === -1) {
                    mm.rollbackConnection(connection);
                    return res.send({
                        "code": 300,
                        "message": "An item with the same short code already exists."
                    });
                }
                const ACTION_LOG = `${req.body.authData.data.UserData[0].NAME} has modified details of ${data.ITEM_NAME} on ${systemDate}.`;

                const trackData = {
                    ITEM_ID: ID,
                    ITEM_NAME: req.body.ITEM_NAME,
                    ACTION_LOG: ACTION_LOG,
                    AADED_BY: req.body.authData.data.UserData[0].NAME,
                    WAREHOUSE_ID: req.body.WAREHOUSE_ID,
                    INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
                    INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
                    DATE_OF_ENTRY: systemDate,
                    STATUS: req.body.STATUS,
                    SELLING_PRICE: req.body.SELLING_PRICE,
                    DESCRIPTION: req.body.DESCRIPTION,
                    INVENTORY_CATEGORY_NAME: req.body.INVENTORY_CATEGORY_NAME,
                    INVENTRY_SUB_CATEGORY_NAME: req.body.INVENTRY_SUB_CATEGORY_NAME,
                    BASE_UNIT_ID: req.body.BASE_UNIT_ID,
                    BASE_UNIT_NAME: req.body.BASE_UNIT_NAME,
                    BASE_QUANTITY: req.body.BASE_QUANTITY,
                    PARENT_ID: req.body.PARENT_ID,
                    SHORT_CODE: req.body.SHORT_CODE,
                    AVG_LEVEL: req.body.AVG_LEVEL,
                    REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
                    ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL,
                    HSN_ID: req.body.HSN_ID,
                    HSN_NAME: req.body.HSN_NAME,
                    TAX_PREFERENCE: req.body.TAX_PREFERENCE,
                    TAX_ID: req.body.TAX_ID,
                    TAX_NAME: req.body.TAX_NAME,
                    WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
                    IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS,
                    IS_SET: req.body.IS_SET,
                    SKU_CODE: req.body.SKU_CODE,
                    IS_NEW: req.body.IS_NEW,
                    VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
                    INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
                    WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
                    GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
                    EXPIRY_DATE_ALLOWED: req.body.EXPIRY_DATE_ALLOWED,
                    INVENTORY_TYPE: req.body.INVENTORY_TYPE,
                    RETURN_ALOW: req.body.RETURN_ALOW,
                    BRAND_ID: req.body.BRAND_ID,
                    BRAND_NAME: req.body.BRAND_NAME,
                    WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
                    GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
                    DISCOUNT_ALLOWED: req.body.DISCOUNT_ALLOWED,
                    DISCOUNTED_PRICE: req.body.DISCOUNTED_PRICE,
                    RETURN_ALLOW_PERIOD: req.body.RETURN_ALLOW_PERIOD,
                    REPLACEMENT_ALLOW: req.body.REPLACEMENT_ALLOW,
                    REPLACEMENT_PERIOD: req.body.REPLACEMENT_PERIOD,
                    EXPECTED_DELIVERY_IN_DAYS: req.body.EXPECTED_DELIVERY_IN_DAYS,
                    WARRANTY_CARD: req.body.WARRANTY_CARD,
                    RATING: req.body.RATING,
                    BASE_PRICE: req.body.BASE_PRICE,
                    DISCOUNTED_PERCENTAGE: req.body.DISCOUNTED_PERCENTAGE,
                    WEIGHT: req.body.WEIGHT,
                    LENGTH: req.body.LENGTH,
                    BREADTH: req.body.BREADTH,
                    HEIGHT: req.body.HEIGHT,
                    EXPECTED_DELIVERY_CHARGES: req.body.EXPECTED_DELIVERY_CHARGES,
                    IS_REFURBISHED: req.body.IS_REFURBISHED
                }

                dbm.saveLog(trackData, InventoryTrack);

                return res.send({
                    "code": 200,
                    "message": r.message
                });
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        return res.send({
            "code": 500,
            "message": 'Something went wrong.'
        });
    }
};

exports.mapUnitToInventory = (req, res) => {
    try {
        const ITEM_ID = req.body.ITEM_ID;
        const CLIENT_ID = req.body.CLIENT_ID;
        const DATA = req.body.DATA || [];
        const supportKey = req.headers['supportkey'];

        if (!ITEM_ID || DATA.length === 0) {
            return res.send({
                "code": 400,
                "message": "item id or data parameter missing"
            });
        }

        mm.executeQueryData(
            `CALL sp_inventory_mapUnitToInventory(?,?,?)`,
            [
                ITEM_ID,
                CLIENT_ID,
                JSON.stringify(DATA)
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        "code": 400,
                        "message": "Failed to map units to item."
                    });
                }

                res.send(results[0][0]);
            }
        );

    } catch (error) {
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.getInventoryHirarchy = (req, res) => {
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
            setContext + 'CALL sp_inventory_getInventoryHirarchy()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory hirarchy data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));

                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 32,
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




exports.getCustomItemHirarchy = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.query.pageIndex ? req.query.pageIndex : 0;
    var pageSize = req.query.pageSize ? req.query.pageSize : 0;
    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';
    let INVENTORY_TRACKING_TYPE = req.body.INVENTORY_TRACKING_TYPE ? req.body.INVENTORY_TRACKING_TYPE : '';
    let IS_W_MANAGER = req.body.IS_W_MANAGER ? req.body.IS_W_MANAGER : 0;
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : 0;
    let WAREHOUSE_ID = req.body.WAREHOUSE_ID ? req.body.WAREHOUSE_ID : 0;
    let IS_FIRST = req.body.IS_FIRST ? req.body.IS_FIRST : 0;
    let MOVMENT_TYPE = req.body.MOVMENT_TYPE;
    let CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : 0;

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            var params = [
                pageIndex,
                pageSize,
                sortKey,
                sortValue,
                filter,
                INVENTORY_TRACKING_TYPE,
                IS_W_MANAGER,
                TECHNICIAN_ID,
                WAREHOUSE_ID,
                IS_FIRST,
                MOVMENT_TYPE,
                CUSTOMER_ID
            ];

            mm.executeQueryData('CALL sp_getCustomItemHirarchy(?,?,?,?,?,?,?,?,?,?,?,?)', params, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventory information."
                    });
                }
                else {
                    var mainData = results[0];

                    res.status(200).send({
                        "message": "success",
                        "TAB_ID": 32,
                        "data": mainData
                    });
                }
            });
        }
        else {
            res.status(400).send({
                code: 400,
                message: "Invalid filter parameter."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};




exports.getInventoryStock = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ACTUAL_UNIT_ID';
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
            setContext + 'CALL sp_inventory_getInventoryStock()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get getInventoryStock data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 32,
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

exports.getInventoryUniqueNo = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let INVENTORY_TRACKING_TYPE = req.body.INVENTORY_TRACKING_TYPE;

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_INVENTORY_TRACKING_TYPE = '${INVENTORY_TRACKING_TYPE}';
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
            setContext + 'CALL sp_inventory_getInventoryUniqueNo()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get getInventoryStock data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 32,
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


exports.getDetailedInventoryStock = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ITEM_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let INVENTORY_TRACKING_TYPE = req.body.INVENTORY_TRACKING_TYPE;

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
            setContext + 'CALL sp_inventory_getDetailedInventoryStock()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get getInventoryStock data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 32,
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

exports.getItemsForTechnician = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'm.ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID;

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_TECHNICIAN_ID = '${TECHNICIAN_ID}';
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
            setContext + 'CALL sp_inventory_getItemsForTechnician()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get getInventoryStock data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 32,
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


exports.getPopularInvenotry = (req, res) => {
    const supportKey = req.headers['supportkey'];
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';

    const setContext = `
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
    `;

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_inventory_getPopularInvenotry()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory hirarchy data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));

                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 32,
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

exports.importInventory = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing parameter: EXCEL_FILE_NAME." });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found in the Excel file." });

        res.status(200).json({ code: 200, message: "Import started. Processing in background...", EXCEL_MASTER_ID: EXCEL_MASTER_ID });

        let successCount = 0;
        let skippedCount = 0;
        let successDetails = [];
        let errorDetails = [];
        let errorData = [];
        let skippedDetails = [];
        let totalData = [];
        const chunkSize = 50;

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);
            for (const [index, row] of chunk.entries()) {
                const rowNum = start + index + 2;
                const connection = mm.openConnection();
                try {
                    const rawData = {};
                    const providedFields = new Set();

                    COLUMN_JSON.forEach(c => {
                        let value = row[c.EXCEL_FIELD];
                        // Skip empty cells (undefined, null, empty string)
                        if (value !== undefined && value !== null && value !== '') {
                            rawData[c.TABLE_FIELD] = value;
                            providedFields.add(c.TABLE_FIELD);
                        }
                    });

                    // Required fields check
                    if (!rawData.ITEM_NAME || !rawData.SHORT_CODE) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNum,
                            row,
                            reason: "Missing required fields (ITEM_NAME or SHORT_CODE)"
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing required fields" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    console.log("\n\n*************************************")
                    console.log("Raw Data Before Mapping", rawData)
                    console.log("\n\n*************************************")

                    // Normalise nulls for fields that might be looked up
                    rawData.TAX_NAME = rawData.TAX_NAME ?? null;
                    rawData.INVENTORY_CATEGORY_NAME = rawData.INVENTORY_CATEGORY_NAME ?? null;
                    rawData.INVENTRY_SUB_CATEGORY_NAME = rawData.INVENTRY_SUB_CATEGORY_NAME ?? null;
                    rawData.BASE_UNIT_NAME = rawData.BASE_UNIT_NAME ?? null;
                    rawData.HSN_NAME = rawData.HSN_NAME ?? null;

                    const isEdit = IMPORT_TYPE === 'E';
                    rawData.DATE_OF_ENTRY = mm.getSystemDate();

                    // 2. Duplicate short code check
                    const dupMsg = await checkInventoryDuplicate(
                        rawData.SHORT_CODE,
                        rawData.ID,
                        isEdit,
                        supportKey,
                        connection
                    );
                    if (dupMsg) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber: rowNum, row, reason: dupMsg });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: dupMsg });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // 3. Fetch references from DB
                    const getSubCat = await runQuery(
                        `CALL sp_getInventorySubCategoryForImportInventory(?,?)`,
                        [rawData.INVENTRY_SUB_CATEGORY_NAME, rawData.INVENTORY_CATEGORY_NAME],
                        supportKey, connection
                    );
                    let getSubCategory = getSubCat[0] || [];

                    const getUnits = await runQuery(
                        `CALL sp_getUnitForImportInventory(?)`,
                        [rawData.BASE_UNIT_NAME],
                        supportKey, connection
                    );
                    let getUnit = getUnits[0] || [];

                    const getHSNs = await runQuery(
                        `CALL sp_getHsnForImportInventory(?)`,
                        [rawData.HSN_NAME],
                        supportKey, connection
                    );
                    let getHSN = getHSNs[0] || [];

                    const getTaxs = await runQuery(
                        `CALL sp_getTaxForImportInventory(?)`,
                        [rawData.TAX_NAME],
                        supportKey, connection
                    );
                    let getTax = getTaxs[0] || [];

                    const getBrands = await runQuery(
                        `CALL sp_getBrandForImportInventory(?)`,
                        [rawData.BRAND_NAME],
                        supportKey, connection
                    );
                    let getBrand = getBrands[0] || [];

                    // 4. Validate sub‑category (always required)
                    if (!getSubCategory.length) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNum,
                            row,
                            reason: "Inventory sub category does not exist for category: " + rawData.INVENTORY_CATEGORY_NAME,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Inventory sub category does not exist for category: " + rawData.INVENTORY_CATEGORY_NAME });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // 5. Tax handling (taxable / non‑taxable)
                    const isTaxable = rawData.TAX_PREFERENCE?.toString().trim().toLowerCase() === "taxable";
                    let sellingPrice = parseFloat(rawData.BASE_PRICE) || 0;

                    if (isTaxable) {
                        if (rawData.TAX_NAME && !getTax.length) {
                            skippedCount++;
                            skippedDetails.push({ rowNumber: rowNum, row, reason: "Tax does not exist" });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Tax not exist" });
                            mm.rollbackConnection(connection);
                            continue;
                        }
                        rawData.TAX_ID = getTax[0]?.ID || null;
                        rawData.TAX_PREFERENCE = "T";
                        rawData.TAX_NAME = getTax[0]?.NAME || null;
                        sellingPrice = parseFloat(rawData.BASE_PRICE) + (parseFloat(rawData.BASE_PRICE) * (parseFloat(getTax[0]?.IGST) || 0) / 100);
                    } else {
                        // Non‑taxable
                        rawData.TAX_ID = null;
                        rawData.TAX_NAME = null;
                        rawData.TAX_PREFERENCE = "NT";
                    }
                    rawData.SELLING_PRICE = sellingPrice;

                    // 6. Brand validation
                    if (!getBrand.length) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber: rowNum, row, reason: "Brand does not exist" });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Brand not exist" });
                        mm.rollbackConnection(connection);
                        continue;
                    }
                    rawData.BRAND_ID = getBrand[0].ID;
                    rawData.BRAND_NAME = getBrand[0].BRAND_NAME;

                    // 7. Unit handling (fallback for edit mode)
                    if (!getUnit.length) {
                        if (isEdit && rawData.ID) {
                            const existingItemSp = await runQuery(
                                `CALL sp_getBaseUnitFromInventory(?)`,
                                [rawData.ID],
                                supportKey, connection
                            );
                            let existingItem = existingItemSp[0] || [];
                            if (existingItem.length > 0) {
                                rawData.BASE_UNIT_ID = existingItem[0].BASE_UNIT_ID || null;
                            } else {
                                skippedCount++;
                                skippedDetails.push({ rowNumber: rowNum, row, reason: "Unit does not exist and item not found for update" });
                                totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Unit not exist and item not found for update" });
                                mm.rollbackConnection(connection);
                                continue;
                            }
                        } else {
                            skippedCount++;
                            skippedDetails.push({ rowNumber: rowNum, row, reason: "Unit does not exist" });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Unit not exist" });
                            mm.rollbackConnection(connection);
                            continue;
                        }
                    } else {
                        rawData.BASE_UNIT_ID = getUnit[0].ID;
                        rawData.BASE_UNIT_NAME = getUnit[0].NAME;
                    }

                    // 8. HSN handling
                    if (!getHSN.length) {
                        if (isEdit) {
                            rawData.HSN_ID = null;
                        } else {
                            skippedCount++;
                            skippedDetails.push({ rowNumber: rowNum, row, reason: "HSN does not exist" });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "HSN not exist" });
                            mm.rollbackConnection(connection);
                            continue;
                        }
                    } else {
                        rawData.HSN_ID = getHSN[0].ID;
                        rawData.HSN_NAME = getHSN[0].CODE;
                    }

                    // 9. Foreign keys from sub‑category
                    rawData.INVENTORY_CATEGORY_ID = getSubCategory[0].INVENTRY_CATEGORY_ID;
                    rawData.INVENTRY_SUB_CATEGORY_ID = getSubCategory[0].ID;
                    rawData.INVENTORY_CATEGORY_NAME = getSubCategory[0].CATEGORY_NAME;
                    rawData.INVENTRY_SUB_CATEGORY_NAME = getSubCategory[0].NAME;

                    // 10. Convert string values to DB formats (only if field is provided)
                    if (providedFields.has('INVENTORY_TRACKING_TYPE')) {
                        rawData.INVENTORY_TRACKING_TYPE =
                            rawData.INVENTORY_TRACKING_TYPE == "None" ? "N" :
                            rawData.INVENTORY_TRACKING_TYPE == "Serial No. Wise" ? "S" :
                            rawData.INVENTORY_TRACKING_TYPE == "Batch Wise" ? "B" : "N";
                    }
                    if (providedFields.has('WARRANTY_ALLOWED')) rawData.WARRANTY_ALLOWED = rawData.WARRANTY_ALLOWED == "Yes" ? 1 : 0;
                    if (providedFields.has('GUARANTEE_ALLOWED')) rawData.GUARANTEE_ALLOWED = rawData.GUARANTEE_ALLOWED == "Yes" ? 1 : 0;
                    if (providedFields.has('EXPIRY_DATE_ALLOWED')) rawData.EXPIRY_DATE_ALLOWED = rawData.EXPIRY_DATE_ALLOWED == "Yes" ? 1 : 0;
                    if (providedFields.has('IS_NEW')) rawData.IS_NEW = rawData.IS_NEW == "Yes" ? 1 : 0;
                    if (providedFields.has('IS_REFURBISHED')) rawData.IS_REFURBISHED = rawData.IS_REFURBISHED == "Yes" ? 1 : 0;
                    if (providedFields.has('DISCOUNT_ALLOWED')) rawData.DISCOUNT_ALLOWED = rawData.DISCOUNT_ALLOWED == "Yes" ? 1 : 0;
                    if (providedFields.has('IS_HAVE_VARIANTS')) rawData.IS_HAVE_VARIANTS = rawData.IS_HAVE_VARIANTS == "Yes" ? 1 : 0;
                    if (providedFields.has('IS_SET')) rawData.IS_SET = rawData.IS_SET == "Yes" ? 1 : 0;
                    if (providedFields.has('INVENTORY_TYPE')) {
                        rawData.INVENTORY_TYPE =
                            rawData.INVENTORY_TYPE == "Product" ? "P" :
                            rawData.INVENTORY_TYPE == "Shop" ? "S" : "B";
                    }
                    // PARENT_ID: only update if explicitly provided (non-empty)
                    if (providedFields.has('REPLACEMENT_ALLOW')) rawData.REPLACEMENT_ALLOW = rawData.REPLACEMENT_ALLOW == "Yes" ? 1 : 0;
                    if (providedFields.has('RETURN_ALLOW')) rawData.RETURN_ALOW = rawData.RETURN_ALLOW == "Yes" ? 1 : 0;
                    if (providedFields.has('WARRANTY_PERIOD')) rawData.WARRANTY_PERIOD = (rawData.WARRANTY_PERIOD === "-" ? 0 : Number(rawData.WARRANTY_PERIOD));
                    if (providedFields.has('GUARANTEE_PERIOD')) rawData.GUARANTEE_PERIOD = (rawData.GUARANTEE_PERIOD === "-" ? 0 : Number(rawData.GUARANTEE_PERIOD));
                    if (providedFields.has('BASE_QUANTITY')) rawData.BASE_QUANTITY = parseFloat(rawData.BASE_QUANTITY) || 0;
                    if (providedFields.has('DISCOUNTED_PRICE')) rawData.DISCOUNTED_PRICE = parseFloat(rawData.DISCOUNTED_PRICE) || 0;
                    if (providedFields.has('AVG_LEVEL')) rawData.AVG_LEVEL = parseInt(rawData.AVG_LEVEL) || 0;
                    if (providedFields.has('REORDER_STOCK_LEVEL')) rawData.REORDER_STOCK_LEVEL = parseInt(rawData.REORDER_STOCK_LEVEL) || 0;
                    if (providedFields.has('ALERT_STOCK_LEVEL')) rawData.ALERT_STOCK_LEVEL = parseInt(rawData.ALERT_STOCK_LEVEL) || 0;
                    if (providedFields.has('EXPECTED_DELIVERY_IN_DAYS')) rawData.EXPECTED_DELIVERY_IN_DAYS = parseInt(rawData.EXPECTED_DELIVERY_IN_DAYS) || 0;
                    if (providedFields.has('EXPECTED_DELIVERY_CHARGES')) rawData.EXPECTED_DELIVERY_CHARGES = parseFloat(rawData.EXPECTED_DELIVERY_CHARGES) || 0;
                    if (providedFields.has('STATUS')) {
                        // Convert "Active" → 1, anything else → 0, but only if provided
                        rawData.STATUS = (rawData.STATUS == 'Active' || rawData.STATUS == 'Yes') ? 1 : 0;
                    }

                    // Defaults for new records only
                    if (!isEdit) {
                        rawData.CLIENT_ID = 1;
                        rawData.STATUS = 1;
                        rawData.IS_NEW = 1;
                        rawData.IS_REFURBISHED = rawData.IS_REFURBISHED ?? 0;
                        rawData.IS_HAVE_VARIANTS = rawData.IS_HAVE_VARIANTS ?? 0;
                        rawData.IS_SET = rawData.IS_SET ?? 0;
                        rawData.INVENTORY_TYPE = rawData.INVENTORY_TYPE ?? 'B';
                        rawData.PARENT_ID = rawData.PARENT_ID || 0;
                        rawData.REPLACEMENT_ALLOW = rawData.REPLACEMENT_ALLOW ?? 0;
                        rawData.REPLACEMENT_PERIOD = rawData.REPLACEMENT_PERIOD || 0;
                        rawData.RETURN_ALOW = rawData.RETURN_ALOW ?? 0;
                        rawData.RETURN_ALLOW_PERIOD = rawData.RETURN_ALLOW_PERIOD || 0;
                        rawData.BASE_QUANTITY = rawData.BASE_QUANTITY || 0;
                    }

                    console.log("\n\n*************************************")
                    console.log("Final Mapped Data", rawData)
                    console.log("\n\n*************************************")

                    if (!isEdit) {
                        delete rawData.QUANTITY_PER_UNIT;
                        delete rawData.RETURN_ALOW;
                        delete rawData.REPLACEMENT_ALLOW;
                        const result = await runQuery(
                            `CALL sp_insertInventoryFull(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                            [
                                rawData.DATE_OF_ENTRY,
                                rawData.INVENTORY_CATEGORY_ID,
                                rawData.INVENTRY_SUB_CATEGORY_ID,
                                rawData.TAX_ID,
                                rawData.BRAND_ID,
                                rawData.INVENTORY_TRACKING_TYPE,
                                rawData.WARRANTY_ALLOWED,
                                rawData.GUARANTEE_ALLOWED,
                                rawData.EXPIRY_DATE_ALLOWED,
                                rawData.IS_NEW,
                                rawData.IS_REFURBISHED,
                                rawData.DISCOUNT_ALLOWED,
                                rawData.IS_HAVE_VARIANTS,
                                rawData.IS_SET,
                                rawData.INVENTORY_TYPE,
                                rawData.PARENT_ID,
                                rawData.WARRANTY_PERIOD,
                                rawData.GUARANTEE_PERIOD,
                                rawData.AVG_LEVEL,
                                rawData.REORDER_STOCK_LEVEL,
                                rawData.ALERT_STOCK_LEVEL,
                                rawData.EXPECTED_DELIVERY_IN_DAYS,
                                rawData.EXPECTED_DELIVERY_CHARGES,
                                rawData.BASE_PRICE,
                                rawData.ITEM_NAME,
                                rawData.SHORT_CODE,
                                rawData.BASE_UNIT_ID,
                                rawData.BASE_QUANTITY,
                                1, // CLIENT_ID
                                rawData.INVENTORY_CATEGORY_NAME,
                                rawData.STATUS,
                                rawData.SELLING_PRICE,
                                rawData.DESCRIPTION,
                                rawData.INVENTRY_SUB_CATEGORY_NAME,
                                rawData.BASE_UNIT_NAME,
                                rawData.HSN_ID,
                                rawData.HSN_NAME,
                                rawData.TAX_PREFERENCE,
                                rawData.BRAND_NAME,
                                rawData.BASE_QUANTITY,
                                rawData.DISCOUNTED_PRICE,
                                rawData.TAX_NAME
                            ],
                            supportKey, connection
                        );

                        const ITEM_ID = result[0][0].ITEM_ID;
                        await runQuery(`CALL sp_insertWarehouseStockForAll(?, ?)`, [ITEM_ID, 1], supportKey, connection);
                        let ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has added new inventory ${rawData.ITEM_NAME}.`;
                        let trackData = { /* ... same as original ... */ };
                        dbm.saveLog(trackData, InventoryTrack);
                        mm.commitConnection(connection);
                        successCount++;
                        successDetails.push({ rowNumber: rowNum, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                        continue;
                    }

                    if (!rawData.ID) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber: rowNum, row, reason: "ID is required for edit operations" });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "ID required for edit" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const existingRows = await runQuery(`CALL sp_getInventoryById(?)`, [rawData.ID], supportKey, connection);
                    const existing = existingRows[0]?.[0];
                    if (!existing) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber: rowNum, row, reason: `Inventory does not exist for ID ${rawData.ID}` });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Inventory does not exist for ID " + rawData.ID });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // Build update object: only fields that were provided (non-empty) in Excel
                    const updateFields = {};
                    for (const [dbField, newValue] of Object.entries(rawData)) {
                        if (providedFields.has(dbField) && newValue !== undefined) {
                            // Special handling for PARENT_ID: only update if explicitly provided
                            if (dbField === 'PARENT_ID' && !providedFields.has('PARENT_ID')) continue;
                            // For numeric fields that can be 0, we still update if provided (non-empty)
                            updateFields[dbField] = newValue;
                        }
                    }

                    // Remove fields that should never be updated directly
                    delete updateFields.DATE_OF_ENTRY;
                    delete updateFields.QUANTITY_PER_UNIT;
                    delete updateFields.RETURN_ALOW;
                    delete updateFields.REPLACEMENT_ALLOW;

                    if (Object.keys(updateFields).length === 0) {
                        skippedCount++;
                        skippedDetails.push({ rowNumber: rowNum, row, reason: "No data to update" });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "No data to update" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const mysql = require("mysql");
                    const setClause = Object.entries(updateFields)
                        .map(([k, v]) => `${k} = ${mysql.escape(v)}`)
                        .join(', ');
                    const finalQuery = `UPDATE inventory_master SET ${setClause}, CREATED_MODIFIED_DATE = ${mysql.escape(mm.getSystemDate())} WHERE ID = ${mysql.escape(rawData.ID)}`;
                    await runQuery(`CALL sp_executeDynamicQuery(?)`, [finalQuery], supportKey, connection);

                    let ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of inventory ${rawData.ITEM_NAME}.`;
                    let trackData = { /* ... same as original ... */ };
                    dbm.saveLog(trackData, InventoryTrack);
                    mm.commitConnection(connection);
                    successCount++;
                    successDetails.push({ rowNumber: rowNum, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    console.error(`Row ${index + 2} failed:`, error.message);
                    errorDetails.push({ rowNumber: index + 2, reason: error.message });
                    errorData.push({ rowNumber: index + 2, data: row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                    mm.rollbackConnection(connection);
                }
            }

            // Update progress in MongoDB
            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: progress === 100 ? "Processing" : "Processing"
            });
        }

        // Final response and file write
        let response = {
            code: 200,
            message: "Inventory import process completed.",
            totalRecords: jsonData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: errorDetails.length,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            totalData: totalData,
            errorData: errorData
        };

        console.log("Final Response", response);

        const fs = require("fs");
        const path = require("path");
        const fileName = `${EXCEL_MASTER_ID}.json`;
        const filePath = path.join(__dirname, "../../uploads/ExcelImporResponse/", fileName);
        await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
            STATUS: "Completed",
            PROGRESS: 100,
            TOTAL_RECORDS: jsonData.length,
            SUCCESSFUL_RECORDS: successCount,
            SKIPPED_RECORDS: skippedCount,
            FAILED_RECORDS: errorDetails.length,
            RESPONSE: fileName
        });
        fs.writeFileSync(filePath, JSON.stringify(response, null, 2), "utf8");

    } catch (error) {
        console.error("Import error:", error);
        return res.status(500).json({
            code: 500,
            message: "Something went wrong.",
            error: error.message
        });
    }
};

const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

const checkInventoryDuplicate = async (SHORT_CODE, ID, isEdit, supportKey, connection) => {
    const result = await runQuery(
        `CALL sp_checkInventoryDuplicate(?, ?, ?)`,
        [SHORT_CODE, ID || 0, isEdit ? 1 : 0],
        supportKey,
        connection
    );

    const rows = result[0]; // important (SP returns nested array)

    return rows.length > 0 ? "Short code already exists." : null;
};


exports.addOrUpdateInventory = (req, res) => {
    const data = req.body.DATA;
    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate()
    let isShortCodeExist = false
    let errorMsg = ''
    try {
        var Logarray = []
        var Logarray2 = []
        const seen = new Set();
        const duplicate = data.find(i => {
            console.log("i.SHORT_CODE", i.SHORT_CODE)
            if (seen.has(i.SHORT_CODE)) return true;
            seen.add(i.SHORT_CODE);
        });
        if (duplicate) {
            console.log(`Duplicate SHORT_CODE "${duplicate.SHORT_CODE}" found in item "${duplicate.ITEM_NAME}".`);
            return res.send({
                "code": 300,
                "message": `The entered short code for the inventory ${duplicate.VARIANT_COMBINATION} already exists.`,
            });
        }
        const connection = mm.openConnection();
        async.eachSeries(data, (inventoryItem, inner_callback) => {
            mm.executeDML('CALL sp_inventory_addOrUpdateInventory(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [
                    inventoryItem.ID || null,
                    inventoryItem.ITEM_NAME,
                    inventoryItem.INVENTORY_CATEGORY_ID,
                    inventoryItem.INVENTRY_SUB_CATEGORY_ID,
                    inventoryItem.DATE_OF_ENTRY,
                    inventoryItem.STATUS,
                    inventoryItem.SELLING_PRICE,
                    1,
                    inventoryItem.DESCRIPTION,
                    inventoryItem.INVENTORY_CATEGORY_NAME,
                    inventoryItem.INVENTRY_SUB_CATEGORY_NAME,
                    inventoryItem.BASE_UNIT_ID,
                    inventoryItem.BASE_UNIT_NAME,
                    inventoryItem.BASE_QUANTITY,
                    inventoryItem.PARENT_ID,
                    inventoryItem.SHORT_CODE,
                    inventoryItem.AVG_LEVEL,
                    inventoryItem.REORDER_STOCK_LEVEL,
                    inventoryItem.ALERT_STOCK_LEVEL,
                    inventoryItem.HSN_ID,
                    inventoryItem.HSN_NAME,
                    inventoryItem.TAX_PREFERENCE,
                    inventoryItem.TAX_ID,
                    inventoryItem.TAX_NAME,
                    inventoryItem.IS_HAVE_VARIANTS,
                    inventoryItem.IS_SET,
                    inventoryItem.VARIANT_COMBINATION,
                    inventoryItem.SKU_CODE,
                    inventoryItem.IS_NEW,
                    inventoryItem.INVENTORY_TRACKING_TYPE,
                    inventoryItem.WARRANTY_ALLOWED,
                    inventoryItem.GUARANTEE_ALLOWED,
                    inventoryItem.EXPIRY_DATE_ALLOWED,
                    inventoryItem.INVENTORY_TYPE,
                    inventoryItem.RETURN_ALOW,
                    inventoryItem.BRAND_ID,
                    inventoryItem.BRAND_NAME,
                    inventoryItem.WARRANTY_PERIOD,
                    inventoryItem.GUARANTEE_PERIOD,
                    inventoryItem.DISCOUNT_ALLOWED,
                    inventoryItem.DISCOUNTED_PRICE,
                    inventoryItem.RETURN_ALLOW_PERIOD,
                    inventoryItem.REPLACEMENT_ALLOW,
                    inventoryItem.REPLACEMENT_PERIOD,
                    inventoryItem.EXPECTED_DELIVERY_IN_DAYS,
                    inventoryItem.WEIGHT,
                    inventoryItem.LENGTH,
                    inventoryItem.BREADTH,
                    inventoryItem.HEIGHT,
                    inventoryItem.EXPECTED_DELIVERY_CHARGES,
                    inventoryItem.WARRANTY_CARD,
                    inventoryItem.BASE_PRICE,
                    inventoryItem.DISCOUNTED_PERCENTAGE,
                    inventoryItem.INVENTORY_DETAILS_IMAGE,
                    inventoryItem.IS_REFURBISHED,
                    inventoryItem.QUANTITY
                ], supportKey, connection, (error, existingRecord) => {
                    if (error) {
                        console.log("Error log ", error);
                        inner_callback(error);
                    } else {
                        const spResult = existingRecord[0][0];

                        if (spResult.RESULT === -1) {
                            console.log(`\n\n\n\n An inventory item with ${inventoryItem.VARIANT_COMBINATION} the same short code already exists.`);
                            isShortCodeExist = true
                            errorMsg = `The entered short code for the inventory ${inventoryItem.VARIANT_COMBINATION} already exists.`;
                            return inner_callback(null);
                        }
                        else {
                            if (spResult.MESSAGE == 'UPDATED') {
                                const ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} modified details of ${inventoryItem.ITEM_NAME} for variant ${inventoryItem.VARIANT_COMBINATION} on ${systemDate}.`;
                                trackData = {
                                    ITEM_ID: inventoryItem.ID,
                                    ITEM_NAME: inventoryItem.ITEM_NAME,
                                    ACTION_LOG: ACTION_LOG,
                                    AADED_BY: req.body.authData.data.UserData[0].NAME,
                                    WAREHOUSE_ID: inventoryItem.WAREHOUSE_ID,
                                    INVENTORY_CATEGORY_ID: inventoryItem.INVENTORY_CATEGORY_ID,
                                    INVENTRY_SUB_CATEGORY_ID: inventoryItem.INVENTRY_SUB_CATEGORY_ID,
                                    DATE_OF_ENTRY: systemDate,
                                    STATUS: inventoryItem.STATUS,
                                    SELLING_PRICE: inventoryItem.SELLING_PRICE,
                                    DESCRIPTION: inventoryItem.DESCRIPTION,
                                    INVENTORY_CATEGORY_NAME: inventoryItem.INVENTORY_CATEGORY_NAME,
                                    INVENTRY_SUB_CATEGORY_NAME: inventoryItem.INVENTRY_SUB_CATEGORY_NAME,
                                    BASE_UNIT_ID: inventoryItem.BASE_UNIT_ID,
                                    BASE_UNIT_NAME: inventoryItem.BASE_UNIT_NAME,
                                    BASE_QUANTITY: inventoryItem.BASE_QUANTITY,
                                    PARENT_ID: inventoryItem.PARENT_ID,
                                    SHORT_CODE: inventoryItem.SHORT_CODE,
                                    AVG_LEVEL: inventoryItem.AVG_LEVEL,
                                    REORDER_STOCK_LEVEL: inventoryItem.REORDER_STOCK_LEVEL,
                                    ALERT_STOCK_LEVEL: inventoryItem.ALERT_STOCK_LEVEL,
                                    HSN_ID: inventoryItem.HSN_ID,
                                    HSN_NAME: inventoryItem.HSN_NAME,
                                    TAX_PREFERENCE: inventoryItem.TAX_PREFERENCE,
                                    TAX_ID: inventoryItem.TAX_ID,
                                    TAX_NAME: inventoryItem.TAX_NAME,
                                    WAREHOUSE_NAME: inventoryItem.WAREHOUSE_NAME,
                                    IS_HAVE_VARIANTS: inventoryItem.IS_HAVE_VARIANTS,
                                    IS_SET: inventoryItem.IS_SET,
                                    SKU_CODE: inventoryItem.SKU_CODE,
                                    IS_NEW: inventoryItem.IS_NEW,
                                    VARIANT_COMBINATION: inventoryItem.VARIANT_COMBINATION,
                                    INVENTORY_TRACKING_TYPE: inventoryItem.INVENTORY_TRACKING_TYPE,
                                    WARRANTY_ALLOWED: inventoryItem.WARRANTY_ALLOWED,
                                    GUARANTEE_ALLOWED: inventoryItem.GUARANTEE_ALLOWED,
                                    EXPIRY_DATE_ALLOWED: inventoryItem.EXPIRY_DATE_ALLOWED,
                                    INVENTORY_TYPE: inventoryItem.INVENTORY_TYPE,
                                    RETURN_ALOW: inventoryItem.RETURN_ALOW,
                                    BRAND_ID: inventoryItem.BRAND_ID,
                                    BRAND_NAME: inventoryItem.BRAND_NAME,
                                    WARRANTY_PERIOD: inventoryItem.WARRANTY_PERIOD,
                                    GUARANTEE_PERIOD: inventoryItem.GUARANTEE_PERIOD,
                                    DISCOUNT_ALLOWED: inventoryItem.DISCOUNT_ALLOWED,
                                    DISCOUNTED_PRICE: inventoryItem.DISCOUNTED_PRICE,
                                    RETURN_ALLOW_PERIOD: inventoryItem.RETURN_ALLOW_PERIOD,
                                    REPLACEMENT_ALLOW: inventoryItem.REPLACEMENT_ALLOW,
                                    REPLACEMENT_PERIOD: inventoryItem.REPLACEMENT_PERIOD,
                                    EXPECTED_DELIVERY_IN_DAYS: inventoryItem.EXPECTED_DELIVERY_IN_DAYS,
                                    WARRANTY_CARD: inventoryItem.WARRANTY_CARD,
                                    RATING: inventoryItem.RATING,
                                    BASE_PRICE: inventoryItem.BASE_PRICE,
                                    DISCOUNTED_PERCENTAGE: inventoryItem.DISCOUNTED_PERCENTAGE,
                                    WEIGHT: inventoryItem.WEIGHT,
                                    LENGTH: inventoryItem.LENGTH,
                                    BREADTH: inventoryItem.BREADTH,
                                    HEIGHT: inventoryItem.HEIGHT,
                                    EXPECTED_DELIVERY_CHARGES: inventoryItem.EXPECTED_DELIVERY_CHARGES,
                                    IS_REFURBISHED: inventoryItem.IS_REFURBISHED
                                }
                                Logarray.push(trackData)
                                const logData2 = {
                                    ACTION_TYPE: "Create",
                                    ACTION_DETAILS: ACTION_LOG,
                                    ACTION_DATE: new Date(),
                                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                    USER_NAME: req.body.authData.data.UserData[0].NAME,
                                    INVENTORY_ID: inventoryItem.ID,
                                    INVENTORY_NAME: inventoryItem.ITEM_NAME,
                                    WAREHOUSE_ID: 0,
                                    WAREHOUSE_NAME: "",
                                    VARIANT_ID: inventoryItem.ID,
                                    VARIANT_NAME: inventoryItem.VARIANT_COMBINATION || "",
                                    QUANTITY: inventoryItem.QUANTITY,
                                    TOTAL_INWARD: 0,
                                    CURRENT_STOCK: 0,
                                    OLD_STOCK: 0 || 0,
                                    QUANTITY_PER_UNIT: inventoryItem.BASE_QUANTITY,
                                    UNIT_ID: inventoryItem.BASE_UNIT_ID,
                                    UNIT_NAME: inventoryItem.BASE_UNIT_NAME,
                                    REASON: "Inventory Inwarded",
                                    SOURCE_WAREHOUSE_ID: null,
                                    SOURCE_WAREHOUSE_NAME: "",
                                    DESTINATION_WAREHOUSE_ID: 0,
                                    DESTINATION_WAREHOUSE_NAME: "",
                                    REFERENCE_NO: inventoryItem.PO_NUMBER || "",
                                    STATUS: "COMPLETED",
                                    REMARK: inventoryItem.REMARK || ""
                                };
                                Logarray2.push(logData2);
                                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Inventory updated", `Hello Admin, Inventory item ${inventoryItem.ITEM_NAME} has been updated on ${systemDate}. Please review the changes and take necessary actions. `, "", "I", supportKey, "I", []);
                                inner_callback(null);
                            }
                            else {
                                const ACTION_LOG = `${req.body.authData.data.UserData[0].NAME} has created new variant ${inventoryItem.VARIANT_COMBINATION} for item  ${inventoryItem.ITEM_NAME}.`;
                                trackData = {
                                    ITEM_ID: spResult.RESULT,
                                    ITEM_NAME: inventoryItem.ITEM_NAME,
                                    ACTION_LOG: ACTION_LOG,
                                    WAREHOUSE_ID: inventoryItem.WAREHOUSE_ID,
                                    INVENTORY_CATEGORY_ID: inventoryItem.INVENTORY_CATEGORY_ID,
                                    INVENTRY_SUB_CATEGORY_ID: inventoryItem.INVENTRY_SUB_CATEGORY_ID,
                                    DATE_OF_ENTRY: systemDate,
                                    STATUS: inventoryItem.STATUS,
                                    SELLING_PRICE: inventoryItem.SELLING_PRICE,
                                    DESCRIPTION: inventoryItem.DESCRIPTION,
                                    INVENTORY_CATEGORY_NAME: inventoryItem.INVENTORY_CATEGORY_NAME,
                                    INVENTRY_SUB_CATEGORY_NAME: inventoryItem.INVENTRY_SUB_CATEGORY_NAME,
                                    BASE_UNIT_ID: inventoryItem.BASE_UNIT_ID,
                                    BASE_UNIT_NAME: inventoryItem.BASE_UNIT_NAME,
                                    BASE_QUANTITY: inventoryItem.BASE_QUANTITY,
                                    PARENT_ID: inventoryItem.PARENT_ID,
                                    SHORT_CODE: inventoryItem.SHORT_CODE,
                                    AVG_LEVEL: inventoryItem.AVG_LEVEL,
                                    REORDER_STOCK_LEVEL: inventoryItem.REORDER_STOCK_LEVEL,
                                    ALERT_STOCK_LEVEL: inventoryItem.ALERT_STOCK_LEVEL,
                                    HSN_ID: inventoryItem.HSN_ID,
                                    HSN_NAME: inventoryItem.HSN_NAME,
                                    TAX_PREFERENCE: inventoryItem.TAX_PREFERENCE,
                                    TAX_ID: inventoryItem.TAX_ID,
                                    TAX_NAME: inventoryItem.TAX_NAME,
                                    WAREHOUSE_NAME: inventoryItem.WAREHOUSE_NAME,
                                    IS_HAVE_VARIANTS: inventoryItem.IS_HAVE_VARIANTS,
                                    IS_SET: inventoryItem.IS_SET,
                                    SKU_CODE: inventoryItem.SKU_CODE,
                                    IS_NEW: inventoryItem.IS_NEW,
                                    VARIANT_COMBINATION: inventoryItem.VARIANT_COMBINATION,
                                    INVENTORY_TRACKING_TYPE: inventoryItem.INVENTORY_TRACKING_TYPE,
                                    WARRANTY_ALLOWED: inventoryItem.WARRANTY_ALLOWED,
                                    GUARANTEE_ALLOWED: inventoryItem.GUARANTEE_ALLOWED,
                                    EXPIRY_DATE_ALLOWED: inventoryItem.EXPIRY_DATE_ALLOWED,
                                    INVENTORY_TYPE: inventoryItem.INVENTORY_TYPE,
                                    RETURN_ALOW: inventoryItem.RETURN_ALOW,
                                    BRAND_ID: inventoryItem.BRAND_ID,
                                    BRAND_NAME: inventoryItem.BRAND_NAME,
                                    WARRANTY_PERIOD: inventoryItem.WARRANTY_PERIOD,
                                    GUARANTEE_PERIOD: inventoryItem.GUARANTEE_PERIOD,
                                    DISCOUNT_ALLOWED: inventoryItem.DISCOUNT_ALLOWED,
                                    DISCOUNTED_PRICE: inventoryItem.DISCOUNTED_PRICE,
                                    RETURN_ALLOW_PERIOD: inventoryItem.RETURN_ALLOW_PERIOD,
                                    REPLACEMENT_ALLOW: inventoryItem.REPLACEMENT_ALLOW,
                                    REPLACEMENT_PERIOD: inventoryItem.REPLACEMENT_PERIOD,
                                    EXPECTED_DELIVERY_IN_DAYS: inventoryItem.EXPECTED_DELIVERY_IN_DAYS,
                                    WARRANTY_CARD: inventoryItem.WARRANTY_CARD,
                                    RATING: inventoryItem.RATING,
                                    BASE_PRICE: inventoryItem.BASE_PRICE,
                                    DISCOUNTED_PERCENTAGE: inventoryItem.DISCOUNTED_PERCENTAGE,
                                    WEIGHT: inventoryItem.WEIGHT,
                                    LENGTH: inventoryItem.LENGTH,
                                    BREADTH: inventoryItem.BREADTH,
                                    HEIGHT: inventoryItem.HEIGHT,
                                    EXPECTED_DELIVERY_CHARGES: inventoryItem.EXPECTED_DELIVERY_CHARGES,
                                    IS_REFURBISHED: inventoryItem.IS_REFURBISHED
                                }
                                Logarray.push(trackData)
                                const logData2 = {
                                    ACTION_TYPE: "Create",
                                    ACTION_DETAILS: ACTION_LOG,
                                    ACTION_DATE: new Date(),
                                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                    USER_NAME: req.body.authData.data.UserData[0].NAME,
                                    INVENTORY_ID: spResult.RESULT,
                                    INVENTORY_NAME: inventoryItem.ITEM_NAME,
                                    WAREHOUSE_ID: 0,
                                    WAREHOUSE_NAME: "",
                                    VARIANT_ID: spResult.RESULT,
                                    VARIANT_NAME: inventoryItem.VARIANT_COMBINATION || "",
                                    QUANTITY: inventoryItem.QUANTITY,
                                    TOTAL_INWARD: 0,
                                    CURRENT_STOCK: 0,
                                    OLD_STOCK: 0 || 0,
                                    QUANTITY_PER_UNIT: inventoryItem.BASE_QUANTITY,
                                    UNIT_ID: inventoryItem.BASE_UNIT_ID,
                                    UNIT_NAME: inventoryItem.BASE_UNIT_NAME,
                                    REASON: "Inventory Inwarded",
                                    SOURCE_WAREHOUSE_ID: null,
                                    SOURCE_WAREHOUSE_NAME: "",
                                    DESTINATION_WAREHOUSE_ID: 0,
                                    DESTINATION_WAREHOUSE_NAME: "",
                                    REFERENCE_NO: inventoryItem.PO_NUMBER || "",
                                    STATUS: "COMPLETED",
                                    REMARK: inventoryItem.REMARK || ""
                                };
                                Logarray2.push(logData2);
                                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "New Inventory Added", `Hello Admin, New inventory item ${inventoryItem.ITEM_NAME} was added to the system on ${systemDate}. Please review and update records if needed.`,"", "I", supportKey, "I", []);
                                inner_callback(null);
                            }
                        }
                    }
                });

        }, (error) => {
            if (error) {
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to process inventory data."
                });
            } else {
                if (isShortCodeExist) {
                    console.log("error", errorMsg);
                    res.status(200).json({
                        "code": 300,
                        "message": errorMsg
                    });
                } else {
                    console.log("errorbbbb", errorMsg);
                    dbm.saveLog(Logarray2, inwardLogSchema);
                    dbm.saveLog(Logarray, InventoryTrack)
                    mm.commitConnection(connection);
                    res.status(200).json({
                        "code": 200,
                        "message": "Inventory data processed successfully."
                    });
                }
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log("error", error);

        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.createInventory = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate()
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            const connection = mm.openConnection();
            mm.executeDML('CALL sp_inventory_createInventory(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [
                    data.ITEM_NAME,
                    data.INVENTORY_CATEGORY_ID,
                    data.INVENTRY_SUB_CATEGORY_ID,
                    systemDate,
                    data.STATUS,
                    data.SELLING_PRICE,
                    1,
                    data.DESCRIPTION,
                    data.INVENTORY_CATEGORY_NAME,
                    data.INVENTRY_SUB_CATEGORY_NAME,
                    data.BASE_UNIT_ID,
                    data.BASE_UNIT_NAME,
                    data.BASE_QUANTITY,
                    data.PARENT_ID,
                    data.SHORT_CODE,
                    data.AVG_LEVEL,
                    data.REORDER_STOCK_LEVEL,
                    data.ALERT_STOCK_LEVEL,
                    data.HSN_ID,
                    data.HSN_NAME,
                    data.TAX_PREFERENCE,
                    data.TAX_ID,
                    data.TAX_NAME,
                    data.WAREHOUSE_NAME,
                    data.IS_HAVE_VARIANTS,
                    data.IS_SET,
                    data.VARIANT_COMBINATION,
                    data.SKU_CODE,
                    data.IS_NEW,
                    data.INVENTORY_TRACKING_TYPE,
                    data.WARRANTY_ALLOWED,
                    data.GUARANTEE_ALLOWED,
                    data.EXPIRY_DATE_ALLOWED,
                    data.INVENTORY_TYPE,
                    data.RETURN_ALOW,
                    data.BRAND_ID,
                    data.BRAND_NAME,
                    data.WARRANTY_PERIOD,
                    data.GUARANTEE_PERIOD,
                    data.DISCOUNT_ALLOWED,
                    data.DISCOUNTED_PRICE,
                    data.RETURN_ALLOW_PERIOD,
                    data.REPLACEMENT_ALLOW,
                    data.REPLACEMENT_PERIOD,
                    data.EXPECTED_DELIVERY_IN_DAYS,
                    data.WEIGHT,
                    data.LENGTH,
                    data.BREADTH,
                    data.HEIGHT,
                    data.EXPECTED_DELIVERY_CHARGES,
                    data.WARRANTY_CARD,
                    data.BASE_PRICE,
                    data.DISCOUNTED_PERCENTAGE,
                    data.IS_REFURBISHED,
                    data.QUANTITY,
                    data.INVENTORY_DETAILS_IMAGE
                ], supportKey, connection, (error, resultsCheck) => {
                    if (error) {
                        console.log(error);
                        mm.rollbackConnection(connection);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save service information..."
                        });
                    }
                    else {
                        var result = resultsCheck[0][0]
                        console.log("result")
                        if (result.ID === -1) {
                            mm.rollbackConnection(connection);
                            return res.send({
                                "code": 300,
                                "message": "An item with the same short code already exists."
                            });
                        }
                        else {
                            let ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has added new inventory ${req.body.ITEM_NAME} on ${mm.getSystemDate()}.`;
                            trackData = {
                                ITEM_ID: result.ID,
                                ITEM_NAME: req.body.ITEM_NAME,
                                ACTION_LOG: ACTION_LOG,
                                WAREHOUSE_ID: req.body.WAREHOUSE_ID,
                                INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
                                INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
                                DATE_OF_ENTRY: mm.getSystemDate(),
                                STATUS: req.body.STATUS,
                                SELLING_PRICE: req.body.SELLING_PRICE,
                                DESCRIPTION: req.body.DESCRIPTION,
                                INVENTORY_CATEGORY_NAME: req.body.INVENTORY_CATEGORY_NAME,
                                INVENTRY_SUB_CATEGORY_NAME: req.body.INVENTRY_SUB_CATEGORY_NAME,
                                BASE_UNIT_ID: req.body.BASE_UNIT_ID,
                                BASE_UNIT_NAME: req.body.BASE_UNIT_NAME,
                                BASE_QUANTITY: req.body.BASE_QUANTITY,
                                PARENT_ID: req.body.PARENT_ID,
                                SHORT_CODE: req.body.SHORT_CODE,
                                AVG_LEVEL: req.body.AVG_LEVEL,
                                REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
                                ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL,
                                HSN_ID: req.body.HSN_ID,
                                HSN_NAME: req.body.HSN_NAME,
                                TAX_PREFERENCE: req.body.TAX_PREFERENCE,
                                TAX_ID: req.body.TAX_ID,
                                TAX_NAME: req.body.TAX_NAME,
                                WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
                                IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS,
                                IS_SET: req.body.IS_SET,
                                SKU_CODE: req.body.SKU_CODE,
                                IS_NEW: req.body.IS_NEW,
                                VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
                                INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
                                WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
                                GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
                                EXPIRY_DATE_ALLOWED: req.body.EXPIRY_DATE_ALLOWED,
                                INVENTORY_TYPE: req.body.INVENTORY_TYPE,
                                RETURN_ALOW: req.body.RETURN_ALOW,
                                BRAND_ID: req.body.BRAND_ID,
                                BRAND_NAME: req.body.BRAND_NAME,
                                WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
                                GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
                                DISCOUNT_ALLOWED: req.body.DISCOUNT_ALLOWED,
                                DISCOUNTED_PRICE: req.body.DISCOUNTED_PRICE,
                                RETURN_ALLOW_PERIOD: req.body.RETURN_ALLOW_PERIOD,
                                REPLACEMENT_ALLOW: req.body.REPLACEMENT_ALLOW,
                                REPLACEMENT_PERIOD: req.body.REPLACEMENT_PERIOD,
                                EXPECTED_DELIVERY_IN_DAYS: req.body.EXPECTED_DELIVERY_IN_DAYS,
                                WARRANTY_CARD: req.body.WARRANTY_CARD,
                                RATING: req.body.RATING,
                                BASE_PRICE: req.body.BASE_PRICE,
                                DISCOUNTED_PERCENTAGE: req.body.DISCOUNTED_PERCENTAGE,
                                WEIGHT: req.body.WEIGHT,
                                LENGTH: req.body.LENGTH,
                                BREADTH: req.body.BREADTH,
                                HEIGHT: req.body.HEIGHT,
                                EXCPTED_DELIVERY_CHARGES: req.body.EXPECTED_DELIVERY_CHARGES,
                                IS_REFURBISHED: req.body.IS_REFURBISHED
                            }
                            dbm.saveLog(trackData, InventoryTrack)
                            const logData = {
                                ACTION_TYPE: "Create",
                                ACTION_DETAILS: ACTION_LOG,
                                ACTION_DATE: new Date(),
                                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                USER_NAME: req.body.authData.data.UserData[0].NAME,
                                INVENTORY_ID: result.ID,
                                INVENTORY_NAME: req.body.ITEM_NAME,
                                WAREHOUSE_ID: 0,
                                WAREHOUSE_NAME: "",
                                VARIANT_ID: 0,
                                VARIANT_NAME: req.body.VARIANT_NAME || "",
                                QUANTITY: req.body.QUANTITY,
                                TOTAL_INWARD: 0,
                                CURRENT_STOCK: 0,
                                OLD_STOCK: 0 || 0,
                                QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
                                UNIT_ID: req.body.BASE_UNIT_ID,
                                UNIT_NAME: req.body.BASE_UNIT_NAME,
                                REASON: "Inventory Inwarded",
                                SOURCE_WAREHOUSE_ID: null,
                                SOURCE_WAREHOUSE_NAME: "",
                                DESTINATION_WAREHOUSE_ID: 0,
                                DESTINATION_WAREHOUSE_NAME: "",
                                REFERENCE_NO: req.body.PO_NUMBER || "",
                                STATUS: "COMPLETED",
                                REMARK: req.body.REMARK || ""
                            };
                            dbm.saveLog(logData, inwardLogSchema);
                            mm.commitConnection(connection);
                            mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "New Inventory Added", `Hello Admin, New inventory item ${data.ITEM_NAME} was added to the system on ${mm.getSystemDate()}. Please review and update records if needed.`,"", "I", supportKey, "I", []);
                            res.status(200).json({
                                'ID': result.ID,
                                "code": 200,
                                "message": "Inventory information saved successfully...",
                            });
                        }
                    }
                });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(500).json({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}

exports.updateStockforOrder = (req, res) => {
    let INVENTORY_DETAILS = req.body.INVENTORY_DETAILS;
    let WAREHOUSE_ID = req.body.WAREHOUSE_ID;
    let WAREHOUSE_NAME = req.body.WAREHOUSE_NAME;
    let ORDER_ID = req.body.ORDER_ID;
    let ORDER_NUMBER = req.body.ORDER_NUMBER;
    var IS_NO_STOCK;
    var itemName;
    var transactionData = [];
    let supportKey = "supportKey";

    try {

        if (INVENTORY_DETAILS && WAREHOUSE_ID && WAREHOUSE_NAME && ORDER_ID && ORDER_NUMBER) {
            const connection = mm.openConnection()
            async.eachSeries(INVENTORY_DETAILS, function processTechnician(item, inner_callback) {
                const QUANTITY = item.INVENTORY_TRACKING_TYPE === 'N' ? 1 : item.QUANTITY;
                const INOUT_QTY = item.INVENTORY_TRACKING_TYPE === 'N' ? item.QUANTITY : 1;
                const setContext = `
                    SET @v_INVENTORY_TRACKING_TYPE = '${item.INVENTORY_TRACKING_TYPE}';
                    SET @v_WAREHOUSE_ID = ${WAREHOUSE_ID || 0};
                    SET @v_ITEM_ID = '${item.ITEM_ID}';
                    SET @v_UNIT_ID = '${item.UNIT_ID}';
                    SET @v_QUANTITY_PER_UNIT = '${item.QUANTITY_PER_UNIT}';
                    SET @v_QUANTITY = '${QUANTITY}';
                `;

                mm.executeDML(setContext + 'CALL sp_inventory_updateStockforOrder()', [item.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, item.ITEM_ID, item.UNIT_ID, item.QUANTITY_PER_UNIT], supportKey, connection, (error, InventoryData) => {
                    if (error) {
                        console.log(`Error log`, error);
                        return inner_callback(error);
                    } else {
                        if (!InventoryData || InventoryData.length === 0) {
                            error = "error"
                            IS_NO_STOCK = true;
                            itemName = item.ITEM_NAME;
                            return inner_callback(error);
                        } else {
                            let ACTION_LOG = "Updated stock for order " + ORDER_NUMBER + " by the system.";
                            InventoryData.forEach((inventory) => {
                                transactionData.push([
                                    ORDER_NUMBER, mm.getSystemDate(), "D", inventory.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID,
                                    0, 0, 0, 0, 0, "O",
                                    (inventory.INVENTORY_TRACKING_TYPE == 'B' ? inventory.UNIQUE_NO : ""),
                                    (inventory.INVENTORY_TRACKING_TYPE == 'S' ? inventory.UNIQUE_NO : ""),
                                    inventory.ITEM_ID, 0, INOUT_QTY,
                                    ACTION_LOG, 1, inventory.ACTUAL_UNIT_ID, inventory.ACTUAL_UNIT_NAME,
                                    inventory.IS_VERIENT, inventory.PARENT_ID, inventory.QUANTITY_PER_UNIT
                                ]);

                                transactionData.push([
                                    ORDER_NUMBER, mm.getSystemDate(), "C", inventory.INVENTORY_TRACKING_TYPE, 0,
                                    0, 0, 0, 0, ORDER_ID, "O",
                                    (inventory.INVENTORY_TRACKING_TYPE == 'B' ? inventory.UNIQUE_NO : ""),
                                    (inventory.INVENTORY_TRACKING_TYPE == 'S' ? inventory.UNIQUE_NO : ""),
                                    inventory.ITEM_ID, INOUT_QTY, 0,
                                    ACTION_LOG, 1, inventory.ACTUAL_UNIT_ID, inventory.ACTUAL_UNIT_NAME,
                                    inventory.IS_VERIENT, inventory.PARENT_ID, inventory.QUANTITY_PER_UNIT
                                ]);
                            });
                            return inner_callback(null);
                        }
                    }
                });
            }, function finalCallback(error) {
                if (error) {
                    mm.rollbackConnection(connection);
                    if (IS_NO_STOCK == true) {
                        res.send({
                            "code": 300,
                            "message": `There is no stock available for item ${itemName} in ${WAREHOUSE_NAME}.`
                        });
                    } else {
                        res.send({
                            "code": 400,
                            "message": "Failed to update work order Status."
                        });
                    }
                } else {
                    mm.commitConnection(connection);
                    res.send({
                        "code": 200,
                        "message": "Stock updated successfully.",
                        INVENTORY_DETAILS: transactionData
                    });
                }
            });
        } else {
            res.send({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};
