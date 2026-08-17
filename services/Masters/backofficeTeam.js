const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
var backofficeTeamMaster = "backoffice_team_master";
var viewBackofficeTeamMaster = "view_" + backofficeTeamMaster;
const systemLog = require("../../modules/systemLog")
const excelMaster = require("../../modules/excelImportMaster");
const xlsx = require('xlsx')


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        ROLE_ID: req.body.ROLE_ID,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        EMAIL_ID: req.body.EMAIL_ID,
        PASSWORD: req.body.PASSWORD,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        ORG_ID: req.body.ORG_ID,
        CAN_CHANGE_SERVICE_PRICE: req.body.CAN_CHANGE_SERVICE_PRICE ? '1' : '0',
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        REPORTING_HEAD_ID: req.body.REPORTING_HEAD_ID,
        REPORTING_HEAD_NAME: req.body.REPORTING_HEAD_NAME
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('ROLE_ID').isInt().optional(),
        body('MOBILE_NUMBER').optional(),
        body('EMAIL_ID').optional(),
        body('DOB').optional(),
        body('GENDER').optional(),
        body('ADDRESS_LINE1').optional(),
        body('ADDRESS_LINE2').optional(),
        body('CITY_ID').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('PASSWORD').optional(),
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
        if (IS_FILTER_WRONG !== "0") {
            return res.send({
                "code": 400,
                "message": "Invalid filter parameter."
            });
        }


        mm.executeQueryData(
            setContext + 'CALL sp_backofficeTeam_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400, "message": 'Failed to fetch team' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 2,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.send({ "code": 500, "message": 'Something went wrong' });
    }
};

exports.create = async (req, res) => {
    const errors = validationResult(req);
    const data = reqData(req)
    // data.PASSWORD = md5(data.PASSWORD);
    data.PASSWORD = await mm.hashPassword(data.PASSWORD);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ "code": 422, "message": errors.errors });
    }

    try {

        mm.executeQueryData(
            'CALL sp_backofficeTeam_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                data.NAME,
                data.ROLE_ID,
                data.MOBILE_NUMBER,
                data.EMAIL_ID,
                data.PASSWORD,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                data.COUNTRY_CODE,
                data.VENDOR_ID,
                data.ORG_ID,
                data.CAN_CHANGE_SERVICE_PRICE,
                data.PROFILE_PHOTO,
                data.REPORTING_HEAD_ID,
                data.REPORTING_HEAD_NAME
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.send({
                        "code": 400,
                        "message": "Failed to save branch information."
                    });
                }

                return res.send(
                    { "code": 200, "message": 'Team created successfully' }
                );
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.send({ "code": 500, "message": 'Something went wrong' });
    }
};

exports.createTeam = async (req, res) => {

    var data = reqData(req);
    // data.PASSWORD = md5(data.PASSWORD);
    data.PASSWORD =await mm.hashPassword(data.PASSWORD);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.send({ "code": 422, "message": errors.errors });
    }

    try {

        mm.executeQueryData(
            'CALL sp_backofficeTeam_createTeam(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                data.NAME,
                data.ROLE_ID,
                data.MOBILE_NUMBER,
                data.EMAIL_ID,
                data.PASSWORD,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                data.COUNTRY_CODE,
                data.VENDOR_ID,
                data.ORG_ID,
                data.CAN_CHANGE_SERVICE_PRICE,
                data.PROFILE_PHOTO,
                data.REPORTING_HEAD_ID,
                data.REPORTING_HEAD_NAME
            ],
            supportKey,
            async (error, result) => {
                if (error) {
                    console.log("error", error)
                    return res.send({ "code": 400, "message": 'Failed to create team' });
                }
                if (result[0][0].code == 300) {
                    return res.send(result[0][0]);
                }

                const USER_ID = result[0][0].USER_ID;
                const TEAM_ID = result[0][0].TEAM_ID;

                mm.sendDynamicEmail(4, TEAM_ID, supportKey)
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has successfully created the Back Office team member ${data.NAME}.`;

                var logCategory = "backofficeTeam"
                let actionLog = {
                    "SOURCE_ID": TEAM_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                addGlobalData(TEAM_ID, supportKey)
                const chanelData1 = {
                    CHANNEL_NAME: 'backoffice_channel',
                    USER_ID: USER_ID,
                    TYPE: "B",
                    STATUS: true,
                    USER_NAME: data.NAME,
                    CLIENT_ID: data.CLIENT_ID,
                    DATE: mm.getSystemDate()
                }
                const chanel1 = new channelSubscribedUsers(chanelData1);
                chanel1.save()
                const chanelData2 = {
                    CHANNEL_NAME: 'system_alerts_channel',
                    USER_ID: USER_ID,
                    TYPE: "B",
                    STATUS: true,
                    USER_NAME: data.NAME,
                    CLIENT_ID: data.CLIENT_ID,
                    DATE: mm.getSystemDate()
                }
                const chanel2 = new channelSubscribedUsers(chanelData2);
                chanel2.save()
                if (data.ROLE_ID == 22 || data.ROLE_ID == 21 || data.ROLE_ID == 20 || data.ROLE_ID == 8 || data.ROLE_ID == 5 || data.ROLE_ID == 4 || data.ROLE_ID == 3 || data.ROLE_ID == 2 || data.ROLE_ID == 1) {
                    const chanelData3 = {
                        CHANNEL_NAME: 'backoffice_chat_channel',
                        USER_ID: USER_ID,
                        TYPE: "B",
                        STATUS: true,
                        USER_NAME: data.NAME,
                        CLIENT_ID: data.CLIENT_ID,
                        DATE: mm.getSystemDate()
                    }
                    const chanel3 = new channelSubscribedUsers(chanelData3);
                    chanel3.save()
                }
                var wBparams = [{ "type": "text", "text": data.NAME }, { "type": "text", "text": data.EMAIL_ID }]
                var templateName = "welcome_backoffice_teamwelcome_backoffice_team"
                var wparams = [{ "type": "body", "parameters": wBparams }]
                mm.sendWAToolSMS(data.MOBILE_NUMBER, templateName, wparams, 'En', (error, resultswsms) => {
                    if (error) {
                        console.log(error)
                    }
                    else {
                        console.log("Successfully send SMS", resultswsms)
                    }
                })
                return res.send({
                    "code": 200,
                    "message": "ServiceItem information updated and logged successfully."
                });
            }
        );
    } catch (e) {
        console.log("Error in catch", e)
        res.send({ "code": 500, "message": 'Something went wrong' });
    }
};

exports.update = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const errors = validationResult(req);
    var data = reqData(req);
    delete data.PASSWORD;
    if (!errors.isEmpty()) {
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {


        mm.executeQueryData(
            'CALL sp_backofficeTeam_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                req.body.ID,
                data.NAME,
                data.ROLE_ID,
                data.MOBILE_NUMBER,
                data.EMAIL_ID,
                data.PASSWORD,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                data.COUNTRY_CODE,
                data.VENDOR_ID,
                data.ORG_ID,
                data.CAN_CHANGE_SERVICE_PRICE,
                data.PROFILE_PHOTO,
                data.REPORTING_HEAD_ID,
                data.REPORTING_HEAD_NAME
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log("error", error)
                    return res.send({
                        "code": 400,
                        "message": 'Failed to update backoffice team'
                    });
                }

                res.send({
                    "code": 200,
                    "message": 'Backoffice team updated successfully'
                });
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        res.send({
            "code": 500,
            "message": 'Something went wrong'
        });
    }
};

exports.updateTeam = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const errors = validationResult(req);
    var data = reqData(req);
    let ID = req.body.ID;
    delete data.PASSWORD;
    if (!errors.isEmpty()) {
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {

        mm.executeQueryData(
            'CALL sp_backofficeTeam_updateTeam(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                ID,
                data.NAME,
                data.ROLE_ID,
                data.MOBILE_NUMBER,
                data.EMAIL_ID,
                data.PASSWORD,
                data.IS_ACTIVE,
                data.CLIENT_ID,
                data.COUNTRY_CODE,
                data.VENDOR_ID,
                data.ORG_ID,
                data.CAN_CHANGE_SERVICE_PRICE,
                data.PROFILE_PHOTO,
                data.REPORTING_HEAD_ID,
                data.REPORTING_HEAD_NAME],
            supportKey,
            async (error, result) => {

                if (error) {
                    console.log("error", error)
                    return res.send({
                        "code": 400,
                        "message": 'Failed to update backoffice team'
                    });
                }

                if (result[0][0].code === 300) {
                    return res.send(result[0][0]);
                }

                const USER_ID = result[0][0].USER_ID;
                addGlobalData(req.body.ID, supportKey)
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has successfully updated the details of ${data.NAME}.`;
                var logCategory = "backofficeTeam"

                let actionLog = {
                    "SOURCE_ID": req.body.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)

                var existingChannel = await channelSubscribedUsers.findOne({
                    CHANNEL_NAME: 'backoffice_channel',
                    USER_ID: USER_ID
                });
                if (!existingChannel) {
                    const chanelData1 = {
                        CHANNEL_NAME: 'backoffice_channel',
                        USER_ID: USER_ID,
                        TYPE: "B",
                        STATUS: true,
                        USER_NAME: data.NAME,
                        CLIENT_ID: data.CLIENT_ID,
                        DATE: mm.getSystemDate()
                    }
                    const chanel1 = new channelSubscribedUsers(chanelData1);
                    chanel1.save()
                }

                var existingChannel = await channelSubscribedUsers.findOne({
                    CHANNEL_NAME: 'system_alerts_channel',
                    USER_ID: USER_ID
                });
                if (!existingChannel) {
                    const chanelData2 = {
                        CHANNEL_NAME: 'system_alerts_channel',
                        USER_ID: USER_ID,
                        TYPE: "B",
                        STATUS: true,
                        USER_NAME: data.NAME,
                        CLIENT_ID: data.CLIENT_ID,
                        DATE: mm.getSystemDate()
                    }
                    const chanel2 = new channelSubscribedUsers(chanelData2);
                    chanel2.save()
                }
                if (data.ROLE_ID == 22 || data.ROLE_ID == 21 || data.ROLE_ID == 20 || data.ROLE_ID == 8 || data.ROLE_ID == 7 || data.ROLE_ID == 5 || data.ROLE_ID == 4 || data.ROLE_ID == 3 || data.ROLE_ID == 2 || data.ROLE_ID == 1) {
                    var existingChannel = await channelSubscribedUsers.findOne({
                        CHANNEL_NAME: 'backoffice_chat_channel',
                        USER_ID: USER_ID
                    });
                    console.log("existingChannel", existingChannel)
                    if (!existingChannel) {
                        const chanelData1 = {
                            CHANNEL_NAME: 'backoffice_chat_channel',
                            USER_ID: USER_ID,
                            TYPE: "B",
                            STATUS: true,
                            USER_NAME: data.NAME,
                            CLIENT_ID: data.CLIENT_ID,
                            DATE: mm.getSystemDate()
                        }
                        const chanel1 = new channelSubscribedUsers(chanelData1);
                        chanel1.save()
                    }
                }
                return res.send(result[0][0]);
            }
        );

    } catch (error) {
        console.log("Error in catch", error)
        return res.send({
            "code": 500,
            "message": 'Something went wrong'
        });
    }
};

function addGlobalData(data_Id, supportKey) {
    try {
        var pageIndex = 0;
        var pageSize = 0;
        let sortKey = 'ID';
        let sortValue = 'DESC';
        let filter = ` AND ID=${data_Id}`;

        filter = (filter || '').trim();
        const safeFilter = (filter || '').replace(/'/g, "\\'");

        const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex};
        SET @v_PAGE_SIZE = ${pageSize};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
        mm.executeQueryData(setContext + ' CALL sp_backofficeTeam_get()', [], supportKey, (error, results1) => {
            if (error) {
                console.log(error);
            }
            else {
                const resultSets = results1.filter(r => Array.isArray(r));
                const results5 = resultSets[1] || [];
                console.log("data retrieved BACKOFFICE TEAM",results5);
                if (results5.length > 0) {
                    // require('../global').addDatainGlobal(data_Id, "Vendor", results5[0].NAME, JSON.stringify(results5[0]), "/masters/vendor_master", 0, supportKey)
                    let logData = { ID: data_Id, CATEGORY: "BackofficeTeam", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/backoffice", TERRITORY_ID: 0 };
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
                console.log("error", error)
                mm.rollbackConnection(connection)
                reject(error);
            }
            else resolve(results);
        });
    });
};

const checkDuplicate = async (data, isEdit, supportKey, connection) => {
    let userDup, teamDup;

    if (isEdit) {
        userDup = await runQuery(
            `CALL sp_check_user_duplicate(?, ?, ?)`,
            [data.EMAIL_ID, data.ID, true],
            supportKey,
            connection
        );

        teamDup = await runQuery(
            `CALL sp_check_team_duplicate(?, ?, ?, ?)`,
            [data.EMAIL_ID, data.MOBILE_NUMBER, data.ID, true],
            supportKey,
            connection
        );
    } else {
        userDup = await runQuery(
            `CALL sp_check_user_duplicate(?, ?, ?)`,
            [data.EMAIL_ID, null, false],
            supportKey,
            connection
        );

        teamDup = await runQuery(
            `CALL sp_check_team_duplicate(?, ?, ?, ?)`,
            [data.EMAIL_ID, data.MOBILE_NUMBER, null, false],
            supportKey,
            connection
        );
    }

    // Extract results from stored procedure calls
    const userResult = userDup && userDup[0] ? userDup[0] : [];
    const teamResult = teamDup && teamDup[0] ? teamDup[0] : [];

    if (!userResult.length && !teamResult.length) return null;

    // Mobile is optional — only treat it as a duplicate criterion when provided.
    const mobileMatch = !!data.MOBILE_NUMBER && teamResult.some(t => t.MOBILE_NUMBER === data.MOBILE_NUMBER);

    if (userResult.length && mobileMatch)
        return "Email ID and mobile number already exist";

    if (userResult.length) return "Email ID already exists";
    if (mobileMatch) return "Mobile number already exists";

    // With no mobile provided, don't flag leftover mobile-based matches as duplicates.
    return data.MOBILE_NUMBER ? "Duplicate record" : null;
};

exports.importTeam = async (req, res) => {
    try {
        const supportKey = req.headers['supportkey'];
        const { COLUMN_JSON, EXCEL_FILE_NAME, id: EXCEL_MASTER_ID, IMPORT_TYPE } = req.body;

        if (!EXCEL_FILE_NAME)
            return res.status(400).json({ code: 400, message: "Missing parameter: EXCEL_FILE_NAME." });

        const workbook = xlsx.readFile(`./uploads/ExcelFiles/${EXCEL_FILE_NAME}`);
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

        if (!jsonData.length)
            return res.status(200).json({ code: 200, message: "No data found in the Excel file.", EXCEL_MASTER_ID: EXCEL_MASTER_ID });

        res.status(200).json({ code: 200, message: "Import started. Processing in background...", EXCEL_MASTER_ID: EXCEL_MASTER_ID });

        let successCount = 0,
            skippedCount = 0,
            successDetails = [],
            errorDetails = [],
            errorData = [],
            skippedDetails = [],
            totalData = [];

        const chunkSize = 5;

        for (let start = 0; start < jsonData.length; start += chunkSize) {
            const chunk = jsonData.slice(start, start + chunkSize);

            for (const [index, row] of chunk.entries()) {
                const connection = mm.openConnection();
                let rowNum = start + index + 2;

                try {
                    const data = {};
                    COLUMN_JSON.forEach(c => data[c.TABLE_FIELD] = row[c.EXCEL_FIELD] ?? null);

                    if (data.CAN_CHANGE_SERVICE_PRICE !== undefined) {
                        data.CAN_CHANGE_SERVICE_PRICE = data.CAN_CHANGE_SERVICE_PRICE == 'Yes' ? 1 : 0;
                    }

                    if (IMPORT_TYPE === "E") {
                        data.IS_ACTIVE = data.IS_ACTIVE == 'Active' ? 1 : 0;
                    } else {
                        data.IS_ACTIVE = 1;
                    }

                    data.PASSWORD = "Ovationwps@123";
                    data.COUNTRY_CODE = data.COUNTRY_CODE || '+91';

                    if (!data.NAME || !data.EMAIL_ID) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNum,
                            row,
                            reason: "Missing required fields",
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Missing required fields" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    const isEdit = IMPORT_TYPE === "E";

                    // Get role using SP
                    const roleResult = await runQuery(
                        `CALL sp_get_role_by_name(?)`,
                        [data.ROLE_NAME],
                        supportKey,
                        connection
                    );

                    const getrole = roleResult && roleResult[0] ? roleResult[0] : [];

                    if (getrole.length == 0) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNum,
                            row,
                            reason: `'${data.ROLE_NAME}' role not exists`,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "This role not exists" });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    data.ROLE_ID = getrole[0].ID;

                    // Check duplicates using SP
                    const duplicateReason = await checkDuplicate(data, isEdit, supportKey, connection);
                    if (duplicateReason) {
                        skippedCount++;
                        skippedDetails.push({
                            rowNumber: rowNum,
                            row,
                            reason: duplicateReason,
                        });
                        totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: duplicateReason });
                        mm.rollbackConnection(connection);
                        continue;
                    }

                    delete data.ROLE_NAME;
                    data.ORG_ID = 1;

                    if (isEdit) {
                        if (!data.ID) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNum,
                                row,
                                reason: "ID is required for update",
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "ID is required for update" });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Check if team exists using SP
                        const teamResult = await runQuery(
                            `CALL sp_get_backoffice_team_by_id(?)`,
                            [data.ID],
                            supportKey,
                            connection
                        );

                        const getData = teamResult && teamResult[0] ? teamResult[0] : [];

                        if (!getData.length) {
                            skippedCount++;
                            skippedDetails.push({
                                rowNumber: rowNum,
                                row,
                                reason: `Backoffice team does not exist for ID ${data.ID}`,
                            });
                            totalData.push({ ...row, IMPORT_STATUS: "Skipped", reason: "Backoffice team does not exist for ID " + data.ID + " " });
                            mm.rollbackConnection(connection);
                            continue;
                        }

                        // Update backoffice team using SP
                        await runQuery(
                            `CALL sp_update_backoffice_team(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.ID,
                                data.NAME,
                                data.EMAIL_ID,
                                data.MOBILE_NUMBER,
                                data.ROLE_ID,
                                data.CAN_CHANGE_SERVICE_PRICE,
                                data.IS_ACTIVE,
                                data.ORG_ID,
                                data.COUNTRY_CODE
                            ],
                            supportKey,
                            connection
                        );

                        // Update user master using SP
                        await runQuery(
                            `CALL sp_update_user_by_backoffice_team(?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.NAME,
                                data.EMAIL_ID,
                                data.CAN_CHANGE_SERVICE_PRICE,
                                data.MOBILE_NUMBER,
                                data.ROLE_ID,
                                data.ID,
                                data.IS_ACTIVE
                            ],
                            supportKey,
                            connection
                        );

                        // Update customer_spoc_mapping using SP
                        await runQuery(
                            `CALL sp_update_customer_spoc_by_backoffice(?, ?)`,
                            [data.IS_ACTIVE, data.ID],
                            supportKey,
                            connection
                        );

                        mm.commitConnection(connection);
                        await addChannels(data.ID, data, supportKey);

                    } else {
                        // data.PASSWORD = md5(data.PASSWORD);
                        data.PASSWORD = await mm.hashPassword(data.PASSWORD);
                        data.CLIENT_ID = 1;

                        // Insert backoffice team and get ID
                        const teamResult = await runQuery(
                            `CALL sp_insert_backoffice_team(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.NAME,
                                data.EMAIL_ID,
                                data.MOBILE_NUMBER,
                                data.PASSWORD,
                                data.ROLE_ID,
                                data.CAN_CHANGE_SERVICE_PRICE,
                                data.IS_ACTIVE,
                                data.ORG_ID,
                                data.CLIENT_ID,
                                data.COUNTRY_CODE
                            ],
                            supportKey,
                            connection
                        );

                        const teamInsertId = teamResult && teamResult[0] && teamResult[0][0] ?
                            teamResult[0][0].insertId : teamResult[0]?.insertId;

                        // Insert user and get ID
                        const userResult = await runQuery(
                            `CALL sp_insert_user_master(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                data.ROLE_ID,
                                data.NAME,
                                data.EMAIL_ID,
                                data.PASSWORD,
                                teamInsertId,
                                data.CLIENT_ID,
                                data.ORG_ID,
                                data.CAN_CHANGE_SERVICE_PRICE,
                                data.MOBILE_NUMBER
                            ],
                            supportKey,
                            connection
                        );

                        const userInsertId = userResult && userResult[0] && userResult[0][0] ?
                            userResult[0][0].insertId : userResult[0]?.insertId;

                        // Insert user role mapping using SP
                        await runQuery(
                            `CALL sp_insert_user_role_mapping(?, ?, ?)`,
                            [userInsertId, data.ROLE_ID, data.CLIENT_ID],
                            supportKey,
                            connection
                        );

                        // Update backoffice team with user ID using SP
                        await runQuery(
                            `CALL sp_update_backoffice_team_user_id(?, ?)`,
                            [userInsertId, teamInsertId],
                            supportKey,
                            connection
                        );

                        mm.commitConnection(connection);
                        addGlobalData(teamInsertId, supportKey);
                        await addChannels(userInsertId, data, supportKey);
                    }

                    data.ROLE_NAME = getrole[0].NAME;
                    successCount++;
                    successDetails.push({ rowNumber: rowNum, row });
                    totalData.push({ ...row, IMPORT_STATUS: "Success" });

                } catch (err) {
                    mm.rollbackConnection(connection);
                    errorDetails.push({ rowNumber: rowNum, error: err.message });
                    errorData.push({ rowNumber: rowNum, row, error: err.message });
                    totalData.push({ ...row, IMPORT_STATUS: "Failed", reason: err.message });
                }
            }

            const progress = Math.round(((start + chunk.length) / jsonData.length) * 100);
            await excelMaster.findByIdAndUpdate(EXCEL_MASTER_ID, { PROGRESS: progress, STATUS: "Processing" });
        }

        let response = {
            code: 200,
            message: "Team import process completed.",
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
        console.log("error", error);
    }
};


async function addChannels(userId, data, supportKey) {
    const date = mm.getSystemDate();

    let existing = await channelSubscribedUsers.findOne({
        CHANNEL_NAME: 'backoffice_channel',
        USER_ID: userId
    });

    if (!existing) {
        await new channelSubscribedUsers({
            CHANNEL_NAME: 'backoffice_channel',
            USER_ID: userId,
            TYPE: "B",
            STATUS: true,
            USER_NAME: data.NAME,
            CLIENT_ID: data.CLIENT_ID,
            DATE: date
        }).save();
    }

    existing = await channelSubscribedUsers.findOne({
        CHANNEL_NAME: 'system_alerts_channel',
        USER_ID: userId
    });

    if (!existing) {
        await new channelSubscribedUsers({
            CHANNEL_NAME: 'system_alerts_channel',
            USER_ID: userId,
            TYPE: "B",
            STATUS: true,
            USER_NAME: data.NAME,
            CLIENT_ID: data.CLIENT_ID,
            DATE: date
        }).save();
    }

    const chatRoles = [22, 21, 20, 8, 7, 5, 4, 3, 2, 1];

    if (chatRoles.includes(Number(data.ROLE_ID))) {
        existing = await channelSubscribedUsers.findOne({
            CHANNEL_NAME: 'backoffice_chat_channel',
            USER_ID: userId
        });

        if (!existing) {
            await new channelSubscribedUsers({
                CHANNEL_NAME: 'backoffice_chat_channel',
                USER_ID: userId,
                TYPE: "B",
                STATUS: true,
                USER_NAME: data.NAME,
                CLIENT_ID: data.CLIENT_ID,
                DATE: date
            }).save();
        }
    }
}

