const ONLINE_API_HOST = "https://ai.wollyxu.com";

chrome.runtime.onConnect.addListener((port) => {
    console.log("🔗 监听长连接:", port.name);
	
	// **监听 port 断开**
    port.onDisconnect.addListener(() => {
        console.warn("⚠ 端口断开，停止流式传输");
    });

    if (port.name === "ai_stream") {
        port.onMessage.addListener(async (msg) => {
            console.log("🚀 AI 请求:", msg);
			
			if (!msg.prompt) {
                console.error("❌ `msg.prompt` 未定义，请检查 `content.js` 传递的数据");
                port.postMessage({ type: "error", text: "❌ 提示词错误，请重试。" });
                return;
            }
			
			// **从 `chrome.storage.sync` 读取 apiHost 和 apiToken**
            const { apiHost, apiToken } = await chrome.storage.sync.get(["apiHost", "apiToken"]);
			
			if (!apiHost || !apiToken) {
                console.error("❌ API HOST 或 Token 未设置，请先配置！");
                port.postMessage({ type: "error", text: "❌ 请检查 API 服务器地址和 Token 配置！" });
                return;
            }
			
			console.log("🌍 使用 API 服务器:", apiHost);
            console.log("🔑 使用 API Token:", apiToken);
            
            // **通知前端 "加载中"**
            port.postMessage({ type: "start" });

            try {
                const response = await fetch(`${apiHost}/api/chat/completions`, {
                    method: "POST",
                    headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${apiToken}`
					},
                    body: JSON.stringify({
                        model: "gpt-4.1",
                        messages: [{ role: "user", content: msg.prompt }],
                        stream: true  // **启用流式返回**
                    })
                });

                if (!response.ok) {
                    throw new Error(`❌ API 请求失败: ${response.statusText}`);
                }

                // **读取流式数据**
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let completeText = "";

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true }).trim();
                    console.log("🔹 原始流数据:", chunk);
                    // **服务器可能返回 SSE 格式的流数据，需要适配 `data: {}` 结构**
                    const lines = chunk.split("\n");
                    for (const line of lines) {
						if (!line.trim() || line.startsWith("data: [DONE]")) continue;
                        if (!line.trim() || !line.startsWith("data: ")) continue;

                        try {
                            const jsonLine = line.startsWith("data: ") ? line.replace("data: ", "").trim() : line;
                            const json = JSON.parse(jsonLine);
                            const delta = json.choices?.[0]?.delta?.content || "";

                            completeText += delta;
                            console.log("📝 解析出增量内容:", delta);

                            // **发送部分 AI 输出**
                            port.postMessage({ type: "delta", text: completeText });
                        } catch (e) {
                            console.error("⚠ JSON 解析失败:", line, e);
                        }
                    }
                }

                // **发送结束标志**
                port.postMessage({ type: "end" });
            } catch (error) {
                console.error("❌ API 请求失败:", error);
                port.postMessage({ type: "error", text: `❌ AI 生成失败，请重试...\n${error.message}` });
            }
        });
    }
});