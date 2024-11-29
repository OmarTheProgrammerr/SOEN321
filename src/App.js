/* global chrome */
import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [policy, setPolicy] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [score, setScore] = useState(null); // State to store the score
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

  const calculateScore = (text) => {
    let score = 100;
  
    // Deduct points for negative aspects
    if (text.toLowerCase().includes("third-party sharing")) score -= 15;
    if (text.toLowerCase().includes("biometric data")) score -= 10;
    if (text.toLowerCase().includes("long-term retention")) score -= 10;
    if (text.toLowerCase().includes("no opt-out")) score -= 5;
    if (text.toLowerCase().includes("tracking")) score -= 20;
    if (text.toLowerCase().includes("advertisers")) score -= 10;
  
    // Add points for positive aspects
    if (text.toLowerCase().includes("encryption")) score += 5;
    if (text.toLowerCase().includes("data protection officer")) score += 5;
    if (text.toLowerCase().includes("annual audits")) score += 5;
    if (text.toLowerCase().includes("secure storage")) score += 5;
  
    // Ensure score does not exceed 100
    if (score > 100) score = 100;
  
    // Ensure score does not fall below 0
    if (score < 0) score = 0;
  
    return score;
  };

  const getColorForScore = (score) => {
    if (score >= 75) return "#d4edda"; // Green
    else if (score >= 50) return "#fff3cd"; // Yellow
    else return "#f8d7da"; // Red
  };

  const analyzePolicy = async () => {
    setLoading(true);
    try {
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

      const analyzedText = response.data.choices[0].message.content;
      setAnalysis(analyzedText);
      const calculatedScore = calculateScore(analyzedText);
      setScore(calculatedScore);
    } catch (error) {
      console.error("Error analyzing policy:", error);
      setAnalysis(`Error analyzing policy: ${error.message}`);
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
              backgroundColor: getColorForScore(score),
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            <p style={{ whiteSpace: "pre-wrap" }}>{analysis}</p>
            {score !== null && (
              <p style={{ fontWeight: 'bold', marginTop: '10px' }}>
                Score: {score}/100 - Risk Level: {score >= 75 ? "Low" : score >= 50 ? "Moderate" : "High"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;