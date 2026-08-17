const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var faqMaster = "faq_master";
var viewFaqMaster = "view_" + faqMaster;
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')


function reqData(req) {
    var data = {
        FAQ_HEAD_ID: req.body.FAQ_HEAD_ID,
        QUESTION: req.body.QUESTION,
        ANSWER: req.body.ANSWER,
        ORG_ID: req.body.ORG_ID,
        SEQ_NO: req.body.SEQ_NO,
        POSITIVE_COUNT: req.body.POSITIVE_COUNT ? req.body.POSITIVE_COUNT : 0,
        NEGATIVE_COUNT: req.body.NEGATIVE_COUNT ? req.body.NEGATIVE_COUNT : 0,
        URL: req.body.URL,
        TAGS: req.body.TAGS,
        STATUS: req.body.STATUS ? '1' : '0',
        NEGATIVE_FLAG: req.body.NEGATIVE_FLAG ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        FAQ_TYPE: req.body.FAQ_TYPE
    }
    return data;
}

exports.validate = function () {
    return [
        body('FAQ_HEAD_ID').isInt(),
        body('QUESTION', ' parameter missing').exists(),
        body('ANSWER', ' parameter missing').exists(),
        body('SEQ_NO').isInt(),
        body('POSITIVE_COUNT').isInt().optional(),
        body('NEGATIVE_COUNT').isInt().optional(),
        body('URL', ' parameter missing').optional(),
        body('TAGS', ' parameter missing').optional(),
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
            setContext + 'CALL sp_faqMaster_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 172,
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

exports.create = async (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            'CALL sp_faq_create(?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                data.FAQ_HEAD_ID,
                data.QUESTION,
                data.ANSWER,
                data.ORG_ID,
                data.SEQ_NO,
                data.POSITIVE_COUNT || 0,
                data.NEGATIVE_COUNT || 0,
                data.URL,
                data.TAGS,
                data.STATUS ? 1 : 0,
                data.NEGATIVE_FLAG ? 1 : 0,
                data.CLIENT_ID,
                data.FAQ_TYPE
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to save faq information...' });
                }
                else {
                    if (results[0][0].CODE == 300) {
                        return res.status(200).json({
                            code: 300,
                            "message": "Faq already exists..."
                        });
                    }
                    return res.status(200).json({ "code": 200, "message": 'Faq information saved successfully...' });
                }
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": 'Something went wrong.' });
    }
};

exports.update = async (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            'CALL sp_faq_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                req.body.ID,
                data.FAQ_HEAD_ID,
                data.QUESTION,
                data.ANSWER,
                data.ORG_ID,
                data.SEQ_NO,
                data.POSITIVE_COUNT,
                data.NEGATIVE_COUNT,
                data.URL,
                data.TAGS,
                data.STATUS,
                data.NEGATIVE_FLAG,
                data.CLIENT_ID,
                data.FAQ_TYPE
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to update faq information...' });
                }
                else {
                    if (results[0][0].CODE == 300) {
                        return res.status(200).json({
                            code: 300,
                            "message": "Faq already exists..."
                        });
                    }
                    return res.status(200).json({ "code": 200, "message": 'Faq information updated successfully...' });
                }
            }
        );
    } catch (error) {
        console.log("Error in catch", error)
        res.status(500).json({ "code": 500, "message": 'Something went wrong.' });
    }
};

exports.markHelpfulCount = async (req, res) => {
    const FAQ_ID = req.body.FAQ_ID;
    const TYPE = req.body.TYPE;
    const supportKey = req.headers['supportkey'];

    if (!FAQ_ID || !TYPE) {
        return res.status(400).json({
            "message": "FAQ_ID or TYPE is missing"
        });
    }

    try {

        mm.executeQueryData(
            'CALL sp_faq_mark_helpful(?, ?)',
            [FAQ_ID, TYPE],
            supportKey,
            (error, results) => {
                if (error) {
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update helpful count"
                    });
                }

                if (TYPE === 'N') {
                    require('./faqResponse').create(req, res);
                } else {
                    return res.status(200).json(results[0][0]);
                }
            }
        );
    } catch (error) {
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};

exports.searchFaq = (req, res) => {
    var TAGS = req.body.TAGS;
    var QUESTION = req.body.QUESTION;
    const supportKey = req.headers['supportkey'];
    const setContext = `
        SET @v_TAGS = '${TAGS}';
        SET @v_QUESTION = '${QUESTION}';
    `;
    try {
        mm.executeQueryData(
            setContext + 'CALL sp_faqMaster_searchFaq()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 172,
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

exports.importFaq = async (req, res) => {
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
                const connection = mm.openConnection()
                try {
                    let data = {};
                    COLUMN_JSON.forEach(col => {
                        data[col.TABLE_FIELD] = row[col.EXCEL_FIELD] !== undefined ? row[col.EXCEL_FIELD] : null;
                    });

                    if (IMPORT_TYPE == 'E') {
                        data.STATUS = data.STATUS == 'Active' ? 1 : 0;
                    } else {
                        data.STATUS = 1
                    }
                    if (data.FAQ_TYPE !== undefined) {
                        data.FAQ_TYPE = data.FAQ_TYPE == "Customer" ? 'C' : "T";
                    }

                    data.CLIENT_ID = 1;
                    data.NEGATIVE_COUNT = 0;
                    data.POSITIVE_COUNT = 0;
                    data.NEGATIVE_FLAG = 0;

                    // Check FAQ head exists using SP
                    const existingHeadResult = await runSP(
                        'sp_get_faq_head_by_name',
                        [data.FAQ_HEAD_NAME],
                        supportKey,
                        connection
                    );

                    const existingHead = existingHeadResult[0] || [];

                    if (existingHead.length == 0) {
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `Faq head not exist`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Faq head not exist` });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    data.FAQ_HEAD_ID = existingHead[0].ID;

                    let idFilter = '';
                    let excludeId = null;
                    if (IMPORT_TYPE == 'E') {
                        excludeId = data.ID;
                    }

                    delete data.FAQ_HEAD_NAME;

                    // Check if FAQ already exists using SP
                    const checkFaqExistResult = await runSP(
                        'sp_check_faq_exists',
                        [data.QUESTION, data.FAQ_TYPE, excludeId],
                        supportKey,
                        connection
                    );

                    const checkFaqExist = checkFaqExistResult[0] || [];

                    if (checkFaqExist.length) {
                        console.log("checkFaqExist", checkFaqExist)
                        skippedDetails.push({
                            rowNumber: index + 2,
                            row,
                            reason: `Faq is already exist for question ${data.QUESTION} and faq type ${data.FAQ_TYPE == "T" ? "Technician" : "Customer"}`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Faq is already exist for question ${data.QUESTION} and faq type ${data.FAQ_TYPE == "T" ? "Technician" : "Customer"}` });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    if (IMPORT_TYPE == 'E') {
                        if (!data.ID) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: "Missing faq ID",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing faq ID" });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Check if FAQ exists by ID using SP
                        const existingFaqResult = await runSP(
                            'sp_get_faq_by_id',
                            [data.ID],
                            supportKey,
                            connection
                        );

                        const existingFaq = existingFaqResult[0] || [];

                        if (existingFaq.length == 0) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: `Faq not exists for ID ${data.ID}`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `Faq not exists for ID ${data.ID}` });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Check sequence number duplicate using SP
                        const faqSeqExistResult = await runSP(
                            'sp_check_faq_seq_no_exists',
                            [data.SEQ_NO, data.ID],
                            supportKey,
                            connection
                        );

                        const faqSeqExist = faqSeqExistResult[0] || [];

                        if (faqSeqExist.length) {
                            skippedDetails.push({
                                rowNumber: index + 2,
                                row,
                                reason: `The sequence number ${data.SEQ_NO} already exists for question ${faqSeqExist[0].QUESTION}.`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `The sequence number ${data.SEQ_NO} already exists for question ${faqSeqExist[0].QUESTION}.` });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }
                        else {
                            // Dynamic update using sp_executeDynamicQuery
                            let setData = "";
                            let recordData = [];

                            Object.keys(data).forEach(key => {
                                if (key !== "ID" && data[key] !== undefined) {
                                    setData += `${key} = '${data[key]}', `;
                                }
                            });

                            setData = setData.slice(0, -2);

                            let finalQuery = `UPDATE faq_master SET ${setData}, CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${data.ID}`;
                            recordData.push(systemDate);
                            recordData.push(data.ID);
                            await new Promise((resolve, reject) => {
                                mm.executeDML(
                                    `CALL sp_executeDynamicQuery(?)`,
                                    [finalQuery],
                                    supportKey,
                                    connection,
                                    (e) => e ? reject(e) : resolve()
                                );
                            });
                        }
                    }
                    else {
                        if (!data.SEQ_NO) {
                            // AUTO GENERATE SEQ_NO using SP
                            const seqNoResult = await runSP(
                                'sp_get_max_faq_seq_no',
                                [],
                                supportKey,
                                connection
                            );

                            const seqRes = seqNoResult[0] || [];
                            data.SEQ_NO = seqRes[0].NEXT_NO;
                            console.log("Assigned Values:", { SEQ_NO: data.SEQ_NO });
                        }

                        // Insert using SP
                        await runSP(
                            'sp_insert_faq',
                            [
                                data.FAQ_HEAD_ID, data.QUESTION, data.ANSWER, data.FAQ_TYPE,
                                data.SEQ_NO, data.STATUS, data.CLIENT_ID,
                                data.NEGATIVE_COUNT, data.POSITIVE_COUNT, data.NEGATIVE_FLAG
                            ],
                            supportKey,
                            connection
                        );
                    }

                    delete data.CLIENT_ID;
                    mm.commitConnection(connection)
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
            message: "Faq import process completed.",
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
        const filePathn = path.join(
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
        fs.writeFileSync(filePathn, JSON.stringify(response, null, 2), "utf8");

    } catch (error) {
        console.error("Error importing Excel file:", error);
    }
};