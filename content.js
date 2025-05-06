document.addEventListener("mouseup", () => {
	
	// 1️⃣ 如果鼠标点击在工具条内部，则直接返回，不重新定位
    if (event.target.closest("#ai-toolbar") || event.target.closest("#ai-response")) {
        console.log("🔹 点击了工具条或响应窗口，不更新位置");
        return;
    }
	
    setTimeout(() => {
        let selectedText = "";

        // 优先使用 window.getSelection()
        if (window.getSelection) {
            selectedText = window.getSelection().toString().trim();
        }

        // 2️⃣ 兼容 input/textarea
        if (!selectedText && document.activeElement &&
            (document.activeElement.tagName.toLowerCase() === "textarea" ||
             document.activeElement.tagName.toLowerCase() === "input")) {
            selectedText = document.activeElement.value.substring(
                document.activeElement.selectionStart,
                document.activeElement.selectionEnd
            ).trim();
        }

        // 🔍 调试信息
        console.log("检测到选中文本:", selectedText);

        // 3️⃣ 选中了有效文本时，才显示工具条
        if (selectedText.length > 0) {
            positionToolbar();
        }  else {
            hideToolbar();
        }
    }, 100);  // 🔄 增加 100ms 延迟，确保 getSelection 生效
});

// 监听 "copy" 事件，支持 Google Docs
document.addEventListener("copy", (event) => {
    const selectedText = event.clipboardData.getData("text").trim();

    console.log("剪贴板文本（粘贴时触发）:", selectedText);

    if (selectedText.length > 0) {
		positionToolbar();
	} else {
		hideToolbar();
	}
});

// 插入工具条
function injectToolbar() {
	
    // removeToolbar();
	if (document.getElementById("ai-toolbar")) return; // 避免重复注入
	
	// 确保 Body 存在
    if (!document.body) {
        console.warn("等待 body 加载...");
        setTimeout(injectToolbar, 50);  // 等待 body 加载
        return;
    }

    const toolbar = document.createElement("div");
    toolbar.id = "ai-toolbar";
    toolbar.style.display = "none"; // 默认隐藏
    toolbar.style.opacity = "0"; // 初始时透明

    const actions = [
        { name: "翻译", action: "translate" },
        { name: "解释", action: "explain" },
        { name: "提问", action: "ask" },
        { name: "润色", action: "polish" },
        { name: "扩写", action: "expand" },
		{ name: "总结", action: "conclude" }
    ];

    actions.forEach(({ name, action }) => {
        const btn = document.createElement("button");
        btn.innerText = name;
		
        btn.addEventListener("click", (event) => {
            // event.stopPropagation();  // 避免触发其他 click 事件
			console.log(`🚀 请求 AI: ${action}`);
            showResponse("加载中...");  // **点击按钮时立刻显示 responseDiv**
            sendRequest(action, window.getSelection().toString().trim());
        });
        toolbar.appendChild(btn);
    });

    document.body.appendChild(toolbar);
	
	// **插入 responseDiv（默认隐藏）**
    const responseDiv = document.createElement("div");
    responseDiv.id = "ai-response";
    responseDiv.style.display = "none";  // **默认不显示**
    responseDiv.style.opacity = "0";
    document.body.appendChild(responseDiv);
}

// 工具条定位函数
function positionToolbar() {
    const toolbar = document.getElementById("ai-toolbar");
    if (!toolbar) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(selection.rangeCount - 1); // 取最后一个 Range
    const rects = range.getClientRects(); // 获取所有选区矩形
	
	if (rects.length === 0) return;
	
	// **获取最后一个 rect**
    const lastRect = rects[rects.length - 1];
	
	const viewportWidth = window.innerWidth; // **获取视口宽度**
    const viewportHeight = window.innerHeight; // **获取视口高度**
	
	// **🚀 让工具条先以 `visibility: hidden; display: block;` 渲染，获取宽度**
    toolbar.style.opacity = "0";
    toolbar.style.display = "block";

    const toolbarWidth = toolbar.offsetWidth; // 确保 width 正确获取
	const toolbarHeight = toolbar.offsetHeight;
	
    // 计算工具条的位置
	let left = lastRect.right - toolbarWidth / 2; // 居中
    let top = window.scrollY + lastRect.top - toolbar.offsetHeight - 10; // **选区上方 10px**

    // **🚨 防止工具条超出屏幕右侧**
    if (left + toolbarWidth > viewportWidth - 10) {
        left = viewportWidth - toolbarWidth - 10; // **将 `left` 限制在视口内**
    }

    // **🚨 防止工具条超出屏幕左侧**
    if (left < 10) {
        left = 10; // **限制左侧最小 10px**
    }

    // **🚨 防止工具条超出屏幕顶部**
    if (top < 10) {
        top = window.scrollY + lastRect.bottom + 10; // **如果超出顶部，则放到底部**
    }
	if (top + toolbarHeight > viewportHeight) {
        top = viewportHeight - toolbarHeight - 10;
    }

	// **更新工具条位置**
	toolbar.style.left = `${left}px`;
	toolbar.style.top = `${top}px`;
	toolbar.style.display = "flex";
	toolbar.style.opacity = "1";

	console.log("✅ 工具条已定位:", { top, left });
}

// 隐藏工具条
function hideToolbar() {
    const toolbar = document.getElementById("ai-toolbar");
	const responseDiv = document.getElementById("ai-response");
    if (toolbar) {
        toolbar.style.opacity = "0";
        setTimeout(() => {
            toolbar.style.display = "none";
        }, 200);
    }
	
	if (responseDiv) {
		console.log("🔹 隐藏 AI 响应窗口");
        responseDiv.style.opacity = "0";
        setTimeout(() => {
            responseDiv.style.display = "none";
        }, 200);
    }
}

// 隐藏回复
function hideResponse() {
	const responseDiv = document.getElementById("ai-response");
	
	if (responseDiv) {
		console.log("🔹 隐藏 AI 响应窗口");
        responseDiv.style.opacity = "0";
        setTimeout(() => {
            responseDiv.style.display = "none";
        }, 200);
    }
}

// 点击页面其他地方时关闭工具条
document.addEventListener("click", (event) => {
    if (!event.target.closest("#ai-toolbar") && !event.target.closest("#ai-response") && window.getSelection().toString().trim() === "") {
		console.log("点击空白区域，隐藏工具条");
        hideToolbar();
    }
});

/**
 * **发送 AI 请求**
 * - 读取存储的 `API_HOST` 和 `API_TOKEN`
 * - 发送用户自定义的 Prompt
 * - 支持流式返回 (`message.delta`)
 */
async function sendRequest(action, text) {
    const { apiHost, apiToken } = await chrome.storage.sync.get(["apiHost", "apiToken"]);
    if (!apiHost || !apiToken) {
        console.error("❌ API HOST 或 Token 未设置！");
        alert("❗ 请先在插件设置页填写 API 服务器和 Token！");
        return;
    }

    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
        console.warn("⚠ 请选择文本后再使用 AI 功能");
        return;
    }

    let prompt;
	switch (action) {
		case "translate":
		prompt = `请根据文本内容的语种进行翻译，如果文本不是中文，则翻译成中文，如果是中文，则翻译成英文。
		要遵循信达雅的翻译原则，让翻译后的内容读起来符合说目标语种人的日常表达习惯。
		输出格式：
		
		**{{原文语种}} → {{目标语种}}** 
		
		{{翻译结果}}
		
		仅返回翻译后的内容。下面是要翻译的文本: 
		${text}`;
		break;
		case "explain": prompt = `请解释什么是 “${text}”`; break;
		case "ask": prompt = `请从专业的角度解答问题: ${text}`; break;
		case "polish": prompt = `请先判断提供的文字是什么语种，然后使用相同的语种对该文字内容进行润色，使其逻辑更通顺、语言表达更丰富、更适合普通人阅读和理解。下面是要润色的文字: 
		${text}
		仅返回润色后的内容，不要解释任何东西。`; break;
		case "expand": prompt = `请先判断提供的文字是什么语种，然后理解该内容表达的核心意思，然后使用相同的语种对该文字内容进行扩写，增加更多的细节: 
		${text}
		仅返回扩写后的内容，不要解释任何东西。`; break;
		case "conclude": prompt = `请对下面的文字内容进行总结: ${text}`; break;
		default: return;
	}
	if (!text) return;
	console.log(`🚀 发送 AI 流式请求: ${action}, 文本: ${text}`);

    // **通知前端 “加载中”**
    showResponse("加载中...");

    // **创建长连接**
    const port = chrome.runtime.connect({ name: "ai_stream" });

    // **监听 AI 服务器流式返回**
    port.onMessage.addListener((msg) => {
        console.log("📩 AI 流式返回:", msg);
        const responseDiv = document.getElementById("ai-response");
        responseDiv.style.display = "block";
        responseDiv.style.opacity = "1";

        if (msg.type === "start") {
            responseDiv.innerHTML = `<p><em>加载中...</em></p>`;
        } else if (msg.type === "delta") {
            responseDiv.innerHTML = `<div class="markdown-body">${marked.parse(msg.text)}</div>`;
        } else if (msg.type === "end") {
            console.log("✅ AI 生成完成");
        }
    });

    // **发送请求**
    port.postMessage({
        apiHost,
        apiToken,
        action,
        prompt
    });
}

function showResponse(responseText) {
	// 确保 `marked` 可用
    if (typeof marked === "undefined") {
        console.error("⚠ marked.js 未加载，请检查 `manifest.json`");
        return;
	}
    
	
    let responseDiv = document.getElementById("ai-response");
    
    if (!responseDiv) return;
	
	// **更新 Markdown 解析**

    responseDiv.innerHTML = `
        <div class="markdown-body">${marked.parse(responseText)}</div>
    `;
	
	// **确保 `responseDiv` 立即显示**
    responseDiv.style.display = "block";
    responseDiv.style.opacity = "1";
	
	// **确保 `responseDiv` 位置同步更新**
    updateResponsePosition();
	
	console.log("AI 响应 Markdown 渲染完成！");
}

function updateResponsePosition() {
    const toolbar = document.getElementById("ai-toolbar");
    const responseDiv = document.getElementById("ai-response");

    if (!toolbar || !responseDiv) {
        console.warn("⚠ `toolbar` 或 `responseDiv` 不存在，无法更新位置");
        return;
    }

    // **计算 `responseDiv` 位置**
    const toolbarRect = toolbar.getBoundingClientRect();
	const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const responseWidth = responseDiv.offsetWidth;

    let left = window.scrollX + toolbarRect.left;
    let top = window.scrollY + toolbarRect.bottom + 5;

    // 防止响应框超出视口边界
    if (left + responseWidth > viewportWidth) {
        left = viewportWidth - responseWidth - 10;
    }
    if (left < 0) {
        left = 10;
    }
    if (top + responseDiv.offsetHeight > viewportHeight) {
        top = viewportHeight - responseDiv.offsetHeight - 10;
    }
	
    // responseDiv.style.top = `${window.scrollY + toolbarRect.bottom + 5}px`;
    // responseDiv.style.left = `${window.scrollX + toolbarRect.left}px`;
	
	responseDiv.style.top = `${top}px`;
    responseDiv.style.left = `${left}px`;

    console.log("✅ `responseDiv` 位置已更新:", {
        top: responseDiv.style.top,
        left: responseDiv.style.left
    });
}

// 确保页面加载完成再插入工具条
function ensureToolbarInjected() {
    if (document.getElementById("ai-toolbar")) return; // 避免重复插入
	if (document.getElementById("ai-response")) return; // 避免重复插入

    if (document.readyState === "loading") {  // 必须等页面渲染完
        document.addEventListener("DOMContentLoaded", injectToolbar);
    } else {
        injectToolbar();
    }
}

// 在页面加载时自动调用
(async function () {
    const currentUrl = new URL(window.location.href).hostname;
    const { disabledSites = [] } = await chrome.storage.sync.get("disabledSites");

    if (disabledSites.includes(currentUrl)) {
        console.warn(`🚫 AI 插件已禁用: ${currentUrl}`);
        return; // **停止执行 content.js**
    }

    console.log("✅ AI 插件运行中:", currentUrl);
    ensureToolbarInjected(); // **继续执行插件逻辑**
})();