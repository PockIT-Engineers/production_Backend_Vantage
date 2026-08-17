const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const excelMaster = require("../../modules/excelImportMaster");
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")
const xlsx = require('xlsx');
var categoryMaster = "category_master";
var viewCategoryMaster = "view_" + categoryMaster;

function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        ICON: req.body.ICON,
        DESCRIPTION: req.body.DESCRIPTION,
        IS_NEW: req.body.IS_NEW ? "1" : "0",
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        SEQ_NO: req.body.SEQ_NO
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME ').optional(),
        body('DESCRIPTION').optional(),
        body('ICON').optional(),
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
        if (IS_FILTER_WRONG != "0") {
            return res.send({ "code": 400,  "message": "Invalid filter parameter." });
        }

        mm.executeQueryData(
            setContext + 'CALL sp_categoryMaster_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400,  "message": "Failed to get category information." });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 7,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.create = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        const data = reqData(req);

        mm.executeQueryData(
            'CALL sp_categoryMaster_create(?,?,?,?,?,?,?)',
            [
                data.NAME,
                data.ICON,
                data.DESCRIPTION,
                data.IS_NEW,
                data.STATUS,
                data.CLIENT_ID,
                data.SEQ_NO
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400,  "message": "Failed to save category information..." });
                }
                const response = results[0][0];

                if(response.code==300){
                     return res.send(response);
                }


                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new category ${data.NAME}.`;
                var logCategory = "category"

                let actionLog = {
                    "SOURCE_ID": response.DATA, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                addGlobalData(response.DATA, supportKey);
                res.send({ "code": response.code,  "message": response.message });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.update = (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ "code": 422,  "message": errors.errors });
    }

    try {
        const data = reqData(req);

        mm.executeQueryData(
            'CALL sp_categoryMaster_update(?,?,?,?,?,?,?,?)',
            [
                req.body.ID,
                data.NAME,
                data.ICON,
                data.DESCRIPTION,
                data.IS_NEW,
                data.STATUS,
                data.CLIENT_ID,
                data.SEQ_NO
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400,  "message": "Failed to update category information." });
                }

                const response = results[0][0];
                 if(response.code==300){
                     return res.send(response);
                }
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the category ${data.NAME}.`;
                var logCategory = "category"

                let actionLog = {
                    "SOURCE_ID": req.body.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                addGlobalData(req.body.ID, supportKey);
                res.send({ "code": response.code,  "message": response.message });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.getCategory = (req, res) => {
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
        if (IS_FILTER_WRONG != "0") {
            return res.send({ "code": 400,  "message": "Invalid filter parameter." });
        }

        mm.executeQueryData(
            setContext + 'CALL sp_categoryMaster_getCategory()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400,  "message": "Failed to get category information." });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 7,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};

exports.getCategorys = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var { TERRITORY_ID, CUSTOMER_ID, CUSTOMER_TYPE } = req.body;
    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_TERRITORY_ID = ${TERRITORY_ID || 0};
        SET @v_CUSTOMER_ID = ${CUSTOMER_ID || 0};
        SET @v_CUSTOMER_TYPE = '${CUSTOMER_TYPE || 0}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);


    try {
        if (IS_FILTER_WRONG != "0") {
            return res.send({ "code": 400,  "message": "Invalid filter parameter." });
        }

        if (!CUSTOMER_TYPE || (!CUSTOMER_ID && !TERRITORY_ID)) {
            return res.send({ "code": 400,  "message": "Parameter Missing." });
        }
        mm.executeQueryData(
            setContext + 'CALL sp_categoryMaster_getCategorys()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400,  "message": "Failed to get category information." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 7,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.send({ "code": 500,  "message": "Something went wrong." });
    }
};


function addGlobalData(data_Id, supportKey) {
     const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND ID=${data_Id}';
    `;
    try {
        mm.executeQueryData(setContext+'CALL sp_categoryMaster_getCategory()', [], supportKey, (error, results1) => {
            if (error) {
                console.log(error);
            }
            else {
                const resultSets = results1.filter(r => Array.isArray(r));
                const results5 = resultSets[1] || [];
                console.log("data retrieved",results5);
                
                if (results5.length > 0) {
                    let logData = { ID: data_Id, CATEGORY: "Category", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "masters/category", TERRITORY_ID: 0 };
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
        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) {
                console.log("err", error);
                mm.rollbackConnection(connection);
                reject(error);
            }
            else resolve(results);
        });
    });
};

exports.importCategory = async (req, res) => {
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
        const chunkSize = 50;
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
                        data.IS_NEW = data.IS_NEW == "Yes" ? 1 : 0;
                    }
                    
                    data.CLIENT_ID = 1;
                    
                    // Validate NAME field
                    const name = (typeof data.NAME === "string") ? data.NAME.trim() : "";
                    if (!name) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: "Missing category NAME",
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing category NAME" });
                        mm.rollbackConnection(connection);
                        continue;
                    }
                    data.NAME = name;

                    if (IMPORT_TYPE == 'E') {
                        // EDIT MODE VALIDATIONS
                        
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: "Missing category ID",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing category ID" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Check if category exists by ID
                        const existing = await runQuery(
                            `CALL sp_check_category_exists_by_id(?)`,
                            [data.ID],
                            supportKey,
                            connection
                        );
                        
                        const existingResult = existing && existing[0] ? existing[0] : [];
                        
                        if (!existingResult.length) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Category for ID '${data.ID}' does not exists`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Category for ID '${data.ID}' does not exists` });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Get all other categories for validation
                        const resultsCheck = await runQuery(
                            `CALL sp_get_category_names_and_seq_except_id(?)`,
                            [data.ID],
                            supportKey,
                            connection
                        );
                        
                        const otherCategories = resultsCheck && resultsCheck[0] ? resultsCheck[0] : [];

                        // Check if name already exists in other categories
                        let existingNames = otherCategories.map(item => item.NAME);
                        if (existingNames.includes(data.NAME)) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Category '${data.NAME}' already exists`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Category '${data.NAME}' already exists` });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Check if SEQ_NO already exists in other categories
                        let sameSeqNo = otherCategories.filter(item => item.SEQ_NO == data.SEQ_NO);
                        if (sameSeqNo.length > 0) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Category with SEQ_NO '${data.SEQ_NO}' already exists`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Category with SEQ_NO '${data.SEQ_NO}' already exists` });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Check if name exists in current validation (double-check)
                        const nameCheck = await runQuery(
                            `CALL sp_check_category_name_exists(?, ?, ?)`,
                            [data.NAME, data.ID, true],
                            supportKey,
                            connection
                        );
                        
                        const nameExists = nameCheck && nameCheck[0] ? nameCheck[0] : [];
                        
                        if (nameExists.length > 0) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Duplicate category '${data.NAME}' already exists`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Duplicate category" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // UPDATE category using SP
                        await runQuery(
                            `CALL sp_update_category(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.ID,
                                data.NAME,
                                data.SEQ_NO,
                                data.DESCRIPTION || null,
                                data.ICON || null,
                                data.STATUS,
                                data.IS_NEW || 0,
                                data.CLIENT_ID,
                                systemDate
                            ],
                            supportKey,
                            connection
                        );

                    } else {
                        // INSERT MODE
                        
                        // Auto-generate SEQ_NO if not provided
                        if (!data.SEQ_NO) {
                            const seqRes = await runQuery(
                                `CALL sp_get_next_category_seq_no()`,
                                [],
                                supportKey,
                                connection
                            );
                            
                            const seqResult = seqRes && seqRes[0] ? seqRes[0] : [];
                            data.SEQ_NO = seqResult[0]?.NEXT_NO || 1;
                        }

                        // Check if name already exists
                        const nameCheck = await runQuery(
                            `CALL sp_check_category_name_exists(?, ?, ?)`,
                            [data.NAME, null, false],
                            supportKey,
                            connection
                        );
                        
                        const nameExists = nameCheck && nameCheck[0] ? nameCheck[0] : [];
                        
                        if (nameExists.length > 0) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `Duplicate category '${data.NAME}' already exists`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Duplicate category" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // INSERT category using SP
                        const insertResult = await runQuery(
                            `CALL sp_insert_category(?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.NAME,
                                data.SEQ_NO,
                                data.DESCRIPTION || null,
                                data.ICON || null,
                                data.STATUS,
                                data.IS_NEW || 0,
                                data.CLIENT_ID,
                                systemDate
                            ],
                            supportKey,
                            connection
                        );
                        
                        // Get inserted ID
                        const insertIdResult = insertResult && insertResult[0] && insertResult[0][0] ? 
                                               insertResult[0][0].insertId : insertResult[0]?.insertId;
                        
                        data.ID = insertIdResult;
                    }

                    // Add global data (MongoDB operation - stays in API)
                    addGlobalData(data.ID, supportKey);
                    
                    // Remove CLIENT_ID from data object (as in original)
                    delete data.CLIENT_ID;
                    
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
            message: "Category import process completed.",
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



