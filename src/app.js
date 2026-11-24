const { connectDB } = require('./config/database.js');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

app.use(
  cors({
    origin: process.env.PORT,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const { authRouter } = require('./routes/auth.js');
const { connectionRequestRouter } = require('./routes/connectionRequests.js');
const { userRouter } = require('./routes/user.js');

app.use('/', authRouter);
app.use('/', connectionRequestRouter);
app.use('/', userRouter);
app.use((req, res) => {
  res.status(400).json({
    message: 'Something Went Wrong',
  });
});
connectDB()
  .then(() => {
    app.listen(7777, () => {
      console.log('Server is successfully listening to port 7777....');
    });
  })
  .catch(err => {
    console.log('Not connected');
  });
