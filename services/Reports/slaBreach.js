const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { getReportCustomerScopeClause } = require('../../utilities/reportCustomerScope');
const applicationkey = process.env.APPLICATION_KEY;
const supportKey = '';
const moment = require("moment-timezone");



exports.get = async (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    try {
        const scopeClause = await getReportCustomerScopeClause(req.body.authData, supportKey);
        if (scopeClause) filter += scopeClause;
    } catch (scopeError) {
        console.log("Error resolving report customer scope", scopeError);
        return res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
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
                setContext+`CALL sp_slaBreachReport_get()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("error", error);
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to get information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const countResult = resultSets[0] || [];
                        const dataResult = resultSets[1] || [];


                        const finalData = dataResult.map(row => {
                                return {
                                    ...row,
                                    SLA_BREACH_REASON: calculateSLABreachReason(row)
                                }
                            });
                        return res.status(200).json({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 19,
                            "count": countResult[0] ? countResult[0].cnt : 0,
                            "data": finalData
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


function calculateSLABreachReason(job) {
    const {
        JOB_STARTED_DATETIME,
        ORDER_DATE_TIME,
        RESPONSE_TIME,
        ORDER_ACCEPTED_DATE,
        ACKNOWLEDGEMENT_TIME,
        SHEDULED_DATETIME,
        PREFERED_START_TIME,
        IANA_CODE
    } = job;

    const timeZone = IANA_CODE || "Asia/Kolkata";
    // Convert customer's preferred time (UTC stored) into customer's local time
    // Parse UTC time string and convert to timezone
    const preferredLocal = new Date(PREFERED_START_TIME + 'Z'); // Add 'Z' to indicate UTC
    const preferredLocalInTZ = new Date(preferredLocal.toLocaleString('en-US', { timeZone }));
    // console.log("\n\n **************** \n\n");
    // console.log("IANA_CODE,", IANA_CODE);
    // console.log("preferredLocal,", preferredLocal);
    // console.log("preferredLocalInTZ,", preferredLocalInTZ);
    // console.log("\n\n **************** \n\n");

    if (SHEDULED_DATETIME && PREFERED_START_TIME && IANA_CODE) {
        try {
            const scheduled = new Date(SHEDULED_DATETIME);
            // Compare
            if (scheduled > preferredLocalInTZ) {
                // const diff = Math.floor((scheduled - preferredLocalInTZ) / 60000);
                return `Scheduled later than customer's preferred datetime.`;
            }

        } catch (error) {
            console.log("Timezone conversion error:", error);
        }
    }

    // --- 2. Technician Started Late (Based on Response Time - if available) ---
    if (RESPONSE_TIME !== null && RESPONSE_TIME !== undefined && RESPONSE_TIME > 0) {
        if (JOB_STARTED_DATETIME && ORDER_DATE_TIME) {
            const allowedStart = new Date(new Date(ORDER_DATE_TIME).getTime() + RESPONSE_TIME * 60000);

            if (new Date(JOB_STARTED_DATETIME) > allowedStart) {
                if (preferredLocalInTZ > allowedStart) {
                    return "SLA Met";
                } else {
                    return `Technician started late based on response time`;
                }
            }
        }
    }

    // --- 2.1. Technician Started Late (Fallback: SHEDULED_DATETIME) ---
    if ((!RESPONSE_TIME || RESPONSE_TIME === null || RESPONSE_TIME === 0) && JOB_STARTED_DATETIME) {

        let ValidDate = SHEDULED_DATETIME ? new Date(SHEDULED_DATETIME) : preferredLocalInTZ;
        if (new Date(JOB_STARTED_DATETIME) > ValidDate) {
            return `Technician started late based on scheduled time(in case of special case)`;
        }
    }

    // --- 3. Acknowledgement Delay ---
    if (ORDER_ACCEPTED_DATE && ORDER_DATE_TIME && ACKNOWLEDGEMENT_TIME != null) {
        const diff = Math.floor((new Date(ORDER_ACCEPTED_DATE) - new Date(ORDER_DATE_TIME)) / 60000);

        if (diff > ACKNOWLEDGEMENT_TIME) {
            return `Acknowledgement delayed by service desk team`;
        }
    }

    return "SLA Met";
}

exports.updateSlaRemarks = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const payload = req.body;

    if (!Array.isArray(payload) || payload.length === 0) {
        return res.status(400).json({
            code: 400,
            message: "Invalid payload"
        });
    }

    try {
        for (const item of payload) {
            const old = item.OLD_SLA_DATA;

            await new Promise((resolve, reject) => {
                mm.executeQueryData(
                    `CALL sp_slaBreachReport_updateSlaRemarks(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                    [
                        old.JOB_CARD_ID,
                        old.ORDER_ID,
                        old.JOB_CARD_NO,
                        old.CUSTOMER_ID,
                        old.CUSTOMER_NAME,
                        old.TECHNICIAN_ID,
                        old.TECHNICIAN_NAME,
                        old.SCHEDULED_DATE_TIME,
                        old.EXPECTED_END_DATE || null,
                        old.START_TIME,
                        old.END_TIME,
                        old.JOB_STATUS_ID,
                        old.JOB_CARD_STATUS,
                        old.SLA_REASON || null,
                        item.SLA_REASON,
                        item.USER_ID,
                        old.CLIENT_ID
                    ],
                    supportKey,
                    (error) => {
                        if (error) return reject(error);
                        resolve(true);
                    }
                );
            });
        }

        res.status(200).json({
            code: 200,
            message: "SLA remarks updated successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(400).json({
            code: 400,
            message: "Failed to update SLA remarks"
        });
    }
};




