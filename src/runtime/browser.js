const axios = require('axios')

/**
 * Extract meaningful answers from browser automation history
 * @param {Array} browserHistory - Array of browser history entries
 * @param {string} originalPrompt - The original user prompt/question
 * @returns {Object} - Contains userFriendlyAnswer and allAnswers
 */
function extractAnswersFromBrowserHistory(browserHistory, originalPrompt) {
  const answers = [];
  let finalAnswer = '';
  
  // Extract all extracted_content from browser history
  for (const entry of browserHistory) {
    if (entry.extracted_content && entry.extracted_content.trim()) {
      answers.push({
        url: entry.url,
        content: entry.extracted_content.trim()
      });
      
      // The last entry usually contains the final answer
      finalAnswer = entry.extracted_content.trim();
    }
  }
  
  // If we have answers, create a user-friendly response
  if (answers.length > 0) {
    // For single answers, use the final answer directly
    if (answers.length === 1) {
      return {
        userFriendlyAnswer: finalAnswer,
        allAnswers: answers
      };
    }
    
    // For multiple steps, provide the final answer with context
    const userFriendlyAnswer = finalAnswer || answers[answers.length - 1]?.content || 'Task completed successfully.';
    
    return {
      userFriendlyAnswer,
      allAnswers: answers
    };
  }
  
  // Fallback if no extracted content found
  return {
    userFriendlyAnswer: 'Browser automation completed successfully, but no specific content was extracted.',
    allAnswers: []
  };
}

async function browser(action, uuid) {
  // Check if running in Docker and use appropriate host
  const host = process.env.DOCKER_HOST_ADDR || 'localhost'
  const host_port = 9000
  
  // Build the prompt from the action parameters (declare outside try block)
  let prompt = '';
  if (action.params.url && action.params.browser_code) {
    prompt = `Navigate to ${action.params.url} and execute this code: ${action.params.browser_code}`;
  } else if (action.params.question) {
    prompt = action.params.question;
  } else {
    prompt = JSON.stringify(action.params);
  }
  
  try {
    console.log("🌐 [BROWSER RUNTIME] ===== BROWSER ACTION RECEIVED =====");
    console.log("🌐 [BROWSER RUNTIME] UUID:", uuid);
    console.log("🌐 [BROWSER RUNTIME] Docker host resolution:", {
      DOCKER_HOST_ADDR: process.env.DOCKER_HOST_ADDR,
      resolved_host: host,
      final_url: `http://${host}:${host_port}`
    });
    console.log("🌐 [BROWSER RUNTIME] Full action object:", JSON.stringify(action, null, 2));
    console.log("🌐 [BROWSER RUNTIME] Action type:", action.type);
    console.log("🌐 [BROWSER RUNTIME] Action params:", JSON.stringify(action.params, null, 2));
    console.log("🌐 [BROWSER RUNTIME] Final prompt:", prompt);
    
    // Get LLM config from action or use OpenAI defaults
    const llm_config = action.params.llm_config || {
      model_name: process.env.OPENAI_MODEL || "gpt-4o-mini",
      api_key: process.env.OPENAI_API_KEY || "",
      api_url: process.env.OPENAI_API_URL || "https://api.openai.com/v1"
    };
    
    console.log("🌐 [BROWSER RUNTIME] LLM config:", {
      model_name: llm_config.model_name,
      api_key: llm_config.api_key ? "***PROVIDED***" : "***MISSING***",
      api_url: llm_config.api_url
    });
    
    const request = {
      method: 'POST',
      url: `http://${host}:${host_port}/api/browser/task`,
      data: { prompt, llm_config },
      timeout: 60000  // 60 second timeout
    };
    
    console.log("🌐 [BROWSER RUNTIME] Sending request to browser server...");
    console.log("🌐 [BROWSER RUNTIME] Request URL:", request.url);
    console.log("🌐 [BROWSER RUNTIME] Request data:", JSON.stringify(request.data, null, 2));
    
    const response = await axios(request);
    
    console.log("🌐 [BROWSER RUNTIME] ✅ Response received from browser server");
    console.log("🌐 [BROWSER RUNTIME] Response status:", response.status);
    console.log("🌐 [BROWSER RUNTIME] Response data:", JSON.stringify(response.data, null, 2));
    
    // Extract meaningful answers from browser history
    const browser_history = response.data.data.history.browser_history;
    const extractedAnswers = extractAnswersFromBrowserHistory(browser_history, prompt);
    
    const result = {
      uuid,
      status: 'success',
      content: extractedAnswers.userFriendlyAnswer,
      meta: {
        action_type: 'browser',
        json: { 
          browser_history: browser_history, 
          browser_history_screenshot: response.data.data.history.browser_history_screenshot 
        },
        extracted_answers: extractedAnswers.allAnswers,
        raw_history: JSON.stringify(browser_history)
      }
    };
    
    console.log("🌐 [BROWSER RUNTIME] ✅ Returning success result:", JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error("🌐 [BROWSER RUNTIME] ❌ Browser automation error:", error.message);
    console.error("🌐 [BROWSER RUNTIME] ❌ Error stack:", error.stack);
    if (error.response) {
      console.error("🌐 [BROWSER RUNTIME] ❌ Error response status:", error.response.status);
      console.error("🌐 [BROWSER RUNTIME] ❌ Error response data:", error.response.data);
    }
    
    // Return error result - browser server should be working now with OpenAI
    const errorResult = {
      uuid,
      status: 'failure',
      content: `Browser automation failed: ${error.message}`,
      meta: {
        action_type: 'browser',
        error: error.message,
        error_details: error.response ? error.response.data : null
      }
    };
    
    console.error("🌐 [BROWSER RUNTIME] ❌ Returning error result:", JSON.stringify(errorResult, null, 2));
    return errorResult;
  }
}


module.exports = browser;