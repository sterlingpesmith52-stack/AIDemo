
console.log("script loaded: main.js");

/* --- TEST --- */
function testFunction() {
    console.log("test function ran");
}
testFunction();

/* --- LOAD HUGGINGFACE CLIENT (safe version) --- */
let client = null;

function initClient() {
    try {
        client = new Hf({
            apiKey: "HFAKEYcDeLc9KPgeVpZDQ43yo"
        });
        console.log("HF client initialized");
    } catch (e) {
        console.log("HF client failed to initialize:", e);
    }
}

initClient();

/* --- WAIT FOR CLIENT --- */
async function waitForClient() {
    while (!client) {
        await new Promise(r => setTimeout(r, 50));
    }
}

/* --- SAFARI ADDRESS BAR HIDE --- */
window.addEventListener("load", () => {
    window.scrollTo(0, 1);
});

/* --- MODE SYSTEM --- */

const modes = [
    "Normal",
    "Instructions",
    "Explain",
    "Summary",
    "Creative",
    "AI"
];

const displayNames = {
    "Normal": "Start here",
    "Instructions": "Instructions",
    "Explain": "Explain",
    "Summary": "Summary",
    "Creative": "Creative",
    "AI": "AI"
};

const systemMessages = {
    "Normal": "Respond helpfully to the user's text.",
    "Instructions": "Give clear, step-by-step instructions.",
    "Summary": "Summarize the user's text in 3 to 5 words.",
    "Explain": "Explain the user's text clearly.",
    "Creative": "Rewrite the user's text creatively.",
    "AI": "Respond as an AI assistant."
};

let modeIndex = 0;
let history = [];

/* --- TYPE / MODE BUTTON --- */

const typeBtn = document.getElementById("typeBtn");

async function handleTypeTap() {
    try {
        modeIndex = (modeIndex + 1) % modes.length;
        const mode = modes[modeIndex];
        document.getElementById("modeDisplay").value = displayNames[mode];

        const input = document.getElementById("promptArea").value;
        const outputArea = document.getElementById("outputArea");

        if (!input.trim()) {
            outputArea.value = "";
            return;
        }

        await waitForClient();
        outputArea.value = "";

        const stream = await client.responses.stream({
            model: "gpt-4.1-mini",
            messages: [
                { role: "system", content: systemMessages[mode] },
                { role: "user", content: input }
            ]
        });

        let fullText = "";

        for await (const chunk of stream) {
            if (chunk.type === "response.output_text.delta") {
                outputArea.value += chunk.delta;
                fullText += chunk.delta;
            }
        }

        history.push({ mode, input, output: fullText });

    } catch (err) {
        document.getElementById("outputArea").value =
            "⚠️ Error: " + (err.message || "Unknown error");
    }
}

typeBtn.addEventListener("touchstart", handleTypeTap, { passive: true });
typeBtn.addEventListener("click", handleTypeTap);

/* --- CLEAR --- */
document.getElementById("clearBtn").onclick = function () {
    document.getElementById("promptArea").value = "";
    document.getElementById("outputArea").value = "";
    history = [];
};

/* --- PASTE --- */
document.getElementById("pasteBtn").onclick = async function () {
    const area = document.getElementById("promptArea");
    area.focus();

    if (navigator.clipboard && navigator.clipboard.readText) {
        try {
            const text = await navigator.clipboard.readText();
            area.value = text;
            return;
        } catch (e) {}
    }

    document.execCommand("paste");
};

/* --- COPY --- */
document.getElementById("copyBtn").onclick = async function () {
    try {
        const text
