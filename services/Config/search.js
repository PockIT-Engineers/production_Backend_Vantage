const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const applicationkey = process.env.APPLICATION_KEY;


exports.getDistinctData = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let keywords = req.body.keywords ? req.body.keywords : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : keywords;
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let TAB_ID = req.body.TAB_ID ? req.body.TAB_ID : '';
    const isMongo = req.body.isMongo ? 1 : 0;

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
        SET @v_TAB_ID = ${TAB_ID};
        SET @v_keywords = '${keywords}';
    `;

    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    const IS_FILTER_WRONG1 = mm.sanitizeFilter(keywords);

    let start = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex === '' && pageSize === '') {
        criteria = filter + " ORDER BY " + sortKey + " " + sortValue;
    } else {
        criteria = filter + " ORDER BY " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    }

    if (IS_FILTER_WRONG !== "0" && IS_FILTER_WRONG1 !== 0) {
        res.status(400).send({
            "code": 400,
            "message": "Invalid filter parameter.",
        });
        return;
    }

    try {
        if (isMongo == 1) {
            const tabNameRecord = await mongoose.connection.collection('coll_master').findOne({ _id: new ObjectId(TAB_ID) });
            if (!tabNameRecord) {
                return res.status(404).send({
                    "code": 404,
                    "message": "Table information not found."
                });
            }

            const tableName = tabNameRecord.COLL_NAME;
            const collection = mongoose.connection.collection(tableName);

            let filter = {};
            const distinctValues = await collection.distinct(keywords, filter);
            const data = distinctValues.map(value => ({ [keywords]: value }));

            const totalCount = distinctValues.length;

            res.status(200).json({
                "code": 200,
                "message": "Success",
                count: totalCount,
                data: data,
            });
        } else {
            mm.executeQueryData(
                setContext + `CALL sp_search_getDistinctData()`,
                [],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).send({
                            "code": 400,
                            "message": "Failed to get data."
                        });
                    } else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        if (resultSets[0].code == 300) {
                            res.status(200).send({
                                "code": 200,
                                "message": "No records found."
                            });
                        }
                        else {
                            const countResult = resultSets[0] || [];
                            const dataResult = resultSets[1] || [];
                            res.status(200).send({
                                "code": 200,
                                "message": "sucess",
                                "count": countResult,
                                "data": dataResult
                            });
                        }

                    }
                }
            );

        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey);
        console.error(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong.",
        });
    }
};
