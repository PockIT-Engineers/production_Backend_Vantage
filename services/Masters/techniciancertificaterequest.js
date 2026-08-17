const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo')
var TechnicianActionLog = require('../../modules/technicianActionLog')
var technicianCertificateRequest = "technician_certificate_request";
var viewTechnicianCertificateRequest = "view_" + technicianCertificateRequest;
const fs = require('fs')
const path = require('path')

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        CERTIFICATE_PHOTO: req.body.CERTIFICATE_PHOTO,
        ISSUED_BY_ORGANIZATION_NAME: req.body.ISSUED_BY_ORGANIZATION_NAME,
        CREDENTIAL_ID: req.body.CREDENTIAL_ID,
        STATUS: req.body.STATUS,
        REJECT_REMARK: req.body.REJECT_REMARK,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        APPROVER_ID: req.body.APPROVER_ID,
        REQUESTED_DATETIME: req.body.REQUESTED_DATETIME,
        APPROVED_BY: req.body.APPROVED_BY,
        ISSUED_DATE: req.body.ISSUED_DATE,
        READ_ONLY: req.body.READ_ONLY,
        ARCHIVE_FLAG: req.body.ARCHIVE_FLAG,
        CLIENT_ID: req.body.CLIENT_ID,
        ACTION_DATE_TIME: req.body.ACTION_DATE_TIME,
        IS_DELETE: req.body.IS_DELETE
    };

    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('CERTIFICATE_PHOTO').optional(),
        body('ISSUED_BY_ORGANIZATION_NAME').optional(),
        body('CREDENTIAL_ID').optional(),
        body('STATUS').optional(),
        body('REJECT_REMARK').optional(),
        body('TECHNICIAN_ID').isInt().optional(),
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
        return res.status(400).json({ "message": "Invalid filter parameter." });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_technicianCertificateRequest_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({ "message": "Failed to get data." });
                }

                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 215,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.create = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_technicianCertificateRequest_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.NAME,
                data.CERTIFICATE_PHOTO,
                data.ISSUED_BY_ORGANIZATION_NAME,
                data.CREDENTIAL_ID,
                data.STATUS||'P',
                data.REJECT_REMARK,
                data.TECHNICIAN_ID,
                data.TECHNICIAN_NAME,
                data.APPROVER_ID,
                data.REQUESTED_DATETIME,
                data.APPROVED_BY,
                data.ISSUED_DATE,
                data.CLIENT_ID,
                data.ACTION_DATE_TIME,
                data.IS_DELETE||0
            ],
            supportKey,
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({ "message": "Failed to save data." });
                }

                mm.sendNotificationToAdmin(req.body.authData.data.UserData[0].USER_ID,8, "Certificate Request", `Technician ${data.TECHNICIAN_NAME} has send a certificate approval request,\n kindly take action over it.`, "", "C",supportKey,"C", []);

                 
                mm.sendDynamicEmail(62, result[0][0].REQUEST_ID, supportKey)//adminemail
                mm.sendDynamicEmail(67, result[0][0].REQUEST_ID, supportKey)//technicianemail
                var ACTION_DETAILS = `Technician ${data.TECHNICIAN_NAME} has submitted a certificate request.`
                const logData = { TECHNICIAN_ID: data.TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Certificate Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: data.TECHNICIAN_ID, TECHNICIAN_NAME: data.TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: data.TECHNICIAN_NAME, DATE_TIME: data.REQUESTED_DATETIME,DATE_TIME: mm.getSystemDate(), supportKey: 0, IANA_CODE: null }
                dbm.saveLog(logData, TechnicianActionLog)
                res.status(200).json({
                    "message": "TechnicianCertificateRequest information saved successfully...",
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.update = (req, res) => {
    const data = reqData(req);
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        return res.status(422).json({ "code": 422, "message": errors.errors });
    }

    try {
        mm.executeQueryData(
            `CALL sp_technicianCertificateRequest_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.body.ID,
                data.NAME,
                data.CERTIFICATE_PHOTO,
                data.ISSUED_BY_ORGANIZATION_NAME,
                data.CREDENTIAL_ID,
                data.STATUS,
                data.REJECT_REMARK,
                data.TECHNICIAN_ID,
                data.TECHNICIAN_NAME,
                data.APPROVER_ID,
                data.REQUESTED_DATETIME,
                data.APPROVED_BY,
                data.ISSUED_DATE,
                data.CLIENT_ID,
                data.ACTION_DATE_TIME,
                data.IS_DELETE
            ],
            supportKey,
            (error) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({ "message": "Failed to update data." });
                }

                res.status(200).json({
                    "code": 200,
                    "message": "TechnicianCertificateRequest updated successfully"
                });
            }
        );
    } catch (error) {
        console.log(error);
        res.status(500).json({ "code": 500, "message": "Something went wrong." });
    }
};


exports.updateCertificateStatus = (req, res) => {
    const {
        TECHNICIAN_ID,
        TECHNICIAN_NAME,
        STATUS,
        REJECT_REMARK,
        ID
    } = req.body;

    if (!TECHNICIAN_ID || !TECHNICIAN_NAME || !STATUS || !ID) {
        return res.status(400).json({
            "code": 400,
            "message": "TECHNICIAN_ID, TECHNICIAN_NAME, STATUS, ID are required."
        });
    }

    if (!["A", "R"].includes(STATUS)) {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid status."
        });
    }

    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();
    const user = req.body.authData.data.UserData[0];

    try {
        mm.executeQueryData(
            `CALL sp_technicianCertificateRequest_updateStatus(?,?,?,?,?)`,
            [
                ID,
                STATUS,
                STATUS === "R" ? REJECT_REMARK : null,
                user.USER_ID,
                user.NAME
            ],
            supportKey,
            (error) => {
                if (error) {
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technicianCertificateRequest information."
                    });
                }

                /* 🔔 Notification */
                let notificationData = {
                    ORDER_ID: 0,
                    ORDER_NUMBER: "",
                    JOB_CARD_ID: 0,
                    JOB_CARD_NUMBER: "",
                    USER_ID: TECHNICIAN_ID,
                    USER_TYPE: "TECHNICIAN",
                    CREATED_BY: user.USER_ID
                };

                if (STATUS === "A") {
                    mm.sendNotificationToTechnician(
                        user.USER_ID,
                        TECHNICIAN_ID,
                        "Certificate Approved",
                        `Dear ${TECHNICIAN_NAME}, your certificate request is approved`,
                        "",
                        "C",
                        supportKey,
                        "N",
                        "CA",
                        notificationData
                    );
                } else {
                    mm.sendNotificationToTechnician(
                        user.USER_ID,
                        TECHNICIAN_ID,
                        "Certificate Rejected",
                        `Dear ${TECHNICIAN_NAME}, your certificate request is rejected`,
                        "",
                        "C",
                        supportKey,
                        "N",
                        "CR",
                        notificationData
                    );
                }

                /* 🧾 Mongo Log (UNCHANGED) */
                const ACTION_DETAILS =
                    STATUS === "A"
                        ? `User ${user.NAME} has approved the certificate verification request for technician ${TECHNICIAN_NAME}.`
                        : `User ${user.NAME} has rejected the certificate verification request for technician ${TECHNICIAN_NAME}.`;

                const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Certificate Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0, IANA_CODE: null }

                dbm.saveLog(logData, TechnicianActionLog);

                mm.sendDynamicEmail(68, ID, supportKey);

                res.status(200).json({
                    "code": 200,
                    "message": "TechnicianCertificateRequest information updated successfully..."
                });
            }
        );
    } catch (error) {
        logger.error(
            supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
            applicationkey
        );
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};


exports.getStatusCount = (req, res) => {
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
            "message": "Invalid filter parameter."
        });
    }

    try {
        mm.executeQueryData(
            setContext + `CALL sp_technicianCertificateRequest_statusCount()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to get technicianCertificateRequest status count."
                    });
                }

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


exports.deleteCertificate = (req, res) => {
    const { CERTIFICATE_PHOTO, ID } = req.body;
    const supportKey = req.headers['supportkey'];

    if (!ID) {
        return res.status(400).json({
            "code": 400,
            "message": "ID is required."
        });
    }

    try {
        mm.executeQueryData(
            `CALL sp_technicianCertificateRequest_delete(?)`,
            [ID],
            supportKey,
            (error) => {
                if (error) {
                    logger.error(
                        supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
                        applicationkey
                    );
                    console.log(error);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to delete technicianCertificateRequest information."
                    });
                }

                if (CERTIFICATE_PHOTO) {
                    const pathName = path.join(
                        __dirname,
                        '../../uploads/CertificatePhotos/',
                        CERTIFICATE_PHOTO
                    );

                    fs.unlink(pathName, (error) => {
                        if (error) {
                            console.log(error);
                            return res.status(400).json({
                                "code": 400,
                                "message": "Certificate deleted from DB, but file delete failed."
                            });
                        }

                        res.status(200).json({
                            "code": 200,
                            "message": "Successfully deleted"
                        });
                    });
                } else {
                    res.status(200).json({
                        "code": 200,
                        "message": "Successfully deleted"
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
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

