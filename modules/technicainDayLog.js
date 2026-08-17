const mongoose = require('mongoose');

const technicianDayLog = new mongoose.Schema({
    TECHNICIAN_ID: { type: Number },
    LOG_DATE_TIME: {
        type: Date,
        default: () => new Date(),   // Always save UTC
        set: () => new Date()        // Replace any user-passed value
    },
    LOG_TEXT: { type: String, },
    STATUS: { type: String, },
    TYPE: { type: String, },
    USER_ID: { type: Number, },
    CLIENT_ID:{ type:Number, required: true},
    TECHNICIAN_NAME: { type: String, },
    USER_NAME: { type: String, },
}, {
    timestamps: true
});


module.exports = mongoose.model('technician_day_log', technicianDayLog);


