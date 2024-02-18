// models/availableDate.js
const mongoose = require('mongoose');

const availableDateSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
});

const AvailableDate = mongoose.model('AvailableDate', availableDateSchema);

module.exports = AvailableDate;
