const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    recieverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      enum: {
        values: ['interested', 'ignored', 'accepted', 'rejected', 'deleted'],
        message: '{VALUE} is incorrect status type',
      },
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
connectionRequestSchema.index({ senderId: 1, recieverId: 1 }, { unique: true });

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);
