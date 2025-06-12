const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const Docker = require('dockerode');
const os = require('os');
const DOCKER_HOST_ADDR = process.env.DOCKER_HOST_ADDR;
const { write_code: util_write_code } = require('./utils/tools');
const { getDefaultModel } = require('@src/utils/default_model')

let dockerOptions = {};
if (os.platform() === 'win32') {
  // Windows: 使用 named pipe
  dockerOptions.socketPath = '//./pipe/docker_engine';
} else {
  // Linux/macOS: 使用默认的 Unix socket
  dockerOptions.socketPath = '/var/run/docker.sock';
}
const docker = new Docker(dockerOptions);

const Message = require('@src/utils/message');

const tools = require("../tools/index.js");
const { v4: uuidv4 } = require("uuid");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const { find_available_tcp_port } = require('./utils/system');

const read_file = require('./read_file');

const { restrictFilepath } = require('./runtime.util');


EXECUTION_SERVER_PORT_RANGE = [30000, 39999]
VSCODE_PORT_RANGE = [40000, 49999]
APP_PORT_RANGE_1 = [50000, 54999]
APP_PORT_RANGE_2 = [55000, 59999]

/**
 * @typedef {import('./DockerRuntime').DockerRuntime} LocalRuntimeInterface
 * @typedef {import('./DockerRuntime').Action} Action
 * @typedef {import('./DockerRuntime').ActionResult} ActionResult
 * @typedef {import('./DockerRuntime').Memory} Memory
 */

class DockerRuntime {

  /**
   * 创建一个docker运行时实例
   * @param {Object} [options={}] - 配置选项
   * @param {Memory} options.memory - 记忆管理实例
   */
  constructor(options) {

    const { getDirpath } = require('@src/utils/electron');
    let workspace_dir = getDirpath(process.env.WORKSPACE_DIR || 'workspace');
    if (DOCKER_HOST_ADDR) {
      workspace_dir = process.env.ACTUAL_HOST_WORKSPACE_PATH;
    }
    this.workspace_dir = workspace_dir;
    this.host_port = null;
    this.vscode_port = null;
    this.app_port_1 = null;
    this.app_port_2 = null;
  }

  // 要操作容器必须先执行connect_container
  async connect_container() {
    // 查看容器是否存在，如果不存在，初始化容器，如果存在但是没启动，start容器
    let container;
    try {
      container = docker.getContainer('lemon-runtime-sandbox')
      const container_info = await container.inspect();
      if (container_info.State.Status === 'exited') {
        console.log('DockerRuntime.connect_container.container exited, start container');
        await container.start();
      } else if (container_info.State.Status === 'running') {
        console.log('DockerRuntime.connect_container.container is running');
      }
    } catch (err) {
      console.log('DockerRuntime.connect_container.getContainer', err.message);
      container = await this.init_container();
    }

    let container_info = await container.inspect()
    this.host_port = Object.keys(container_info.NetworkSettings.Ports)[0].split('/')[0]
    this.vscode_port = Object.keys(container_info.NetworkSettings.Ports)[1].split('/')[0]
    this.app_port_1 = Object.keys(container_info.NetworkSettings.Ports)[2].split('/')[0]
    this.app_port_2 = Object.keys(container_info.NetworkSettings.Ports)[3].split('/')[0]

    // const cmdArgs = container_info.Config.Cmd;
    // // 遍历命令行参数，找到对应的端口值
    // for (let i = 0; i < cmdArgs.length; i++) {
    //   if (cmdArgs[i] === '--port') {
    //     this.host_port = cmdArgs[i + 1];
    //   } else if (cmdArgs[i] === '--vscode_port') {
    //     this.vscode_port = cmdArgs[i + 1];
    //   }
    // }

    return container;
  }

  async find_available_port(port_range) {
    const port = await find_available_tcp_port(port_range[0], port_range[1]);
    return port
  }

  async init_container() {
    // 初始化容器
    console.log('DockerRuntime.init_container');

    const host_port = await this.find_available_port(EXECUTION_SERVER_PORT_RANGE);
    this.host_port = host_port
    const vscode_port = await this.find_available_port(VSCODE_PORT_RANGE);
    const app_port_1 = await this.find_available_port(APP_PORT_RANGE_1);
    const app_port_2 = await this.find_available_port(APP_PORT_RANGE_2);

    const PortBindingsMap = {}
    PortBindingsMap[`${host_port}/tcp`] = [{ HostPort: `${host_port}` }]
    PortBindingsMap[`${vscode_port}/tcp`] = [{ HostPort: `${vscode_port}` }]
    PortBindingsMap[`${app_port_1}/tcp`] = [{ HostPort: `${app_port_1}` }]
    PortBindingsMap[`${app_port_2}/tcp`] = [{ HostPort: `${app_port_2}` }]


    const exposedPortsMap = {}
    exposedPortsMap[`${host_port}/tcp`] = {}
    exposedPortsMap[`${vscode_port}/tcp`] = {}
    exposedPortsMap[`${app_port_1}/tcp`] = {}
    exposedPortsMap[`${app_port_2}/tcp`] = {}

    const imageName = 'hexdolemonai/lemon-runtime-sandbox:latest';
    await this.ensureImageExists(docker, imageName);

    const container = await docker.createContainer({
      Image: imageName,
      name: 'lemon-runtime-sandbox',                // 容器名称
      Cmd: ['node', 'chataa/action_execution_server.js', '--port', `${host_port}`, '--vscode_port', `${vscode_port}`],  // 启动命令
      WorkingDir: '/chataa/code',                // 容器内工作目录
      ExposedPorts: exposedPortsMap,
      HostConfig: {
        Binds: [
          // 本地目录 : 容器目录 : 模式（rw 可读写 / ro 只读）
          `${this.workspace_dir}:/workspace:rw`
        ],
        PortBindings: PortBindingsMap,
        AutoRemove: false,  // 如需容器退出后自动删除，可改为 true
        // NetworkMode: 'host',
      },
    });
    // 2. 启动容器
    await container.start();
    return container;
  }

  async ensureImageExists(docker, imageName) {
    try {
      await docker.getImage(imageName).inspect();
      console.log(`[Docker] Image ${imageName} already exists`);
    } catch (err) {
      if (err.statusCode === 404) {
        console.log(`[Docker] Image ${imageName} not found locally, pulling from registry...`);
        await new Promise((resolve, reject) => {
          docker.pull(imageName, (err, stream) => {
            if (err) {
              return reject(new Error(`[Docker] Failed to pull image: ${err.message}`));
            }
            docker.modem.followProgress(stream, (err, res) => {
              if (err) return reject(new Error(`[Docker] Pull image progress error: ${err.message}`));
              resolve(res);
            });
          });
        });
        console.log(`[Docker] Image ${imageName} pulled successfully`);
      } else {
        throw new Error(`[Docker] Failed to inspect image: ${err.message}`);
      }
    }
  }

  async handle_memory(result, action, memory) {
    const type = action.type;
    const memorized_type = new Set(['read_file']);
    if (result.status === 'success') {
      console.log('DockerRuntime.handle_memory.memory logging user prompt');
      const memorized = memorized_type.has(type)
      await memory.addMessage('user', result.content||result.stderr, action.type, memorized);
    }
    return memory;
  }

  /**
   * @param {Action} action 
   * @param {*} context 
   * @returns {Promise<ActionResult>}
   */
  async execute_action(action, context = {}, task_id) {
    const { type, params } = action;
    // 根据 action.type 调用对应的方法
    console.log('action', action.type);
    const uuid = uuidv4();
    // action running message
    const tool = tools[type];
    if (tool.getActionDescription) {
      const description = await tool.getActionDescription(params);
      const value = {
        uuid: uuid,
        content: description,
        status: 'running',
        meta: {
          task_id: task_id,
          action_type: type,
        },
        timestamp: new Date().valueOf()
      }
      const msg = Message.format({ uuid: uuid, status: 'running', content: description, action_type: type, task_id: task_id });
      context.onTokenStream(msg)
      await this.callback(msg, context);
      Message.saveToDB(msg, context.conversation_id);
      await delay(500);
    }

    /**
     * @type {ActionResult}
     */
    let result;
    const dir_name = 'Conversation_' + context.conversation_id.slice(0, 6);
    switch (type) {
      case 'write_code':
        if (action.params.path) {
          action.params.path = path.join(dir_name, action.params.path)
        }
        result = await this.write_code(action, uuid);
        break;
      case 'terminal_run':
        if (action.params.cwd) {
          action.params.cwd = path.join(dir_name, action.params.cwd)
        } else {
          action.params.cwd = `./${dir_name}`
        }
        result = await this._call_docker_action(action, uuid);
        break;
      case 'read_file':
        if (action.params.path) {
          action.params.path = path.join(dir_name, action.params.path)
        }
        result = await this.read_file(action, uuid);
        break;
      case 'browser':
        console.log(`[DOCKER-RUNTIME] 🌐 Browser action received. UUID: ${uuid}, Action: ${JSON.stringify(action, null, 2)}`);
        let model_info = await getDefaultModel()
        const llm_config = {
          model_name: model_info.model_name,
          api_url: model_info.base_url,
          api_key: model_info.api_key
        }
        action.params.llm_config = llm_config
        console.log(`[DOCKER-RUNTIME] 🌐 Calling docker action for browser. LLM config: ${model_info.model_name}`);
        result = await this._call_docker_action(action, uuid)
        console.log(`[DOCKER-RUNTIME] 🌐 Browser action result received. Status: ${result.status}, UUID: ${uuid}`);
        
        // Enhanced browser result processing
        if (result.status === 'success' && result.meta && result.meta.json && result.meta.json.browser_history) {
          console.log(`[DOCKER-RUNTIME] 🌐 Processing browser history for enhanced results. UUID: ${uuid}`);
          const enhancedContent = this.extractAnswersFromBrowserHistory(result.meta.json.browser_history, action.params.question);
          if (enhancedContent && enhancedContent.trim() !== action.params.question) {
            console.log(`[DOCKER-RUNTIME] 🌐 Enhanced browser content extracted. UUID: ${uuid}`);
            result.content = enhancedContent;
          }
        }
        break;
      default:
        if (tool) {
          console.log('DockerRuntime.execute_action.tool', tool.name, params);
          const execute = tool.execute;
          const execute_result = await execute(params);
          // console.log('LocalRuntime.execute_action.tool.execute', execute_result);
          const { content, meta = {} } = execute_result;
          result = { uuid, status: 'success', content, memorized: tool.memorized || false, meta };
        } else {
          result = { status: 'failure', error: `Unknown action type: ${type}`, content: '', stderr: '' };
        }
    }
    // 保存 action 执行结果到 memory
    console.log('DockerRuntime.execute_action', result);
    await this.handle_memory(result, action, context.memory);
    // 回调处理
    let meta_url = ''
    let meta_json = []
    let meta_file_path = ''
    if (result.meta) {
      meta_url = result.meta.url || ''
      meta_json = result.meta.json || []
      meta_file_path = result.meta.filepath || ''
    }
    const msg = Message.format({ status: result.status, memorized: result.memorized || '', content: result.content || '', action_type: type, task_id: task_id, uuid: uuid || '', url: meta_url, json: meta_json, filepath: meta_file_path });
    await this.callback(msg, context);
    await Message.saveToDB(msg, context.conversation_id);
    return result;
  }

  async _call_docker_action(action, uuid) {
    // Use localhost with the mapped host port for Docker container communication
    const host = 'localhost';
    const port = this.host_port;
    
    const request = {
      method: 'POST',
      url: `http://${host}:${port}/execute_action`,
      data: { action: action, uuid: uuid },
      timeout: action.type === 'browser' ? 90000 : 30000  // 90s for browser, 30s for others
    };
    
    console.log(`[DOCKER-RUNTIME] 📡 Sending request to container. URL: ${request.url}, Action: ${action.type}, UUID: ${uuid}`);
    
    try {
      const response = await axios(request);
      console.log(`[DOCKER-RUNTIME] 📡 Response received from container. Status: ${response.status}, UUID: ${uuid}`);
      return response.data.data
    } catch (error) {
      console.error(`[DOCKER-RUNTIME] 📡 Request failed to container. URL: ${request.url}, Action: ${action.type}, UUID: ${uuid}, Error: ${error.message}`);
      
      // Return proper error result for timeouts and connection issues
      return {
        uuid,
        status: 'failure',
        content: `Docker action failed: ${error.message}`,
        meta: {
          action_type: action.type,
          error: error.message
        }
      };
    }
  }

  /**
   * @param {Action} action
   * @returns {Promise<ActionResult>}
   */
  async write_code(action, uuid) {
    return util_write_code(action, uuid);
  }

  /**
   * @param {Action} action
   * @returns {Promise<ActionResult>}
   */
  async read_file(action) {
    let { path: filepath } = action.params;
    filepath = await restrictFilepath(filepath);

    try {
      const content = await read_file(filepath);
      return { status: 'success', content, error: "", meta: { filepath: filepath } };
    } catch (error) {
      return { status: 'failure', content: "", error: `Failed to read file ${filepath}: ${error.message}` };
    }
  }

  extractAnswersFromBrowserHistory(browserHistory, originalPrompt) {
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
    
    if (answers.length === 0) {
      return originalPrompt;
    }
    
    // Try to parse JSON content for structured data like headlines
    let structuredContent = '';
    for (const answer of answers) {
      const content = answer.content;
      
      // Check if content contains JSON with headlines or structured data
      if (content.includes('```json') || content.includes('"headlines"') || content.includes('[') || content.includes('{')) {
        try {
          // Extract JSON from markdown code blocks or direct JSON
          let jsonStr = content;
          if (content.includes('```json')) {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1];
            }
          } else if (content.includes('📄  Extracted from page')) {
            const jsonMatch = content.match(/📄  Extracted from page[:\s]*```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1];
            }
          }
          
          const parsed = JSON.parse(jsonStr);
          
          // Handle headlines specifically
          if (parsed.headlines && Array.isArray(parsed.headlines)) {
            structuredContent = `Here are the current CNN headlines:\n\n${parsed.headlines.map((headline, i) => `${i + 1}. ${headline}`).join('\n')}`;
            break;
          }
          
          // Handle other structured data
          if (parsed.results && Array.isArray(parsed.results)) {
            structuredContent = `Found ${parsed.results.length} results:\n\n${parsed.results.map((item, i) => `${i + 1}. ${typeof item === 'string' ? item : JSON.stringify(item)}`).join('\n')}`;
            break;
          }
          
        } catch (e) {
          // Not valid JSON, continue with text processing
        }
      }
    }
    
    // If we found structured content, return it
    if (structuredContent) {
      return structuredContent;
    }
    
    // Otherwise, return the final extracted content with some cleanup
    if (finalAnswer) {
      // Remove technical indicators and clean up
      let cleanAnswer = finalAnswer
        .replace(/📄\s*Extracted from page[:\s]*/gi, '')
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .replace(/🔗\s*Opened new tab with.*$/gm, '')
        .trim();
      
      // If it's still mostly the original prompt, return the raw content
      if (cleanAnswer.toLowerCase().includes(originalPrompt.toLowerCase()) && cleanAnswer.length < originalPrompt.length * 2) {
        return originalPrompt;
      }
      
      return cleanAnswer;
    }
    
    return originalPrompt;
  }

  async callback(result, context = {}) {
    const { onTokenStream } = context;
    if (onTokenStream) {
      onTokenStream(result);
    }
  }
}

module.exports = DockerRuntime;