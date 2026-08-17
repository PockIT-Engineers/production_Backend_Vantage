const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const fs = require('fs');
const path = require('path');
const applicationkey = process.env.APPLICATION_KEY;
var inventoryImageMapping = "inventory_image_mapping";
var viewInventoryImageMapping = "view_" + inventoryImageMapping;

function reqData(req) {
    var data = {
        INVENTORY_ID: req.body.INVENTORY_ID,
        UPLOADED_DATE_TIME: req.body.UPLOADED_DATE_TIME,
        IMAGE_URL: req.body.IMAGE_URL,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('INVENTORY_ID').isInt().exists(),
        body('IMAGE_URL').optional(),
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
            setContext + 'CALL sp_inventoryImageMapping_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventory Image Mapping data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 161,
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

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({
            "code": 422,
             "message": errors.errors
        });
    }

    const params = [
        data.INVENTORY_ID,
        data.UPLOADED_DATE_TIME,
        data.IMAGE_URL,
        data.STATUS,
        data.CLIENT_ID
    ];

    try {
        mm.executeQueryData(
            'CALL sp_inventoryImageMapping_create (?,?,?,?,?)',
            params,
            supportKey,
            (error) => {
                if (error) {
                    console.log("error",error)
                    return res.status(400).send({
                        "code":400,
                         "message": "Failed to save inventoryImageMapping information..."
                    });
                }
                res.status(200).send({
                    "code":200,
                     "message": "inventoryImageMapping information saved successfully..."
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

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({
            "code": 422,
             "message": errors.errors
        });
    }

    try {
        const params = [
            req.body.ID,
            data.INVENTORY_ID || null,
            data.UPLOADED_DATE_TIME || null,
            data.IMAGE_URL || null,
            data.STATUS ?? null,
            data.CLIENT_ID || null
        ];

        mm.executeQueryData(
            'CALL sp_inventoryImageMapping_update (?,?,?,?,?,?)',
            params,
            supportKey,
            (error) => {
                if (error) {
                    console.log("error",error)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).send({
                        "code":400,
                         "message": "Failed to update inventoryImageMapping information."
                    });
                }
                res.status(200).send({
                    "code":200,
                     "message": "inventoryImageMapping information updated successfully..."
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

exports.mapImagesToInventory = (req, res) => {
    try {
        var data = req.body.DATA ? req.body.DATA : [];
        var INVENTORY_ID = req.params.inventoryId;
        var supportKey = req.headers['supportkey'];
        var CLIENT_ID = 1; // or from token

        if ((!INVENTORY_ID || INVENTORY_ID == " ") || data.length <= 0) {
            return res.status(400).send({
                 "message": "INVENTORY_ID or data parameter missing"
            });
        }

        const params = [
            INVENTORY_ID,
            JSON.stringify(data),
            CLIENT_ID
        ];

        mm.executeQueryData(
            'CALL sp_inventoryImageMapping_mapImages (?,?,?)',
            params,
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.status(400).send({
                        "code": 400,
                         "message": "Failed to map Images to item."
                    });
                }
                res.status(200).send({
                    "code": 200,
                     "message": "Images mapped successfully to the item."
                });
            }
        );

    } catch (error) {
        console.log(error);
        res.status(500).send({
             "message": "Something went wrong."
        });
    }
};


exports.deleteInventoryImage = (req, res) => {
    try {
        const IMAGE_URL = req.body.IMAGE_URL;
        const INVENTORY_ID = req.params.inventoryId;
        const ID = req.params.id;
        const supportKey = req.headers['supportkey'];

        if (!IMAGE_URL || !INVENTORY_ID || !ID) {
            return res.status(400).send({
                 "message": "IMAGE_URL, INVENTORY_ID, or ID is missing"
            });
        }

        // 🔹 File deletion remains in API
        const filePath = path.join(
            __dirname,
            'uploads/InventoryImages/',
            path.basename(IMAGE_URL)
        );

        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (error) => {
                if (error) {
                    console.error("File deletion error:", error);
                }
            });
        }

        const params = [
            ID,
            INVENTORY_ID,
            IMAGE_URL
        ];

        mm.executeQueryData(
            'CALL sp_inventoryImageMapping_delete (?,?,?)',
            params,
            supportKey,
            (error) => {
                if (error) {
                    console.error(error);
                    return res.status(400).send({
                        "code": 400,
                         "message": "Failed to delete image record from database."
                    });
                }

                return res.status(200).send({
                    "code": 200,
                     "message": "Image file (if existed) and database record deleted successfully."
                });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).send({
             "message": "Internal server error"
        });
    }
};


