const express = require('express');
const router = express.Router();
const db = require('../db/db');
const argon2 = require('argon2');

// 登录路由
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '邮箱和密码不能为空' });
  }

  try {
    // 查询用户
    const [users] = await db.query(
      'SELECT id, name, email, password, type FROM Person WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '无效的邮箱或密码' });
    }

    const user = users[0];

    // 验证密码
    const passwordValid = await argon2.verify(user.password, password);

    if (!passwordValid) {
      return res.status(401).json({ message: '无效的邮箱或密码' });
    }

    // 创建会话
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type
    };

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type
      }
    });
  } catch (error) {
    console.error('login error
', error);
    res.status(500).json({ message: 'server error' });
  }
});

// 注销路由
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Cancellation failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Cancellation successful' });
  });
});

// 检查会话路由
router.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.json({
      isLoggedIn: true,
      user: req.session.user
    });
  } else {
    res.json({ isLoggedIn: false });
  }
});

module.exports = router;