import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// 兼容 ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静态目录
const distDir = path.join(__dirname, '../dist');
app.use(express.static(distDir));

// SPA 路由兜底
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const PORT = 3311;
app.listen(PORT, () => {
  console.log(`✅ Node HTTP server running on port ${PORT}`);
});
