const express = require('express');
const router = express.Router();
const db = require('../db/db');

// 获取主人的狗狗
router.get('/dogs', async (req, res) => {
  const { ownerId } = req.query;

  if (!ownerId) {
    return res.status(400).json({ message: '缺少ownerId参数' });
  }

  try {
    // 获取主人的狗狗
    const [dogs] = await db.query(
      'SELECT id, name, breed, age FROM Dog WHERE owner_id = ?',
      [ownerId]
    );

    res.json(dogs);
  } catch (error) {
    console.error('获取狗狗失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});