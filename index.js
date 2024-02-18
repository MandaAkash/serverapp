const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT||8000;
const cors = require('cors');
const AvailableDate = require('./models/availableDates');
const Booking = require('./models/booking');
const users = require("./models/userSchema");
const userotp = require("./models/userOtp");
const nodemailer = require("nodemailer");
// const router = require("./routes/router");
// Connect to MongoDB
mongoose.connect('mongodb+srv://mandaakash6:mandaakash6@cluster0.0uosz.mongodb.net/mernproject?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>console.log("connected"))
.catch(()=>console.log("couldnot connect"))
const tarnsporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
      user: "mandaakash6@gmail.com",
      pass: "eaea gcls nege aahs"
  }
})
// Middleware
app.use(express.json());
app.use(cors())
// Routes
app.get('/', (req, res) => {
  res.send('Hello, world!');
});
// app.use('/api', availableDatesRoute);
app.post("/api/add-available-date",async(req,res)=>{
  const { date } = req.body;
  try {
    // Check if the date already exists in the database
    const existingDate = await AvailableDate.findOne({ date });
    if (existingDate) {
      return res.status(400).json({ message: 'Date already exists.' });
    }
    // Create a new available date in the database
    const newAvailableDate = new AvailableDate({ date });
    await newAvailableDate.save();
    res.json({ message: 'Available date added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error  date.' });
  }
});
// showing filled dates
app.get('/filldates', async(req, res) => {
  try {
    const availableDates = await AvailableDate.find();
    res.json(availableDates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching available dates.' });
  }
});
//show availaible time slots
app.get('/available-time-slots', async(req, res) => {
  try {
    // Avaialable time slots
    const availableTimeSlots = ["7:00 AM", "8:00 AM", "9:00 AM","10:00 AM","11:00AM","12:00PM","1:00PM","2:00PM","3:00PM","4:00PM","5:00PM","6:00PM","7:00PM"];
    res.json(availableTimeSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching available time slots.' });
  }
});
//cancel appointment
app.delete('/cancel-appointment',async(req,res)=>{
  try {
    const email = req.body.email;
    const existingBooking = await Booking.findOne({email:"mandaakash6@gmail.com" });
    if(existingBooking===null){
      return res.status(200).json({ message: 'Appointment not found' });
    }
    await Booking.deleteMany({ email:email }); 
    res.status(201).json({ message: 'Appointment cancelled successfully' });
    
}
catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error' });
  }
})
//Booking Appointments
app.post('/book-appointment', async (req, res) => {
  try {
    const { selectedDate, selectedTimeSlot, email } = req.body;
    const existingDate = await Booking.findOne({ selectedDate: selectedDate });
    const dates = await Booking.find({ selectedDate: selectedDate });
    // If it is first slot
    if (!existingDate) {
      const newBooking = new Booking({
        selectedDate,
        selectedTimeSlot,
        email,
      });
      await newBooking.save();
      return res.status(201).json({ message: 'Appointment booked successfully.' });
    }
    // If it is not the first slot
    const existingTimeslot = await Booking.findOne({ selectedTimeSlot: selectedTimeSlot });
    //checking if timeslot is filled or not for a particular selected date
    if ((existingTimeslot !== null) && (existingDate.selectedDate === req.body.selectedDate)) {
      let filled = false;
      dates.forEach((date) => {
        if (date.selectedTimeSlot === selectedTimeSlot) {
          filled = true;
        }
      });
      if (filled) {
        return res.status(200).json({ message: 'The time slot is already filled' });
      } else {
        const newBooking = new Booking({
          selectedDate,
          selectedTimeSlot,
          email,
        });
        await newBooking.save();
        return res.status(201).json({ message: 'Appointment booked successfully.' });
      }
    } 
    //if the date doesnot exists in selected date(we can directly book any slot)
    else {
      const dateCount = await Booking.countDocuments({ selectedDate: selectedDate });
      if (dateCount%12 === 0) {
        const newAvailableDate = new AvailableDate({ date: selectedDate });
        const newBooking = new Booking({
          selectedDate,
          selectedTimeSlot,
          email,
        });
        await newBooking.save();
        await newAvailableDate.save();
        return res.status(201).json({ message: 'Appointment booked successfully.' });
      } else {
        const newBooking = new Booking({
          selectedDate,
          selectedTimeSlot,
          email,
        });

        await newBooking.save();
        return res.status(201).json({ message: 'Appointment booked successfully.' });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error booking appointment.' });
  }
});
// Login Route
app.post('/user/login',async(req,res)=>{
  const {email,otp} = req.body;
    if(!otp || !email){
        res.status(400).json({ error: "Please Enter Your OTP and email" })
    }
    try {
        const otpverification = await userotp.findOne({email:email});

        if(otpverification.otp === otp){
            const preuser = await users.findOne({email:email});

            // token generate
            const token = await preuser.generateAuthtoken();
           res.status(200).json({message:"User Login Succesfully Done",userToken:token});

        }else{
            res.status(400).json({error:"Invalid Otp"})
        }
    } catch (error) {
        res.status(400).json({ error: "Invalid Details", error })
    }
})
//Signup Route
app.post('/user/register',async(req,res)=>{
  const { fname, email, password } = req.body;

  if (!fname || !email || !password) {
      res.status(400).json({ error: "Please Enter All Input Data" })
  }

  try {
      const presuer = await users.findOne({ email: email });

      if (presuer) {
          res.status(400).json({ error: "This User Already exist in our db" })
      } else {
          const userregister = new users({
              fname, email, password
          });
          // here password hashing
          const storeData = await userregister.save();
          res.status(200).json(storeData);
      }
  } catch (error) {
      res.status(400).json({ error: "Invalid Details", error })
  }
})
//Userotp route
app.post('/user/sendotp',async(req,res)=>{
  const { email } = req.body;
  
  if (!email) {
      return res.status(400).json({ error: "Please Enter Your Email" })
  }
  try {
      const presuer = await users.findOne({ email: email });
      if (presuer) {
          const OTP = Math.floor(100000 + Math.random() * 900000);
          const existEmail = await userotp.findOne({ email: email });
          if (existEmail) {
              const updateData = await userotp.findByIdAndUpdate({ _id: existEmail._id }, {
                  otp: OTP
              }, { new: true }
              );
              await updateData.save();
              const mailOptions = {
                  from: process.env.EMAIL,
                  to: email,
                  subject: "Sending Email For Otp Validation",
                  text: `OTP:- ${OTP}`
              }
              tarnsporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                      console.log("error", error);
                      res.status(400).json({ error: "email not send" })
                  } else {
                      console.log("Email sent", info.response);
                      res.status(200).json({ message: "Email sent Successfully" })
                  }
              })

          } else {

              const saveOtpData = new userotp({
                  email, otp: OTP
              });

              await saveOtpData.save();
              const mailOptions = {
                  from: process.env.EMAIL,
                  to: email,
                  subject: "Sending Email For Otp Validation",
                  text: `Your OTP to sign is:- ${OTP}`
              }

              tarnsporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                      console.log("error", error);
                      return res.status(400).json({ error: "email not send" })
                  } else {
                      console.log("Email sent", info.response);
                      return res.status(200).json({ message: "Email sent Successfully" })
                  }
              })
          }
      } else {
          return res.status(400).json({ error: "This User Not Exist In our Db" })
      }
  } catch (error) {
      return res.status(400).json({ error: "Invalid Details", error })
  }
})
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});