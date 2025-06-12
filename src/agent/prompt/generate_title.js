
const resolveGenerateTitlePrompt = async (truncated_message) => {

  const prompt = `
  You are a helpful assistant that generates concise, descriptive titles for conversations with Lemon. Your name is Lemon. Lemon is a helpful AI agent that can interact with a computer to solve tasks using bash terminal, file editor, and browser. Given a user message (which may be truncated), generate a concise, descriptive title for the conversation. Return only the title, with no additional text, quotes, or explanations.
  
  **CRITICAL REQUIREMENT: ALWAYS generate the title in English only. Never use Spanish, Chinese, Portuguese, or any other language, regardless of the input language.**
  Generate a title for a conversation that starts with this message:
  
  ${truncated_message}
  `

  return prompt;
}


module.exports = resolveGenerateTitlePrompt;