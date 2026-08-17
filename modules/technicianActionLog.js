const mongoose = require('mongoose');

const technicianActionLogsSchema = new mongoose.Schema({
    TECHNICIAN_ID: Number,
    VENDOR_ID: Number,
    ORDER_ID: Number,
    JOB_CARD_ID: Number,
    CUSTOMER_ID: Number,
    DATE_TIME: {
    type: Date,
},
    LOG_TYPE: String,
    ACTION_LOG_TYPE: String,
    ACTION_DETAILS: String,
    CLIENT_ID: Number,
    USER_ID: Number,
    TECHNICIAN_NAME: String,
    ORDER_DATE_TIME: Date,
    CART_ID: String,
    EXPECTED_DATE_TIME: Date,
    ORDER_MEDIUM: String,
    ORDER_STATUS: String,
    PAYMENT_MODE: String,
    PAYMENT_STATUS: String,
    TOTAL_AMOUNT: Number,
    ORDER_NUMBER: String,
    TASK_DESCRIPTION: String,
    ESTIMATED_TIME_IN_MIN: Number,
    PRIORITY: String,
    JOB_CARD_STATUS: String,
    USER_NAME: String,
    IANA_CODE: String
}, {
    timestamps: true
});

module.exports = mongoose.model('technician_action_logs', technicianActionLogsSchema);
