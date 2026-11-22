const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 60,
    },
    lastName: {
      type: String,
      trim: true,
      maxLength: 40,
    },
    emailId: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      unique: true,
      trim: true,
      maxLength: 200,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email address');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      maxLength: 65,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error(
            'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
          );
        }
      },
    },
    age: {
      type: Number,
      min: 18,
      required: true,
      trim: true,
      maxLength: 3,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
      enum: {
        values: ['male', 'female'],
        message: '{VALUE} is incorrect gender type',
      },
    },
    occupation: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    photoUrl: {
      type: String,
      default:
        'https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=',
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error('Invalid Photo URL');
        }
      },
    },
    about: {
      type: String,
      default: 'Code. Learn. Build. Repeat ',
      maxLength: 120,
    },
    skills: {
      type: [String],
      validate(value) {
        if (value.length > 10) {
          throw new Error('Maximum skills Exceeded Max limit 10');
        }
        if (!value.every(item => item.length <= 50)) {
          throw new Error('Each Skills Should be Less than 50 Characters');
        }
      },
    },
  },
  { timestamps: true },
);

userSchema.methods.getJwt = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, 'SecretKey@712003', { expiresIn: '1d' });
  return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHashed = user.password;

  if (!passwordHashed) {
    throw new Error('Invalid Credentials');
  }

  const isPasswordValid = await bcrypt.compare(passwordInputByUser, passwordHashed);
  return isPasswordValid;
};

module.exports = mongoose.model('User', userSchema);
