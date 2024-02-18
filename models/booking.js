// models/booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  selectedDate: String,
  selectedTimeSlot: String,
  email:String,
  // Add other fields as needed
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
