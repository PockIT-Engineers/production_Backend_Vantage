const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
var ticketFaqMapping = "ticket_faq_mapping";
var viewTicketFaqMapping = "view_" + ticketFaqMapping;

function reqData(req) {
    var data = {
        TICKET_GROUP_ID: req.TICKET_GROUP_ID,
        FAQ_MASTER_ID: req.FAQ_MASTER_ID,
        STATUS: req.IS_SELECTED ? 1 : 0,
        CLIENT_ID: req.CLIENT_ID,
        SEQ_NO: req.SEQ_NO
    }
    return data;
}

exports.addBulk = (req, res) => {
    try {
        var data = req.body.data ? req.body.data : [];
        var supportKey = req.headers['supportkey'];
        var TICKET_GROUP_ID = req.body.TICKET_GROUP_ID;

        if ((!TICKET_GROUP_ID || TICKET_GROUP_ID == " ") || (data.length <= 0)) {
            res.status(400).json({
                "message": "TicketGroupId  or data parameter missing"
            });

        } else {
            const connection = mm.openConnection();
            async.eachSeries(data, function iteratorOverElems(applicationMappingitem, callback) {
                applicationMappingitem.TICKET_GROUP_ID = TICKET_GROUP_ID;
                var dataRecord = reqData(applicationMappingitem);

                const params = [
                dataRecord.TICKET_GROUP_ID,
                dataRecord.FAQ_MASTER_ID,
                dataRecord.SEQ_NO,
                dataRecord.STATUS,
                dataRecord.CLIENT_ID
            ];

                mm.executeDML(`CALL sp_ticketFaqMapping_upsert(?, ?, ?, ?, ?)`, params, supportKey, connection, (error, resultsIsDataPresent) => {
                    if (error) {
                        console.log(error)
                        callback(error);
                    }
                    else {
                        callback(null)
                    }
                });
            }, function subCb(error) {
                if (error) {
                    console.log("error",error)
                    mm.rollbackConnection(connection);
                    res.status(400).json({
                        "code":400,
                         "message": "Failed to add ticketFaqMapping details."
                    });
                } else {
                    console.log("inserted successfully...")
                    mm.commitConnection(connection);
                    res.status(200).json({
                        "code":200,
                         "message": "TicketFaqMapping information added successfully.",
                    });
                }
            });
        }

    } catch (error) {
        console.log(req.method + " " + req.url + " ", error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];

    var TICKET_GROUP_ID = req.body.TICKET_GROUP_ID;
    var FAQ_HEAD_ID = req.body.FAQ_HEAD_ID ? req.body.FAQ_HEAD_ID : 0;
    var FAQ_TYPE = req.body.FAQ_TYPE
    var filter = ` AND FAQ_TYPE =  "${FAQ_TYPE}"`
    var filterQuery = FAQ_HEAD_ID != 0 ? ` AND FAQ_HEAD_ID = ${FAQ_HEAD_ID}` : ''
    var ORG_ID = req.body.ORG_ID;

    const setContext = `
        SET @v_TICKET_GROUP_ID= ${TICKET_GROUP_ID || 0};
        SET @v_FAQ_HEAD_ID= ${FAQ_HEAD_ID || 0};
        SET @v_FAQ_TYPE= '${FAQ_TYPE }';
        SET @v_filter= '${filter}';
        SET @v_filterQuery= '${filterQuery}';
        SET @v_ORG_ID= ${ORG_ID || 0};
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
            setContext + 'CALL sp_ticketFaqMapping_get()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 168,
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

exports.getTicketFaqMappings = (req, res) => {
    const supportKey = req.headers['supportkey'];

    var TICKET_GROUP_ID = req.body.TICKET_GROUP_ID;
    var ORG_ID = req.body.ORG_ID;
    var FAQ_TYPE = req.body.FAQ_TYPE

    const setContext = `
        SET @v_TICKET_GROUP_ID= ${TICKET_GROUP_ID || 0};
        SET @v_ORG_ID= ${ORG_ID || 0};
        SET @v_FAQ_TYPE= '${FAQ_TYPE}';
    `;
    if (!TICKET_GROUP_ID || !ORG_ID) {
        return res.status(422).json({
            "message": "Parameters missing.. "
        });
    }
    try {
        mm.executeQueryData(
            setContext + 'CALL sp_TicketFaqMappings_getTicketFaqMappings()',
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400,  "message": 'Failed to get data' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const dataResult = resultSets[0] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 168,
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