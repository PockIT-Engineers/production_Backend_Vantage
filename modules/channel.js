const mongoose = require('mongoose');

const channels = new mongoose.Schema({
    CHANNEL_NAME: { type: String },
    DESCRIPTION: { type: String },
    STATUS: { type: Boolean },
},
    {
        timestamps: true,
    });

module.exports = mongoose.model('channels', channels);
