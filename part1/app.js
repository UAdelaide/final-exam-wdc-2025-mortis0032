const express = require('express');
const pool = require('./db');
const app = express();
const PORT = 3000;

// 启动时初始化测试数据
async function initializeData() {
  try {
    const conn = await pool.getConnection();

    // 清空所有表（按外键依赖顺序）
    await conn.query('DELETE FROM WalkRatings');
    await conn.query('DELETE FROM WalkApplications');
    await conn.query('DELETE FROM WalkRequests');
    await conn.query('DELETE FROM Dogs');
    await conn.query('DELETE FROM Users');

    // 插入用户
    await conn.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('david_walker', 'david@example.com', 'hashed101', 'walker'),
        ('eve_owner', 'eve@example.com', 'hashed202', 'owner')
    `);

    // 插入狗狗（使用子查询获取主人ID）
    await conn.query(`
      INSERT INTO Dogs (owner_id, name, size)
      SELECT user_id, 'Max', 'medium' FROM Users WHERE username = 'alice123'
      UNION ALL
      SELECT user_id, 'Bella', 'small' FROM Users WHERE username = 'carol123'
      UNION ALL
      SELECT user_id, 'Rocky', 'large' FROM Users WHERE username = 'eve_owner'
      UNION ALL
      SELECT user_id, 'Luna', 'medium' FROM Users WHERE username = 'alice123'
      UNION ALL
      SELECT user_id, 'Charlie', 'small' FROM Users WHERE username = 'eve_owner'
    `);

    // 插入遛狗请求
    await conn.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
      SELECT dog_id, '2025-06-10 08:00:00', 30, 'Parklands', 'open'
      FROM Dogs WHERE name = 'Max' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')
      UNION ALL
      SELECT dog_id, '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'
      FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')
      UNION ALL
      SELECT dog_id, '2025-06-11 10:00:00', 40, 'Central Park', 'open'
      FROM Dogs WHERE name = 'Rocky' AND owner_id = (SELECT user_id FROM Users WHERE username = 'eve_owner')
      UNION ALL
      SELECT dog_id, '2025-06-12 14:00:00', 50, 'Riverfront', 'completed'
      FROM Dogs WHERE name = 'Luna' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')
      UNION ALL
      SELECT dog_id, '2025-06-13 16:30:00', 35, 'Hillside', 'completed'
      FROM Dogs WHERE name = 'Charlie' AND owner_id = (SELECT user_id FROM Users WHERE username = 'eve_owner')
    `);

    // 插入评分
    await conn.query(`
      INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating)
      SELECT
        wr.request_id,
        (SELECT user_id FROM Users WHERE username = 'bobwalker') AS walker_id,
        d.owner_id,
        5
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      WHERE wr.status = 'completed' AND d.name = 'Luna'
    `);

    conn.release();
    console.log('✅ 测试数据初始化完成');
  } catch (error) {
    console.error('❌ 初始化数据失败:', error);
  }
}

// ====================== API端点实现 ======================

// 端点1: /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        d.name AS dog_name,
        d.size,
        u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: '获取狗狗数据失败' });
  }
});

// 端点2: /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        wr.request_id,
        d.name AS dog_name,
        wr.requested_time,
        wr.duration_minutes,
        wr.location,
        u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: '获取开放请求失败' });
  }
});

// 端点3: /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.username AS walker_username,
        COUNT(wr.rating_id) AS total_ratings,
        AVG(wr.rating) AS average_rating,
        COUNT(DISTINCT wreq.request_id) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings wr ON u.user_id = wr.walker_id
      LEFT JOIN WalkRequests wreq ON wreq.request_id = wr.request_id AND wreq.status = 'completed'
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);

    const formatted = rows.map(row => ({
      ...row,
      average_rating: row.average_rating ? Number(row.average_rating).toFixed(1) : null
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: '获取遛狗员摘要失败' });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 服务器运行中: http://localhost:${PORT}`);
  await initializeData();
});