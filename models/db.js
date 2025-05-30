const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '../db/html-go.db');

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath);

// 初始化数据库
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 创建页面表
      db.run(`
        CREATE TABLE IF NOT EXISTS pages (
          id TEXT PRIMARY KEY,
          html_content TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          password TEXT,
          is_protected INTEGER DEFAULT 0,
          code_type TEXT DEFAULT 'html',
          title TEXT DEFAULT '无标题'
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // 检查是否需要添加title字段（为了兼容旧数据库）
          db.run(`
            ALTER TABLE pages ADD COLUMN title TEXT DEFAULT '无标题'
          `, (alterErr) => {
            // 忽略字段已存在的错误
            if (alterErr && !alterErr.message.includes('duplicate column name')) {
              console.warn('添加title字段时出现警告:', alterErr.message);
            } else if (!alterErr) {
              console.log('成功添加title字段');
            }
            
            console.log('数据库初始化成功');
            resolve();
          });
        }
      });
    });
  });
}

// 执行查询的辅助函数
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 执行单行查询的辅助函数
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// 执行更新的辅助函数
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

module.exports = {
  db,
  initDatabase,
  query,
  get,
  run
};
