const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
var serviceDocumentMaster = "service_document_master";
var viewServiceDocumentMaster = "view_" + serviceDocumentMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        SEQ_NO: req.body.SEQ_NO,
        STATUS: req.body.STATUS ? '1' : '0',
        DOCUMENT: req.body.DOCUMENT,
        TYPE: req.body.TYPE,
        LINK: req.body.LINK,
        CATEGORY_ID: req.body.CATEGORY_ID,
        SUBCATEGORY_ID: req.body.SUBCATEGORY_ID,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [

        body('NAME').optional(), body('SEQ_NO').isInt().optional(), body('DOCUMENT').optional(), body('SERVICE_ID').isInt().optional(), body('ID').optional(),


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
                setContext + `CALL sp_serviceDocumentMaster_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get serviceDocument count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 140,
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
                "message": "Invalid filter parameter.",
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

    // Get required fields for duplicate check
    let CATEGORY_NAME = req.body.HELP_DOCUMENT_CATEGORY_NAME;
    let SUBCATEGORY_NAME = req.body.HELP_DOCUMENT_SUB_CATEGORY_NAME;
    let DOCUMENT_TYPE = req.body.TYPE;
    let NAME = req.body.NAME;

    // Validate required fields for duplicate check
    if (!CATEGORY_NAME || !SUBCATEGORY_NAME || !DOCUMENT_TYPE || !NAME) {
        return res.status(400).json({
            "code": 300,
            "message": "Category name, subcategory name, document type, and document name are required for duplicate checking"
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_serviceDocumentMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.SEQ_NO,
                data.STATUS,
                data.DOCUMENT,
                data.TYPE,
                data.LINK,
                data.CATEGORY_ID,
                data.SUBCATEGORY_ID,
                data.CLIENT_ID,
                userId,
                userName,
                CATEGORY_NAME,
                SUBCATEGORY_NAME
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save serviceDocument information..."
                    });
                }
                else {
                    const resultData = results[0][0];
                    if (resultData.code === 300) {
                        res.status(200).json({
                            "code": 300,
                            "message": resultData.message
                        });
                    } else {
                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created new service document ${data.NAME}.`;
                        var logCategory = "Service Document"

                        let actionLog = {
                            "SOURCE_ID": resultData.DOCUMENT_ID,
                            "LOG_DATE_TIME": mm.getSystemDate(),
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": logCategory,
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        }

                        dbm.saveLog(actionLog, systemLog)
                        res.status(200).json({
                            "code": 200,
                            "message": "ServiceDocument information saved successfully...",
                        });

                    }
                }
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

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var id = req.body.ID;

    if (!id) {
        return res.status(400).json({
            "code": 400,
            "message": "Document ID is required for update"
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(errors.errors), applicationkey);
        return res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }

    // Get required fields for duplicate check
    let CATEGORY_NAME = req.body.HELP_DOCUMENT_CATEGORY_NAME;
    let SUBCATEGORY_NAME = req.body.HELP_DOCUMENT_SUB_CATEGORY_NAME;
    let DOCUMENT_TYPE = req.body.TYPE;
    let NAME = req.body.NAME;

    // Validate required fields for duplicate check
    if (!CATEGORY_NAME || !SUBCATEGORY_NAME || !DOCUMENT_TYPE || !NAME) {
        return res.status(400).json({
            "code": 300,
            "message": "Category name, subcategory name, document type, and document name are required for duplicate checking"
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_serviceDocumentMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.NAME,
                data.SEQ_NO,
                data.STATUS,
                data.DOCUMENT,
                data.TYPE,
                data.LINK,
                data.CATEGORY_ID,
                data.SUBCATEGORY_ID,
                data.CLIENT_ID,
                userId,
                userName,
                CATEGORY_NAME,
                SUBCATEGORY_NAME
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update serviceDocument information."
                    });
                }
                else {
                    const resultData = results[0][0];
                    if (resultData.code === 300) {
                        res.status(200).json({
                            "code": 300,
                            "message": resultData.message
                        });
                    } else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has update the details of ${data.NAME}.`;
                        var logCategory = "Service Document"

                        let actionLog = {
                            "SOURCE_ID": id,
                            "LOG_DATE_TIME": mm.getSystemDate(),
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": logCategory,
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        }

                        dbm.saveLog(actionLog, systemLog)
                        res.status(200).json({
                            "code": 200,
                            "message": "Service document updated successfully...",
                            "DOCUMENT_ID": resultData.DOCUMENT_ID
                        });
                    }
                }
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

exports.unMappedServiceDocument = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let SERVICE_ID = req.body.SERVICE_ID ? req.body.SERVICE_ID : '';
    let CATEGORY_ID = req.body.CATEGORY_ID ? req.body.CATEGORY_ID : '';
    let SUBCATEGORY_ID = req.body.SUBCATEGORY_ID ? req.body.SUBCATEGORY_ID : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_SERVICE_ID = ${SERVICE_ID || 0};  
        SET @v_CATEGORY_ID = ${CATEGORY_ID || 0};   
        SET @v_SUBCATEGORY_ID = ${SUBCATEGORY_ID || 0};
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (!SERVICE_ID) {
        return res.status(400).json({
            "code": 400,
            "message": "Missing required fields in the request body.",
        });
    }

    try {
        if (IS_FILTER_WRONG == "0" && SERVICE_ID != '') {
            mm.executeQueryData(
                setContext + `CALL sp_serviceDocumentMaster_getUnmapped()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
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
                "message": "Invalid filter parameter or service id."
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

exports.unMapService = (req, res) => {
    var SERVICE_ID = req.body.SERVICE_ID;
    var data = req.body.DATA;
    var STATUS = req.body.STATUS ? 1 : 0;
    var supportKey = req.headers['supportkey'];

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Convert data array to JSON string for stored procedure
        const dataJson = JSON.stringify(data || []);

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_serviceDocumentMaster_unmap(?,?,?,?,?)`,
            [SERVICE_ID, STATUS, dataJson, userId, userName],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update service document information..."
                    });
                }
                else {
                    const resultData = results[0][0];
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has unmapped service document.`;

                    var logCategory = "Service Document"

                    let actionLog = {
                        "SOURCE_ID": SERVICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    return res.send({
                        "code": 200,
                        "message": "New service document Successfully added",
                    });
                }
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

exports.mappedServiceDocument = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let SERVICE_ID = req.body.SERVICE_ID ? req.body.SERVICE_ID : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_SERVICE_ID = ${SERVICE_ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (!SERVICE_ID) {
        return res.status(400).json({
            "code": 400,
            "message": "Missing required fields in the request body.",
        });
    }


    try {
        if (IS_FILTER_WRONG == "0" && SERVICE_ID != '') {
            mm.executeQueryData(
                setContext + `CALL sp_serviceDocumentMaster_getMapped()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 16,
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
                "message": "Invalid filter parameter or service id."
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

exports.mapServiceDocument = (req, res) => {
    var SERVICE_ID = req.body.SERVICE_ID;
    var STATUS = req.body.STATUS ? 1 : 0;
    var data = req.body.SERVICE_DATA;
    var CATEGORY_ID = req.body.CATEGORY_ID;
    var SUBCATEGORY_ID = req.body.SUBCATEGORY_ID;
    var supportKey = req.headers['supportkey'];

    if (!SERVICE_ID || !data || !CATEGORY_ID || !SUBCATEGORY_ID) {
        return res.status(400).json({
            "code": 400,
            "message": "Missing required fields in the request body.",
        });
    }

    try {
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Convert data array to JSON string for stored procedure
        const dataJson = JSON.stringify(data || []);

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_serviceDocumentMaster_map(?,?,?,?,?,?,?)`,
            [SERVICE_ID, STATUS, CATEGORY_ID, SUBCATEGORY_ID, dataJson, userId, userName],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to map service document information..."
                    });
                }
                else {
                    const resultData = results[0][0];
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped document to the service.`;

                    var logCategory = "Service Document"

                    let actionLog = {
                        "SOURCE_ID": SERVICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    res.status(200).json({
                        "code": resultData.code,
                        "message": resultData.message || "Service documents mapped successfully"
                    });
                }
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


const runSP = (spName, params, supportKey, connection) => {
    return new Promise((resolve, reject) => {
        const placeholders = params.map(() => '?').join(',');
        const query = `CALL ${spName}(${placeholders})`;
        mm.executeDML(query, params, supportKey, connection, (err, results) => {
            if (err) {
                console.log("SP error", err);
                reject(err);
            }
            else resolve(results);
        });
    });
};

exports.importServiceDocumentMapping = async (req, res) => {
    try {
        const supportKey = req.headers['supportkey'];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME) {
            return res.status(400).json({
                code: 400,
                message: "Missing EXCEL_FILE_NAME"
            });
        }

        // Create column mapping
        const columnMapping = {};
        if (COLUMN_JSON && Array.isArray(COLUMN_JSON)) {
            COLUMN_JSON.forEach(col => {
                columnMapping[col.TABLE_FIELD] = col.EXCEL_FIELD;
            });
        }

        // Get Excel column names from mapping with fallbacks
        const excelServiceField = columnMapping.SERVICE_NAME || "SERVICE_NAME";
        const excelDocumentField = columnMapping.DOCUMENT_NAME || "DOCUMENT_NAME";
        const excelStatusField = columnMapping.STATUS || "STATUS";
        const excelCategoryField = columnMapping.CATEGORY_ID || "CATEGORY_NAME";
        const excelSubcategoryField = columnMapping.SUBCATEGORY_ID || "SUBCATEGORY_NAME";
        const excelShortCodeField = columnMapping.SHORT_CODE || "SHORT_CODE";

        // Helper function to get value from row with multiple possible column names
        const getColumnValue = (row, possibleNames) => {
            for (const name of possibleNames) {
                if (row[name] !== undefined && row[name] !== null) {
                    return row[name];
                }
            }
            return undefined;
        };

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);

        // Read with defval to handle undefined cells
        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }
        );

        // Remove empty rows
        const rows = cleanedRows.filter(row =>
            Object.values(row).some(
                val => val !== null && val !== undefined && String(val).trim() !== ""
            )
        );

        if (!rows.length) {
            return res.status(200).json({
                code: 200,
                message: "No data found in Excel"
            });
        }
        // Send immediate response
        res.status(200).json({
            code: 200,
            message: "Service document import started",
            EXCEL_MASTER_ID
        });

        // Detailed reporting arrays
        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        let successDetails = [];
        let errorDetails = [];
        let errorData = [];
        let skippedDetails = [];
        let totalData = [];
        const chunkSize = 50;
        // Helper function to normalize text
        const normalizeText = (text) => text ? text.toString().trim() : '';

        for (let start = 0; start < rows.length; start += chunkSize) {
            const chunk = rows.slice(start, start + chunkSize);

            for (const [i, row] of chunk.entries()) {
                const rowNumber = start + i + 2;
                const connection = mm.openConnection()
                try {
                    // Get values using dynamic column name resolution
                    let SERVICE_NAME = getColumnValue(row, [
                        excelServiceField,
                        'SERVICE_NAME',
                        'Service Name',
                        'Service',
                        'SERVICE'
                    ]);

                    let DOCUMENT_NAME = getColumnValue(row, [
                        excelDocumentField,
                        'DOCUMENT_NAME',
                        'Document Name',
                        'Document',
                        'DOCUMENT'
                    ]);

                    let STATUS = getColumnValue(row, [
                        excelStatusField,
                        'STATUS',
                        'Status'
                    ]);

                    let CATEGORY_NAME = getColumnValue(row, [
                        excelCategoryField,
                        'Help Document Category Name',
                        'CATEGORY_NAME',
                        'Category Name',
                        'Category'
                    ]);

                    let SUBCATEGORY_NAME = getColumnValue(row, [
                        excelSubcategoryField,
                        'Help Document SubCategory Name',
                        'SUBCATEGORY_NAME',
                        'Subcategory Name',
                        'Subcategory'
                    ]);
                    let SHORT_CODE = getColumnValue(row, [
                        excelShortCodeField,
                        'Help Document Short Code',
                        'SHORT_CODE',
                        'Short Code',
                        'Short Code'
                    ]);
                    let ID = getColumnValue(row, ['ID', 'Id', 'id', 'Id ']);

                    // Store original row data for reporting
                    const originalRowData = { ...row };

                    // Normalize inputs
                    SERVICE_NAME = normalizeText(SERVICE_NAME);
                    DOCUMENT_NAME = normalizeText(DOCUMENT_NAME);
                    STATUS = normalizeText(STATUS);
                    CATEGORY_NAME = normalizeText(CATEGORY_NAME);
                    SUBCATEGORY_NAME = normalizeText(SUBCATEGORY_NAME);

                    console.log("Row Data:", originalRowData);
                    console.log("SHORT_CODE:", SHORT_CODE);

                    // Convert STATUS to numeric
                    const STATUS_VALUE = IMPORT_TYPE == "E" ? (STATUS === "Active" ? 1 : 0) : 1;

                    // Validate required fields
                    if (!SERVICE_NAME || !DOCUMENT_NAME) {
                        const missingFields = [
                            !SERVICE_NAME && "SERVICE_NAME",
                            !DOCUMENT_NAME && "DOCUMENT_NAME"
                        ].filter(Boolean);

                        const reason = `Missing required fields: ${missingFields.join(", ")}`;
                        skippedDetails.push({
                            rowNumber,
                            row: originalRowData,
                            reason
                        });
                        totalData.push({
                            ...originalRowData,
                            IMPORT_STATUS: "Skipped",
                            reason
                        });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    if (SERVICE_NAME && SHORT_CODE) {
                        let serviceName = SERVICE_NAME.split("(Short Code:");
                        SERVICE_NAME = serviceName[0].trim();
                        console.log("Cleaned SERVICE_NAME:", SERVICE_NAME, SHORT_CODE);
                    }

                    // Check if Service exists using SP
                    const getServiceResult = await runSP(
                        'sp_get_service_by_name_code',
                        [SERVICE_NAME, SHORT_CODE],
                        supportKey,
                        connection
                    );

                    const getService = getServiceResult[0] || [];

                    if (!getService.length) {
                        const reason = `Service not found: "${SERVICE_NAME}"`;
                        skippedDetails.push({
                            rowNumber,
                            row: originalRowData,
                            reason
                        });
                        totalData.push({
                            ...originalRowData,
                            IMPORT_STATUS: "Skipped",
                            reason
                        });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    // Check if Document exists using SP
                    const getDocumentResult = await runSP(
                        'sp_get_document_by_name',
                        [DOCUMENT_NAME],
                        supportKey,
                        connection
                    );

                    const getDocument = getDocumentResult[0] || [];

                    if (!getDocument.length) {
                        const reason = `Document not found: "${DOCUMENT_NAME}"`;
                        skippedDetails.push({
                            rowNumber,
                            row: originalRowData,
                            reason
                        });
                        totalData.push({
                            ...originalRowData,
                            IMPORT_STATUS: "Skipped",
                            reason
                        });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    const SERVICE_ID = getService[0].ID;
                    const MASTER_ID = getDocument[0].ID;

                    // Resolve CATEGORY_ID if category name is provided using SP
                    let CATEGORY_ID = null;
                    if (CATEGORY_NAME) {
                        const categoryResult = await runSP(
                            'sp_get_helpcategory_by_name',
                            [CATEGORY_NAME],
                            supportKey,
                            connection
                        );
                        const categoryData = categoryResult[0] || [];
                        CATEGORY_ID = categoryData.length ? categoryData[0].ID : null;
                    }

                    // Resolve SUBCATEGORY_ID if subcategory name is provided using SP
                    let SUBCATEGORY_ID = null;
                    if (SUBCATEGORY_NAME) {
                        const subcategoryResult = await runSP(
                            'sp_get_helpsubcategory_by_name',
                            [SUBCATEGORY_NAME],
                            supportKey,
                            connection
                        );
                        const subcategoryData = subcategoryResult[0] || [];
                        SUBCATEGORY_ID = subcategoryData.length ? subcategoryData[0].ID : null;
                    }

                    let excludeId = null;
                    if (ID && IMPORT_TYPE == "E") {
                        excludeId = ID;
                    }

                    // Check for existing mapping using SP
                    const existingResult = await runSP(
                        'sp_check_service_doc_mapping_exists',
                        [SERVICE_ID, MASTER_ID, excludeId],
                        supportKey,
                        connection
                    );

                    const existing = existingResult[0] || [];

                    let operationType = '';
                    let recordId = null;

                    if (existing.length > 0) {
                        // Update existing record using SP
                        await runSP(
                            'sp_update_service_doc_mapping',
                            [existing[0].ID, STATUS_VALUE, CATEGORY_ID, SUBCATEGORY_ID],
                            supportKey,
                            connection
                        );
                        operationType = 'Updated';
                        recordId = existing[0].ID;
                    } else {
                        if (IMPORT_TYPE == "E") {
                            const reason = `Mapping does not exist for ID : ${ID}, cannot update non-existing record.`;
                            skippedDetails.push({
                                rowNumber,
                                row: originalRowData,
                                reason
                            });
                            totalData.push({
                                ...originalRowData,
                                IMPORT_STATUS: "Skipped",
                                reason
                            });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }
                        // Insert new record using SP
                        const insertResult = await runSP(
                            'sp_insert_service_doc_mapping',
                            [SERVICE_ID, MASTER_ID, STATUS_VALUE, 1, CATEGORY_ID, SUBCATEGORY_ID],
                            supportKey,
                            connection
                        );
                        operationType = 'Inserted';
                        recordId = insertResult[0][0].insertId;
                    }

                    mm.commitConnection(connection)
                    successCount++;
                    successDetails.push({
                        rowNumber,
                        row: originalRowData,
                        ID: recordId,
                        operation: operationType
                    });
                    totalData.push({
                        ...originalRowData,
                        IMPORT_STATUS: "Success",
                        operation: operationType
                    });

                } catch (error) {
                    mm.rollbackConnection(connection)
                    failedCount++;
                    const errorMsg = error.message || 'Unknown error';
                    errorDetails.push({
                        rowNumber,
                        error: errorMsg
                    });
                    errorData.push({
                        rowNumber,
                        row: row,
                        reason: errorMsg
                    });
                    totalData.push({
                        ...row,
                        IMPORT_STATUS: "Failed",
                        reason: errorMsg
                    });
                }
            }

            // Update progress for this chunk
            const progress = Math.min(100, Math.round(((start + chunk.length) / rows.length) * 100));
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

        // Save audit log
        const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} imported service document mappings.`;

        // Run audit log in background without waiting
        dbm.saveLog({
            SOURCE_ID: 0,
            LOG_DATE_TIME: mm.getSystemDate(),
            LOG_TEXT: ACTION_DETAILS,
            CATEGORY: "Service Document Import",
            CLIENT_ID: 1,
            USER_ID: req.body.authData.data.UserData[0].USER_ID,
            supportKey: 0
        }, systemLog);

        // Prepare final response
        const response = {
            code: 200,
            message: "Service document import process completed.",
            totalRecords: rows.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: failedCount,
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
            TOTAL_RECORDS: rows.length,
            SUCCESSFUL_RECORDS: successCount,
            SKIPPED_RECORDS: skippedCount,
            FAILED_RECORDS: failedCount,
            RESPONSE: fileName
        });

        // write JSON file (pretty format for readability)
        fs.writeFileSync(filePath, JSON.stringify(response, null, 2), "utf8");

        console.log("Service document import completed:", response.message);

    } catch (error) {
        console.error("Service document import error:", error);

        // Update excel master with error status if EXCEL_MASTER_ID exists
        if (req.body.id) {
            await excelMaster.findByIdAndUpdate(req.body.id, {
                STATUS: "Failed",
                RESPONSE: JSON.stringify({
                    code: 500,
                    message: "Import failed due to system error",
                    error: error.message
                })
            });
        }
    }
};

