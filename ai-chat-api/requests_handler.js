import node_fetch from 'node-fetch';
import { getEncoding } from "js-tiktoken";
import { model_input_costs} from "./tokenCalculator.js";

export async function streamPostRequest(url, headers, payload) {
    return node_fetch(url, {
        method: 'POST',
        headers: headers,
        body: typeof payload === 'string' ? payload : JSON.stringify(payload)
    });
}

export async function postRequest(url, headers, body, files) {
    if (!files) {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body
        });

       
        if (!response.ok) {
            return [undefined, response.status];
        }

        return [await response.json(), response.status];
    }

    const formData = new FormData();
    for (const [key, value] of Object.entries(JSON.parse(body))) {
        formData.append(key, value);
    }
    files.forEach(file => {
        formData.append('file', new Blob([file.buffer]), file.originalname);
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData
    });

    return [await response.json(), response.status];
}

function getMatchingModel(modelName) {
    for (let key in model_input_costs) {
        if (modelName.startsWith(key)) {
            return key;
        }
    }
    // Return undefined or some default value if no match is found
    return undefined;
}


function count_tokens(messages, model) {
    const encoder = getEncoding("cl100k_base");
    
    let total_tokens = 0;
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i].content;
        if (typeof message === 'string') {
            const encoding = encoder.encode(message);
            total_tokens += encoding.length;
            continue;
        } else {
            for (let j = 0; j < message.length; j++) {
                if (message[j].type === 'text') {
                    const encoding = encoder.encode(message[j].content);
                    total_tokens += encoding.length;
                } else if (message[j].type === 'image_url') {
                    total_tokens += 85; // input tokens for low res image
                }
            }
        }
    }

    return total_tokens;
}


export function addAuthorizationAndCountInputTokens(url, headers, body) {
    // Text Services
    if (url.includes('openai.com/v1/chat/completions')) {
        if ('Authorization' in headers) {
            return 1;
        } else {
            headers['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;

            if (!(body.model in model_input_costs)) {
                return -1; // unsupported model
            }

            if (body.model == "gpt-4-vision-preview") {
                // make sure "detail" is "low"
                for (let i = 0; i < body.messages.length; i++) {
                    for (let j = 0; j < body.messages[i].content.length; j++) {
                        const content = body.messages[i].content[j];
                        if (content.type === "image_url" && content?.detail !== "low") {
                            return -1; // unsupported detail
                        }
                    }
                }
            }
        
            const input_tokens = count_tokens(body.messages, body.model);
            return input_tokens;
        }
    } else if (url.includes('api.anthropic.com/v1/messages')) {
        if ('x-api-key' in headers) {
            return 1;
        } else {
            headers['x-api-key'] = process.env.ANTHROPIC_API_KEY;
            
            const model = getMatchingModel(body.model);
            if (!model) {
                return -1; // unsupported model
            }

            const input_tokens = count_tokens(body.messages, model);
            return input_tokens;
        }
    } else if (url.includes('api.groq.com/openai/v1/chat/completions')) {
        if ('Authorization' in headers) {
            return 1;
        } else {
            headers['Authorization'] = `Bearer ${process.env.GROQ_API_KEY}`;
            if (!(body.model in model_input_costs)){
                return -1; // unsupported model
            }

            const input_tokens = count_tokens(body.messages, body.model);
            return input_tokens;
        }
    }
}