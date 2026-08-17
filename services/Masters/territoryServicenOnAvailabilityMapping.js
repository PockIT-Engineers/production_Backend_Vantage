const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const servicelog = require("../../modules/serviceLog")
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');

var territoryServiceNonAvailabilityMapping = "territory_service_non_availability_mapping";
var viewTerritoryServiceNonAvailabilityMapping = "view_" + territoryServiceNonAvailabilityMapping;

function reqData(req) {

	var data = {
		TERRITORY_ID: req.body.TERRITORY_ID,
		SERVICE_ID: req.body.SERVICE_ID,
		IS_AVAILABLE: req.body.IS_AVAILABLE ? "1" : "0",
		START_TIME: req.body.START_TIME,
		END_TIME: req.body.END_TIME,
		B2B_PRICE: req.body.B2B_PRICE,
		B2C_PRICE: req.body.B2C_PRICE,
		TECHNICIAN_COST: req.body.TECHNICIAN_COST,
		VENDOR_COST: req.body.VENDOR_COST,
		EXPRESS_COST: req.body.EXPRESS_COST,
		CLIENT_ID: req.body.CLIENT_ID,
		CATEGORY_NAME: req.body.CATEGORY_NAME,
		SUB_CATEGORY_NAME: req.body.SUB_CATEGORY_NAME,
		IS_EXPRESS: req.body.IS_EXPRESS ? "1" : "0",
		NAME: req.body.NAME,
		DESCRIPTION: req.body.DESCRIPTION,
		SERVICE_IMAGE: req.body.SERVICE_IMAGE,
		SERVICE_TYPE: req.body.SERVICE_TYPE,
		PREPARATION_MINUTES: req.body.PREPARATION_MINUTES,
		PREPARATION_HOURS: req.body.PREPARATION_HOURS,
		HSN_CODE_ID: req.body.HSN_CODE_ID,
		HSN_CODE: req.body.HSN_CODE,
		TAX_ID: req.body.TAX_ID,
		UNIT_ID: req.body.UNIT_ID


	}

	return data;
}


exports.validate = function () {
	return [
		body('TERRITORY_ID').isInt().optional(),
		body('SERVICE_ID').isInt().optional(),
		body('DATE').optional(),
		body('START_TIME').optional(),
		body('END_TIME').optional(),
		body('RECURRING').optional(),
		body('REMARKS').optional(),
		body('UPDATED_DATE').optional(),
		body('ID').optional(),
	]
}
//D
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

	if (mm.sanitizeFilter(filter || '') !== "0") {
		return res.status(400).json({ "message": "Invalid filter parameter." });
	}

	try {
		mm.executeQueryData(
			setContext + `CALL sp_territoryServiceNonAvailability_get()`,
			[],
			supportKey,
			(error, results) => {
				if (error) {
					console.log(error);
					return res.status(400).json({
						"code": 400,
						"message": "Failed to get territoryServiceNonAvailabilityMapping."
					});
				}

				const resultSets = results.filter(r => Array.isArray(r));
				const countResult = resultSets[0] || [];
				const dataResult = resultSets[1] || [];

				return res.status(200).json({
					"code": 200,
					"message": "success",
					"TAB_ID": 1625,
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
	const SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME;
	const CATEGORY_NAME = req.body.CATEGORY_NAME;
	const SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID;
	const DURARTION_HOUR = req.body.DURARTION_HOUR;
	const DURARTION_MIN = req.body.DURARTION_MIN;
	const CUSTOMER_ID = req.body.CUSTOMER_ID;
	const UNIT_ID = req.body.UNIT_ID;
	const UNIT_NAME = req.body.UNIT_NAME
	const SHORT_CODE = req.body.SHORT_CODE;
	const MAX_QTY = req.body.MAX_QTY;
	const TAX_ID = req.body.TAX_ID;
	const TAX_NAME = req.body.TAX_NAME;
	const IS_NEW = req.body.IS_NEW;
	const PARENT_ID = req.body.PARENT_ID;
	const IS_PARENT = req.body.IS_PARENT;
	const IS_FOR_B2B = req.body.IS_FOR_B2B;
	const IS_JOB_CREATED_DIRECTLY = req.body.IS_JOB_CREATED_DIRECTLY;
	const ORG_ID = req.body.ORG_ID;
	const QTY = req.body.QTY;
	const STATUS = req.body.STATUS;
	const TERRITORY_ID = req.body.TERRITORY_ID;
	if (!errors.isEmpty()) {
		return res.status(422).json({ "code": 422, "message": errors.errors });
	}

	try {
		mm.executeQueryData(
			`CALL sp_territoryServiceNonAvailability_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
			[data.TERRITORY_ID || 0,
			data.SERVICE_ID || 0,
			data.IS_AVAILABLE ? 1 : 0,
			data.START_TIME || "00:00:00",
			data.END_TIME || "00:00:00",
			data.B2B_PRICE || 0,
			data.B2C_PRICE || 0,
			data.TECHNICIAN_COST || 0,
			data.VENDOR_COST || 0,
			data.EXPRESS_COST || 0,
			data.CLIENT_ID || 0,
			data.CATEGORY_NAME || "",
			data.SUB_CATEGORY_NAME || "",
			data.IS_EXPRESS ? 1 : 0,
			data.NAME || "",
			data.DESCRIPTION || "",
			data.SERVICE_IMAGE || "",
			data.SERVICE_TYPE || "",
			data.PREPARATION_MINUTES || 0,
			data.PREPARATION_HOURS || 0,
			data.HSN_CODE_ID || 0,
			data.HSN_CODE || "",
			data.TAX_ID || 0,
			data.UNIT_ID || 0],
			supportKey,
			(error, result) => {
				if (error) {
					console.log(error);
					return res.status(400).json({
						"code": 400,
						"message": "Failed to save territory service non availability."
					});
				}

				const systemDate = mm.getSystemDate();
				const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped new territory non-availability service`;

				const logData2 = {
					"LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": 'TERS',
					"USER_ID": req.body.authData.data.UserData[0].USER_ID, "ADDED_BY": req.body.authData.data.UserData[0].NAME,
					"SERVICE_ID": data.SERVICE_ID, "CUSTOMER_ID": CUSTOMER_ID, "TERRITORY_ID": TERRITORY_ID, "NAME": data.NAME,
					"DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME,
					"SUB_CATEGORY_ID": SUB_CATEGORY_ID, "B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE,
					"TECHNICIAN_COST": data.TECHNICIAN_COST, "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
					"IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": DURARTION_HOUR,
					"DURATION_MIN": DURARTION_MIN, "PREPARATION_MINUTES": data.PREPARATION_MINUTES,
					"PREPARATION_HOURS": data.PREPARATION_HOURS, "UNIT_ID": UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": SHORT_CODE,
					"MAX_QTY": MAX_QTY, "TAX_ID": TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME, "END_TIME": data.END_TIME,
					"IS_NEW": IS_NEW, "PARENT_ID": PARENT_ID, "IS_PARENT": IS_PARENT, "SERVICE_IMAGE": data.SERVICE_IMAGE,
					"IS_FOR_B2B": IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": IS_JOB_CREATED_DIRECTLY,
					"IS_AVAILABLE": data.IS_AVAILABLE, "ORG_ID": ORG_ID, "QTY": QTY, "STATUS": STATUS, "HSN_CODE_ID": data.HSN_CODE_ID, "HSN_CODE": data.HSN_CODE, "SUPPORT_KEY": supportKey
				};
				addGlobalData(result[0][0].INSERT_ID, supportKey)

				dbm.saveLog(logData2, servicelog);
				return res.status(200).json({
					"code": 200,
					"message": "ServiceItem information updated and logged successfully."
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
	const SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME;
	const CATEGORY_NAME = req.body.CATEGORY_NAME;
	const SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID;
	const DURARTION_HOUR = req.body.DURARTION_HOUR
	const DURARTION_MIN = req.body.DURARTION_MIN
	const CUSTOMER_ID = req.body.CUSTOMER_ID
	const UNIT_ID = req.body.UNIT_ID
	const UNIT_NAME = req.body.UNIT_NAME
	const SHORT_CODE = req.body.SHORT_CODE
	const MAX_QTY = req.body.MAX_QTY
	const TAX_ID = req.body.TAX_ID
	const TAX_NAME = req.body.TAX_NAME
	const IS_NEW = req.body.IS_NEW
	const PARENT_ID = req.body.PARENT_ID
	const IS_PARENT = req.body.IS_PARENT
	const IS_FOR_B2B = req.body.IS_FOR_B2B
	const IS_JOB_CREATED_DIRECTLY = req.body.IS_JOB_CREATED_DIRECTLY
	const ORG_ID = req.body.ORG_ID
	const QTY = req.body.QTY
	const STATUS = req.body.STATUS
	const systemDate = mm.getSystemDate();
	if (!errors.isEmpty()) {
		return res.status(422).json({ "code": 422, "message": errors.errors });
	}

	try {
		mm.executeQueryData(
			`CALL sp_territoryServiceNonAvailability_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
			[
				req.body.ID,
				data.TERRITORY_ID || 0,
				data.SERVICE_ID || 0,
				data.IS_AVAILABLE ? 1 : 0,
				data.START_TIME || "00:00:00",
				data.END_TIME || "00:00:00",
				data.B2B_PRICE || 0,
				data.B2C_PRICE || 0,
				data.TECHNICIAN_COST || 0,
				data.VENDOR_COST || 0,
				data.EXPRESS_COST || 0,
				data.CLIENT_ID || 0,
				data.CATEGORY_NAME || "",
				data.SUB_CATEGORY_NAME || "",
				data.IS_EXPRESS ? 1 : 0,
				data.NAME || "",
				data.DESCRIPTION || "",
				data.SERVICE_IMAGE || "",
				data.SERVICE_TYPE || "",
				data.PREPARATION_MINUTES || 0,
				data.PREPARATION_HOURS || 0,
				data.HSN_CODE_ID || 0,
				data.HSN_CODE || "",
				data.TAX_ID || 0,
				data.UNIT_ID || 0
			],
			supportKey,
			(error) => {
				if (error) {
					console.log(error);
					return res.status(400).json({
						"code": 400,
						"message": "Failed to update territory service non availability."
					});
				}

				const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of the territory non-availability service mapping.`;

				let logData2 = {
					"LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": 'TERS', "USER_ID": req.body.authData.data.UserData[0].USER_ID,
					"ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": data.SERVICE_ID, "CUSTOMER_ID": CUSTOMER_ID, "TERRITORY_ID": data.TERRITORY_ID,
					"NAME": data.NAME, "DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME, "SUB_CATEGORY_ID": SUB_CATEGORY_ID,
					"B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE, "TECHNICIAN_COST": data.TECHNICIAN_COST, "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
					"IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": DURARTION_HOUR, "DURATION_MIN": DURARTION_MIN,
					"PREPARATION_MINUTES": data.PREPARATION_MINUTES, "PREPARATION_HOURS": data.PREPARATION_HOURS, "UNIT_ID": UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": SHORT_CODE,
					"MAX_QTY": MAX_QTY, "TAX_ID": TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME, "END_TIME": data.END_TIME, "IS_NEW": IS_NEW, "PARENT_ID": PARENT_ID,
					"IS_PARENT": IS_PARENT, "SERVICE_IMAGE": data.SERVICE_IMAGE, "IS_FOR_B2B": IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": IS_JOB_CREATED_DIRECTLY,
					"IS_AVAILABLE": data.IS_AVAILABLE, "ORG_ID": ORG_ID, "QTY": QTY, "STATUS": STATUS, "HSN_CODE_ID": data.HSN_CODE_ID, "HSN_CODE": data.HSN_CODE, "SUPPORT_KEY": supportKey
				};
				addGlobalData(req.body.ID, supportKey)

				dbm.saveLog(logData2, servicelog);
				return res.send({
					"code": 200,
					"message": "ServiceItem information updated and logged successfully."
				});
			}
		);
	} catch (error) {
		console.log(error);
		res.status(500).json({ "code": 500, "message": "Something went wrong." });
	}
};


//D
exports.addBulk = (req, res) => {

	const { TERITORY_ID, CLIENT_ID, data } = req.body;
	const supportKey = req.headers['supportkey'];
	const connection = mm.openConnection();

	try {
		async.eachSeries(
			data,
			(item, cb) => {
				mm.executeDML(
					`CALL sp_territoryServiceNonAvailabilityMapping_upsert(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
					[
						TERRITORY_ID,
						service.SERVICE_ID,
						service.IS_AVAILABLE ? 1 : 0,
						service.START_TIME,
						service.END_TIME,
						service.B2B_PRICE,
						service.B2C_PRICE,
						service.TECHNICIAN_COST,
						service.VENDOR_COST,
						service.EXPRESS_COST,
						service.IS_EXPRESS ? 1 : 0,
						service.NAME,
						service.DESCRIPTION,
						service.SERVICE_IMAGE,
						service.SERVICE_TYPE,
						service.PREPARATION_MINUTES,
						service.PREPARATION_HOURS,
						CLIENT_ID,
						service.CATEGORY_NAME,
						service.SUB_CATEGORY_NAME,
						service.HSN_CODE_ID,
						service.HSN_CODE,
						service.UNIT_ID,
						service.TAX_ID
					],
					supportKey,
					connection,
					(error) => {
						if (error) {
							console.log("SP error", error);
							return cb(error);
						}
						cb(null);
					}
				);
			},
			(error) => {
				if (error) {
					mm.rollbackConnection(connection);
					return res.status(400).json({
						"code": 400,
						"message": "Failed to insert territoryServiceNonAvailabilityMapping information."
					});
				}

				const ACTION_DETAILS =
					`User ${req.body.authData.data.UserData[0].NAME} has mapped the territory non-availability service.`;

				dbm.saveLog(
					{
						SOURCE_ID: TERITORY_ID,
						LOG_DATE_TIME: mm.getSystemDate(),
						LOG_TEXT: ACTION_DETAILS,
						CATEGORY: "territoryServiceNonAvailabilityMapping",
						CLIENT_ID: 1,
						USER_ID: req.body.authData.data.UserData[0].USER_ID,
						supportKey: 0
					},
					systemLog
				);

				mm.commitConnection(connection);

				return res.status(200).json({
					"code": 200,
					"message": "Territory service non-availability mapping added successfully."
				});
			}
		);
	} catch (error) {
		mm.rollbackConnection(connection);
		console.log(error);
		logger.error(
			supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error),
			applicationkey
		);

		res.status(500).json({
			"code": 500,
			"message": "Something went wrong."
		});
	}
};

//D
exports.serviceDetails = (req, res) => {

	const supportKey = req.headers['supportkey'];
	var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
	var pageSize = req.body.pageSize ? req.body.pageSize : '';
	let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
	let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
	let filter = req.body.filter ? req.body.filter : '';
	let TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : '';
	filter = TERRITORY_ID > 0 ? filter + ` AND TERRITORY_ID = ${TERRITORY_ID}` : filter
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
			setContext + `CALL sp_serviceDetails_get()`,
			[],
			supportKey,
			(error, results) => {
				if (error) {
					console.log(error);
					return res.status(400).json({
						"code": 400,
						"message": "Failed to get service details."
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
		console.log(error);
		logger.error(
			supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error),
			applicationkey
		);
		res.status(500).json({
			"code": 500,
			"message": "Something went wrong."
		});
	}
};

//D
exports.addBulkService = (req, res) => {
	const TERRITORY_ID = req.body.TERRITORY_ID;
	const systemDate = mm.getSystemDate();
	const data = req.body.data;
	const CLIENT_ID = req.body.CLIENT_ID;
	const supportKey = req.headers['supportkey'];

	try {
		if (!TERRITORY_ID) {
			return res.send({
				"code": 400,
				"message": "Please provide Territory ID"
			});
		} else {
			var SERVICE_LOGS = [];
			const connection = mm.openConnection();

			async.eachSeries(data, (service, callback) => {
				mm.executeDML(
					`CALL sp_territoryServiceNonAvailabilityMapping_upsert(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
					[
						TERRITORY_ID,
						service.SERVICE_ID,
						service.IS_AVAILABLE ? 1 : 0,
						service.START_TIME,
						service.END_TIME,
						service.B2B_PRICE,
						service.B2C_PRICE,
						service.TECHNICIAN_COST,
						service.VENDOR_COST,
						service.EXPRESS_COST,
						service.IS_EXPRESS ? 1 : 0,
						service.NAME,
						service.DESCRIPTION,
						service.SERVICE_IMAGE,
						service.SERVICE_TYPE,
						service.PREPARATION_MINUTES,
						service.PREPARATION_HOURS,
						CLIENT_ID,
						service.CATEGORY_NAME,
						service.SUB_CATEGORY_NAME,
						service.HSN_CODE_ID,
						service.HSN_CODE,
						service.UNIT_ID,
						service.TAX_ID
					],
					supportKey,
					connection,
					(error, result) => {
						if (error) return callback(error);

						var ACTION_DETAILS = ''
						var ID = result[0][0].ID
						if (result[0][0].ACTION_TYPE == 1) {
							ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME}  has updated the service named ${service.NAME}.`;
						}
						else {
							ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created a new service named ${service.NAME}.`;
						}

						const logData = {
							LOG_DATE_TIME: systemDate,
							LOG_TEXT: ACTION_DETAILS,
							LOG_TYPE: 'TERS',
							USER_ID: req.body.authData.data.UserData[0].USER_ID,
							ADDED_BY: req.body.authData.data.UserData[0].NAME,
							SERVICE_ID: ID,
							CUSTOMER_ID: service.CUSTOMER_ID ? service.CUSTOMER_ID : '0',
							TERRITORY_ID: service.TERRITORY_ID,
							NAME: service.NAME,
							DESCRIPTION: service.DESCRIPTION,
							CATEGORY_NAME: service.CATEGORY_NAME,
							SUB_CATEGORY_NAME: service.SUB_CATEGORY_NAME,
							SUB_CATEGORY_ID: service.SUB_CATEGORY_ID,
							B2B_PRICE: service.B2B_PRICE,
							B2C_PRICE: service.B2C_PRICE,
							TECHNICIAN_COST: service.TECHNICIAN_COST,
							VENDOR_COST: service.VENDOR_COST,
							EXPRESS_COST: service.EXPRESS_COST,
							IS_EXPRESS: service.IS_EXPRESS,
							SERVICE_TYPE: service.SERVICE_TYPE,
							DURATION_HOUR: service.DURATION_HOUR,
							DURATION_MIN: service.DURATION_MIN,
							PREPARATION_MINUTES: service.PREPARATION_MINUTES,
							PREPARATION_HOURS: service.PREPARATION_HOURS,
							UNIT_ID: service.UNIT_ID,
							UNIT_NAME: service.UNIT_NAME,
							SHORT_CODE: service.SHORT_CODE,
							MAX_QTY: service.MAX_QTY,
							TAX_ID: service.TAX_ID,
							TAX_NAME: service.TAX_NAME,
							START_TIME: service.START_TIME,
							END_TIME: service.END_TIME,
							IS_NEW: service.IS_NEW,
							PARENT_ID: service.PARENT_ID,
							IS_PARENT: service.IS_PARENT,
							SERVICE_IMAGE: service.SERVICE_IMAGE,
							IS_FOR_B2B: service.IS_FOR_B2B,
							IS_JOB_CREATED_DIRECTLY: service.IS_JOB_CREATED_DIRECTLY,
							IS_AVAILABLE: service.IS_AVAILABLE,
							ORG_ID: service.ORG_ID ? service.ORG_ID : '0',
							QTY: service.QTY,
							STATUS: service.STATUS,
							HSN_CODE_ID: service.HSN_CODE_ID,
							HSN_CODE: service.HSN_CODE,
							SUPPORT_KEY: supportKey
						};
						addGlobalData(ID, supportKey)
						SERVICE_LOGS.push(logData)

						callback();
					}
				);

			}, (err) => {
				if (err) {
					console.log("err", err)
					mm.rollbackConnection(connection);
					res.send({
						"code": 400,
						"message": "Failed to save vendor information."
					});
				} else {
					dbm.saveLog(SERVICE_LOGS, servicelog);
					mm.commitConnection(connection);
					res.send({
						"code": 200,
						"message": "Vendor information updated/inserted successfully."
					});
				}
			});
		}
	} catch (error) {
		logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
		console.log(error);
		res.send({
			"code": 500,
			"message": "Something went wrong."
		});
	}
};



//D
exports.mapNonServiceTeritory = async (req, res) => {

	const { TERRITORY_ID, service_ids, CLIENT_ID } = req.body;
	const supportKey = req.headers['supportkey'];
	const systemDate = mm.getSystemDate();

	if (!TERRITORY_ID || !Array.isArray(service_ids) || service_ids.length === 0) {
		return res.status(400).json({
			"code": 400,
			"message": "TERRITORY_ID and service_ids are required"
		});
	}

	const connection = mm.openConnection();
	let SERVICE_LOGS = [];

	try {
		for (const SERVICE_ID of service_ids) {

			await new Promise((resolve, reject) => {
				mm.executeDML(
					`CALL sp_territoryServiceNonAvailability_mapNonServiceTeritory(?,?,?)`,
					[TERRITORY_ID, SERVICE_ID, CLIENT_ID],
					supportKey,
					connection,
					(error, result) => {
						if (error) return reject(error);
						var serviceData = result[0]
						var mappingData = result[1]
						const logData = {
							LOG_DATE_TIME: mm.getSystemDate(),
							LOG_TEXT: `${req.body.authData.data.UserData[0].NAME} has updated TERS for service ${serviceData[0].NAME}.`,
							LOG_TYPE: 'TERS',
							USER_ID: req.body.authData.data.UserData[0].USER_ID,
							ADDED_BY: req.body.authData.data.UserData[0].NAME,
							SERVICE_ID: SERVICE_ID,
							CUSTOMER_ID: serviceData[0].CUSTOMER_ID,
							TERRITORY_ID: TERRITORY_ID,
							NAME: serviceData[0].NAME,
							DESCRIPTION: serviceData[0].DESCRIPTION,
							CATEGORY_NAME: serviceData[0].CATEGORY_NAME,
							SUB_CATEGORY_NAME: serviceData[0].SUB_CATEGORY_NAME,
							SUB_CATEGORY_ID: serviceData[0].SUB_CATEGORY_ID,
							B2B_PRICE: serviceData[0].B2B_PRICE,
							B2C_PRICE: serviceData[0].B2C_PRICE,
							TECHNICIAN_COST: serviceData[0].TECHNICIAN_COST,
							VENDOR_COST: serviceData[0].VENDOR_COST,
							EXPRESS_COST: serviceData[0].EXPRESS_COST,
							IS_EXPRESS: serviceData[0].IS_EXPRESS,
							SERVICE_TYPE: serviceData[0].SERVICE_TYPE,
							DURATION_HOUR: serviceData[0].DURARTION_HOUR,
							DURATION_MIN: serviceData[0].DURARTION_MIN,
							PREPARATION_MINUTES: serviceData[0].PREPARATION_MINUTES,
							PREPARATION_HOURS: serviceData[0].PREPARATION_HOURS,
							UNIT_ID: serviceData[0].UNIT_ID,
							UNIT_NAME: serviceData[0].UNIT_NAME,
							SHORT_CODE: serviceData[0].SHORT_CODE,
							MAX_QTY: serviceData[0].MAX_QTY,
							TAX_ID: serviceData[0].TAX_ID,
							TAX_NAME: serviceData[0].TAX_NAME,
							START_TIME: serviceData[0].START_TIME,
							END_TIME: serviceData[0].END_TIME,
							IS_NEW: serviceData[0].IS_NEW,
							PARENT_ID: serviceData[0].PARENT_ID,
							IS_PARENT: serviceData[0].IS_PARENT,
							SERVICE_IMAGE: serviceData[0].SERVICE_IMAGE,
							IS_FOR_B2B: serviceData[0].IS_FOR_B2B,
							IS_JOB_CREATED_DIRECTLY: serviceData[0].IS_JOB_CREATED_DIRECTLY,
							IS_AVAILABLE: serviceData[0].IS_AVAILABLE,
							ORG_ID: serviceData[0].ORG_ID,
							QTY: serviceData[0].QTY,
							STATUS: serviceData[0].STATUS,
							HSN_CODE_ID: serviceData[0].HSN_CODE_ID,
							HSN_CODE: serviceData[0].HSN_CODE,
							SUPPORT_KEY: supportKey
						};

						SERVICE_LOGS.push(logData)
						addGlobalData(mappingData[0].ID, supportKey)

						resolve();
					}
				);
			});
		}

		mm.commitConnection(connection);
		dbm.saveLog(SERVICE_LOGS, servicelog);

		res.status(200).json({
			"code": 200,
			"message": "Territory service non-availability mappings updated successfully"
		});

	} catch (error) {
		mm.rollbackConnection(connection);
		console.error(error);
		logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);

		res.status(500).json({
			"code": 500,
			"message": "Failed to map services to territory"
		});
	}
};


function addGlobalData(data_Id, supportKey) {
	try {
		const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID' ;
        SET @v_SORT_VALUE = 'DESC';
        SET @v_FILTER = 'AND ID=${data_Id}';
    `;
		mm.executeQueryData(setContext + `CALL sp_territoryServiceNonAvailability_get()`, [], supportKey, (error, results1) => {
			if (error) {
				console.error(error);
			} else {
				const resultSets = results1.filter(r => Array.isArray(r));
                const results5 = resultSets[1] || [];
				if (results5.length > 0) {
					let logData = { ID: results5[0].SERVICE_ID, CATEGORY: "Service", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/service-master", TERRITORY_ID: results5[0].TERRITORY_ID };
					dbm.addDatainGlobalmongo(logData.ID, logData.CATEGORY, logData.TITLE, logData.DATA, logData.ROUTE, logData.TERRITORY_ID)
						.then(() => {
							console.log("Data added/updated successfully.");
						})
						.catch(error => {
							console.error("Error in addDatainGlobalmongo:", error);
						});
				} else {
					console.log("no data found");
				}
			}
		});
	} catch (error) {
		console.error(error); // Use console.error for errors
	}
}