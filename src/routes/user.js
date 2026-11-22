const express = require('express');
const userRouter = express.Router();
const User = require('../model/user');
const { userAuth } = require('../middlewares/userAuth');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const validator = require('validator');
const connectionRequest = require('../model/connectionRequest');

userRouter.get('/user/view/profile', userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Please Login' });
    }
    const userData = {
      id: user._id,
      emailId: user.emailId,
      firstName: user.firstName,
      lastName: user.lastName,
      about: user.about,
      photoUrl: user.photoUrl,
      occupation: user.occupation,
      gender: user.gender,
      age: user.age,
    };
    res.status(200).json({ data: userData });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
userRouter.get('/user/feed', userAuth, async (req, res) => {
  let page = parseInt(req.query.page) || 0;
  let limit = parseInt(req.query.limit) || 10;

  if (page < 0) {
    page = 0;
  }
  if (limit > 50 || limit < 0) {
    limit = 10;
  }
  let skip = page * limit;

  try {
    const user = req.user;
    if (!user) {
      throw new Error('Invalid Credentials');
    }
    const userId = user._id;
    if (!userId) {
      throw new Error('Invalid Credentials');
    }

    const set = new Set();
    set.add(userId);

    const hideUsersfromFeed = await connectionRequest
      .find({
        $or: [{ senderId: userId }, { recieverId: userId }],
      })
      .select('senderId recieverId');

    if (hideUsersfromFeed.length > 0) {
      hideUsersfromFeed.forEach(req => {
        set.add(req.recieverId);
        set.add(req.senderId);
      });
    }
    const allUsers = await User.find({
      _id: { $nin: Array.from(set) },
    })
      .select('firstName lastName photoUrl about')
      .skip(skip)
      .limit(limit);

    if (allUsers.length > 0) {
      res.status(200).json(allUsers);
    } else {
      res.status(200).json([]);
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
userRouter.patch('/user/edit/profile', userAuth, async (req, res) => {
  const ALLOWED_EDIT_FIELDS = ['firstName', 'lastName', 'age', 'gender', 'photoUrl', 'about', 'skills', 'occupation'];
  try {
    const data = req.body;
    const user = req.user;
    if (!user) {
      throw new Error('Invalid Credentials');
    }
    const userId = user._id.toString();
    if (!userId) {
      throw new Error('Invalid Credentials');
    }

    const isEditAllowed = Object.keys(data).every(key => ALLOWED_EDIT_FIELDS.includes(key));

    if (!isEditAllowed) {
      throw new Error('Invalid Update Inputs');
    }
    Object.keys(data).forEach(key => (user[key] = data[key]));
    await user.save(data);

    res.status(200).json({ data: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
userRouter.patch('/user/edit/changepassword', userAuth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      throw new Error('Invalid Credentials');
    }
    const userId = user._id;
    if (!userId) {
      throw new Error('User Not Found');
    }
    const newPassword = req.body.password;

    if (!newPassword) {
      throw new Error('Please Enter Password');
    }
    if (!validator.isStrongPassword(newPassword)) {
      throw new Error('Please Enter Strong Password');
    }
    const newPasswordHashed = await bcrypt.hash(newPassword, 14);

    await User.findByIdAndUpdate(
      userId,
      { password: newPasswordHashed },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
userRouter.get('/user/view/allConnectionRequests', userAuth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      throw new Error('Invalid Credentials');
    }
    const userId = user._id;
    const allRequests = await connectionRequest
      .find({
        recieverId: userId,
        status: 'interested',
      })
      .populate('senderId', 'firstName lastName photoUrl');

    if (!allRequests || allRequests.length <= 0) {
      return res.status(200).json([]);
    }
    res.status(200).json({ data: allRequests });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
userRouter.post('/user/:status/:senderId', userAuth, async (req, res) => {
  try {
    const ALLOWED_STATUS_TYPE = ['accepted', 'rejected'];
    const user = req.user;
    if (!user) {
      throw new Error('Invalid Credentials');
    }
    const userId = user._id;
    if (!userId) {
      throw new Error('Invalid Credentials');
    }
    const status = req.params.status;
    const senderId = req.params.senderId;

    if (!status || !ALLOWED_STATUS_TYPE.includes(status)) {
      throw new Error('Invalid Status Type');
    }

    if (!senderId || !mongoose.isValidObjectId(senderId)) {
      throw new Error('Invalid Request');
    }

    const isSenderExist = await User.findById(senderId);

    if (!isSenderExist) {
      throw new Error('Invalid Request ');
    }
    if (senderId.toString() === userId.toString()) {
      throw new Error('Invalid User');
    }


    const data = await connectionRequest.findOne({
      senderId: senderId,
      recieverId: userId,
      status: 'interested',
    });

    if (!data) {
      throw new Error('No Connection Request Found');
    }
    data.status = status;
    await data.save();
    res.status(200).json({ data: data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
userRouter.get('/user/view/allConnection', userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error('Invalid Credentials');
    }
    const userId = user._id;
    if (!userId) {
      throw new Error('Invalid Credentials');
    }
    const allConnection = await connectionRequest
      .find({
        $or: [{ recieverId: userId }, { senderId: userId }],
        status: 'accepted',
      })
      .populate('senderId', 'firstName lastName photoUrl')
      .populate('recieverId', 'firstName lastName photoUrl');

    const data = allConnection.map(item =>
      item.recieverId.toString() === userId.toString() ? item.recieverId : item.senderId,
    );
    res.status(200).json({ data: data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
userRouter.get('/connection/profile/view/:id', userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error('Invalid Credentials');
    }
    const userId = user._id;
    if (!userId) {
      throw new Error('Invalid Credentials');
    }
    const id = req.params.id;
    if (!id || !mongoose.isValidObjectId(id)) {
      throw new Error('Invalid User Id');
    }
    const connectionUserExist = await User.findById(id).select(
      'firstName lastName photoUrl gender age occupation about',
    );
    if (!connectionUserExist) {
      throw new Error('Invalid User Id');
    }
    const connectionExist = await connectionRequest.find({
      $or: [
        { recieverId: userId, senderId: id },
        { recieverId: id, senderId: userId },
      ],
      status: 'accepted',
    });
    if (!connectionExist || connectionExist.length === 0) {
      throw new Error('Invalid User Id');
    }
    res.status(200).send({ data: connectionUserExist });
  } catch (err) {
    res.status(400).json({ data: err.message });
  }
});
userRouter.post('/connection/delete/:id', userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error('Invalid Credentials');
    }
    const userId = user._id;
    if (!userId) {
      throw new Error('Invalid Credentials');
    }
    const idOfUserToDelete = req.params.id;
    if (!idOfUserToDelete || !mongoose.isValidObjectId(idOfUserToDelete)) {
      throw new Error('Invalid User Id');
    }

    const isConnectionExist = await connectionRequest.findOneAndUpdate(
      {
        $or: [
          { senderId: userId, recieverId: idOfUserToDelete },
          { senderId: idOfUserToDelete, recieverId: userId },
        ],
        status: 'accepted',
      },
      { $set: { status: 'deleted' } },
      { returnDocument: 'after', runValidators: true },
    );
    if (!isConnectionExist) {
      throw new Error('Invalid Request');
    }
    res.status(200).send({ data: 'Deleted the User' });
  } catch (err) {
    res.status(400).send({ data: err.message });
  }
});
module.exports = { userRouter };
