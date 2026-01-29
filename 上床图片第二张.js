// ==UserScript==
// @name         上传图片（仅下载并上传）
// @match        https://www.goofish.com/publish?spm=a21ybx.item.sidebar.1.394c3da6YCN0sP
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// ==/UserScript==

;(function(){
    // Namespaced minimal uploader to avoid global symbol collisions with other scripts.
    // Expose helpers under window.__upload_helpers.xy2

    // Find the file input element for image upload
    const findCoverUploadInput_xy2 = function() {
        const selectors = [
            'input[type="file"][accept*="image"]',
            'span.ant-upload input[type="file"]',
            'input[type="file"]'
        ];
        for (const s of selectors) {
            const el = document.querySelector(s);
            if (el) return el;
        }
        return null;
    };

    // Fetch image as a blob from a URL
    const fetchImageAsBlob_xy2 = async function(url) {
        try {
            const response = await fetch(url, { credentials: 'omit' });
            if (!response.ok) throw new Error('fetch failed: ' + response.status);
            return await response.blob();
        } catch (error) {
            return new Promise((resolve, reject) => {
                try {
                    GM.xmlHttpRequest({
                        method: 'GET',
                        url: url,
                        responseType: 'blob',
                        onload: (res) => resolve(res.response),
                        onerror: (err) => reject(err)
                    });
                } catch (err) { reject(err); }
            });
        }
    };

    // Upload the image from the URL (local implementation)
    const uploadCoverImageFromUrl_xy2 = async function(imgUrl) {
        try {
            const input = findCoverUploadInput_xy2();
            const blob = await fetchImageAsBlob_xy2(imgUrl);
            const ext = (blob.type && blob.type.includes('jpeg')) ? 'jpg' : (blob.type && blob.type.includes('webp') ? 'webp' : 'png');
            const file = new File([blob], `image.${ext}`, { type: blob.type || 'image/png' });
            const dt = new DataTransfer();
            dt.items.add(file);
            if (input) {
                input.files = dt.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return { ok: true, imgUrl };
        } catch (error) {
            return { ok: false, reason: String(error) };
        }
    };

    // Create the UI panel for input (namespaced ids)
    const createXy2Panel = function() {
        try {
            if (document.getElementById('xy2-panel-root')) return;
            const panel = document.createElement('div');
            panel.id = 'xy2-panel-root';
            panel.innerHTML = `
                <style>
                    #xy2-panel-root {
                        position: fixed;
                        left: 12px;
                        bottom: 695px;
                        z-index: 2147483647;
                        font-family: Arial, Helvetica, sans-serif;
                    }
                    #xy2-panel-root .xy2-panel {
                        background: rgba(255, 255, 255, 0.95);
                        border: 1px solid rgba(0, 0, 0, 0.12);
                        padding: 8px 10px;
                        border-radius: 6px;
                        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        align-items: stretch;
                        min-width: 220px;
                    }
                    #xy2-url-input {
                        width: 320px;
                        padding: 6px 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        box-sizing: border-box;
                    }
                    #xy2-start-btn {
                        padding: 6px 10px;
                        background: #1976d2;
                        color: #fff;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        align-self: flex-end;
                    }
                    #xy2-start-btn[disabled] {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    @media(max-width: 480px) {
                        #xy2-url-input { width: 200px; }
                    }
                </style>
                <div class="xy2-panel">
                    <input id="xy2-url-input" placeholder="在此输入图片链接（单个）" />
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
                        <button id="xy2-start-btn">上传图片</button>
                        <span id="xy2-panel-status"></span>
                    </div>
                </div>
            `;
            document.body.appendChild(panel);

            const input = document.getElementById('xy2-url-input');
            const btn = document.getElementById('xy2-start-btn');
            const status = document.getElementById('xy2-panel-status');

            async function setStatus(t) { try { status.textContent = t; } catch (e) {} }

            async function startFromInput() {
                const url = (input.value || '').trim();
                if (!url) { setStatus('请输入图片链接'); return; }
                btn.disabled = true; setStatus('处理中...');
                try {
                    const res = await uploadCoverImageFromUrl_xy2(url);
                    if (res && res.ok) { input.value = ''; setStatus('上传完成'); }
                    else setStatus('失败: ' + (res && res.reason ? res.reason : '未知错误'));
                } catch (e) { setStatus('异常: ' + String(e)); }
                btn.disabled = false;
                setTimeout(() => { try { if (status.textContent === '上传完成' || status.textContent.startsWith('失败') || status.textContent.startsWith('异常')) status.textContent = ''; } catch (e) {} }, 3000);
            }

            btn.addEventListener('click', startFromInput);
            input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); startFromInput(); } });

        } catch (error) { console.warn('创建面板失败', error); }
    };

    // Initialize panel
    try { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createXy2Panel); else createXy2Panel(); } catch (e) { console.warn('初始化失败', e); }

    // Expose helpers under a namespaced property to avoid collisions
    try {
        const root = (window.unsafeWindow || window).__upload_helpers = (window.unsafeWindow || window).__upload_helpers || {};
        root.xy2 = Object.assign(root.xy2 || {}, {
            uploadCoverImageFromUrl: uploadCoverImageFromUrl_xy2,
            fetchImageAsBlob: fetchImageAsBlob_xy2,
        });
    } catch (e) {}

    console.log('✅ 上床图片第二张（namespaced xy2）已就绪');
})();
