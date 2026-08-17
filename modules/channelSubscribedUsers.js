const mongoose = require('mongoose');

const channelSubscribedUsers = new mongoose.Schema({
    CHANNEL_ID: { type: Number },
    CHANNEL_NAME: { type: String },
    USER_ID: { type: Number },
    STATUS: { type: Boolean },
    CLIENT_ID: { type: Number },
    USER_NAME: { type: String },
    CLOUD_ID: { type: String },
    DEVICE_ID: { type: String },
    TYPE: { type: String },
    DATE: {
        type: Date,
        default: () => new Date(),   // Always save UTC
        set: () => new Date()        // Replace any user-passed value
    }
},
    {
        timestamps: true,
    });

module.exports = mongoose.model('channelSubscribedUsers', channelSubscribedUsers);
