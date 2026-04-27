const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get('/', (req, res) => {
  res.send('Kasuku backend running 🚀');
});

// PAYMENT ROUTE
app.post('/payments/subscribe', (req, res) => {
  const { plan } = req.body;

  console.log('Plan selected:', plan);

  res.json({
    url: 'https://example.com/payment-success'
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});