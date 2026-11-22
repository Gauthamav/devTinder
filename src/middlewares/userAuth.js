const jwt = require('jsonwebtoken');
const User = require('../model/user');
const mongoose = require('mongoose');

const userAuth = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    const { token } = cookies;
    if (!token) {
      return res.status(401).json({ message: 'Please Login' });
    }
    const decodedMessage = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decodedMessage._id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid Credentials');
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Invalid Credentials');
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
module.exports = { userAuth };
