from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from browser_use import Agent
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class BrowserAgent:
    def __init__(self):
        # agent prompt path
        self.prompts_base_path = Path(__file__).parent.parent / 'agent' / 'prompt'
        self.prompts_extend_path = self.prompts_base_path / 'extend'
        self.prompts_extend = self._load_prompts(self.prompts_extend_path)
    
    def _load_prompts(self,prompt_files_path: Path):
        prompts = []
        for file_path in os.listdir(prompt_files_path):
            with open(os.path.join(prompt_files_path, file_path), 'r', encoding='utf-8') as file:
                prompts.append(file.read())
        return prompts

    def get_agent(self, task: str,model:str,api_key:str,base_url,extend_prompt_id:int=-1,browser_session = None,*args):
        # init llm based on model type
        logger.info(f"Init LLM model:{model}; base_url:{base_url}")
        
        try:
            # Prioritize OpenAI for better compatibility
            if "gpt" in model.lower() or "openai" in base_url.lower() or not ("claude" in model.lower() or "anthropic" in base_url.lower()):
                logger.info("Using OpenAI LLM")
                # Use default OpenAI endpoint if base_url points to OpenAI or is generic
                if "openai" in base_url.lower() or base_url == "https://api.openai.com/v1":
                    llm = ChatOpenAI(
                        model=model, 
                        api_key=api_key
                        # Do not use extra_body for standard OpenAI API
                    )
                else:
                    # Use custom base_url for OpenAI-compatible endpoints
                    llm = ChatOpenAI(
                        model=model, 
                        api_key=api_key, 
                        base_url=base_url
                        # Do not use extra_body for OpenAI-compatible endpoints
                    )
            elif "claude" in model.lower() or "anthropic" in base_url.lower():
                logger.info("Using Anthropic LLM")
                llm = ChatAnthropic(
                    model=model,
                    api_key=api_key
                    # Do not set base_url for Anthropic - it uses the default endpoint
                )
            else:
                logger.info("Using OpenAI-compatible LLM (fallback)")
                llm = ChatOpenAI(
                    model=model, 
                    api_key=api_key, 
                    base_url=base_url
                    # Do not use extra_body for fallback case
                )
            
            # get extend prompt and add English-only requirement
            extend_prompt = self.prompts_extend[extend_prompt_id] if extend_prompt_id >= 0 and extend_prompt_id < len(self.prompts_extend) else ""
            
            # Force English-only responses for browser automation
            english_only_prompt = """
CRITICAL REQUIREMENT: You must respond ONLY in English. Never use Spanish, Chinese, Portuguese, or any other language.
All explanations, descriptions, and communications must be in English only.
"""
            
            final_prompt = english_only_prompt + "\n" + extend_prompt if extend_prompt else english_only_prompt
            logger.info(f"Using extend prompt: {final_prompt[:100]}..." if final_prompt else "No extend prompt")
            
            return Agent(task=task, llm=llm, extend_system_message=final_prompt, browser_session=browser_session, *args)
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {str(e)}")
            raise Exception(f"Failed to connect to LLM. Please check your API key and network connection.")


    def get_extend_prompt(self, prompt_id:int = 0):
        return self.prompts_extend[prompt_id]


browser_agent = BrowserAgent()

if  __name__ == "__main__":
    browser_agent = BrowserAgent()
    print(browser_agent.get_extend_prompt(1))