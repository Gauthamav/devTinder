const auth = (req, res, next) => {
  const token = 'token';
  if (token && token === 'token') {
    next();
  } else {
    res.send('unauthorized');
  }
};
module.exports = { auth };
