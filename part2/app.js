const express = require('express')；
const path = require('path')；
require('dotenv').config();
const session = require('express-session');

const app = express();


app.use(session({
  secret: 'dog_walker_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));


const authenticate = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized. Please log in first' });
  }
};


const checkUserType = (type) => {
  return (req, res, next) => {
    if (req.session.user && req.session.user.type === type) {
      next();
    } else {
      res.status(403).json({ message: 'Access to this resource is not authorized' });
    }
  };
};


app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));


const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/walks', authenticate, walkRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/auth', authRoutes);


module.exports = app;