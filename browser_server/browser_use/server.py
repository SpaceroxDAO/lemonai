import datetime
import os
import logging
import traceback
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from service.browser_agent import browser_agent_manager
from config.load_config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init():
    # Load environment variables from .env file
    from dotenv import load_dotenv
    # Try multiple locations for .env file
    env_paths = [
        os.path.join(os.path.dirname(__file__), '..', '.env'),  # browser_server/.env
        os.path.join(os.path.dirname(__file__), '..', '..', '.env'),  # root .env
        '.env'  # current directory
    ]
    
    env_loaded = False
    for env_path in env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path)
            logger.info(f"Loaded environment from: {env_path}")
            env_loaded = True
            break
    
    if not env_loaded:
        logger.warning("No .env file found, using environment variables")
    
    # Set fallback API key if none provided
    if not os.environ.get("OPENAI_API_KEY"):
        os.environ["OPENAI_API_KEY"] = "fallback-key"
    
    logger.info(f"Environment initialized. OPENAI_API_KEY present: {bool(os.environ.get('OPENAI_API_KEY'))}")
    logger.info(f"ANTHROPIC_API_KEY present: {bool(os.environ.get('ANTHROPIC_API_KEY'))}")
    return

class TaskRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    llm_config: dict = Field(...,
                             description="包含 model_name, api_key, api_url")
    
def create_response(code: int, message: str, data: dict) -> dict:
    return {"code": code, "message": message, "data": data}


async def parse_task_request(request: Request) -> TaskRequest:
    """
    parse task request
    """
    try:
        data = await request.json()
        task = TaskRequest(**data)
        llm_config = task.llm_config
        if not all([llm_config.get(k) for k in ["model_name", "api_key", "api_url"]]):
            raise HTTPException(status_code=400, detail="Invalid llm_config")
        return task
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid JSON data")
    
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/browser/task")
async def browser_task(request: Request):
    start_time = datetime.datetime.now()
    try:
        logger.info("🤖 [BROWSER SERVER] ===== BROWSER TASK REQUEST RECEIVED =====")
        logger.info(f"🤖 [BROWSER SERVER] Request method: {request.method}")
        logger.info(f"🤖 [BROWSER SERVER] Request URL: {request.url}")
        logger.info(f"🤖 [BROWSER SERVER] Request headers: {dict(request.headers)}")
        
        # Parse the request first
        task = await parse_task_request(request)
        logger.info(f"🤖 [BROWSER SERVER] Raw request data: {task.dict()}")
        logger.info(f"🤖 [BROWSER SERVER] ✅ Successfully parsed task")
        logger.info(f"🤖 [BROWSER SERVER] Task prompt: {task.prompt}")
        logger.info(f"🤖 [BROWSER SERVER] LLM config: model={task.llm_config.get('model_name')}, api_url={task.llm_config.get('api_url')}")
        logger.info(f"🤖 [BROWSER SERVER] API key present: {bool(task.llm_config.get('api_key'))}")
        
        llm_config = task.llm_config
        
        logger.info("🤖 [BROWSER SERVER] Starting browser agent task execution...")
        history = await browser_agent_manager.run_task_only(
            task.prompt,
            model=llm_config["model_name"],
            api_key=llm_config["api_key"],
            base_url=llm_config["api_url"],
        )
        
        end_time = datetime.datetime.now()
        response = create_response(
            200,
            "Task completed",
            {
                "time": datetime.datetime.now().isoformat(),
                "time_cost": (end_time - start_time).total_seconds(),
                "history": history
            },
        )
        logger.info("🤖 [BROWSER SERVER] ✅ Task completed successfully")
        logger.info(f"🤖 [BROWSER SERVER] Response: {response}")
        return response
        
    except Exception as e:
        logger.error(f"🤖 [BROWSER SERVER] ❌ Error processing browser task: {str(e)}")
        logger.error(f"🤖 [BROWSER SERVER] ❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.datetime.now().isoformat()}
    

if __name__ == "__main__":
    import uvicorn
    init()
    uvicorn.run(app, host=config['server']['host'], port=config['server']['port'])