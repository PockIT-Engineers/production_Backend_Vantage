const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
var serviceSkillMapping = "service_skill_mapping";
var viewServiceSkillMapping = "view_" + serviceSkillMapping;

function reqData(req) {

    var data = {
        SERVICE_ID: req.body.SERVICE_ID,
        SKILL_ID: req.body.SKILL_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('SERVICE_ID').isInt().optional(),
        body('SKILL_ID').isInt().optional(),
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
                setContext+`CALL sp_serviceSkillMapping_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get serviceSkillMapping count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 92,
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
        // Get user information from auth data
        const userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;
        const userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_serviceSkillMapping_create(?,?,?,?,?,?)`,
            [
                data.SERVICE_ID,
                data.SKILL_ID,
                data.IS_ACTIVE,
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
                        "message": "Failed to save serviceSkillMapping information..."
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
                var ACTION_DETAILS = `User ${userName} has mapped new skill to service.`;
                var logCategory = "Service Skill Mapping";

                let actionLog = {
                    "SOURCE_ID": resultData.MAPPING_ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    "code": 200,
                    "message": "ServiceSkillMapping information saved successfully...",
                    "MAPPING_ID": resultData.MAPPING_ID
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

        // Using stored procedure
        mm.executeQueryData(
            `CALL sp_serviceSkillMapping_update(?,?,?,?,?,?,?)`,
            [
                id,
                data.SERVICE_ID,
                data.SKILL_ID,
                data.IS_ACTIVE,
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
                        "message": "Failed to update serviceSkillMapping information."
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
                var ACTION_DETAILS = `User ${userName} has updated details of service skill mapping.`;
                var logCategory = "Service Skill Mapping";

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

                res.status(200).json({
                    "code": 200,
                    "message": "ServiceSkillMapping information updated successfully...",
                    "MAPPING_ID": resultData.MAPPING_ID
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

exports.addBulk = (req, res) => {
    var SERVICE_ID = req.body.SERVICE_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    if (!SERVICE_ID || !data || !Array.isArray(data)) {
        return res.status(400).json({
            "code": 400,
            "message": "Missing required fields or invalid data format."
        });
    }

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(
                `CALL sp_serviceSkillMapping_upsert(?,?,?,?)`,
                [
                    roleDetailsItem.SKILL_ID,
                    SERVICE_ID,
                    roleDetailsItem.IS_ACTIVE,
                    CLIENT_ID
                ],
                supportKey,
                connection,
                (error, results) => {
                    if (error) {
                        console.log("error in stored procedure", error);
                        inner_callback(error);
                    } else {
                        // Get the OUT parameters from stored procedure
                        const resultCode = results[0][0]?.code || 200;
                        const resultMessage = results[0][0]?.message || 'Success';

                        if (resultCode !== 200) {
                            inner_callback(new Error(resultMessage));
                        } else {
                            inner_callback(null);
                        }
                    }
                }
            );
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                console.log("error in async.eachSeries", error);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to Insert serviceSkillMapping information..."
                });
            } else {
                // MongoDB logging (keeping as is)
                var userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';
                var userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;

                var ACTION_DETAILS = `User ${userName} has mapped new skills.`;
                var logCategory = "Service Skill Mapping";

                let actionLog = {
                    "SOURCE_ID": SERVICE_ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                mm.commitConnection(connection);
                res.status(200).json({
                    "code": 200,
                    "message": "New serviceSkillMapping Successfully added",
                });
            }
        });
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.mapSkills = (req, res) => {
    var SERVICE_ID = req.body.SERVICE_ID;
    var STATUS = req.body.STATUS;
    var SKILL_LEVEL = req.body.SKILL_LEVEL ? req.body.SKILL_LEVEL : " ";
    var IS_ACTIVE = STATUS == 'M' ? '1' : '0';
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];

    if (!SERVICE_ID || !STATUS || !data || !Array.isArray(data)) {
        return res.status(400).json({
            "code": 400,
            "message": "Missing required fields or invalid data format."
        });
    }

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            // Using stored procedure for each item
            mm.executeDML(
                `CALL sp_serviceSkillMapping_mapSkills(?,?,?,?,?)`,
                [
                    roleDetailsItem.SKILL_ID,
                    SERVICE_ID,
                    IS_ACTIVE,
                    STATUS,
                    1
                ],
                supportKey,
                connection,
                (error, results) => {
                    if (error) {
                        console.log("error in stored procedure", error);
                        inner_callback(error);
                    } else {
                        // Get the OUT parameters from stored procedure
                        const resultCode = results[0]?.RESULT_CODE || 200;
                        const resultMessage = results[0]?.RESULT_MESSAGE || 'Success';

                        if (resultCode !== 200) {
                            inner_callback(new Error(resultMessage));
                        } else {
                            inner_callback(null);
                        }
                    }
                }
            );
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                console.log("error in async.eachSeries", error);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to Insert serviceSkillsMapping information..."
                });
            } else {
                // MongoDB logging (keeping as is)
                var userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';
                var userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;

                var ACTION_DETAILS = `${userName} has mapped new skills.`;
                var logCategory = "Service Skill Mapping";

                let actionLog = {
                    "SOURCE_ID": SERVICE_ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                mm.commitConnection(connection);
                res.status(200).json({
                    "code": 200,
                    "message": "New serviceSkillsMapping Successfully added",
                });
            }
        });
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.unMapSkills = (req, res) => {
    var SERVICE_ID = req.body.SERVICE_ID;
    var data = req.body.data;
    var STATUS = req.body.STATUS;
    var supportKey = req.headers['supportkey'];

    if (!SERVICE_ID || !data || !Array.isArray(data)) {
        return res.status(400).json({
            "code": 400,
            "message": "Missing required fields or invalid data format."
        });
    }

    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            // Using stored procedure for each item
            mm.executeDML(
                `CALL sp_serviceSkillMapping_unmapSkills(?,?,?,?)`,
                [
                    roleDetailsItem.SKILL_ID,
                    SERVICE_ID,
                    roleDetailsItem.IS_ACTIVE?1:0,
                    'M', // STATUS
                ],
                supportKey,
                connection,
                (error, results) => {
                    if (error) {
                        console.log("error in stored procedure", error);
                        inner_callback(error);
                    } else {
                        // Get the OUT parameters from stored procedure
                        const resultCode = results[0]?.RESULT_CODE || 200;
                        const resultMessage = results[0]?.RESULT_MESSAGE || 'Success';

                        if (resultCode !== 200 && resultCode !== 404) {
                            // Only error if it's not a "not found" error (404 is acceptable for unmapping)
                            inner_callback(new Error(resultMessage));
                        } else {
                            inner_callback(null);
                        }
                    }
                }
            );
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                console.log("error in async.eachSeries", error);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to update serviceSkillsMapping information..."
                });
            } else {
                // MongoDB logging (keeping as is)
                var userName = req.body.authData?.data?.UserData?.[0]?.NAME || 'Unknown';
                var userId = req.body.authData?.data?.UserData?.[0]?.USER_ID || 0;

                var ACTION_DETAILS = `${userName} has unmapped the skills.`;
                var logCategory = "Service Skill Mapping";

                let actionLog = {
                    "SOURCE_ID": SERVICE_ID,
                    "LOG_DATE_TIME": mm.getSystemDate(),
                    "LOG_TEXT": ACTION_DETAILS,
                    "CATEGORY": logCategory,
                    "CLIENT_ID": 1,
                    "USER_ID": userId,
                    "supportKey": 0
                };

                // MongoDB logging - keeping as is
                dbm.saveLog(actionLog, systemLog);

                mm.commitConnection(connection);
                res.status(200).json({
                    "code": 200,
                    "message": "Skills unmapped successfully",
                });
            }
        });
    } catch (error) {
        console.log("Error in catch", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

// Helper function to run stored procedures
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

const checkServiceSkillDuplicate = async (SERVICE_ID, SKILL_ID, ID, isEdit, supportKey, connection) => {
    const excludeId = (isEdit && ID) ? ID : null;
    const results = await runSP(
        'sp_check_service_skill_duplicate',
        [SERVICE_ID, SKILL_ID, excludeId],
        supportKey,
        connection
    );
    
    const mappingResults = results[0] || [];
    if (mappingResults.length) return "Duplicate Service–Skill mapping";
    return null;
};

exports.importServiceSkillMapping = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE, COLUMN_JSON } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });

        // Add validation for COLUMN_JSON
        if (!COLUMN_JSON || !Array.isArray(COLUMN_JSON))
            return res.status(400).json({ code: 400, message: "Missing or invalid COLUMN_JSON" });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);

        const cleanedRows = xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[1]],
            { defval: "" }   // ensures undefined cells become empty strings
        );

        // remove empty rows
        const jsonData = cleanedRows.filter(row =>
            Object.values(row).some(
                val => val !== null && val !== undefined && String(val).trim() !== ""
            )
        );
        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found" });

        // Immediate response
        res.status(200).json({
            code: 200,
            message: "Service Skill import started. Processing in background...",
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
        const isEdit = IMPORT_TYPE === "E";

        for (let start = 0; start < jsonData.length; start += chunkSize) {

            const chunk = jsonData.slice(start, start + chunkSize);

            for (const [index, row] of chunk.entries()) {
                const rowNumber = start + index + 2;
                const connection = mm.openConnection()
                try {
                    let data = {};

                    COLUMN_JSON.forEach(c => {
                        data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                    });
                    console.log("data", data)

                    if (data.SERVICE_ID && data.SHORT_CODE) {
                        let serviceName = data.SERVICE_ID.split("(Short Code:");
                        data.SERVICE_ID = serviceName[0].trim();
                        console.log("Cleaned data.SERVICE_ID:", data.SERVICE_ID, data.SHORT_CODE);
                    }
                    
                    // Get service using SP
                    const serviceDataResult = await runSP(
                        'sp_get_service_by_name_code',
                        [data.SERVICE_ID, data.SHORT_CODE],
                        supportKey,
                        connection
                    );
                    const serviceData = serviceDataResult[0] || [];

                    // Get skill using SP
                    const skillDataResult = await runSP(
                        'sp_get_skill_by_name',
                        [data.SKILL_ID],
                        supportKey,
                        connection
                    );
                    const skillData = skillDataResult[0] || [];
                    
                    if (!serviceData.length) {
                        skippedDetails.push({
                            rowNumber,
                            row,
                            reason: "The service " + data.SERVICE_ID + " does not exist"
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "The service " + data.SERVICE_ID + " does not exist" });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }
                    if (!skillData.length) {
                        skippedDetails.push({
                            rowNumber,
                            row,
                            reason: "The skill " + data.SKILL_ID + " does not exist"
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "The skill " + data.SKILL_ID + " does not exist" });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }
                    
                    data.SERVICE_ID = serviceData[0].ID;
                    data.SKILL_ID = skillData[0].ID;
                    data.CLIENT_ID = 1;
                    data.IS_ACTIVE = isEdit ? (data.IS_ACTIVE == 'Active' || data.IS_ACTIVE == "Yes" ? 1 : 0) : 1;
                    data.STATUS = 'M'

                    if (!data.SKILL_ID) {
                        skippedDetails.push({
                            rowNumber,
                            row,
                            reason: "Missing SKILL_ID"
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing SKILL_ID" });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    const dupMsg = await checkServiceSkillDuplicate(
                        data.SERVICE_ID,
                        data.SKILL_ID,
                        data.ID,
                        isEdit,
                        supportKey,
                        connection
                    );

                    if (dupMsg) {
                        skippedDetails.push({
                            rowNumber,
                            row,
                            reason: dupMsg
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: dupMsg });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    if (isEdit) {
                        if (!data.ID) {
                            skippedDetails.push({
                                rowNumber,
                                row,
                                reason: "Missing ID for update"
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing ID for update" });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Check if record exists using SP
                        const checkExistResult = await runSP(
                            'sp_get_service_skill_mapping_by_id',
                            [data.ID],
                            supportKey,
                            connection
                        );
                        const checkExist = checkExistResult[0] || [];
                        
                        if (!checkExist.length) {
                            skippedDetails.push({
                                rowNumber,
                                row,
                                reason: "No existing record found for ID " + data.ID
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "No existing record found for ID " + data.ID });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }
                        
                        delete data.SHORT_CODE
                        
                        // Update using SP
                        await runSP(
                            'sp_update_service_skill_mapping',
                            [data.ID, data.SERVICE_ID, data.SKILL_ID, data.CLIENT_ID, data.IS_ACTIVE, data.STATUS, mm.getSystemDate()],
                            supportKey,
                            connection
                        );
                        
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped new skills.`;
                        var logCategory = "Service Skill Mapping"

                        let actionLog = {
                            "SOURCE_ID": data.SERVICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        mm.commitConnection(connection)
                        dbm.saveLog(actionLog, systemLog)
                        successCount++;
                        successDetails.push({ rowNumber, row, });

                    } else {
                        delete data.SHORT_CODE
                        
                        // Insert using SP
                        await runSP(
                            'sp_insert_service_skill_mapping',
                            [data.SERVICE_ID, data.SKILL_ID, data.CLIENT_ID, data.IS_ACTIVE, data.STATUS],
                            supportKey,
                            connection
                        );
                        
                        mm.commitConnection(connection)
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped new skills.`;
                        var logCategory = "Service Skill Mapping"

                        let actionLog = {
                            "SOURCE_ID": data.SERVICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }

                        dbm.saveLog(actionLog, systemLog)

                        successCount++;
                        successDetails.push({ rowNumber, row, });
                    }

                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    console.error(`Row ${index + 2} failed:`, error.message);
                    errorDetails.push({ rowNumber: index + 2, reason: error.message });
                    errorData.push({ rowNumber: index + 2, row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                    mm.rollbackConnection(connection)
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);

            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

        const response = {
            code: 200,
            message: "Service skill mapping import process completed.",
            totalRecords: jsonData.length,
            successfulRecords: successCount,
            skippedRecords: skippedCount,
            failedRecords: errorDetails.length,
            successData: successDetails,
            skippedData: skippedDetails,
            errors: errorDetails,
            errorData: errorData,
            totalData
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
        console.error(error);
    }
};