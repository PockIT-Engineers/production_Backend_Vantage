const mongoose = require('mongoose');

const inwardLogSchema = new mongoose.Schema({
    ACTION_TYPE: { type: String },
    ACTION_DETAILS: { type: String },
    ACTION_DATE: {
        type: Date,
        default: () => new Date(),   // Always save UTC
        set: () => new Date()        // Replace any user-passed value
    },
    USER_ID: { type: Number },
    USER_NAME: { type: String },
    INVENTORY_ID: { type: Number },
    INVENTORY_NAME: { type: String },
    WAREHOUSE_ID: { type: Number },
    WAREHOUSE_NAME: { type: String },
    VARIANT_ID: { type: Number },
    VARIANT_NAME: { type: String },
    QUANTITY: { type: Number },
    ADJUSTMENT_TYPE: { type: String },
    TOTAL_INWARD: { type: Number },
    CURRENT_STOCK: { type: Number },
    OLD_STOCK: { type: Number },
    QUANTITY_PER_UNIT: { type: Number },
    UNIT_ID: { type: Number },
    UNIT_NAME: { type: String },
    REASON: { type: String },
    SOURCE_WAREHOUSE_ID: { type: Number },
    SOURCE_WAREHOUSE_NAME: { type: String },
    DESTINATION_WAREHOUSE_ID: { type: Number },
    DESTINATION_WAREHOUSE_NAME: { type: String },
    REFERENCE_NO: { type: String },
    STATUS: { type: String },
    REMARK: { type: String },
    IS_VERIANT: { type: String },
}, {
    timestamps: true
});


module.exports = mongoose.model('inwardLogs', inwardLogSchema);