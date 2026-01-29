import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import pinyin from "pinyin";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const PEIZHI = path.join(ROOT, "peizhi");
const PAGE_SIZE = 20;

const sitemapList = [];
const sitemapDetail = [];

/* ================= 工具函数 ================= */
function cleanDist() {
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function slugify(text) {
  if (!text) return "";

  return pinyin(
    String(text)
      // 1️⃣ 去掉中英文小括号内容
      .replace(/[()（）]/g, "")
      // 2️⃣ 去掉点、冒号、顿号、斜杠等
      .replace(/[.:：·\/]/g, "")
      // 3️⃣ 去掉多余空格
      .replace(/\s+/g, "")
      // 4️⃣ 只保留中文、英文、数字
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ""),
    { style: pinyin.STYLE_NORMAL }
  )
    .flat()
    .join("")
    .toLowerCase();
}

function titleClean(t) {
  return String(t || "").replace(/_/g, " ");
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function loadData() {
  const wb = xlsx.readFile(path.join(PEIZHI, "keben_export.xlsx"));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

/* ================= 模板 ================= */
const layoutTpl = fs.readFileSync(path.join(ROOT, "templates/layout.html"), "utf8");
const detailTpl = fs.readFileSync(path.join(ROOT, "templates/detail.html"), "utf8");

function renderLayout({ title, body, canonical, rel }) {
  return layoutTpl
    .replaceAll("{{title}}", title)
    .replaceAll("{{body}}", body)
    .replaceAll("{{canonical}}", canonical)
    .replaceAll("{{rel}}", rel);
}

/* ================= 分页器 ================= */
/* ================= 分页器 ================= */
function renderPager({ page, pages }) {
  if (pages <= 1) return "";

  const links = [];

  links.push(page > 1 ? `<a href="index.html">首页</a>` : `<span class="disabled">首页</span>`);
  links.push(page > 1 ? `<a href="page-${page - 1}.html">上一页</a>` : `<span class="disabled">上一页</span>`);

  const window = 6;
  let start = Math.max(1, page - Math.floor(window / 2));
  let end = start + window - 1;
  if (end > pages) {
    end = pages;
    start = Math.max(1, end - window + 1);
  }

  for (let i = start; i <= end; i++) {
    links.push(
      i === page
        ? `<span class="current">${i}</span>`
        : `<a href="${i === 1 ? "index.html" : `page-${i}.html`}">${i}</a>`
    );
  }

  links.push(page < pages ? `<a href="page-${page + 1}.html">下一页</a>` : `<span class="disabled">下一页</span>`);

  // 添加跳转页码输入框和按钮
  links.push(`
    <span class="jump">
      跳至
      <input type="number" min="1" max="${pages}" value="${page}" id="jumpPageInput">
      <button id="jumpPageBtn">跳转</button>
    </span>
  `);

  return `<div class="pager">${links.join("")}</div>`;
}

/* ================= 跳转页码 ================= */
function jumpToPage(pageNumber, totalPages) {
  // 检查输入的页码是否在有效范围内
  if (pageNumber >= 1 && pageNumber <= totalPages) {
    window.location.href = pageNumber === 1 ? "index.html" : `page-${pageNumber}.html`;
  } else {
    alert("请输入有效的页码！");
  }
}





/* ================= 面包屑 ================= */
function renderBreadcrumb(parts, rel) {
  const links = [`<a href="${rel}index.html">首页</a>`];
  parts.forEach((p, i) => {
    const href = rel + parts.slice(0, i + 1).map(slugify).join("/") + "/index.html";
    links.push(`<a href="${href}">${p}</a>`);
  });
  return `<nav class="breadcrumb">${links.join(" > ")}</nav>`;
}

/* ================= 导航 ================= */
function filterByParts(allItems, parts) {
  const cols = ["col1", "col2", "col3", "col4"];
  return allItems.filter(item => parts.every((p, i) => item[cols[i]] === p));
}

function renderListNav(parts, allItems, rel) {
  const cols = ["col1", "col2", "col3", "col4"];
  const level = parts.length;
  if (level >= cols.length) return "";

  const pool = filterByParts(allItems, parts);
  const values = Array.from(new Set(pool.map(i => i[cols[level]]).filter(Boolean)));
  if (!values.length) return "";

  return `<div class="filter-box nav-level-${level}">
${values.map(v => {
  const next = [...parts, v];
  const href = rel + next.map(slugify).join("/") + "/index.html";
  return `<a href="${href}">${v}</a>`;
}).join(" ")}
</div>`;
}

/* ================= 列表页 ================= */
function renderCard(item, rel) {
  const f = [
    slugify(item.col1),
    slugify(item.col2),
    slugify(item.col3),
    slugify(item.col4)
  ].join("-") + `-${item.id}.html`;

  return `
<div class="card">
  <a href="${rel}${f}" class="card-link">
    <img src="${item.image_url}" alt="${titleClean(item.title)}">
    <div class="card-text tip">在公众号输入编码或666获取电子课本</div>
    <div class="card-text code">编码：${item.id}</div>
    <div class="card-text meta">${item.col1}</div>
    <div class="card-text meta">${item.col2}</div>
    <div class="card-text meta">${item.col3}</div>
    <div class="card-text meta">${item.col4}</div>
  </a>
</div>`;
}

function renderListPage({ parts, items, allItems, page, pages, rel }) {
  return `
${renderBreadcrumb(parts, rel)}
${renderListNav(parts, allItems, rel)}
<h1>${parts.join(" ") || "全部教材"}</h1>
<div class="grid">${items.map(i => renderCard(i, rel)).join("")}</div>
${renderPager({ page, pages })}
`;
}

/* ================= 详情页（模板版） ================= */
function renderDetailByTemplate(item) {
  return detailTpl
    .replaceAll("{{breadcrumb}}", renderBreadcrumb([item.col1, item.col2, item.col3, item.col4], ""))
    .replaceAll("{{title}}", titleClean(item.title))
    .replaceAll("{{image_url}}", item.image_url)
    .replaceAll("{{alt}}", `${item.col1}${item.col2}${item.col3}${item.col4} 教材封面`)
    .replaceAll("{{col1}}", item.col1)
    .replaceAll("{{col2}}", item.col2)
    .replaceAll("{{col3}}", item.col3)
    .replaceAll("{{col4}}", item.col4)
    .replaceAll("{{id}}", item.id)
    .replaceAll("{{source}}", 
      item.col11
        ? `<p class="friend-link">友情链接：<a href="${item.col11}" target="_blank" rel="nofollow">跳转</a></p>`
        : ""
    );
}

/* ================= sitemap ================= */
function writeSitemap(file, urls) {
  fs.writeFileSync(
    path.join(DIST, file),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${u.loc}</loc></url>`).join("")}
</urlset>`
  );
}

/* ================= 主流程 ================= */
function build() {
  cleanDist();

  fs.mkdirSync(path.join(DIST, "peizhi"), { recursive: true });
  fs.copyFileSync(path.join(PEIZHI, "gongzonghao.jpg"), path.join(DIST, "peizhi/gongzonghao.jpg"));
  fs.copyFileSync(path.join(PEIZHI, "tubiao.png"), path.join(DIST, "peizhi/tubiao.png"));

  const data = loadData();

  /* 详情页 */
  data.forEach(item => {

    // ✅ 1️⃣ 统一、干净、SEO 的详情页文件名
    const file =
      [
        slugify(item.col1),
        slugify(item.col2),
        slugify(item.col3),
        slugify(item.col4)
      ].join("-") + `-${item.id}.html`;

    // ✅ 2️⃣ 写入详情页
    writeFile(
      path.join(DIST, file),
      renderLayout({
        title: titleClean(item.title),
        body: renderDetailByTemplate(item),
        canonical: file,
        rel: ""
      })
    );

    // ✅ 3️⃣ sitemap
    sitemapDetail.push({ loc: file });

  });


  /* 列表页（原逻辑不动） */
  const combos = [[], ["col1"], ["col1", "col2"], ["col1", "col2", "col3"], ["col1", "col2", "col3", "col4"]];

  combos.forEach(cols => {
    const groups = {};
    data.forEach(i => {
      const k = cols.map(c => i[c]).join("||");
      groups[k] ??= [];
      groups[k].push(i);
    });

    Object.entries(groups).forEach(([key, allItems]) => {
      const parts = key ? key.split("||") : [];
      const dir = path.join(DIST, ...parts.map(slugify));
      const pages = Math.ceil(allItems.length / PAGE_SIZE);
      const rel = "../".repeat(parts.length);

      for (let p = 1; p <= pages; p++) {
        const slice = allItems.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
        const name = p === 1 ? "index.html" : `page-${p}.html`;
        const loc = (parts.length ? parts.map(slugify).join("/") + "/" : "") + name;

        writeFile(
          path.join(dir, name),
          renderLayout({
            title: parts.join(" "),
            body: renderListPage({ parts, items: slice, allItems, page: p, pages, rel }),
            canonical: parts.length ? parts.map(slugify).join("/") + "/index.html" : "index.html",
            rel
          })
        );

        sitemapList.push({ loc });
      }
    });
  });

  writeSitemap("sitemap-list.xml", sitemapList);
  writeSitemap("sitemap-detail.xml", sitemapDetail);

  console.log("✅ 构建完成（详情页已模板化）");
}

build();
