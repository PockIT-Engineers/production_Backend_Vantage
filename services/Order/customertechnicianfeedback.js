
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const technicianActionlog = require('../../modules/technicianActionLog')
const applicationkey = process.env.APPLICATION_KEY;
var customerTechnicianFeedback = "customer_technician_feedback";
var viewCustomerTechnicianFeedback = "view_" + customerTechnicianFeedback;
// Conversion Done
function reqData(req) {

	var data = {
		ORDER_ID: req.body.ORDER_ID,
		CUSTOMER_ID: req.body.CUSTOMER_ID,
		JOB_CARD_ID: req.body.JOB_CARD_ID,
		TECHNICIAN_ID: req.body.TECHNICIAN_ID,
		RATING: req.body.RATING,
		COMMENTS: req.body.COMMENTS,
		FEEDBACK_DATE_TIME: req.body.FEEDBACK_DATE_TIME,
		CLIENT_ID: req.body.CLIENT_ID
	}
	return data;
}

exports.validate = function () {
	return [
		body('ORDER_ID').isInt().optional(),
		body('CUSTOMER_ID').isInt().optional(),
		body('JOB_CARD_ID').isInt().optional(),
		body('TECHNICIAN_ID').isInt().optional(),
		body('RATING').isInt().optional(),
		body('COMMENTS').optional(),
		body('FEEDBACK_DATE_TIME').optional(),
		body('ID').optional(),
	]
}


exports.get = (req, res) => {
	var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
	var pageSize = req.body.pageSize ? req.body.pageSize : '';
	var start = 0;
	var end = 0;
	if (pageIndex != '' && pageSize != '') {
		start = (pageIndex - 1) * pageSize;
		end = pageSize;
	}
	let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
	let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
	let filter = req.body.filter ? req.body.filter : '';
	var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
	let countCriteria = filter;
	var supportKey = req.headers['supportkey'];
	try {
		if (IS_FILTER_WRONG == "0") {
			const safeFilter = (filter || '').replace(/'/g, "\\'");
			const setContext = `
				SET @v_PAGE_INDEX = ${pageIndex || 0};
				SET @v_PAGE_SIZE = ${pageSize || 0};
				SET @v_SORT_KEY = '${sortKey}';
				SET @v_SORT_VALUE = '${sortValue}';
				SET @v_FILTER = '${safeFilter}';
			`;
			mm.executeQueryData(setContext + ` CALL sp_get_customer_technician_feedback(); `, [], supportKey, (error, results) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to get customerTechnicianFeedback count.",
					});
				}
				else {
					const resultSets = results.filter(r => Array.isArray(r));
					const countResult = resultSets[0] || [];
					const dataResult = resultSets[1] || [];
					res.send({
						"code": 200,
						"message": "success",
						"TAB_ID": 23,
						"count": countResult[0] ? countResult[0].cnt : 0,
						"data": dataResult
					});
				}
			});
		} else {
			res.send({
				code: 400,
				message: "Invalid filter parameter."
			})
		}
	} catch (error) {
		logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
		console.log(error);
		res.send({
			"code": 500,
			"message": "something went wrong"
		});
	}
};



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
	} else {
		try {
			mm.executeQueryData(`CALL sp_create_customer_technician_feedback(?,?,?,?,?,?,?,?)`, [data.ORDER_ID, data.CUSTOMER_ID, data.JOB_CARD_ID, data.TECHNICIAN_ID, data.RATING, data.COMMENTS, data.FEEDBACK_DATE_TIME, data.CLIENT_ID], supportKey, (error, results) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to save customerTechnicianFeedback information..."
					});
				} else {
					const resultSets = results.filter(r => Array.isArray(r));
					const insertResult = resultSets[0] || [];
					const insertId = insertResult[0] ? insertResult[0].insertId : 0;
					var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has added technician feedback.`;
					var logCategory = "customer technicians feedback";
					let actionLog = {
						"SOURCE_ID": insertId,
						"LOG_DATE_TIME": mm.getSystemDate(),
						"LOG_TEXT": ACTION_DETAILS,
						"CATEGORY": logCategory,
						"CLIENT_ID": 1,
						"USER_ID": req.body.authData.data.UserData[0].USER_ID,
						"supportKey": 0
					};
					dbm.saveLog(actionLog, systemLog);
					res.send({
						"code": 200,
						"message": "CustomerTechnicianFeedback information saved successfully..."
					});
				}
			});
		} catch (error) {
			logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
			console.log(error);
			res.send({
				"code": 500,
				"message": "something went wrong"
			});
		}
	}
};


exports.update = (req, res) => {
	const errors = validationResult(req);
	var data = reqData(req);
	var supportKey = req.headers['supportkey'];
	var systemDate = mm.getSystemDate();
	if (!errors.isEmpty()) {
		console.log(errors);
		res.send({
			"code": 422,
			"message": errors.errors
		});
	} else {
		try {
			mm.executeQueryData(`CALL sp_update_customer_technician_feedback(?,?,?,?,?,?,?,?,?,?)`, [req.body.ID, data.ORDER_ID, data.CUSTOMER_ID, data.JOB_CARD_ID, data.TECHNICIAN_ID, data.RATING, data.COMMENTS, data.FEEDBACK_DATE_TIME, data.CLIENT_ID, systemDate], supportKey, (error, results) => {
				if (error) {
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					console.log(error);
					res.send({
						"code": 400,
						"message": "Failed to update customerTechnicianFeedback information."
					});
				} else {
					var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of the customer technician feedback.`;
					var logCategory = "customer technicians feedback";
					let actionLog = {
						"SOURCE_ID": req.body.ID,
						"LOG_DATE_TIME": mm.getSystemDate(),
						"LOG_TEXT": ACTION_DETAILS,
						"CATEGORY": logCategory,
						"CLIENT_ID": 1,
						"USER_ID": req.body.authData.data.UserData[0].USER_ID,
						"supportKey": 0
					};
					dbm.saveLog(actionLog, systemLog);
					res.send({
						"code": 200,
						"message": "CustomerTechnicianFeedback information updated successfully..."
					});
				}
			});
		} catch (error) {
			logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
			console.log(error);
			res.send({
				"code": 500,
				"message": "something went wrong"
			});
		}
	}
};


exports.getCustomerTechnicianFeedback = (req, res) => {
	var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
	var pageSize = req.body.pageSize ? req.body.pageSize : '';
	let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
	let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
	let filter = req.body.filter ? req.body.filter : '';
	let CUSTOMER_MANAGER_ID = req.body.CUSTOMER_MANAGER_ID ? req.body.CUSTOMER_MANAGER_ID : 0;

	var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
	var supportKey = req.headers['supportkey'];

	try {

		if (IS_FILTER_WRONG == "0") {

			const safeFilter = (filter || '').replace(/'/g, "\\'");

			const setContext = `
				SET @v_PAGE_INDEX = ${pageIndex || 0};
				SET @v_PAGE_SIZE = ${pageSize || 0};
				SET @v_SORT_KEY = '${sortKey}';
				SET @v_SORT_VALUE = '${sortValue}';
				SET @v_FILTER = '${safeFilter}';
				SET @v_MANAGER_ID = ${CUSTOMER_MANAGER_ID || 0};
			`;

			mm.executeQueryData(
				setContext + ` CALL sp_get_customer_technician_feedback_manager(); `,
				[],
				supportKey,
				(error, results) => {

					if (error) {

						console.log(error);
						logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);

						res.send({
							"code": 400,
							"message": "Failed to get customerTechnicianFeedback count."
						});

					} else {

						const resultSets = results.filter(r => Array.isArray(r));

						const countResult = resultSets[0] || [];
						const dataResult = resultSets[1] || [];
						const progressResult = resultSets[2] || [];
						const avgResult = resultSets[3] || [];

						res.send({
							"code": 200,
							"message": "success",
							"count": countResult[0] ? countResult[0].cnt : 0,
							"data": dataResult,
							"progress": progressResult,
							"averageRating": avgResult[0] ? avgResult[0].AVG_RATING : 0
						});

					}

				}
			);

		} else {

			res.send({
				code: 400,
				message: "Invalid filter parameter."
			});

		}

	} catch (error) {

		logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
		console.log(error);

		res.send({
			"code": 500,
			"message": "something went wrong"
		});

	}

};



exports.technicianServiceFeedbackByCustomer = (req, res) => {

	const {
		ORDER_ID,
		CUSTOMER_ID,
		SERVICE_ID,
		JOB_CARD_ID,
		TECHNICIAN_RATING,
		SERVICE_RATING,
		SERVICE_COMMENTS,
		TECHNICIAN_COMMENTS,
		TECHNICIAN_ID,
		TECHNICIAN_NAME,
		CUSTOMER_NAME,
		ORDER_NUMBER
	} = req.body;

	const supportKey = req.headers['supportkey'];

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).json({
			code: 422,
			message: errors.errors
		});
	}

	try {

		mm.executeQueryData(

			`CALL sp_customer_feedback_create(?,?,?,?,?,?,?,?,?,?)`,

			[
				ORDER_ID,
				CUSTOMER_ID,
				SERVICE_ID,
				JOB_CARD_ID,
				TECHNICIAN_RATING,
				SERVICE_RATING,
				SERVICE_COMMENTS,
				TECHNICIAN_COMMENTS,
				TECHNICIAN_ID,
				1
			],

			supportKey,

			(error, result) => {

				if (error) {
					console.log(error);
					return res.status(400).json({
						code: 400,
						message: "Failed to save customer feedback."
					});
				}

				const r = result[0][0];

				if (r.code !== 200) {
					return res.status(200).json(r);
				}

				/* ------------------------------------------
				   Application Layer Logic
				   (Logs + Notifications)
				------------------------------------------- */

				mm.executeQueryData(
					`CALL sp_get_job_card_by_order_job_customer(?, ?, ?)`,
					[ORDER_ID, JOB_CARD_ID, CUSTOMER_ID],
					supportKey,
					(error, resultsGet) => {

						if (!error && resultsGet.length > 0) {
							 resultsGet = resultsGet?.[0];

							let IANA_CODE = resultsGet[0]?.IANA_CODE;

							const ACTION_DETAILS =
								`Customer ${resultsGet[0]?.COMPANY_NAME} has successfully submitted ratings for the service and technician.`;

							const logData = {
								TECHNICIAN_ID: TECHNICIAN_ID,
								VENDOR_ID: 0,
								ORDER_ID: ORDER_ID,
								JOB_CARD_ID: JOB_CARD_ID,
								CUSTOMER_ID: CUSTOMER_ID,
								LOG_TYPE: 'Job',
								ACTION_LOG_TYPE: 'Customer',
								ACTION_DETAILS: ACTION_DETAILS,
								USER_ID: CUSTOMER_ID,
								TECHNICIAN_NAME: TECHNICIAN_NAME,
								ORDER_DATE_TIME: null,
								CART_ID: 0,
								EXPECTED_DATE_TIME: null,
								ORDER_MEDIUM: null,
								ORDER_STATUS: "Feedback given by customer",
								PAYMENT_MODE: null,
								PAYMENT_STATUS: null,
								TOTAL_AMOUNT: 0,
								ORDER_NUMBER: ORDER_NUMBER,
								TASK_DESCRIPTION: "",
								ESTIMATED_TIME_IN_MIN: 0,
								PRIORITY: null,
								JOB_CARD_STATUS: "Feedback given by customer",
								USER_NAME: CUSTOMER_NAME,
								DATE_TIME: mm.getUTCDateFromTimezone(IANA_CODE),
								supportKey: 0,
								IANA_CODE: IANA_CODE
							};

							dbm.saveLog(logData, technicianActionlog);

							mm.sendNotificationToTechnician(
								CUSTOMER_ID,
								TECHNICIAN_ID,
								"Customer Feedback",
								`Dear ${TECHNICIAN_NAME}, you have received feedback from customer ${resultsGet[0]?.COMPANY_NAME} for work order ${resultsGet[0]?.JOB_CARD_NO}.`,
								"",
								"F",
								supportKey,
								"N",
								"F",
								logData
							);
						}

						return res.status(200).json({
							code: 200,
							message: "Customer feedback saved successfully."
						});
					}
				);

			}
		);

	} catch (error) {
		console.log(error);
		res.status(500).json({
			code: 500,
			message: "Something went wrong."
		});
	}
};


