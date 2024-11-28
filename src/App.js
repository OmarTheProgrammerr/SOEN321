/* global chrome */
import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [policy, setPolicy] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we're running in a Chrome extension environment
    if (typeof chrome !== "undefined" && chrome.storage) {
      // Check for automatically detected policy
      chrome.storage.local.get(["currentPolicy"], (result) => {
        if (result.currentPolicy) {
          setPolicy(result.currentPolicy);
        }
      });

      // Listen for new policies
      chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "policyFound") {
          setPolicy(request.data);
        }
      });
    }
  }, []);

  const analyzePolicy = async () => {
    setLoading(true);
    try {
      // Log the API key (remove this in production!)
      console.log("API Key available:", !!process.env.REACT_APP_OPENAI_API_KEY);

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a privacy policy analyzer. Analyze the following privacy policy and identify potential risks, data collection practices, and user rights.",
            },
            {
              role: "user",
              content: policy,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data);
      setAnalysis(response.data.choices[0].message.content);
    } catch (error) {
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);
      setAnalysis(
        `Error analyzing policy: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", width: "400px" }}>
      <h1>Privacy Policy Analyzer</h1>
      <textarea
        rows="10"
        style={{ width: "100%", marginBottom: "10px" }}
        placeholder="Privacy policy text will appear here automatically..."
        value={policy}
        onChange={(e) => setPolicy(e.target.value)}
      />
      <button
        onClick={analyzePolicy}
        disabled={loading || !policy}
        style={{
          padding: "8px 16px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
      {analysis && (
        <div style={{ marginTop: "20px" }}>
          <h2>Analysis:</h2>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            <p style={{ whiteSpace: "pre-wrap" }}>{analysis}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
