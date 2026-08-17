const mongoose = require('mongoose');
const technicianActivityCalender = new mongoose.Schema({

  TECHNICIAN_ID: { type: Number, required: true },
  TECHNICIAN_NAME: { type: String },
  IS_SERIVCE_AVAILABLE: { type: Boolean },
  DATE_OF_MONTH: { type: Date },
  WEEK_DAY: { type: String },
  DAY_START_TIME: { type: String },
  DAY_END_TIME: { type: String },
  BREAK_START_TIME: { type: String },
  BREAK_END_TIME: { type: String },

  CLIENT_ID: { type: Number, required: true },
}, {
  timestamps: true
});

module.exports = mongoose.model('technician_activity_calender', technicianActivityCalender);