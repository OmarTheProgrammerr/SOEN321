console.log("Content script loaded!");

function findPrivacyPolicy() {
  // Common privacy policy selectors
  const selectors = [
    "privacy",
    "privacy-policy",
    "privacyPolicy",
    "privacy_policy",
    "privacy-notice",
  ]
    .map((className) => `[class*="${className}"]`)
    .join(",");

  // Try to find privacy policy content
  const possibleElements = document.querySelectorAll(selectors);
  let policyText = "";

  if (possibleElements.length > 0) {
    policyText = Array.from(possibleElements)
      .map((el) => el.textContent)
      .join("\n");
  } else {
    // Fallback: Look for privacy-related headings
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const privacyHeading = Array.from(headings).find((h) =>
      h.textContent.toLowerCase().includes("privacy")
    );

    if (privacyHeading) {
      const section = privacyHeading.parentElement;
      policyText = section.textContent;
    }
  }

  return policyText;
}

// Extract and send policy text
const policyText = findPrivacyPolicy();
if (policyText && policyText.length > 100) {
  chrome.runtime.sendMessage(
    { action: "analyzePolicy", data: policyText },
    (response) => {
      console.log("Analysis Result:", response);
    }
  );
} else {
  console.log("Policy text is too short or irrelevant.");
}
