const mongoose = require('mongoose');
const TechnicianLocationTrackSchema = new mongoose.Schema({
    TECHNICIAN_ID: { type: Number },
    LOCATION_LATITUDE: { type: String, required: true },
    LOCATION_LONG: { type: String, required: true },
    CLIENT_ID: { type: Number },
    DATE_TIME: {
        type: Date,
        default: () => new Date(),   // Always save UTC
        set: () => new Date()        // Replace any user-passed value
    },
    ORDER_ID: { type: Number },
    JOB_CARD_ID: { type: Number },
    TIME: { type: String },
    SERVICE_ID: { type: Number },
    TECHNICIAN_NAME: { type: String },
    MOBILE_NUMBER: { type: String },
}, {
    timestamps: true
});

module.exports = mongoose.model('technician_location_track', TechnicianLocationTrackSchema);