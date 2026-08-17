const mongoose = require('mongoose');

const globalDataSchema = new mongoose.Schema({
    TABLE_ID: { type: Number, required: true },
    EXCEL_URL: { type: String, required: true },
    UPLOADED_DATE_TIME: {
        type: Date,
        default: () => new Date(),   // Always save UTC
        set: () => new Date()        // Replace any user-passed value
    },
    UPLOADED_BY: { type: String, required: true },
    STATUS: { type: String, deault: 'Pending', required: true },
    CREATED_MODIFIED_DATE: { type: Date, default: Date.now() },
    RESPONSE: { type: String, required: false },
    TOTAL_RECORDS: { type: Number, deault: 0 },
    SUCCESSFUL_RECORDS: { type: Number, deault: 0 },
    SKIPPED_RECORDS: { type: Number, deault: 0 },
    FAILED_RECORDS: { type: Number, deault: 0 },
    PROGRESS: { type: Number, deault: 0 },
    IMPORT_TYPE: { type: String, required: true },
    COLUMN_HEADERS: { type: Array, required: false },

    CLIENT_ID: { type: Number, required: false },
}, {
    timestamps: true
});

module.exports = mongoose.model('excelImportMaster', globalDataSchema);

