const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')
var faqHead = "faq_head";
var viewFaqHead = "view_" + faqHead;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        STATUS: req.body.STATUS ? '1' : '0',
        PARENT_ID: req.body.PARENT_ID,
        IS_PARENT: req.body.IS_PARENT ? '1' : '0',
        PARENT_NAME: req.body.PARENT_NAME,
        CLIENT_ID: req.body.CLIENT_ID,
        SEQUENCE_NO: req.body.SEQUENCE_NO ? req.body.SEQUENCE_NO : 0,
        ORG_ID: req.body.ORG_ID,
        DESCRIPTION: req.body.DESCRIPTION,
        FAQ_HEAD_TYPE: req.body.FAQ_HEAD_TYPE
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').not().isEmpty().exists(),
        body('PARENT_ID').isInt().not().isEmpty().exists(),
        body('STATUS').not().isEmpty().exists(),
        body('IS_PARENT').not().isEmpty().exists(),
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
            setContext + 'CALL sp_faqHead_get()',
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
                    "TAB_ID": 171,
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
            'CALL sp_faqHead_create(?,?,?,?,?,?,?,?,?,?)',
            [
                data.NAME,
                data.STATUS,
                data.PARENT_ID,
                data.IS_PARENT,
                data.CLIENT_ID,
                data.SEQUENCE_NO,
                data.ORG_ID,
                data.DESCRIPTION,
                data.FAQ_HEAD_TYPE,
                data.PARENT_NAME
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to save faq head' });
                }
                else {
                    if (results[0][0].CODE == 300) {
                        return res.status(200).json({
                            code: 300,
                            "message": "Faq Head already exists..."
                        });
                    }
                    return res.status(200).json({ "code": 200, "message": 'FaqHead information saved successfully...' });
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
    const ID = req.body.ID;

    try {
        mm.executeQueryData(
            'CALL sp_faqHead_update(?,?,?,?,?,?,?,?,?,?,?)',
            [
                ID,
                data.NAME,
                data.STATUS,
                data.PARENT_ID,
                data.IS_PARENT,
                data.CLIENT_ID,
                data.SEQUENCE_NO,
                data.ORG_ID,
                data.DESCRIPTION,
                data.FAQ_HEAD_TYPE,
                data.PARENT_NAME
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    return res.status(400).json({ "code": 400, "message": 'Failed to update faq head' });
                }
                else {
                    if (results[0][0].CODE == 300) {
                        return res.status(200).json({
                            code: 300,
                            "message": "Faq Head already exists..."
                        });
                    }
                    return res.status(200).json({ "code": 200, "message": 'FaqHead information updated successfully...' });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ "code": 500, "message": 'Something went wrong.' });
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

exports.importFaqHead = async (req, res) => {
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
            message: "FaqHead import started. Processing in background...",
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

                    if (data.FAQ_HEAD_TYPE !== undefined) {
                        data.FAQ_HEAD_TYPE = data.FAQ_HEAD_TYPE == "Customer" ? 'C' : "T";
                    }

                    // Function to generate parent name using SP
                    async function generateParentName(parentId, connection) {
                        if (!parentId || parentId === 0) {
                            return "None";
                        }

                        const parentDataResult = await runSP(
                            'sp_get_parent_data',
                            [parentId],
                            supportKey,
                            connection
                        );

                        const parentData = parentDataResult[0] || [];

                        if (!parentData.length) return "None";

                        const p = parentData[0];

                        if (p.IS_PARENT == 0) return p.PARENT_NAME || " ";

                        return ((p.PARENT_NAME === " " ? p.PARENT_NAME : p.PARENT_NAME + "-") + p.NAME);
                    }

                    data.PARENT_ID = 0
                    data.CLIENT_ID = 1
                    data.IS_PARENT = 1
                    data.STATUS = data.STATUS == "Active" ? 1 : 0;
                    data.PARENT_NAME = await generateParentName(data.PARENT_ID, connection);

                    let excludeId = null;
                    if (IMPORT_TYPE == 'E') {
                        excludeId = data.ID;
                    }

                    // Check if FAQ Head already exists using SP
                    const checkFaqHeadExistResult = await runSP(
                        'sp_check_faq_head_exists',
                        [data.NAME, data.FAQ_HEAD_TYPE, excludeId],
                        supportKey,
                        connection
                    );

                    const checkFaqHeadExist = checkFaqHeadExistResult[0] || [];

                    if (checkFaqHeadExist.length) {
                        skippedDetails.push({
                            rowNumber: rowNumber,
                            row,
                            reason: `FaqHead is already exist for NAME ${data.NAME} and faq head type ${data.FAQ_HEAD_TYPE == "T" ? "Technician" : "Customer"}`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `FaqHead is already exist for NAME ${data.NAME} and faq head type ${data.FAQ_HEAD_TYPE == "T" ? "Technician" : "Customer"}` });
                        skippedCount++;
                        mm.rollbackConnection(connection)
                        continue;
                    }

                    if (!isEdit) {
                        if (!data.SEQUENCE_NO) {
                            // AUTO GENERATE SEQUENCE_NO using SP
                            const seqNoResult = await runSP(
                                'sp_get_max_faq_head_seq_no',
                                [],
                                supportKey,
                                connection
                            );

                            const seqRes = seqNoResult[0] || [];
                            data.SEQUENCE_NO = seqRes[0].NEXT_NO;
                            console.log("Assigned Values:", { SEQUENCE_NO: data.SEQUENCE_NO });
                        }

                        data.STATUS = 1

                        // Insert using SP
                        await runSP(
                            'sp_insert_faq_heads',
                            [
                                data.NAME, data.FAQ_HEAD_TYPE, data.SEQUENCE_NO,
                                data.STATUS, data.CLIENT_ID, data.PARENT_ID,
                                data.IS_PARENT, data.PARENT_NAME
                            ],
                            supportKey,
                            connection
                        );

                        successCount++;
                        successDetails.push({ rowNumber: rowNumber, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                        mm.commitConnection(connection)
                        continue;
                    }
                    else {
                        if (!data.ID) {
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `ID is required for update`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "ID is required for update" });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Check if FAQ Head exists by ID using SP
                        const faqHeadExistResult = await runSP(
                            'sp_get_faq_head_by_id',
                            [data.ID],
                            supportKey,
                            connection
                        );

                        const faqHeadExist = faqHeadExistResult[0] || [];

                        if (!faqHeadExist.length) {
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `FaqHead does not exist for ID ${data.ID}`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "FaqHead does not exist for ID " + data.ID + " " });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        // Check sequence number duplicate using SP
                        const faqSeqExistResult = await runSP(
                            'sp_check_faq_head_seq_no_exists',
                            [data.SEQUENCE_NO, data.ID],
                            supportKey,
                            connection
                        );

                        const faqSeqExist = faqSeqExistResult[0] || [];

                        if (faqSeqExist.length) {
                            skippedDetails.push({
                                rowNumber: rowNumber,
                                row,
                                reason: `The sequence number ${data.SEQUENCE_NO} already exists for name ${faqSeqExist[0].NAME}.`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: `The sequence number ${data.SEQUENCE_NO} already exists for name ${faqSeqExist[0].NAME}.` });
                            skippedCount++;
                            mm.rollbackConnection(connection)
                            continue;
                        }

                        let setData = "";
                        let recordData = [];

                        Object.keys(data).forEach(key => {
                            if (key !== "ID" && data[key] !== undefined) {
                                setData += `${key} = '${data[key]}', `;
                            }
                        });

                        setData = setData.slice(0, -2);

                        let finalQuery = `UPDATE faq_head SET ${setData}, CREATED_MODIFIED_DATE = '${mm.getSystemDate()}' WHERE ID = ${data.ID}`;
                        recordData.push(mm.getSystemDate());
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

                        mm.commitConnection(connection)
                        successCount++;
                        successDetails.push({ rowNumber: rowNumber, row });
                        totalData.push({ ...row, IMPORT_STATUS: "Success" });
                    }
                } catch (error) {
                    mm.rollbackConnection(connection)
                    console.error(`Row ${rowNumber} failed:`, error.message);
                    errorDetails.push({ rowNumber: rowNumber, reason: error.message });
                    errorData.push({ rowNumber: rowNumber, row, reason: error.message });
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
            message: "Faqhead import process completed.",
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
        console.log(error);
        return res.status(500).json({
            code: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
};









