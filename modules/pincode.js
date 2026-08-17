const mongoose = require("mongoose");


const PincodeMasterSchema = new mongoose.Schema({
    OFFICE_NAME: { type: String, default: null },
    PINCODE: { type: String, default: null },
    PINCODE_NUMBER: { type: String, default: null },
    DIVISION_NAME: { type: String, default: null },
    CIRCLE_NAME: { type: String, default: null },
    TALUKA: { type: String, default: null },
    DISTRICT: { type: Number, default: null },
    STATE: { type: Number, default: null },
    COUNTRY_ID: { type: Number, default: null },
    SUB_OFFICE: { type: String, default: null },
    HEAD_OFFICE: { type: String, default: null },
    LONGITUDE: { type: String, default: null },
    LATITUDE: { type: String, default: null },
    IS_ACTIVE: { type: Boolean, default: null },
    READ_ONLY: { type: String, default: "N" },
    SEQ_NO: { type: Number, default: null },
    CREATED_MODIFIED_DATE: { type: Date, default: Date.now() },
    ARCHIVE_FLAG: { type: String, default: "F" },
    CLIENT_ID: { type: Number, required: true },
    STATE_NAME: { type: String, default: null },
    COUNTRY_NAME: { type: String, default: null },
    DISTRICT_NAME: { type: String, default: null },
}, {
    timestamps: true
});


PincodeMasterSchema.pre("save", function (next) {
    const now = new Date();
    const formattedDate = now.getFullYear() + '-' +
        (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
        now.getDate().toString().padStart(2, '0') + ' ' +
        now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0') + ':' +
        now.getSeconds().toString().padStart(2, '0');

    this.createdAt = formattedDate;
    this.updatedAt = formattedDate;
    next();
});
module.exports = mongoose.model("PincodeMaster", PincodeMasterSchema);
