const mongoose = require('mongoose');

const activitySeriveLog = new mongoose.Schema({
    SOURCE_ID: { type: Number },
    LOG_DATE_TIME: { type: Date, },
    LOG_TEXT: { type: String, },
    CATEGORY: { type: String, },
    CLIENT_ID: { type: Number, },
    USER_ID: { type: Number, },
}, {
    timestamps: true
});

module.exports = mongoose.model('action_system_log', activitySeriveLog);

