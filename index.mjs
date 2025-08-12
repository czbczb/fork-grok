import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

console.log(process.env.XAI_API_KEY)

function getHeaders(options) {
  return {
    'Authorization': process.env.XAI_API_KEY || '',
    'x-client-transaction-id': process.env.X_CLIENT_TRANSACTION_ID || '',
    'Cookie': process.env.X_COOKIE, // Add Cookie header
    'x-csrf-token': process.env.X_CSRF_TOKEN || '',
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-xai-request-id': process.env.X_XAI_REQUEST_ID || '',
    'x-xp-forwarded-for': process.env.X_XP_FORWARDED_FOR || '',
    ...options.headers
  };
}

async function createGrokConversation() {

  try {
    const headers = getHeaders({})
    const response = await fetch('https://x.com/i/api/graphql/vvC5uy7pWWHXS2aDi1FZeA/CreateGrokConversation', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        variables: {},
        queryId: 'vvC5uy7pWWHXS2aDi1FZeA'
      }),
      mode: 'cors',
      credentials: 'include'
    });

    console.log('响应结果:', response.data);
  } catch (error) {
    console.error('请求失败:', error.response ? error.response.data : error.message);
  }
}

async function callGrokApi(messages, options = {}) {

  const headers = getHeaders(options);
  const body = {
    responses: messages,
    systemPromptName: options.systemPromptName || '',
    grokModelOptionId: options.grokModelOptionId || 'grok-4',
    conversationId: options.conversationId || '',
    returnSearchResults: options.returnSearchResults || true,
    returnCitations: options.returnCitations || true,
    promptMetadata: {
      promptSource: options.promptSource || 'NATURAL',
      action: options.action || 'INPUT',
      ...options.promptMetadata
    },
    imageGenerationCount: options.imageGenerationCount || 4,
    requestFeatures: {
      eagerTweets: options.eagerTweets || true,
      serverHistory: options.serverHistory || true,
      ...options.requestFeatures
    },
    enableSideBySide: options.enableSideBySide || true,
    toolOverrides: options.toolOverrides || {},
    isDeepsearch: options.isDeepsearch || false,
    isReasoning: options.isReasoning || false
  };

  try {
    const response = await fetch('https://grok.x.com/2/grok/add_response.json', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      mode: 'cors',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const decoder = new TextDecoder();
    let fullMessage = ''; // Aggregate message content
    const results = []; // Store all parsed JSON objects

    // Process the stream
    for await (const chunk of response.body) {
      const textChunk = decoder.decode(chunk, { stream: true });
      process.stdout.write(textChunk); // Node 环境
      const lines = textChunk.split('\n');

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            console.log(json.result.message)
            results.push(json);

            // Extract message from 'result' objects
            if (json.result && json.result.message) {
              fullMessage += json.result.message;
            }
          } catch (error) {
            fullMessage += line;
            console.warn('Failed to parse line as JSON:', line, error);
          }
        }
      }
    }

    console.log('Full Message:', fullMessage);
    return { fullMessage, results };
  } catch (error) {
    console.error('Error calling Grok API:', error);
    throw error;
  }
}

async function main() {
  try {
    const messages = [
      {
        message: '你好，Grok！有没有可能有外星人？',
        sender: 1,
        fileAttachments: []
      }
    ];

    const options = {
      conversationId: '1955201570360136178',
      grokModelOptionId: 'grok-3' // grok-4
    };

    const { fullMessage, results } = await callGrokApi(messages, options);
    console.log('Aggregated Message:', fullMessage);
    console.log('Complete Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Main error:', error);
  }
}

main();