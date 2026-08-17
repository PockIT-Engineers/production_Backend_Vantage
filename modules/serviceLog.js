const mongoose = require('mongoose');

const servicesActivityLogsSchema = new mongoose.Schema({
    LOG_DATE_TIME: {
        type: Date,
        default: () => new Date(),   // Always save UTC
        set: () => new Date()        // Replace any user-passed value
    },
    LOG_TEXT: { type: String, required: true },
    LOG_TYPE: { type: String, required: true },
    USER_ID: { type: Number, required: true },
    ADDED_BY: { type: String, required: true },
    SERVICE_ID: { type: Number, required: true },
    CUSTOMER_ID: { type: Number, required: true },
    TERRITORY_ID: { type: Number, },
    NAME: { type: String, required: true },
    DESCRIPTION: { type: String, },
    CATEGORY_NAME: { type: String, },
    SUB_CATEGORY_NAME: { type: String, },
    SUB_CATEGORY_ID: { type: Number, },
    B2B_PRICE: { type: String, },
    B2C_PRICE: { type: String, },
    TECHNICIAN_COST: { type: String, },
    VENDOR_COST: { type: String, },
    EXPRESS_COST: { type: String, },
    IS_EXPRESS: { type: Boolean, default: false },
    SERVICE_TYPE: { type: String, },
    DURATION_HOUR: { type: String, },
    DURATION_MIN: { type: String, },
    PREPARATION_MINUTES: { type: String, },
    PREPARATION_HOURS: { type: String, },
    UNIT_ID: { type: Number, },
    UNIT_NAME: { type: String, },
    SHORT_CODE: { type: String, },
    MAX_QTY: { type: String, },
    TAX_ID: { type: Number, },
    TAX_NAME: { type: String, },
    START_TIME: { type: String, },
    END_TIME: { type: String, },
    IS_NEW: { type: Boolean, default: false },
    PARENT_ID: { type: Number, },
    IS_PARENT: { type: Boolean, default: false },
    SERVICE_IMAGE: { type: String, },
    IS_FOR_B2B: { type: Boolean, default: false },
    IS_JOB_CREATED_DIRECTLY: { type: Boolean, default: false },
    IS_AVAILABLE: { type: String, },
    ORG_ID: { type: Number, required: false },
    QTY: { type: String, },
    STATUS: { type: String, required: false },
    CLIENT_ID: { type: Number, default: 1 },
    HSN_CODE_ID: { type: Number, },
    HSN_CODE: { type: String, required: false },
    SERVICE_DETAILS_IMAGE: { type: String, required: false },
    WARRANTY_ALLOWED: { type: Boolean, default: false },
    GUARANTEE_ALLOWED: { type: Boolean, default: false },
    WARRANTY_PERIOD: { type: Number, default: 0 },
    GUARANTEE_PERIOD: { type: Number, default: 0 },
    SITE_VISIT_REPORT_TYPE: { type: String, required: false },

}, {
    timestamps: true
});

module.exports = mongoose.model('services_activity_logs', servicesActivityLogsSchema);
