const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require('../../modules/systemLog');
const xlsx = require('xlsx');
const excelMaster = require("../../modules/excelImportMaster");
const applicationkey = process.env.APPLICATION_KEY;
var subCategoryMaster = "sub_category_master";
var viewSubCategoryMaster = "view_" + subCategoryMaster;

function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        CATEGORY_ID: req.body.CATEGORY_ID,
        DESCRIPTION: req.body.DESCRIPTION,
        STATUS: req.body.STATUS ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO,
        IS_NEW: req.body.IS_NEW ? "1" : "0",
        BANNER_IMAGE: req.body.BANNER_IMAGE,
        IMAGE: req.body.IMAGE,
        CLIENT_ID: req.body.CLIENT_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
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

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_subCategoryMaster_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get subCategory count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 100,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": dataResult
                        });
                    }
                }
            );
        }
        else {
            res.status(400).json({
                "code": 400,
                 "message": "Invalid filter parameter."
            });
        }
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

// Create subcategory using stored procedure
exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        mm.executeQueryData(
            `CALL sp_subCategoryMaster_create(?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.CATEGORY_ID,
                data.DESCRIPTION,
                data.STATUS,
                data.SEQ_NO,
                data.IS_NEW,
                data.BANNER_IMAGE,
                data.IMAGE,
                data.CLIENT_ID,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save Subcategory information..."
                    });
                }

                const resultData = results[0][0];
                if (resultData.code === 300) {
                    return res.status(200).json({
                        "code": 300,
                        "message": resultData.message
                    });
                }

                const newId = resultData.SUBCATEGORY_ID;

                var ACTION_DETAILS = `User ${userName} has created a new sub category ${data.NAME}`;
                var logCategory = "Sub Category";

                let actionLog = {
                    "SOURCE_ID": newId,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                // Call addGlobalData function
                addGlobalData(newId, supportKey);

                res.status(200).json({
                    "code": 200,
                    "message": "SubCategory information saved successfully...",
                    "SUBCATEGORY_ID": newId
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

// Update subcategory using stored procedure
exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var id = req.body.ID;

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Handle empty DESCRIPTION (convert to null)
        if (data.DESCRIPTION === '' || data.DESCRIPTION === null) {
            data.DESCRIPTION = null;
        }

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_subCategoryMaster_update(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.NAME,
                data.CATEGORY_ID,
                data.DESCRIPTION,
                data.STATUS,
                data.SEQ_NO,
                data.IS_NEW,
                data.BANNER_IMAGE,
                data.IMAGE,
                data.CLIENT_ID,
                userId,
                userName
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update subCategory information."
                    });
                }

                const resultData = results[0][0];
                if (resultData.code === 300) {
                    return res.status(200).json({
                        "code": 300,
                        "message": resultData.message
                    });
                }

                // MongoDB logging (keeping as is)
                var ACTION_DETAILS = `User ${userName} has updated details of ${data.NAME}`;
                var logCategory = "Sub Category";

                let actionLog = {
                    "SOURCE_ID": id,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                // Call addGlobalData function
                addGlobalData(id, supportKey);

                res.status(200).json({
                    "code": 200,
                    "message": "SubCategory information updated successfully...",
                    "SUBCATEGORY_ID": resultData.SUBCATEGORY_ID
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};
function addGlobalData(data_Id, supportKey) {
    try {
          const setContext = `
        SET @v_PAGE_INDEX =0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = "ID";
        SET @v_SORT_VALUE = "desc";
        SET @v_FILTER = ' AND ID=${data_Id}';
    `;
        mm.executeQueryData(setContext+`CALL sp_subCategoryMaster_get()`, [], supportKey, (error, results1) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("data retrieved");
                const resultSets = results1.filter(r => Array.isArray(r));
                const results5 = resultSets[1] || [];
                if (results5.length > 0) {
                    // require('../global').addDatainGlobal(data_Id, "Customer", results5[0].NAME, JSON.stringify(results5[0]), "/masters/customer",0, supportKey)
                    let logData = { ID: data_Id, CATEGORY: "SubCategory", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "masters/subcategory", TERRITORY_ID: 0 };
                    dbm.addDatainGlobalmongo(logData.ID, logData.CATEGORY, logData.TITLE, logData.DATA, logData.ROUTE, logData.TERRITORY_ID)
                        .then(() => {
                            console.log("Data added/updated successfully.");
                        })
                        .catch(error => {
                            console.error("Error in addDatainGlobalmongo:", error);
                        });
                } else {
                    console.log(" no data found");
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

const runQuery = (query, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, results) => {
            if (error) {
                console.log("err", error);
                mm.rollbackConnection(connection);
                reject(error);
            }
            else resolve(results);
        });
    });
};

exports.importSubCategory = async (req, res) => {
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
                const connection = mm.openConnection();
                const rowNumber = start + index + 2;
                
                try {
                    let data = {};
                    COLUMN_JSON.forEach(col => {
                        data[col.TABLE_FIELD] = row[col.EXCEL_FIELD] !== undefined ? row[col.EXCEL_FIELD] : null;
                    });

                    // Process STATUS field
                    if (IMPORT_TYPE == 'E') {
                        data.STATUS = data.STATUS == 'Active' ? 1 : 0;
                    } else {
                        data.STATUS = 1;
                    }

                    // Process IS_NEW field
                    if (data.IS_NEW !== undefined) {
                        data.IS_NEW = data.IS_NEW == 'Yes' ? 1 : 0;
                    }
                    
                    data.CLIENT_ID = 1;

                    // Validate NAME field
                    if (!data.NAME || data.NAME.trim() === "") {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: "Missing SubCategory NAME",
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing SubCategory NAME" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    // Get category by name
                    const getCategory = await runQuery(
                        `CALL sp_get_category_by_name(?)`,
                        [data.CATEGORY_NAME],
                        supportKey,
                        connection
                    );
                    
                    const categoryResult = getCategory && getCategory[0] ? getCategory[0] : [];
                    
                    if (categoryResult.length == 0) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: `'${data.CATEGORY_NAME}' category not exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "This category not exists" });
                        mm.rollbackConnection(connection);
                        continue;
                    }
                    
                    data.CATEGORY_ID = categoryResult[0].ID;

                    if (IMPORT_TYPE == 'E') {
                        // EDIT MODE VALIDATIONS
                        
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: "Missing SubCategory ID",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing SubCategory ID" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Check if subcategory exists by ID
                        const getSubCategory = await runQuery(
                            `CALL sp_check_subcategory_exists_by_id(?)`,
                            [data.ID],
                            supportKey,
                            connection
                        );
                        
                        const subCategoryResult = getSubCategory && getSubCategory[0] ? getSubCategory[0] : [];
                        
                        if (!subCategoryResult.length) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Subcategory does not exist for ID ${data.ID}`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Subcategory does not exist for ID ${data.ID}` });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Check if name already exists in the same category (excluding current)
                        const nameCheck = await runQuery(
                            `CALL sp_check_subcategory_name_exists(?, ?, ?, ?)`,
                            [data.NAME, data.ID, true, data.CATEGORY_ID],
                            supportKey,
                            connection
                        );

                        const nameExists = nameCheck && nameCheck[0] ? nameCheck[0] : [];

                        if (nameExists.length > 0) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Duplicate SubCategory '${data.NAME}' already exists in category '${data.CATEGORY_NAME}'`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Duplicate SubCategory in same Category" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Store category name for later use
                        const categoryName = categoryResult[0].NAME;
                        
                        // Remove CATEGORY_NAME before update
                        delete data.CATEGORY_NAME;

                        // UPDATE subcategory using SP
                        await runQuery(
                            `CALL sp_update_subcategory(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.ID,
                                data.NAME,
                                data.SEQ_NO,
                                data.DESCRIPTION || null,
                                data.SUB_CATEGORY_IMAGE || null,
                                data.ICON || null,
                                data.STATUS,
                                data.IS_NEW || 0,
                                data.CATEGORY_ID,
                                data.CLIENT_ID,
                                data.ORG_ID || 1,
                                systemDate
                            ],
                            supportKey,
                            connection
                        );
                        
                        // Restore category name for response
                        data.CATEGORY_NAME = categoryName;

                    } else {
                        // INSERT MODE
                        
                        // Auto-generate SEQ_NO if not provided
                        if (!data.SEQ_NO) {
                            const seqRes = await runQuery(
                                `CALL sp_get_next_subcategory_seq_no()`,
                                [],
                                supportKey,
                                connection
                            );
                            
                            const seqResult = seqRes && seqRes[0] ? seqRes[0] : [];
                            data.SEQ_NO = seqResult[0]?.NEXT_NO || 1;
                        }

                        // Check if name already exists in the same category
                        const nameCheck = await runQuery(
                            `CALL sp_check_subcategory_name_exists(?, ?, ?, ?)`,
                            [data.NAME, null, false, data.CATEGORY_ID],
                            supportKey,
                            connection
                        );

                        const nameExists = nameCheck && nameCheck[0] ? nameCheck[0] : [];

                        if (nameExists.length > 0) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Duplicate SubCategory '${data.NAME}' already exists in category '${data.CATEGORY_NAME}'`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Duplicate SubCategory in same Category" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Store category name for later use
                        const categoryName = categoryResult[0].NAME;
                        
                        // Remove CATEGORY_NAME before insert
                        delete data.CATEGORY_NAME;

                        // INSERT subcategory using SP
                        const insertResult = await runQuery(
                            `CALL sp_insert_subcategory(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.NAME,
                                data.SEQ_NO,
                                data.DESCRIPTION || null,
                                data.SUB_CATEGORY_IMAGE || null,
                                data.ICON || null,
                                data.STATUS,
                                data.IS_NEW || 0,
                                data.CATEGORY_ID,
                                data.CLIENT_ID,
                                data.ORG_ID || 1,
                                systemDate
                            ],
                            supportKey,
                            connection
                        );
                        
                        // Get inserted ID
                        const insertIdResult = insertResult && insertResult[0] && insertResult[0][0] ? 
                                               insertResult[0][0].insertId : insertResult[0]?.insertId;
                        
                        data.ID = insertIdResult;
                        data.CATEGORY_NAME = categoryName;
                    }

                    // Add global data (MongoDB operation - stays in API)
                    addGlobalData(data.ID, supportKey);

                    mm.commitConnection(connection);
                    
                    successCount++;
                    successDetails.push({ rowNumber: rowNumber, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    mm.rollbackConnection(connection);
                    console.error(`Row ${rowNumber} failed:`, error.message);
                    errorDetails.push({ rowNumber: rowNumber, reason: error.message });
                    errorData.push({ rowNumber: rowNumber, row, reason: error.message });
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
            message: "Sub Category import process completed.",
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

        fs.writeFileSync(filePath, JSON.stringify(response, null, 2), "utf8");

    } catch (error) {
        console.error("Error importing Excel file:", error);
    }
};
