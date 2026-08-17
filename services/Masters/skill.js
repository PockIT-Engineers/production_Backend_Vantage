const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
const applicationkey = process.env.APPLICATION_KEY;
var skillMaster = "skill_master";
var viewSkillMaster = "view_" + skillMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        DESCRIPTION: req.body.DESCRIPTION,
        CLIENT_ID: req.body.CLIENT_ID,
        SEQ_NO: req.body.SEQ_NO
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
                setContext + `CALL sp_skillMaster_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get skill count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 94,
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
            `CALL sp_skillMaster_create(?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.IS_ACTIVE,
                data.DESCRIPTION,
                data.CLIENT_ID,
                data.SEQ_NO,
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
                        "message": "Failed to save Skill information..."
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
                var ACTION_DETAILS = `User ${userName} has created a new skill ${data.NAME}`;
                var logCategory = "Skill";

                let actionLog = {
                    "SOURCE_ID": resultData.SKILL_ID,
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
                    "message": "Skill information saved successfully...",
                    "SKILL_ID": resultData.SKILL_ID
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
            `CALL sp_skillMaster_update(?,?,?,?,?,?,?,?)`,
            [
                id,
                data.NAME,
                data.IS_ACTIVE,
                data.DESCRIPTION,
                data.CLIENT_ID,
                data.SEQ_NO,
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
                        "message": "Failed to update skill information."
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
                var ACTION_DETAILS = `User ${userName} has updated the details of ${data.NAME}`;
                var logCategory = "Skill";

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
                    "message": "Skill information updated successfully...",
                    "SKILL_ID": resultData.SKILL_ID
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

exports.unmappedSkills = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let ID = req.body.ID ? req.body.ID : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_ID = '${ID}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (!ID) {
        return res.status(400).json({
            "code": 400,
             "message": "Technician ID is required."
        });
    }

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(
                setContext + `CALL sp_skillMaster_getUnmapped()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get skill count.",
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];

                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 94,
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


exports.importSkill = async (req, res) => {
    try {
        const supportKey = req.headers["supportkey"];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing EXCEL_FILE_NAME" });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "Excel file is empty" });

        res.status(200).json({
            code: 200,
            message: "Skill import started. Processing in background...",
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
        const isEdit = IMPORT_TYPE === "E";

        for (let start = 0; start < jsonData.length; start += chunkSize) {

            const chunk = jsonData.slice(start, start + chunkSize);

            for (let index = 0; index < chunk.length; index++) {
                const row = chunk[index];
                const rowNumber = start + index + 2;
                const connection = mm.openConnection()
                try {
                    let data = {};

                    COLUMN_JSON.forEach(c => {
                        data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null;
                    });
                    
                    if (isEdit) {
                        data.IS_ACTIVE = data.IS_ACTIVE == 'Active' ? 1 : 0;
                    } else {
                        data.IS_ACTIVE = 1;
                    }
                    data.CLIENT_ID = 1
                    
                    if (!data.NAME) {
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: "Name is required",
                        });
                        skippedCount++;
                        totalData.push({
                            ...row,
                            IMPORT_STATUS: "Skipped",
                            reason: "Name is required"
                        });
                        mm.rollbackConnection(connection)
                        continue;
                    }
                    data.NAME = data.NAME.toString().trim();

                    let excludeId = null;
                    if (isEdit) {
                        if (!data.ID) {
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: "Missing skill ID",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing skill ID" });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }
                        excludeId = data.ID;
                    }

                    // Check for duplicate skill using SP
                    const duplicateResult = await runSP(
                        'sp_check_skill_duplicate',
                        [data.NAME, excludeId],
                        supportKey,
                        connection
                    );
                    
                    const duplicateData = duplicateResult[0] || [];
                    
                    if (!isEdit) {
                        if (duplicateData.length) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: "Skill name already exists",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Skill name already exists" });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }
                        
                        // Insert skill using SP
                        const insertResult = await runSP(
                            'sp_insert_skill',
                            [data.NAME, data.DESCRIPTION, data.IS_ACTIVE, data.CLIENT_ID],
                            supportKey,
                            connection
                        );
                        
                        const insertId = insertResult[0][0].insertId;
                        mm.commitConnection(connection)
                        
                        dbm.saveLog({
                            SOURCE_ID: insertId,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: `Skill created via Excel import: ${data.NAME}`,
                            CATEGORY: "skill",
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            supportKey: 0
                        }, systemLog);
                    }
                    else {
                        // Check if skill exists using SP
                        const existingResult = await runSP(
                            'sp_get_skill_by_id',
                            [data.ID],
                            supportKey,
                            connection
                        );
                        
                        const existingData = existingResult[0] || [];

                        if (existingData.length == 0) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: "Skill ID does not exist",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Skill ID does not exist" });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        if (data.DESCRIPTION == null) {
                            data.DESCRIPTION = null;
                        }

                        if (duplicateData.length) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: "Skill name already exists",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Skill name already exists" });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Update skill using SP
                        await runSP(
                            'sp_update_skill',
                            [data.ID, data.NAME, data.DESCRIPTION, data.IS_ACTIVE, data.CLIENT_ID, mm.getSystemDate()],
                            supportKey,
                            connection
                        );
                        
                        mm.commitConnection(connection)
                        
                        dbm.saveLog({
                            SOURCE_ID: data.ID,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: `Skill updated via Excel import: ${data.NAME}`,
                            CATEGORY: "skill",
                            CLIENT_ID: 1,
                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                            supportKey: 0
                        }, systemLog);
                    }
                    
                    successCount++;
                    successDetails.push({ rowNumber: index + 2, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (error) {
                    mm.rollbackConnection(connection)
                    console.error(`Row ${index + 2} failed:`, error);
                    errorDetails.push({ rowNumber: index + 2, reason: error.message });
                    errorData.push({ rowNumber: index + 2, row, reason: error.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: error.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);

            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, {
                PROGRESS: progress,
                STATUS: "Processing"
            });
        }

        let response = {
            code: 200,
            message: "Skill import process completed.",
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
        console.log(error);
    }
};
