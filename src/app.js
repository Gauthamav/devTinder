const express = require('express');

const app = express();

const { auth } = require('./middlewares/auth');

app.use('/admin', auth);
app.get('/admin/bye', (req, res) => {
  res.send('bye');
});
app.get('/admin/hi', (req, res) => {
  res.send('hii');
});
app.use('/admin/hello', (req, res) => {
  res.send('hello');
});

app.use('/', (req, res) => {
  res.send('Hello from the server');
});

app.listen(3000, () => {
  console.log('Server is successfully listening to port 3000....');
});
