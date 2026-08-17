const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
var xlsx = require('xlsx')
const excelMaster = require("../../modules/excelImportMaster");

const applicationkey = process.env.APPLICATION_KEY;

var inventorySubCategory = "inventory_sub_category";
var viewInventorySubCategory = "view_" + inventorySubCategory;


function reqData(req) {

    var data = {
        INVENTRY_CATEGORY_ID: req.body.INVENTRY_CATEGORY_ID,
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        ICON: req.body.ICON,
        CLIENT_ID: req.body.CLIENT_ID,
        SEQ_NO: req.body.SEQ_NO,

    }
    return data;
}

exports.validate = function () {
    return [

        body('INVENTRY_CATEGORY_ID').isInt(), body('NAME', ' parameter missing').exists(), body('DESCRIPTION').optional(), body('ID').optional(),


    ]
}

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : "ID";
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
            setContext + 'CALL sp_inventorySubCategory_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get inventorySubCategory data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 37,
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
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_inventorySubCategory_create(?,?,?,?,?,?,?)`,
            [
                data.INVENTRY_CATEGORY_ID,
                data.NAME,
                data.DESCRIPTION,
                data.IS_ACTIVE,
                data.ICON,
                data.CLIENT_ID,
                data.SEQ_NO
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({
                        "code": 400,
                        "message": "Failed to save inventorySubCategory information..."
                    });
                }
                res.send({
                    "code": results[0][0].CODE,
                    "message": results[0][0].MESSAGE,
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

exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_inventorySubCategory_update(?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.INVENTRY_CATEGORY_ID || null,
                data.NAME || null,
                data.DESCRIPTION ?? null,   // allows NULL
                data.IS_ACTIVE || null,
                data.ICON || null,
                data.CLIENT_ID || null,
                data.SEQ_NO || null
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({
                        "code": 400,
                        "message": "Failed to update inventorySubCategory information."
                    });
                }
                res.send({
                    "code": results[0][0].CODE,
                    "message": results[0][0].MESSAGE,
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

exports.getSubCategoryForTechnician = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : "ID";
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
            setContext + 'CALL sp_inventorySubCategory_getSubCategoryForTechnician()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get inventorySubCategory data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 37,
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


exports.importInventorySubCategory = async (req, res) => {
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
                    // build data object dynamically based on COLUMN_JSON mapping
                    let data = {};
                    COLUMN_JSON.forEach(col => {
                        data[col.TABLE_FIELD] = row[col.EXCEL_FIELD] !== undefined ? row[col.EXCEL_FIELD] : null;
                    });

                    // convert human-readable values
                    if (IMPORT_TYPE == "E") {
                        data.IS_ACTIVE = data.IS_ACTIVE == "Active" ? 1 : 0;
                    } else {
                        data.IS_ACTIVE = 1;
                    }
                    // include system fields
                    data.CLIENT_ID = 1
                        ;
                    var selectQuery = ''
                    var selectData = []

                    var UpsertQuery = ''
                    var UpsertData = []
                    const getCategorySp = await new Promise((resolve, reject) => {
                        mm.executeDML(
                            `CALL sp_getInventoryCategoryForImportInventory(?)`,
                            [data.CATEGORY_NAME],
                            supportKey, connection,
                            (error, results) => {
                                if (error) {
                                    reject(error)
                                    mm.rollbackConnection(connection)
                                }
                                else resolve(results);
                            }
                        );
                    });
                    const getCategory = getCategorySp[0] || [];
                    if (getCategory.length == 0) {
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `'${data.CATEGORY_NAME}' category not exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "This category not exists" });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }
                    data.INVENTRY_CATEGORY_ID = getCategory[0].ID
                    delete data.CATEGORY_NAME;
                    if (IMPORT_TYPE == 'E') {
                        if (!data.ID) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: "Missing Inventory sub category ID",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing Inventory sub category ID" });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }
                        else {
                            const getData = await new Promise((resolve, reject) => {
                                mm.executeDML(
                                    `CALL Sp_GetInvSubCatById(?)`,
                                    [data.ID],
                                    supportKey,
                                    connection,
                                    (error, results) => {
                                        if (error) {
                                            reject(error)
                                            mm.rollbackConnection(connection)
                                        }
                                        else resolve(results);
                                    }
                                );
                            });

                            if (!getData.length) {
                                skippedDetails.push({
                                    rowNumber: index + 2,
                                    row,
                                    reason: `inventory Subcategory does not exist for ID ${data.ID}`,
                                });
                                totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "inventory Sub category does not exist for ID " + data.ID + " " });
                                skippedCount++;
                                continue;
                            }

                            selectQuery = `CALL Sp_GetInvSubCatByName(?,?,?,?)`
                            selectData.push(data.NAME, data.ID, IMPORT_TYPE,data.INVENTRY_CATEGORY_ID)

                            const mysql = require("mysql");

                            var setData = "";

                            Object.keys(data).forEach(key => {
                                if (key !== "ID" && data[key] !== undefined) {
                                    setData += `${key} = ${mysql.escape(data[key])}, `;
                                }
                            });
                            setData = setData.slice(0, -2);
                            let finalQuery = `UPDATE inventory_sub_category SET ${setData}, CREATED_MODIFIED_DATE = ${mysql.escape(systemDate)} WHERE ID = ${mysql.escape(data.ID)}`;

                            UpsertQuery = `CALL sp_executeDynamicQuery(?)`
                            UpsertData = [finalQuery]
                        }

                    }
                    else {
                        if (!data.SEQ_NO) {
                            // AUTO GENERATE SEQ_NO
                            const seqRes = await new Promise((resolve, reject) => {
                                mm.executeQueryData(
                                    `CALL Sp_GetInvSubCatMaxSeqNo()`,
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
                            console.log("Max SEQ_NO Result:", seqRes);
                            data.SEQ_NO = seqRes[0][0].NEXT_NO;

                            console.log("Assigned Values:", { SEQ_NO: data.SEQ_NO });
                        }
                        selectQuery = `CALL Sp_GetInvSubCatByName(?,?,?,?)`
                        selectData.push(data.NAME, data.ID, IMPORT_TYPE, data.INVENTRY_CATEGORY_ID)
                        let mysql = require("mysql");
                        let columns = [];
                        let values = [];

                        Object.keys(data).forEach(key => {
                            if (data[key] !== undefined) {
                                columns.push(key);
                                values.push(mysql.escape(data[key]));
                            }
                        });

                        let finalQuery = `INSERT INTO inventory_sub_category (${columns.join(", ")}) VALUES (${values.join(", ")})`;

                        UpsertQuery = `CALL sp_executeDynamicQuery(?)`
                        UpsertData = [finalQuery]

                        // UpsertQuery = `INSERT INTO inventory_sub_category SET ?`
                        // UpsertData = data
                    }
                    // validate category name
                    if (!data.NAME || data.NAME.trim() === "") {
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: "Missing  Inventory sub category NAME",
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing Inventory sub category NAME" });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    // 🔍 check for duplicate category name
                    const existingSp = await new Promise((resolve, reject) => {
                        mm.executeDML(
                            selectQuery,
                            selectData,
                            supportKey,
                            connection,
                            (error, results) => {
                                if (error) {
                                    reject(error)
                                    mm.rollbackConnection(connection)
                                }
                                else resolve(results);
                            }
                        );
                    });
                    let existing = existingSp[0] || [];

                    if (existing && existing.length > 0) {
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `Duplicate Inventory sub category '${data.NAME}' already exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Duplicate Inventory sub category" });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    // ✅ insert new record
                    const result = await new Promise((resolve, reject) => {
                        mm.executeDML(UpsertQuery, UpsertData, supportKey, connection, (error, results) => {
                            if (error) {
                                reject(error)
                                mm.rollbackConnection(connection)
                            }
                            else {
                                resolve(results)
                                mm.commitConnection(connection)
                            }
                        });
                    });

                    successCount++;
                    successDetails.push({ rowNumber: index + 2, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    console.error(`Row ${index + 2} failed:`, error.message);
                    errorDetails.push({ rowNumber: index + 2, reason: error.message });
                    errorData.push({ rowNumber: index + 2, row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                    mm.rollbackConnection(connection)
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
            message: " Inventory sub Category import process completed.",
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
        try {
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
        } catch (updateError) {
            console.error("Error updating excelImportMaster record:", updateError);
        }
    } catch (error) {
        console.error("Error importing Excel file:", error);
    }
};
