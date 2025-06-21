const express = require('express');
const path = require('path');
require('dotenv').config();
const session = require('express-session'); // 添加会话管理

const app = express();


app.use(session({
  secret: 'dog_walker_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));


const authenticate = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: '未授权，请先登录' });
  }
};


const checkUserType = (type) => {
  return (req, res, next) => {
    if (req.session.user && req.session.user.type === type) {
      next();
    } else {
      res.status(403).json({ message: '无权访问此资源' });
    }
  };
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes'); // 添加认证路由

app.use('/api/walks', authenticate, walkRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/auth', authRoutes); // 使用认证路由

// 导出app
module.exports = app;