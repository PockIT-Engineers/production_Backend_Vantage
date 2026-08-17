const mongoose = require('mongoose');
const shopOrderActionLogsSchema = new mongoose.Schema({
    ORDER_ID: Number,
    CUSTOMER_ID: Number,
    DATE_TIME: {
        type: Date,
        default: () => new Date(),   // Always save UTC
        set: () => new Date()        // Replace any user-passed value
    },
    LOG_TYPE: String,
    ACTION_LOG_TYPE: String,
    ACTION_DETAILS: String,
    CLIENT_ID: Number,
    USER_ID: Number,
    ORDER_DATE_TIME: Date,
    CART_ID: String,
    EXPECTED_DATE_TIME: Date,
    ORDER_MEDIUM: String,
    ORDER_STATUS: String,
    TOTAL_AMOUNT: Number,
    ORDER_NUMBER: String,
    PAYMENT_MODE: String,
    PAYMENT_STATUS: String,
    USER_NAME: String,
    EXPECTED_PREAPARATION_DATETIME: Date,
    EXPECTED_PACKAGING_DATETIME: Date,
    EXPECTED_DISPATCH_DATETIME: Date,
    ACTUAL_PREAPARATION_DATETIME: Date,
    ACTUAL_PACKAGING_DATETIME: Date,
    ACTUAL_DISPATCH_DATETIME: Date,
    ORDER_SHIPROCKET_DATETIME: Date,
    ORDER_SHIP_ASSIGN_DATETIME: Date,
    ORDER_LABEL_DATETIME: Date,
    ORDER_PICKUP_DATETIME: Date,
    ORDER_CANCEL_DATETIME: Date,
    ORDER_OUT_FOR_DELIVERY_DATETIME: Date,
    ORDER_DELIVERY_DATETIME: Date,
    IANA_CODE: String

}, {
    timestamps: true
});

module.exports = mongoose.model('shop_order_action_logs', shopOrderActionLogsSchema);
