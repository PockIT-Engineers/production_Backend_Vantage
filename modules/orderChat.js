const mongoose = require("mongoose");

const orderChat = new mongoose.Schema({
    ORDER_ID: { type: String, required: true },
    CUSTOMER_ID: { type: String, required: true },
    CUSTOMER_NAME: { type: String, required: true },
    CREATED_DATETIME: { type: Date, default: Date.now },
    STATUS: { type: String, required: true },
    BY_CUSTOMER: { type: Boolean, default: false },
    SENDER_USER_ID: { type: String, required: true },
    RECIPIENT_USER_ID: { type: String, required: true },
    RECIPIENT_USER_NAME: { type: String, required: false },
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
    ATTACHMENT_URL: { type: String, default: "" },
    IS_DELIVERED: { type: Boolean, default: false },
    JOB_CARD_ID: { type: String, required: true },
    TECHNICIAN_ID: { type: Number, required: true },
    TECHNICIAN_NAME: { type: String, required: false },
    ROOM_ID: { type: String },
    MEDIA_TYPE: { type: String, required: false, default: null }
}, {
    timestamps: true,
});

module.exports = mongoose.model("order_chat_master", orderChat);
