const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var languageMaster = "language_master";
var viewLanguageMaster = "view_" + languageMaster;

function reqData(req) {

	var data = {
		NAME: req.body.NAME,
		SHORT_CODE: req.body.SHORT_CODE,
		IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
		SEQ_NO: req.body.SEQ_NO,
		CLIENT_ID: req.body.CLIENT_ID
	}
	return data;
}

exports.validate = function () {
	return [
		body('NAME').optional(),
		body('SHORT_CODE').optional(),
		body('SEQ_NO').isInt().optional(),
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

	if (IS_FILTER_WRONG !== "0")
		return res.send({ "code": 400,  "message": "Invalid filter parameter." });

	try {
		mm.executeQueryData(
			setContext+`CALL sp_language_get()`,
			[],
			supportKey,
			(error, results) => {
				if (error) {
					console.log(error);
					return res.send({ "code": 400,  "message": "Failed to get language information." });
				}
				const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 59,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
			}
		);
	} catch (error) {
		console.log(error);
		res.send({ "code": 500,  "message": "Something went wrong." });
	}
};


exports.create = (req, res) => {
	const data = reqData(req);
	const errors = validationResult(req);
	const supportKey = req.headers['supportkey'];

	if (!errors.isEmpty())
		return res.send({ "code": 422,  "message": errors.errors });

	try {
		mm.executeQueryData(
			`CALL sp_language_create(?,?,?,?,?)`,
			[data.NAME, data.SHORT_CODE, data.IS_ACTIVE, data.SEQ_NO, data.CLIENT_ID],
			supportKey,
			(error,result) => {
				if (error) {
					console.log(error);
					return res.send({ "code": 400,  "message": error.sqlMessage });
				}

				dbm.saveLog({
					SOURCE_ID: result[0][0].ID,
					LOG_DATE_TIME: mm.getSystemDate(),
					LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} created language ${data.NAME}.`,
					CATEGORY: "Language",
					CLIENT_ID: 1,
					USER_ID: req.body.authData.data.UserData[0].USER_ID,
					supportKey: 0
				}, systemLog);

				res.send({ "code": 200,  "message": "language information saved successfully..." });
			}
		);
	} catch (error) {
		console.log(error);
		res.send({ "code": 500,  "message": "Something went wrong." });
	}
};


exports.update = (req, res) => {
	const data = reqData(req);
	const ID = req.body.ID;
	const errors = validationResult(req);
	const supportKey = req.headers['supportkey'];

	if (!ID)
		return res.send({ "code": 400,  "message": "ID is required." });

	if (!errors.isEmpty())
		return res.send({ "code": 422,  "message": errors.errors });

	try {
		mm.executeQueryData(
			`CALL sp_language_update(?,?,?,?,?,?)`,
			[ID, data.NAME, data.SHORT_CODE, data.IS_ACTIVE, data.SEQ_NO, data.CLIENT_ID],
			supportKey,
			(error) => {
				if (error) {
					console.log(error);
					return res.send({ "code": 400,  "message": error.sqlMessage });
				}

				dbm.saveLog({
					SOURCE_ID: ID,
					LOG_DATE_TIME: mm.getSystemDate(),
					LOG_TEXT: `User ${req.body.authData.data.UserData[0].NAME} updated language ${data.NAME}.`,
					CATEGORY: "Language",
					CLIENT_ID: 1,
					USER_ID: req.body.authData.data.UserData[0].USER_ID,
					supportKey: 0
				}, systemLog);

				res.send({ "code": 200,  "message": "language information updated successfully..." });
			}
		);
	} catch (error) {
		console.log(error);
		res.send({ "code": 500,  "message": "Something went wrong." });
	}
};
