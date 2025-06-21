const express = require('express');
const router = express.Router();
const db = require('../db/db');


router.get('/', async (req, res) => {
  const { walkerId } = req.query;

  if (!walkerId) {
    return res.status(400).json({ message: '缺少walkerId参数' });
  }

  try {

    const [walks] = await db.query(`
      SELECT w.id, w.time, w.duration, d.name AS dog_name, p.name AS owner_name
      FROM Walk w
      JOIN Dog d ON w.dog_id = d.id
      JOIN Person p ON d.owner_id = p.id
      WHERE w.walker_id = ? AND w.date = CURDATE()
    `, [walkerId]);

    res.json(walks);
  } catch (error) {
    console.error('获取遛狗任务失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;