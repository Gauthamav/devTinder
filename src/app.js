const express = require('express');

const app = express();

app.use('/hello', (req, res) => {
  res.send('Hello from gduthadddm');
});
app.use('/', (req, res) => {
  res.send('Helldo from the server');
});

app.listen(3000, () => {
  console.log('Server is successfully listening to port 3000....');
});
