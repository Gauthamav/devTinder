const express = require('express');
const connectionRequestRouter = express.Router();
const { userAuth } = require('../middlewares/userAuth');
const ConnectionRequest = require('../model/connectionRequest');
const User = require('../model/user');
const mongoose = require('mongoose');

connectionRequestRouter.post('/request/:status/:recieverId', userAuth, async (req, res) => {
  try {
    const ALLOWED_STATUS = ['interested', 'ignored'];
    const user = req.user;
    if (!user) {
      throw new Error('Invalid Credentials');
    }

    const status = req.params.status;
    if (!ALLOWED_STATUS.includes(status)) {
      throw new Error('Invalid Status Type');
    }

    const recieverId = req.params.recieverId;
    const senderId = req.user._id;

    if (!recieverId || !senderId || !mongoose.isValidObjectId(recieverId)) {
      throw new Error('User not Found');
    }
    if (recieverId === senderId.toString()) {
      throw new Error('Cant send request to yourself');
    }
    const isRecieverExist = await User.findById({ _id: recieverId });

    if (!isRecieverExist) {
      throw new Error('User not Found');
    }

    const isConnectionRequestAlreadySent = await ConnectionRequest.findOne({
      $or: [
        {
          senderId: senderId,
          recieverId: recieverId,
        },
        {
          senderId: recieverId,
          recieverId: senderId,
        },
      ],
    });

    if (isConnectionRequestAlreadySent) {
      throw new Error('Connection Request Already Send');
    }

    const data = new ConnectionRequest({
      senderId: senderId,
      recieverId: recieverId,
      status: status,
    });
    await data.save();
    res.status(200).json({ data: 'Connection Request Sent' });
    
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ data: 'Connection request already exists' })('');
    } else {
      return res.status(400).send({ data: err.message });
    }
  }
});

module.exports = { connectionRequestRouter };
