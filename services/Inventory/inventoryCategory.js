const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
var xlsx = require('xlsx')
const excelMaster = require("../../modules/excelImportMaster");

const applicationkey = process.env.APPLICATION_KEY;

var inventoryCategoryMaster = "inventory_category_master";
var viewInventoryCategoryMaster = "view_" + inventoryCategoryMaster;

function reqData(req) {
    var data = {
        CATEGORY_NAME: req.body.CATEGORY_NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        PARENT_ID: req.body.PARENT_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        SEQ_NO: req.body.SEQ_NO,
        ICON: req.body.ICON
    }
    return data;
}

exports.validate = function () {
    return [
        body('CATEGORY_NAME', ' parameter missing').exists(),
        body('DESCRIPTION').optional(),
        body('PARENT_ID').isInt(), body('ID').optional(),
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
            setContext + 'CALL sp_inventoryCategoryMaster_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Category data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 30,
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

    const params = [
        data.CATEGORY_NAME,
        data.DESCRIPTION,
        data.PARENT_ID,
        data.IS_ACTIVE,
        data.CLIENT_ID,
        data.SEQ_NO,
        data.ICON
    ];

    try {
        mm.executeQueryData(
            'CALL sp_inventoryCategory_create (?,?,?,?,?,?,?)',
            params,
            supportKey,
            (error, result) => {
                console.log("result", result[0][0].code == 300)
                if (error) {
                    return res.send({
                        "code": 400,
                        "message": "Failed to save inventoryCategory information..."
                    });
                }
                if (result[0][0].code == 300) {
                    return res.send({
                        "code": 300,
                        "message": "InventoryCategory name already exist..."
                    });
                    ;
                }
                res.send({
                    "code": 200,
                    "message": "InventoryCategory information saved successfully..."
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

    const params = [
        req.body.ID,
        data.CATEGORY_NAME,
        data.DESCRIPTION ?? null,
        data.PARENT_ID,
        data.IS_ACTIVE,
        data.CLIENT_ID,
        data.SEQ_NO,
        data.ICON
    ];

    try {
        mm.executeQueryData(
            'CALL sp_inventoryCategory_update (?,?,?,?,?,?,?,?)',
            params,
            supportKey,
            (error,result) => {
                if (error) {
                    console.log("error", error)
                    return res.send({
                        "code": 400,
                        "message": "Failed to update inventoryCategory information."
                    });
                }

                if (result[0][0].code == 300) {
                    return res.send({
                        "code": 300,
                        "message": "InventoryCategory name already exist..."
                    });
                    ;
                }

                res.send({
                    "code": 200,
                    "message": "InventoryCategory information updated successfully..."
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


exports.getcatogoryHirechy = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var deviceid = req.headers['deviceid'];

        mm.executeQuery(`CALL sp_inventoryCategoryMaster_getcatogoryHirechy()`, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                res.send({
                    "code": 400,
                    "message": "Failed to get Data",
                });
            } else {
                var results = results[0]
                const cleanedResults = results.map(category => {
                    if (category.categories) {
                        category.categories = category.categories.filter(categoryItem => {
                            if (categoryItem.children) {

                                return categoryItem.children.length > 0;
                            }
                            return false;
                        });
                    }
                    return category;
                });

                res.send({
                    "code": 200,
                    "message": "Success",
                    "TAB_ID": 30,
                    data: cleanedResults,
                });
            }
        });

    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            "code": 500,
            "message": "sever Error",
        });
    }
}

exports.getCategoryForTechnician = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_TECHNICIAN_ID = ${TECHNICIAN_ID || 0};
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
            setContext + 'CALL sp_inventoryCategoryMaster_getCategoryForTechnician()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventory Category data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 30,
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

exports.importInventoryCategory = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const COLUMN_JSON = req.body.COLUMN_JSON;
    const EXCEL_FILE_NAME = req.body.EXCEL_FILE_NAME;
    const EXCEL_MASTER_ID = req.body.id;
    const IMPORT_TYPE = req.body.IMPORT_TYPE;
    var systemDate = mm.getSystemDate();
    if (!EXCEL_FILE_NAME) {
        return res.status(400).json({ code: 400, message: "Missing parameter: EXCEL_FILE_NAME." });
    }

    try {
        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const sheetName = workbook.SheetNames[1];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
            return res.status(200).json({ code: 200, message: "No data found in the Excel file." });
        }
        res.status(200).json({
            code: 200,
            message: "Import started. Processing in background...",
            EXCEL_MASTER_ID: EXCEL_MASTER_ID
        });


        let successCount = 0;
        let skippedCount = 0;
        let successDetails = [];
        let errorDetails = [];
        let errorData = [];
        let skippedDetails = [];
        let totalData = [];
        const chunkSize = 5;
        let total = jsonData.length;

        for (let start = 0; start < total; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (let [index, row] of chunk.entries()) {
                const connection = mm.openConnection()
                try {
                    let data = {};
                    COLUMN_JSON.forEach(col => {
                        data[col.TABLE_FIELD] = row[col.EXCEL_FIELD] !== undefined ? row[col.EXCEL_FIELD] : null;
                    });

                    if (IMPORT_TYPE == 'E') {
                        data.IS_ACTIVE = data.IS_ACTIVE == "Active" ? 1 : 0;
                    } else {
                        data.IS_ACTIVE = 1
                    }
                    data.CLIENT_ID = 1
                        ;
                    var selectQuery = ''
                    var selectData = []

                    var UpsertQuery = ''
                    var UpsertData = []
                    console.log("data", data)
                    if (IMPORT_TYPE == 'E') {
                        if (!data.ID) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: "Missing Inventory category ID",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing Inventory category ID" });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }
                        else {
                            const getDatasp = await new Promise((resolve, reject) => {
                                mm.executeDML(
                                    `CALL Sp_GetIncCatById(?)`,
                                    [data.ID],
                                    supportKey,
                                    connection,
                                    (error, results) => {
                                        if (error) reject(error)
                                        else resolve(results);
                                    }
                                );
                            });
                            var getData = getDatasp[0] || [];

                            if (!getData.length) {
                                skippedDetails.push({
                                    rowNumber: index + 2,
                                    row,
                                    reason: `inventory category does not exist for ID ${data.ID}`,
                                });
                                totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "inventory category does not exist for ID " + data.ID + " " });
                                skippedCount++;
                                continue;
                            }
                            selectQuery = `CALL Sp_GetIncCatByName(?,?,?)`
                            selectData.push(data.CATEGORY_NAME, data.ID, IMPORT_TYPE)
                            const mysql = require("mysql");

                            var setData = "";

                            Object.keys(data).forEach(key => {
                                if (key !== "ID" && data[key] !== undefined) {
                                    setData += `${key} = ${mysql.escape(data[key])}, `;
                                }
                            });

                            setData = setData.slice(0, -2);

                            let finalQuery = `UPDATE inventory_category_master SET ${setData}, CREATED_MODIFIED_DATE = ${mysql.escape(systemDate)} WHERE ID = ${mysql.escape(data.ID)}`;

                            UpsertQuery = `CALL sp_executeDynamicQuery(?)`
                            UpsertData = [finalQuery]
                        }
                    }
                    else {
                        if (!data.SEQ_NO) {
                            // AUTO GENERATE SEQ_NO
                            let seqResp = await new Promise((resolve, reject) => {
                                mm.executeQueryData(
                                    `CALL Sp_GetIncCatMaxSeqNo()`,
                                    [],
                                    supportKey,
                                    (error, results) => {
                                        if (error) {
                                            reject(error)
                                        }
                                        else resolve(results);
                                    }
                                );
                            });
                            let seqRes = seqResp[0] || [];
                            data.SEQ_NO = seqRes[0].NEXT_NO;

                            console.log("Assigned Values:", { SEQ_NO: data.SEQ_NO });
                        }

                        selectQuery = `CALL Sp_GetIncCatByName(?,?,?)`
                        selectData.push(data.CATEGORY_NAME, data.ID, IMPORT_TYPE)

                        let columns = [];
                        let values = [];
                        const mysql = require("mysql");

                        Object.keys(data).forEach(key => {
                            if (data[key] !== undefined) {
                                columns.push(key);
                                values.push(mysql.escape(data[key]));
                            }
                        });

                        let finalQuery = `INSERT INTO inventory_category_master (${columns.join(", ")}) VALUES (${values.join(", ")})`;


                        UpsertQuery = `CALL sp_executeDynamicQuery(?)`
                        UpsertData = [finalQuery]
                    }
                    if (!data.CATEGORY_NAME || data.CATEGORY_NAME.toString().trim() === "") {
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: "Missing  Inventory category CATEGORY_NAME",
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing Inventory category CATEGORY_NAME" });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    const existingSp = await new Promise((resolve, reject) => {
                        mm.executeDML(
                            selectQuery,
                            selectData,
                            supportKey,
                            connection,
                            (error, results) => {
                                if (error) reject(error)
                                else resolve(results);
                            }
                        );
                    });

                    let existing = existingSp[0] || [];

                    if (existing && existing.length > 0) {
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `Duplicate Inventory category '${data.CATEGORY_NAME}' already exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Duplicate Inventory category" });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    const result = await new Promise((resolve, reject) => {
                        mm.executeDML(UpsertQuery, UpsertData, supportKey, connection, (error, results) => {
                            if (error) reject(error)
                            else {
                                resolve(results)
                                mm.commitConnection(connection)
                            };
                        });
                    });

                    successCount++;
                    successDetails.push({ rowNumber: index + 2, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    mm.rollbackConnection(connection)
                    console.error(`Row ${index + 2} failed:`, error.message);
                    errorDetails.push({ rowNumber: index + 2, reason: error.message });
                    errorData.push({ rowNumber: index + 2, row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                }
            }

            const progress = Math.min(100, Math.round(((start + chunk.length) / total) * 100));
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

        let response = {
            code: 200,
            message: " Inventory import process completed.",
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
        const fs = require("fs");
        const path = require("path");

        // unique file name
        const fileName = `${EXCEL_MASTER_ID}.json`;
        const filePath = path.join(
            __dirname,
            "../../uploads/ExcelImporResponse/",
            fileName
        );
        await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
            STATUS: "Completed",
            PROGRESS: 100,
            TOTAL_RECORDS: jsonData.length,
            SUCCESSFUL_RECORDS: successCount,
            SKIPPED_RECORDS: skippedCount,
            FAILED_RECORDS: errorDetails.length,
            RESPONSE: fileName
        });

        // write JSON file (pretty format for readability)
        fs.writeFileSync(filePath, JSON.stringify(response, null, 2), "utf8");


    } catch (error) {
        console.error("Error importing Excel file:", error);
    }
};



