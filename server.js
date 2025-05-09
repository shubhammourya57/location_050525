
const express = require('express');
const dotenv = require('dotenv');
const locationRoutes = require('./routes/locationRoutes');

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api', locationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});



// const express = require('express');
// const authRoutes = require('./routes/auth');

// const app = express();


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/api', authRoutes);

// app.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });

// module.exports = app;
