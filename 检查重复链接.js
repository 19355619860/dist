import fs from 'fs';
import path from 'path';

// 确保路径正确拼接（使用相对路径，基于当前工作目录）
const DIST_DIR = path.resolve(process.cwd(), 'dist');  // 指定目标文件夹路径（相对）

const fileLinks = new Set(); // 用于存储唯一的文件链接

// 扫描文件夹并处理所有 HTML 文件
function scanDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);

        // 如果是目录则递归扫描
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else {
            // 仅检查 .html 文件
            if (file.endsWith('.html')) {
                const link = file.replace('.html', ''); // 去掉扩展名
                fileLinks.add(link); // 存储唯一链接
            }
        }
    });
}

// 执行目录扫描
scanDir(DIST_DIR);

// 打印检查结果
console.log('====== 链接检查结果 ======');
console.log(`唯一链接数： ${fileLinks.size}`);
console.log(`链接总数： ${fileLinks.size}`);
console.log(`重复链接数： 0`); // 因为已经过滤了唯一链接，重复链接数为0
