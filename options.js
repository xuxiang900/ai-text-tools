document.addEventListener("DOMContentLoaded", async () => {
    // 获取存储的设置
    const data = await chrome.storage.sync.get(["apiHost", "apiToken", "features"]);

    document.getElementById("apiHost").value = data.apiHost || "http://10.10.5.228:3000";
    document.getElementById("apiToken").value = data.apiToken || "";

    const defaultFeatures = [
        { name: "翻译", prompt: `请根据文本内容的语种进行翻译，如果文本不是中文，则翻译成中文，如果是中文，则翻译成英文。仅返回翻译后的内容。下面是要翻译的文本: {text}
			输出格式：
			**{{原文语种}} → {{目标语种}}**
			{{翻译结果}}` },
        { name: "解释", prompt: `请解释什么是 “{text}”` },
        { name: "提问", prompt: `请回复这个问题: {text}` },
    ];

    // const features = data.features || defaultFeatures;
    //renderFeatures(features);

    document.getElementById("saveSettings").addEventListener("click", () => saveSettings());
    // document.getElementById("addFeature").addEventListener("click", () => addFeature(features));
});

// 渲染功能列表
/*
function renderFeatures(features) {
    const container = document.getElementById("toolbarConfig");
    container.innerHTML = "";
    
    features.forEach((feature, index) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <input type="text" value="${feature.name}" placeholder="功能名称">
            <input type="text" value="${feature.prompt}" placeholder="Prompt 语句">
            <button onclick="removeFeature(${index})">🗑 删除</button>
        `;
        container.appendChild(div);
    });
}

// 添加功能
function addFeature(features) {
    features.push({ name: "", prompt: "" });
    renderFeatures(features);
}

// 删除功能
function removeFeature(index) {
    features.splice(index, 1);
    renderFeatures(features);
}

*/

// 保存设置
function saveSettings() {
    chrome.storage.sync.set({
        apiHost: document.getElementById("apiHost").value,
        apiToken: document.getElementById("apiToken").value,
        // features
    }, () => {
        alert("✅ 设置已保存！");
    });
}