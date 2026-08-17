const mongoose = require('mongoose');

const globalDataSchema = new mongoose.Schema({
    SOURCE_ID: { type: Number, required: true }, 
    CATEGORY: { type: String, required: true },
    TITLE: { type: String },
    DATA: { type: String },
    ROUTE: { type: String },
    TERRITORY_ID: { type: Number }
}, {
    timestamps: true
});

module.exports = mongoose.model('globalData', globalDataSchema);

