document.addEventListener("DOMContentLoaded", async () => {
    const urlElement = document.getElementById("currentUrl");
    const button = document.getElementById("toggleDisable");

    // **获取当前激活的 tab**
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (!tabs.length) return;
        const currentUrl = new URL(tabs[0].url).hostname; // **获取当前网站域名**
        urlElement.textContent = currentUrl;

        // **检查当前网址是否已经在禁用列表**
        const { disabledSites = [] } = await chrome.storage.sync.get("disabledSites");
        const isDisabled = disabledSites.includes(currentUrl);

        button.textContent = isDisabled ? "✅ 此网站上启用" : "🚫 此网站上禁用";
        button.style.backgroundColor = isDisabled ? "#4CAF50" : "#FF4C4C";

        // **添加或移除禁用网站**
        button.addEventListener("click", async () => {
            let updatedSites = disabledSites;
            if (isDisabled) {
                updatedSites = disabledSites.filter(site => site !== currentUrl);
            } else {
                updatedSites.push(currentUrl);
            }

            await chrome.storage.sync.set({ disabledSites: updatedSites });
            button.textContent = isDisabled ? "🚫 此网站上禁用" : "✅ 此网站上启用";
            button.style.backgroundColor = isDisabled ? "#FF4C4C" : "#4CAF50";

            chrome.tabs.reload(); // **刷新网页，使 `content.js` 立即生效**
        });
    });
	
	document.getElementById("openSettings").addEventListener("click", () => {
        console.log("⚙️ 打开设置页面");
        chrome.runtime.openOptionsPage();
    });
});