const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
var ticketMaster = "ticket_master";
var viewTicketMaster = "view_" + ticketMaster;
var ticketLogDetails = "ticket_log_details";
var viewTicketLogDetails = "view_" + ticketLogDetails;
var ticketDetails = "ticket_details";


function reqData(req) {
    var data = {
        TICKET_GROUP_ID: req.body.TICKET_GROUP_ID,
        TICKET_NO: req.body.TICKET_NO,
        USER_ID: req.body.USER_ID,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        CLOUD_ID: req.body.CLOUD_ID ? req.body.CLOUD_ID : '0',

        QUESTION: req.body.QUESTION,
        STATUS: req.body.STATUS ? req.body.STATUS : '0',
        PRIORITY: req.body.PRIORITY ? req.body.PRIORITY : 'M',

        IS_TAKEN: req.body.IS_TAKEN ? 1 : 0,
        TAKEN_BY_USER_ID: req.body.TAKEN_BY_USER_ID ? req.body.TAKEN_BY_USER_ID : 0,
        LAST_RESPONDED: req.body.LAST_RESPONDED ? req.body.LAST_RESPONDED : mm.getSystemDate(),

        DATE: req.body.DATE ? req.body.DATE : mm.getSystemDate(),
        SUBJECT: req.body.SUBJECT,

        READ_ONLY: req.body.READ_ONLY ? req.body.READ_ONLY : 'N',
        ARCHIVE_FLAG: req.body.ARCHIVE_FLAG ? req.body.ARCHIVE_FLAG : 'F',

        CLIENT_ID: req.body.CLIENT_ID,

        ON_HOLD: req.body.ON_HOLD,
        FIRST_RESOLVED_TIME: req.body.FIRST_RESOLVED_TIME,

        ORG_ID: req.body.ORG_ID,
        TRANSFER_USER_ID: req.body.TRANSFER_USER_ID ? req.body.TRANSFER_USER_ID : req.body.TAKEN_BY_USER_ID,
        RECIVER_ID: req.body.RECIVER_ID,

        USER_TYPE: req.body.USER_TYPE,

        ORDER_ID: req.body.ORDER_ID,
        SHOP_ORDER_ID: req.body.SHOP_ORDER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,

        IS_TAKEN_STATUS: req.body.IS_TAKEN_STATUS ? req.body.IS_TAKEN_STATUS : '',

        TAKEN_FROM_USER_ID: req.body.TAKEN_FROM_USER_ID ? req.body.TAKEN_FROM_USER_ID : 0,

        DESCRIPTION: req.body.DESCRIPTION,
        URL: req.body.URL,

        REASON_FOR_TRANSFER: req.body.REASON_FOR_TRANSFER,
        BAN_REASON: req.body.BAN_REASON,
        ON_HOLD_REASON: req.body.ON_HOLD_REASON
    };

    return data;
}

exports.validate = function () {
    return [
        body('TICKET_GROUP_ID').isInt(),
        body('TICKET_NO', ' parameter missing').exists(),
        body('USER_ID').isInt(),
        body('MOBILE_NO', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('CLOUD_ID', ' parameter missing').exists(),
        body('QUESTION', ' parameter missing').exists(),
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
            setContext + 'CALL sp_ticketMaster_get()',
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
                    "TAB_ID": 127,
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


exports.getUserwiseReport = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'CREATOR_EMPLOYEE_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let ORG_ID = req.body.ORG_ID;

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_ORG_ID= '${ORG_ID}';
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
            setContext + 'CALL sp_ticketMaster_getUserwiseReport()',
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
                    "TAB_ID": 127,
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

exports.getDepartmentwiseReport = (req, res) => {
    const supportKey = req.headers['supportkey'];
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");
    let DEPARTMENT_ID = req.body.DEPARTMENT_ID ? req.body.DEPARTMENT_ID : 0;
    let USER_ID = req.body.USER_ID ? req.body.USER_ID : 0;
    var FROM_DATE = req.body.FROM_DATE;
    var TO_DATE = req.body.TO_DATE;
    let ORG_ID = req.body.ORG_ID;

    const setContext = `
        SET @v_FILTER = '${safeFilter}';
        SET @v_DEPARTMENT_ID = ${DEPARTMENT_ID};
        SET @v_USER_ID = ${USER_ID};
        SET @v_FROM_DATE = ${FROM_DATE ? `'${FROM_DATE}'` : 'NULL'};
        SET @v_TO_DATE = ${TO_DATE ? `'${TO_DATE}'` : 'NULL'};
        SET @v_ORG_ID= ${ORG_ID};
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
            setContext + 'CALL sp_ticketMaster_getDepartmentwiseReport()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 127,
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


exports.getDashboardReport = (req, res) => {
    const supportKey = req.headers['supportkey'];
    let DEPARTMENT_ID = req.body.DEPARTMENT_ID ? req.body.DEPARTMENT_ID : 0;
    let USER_ID = req.body.USER_ID ? req.body.USER_ID : 0;
    var FROM_DATE = req.body.FROM_DATE;
    var TO_DATE = req.body.TO_DATE;
    let ORG_ID = req.body.ORG_ID;

    const setContext = `
        SET @v_DEPARTMENT_ID = ${DEPARTMENT_ID};
        SET @v_USER_ID = ${USER_ID};
        SET @v_FROM_DATE = ${FROM_DATE ? `'${FROM_DATE}'` : 'NULL'};
        SET @v_TO_DATE = ${TO_DATE ? `'${TO_DATE}'` : 'NULL'};
        SET @v_ORG_ID= ${ORG_ID};
    `;

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_ticketMaster_getDashboardReport()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 127,
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


exports.getTicketReport = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const d = new Date();
    const MONTH = req.body.MONTH || d.getMonth() + 1;
    const YEAR = req.body.YEAR || d.getFullYear();

    const setContext = `
        SET @v_MONTH = ${MONTH};
        SET @v_YEAR = ${YEAR};
    `;

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_ticketMaster_getTicketReport()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get ticket report"
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));

                return res.status(200).json({
                    TAB_MASTER: 127,
                    "message": "success",
                    data: resultSets[0],
                    result4: resultSets[2],
                    result5: resultSets[3],
                    results2: resultSets[1]

                });

            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};


exports.getLogDetails = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const pageIndex = req.body.pageIndex || 0;
    const pageSize = req.body.pageSize || 0;
    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue || 'DESC';

    let filter = (req.body.filter || '').trim();
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (IS_FILTER_WRONG !== "0") {
        return res.status(400).json({
            "message": "Invalid filter parameter."
        });
    }

    const safeFilter = filter.replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex};
        SET @v_PAGE_SIZE = ${pageSize};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_ticketMaster_getLogDetails()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get ticket log details"
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                res.status(200).json({
                    "code": 200,
                    "message": "success",
                    count: countResult[0] ? countResult[0].cnt : 0,
                    data: dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};


exports.getLogDetailsByTicketNo = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const TICKET_NUMBER = req.body.TICKET_NUMBER;

    if (!TICKET_NUMBER) {
        return res.status(400).json({
            "message": "TICKET_NUMBER is required"
        });
    }

    const setContext = `
        SET @v_TICKET_NUMBER = '${TICKET_NUMBER.replace(/'/g, "\\'")}';
    `;

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_ticketMaster_getLogDetailsByTicketNo()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get ticket log details"
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                res.status(200).json({
                    "code": 200,
                    "message": "success",
                    count: countResult[0] ? countResult[0].cnt : 0,
                    data: dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};


exports.getOptionWiseCount = (req, res) => {
    const supportKey = req.headers['supportkey'];

    const ORG_ID = req.body.ORG_ID;
    if (!ORG_ID) {
        return res.status(400).json({
            "message": "Organisation Id missing"
        });
    }

    const DEPARTMENT_ID = req.body.DEPARTMENT_ID || 0;
    const USER_ID = req.body.USER_ID || 0;
    const FROM_DATE = req.body.FROM_DATE || null;
    const TO_DATE = req.body.TO_DATE || null;
    const SEARCH_TEXT = (req.body.searchText || '').trim();

    const safeSearchText = SEARCH_TEXT.replace(/'/g, "\\'");

    const setContext = `
        SET @v_ORG_ID = ${ORG_ID};
        SET @v_DEPARTMENT_ID = ${DEPARTMENT_ID};
        SET @v_USER_ID = ${USER_ID};
        SET @v_FROM_DATE = ${FROM_DATE ? `'${FROM_DATE}'` : 'NULL'};
        SET @v_TO_DATE = ${TO_DATE ? `'${TO_DATE}'` : 'NULL'};
        SET @v_SEARCH_TEXT = '${safeSearchText}';
    `;

    try {
        mm.executeQueryData(
            setContext + 'CALL sp_ticketMaster_getOptionWiseCount()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get option wise count"
                    });
                }

                const resultSets = results.filter(r => Array.isArray(r));

                res.status(200).json({
                    TAB_MASTER: 127,
                    "message": "success",
                    data: resultSets[0] || []
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};

exports.autoCloseTicket = (req, res) => {
    const supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData(
            'CALL sp_ticket_autoClose()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        "message": "Failed to auto close tickets..."
                    });
                }

                const closedCount = results[0][0].CLOSED_COUNT;

                if (closedCount > 0) {
                    res.status(200).json({
                        "message": "Success...",
                        "closedTickets": closedCount
                    });
                } else {
                    res.status(300).json({
                        "message": "There Is No Tickets..."
                    });
                }
            }
        );
    } catch (error) {
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};


exports.getAutoCloseTicketReport = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';
    var USER_ID = req.body.USER_ID ? req.body.USER_ID : '';
    var TAKEN_BY_USER_ID = req.body.TAKEN_BY_USER_ID ? req.body.TAKEN_BY_USER_ID : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_USER_ID = ${USER_ID || 0};
        SET @v_TAKEN_BY_USER_ID = ${TAKEN_BY_USER_ID || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_FROM_DATE = ${START_DATE ? `'${START_DATE}'` : 'NULL'};
        SET @v_TO_DATE = ${END_DATE ? `'${END_DATE}'` : 'NULL'};
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
            setContext + 'CALL sp_ticketMaster_getAutoCloseTicketReport()',
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
                    "TAB_ID": 127,
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

exports.getCreatorWiseAutoCloseTicketCount = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_FROM_DATE = ${START_DATE ? `'${START_DATE}'` : 'NULL'};
        SET @v_TO_DATE = ${END_DATE ? `'${END_DATE}'` : 'NULL'};
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
            setContext + 'CALL sp_ticketMaster_getCreatorWiseAutoCloseTicketCount()',
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
                    "TAB_ID": 127,
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

exports.getGroupWiseAutoCloseTicketCount = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'DEPARTMENT_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_FROM_DATE = ${START_DATE ? `'${START_DATE}'` : 'NULL'};
        SET @v_TO_DATE = ${END_DATE ? `'${END_DATE}'` : 'NULL'};
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
            setContext + 'CALL sp_ticketMaster_getGroupWiseAutoCloseTicketCount()',
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
                    "TAB_ID": 127,
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

exports.getGroupWiseAutoCloseTicketReport = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'DEPARTMENT_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';
    var USER_ID = req.body.USER_ID ? req.body.USER_ID : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_USER_ID = ${USER_ID || 0};
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_FROM_DATE = ${START_DATE ? `'${START_DATE}'` : 'NULL'};
        SET @v_TO_DATE = ${END_DATE ? `'${END_DATE}'` : 'NULL'};
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
            setContext + 'CALL sp_ticketMaster_getGroupWiseAutoCloseTicketReport()',
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
                    "TAB_ID": 127,
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

exports.track = (req, res) => {
    var ticketNo = req.query.TICKET;
    var supportKey = req.headers['supportkey'];
    const setContext = `
        SET @p_TICKET_NO = ${ticketNo || 0};
    `;
    try {
        mm.executeQueryData(
            setContext + 'CALL sp_ticket_track()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    return res.status(400).json({
                        "message": "Failed to get ticket information..."
                    });
                }

                res.status(200).json({
                    "message": "success",
                    "data": results[0]   // SP result set
                });
            }
        );
    } catch (error) {
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );

    }
}

function addLog(id, Ltext, CREATED_DATE_TIME, supportKey) {
    try {
        let NLtext = Ltext ? Ltext : "Not Available";

        mm.executeQueryData(
            `CALL sp_addTicketLog(?,?,?)`,
            [id, NLtext, CREATED_DATE_TIME],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                }
                else {
                    console.log("TicketLogDetail information saved successfully...");
                }

            }
        );

    } catch (error) {
        console.log(error);
    }
}





exports.create = (req, res) => {
    console.log("INCREATE");

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        const connection = mm.openConnection();

        mm.executeDML(
            `CALL sp_ticketMaster_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.TICKET_GROUP_ID,
                data.TICKET_NO,
                data.USER_ID,
                data.MOBILE_NO,
                data.EMAIL_ID,
                data.CLOUD_ID,
                data.QUESTION,
                data.STATUS,
                data.PRIORITY,
                data.IS_TAKEN,
                data.TAKEN_BY_USER_ID,
                data.LAST_RESPONDED,
                data.DATE,
                data.SUBJECT,
                data.READ_ONLY,
                data.ARCHIVE_FLAG,
                data.CLIENT_ID,
                data.ON_HOLD,
                data.FIRST_RESOLVED_TIME,
                data.ORG_ID,
                data.TRANSFER_USER_ID,
                data.RECIVER_ID,
                data.USER_TYPE,
                data.ORDER_ID,
                data.SHOP_ORDER_ID,
                data.JOB_CARD_ID,
                data.IS_TAKEN_STATUS,
                data.TAKEN_FROM_USER_ID,
                data.DESCRIPTION,
                data.URL,
                data.REASON_FOR_TRANSFER,
                data.BAN_REASON,
                data.ON_HOLD_REASON
            ],
            supportKey,
            connection,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    mm.rollbackConnection(connection);
                    return res.status(400).json({ "code": 400, "message": "Failed to save ticket information..." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                console.log("resultSets", resultSets)
                const ticketInfo = resultSets[1][0]

                const ticketId = results[0][0].INSERT_ID;

                let msgTitle = "New Support Ticket Created";
                let msgDesc =
                    `Dear User, ${ticketInfo.CREATOR_EMPLOYEE_NAME} has created a new support ticket ${ticketInfo.TICKET_NO}. Kindly review it and take the necessary actions.`;

                sendNotifications(
                    req.body.authData.data.UserData[0].USER_ID,
                    data.ORDER_ID,
                    "CH",
                    msgTitle,
                    msgDesc,
                    supportKey,
                    req.body
                );

                var CREATED_DATE_TIME = `(SELECT DATE FROM view_ticket_master WHERE ID=${ticketId})`;

                var Ltext = `CONCAT(
(SELECT UPPER(CREATOR_EMPLOYEE_NAME) FROM view_ticket_master WHERE ID=${ticketId}),
' has created the ticket ',
(SELECT TICKET_NO FROM view_ticket_master WHERE ID=${ticketId}),
' on ',
(SELECT TIME(DATE) FROM view_ticket_master WHERE ID=${ticketId}),
' with subject ',
(SELECT UPPER(QUESTION) FROM view_ticket_master WHERE ID=${ticketId}),
'.'
)`;

                addLog(ticketId, Ltext, CREATED_DATE_TIME, supportKey);

                mm.sendDynamicEmail(75, ticketId, supportKey);
                mm.sendDynamicEmail(76, ticketId, supportKey);

                req.body.TICKET_MASTER_ID = ticketId;
                req.body.SENDER = 'U';
                req.body.SENDER_ID = data.USER_ID;
                req.body.DESCRIPTION = data.QUESTION;
                req.body.IS_CREATED = "cust";

                mm.commitConnection(connection);
                require('./ticketDetails').create(req, res);
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var KEY = req.body.KEY;
    var ACTION = req.body.ACTION;
    var supportKey = req.headers['supportkey'];
    var TICKET_TAKEN_EMPLOYEE = req.body.TICKET_TAKEN_EMPLOYEE;
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        setData += `${key} = ? , `;
        recordData.push(data[key]);
    });
    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {

            var connection = mm.openConnection();
            var Ltext;
            var msgTitle = ""; //notification title
            var msgDesc = ""; //notification description
            var CustomermsgTitle = ""; //notification title
            var CREATED_DATE_TIME = `(select DATE from view_ticket_master where ID=${criteria.ID})`;
            mm.executeDML(`CALL sp_ticketMaster_getInfo(?, ?, ?)`, [data.TAKEN_BY_USER_ID, data.TICKET_NO, data.USER_ID], supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get ticket information..."
                    });
                } else {
                    // S for Assign
                    console.log("results1", results1)
                    var results5 = results1[0]
                    if (data.STATUS == "S") {
                        mm.executeDML(`CALL sp_ticketMaster_assign(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
                            [
                                criteria.ID,
                                data.TICKET_GROUP_ID,
                                data.TICKET_NO,
                                data.USER_ID,
                                data.MOBILE_NO,
                                data.EMAIL_ID,
                                data.CLOUD_ID,
                                data.QUESTION,
                                data.STATUS,
                                data.PRIORITY,
                                data.IS_TAKEN,
                                data.TAKEN_BY_USER_ID,
                                data.LAST_RESPONDED,
                                data.CLIENT_ID,
                                data.SUBJECT,
                                data.DATE,
                                data.ORG_ID,
                                data.TRANSFER_USER_ID,
                                data.RECIVER_ID,
                                data.USER_TYPE,
                                data.ORDER_ID,
                                data.SHOP_ORDER_ID,
                                data.JOB_CARD_ID,
                                data.IS_TAKEN_STATUS,
                                data.TAKEN_FROM_USER_ID,
                                systemDate
                            ], supportKey, connection, (error, results4) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to update ticket information..."
                                    });
                                } else {
                                    var results51 = results4[0]
                                    console.log("results4", results4)
                                    Ltext = `concat(
                                        (select UPPER(TICKET_TAKEN_EMPLOYEE) 
                                            from view_ticket_master 
                                            where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} 
                                            and TICKET_NO='${data.TICKET_NO}'
                                        ),
                                        ' picked the ticket ',
                                        (select TICKET_NO from view_ticket_master where ID=${criteria.ID}),
                                        ' on ',
                                        (select time(LAST_RESPONDED) from view_ticket_master where ID=${criteria.ID})
                                    )`
                                    // msgTitle = "Your Created Ticket is Picked";
                                    // msgDesc = "Dear User, Your ticket No. " + results51[0].TICKET_NO + " is picked by support user " + results51[0].TICKET_TAKEN_EMPLOYEE + ". Wait for their solution.";
                                    msgTitle = "Support Ticket Picked";
                                    msgDesc = "Dear Customer, your support ticket " + results51[0].TICKET_NO + " is picked by " + results51[0].TICKET_TAKEN_EMPLOYEE + ". Please await their solution.";

                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results51[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);
                                    // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                    mm.commitConnection(connection);
                                    mm.sendDynamicEmail(22, criteria.ID, supportKey)
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "success"
                                    });
                                }
                            });
                    }
                    // R for Resolved
                    else if (data.STATUS == "R" && KEY == "SUPPORT_USER") {
                        mm.executeDML(`call sp_ticketMaster_Resolved(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                            req.body.ID,
                            data.TICKET_GROUP_ID,
                            data.TICKET_NO,
                            data.USER_ID,
                            data.MOBILE_NO,
                            data.EMAIL_ID,
                            data.CLOUD_ID,
                            data.QUESTION,
                            data.STATUS,
                            data.PRIORITY,
                            data.IS_TAKEN,
                            data.TAKEN_BY_USER_ID,
                            data.LAST_RESPONDED,
                            data.DATE,
                            data.SUBJECT,
                            data.CLIENT_ID,
                            data.ON_HOLD,
                            data.FIRST_RESOLVED_TIME,
                            data.ORG_ID,
                            data.TRANSFER_USER_ID,
                            data.RECIVER_ID,
                            data.USER_TYPE,
                            data.ORDER_ID,
                            data.SHOP_ORDER_ID,
                            data.JOB_CARD_ID,
                            data.IS_TAKEN_STATUS,
                            data.TAKEN_FROM_USER_ID,
                            data.DESCRIPTION,
                            data.URL,
                            data.REASON_FOR_TRANSFER,
                            data.BAN_REASON,
                            data.ON_HOLD_REASON,
                            systemDate], supportKey, connection, (error, results1) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    mm.rollbackConnection(connection);
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to get ticket information..."
                                    });
                                }
                                else {
                                    var results6 = results1[0]
                                    var results16 = results1[1][0].IS_TRANSFER
                                    if (results16 == 0) {
                                        Ltext = `concat(
                                        (select UPPER(TICKET_TAKEN_EMPLOYEE) 
                                            from view_ticket_master 
                                            where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} 
                                            and TICKET_NO='${data.TICKET_NO}'
                                        ),
                                        ' answered the ticket ',
                                        (select TICKET_NO from view_ticket_master where ID=${criteria.ID}),
                                        ' on ',
                                        (select time(LAST_RESPONDED) from view_ticket_master where ID=${criteria.ID})
                                    )`;

                                        msgTitle = "Support Ticket Resolved";
                                        msgDesc = "Dear " + results6[0].CREATOR_EMPLOYEE_NAME + ", your support ticket " + results6[0].TICKET_NO + " has been resolved by " + results6[0].TICKET_TAKEN_EMPLOYEE + ". Please review the solution.";

                                        // msgTitle = "Your Created Ticket is Answered by Support User";
                                        // msgDesc = "Dear User, Your ticket No. " + results6[0].TICKET_NO + " is resolved by support user " + results6[0].TICKET_TAKEN_EMPLOYEE + ". Please follow the given solution.";
                                        sendNotifications(req.body.authData.data.UserData[0].USER_ID, results6[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);

                                        mm.sendDynamicEmail(77, criteria.ID, supportKey)

                                        // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                        mm.commitConnection(connection);
                                        res.status(200).json({
                                            "code": 200,
                                            "message": "success"
                                        });
                                    }
                                    else {
                                        var results67 = results1[2]
                                        Ltext = `concat(
                                        (select UPPER(TICKET_TAKEN_EMPLOYEE) 
                                            from view_ticket_master 
                                            where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} 
                                            and TICKET_NO='${data.TICKET_NO}'
                                        ),
                                        ' transferred the ticket ',
                                        (select TICKET_NO from view_ticket_master where ID=${criteria.ID}),
                                        ' on ',
                                        (select time(LAST_RESPONDED) from view_ticket_master where ID=${criteria.ID})
                                    )`;

                                        msgTitle = "Support ticket is transferred to you by another support member";
                                        CustomermsgTitle = "Support ticket is transferred to another support member";
                                        msgDesc = "Dear User, Support ticket no. " + results6[0].TICKET_NO + " is transferred to you by user " + results6[0].TICKET_TAKEN_EMPLOYEE + ". Please check.";
                                        let msgDesc2 = "Dear User, Support ticket no. " + results6[0].TICKET_NO + " is transferred to another support user " + results67[0].IS_TAKEN_USER_NAME + ". Wait for their solution.";
                                        sendNotifications(req.body.authData.data.UserData[0].USER_ID, results6[0].USER_ID, "C", CustomermsgTitle, msgDesc2, supportKey, req.body);
                                        sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TRANSFER_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);

                                        mm.sendDynamicEmail(28, criteria.ID, supportKey)
                                        mm.sendDynamicEmail(82, criteria.ID, supportKey)
                                        // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                        mm.commitConnection(connection);
                                        res.status(200).json({
                                            "code": 200,
                                            "message": "success"
                                        });


                                    }
                                }
                            });
                    }
                    // Ticket is Reopened
                    else if (data.STATUS == "O") {
                        mm.executeDML(`call sp_ticketMaster_Reopened(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                            req.body.ID,
                            data.TICKET_GROUP_ID,
                            data.TICKET_NO,
                            data.USER_ID,
                            data.MOBILE_NO,
                            data.EMAIL_ID,
                            data.CLOUD_ID,
                            data.QUESTION,
                            data.STATUS,
                            data.PRIORITY,
                            data.IS_TAKEN,
                            data.TAKEN_BY_USER_ID,
                            data.LAST_RESPONDED,
                            data.DATE,
                            data.SUBJECT,
                            data.CLIENT_ID,
                            data.ON_HOLD,
                            data.FIRST_RESOLVED_TIME,
                            data.ORG_ID,
                            data.TRANSFER_USER_ID,
                            data.RECIVER_ID,
                            data.USER_TYPE,
                            data.ORDER_ID,
                            data.SHOP_ORDER_ID,
                            data.JOB_CARD_ID,
                            data.IS_TAKEN_STATUS,
                            data.TAKEN_FROM_USER_ID,
                            data.DESCRIPTION,
                            data.URL,
                            data.REASON_FOR_TRANSFER,
                            data.BAN_REASON,
                            data.ON_HOLD_REASON,
                            systemDate,
                            ACTION], supportKey, connection, (error, results18) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    mm.rollbackConnection(connection);
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to get ticket information..."
                                    });
                                }
                                else {
                                    var results8 = results18[0]
                                    var results16 = results18[1][0].IS_TRANSFER
                                    if (results16 == 0) {
                                        if (ACTION != "MANUALLY_REOPEN") {
                                            if (ACTION == 'UNBANNED') {
                                                msgTitle = "Support ticket is unbanned by Support User";
                                                msgDesc = "Dear User, support ticket no. " + results8[0].TICKET_NO + " is unbanned by support user " + results8[0].TICKET_TAKEN_EMPLOYEE + ".";
                                                sendNotifications(req.body.authData.data.UserData[0].USER_ID, results8[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);
                                                // mm.sendDynamicEmail(24, criteria.ID, supportKey)
                                                // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                mm.commitConnection(connection);
                                                res.status(200).json({
                                                    "code": 200,
                                                    "message": "success"
                                                });
                                            } else {
                                                msgTitle = "Support ticket is re-opend";
                                                msgDesc = "Dear User, support ticket no. " + results8[0].TICKET_NO + " is re-opened by " + results8[0].CREATOR_EMPLOYEE_NAME + " please check and resolve it.";
                                                let CustmsgDesc2 = "Dear " + results8[0].CREATOR_EMPLOYEE_NAME + ", support ticket no. " + results8[0].TICKET_NO + " is re-opened.";


                                                sendNotifications(req.body.authData.data.UserData[0].USER_ID, results8[0].USER_ID, "C", msgTitle, CustmsgDesc2, supportKey, req.body);
                                                sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TRANSFER_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);

                                                mm.sendDynamicEmail(24, criteria.ID, supportKey)
                                                mm.sendDynamicEmail(80, criteria.ID, supportKey)
                                                // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results8[0].TICKET_NO, results8[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_ticket_reopened')
                                                mm.commitConnection(connection);
                                                res.status(200).json({
                                                    "code": 200,
                                                    "message": "success"
                                                });
                                            }
                                        }
                                        else {

                                            msgTitle = "Support ticket is re-opend";
                                            msgDesc = "Dear User, support ticket no. " + results8[0].TICKET_NO + " is re-opened by " + results8[0].CREATOR_EMPLOYEE_NAME + " please check and resolve it.";
                                            // let msgDesc2 = "Dear User, Ticket No. " + results8[0].TICKET_NO + " is reopened by " + results8[0].CREATOR_EMPLOYEE_NAME + " Wait for their solution.";
                                            let CustmsgDesc2 = "Dear " + results8[0].CREATOR_EMPLOYEE_NAME + ", support ticket no. " + results8[0].TICKET_NO + " is re-opened.";
                                            sendNotifications(req.body.authData.data.UserData[0].USER_ID, results8[0].USER_ID, "C", msgTitle, CustmsgDesc2, supportKey, req.body);
                                            sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TRANSFER_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                            mm.sendDynamicEmail(80, criteria.ID, supportKey)
                                            mm.sendDynamicEmail(24, criteria.ID, supportKey)
                                            // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                            // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results8[0].TICKET_NO, results8[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_ticket_reopened')
                                            mm.commitConnection(connection);
                                            res.status(200).json({
                                                "code": 200,
                                                "message": "success"
                                            });
                                        }
                                    }
                                    else {
                                        var results678 = results18[2]
                                        Ltext = `concat(
                                            (select UPPER(TICKET_TAKEN_EMPLOYEE)
                                                from view_ticket_master
                                                where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID}
                                                and TICKET_NO='${data.TICKET_NO}'
                                            ),
                                            ' transferred the ticket ',
                                            (select TICKET_NO from view_ticket_master where ID=${criteria.ID}),
                                            ' on ',
                                            (select time(LAST_RESPONDED) from view_ticket_master where ID=${criteria.ID})
                                        )`;

                                        msgTitle = "Your created support ticket is transferred to another Support User";
                                        msgDesc = "Dear User, support ticket no. " + results8[0].TICKET_NO + " is transferred to " + results678[0].IS_TAKEN_USER_NAME + ".";
                                        let msgDesc2 = "Dear User, support ticket no. " + results8[0].TICKET_NO + " is transferred to " + results678[0].IS_TAKEN_USER_NAME + " wait for their response.";
                                        sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TRANSFER_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                        sendNotifications(req.body.authData.data.UserData[0].USER_ID, results8[0].USER_ID, "C", msgTitle, msgDesc2, supportKey, req.body);

                                        mm.sendDynamicEmail(24, criteria.ID, supportKey)
                                        mm.sendDynamicEmail(82, criteria.ID, supportKey)
                                        // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                        // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results8[0].TICKET_NO, results8[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_ticket_reopened')
                                        mm.commitConnection(connection);
                                        res.status(200).json({
                                            "code": 200,
                                            "message": "success"
                                        });


                                    }
                                }
                            });
                    }
                    // TICKET CLOSED
                    else if (data.STATUS == "C") {
                        mm.executeDML(`call sp_ticketMaster_Closed(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                            req.body.ID,
                            data.TICKET_GROUP_ID,
                            data.TICKET_NO,
                            data.USER_ID,
                            data.MOBILE_NO,
                            data.EMAIL_ID,
                            data.CLOUD_ID,
                            data.QUESTION,
                            data.STATUS,
                            data.PRIORITY,
                            data.IS_TAKEN,
                            data.TAKEN_BY_USER_ID,
                            data.LAST_RESPONDED,
                            data.DATE,
                            data.SUBJECT,
                            data.CLIENT_ID,
                            data.ON_HOLD,
                            data.FIRST_RESOLVED_TIME,
                            data.ORG_ID,
                            data.TRANSFER_USER_ID,
                            data.RECIVER_ID,
                            data.USER_TYPE,
                            data.ORDER_ID,
                            data.SHOP_ORDER_ID,
                            data.JOB_CARD_ID,
                            data.IS_TAKEN_STATUS,
                            data.TAKEN_FROM_USER_ID,
                            data.DESCRIPTION,
                            data.URL,
                            data.REASON_FOR_TRANSFER,
                            data.BAN_REASON,
                            data.ON_HOLD_REASON,
                            systemDate,
                            results5[0].CREATOR_EMPLOYEE_NAME], supportKey, connection, (error, results4) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to update ticket information..."
                                    });
                                } else {
                                    if (data.TAKEN_BY_USER_ID == 0) {
                                        console.log("innn1")

                                        mm.sendDynamicEmail(79, criteria.ID, supportKey)
                                        mm.sendDynamicEmail(25, criteria.ID, supportKey)
                                        mm.commitConnection(connection);
                                        res.status(200).json({
                                            "code": 200,
                                            "message": "Closed...."
                                        });

                                    }
                                    else {
                                        if (data.TAKEN_BY_USER_ID != 0) {
                                            console.log("innn2")
                                            msgTitle = "Support Ticket Closed";
                                            Ltext = `concat(
                                        (select UPPER(CREATOR_EMPLOYEE_NAME)
                                            from view_ticket_master
                                            where USER_ID=${data.USER_ID}
                                            and TICKET_NO=${data.TICKET_NO}
                                        ),
                                        ' closed his/her ticket ',
                                        (select TICKET_NO from view_ticket_master where ID=${criteria.ID}),
                                        ' created on ',
                                        (select time(CREATED_DATE_TIME) from view_ticket_master where ID=${criteria.ID})
                                    )`;

                                            // msgDesc = "Dear " + results5[0].TICKET_TAKEN_EMPLOYEE + ", support ticket No. " + results5[0].TICKET_NO + " is closed by " + results5[0].CREATOR_EMPLOYEE_NAME + ". Please check.";
                                            // let CustmsgDesc = "Dear " + results5[0].CREATOR_EMPLOYEE_NAME + ", support ticket No. " + results5[0].TICKET_NO + " is closed.";
                                            msgDesc = "Dear " + results5[0].TICKET_TAKEN_EMPLOYEE + ", support ticket no. " + results5[0].TICKET_NO + " has been closed by " + results5[0].CREATOR_EMPLOYEE_NAME + ". Please check.";

                                            let CustmsgDesc = "Dear " + results5[0].CREATOR_EMPLOYEE_NAME + ", support ticket no. " + results5[0].TICKET_NO + " has been closed.";

                                            sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TAKEN_BY_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                            sendNotifications(req.body.authData.data.UserData[0].USER_ID, results5[0].USER_ID, "C", msgTitle, CustmsgDesc, supportKey, req.body);
                                            mm.sendDynamicEmail(79, criteria.ID, supportKey)
                                            mm.sendDynamicEmail(25, criteria.ID, supportKey)
                                            // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey)

                                            mm.commitConnection(connection);
                                            res.status(200).json({
                                                "code": 200,
                                                "message": "success"
                                            });
                                        } else {
                                            console.log("innn3")
                                            msgDesc = "Dear " + results5[0].TICKET_TAKEN_EMPLOYEE + ", support ticket no. " + results5[0].TICKET_NO + " has been closed by " + results5[0].CREATOR_EMPLOYEE_NAME + ". Please check.";

                                            let CustmsgDesc = "Dear " + results5[0].CREATOR_EMPLOYEE_NAME + ", support ticket no. " + results5[0].TICKET_NO + " has been closed.";

                                            sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TAKEN_BY_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                            sendNotifications(req.body.authData.data.UserData[0].USER_ID, results5[0].USER_ID, "C", msgTitle, CustmsgDesc, supportKey, req.body);

                                            mm.sendDynamicEmail(79, criteria.ID, supportKey)
                                            mm.sendDynamicEmail(25, criteria.ID, supportKey)
                                            // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                            mm.commitConnection(connection);
                                            res.status(200).json({
                                                "code": 200,
                                                "message": "success"
                                            });
                                        }
                                    }
                                }
                            });
                    }
                    // TICKET ON HOLD
                    else if (data.STATUS == "H") {
                        mm.executeDML(`call sp_ticketMaster_Hold(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                            req.body.ID,
                            data.TICKET_GROUP_ID,
                            data.TICKET_NO,
                            data.USER_ID,
                            data.MOBILE_NO,
                            data.EMAIL_ID,
                            data.CLOUD_ID,
                            data.QUESTION,
                            data.STATUS,
                            data.PRIORITY,
                            data.IS_TAKEN,
                            data.TAKEN_BY_USER_ID,
                            data.LAST_RESPONDED,
                            data.DATE,
                            data.SUBJECT,
                            data.CLIENT_ID,
                            data.ON_HOLD,
                            data.FIRST_RESOLVED_TIME,
                            data.ORG_ID,
                            data.TRANSFER_USER_ID,
                            data.RECIVER_ID,
                            data.USER_TYPE,
                            data.ORDER_ID,
                            data.SHOP_ORDER_ID,
                            data.JOB_CARD_ID,
                            data.IS_TAKEN_STATUS,
                            data.TAKEN_FROM_USER_ID,
                            data.DESCRIPTION,
                            data.URL,
                            data.REASON_FOR_TRANSFER,
                            data.BAN_REASON,
                            data.ON_HOLD_REASON,
                            systemDate], supportKey, connection, (error, results102) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection)
                                res.status(400).json({
                                    "code": 400,
                                    "message": "Failed to get ticket information..."
                                });
                            }
                            else {
                                var results10 = results102[0]
                                var results16 = results102[1][0].IS_TRANSFER
                                if (results16 == 0) {
                                    Ltext = `concat(
                                        (select UPPER(TICKET_TAKEN_EMPLOYEE)
                                            from view_ticket_master
                                            where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID}
                                            and TICKET_NO=${data.TICKET_NO}
                                        ),
                                        ' has kept the ticket ',
                                        (select TICKET_NO from view_ticket_master where ID=${criteria.ID}),
                                        ' on-hold on ',
                                        (select time(LAST_RESPONDED) from view_ticket_master where ID=${criteria.ID})
                                    )`;

                                    msgTitle = "Your support ticket is kept on hold";
                                    msgDesc = "Dear User, your support ticket no. " + results10[0].TICKET_NO + " is kept on hold by " + results10[0].TICKET_TAKEN_EMPLOYEE + ".";
                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results10[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);
                                    mm.sendDynamicEmail(26, criteria.ID, supportKey)
                                    // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                    // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results10[0].TICKET_NO, results10[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_ticket_onhold')
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "success"
                                    });
                                }
                                else {
                                    var results101 = results102[2]
                                    Ltext = `concat(
                                    (select UPPER(TICKET_TAKEN_EMPLOYEE)
                                        from view_ticket_master
                                        where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID}
                                        and TICKET_NO='${data.TICKET_NO}'
                                    ),
                                    ' transferred the ticket ',
                                    (select TICKET_NO from view_ticket_master where ID=${criteria.ID}),
                                    ' on ',
                                    (select time(LAST_RESPONDED) from view_ticket_master where ID=${criteria.ID})
                                )`;

                                    let msgTitle1 = "Your created ticket is transferred to another Support User";
                                    let msgDesc2 = "Dear User, support ticket no. " + results101[0].TICKET_NO + " is transferred to " + results101[0].IS_TAKEN_USER_NAME + ". Please wait for their solution.";

                                    msgTitle = "Support ticket is transferred to you by another Support User";
                                    msgDesc = "Dear User, support ticket no. " + results101[0].TICKET_NO + " is transferred to you by " + results10[0].TICKET_TAKEN_EMPLOYEE + ".";
                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results101[0].TAKEN_BY_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results101[0].USER_ID, "C", msgTitle1, msgDesc2, supportKey, req.body);
                                    mm.sendDynamicEmail(26, criteria.ID, supportKey)
                                    // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                    // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results10[0].TICKET_NO, results10[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_transfer_ticket')
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "success"
                                    });


                                }
                            }
                        });
                    }
                    // Block by support
                    else if (data.STATUS == "B") {
                        mm.executeDML(`call sp_ticketMaster_BlockBySupport(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                            req.body.ID,
                            data.TICKET_GROUP_ID,
                            data.TICKET_NO,
                            data.USER_ID,
                            data.MOBILE_NO,
                            data.EMAIL_ID,
                            data.CLOUD_ID,
                            data.QUESTION,
                            data.STATUS,
                            data.PRIORITY,
                            data.IS_TAKEN,
                            data.TAKEN_BY_USER_ID,
                            data.LAST_RESPONDED,
                            data.DATE,
                            data.SUBJECT,
                            data.CLIENT_ID,
                            data.ON_HOLD,
                            data.FIRST_RESOLVED_TIME,
                            data.ORG_ID,
                            data.TRANSFER_USER_ID,
                            data.RECIVER_ID,
                            data.USER_TYPE,
                            data.ORDER_ID,
                            data.SHOP_ORDER_ID,
                            data.JOB_CARD_ID,
                            data.IS_TAKEN_STATUS,
                            data.TAKEN_FROM_USER_ID,
                            data.DESCRIPTION,
                            data.URL,
                            data.REASON_FOR_TRANSFER,
                            data.BAN_REASON,
                            data.ON_HOLD_REASON,
                            systemDate,
                            results5[0].TICKET_TAKEN_EMPLOYEE], supportKey, connection, (error, results4) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to update ticket information..."
                                    });
                                } else {
                                    Ltext = `concat(
                                    (select UPPER(TICKET_TAKEN_EMPLOYEE)
                                        from view_ticket_master
                                        where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID}
                                        and TICKET_NO=${data.TICKET_NO}
                                    ),
                                    ' has banned the user from replying to ticket ',
                                    (select TICKET_NO from view_ticket_master where ID=${criteria.ID}),
                                    ' on ',
                                    (select time(IFNULL(ON_HOLD, LAST_RESPONDED)) from view_ticket_master where ID=${criteria.ID})
                                )`;

                                    msgTitle = "Your support ticket is banned";
                                    msgDesc = "Dear User, your support ticket no. " + results5[0].TICKET_NO + " is banned by " + results5[0].TICKET_TAKEN_EMPLOYEE + ".";
                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results5[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);

                                    mm.sendDynamicEmail(27, criteria.ID, supportKey)
                                    // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "success"
                                    });
                                }
                            });
                    }
                    // User Sent New Message
                    else if (data.STATUS == "P") {
                        mm.executeDML(`call sp_ticketMaster_NewMessage(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                            req.body.ID,
                            data.TICKET_GROUP_ID,
                            data.TICKET_NO,
                            data.USER_ID,
                            data.MOBILE_NO,
                            data.EMAIL_ID,
                            data.CLOUD_ID,
                            data.QUESTION,
                            data.STATUS,
                            data.PRIORITY,
                            data.IS_TAKEN,
                            data.TAKEN_BY_USER_ID,
                            data.LAST_RESPONDED,
                            data.DATE,
                            data.SUBJECT,
                            data.CLIENT_ID,
                            data.ON_HOLD,
                            data.FIRST_RESOLVED_TIME,
                            data.ORG_ID,
                            data.TRANSFER_USER_ID,
                            data.RECIVER_ID,
                            data.USER_TYPE,
                            data.ORDER_ID,
                            data.SHOP_ORDER_ID,
                            data.JOB_CARD_ID,
                            data.IS_TAKEN_STATUS,
                            data.TAKEN_FROM_USER_ID,
                            data.DESCRIPTION,
                            data.URL,
                            data.REASON_FOR_TRANSFER,
                            data.BAN_REASON,
                            data.ON_HOLD_REASON,
                            systemDate], supportKey, connection, (error, results4) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to update ticket information..."
                                    });
                                } else {

                                    mm.sendDynamicEmail(28, criteria.ID, supportKey)
                                    mm.sendDynamicEmail(82, criteria.ID, supportKey)
                                    // addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "success"
                                    });
                                }
                            });
                    }
                    else {
                        console.log("No");
                        mm.rollbackConnection(connection);
                        res.status(400).json({
                            "code": 400,
                            "message": "Invalid Status"
                        });
                    }
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}

function sendNotifications(SENDER_ID, RECIPIENT_ID, USER_TYPE, msgTitle, msgDesc, supportKey, body, TERRITORY_ID) {
    if (USER_TYPE == 'CH') {
        mm.sendNotificationToSPOCrOL25Channel(SENDER_ID, RECIPIENT_ID, msgTitle, msgDesc, "", "D", supportKey, "TC", "T", "");
    } else if (USER_TYPE == 'C') {
        // mm.sendNotificationToCustomer(SENDER_ID, RECIPIENT_ID, msgTitle, msgDesc, "", "C", supportKey, "", "T", req.body);
        mm.sendNotificationToChannel(SENDER_ID, `customer_${RECIPIENT_ID}_channel`, msgTitle, msgDesc, "", "C", supportKey, "TC", "T", body);
    } else if (USER_TYPE == 'B') {
        // SENDER_ID, RECIVER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4
        mm.sendNotificationToManager(SENDER_ID, RECIPIENT_ID, msgTitle, msgDesc, "", "B", supportKey, "", "T", body);
    }
}

