// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("Privacy Policy Analyzer extension installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzePolicy") {
    // Store the policy text for the popup to access
    chrome.storage.local.set(
      {
        currentPolicy: request.data,
      },
      () => {
        // Notify the popup that new policy data is available
        chrome.runtime.sendMessage({
          action: "policyFound",
          data: request.data,
        });
      }
    );
  }
  return true;
});

// Function to call GPT API
async function callGPTApi(policyText) {
  try {
    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer YOUR_OPENAI_API_KEY`, // Replace with your API key
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `Analyze this privacy policy for risks:\n\n${policyText}`,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    console.log("GPT API Response:", data);
    return data.choices[0].text;
  } catch (error) {
    console.error("Error calling GPT API:", error);
    return "An error occurred while analyzing the policy.";
  }
}
