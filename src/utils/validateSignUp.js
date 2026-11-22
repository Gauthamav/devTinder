const validator = require('validator');

const validateSignUp = req => {
  const { firstName, emailId, password, gender, occupation, age, photoUrl } = req.body;

  if (!firstName) {
    throw new Error('Please Enter Your Name');
  } else if (!emailId || !validator.isEmail(emailId)) {
    throw new Error('Please Enter Valid Email Address');
  } else if (!password || !validator.isStrongPassword(password)) {
    throw new Error('Please Enter Strong Password');
  } else if (!gender) {
    throw new Error('Invalid Gender');
  } else if (!occupation) {
    throw new Error('Invalid Occupation');
  } else if (!age) {
    throw new Error('Please Enter Your Age');
  } else if (photoUrl && !validator.isURL(photoUrl)) {
    throw new Error('Invalid Photo Url');
  }
};
module.exports = { validateSignUp };
