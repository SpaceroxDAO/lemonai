const BaseLLM = require('./llm.base');
const axios = require('axios');

const fs = require('node:fs');
const net = require('node:net');

const PROXY_PORT = process.env.PROXY_PORT || 7890;
const PROXY_PROTOCOL = process.env.PROXY_PROTOCOL || 'http';
const PROXY_CONNECT_TIMEOUT = process.env.PROXY_CONNECT_TIMEOUT || 500;
const DISABLE_PROXY = process.env.DISABLE_PROXY === 'true';

/**
 * Check if current environment is in Docker container.
 * @returns {boolean} Returns true if in Docker, false otherwise.
 */
function amInDockerEnvironment() {
  try {
    fs.accessSync('/.dockerenv');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Async check if specified proxy server is connectable.
 * @param {string} host Proxy server hostname.
 * @param {number} port Proxy server port.
 * @returns {Promise<boolean>} Returns true if connectable, false otherwise.
 */
async function checkProxyConnectivity(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', (/* err */) => { // Capture error, but for this function just return false
      socket.destroy();
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.setTimeout(PROXY_CONNECT_TIMEOUT);
  });
}

let axiosInstancePromise = null;

const createAxiosInstance = async () => {
  // Strategy A: Environment variable override
  if (DISABLE_PROXY) {
    console.log('[Axios Init] Proxy disabled via DISABLE_PROXY environment variable. Creating instance without proxy.');
    return axios.create();
  }

  // Strategy B: Use environment variables for proxy configuration
  if (process.env.PROXY_HOST) {
    const proxyConfig = {
      protocol: process.env.PROXY_PROTOCOL || 'http',
      host: process.env.PROXY_HOST,
      port: process.env.PROXY_PORT || PROXY_PORT,
    };
    console.log(`[Axios Init] Using environment proxy configuration: ${proxyConfig.host}:${proxyConfig.port}`);
    return axios.create({ proxy: proxyConfig });
  }

  // Strategy C: Docker-aware configuration with fallback
  const isInDocker = amInDockerEnvironment();
  const proxyHost = isInDocker ? 'host.docker.internal' : '127.0.0.1';

  console.log(`[Axios Init] ENV: ${isInDocker ? 'Docker' : 'Host'}. Proxy host: ${proxyHost}:${PROXY_PORT}`);

  // Strategy D: Timeout-protected connectivity check
  try {
    const isProxyReachable = await Promise.race([
      checkProxyConnectivity(proxyHost, PROXY_PORT),
      new Promise(resolve => setTimeout(() => resolve(false), PROXY_CONNECT_TIMEOUT))
    ]);

    if (isProxyReachable) {
      const proxyConfig = {
        protocol: PROXY_PROTOCOL,
        host: proxyHost,
        port: PROXY_PORT,
      };
      console.log(`[Axios Init] Proxy ${proxyHost}:${PROXY_PORT} connectable. Creating axios instance with proxy.`);
      return axios.create({ proxy: proxyConfig });
    } else {
      console.warn(`[Axios Init] Proxy ${proxyHost}:${PROXY_PORT} not connectable. Creating axios instance without proxy.`);
      return axios.create();
    }
  } catch (error) {
    // Strategy E: Error handling fallback
    console.warn(`[Axios Init] Error checking proxy connectivity: ${error.message}. Creating axios instance without proxy.`);
    return axios.create();
  }
};

const getAxiosInstance = async () => {
  if (!axiosInstancePromise) {
    axiosInstancePromise = createAxiosInstance();
  }
  return axiosInstancePromise;
};

class GeminiLLM extends BaseLLM {

  /**
   * 
   * @param {*} onTokenStream 
   * @param {*} model gemini-1.0-pro | gemini-1.5-pro | gemini-1.5-flash-latest
   */
  constructor(onTokenStream, model, options = {}) {
    console.log('GeminiLLM', model, options);
    super(onTokenStream, model, options)
    this.GOOGLE_AI_KEY = options.config.API_KEY;
    this.splitter = '\n\r\n';
  }

  async request(messages, options = {}) {
    // gemini-1.5-pro-latest
    // const { model = 'gemini-pro' } = options;
    const model = this.model;

    const instance = await getAxiosInstance();

    // reference: https://ai.google.dev/gemini-api/docs/get-started/tutorial?lang=rest#stream_generate_content
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.GOOGLE_AI_KEY}`,
      headers: {
        "Content-Type": 'application/json'
      },
      transformResponse: [],
      data: {
        "contents": messages,
        "generationConfig": {
          "temperature": options.temperature || 0,
        }
      },
      responseType: "stream",
    };
    console.log("config", JSON.stringify(config, null, 2));

    // @ts-ignore
    const response = await instance.request(config).catch(err => {
      return err;
    });
    console.log(response.status);
    return response;
  }

  async call(prompt, context = {}) {
    const massageUser = [{ "parts": [{ "text": prompt }] }]
    const messages = (context.messages || []).concat(massageUser);
    return this.request(messages);
  }

  messageToValue(message) {
    // console.log("message", message);
    if (message == "data: [DONE]" || message.startsWith("data: [DONE]")) {
      return { type: "done" };
    }
    const data = message.split("data:")[1];
    let value = {}
    try {
      value = JSON.parse(data)
    } catch (error) {
      return { type: "done" };
    }
    const candidates = value.candidates || []
    if (!candidates.length) {
      return { type: "assistant" };
    }
    const candidate = candidates[0];
    const content = candidate.content;
    if (content && content.parts) {
      const part = content.parts[0];
      const text = part.text;
      return { type: 'text', text };
    }
    return { type: "assistant" };
  }
}

module.exports = exports = GeminiLLM;