const mongoose = require('mongoose');

const jobchat = new mongoose.Schema({
    ORDER_ID: { type: Number, required: true },
    ORDER_NUMBER: { type: String, required: true },
    JOB_CARD_ID: { type: Number, required: true },
    JOB_CARD_NUMBER: { type: String, required: true },
    CUSTOMER_ID: { type: Number, required: true },
    CUSTOMER_NAME: { type: String, required: true },
    TECHNICIAN_ID: { type: Number, required: true },
    TECHNICIAN_NAME: { type: String, required: true },
    CREATED_DATETIME: { type: Date, default: Date.now },
    STATUS: { type: String, required: true },
    BY_CUSTOMER: { type: Number, },
    SENDER_USER_ID: { type: Number },
    SENDER_USER_NAME: { type: String },
    RECIPIENT_USER_ID: { type: Number },
    RECIPIENT_USER_NAME: { type: String, required: true },
    MESSAGE: { type: String },
    SEND_DATE: {
        type: Date,
        default: () => new Date(),   // Always save UTC
        set: () => new Date()        // Replace any user-passed value
    },
    RECEIVED_DATE: {
        type: Date,
        default: () => new Date(),   // Always save UTC
        set: () => new Date()        // Replace any user-passed value
    },
    ATTACHMENT_URL: { type: String },
    MEDIA_TYPE: { type: String },
    IS_DELIVERED: { type: Boolean, default: false },
    CLIENT_ID: { type: Number, required: true },
    MSG_SEND_BY: { type: String }
},
    {
        timestamps: true,
    });

module.exports = mongoose.model('job_chat', jobchat);
