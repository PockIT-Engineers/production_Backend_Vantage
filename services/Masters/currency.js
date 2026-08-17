const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var currencyMaster = "currency_master";
var viewCurrencyMaster = "view_" + currencyMaster;

function reqData(req) {
	var data = {
		CURRENCY_NAME: req.body.CURRENCY_NAME,
		SHORT_CODE: req.body.SHORT_CODE,
		DECIMAL_SEPARATOR: req.body.DECIMAL_SEPARATOR,
		EXCHANGE_RATE: req.body.EXCHANGE_RATE,
		DECIMAL_SPACE: req.body.DECIMAL_SPACE,
		THOUSAND_SEPERATOR: req.body.THOUSAND_SEPERATOR,
		SYMBOL: req.body.SYMBOL,
		COUNTRY_ID: req.body.COUNTRY_ID,
		IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
		ICON: req.body.ICON,
		SEQ_NO: req.body.SEQ_NO,
		CLIENT_ID: req.body.CLIENT_ID
	}
	return data;
}

exports.validate = function () {
	return [
		body('CURRENCY_NAME').optional(),
		body('SHORT_CODE').optional(),
		body('SIGN').optional(),
		body('SEQ_NO').isInt().optional(),
		body('ID').optional(),
	]
}

exports.get = (req, res) => {

	var supportKey = req.headers['supportkey'];

	var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
	var pageSize = req.body.pageSize ? req.body.pageSize : '';

	let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
	let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
	let filter = req.body.filter ? req.body.filter : '';

	filter = (filter || '').trim();

	var IS_FILTER_WRONG = IS_FILTER_WRONG = mm.sanitizeFilter(filter);


	const safeFilter = (filter || '').replace(/'/g, "\\'");

	const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;

	try {
		if (IS_FILTER_WRONG == "0") {
			mm.executeQueryData(
				setContext + ` CALL sp_currencyMaster_get(); `,
				[],
				supportKey,
				(error, results) => {
					if (error) {
						console.log(error);
						logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
						res.send({
							"code": 400,
							"message": "Failed to get currency information."
						});
					}
					else {
						const resultSets = results.filter(r => Array.isArray(r));
						const countResult = resultSets[0] || [];
						const dataResult = resultSets[1] || [];

						res.send({
							"code": 200,
							"message": "success",
							"TAB_ID": 16,
							"count": countResult[0] ? countResult[0].cnt : 0,
							"data": dataResult
						});
					}
				}
			);
		}
		else {
			res.send({
				"code": 400,
				"message": "Invalid filter parameter."
			})
		}

	} catch (error) {
		logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
		console.log(error);
		res.send({
			"code": 500,
			"message": "Something went wrong."
		});
	}
}

exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(
                'CALL sp_currencyMaster_create(?,?,?,?,?,?,?,?,?,?,?,?)',
                [
                    data.CURRENCY_NAME,
                    data.SHORT_CODE,
                    data.DECIMAL_SEPARATOR,
                    data.EXCHANGE_RATE,
                    data.DECIMAL_SPACE,
                    data.THOUSAND_SEPERATOR,
                    data.SYMBOL,
                    data.COUNTRY_ID,
                    data.IS_ACTIVE,
                    data.ICON,
                    data.SEQ_NO,
                    data.CLIENT_ID
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save currency information..."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const spRes = resultSets[0] || [];

                        const code = spRes[0] ? spRes[0].code : 400;
                        const message = spRes[0] ? spRes[0].message : "Failed to save currency information...";
                        const insertId = spRes[0] ? spRes[0].insertId : 0;

                        if (code == 200) {
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new currency ,${data.CURRENCY_NAME}.`;
                            var logCategory = "Currency"

                            let actionLog = {
                                "SOURCE_ID": insertId,
                                "LOG_DATE_TIME": mm.getSystemDate(),
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                "supportKey": 0
                            }
                            dbm.saveLog(actionLog, systemLog)
                        }

                        res.send({
                            "code": code,
                            "message": message
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}



exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];

    var criteria = {
        ID: req.body.ID,
    };

    var systemDate = mm.getSystemDate();

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(
                'CALL sp_currencyMaster_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [
                    criteria.ID,
                    data.CURRENCY_NAME,
                    data.SHORT_CODE,
                    data.DECIMAL_SEPARATOR,
                    data.EXCHANGE_RATE,
                    data.DECIMAL_SPACE,
                    data.THOUSAND_SEPERATOR,
                    data.SYMBOL,
                    data.COUNTRY_ID,
                    data.IS_ACTIVE,
                    data.ICON,
                    data.SEQ_NO,
                    data.CLIENT_ID,
                    systemDate
                ],
                supportKey,
                (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update currency information."
                        });
                    }
                    else {
                        const resultSets = results.filter(r => Array.isArray(r));
                        const spRes = resultSets[0] || [];

                        const code = spRes[0] ? spRes[0].code : 400;
                        const message = spRes[0] ? spRes[0].message : "Failed to update currency information.";

                        if (code == 200) {
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the currency ${data.CURRENCY_NAME}..`;
                            var logCategory = "Currency"

                            let actionLog = {
                                "SOURCE_ID": criteria.ID,
                                "LOG_DATE_TIME": mm.getSystemDate(),
                                "LOG_TEXT": ACTION_DETAILS,
                                "CATEGORY": logCategory,
                                "CLIENT_ID": 1,
                                "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                "supportKey": 0
                            }
                            dbm.saveLog(actionLog, systemLog)
                        }

                        res.send({
                            "code": code,
                            "message": message
                        });
                    }
                }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}
