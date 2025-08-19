import React, { useState } from "react";
import axios from "axios";
import {
  Copy,
  Scissors,
  Clipboard,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Text management functions
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
  };

  const handleCut = () => {
    navigator.clipboard.writeText(prompt);
    setPrompt("");
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPrompt((prev) => prev + text);
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  const handleClear = () => {
    setPrompt("");
    setResult(null);
    setError("");
  };

  // Validation function using axios
  const validateNews = async () => {
    if (!prompt.trim()) {
      setError("Please enter some text to validate");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Replace with your actual backend endpoint
      const response = await axios.post(
        `${import.meta.env.VITE_HOST_ENDPOINT}`,
        {
          text: prompt,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 120000, // 120 seconds timeout
        }
      );

      // Parse the response structure from your backend
      let parsedResult = {
        message: response.data.message || "",
        rawData: null,
        parsedData: null,
        isTrue: false,
        hasValidData: false,
      };

      // Handle the data field - it can be null, string, or object
      if (response.data.data) {
        try {
          // Try to parse if it's a JSON string
          if (typeof response.data.data === "string") {
            parsedResult.parsedData = JSON.parse(response.data.data);
            parsedResult.rawData = response.data.data;
          } else {
            // It's already an object
            parsedResult.parsedData = response.data.data;
            parsedResult.rawData = JSON.stringify(response.data.data, null, 2);
          }

          // Determine if the claim is true or false
          if (parsedResult.parsedData.verdict) {
            const verdict = parsedResult.parsedData.verdict.toLowerCase();
            parsedResult.isTrue =
              verdict === "true" || verdict === "real" || verdict === "valid";
          }

          parsedResult.hasValidData = true;
        } catch (parseError) {
          // If parsing fails, treat as raw string
          parsedResult.rawData = response.data.data;
          parsedResult.hasValidData = false;
        }
      } else {
        // Handle case where data is null or empty
        parsedResult.hasValidData = false;
        parsedResult.rawData = "No data received from server";
      }

      setResult(parsedResult);
    } catch (err) {
      if (err.response) {
        // Server responded with error status
        setError(
          `Server error: ${err.response.status} - ${
            err.response.data?.message || "Unknown error"
          }`
        );
      } else if (err.request) {
        // Request was made but no response
        setError("Network error: Please check your connection and try again.");
      } else {
        // Something else happened
        setError(err.message || "Failed to validate news. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      validateNews();
    }
  };

  const getResultIcon = () => {
    if (!result || !result.hasValidData) return null;

    if (result.isTrue) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else {
      return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getResultColor = () => {
    if (!result || !result.hasValidData) return "border-gray-200 bg-gray-50";
    return result.isTrue
      ? "border-green-200 bg-green-50"
      : "border-red-200 bg-red-50";
  };

  // Function to format text with proper structure
  const formatText = (text) => {
    if (!text) return null;

    // Split text into sentences and paragraphs
    const paragraphs = text.split("\n").filter((p) => p.trim());

    return paragraphs.map((paragraph, pIndex) => {
      // Check for numbered lists (1. 2. 3. etc.)
      if (/^\d+\.\s/.test(paragraph.trim())) {
        return (
          <li
            key={pIndex}
            className="ml-4 mb-2 text-sm sm:text-base leading-relaxed"
          >
            {paragraph.replace(/^\d+\.\s/, "")}
          </li>
        );
      }

      // Check for bullet points (• - * etc.)
      if (/^[•\-\*]\s/.test(paragraph.trim())) {
        return (
          <li
            key={pIndex}
            className="ml-4 mb-2 text-sm sm:text-base leading-relaxed list-disc"
          >
            {paragraph.replace(/^[•\-\*]\s/, "")}
          </li>
        );
      }

      // Regular paragraph
      return (
        <p
          key={pIndex}
          className="mb-3 text-sm sm:text-base leading-relaxed text-gray-700"
        >
          {paragraph}
        </p>
      );
    });
  };

  // Function to render data field content
  const renderDataContent = (data) => {
    if (!data) return null;

    return Object.entries(data).map(([key, value], index) => {
      const formattedKey =
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");

      return (
        <div key={index} className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
            {formattedKey}:
          </h4>
          <div className="pl-4 border-l-2 border-gray-200">
            {typeof value === "string" ? (
              <div>{formatText(value)}</div>
            ) : Array.isArray(value) ? (
              <ul className="space-y-1">
                {value.map((item, idx) => (
                  <li key={idx} className="text-sm sm:text-base list-disc ml-4">
                    {typeof item === "object"
                      ? JSON.stringify(item, null, 2)
                      : item}
                  </li>
                ))}
              </ul>
            ) : typeof value === "object" ? (
              <pre className="bg-gray-100 p-2 rounded text-xs sm:text-sm overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <span className="text-sm sm:text-base text-gray-700">
                {String(value)}
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-2 sm:px-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              News Validation Tool
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Enter news content below to verify its authenticity using AI
              analysis
            </p>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Input Section */}
            <div className="mb-6">
              <label
                htmlFor="news-input"
                className="block text-sm font-medium text-gray-700 mb-3"
              >
                News Content
              </label>

              {/* Text Management Toolbar */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  title="Paste (Ctrl+V)"
                >
                  <Clipboard className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Paste</span>
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!prompt}
                  className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copy"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Copy</span>
                </button>
                <button
                  onClick={handleCut}
                  disabled={!prompt}
                  className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cut"
                >
                  <Scissors className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Cut</span>
                </button>
                <button
                  onClick={handleClear}
                  disabled={!prompt && !result}
                  className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-xs sm:text-sm">Clear All</span>
                </button>
              </div>

              <textarea
                id="news-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Paste or type the news content you want to validate here..."
                className="w-full h-32 sm:h-40 lg:h-48 p-3 sm:p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 resize-none text-sm sm:text-base outline-none transition-colors"
              />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 gap-2">
                <span className="text-xs sm:text-sm text-gray-500">
                  {prompt.length} characters
                  <span className="hidden sm:inline">
                    {" "}
                    | Press Ctrl+Enter to validate
                  </span>
                </span>
                <button
                  onClick={validateNews}
                  disabled={loading || !prompt.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden xs:inline">Validating...</span>
                      <span className="xs:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Validate News</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-red-700 font-medium text-sm sm:text-base">
                      Error
                    </span>
                    <p className="text-red-600 mt-1 text-sm sm:text-base">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Section */}
            {result && (
              <div className="space-y-6">
                {/* Server Message */}
                {result.message && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-1">
                      Server Response:
                    </h3>
                    <p className="text-blue-700 text-sm sm:text-base">
                      {result.message}
                    </p>
                  </div>
                )}

                {/* Validation Result */}
                {result.hasValidData ? (
                  <div
                    className={`p-4 sm:p-6 border rounded-lg ${getResultColor()}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {getResultIcon()}
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold">
                          Validation Result:{" "}
                          <span className="font-bold">
                            {result.parsedData.verdict || "Unknown"}
                          </span>
                        </h2>
                        {result.parsedData.claim && (
                          <p className="text-sm text-gray-600 mt-1">
                            Claim: "{result.parsedData.claim}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Detailed Data Analysis */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        Detailed Analysis
                      </h3>
                      {renderDataContent(result.parsedData)}
                    </div>
                  </div>
                ) : (
                  /* Fallback for invalid or null data */
                  <div className="p-4 sm:p-6 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                          Response Received
                        </h2>
                        <p className="text-yellow-700 text-sm mb-3">
                          The server responded but the data format is not as
                          expected or is null.
                        </p>

                        {result.rawData && (
                          <div>
                            <h4 className="font-medium text-yellow-800 mb-2">
                              Raw Data:
                            </h4>
                            <div className="bg-white p-3 rounded border border-yellow-300 overflow-x-auto">
                              <pre className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap">
                                {result.rawData}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Response Debug Section (Collapsible) */}
                <details className="bg-gray-50 border rounded-lg">
                  <summary className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-700">
                      🔍 View Raw Server Response
                    </span>
                  </summary>
                  <div className="p-4 pt-0">
                    <div className="bg-white p-3 rounded border overflow-x-auto">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(
                          {
                            message: result.message,
                            data: result.rawData,
                            hasValidData: result.hasValidData,
                            isTrue: result.isTrue,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3 text-sm sm:text-base">
                How to use:
              </h3>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Paste or type news content in the text area above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>
                    Use the toolbar buttons to copy, cut, paste, or clear text
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>
                    Click "Validate News" or press Ctrl+Enter to analyze
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>
                    Review the AI analysis result with confidence score and
                    explanation
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 bg-white rounded-lg shadow-lg border-t border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-600">
                  © 2025-2050 News Validation Tool. All rights reserved.
                </p>
              </div>

              <div className="text-center sm:text-right">
                <p className="text-sm text-gray-600 mb-1">
                  Developed by{" "}
                  <span className="font-semibold text-gray-800">
                    Sujal Kumar Saini
                  </span>
                </p>
                <div className="flex items-center justify-center gap-2">
                  <img
                    src="/communication.png"
                    alt="communication"
                    className="w-5 h-5"
                  />
                  <a
                    href="mailto:sujalsaini3304@gmail.com"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    sujalsaini3304@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Optional: Add a divider line */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Powered by AI • Built with React & Tailwind CSS
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
