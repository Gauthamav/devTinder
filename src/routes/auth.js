const express = require('express');
const authRouter = express.Router();
const validator = require('validator');
const bcrypt = require('bcrypt');
const { validateSignUp } = require('../utils/validateSignUp');

const User = require('../model/user');
const { userAuth } = require('../middlewares/userAuth');

authRouter.post('/auth/signup', async (req, res) => {
  try {
    validateSignUp(req);
    const { firstName, lastName, emailId, gender, age, password, photoUrl, occupation, about, skills } = req.body;
    const passwordHashed = await bcrypt.hash(password, 14);
    const user = new User({
      firstName,
      lastName,
      emailId,
      gender,
      age,
      occupation,
      password: passwordHashed,
      photoUrl,
      about,
      skills,
    });
    await user.save();
    res.status(201).json({ data: 'User Added Successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }
    res.status(500).json({ message: err.message });
  }
});

authRouter.post('/auth/login', async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId || !password || !validator.isEmail(emailId)) {
      throw new Error('Invalid Credentials');
    }
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error(' Invalid Credentials');
    }
    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid) {
      const token = await user.getJwt();
      const userData = {
        id: user._id,
        emailId: user.emailId,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        occupation: user.occupation,
        about: user.about,
        gender: user.gender,
        age: user.age,
      };
      res.cookie('token', token, { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });
      res.status(200).json({ data: userData });
    } else {
      throw new Error('Invalid Credentials');
    }
  } catch (err) {
    res.status(401).json({ message: err.message } || { message: 'Something Went Wrong' });
  }
});

authRouter.post('/auth/logout', userAuth, async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ data: 'Logout Successfully' });
  } catch (err) {
    res.status(400).json({ data: err.message });
  }
});
module.exports = { authRouter };
