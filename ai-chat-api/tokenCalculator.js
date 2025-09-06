
import { getEncoding } from "js-tiktoken";

function count_characters(texts){
    let total_chars = 0;
    if (typeof texts === 'string') {
        return texts.length;
    }

    for (let i = 0; i < texts.length; i++) {
        total_chars += texts[i].length;
    }
    return total_chars;
}

export function count_tokens_from_text(text){
    const encoder = getEncoding("cl100k_base");
    const encoding = encoder.encode(text);
    return encoding.length;
}

export function count_tokens_from_chat(messages){
    const encoder = getEncoding("cl100k_base");
    let total_tokens = 0;
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i].content;
        const encoding = encoder.encode(message);
        total_tokens += encoding.length;
    }

    return total_tokens;
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


export const model_input_costs = {
    "gpt-4-0125-preview": 3.33,
    "gpt-4-1106-preview": 3.33,
    "gpt-4-1106-vision-preview": 3.33,
    "gpt-4": 10,
    "gpt-4-32k": 20,
    "gpt-3.5-turbo": 0.17,
    "gpt-3.5-turbo-0125": 0.17,
    "gpt-3.5-turbo-instruct": 0.5,
    "claude-3-opus": 5,
    "claude-3-sonnet": 1,
    "claude-3-haiku": 0.08,
    "claude-2.1": 2.67,
    "claude-2.0": 2.67,
    "claude-instant-1.2": 0.27,
    "mixtral-8x7b-32768": 0.09,
    "llama2-70b-4096": 0.23,
    "llama2-7b-2048": 0.03,
    "gemma-7b-it": 0.03,
    "embed-multilingual-light-v3.0": 0.03,
    "whisper-1": 33.33,
    "azure-tts": 5,
    "elevenlabs": 73.33,
    //https://www.together.ai/pricing

    "togetherai_llama3-70b": 0.3,
    "togetherai_mixtral-8x-7b-instruct": 0.2,
    "groq_gemma-7b-it": 0.03,
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

const model_output_costs = { // assuming 30 tokens of output
    "gpt-4-0125-preview": 300,
    "gpt-4-1106-preview": 300,
    "gpt-4-1106-vision-preview": 300,
    "gpt-4": 600,
    "gpt-4-32k": 1200,
    "gpt-3.5-turbo": 15,
    "gpt-3.5-turbo-0125": 15,
    "gpt-3.5-turbo-instruct": 20,
    "claude-3-opus": 750,
    "claude-3-sonnet": 150,
    "claude-3-haiku": 12.6,
    "claude-2.1": 240,
    "claude-2.0": 240,
    "claude-instant-1.2": 24,
    "mixtral-8x7b-32768": 3, // 2.7
    "llama2-70b-4096": 8, // 8.1
    "llama2-7b-2048": 1, // 0.9
    "gemma-7b-it": 1, // 0.9
    

    // cost per token!
    "togetherai_llama3-70b": 0.3,
    "togetherai_mixtral-8x-7b-instruct": 0.2,
    "groq_gemma-7b-it": 0.03,
}



export class TokensTab {
    constructor(){
        this.input_requests = {}; // contains 
        this.output_requests = {}; // contains
        // contains key-value pairs model name: value e.g. {"azure-tts": 10} resulting in 10 characters * 5 tokens/character = 50 tokens
    }
    addInputRequest(model, value){
        if (model in this.input_requests){
            this.input_requests[model] += value;
        } else {
            this.input_requests[model] = value;
        }     
    }

    addOutputRequest(model, value){
        if (model in this.output_requests){
            this.output_requests[model] += value;
        } else {
            this.output_requests[model] = value;
        }     
    }


    calculateTokens(){
        let total_tokens = 0;

        for (let key in this.input_requests){
            total_tokens += this.input_requests[key] * model_input_costs[key];
        }

        for (let key in this.output_requests){
            total_tokens += this.output_requests[key] * model_output_costs[key];
        }

        // round to int
        return Math.ceil(total_tokens);
    }
}




export async function calculateTokens(url, headers, body) {
    // Text Services
    if (url.includes('openai.com/v1/chat/completions')){
        if ('Authorization' in headers) {
            return 1;
        } else {
            headers['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;
 
            if (!(body.model in model_input_costs)){
                return -1; // unsupported model
            }

            if (body.model == "gpt-4-vision-preview"){
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
            return model_input_costs[body.model] * input_tokens + model_output_costs[body.model];
        }
    } else if (url.includes('api.anthropic.com/v1/messages')){
        if ('x-api-key' in headers) {
            return 1;
        } else {
            headers['x-api-key'] = process.env.ANTHROPIC_API_KEY;

            const model = getMatchingModel(body.model);
            if (!model) {
                return -1; // unsupported model
            }

            const input_tokens = count_tokens(body.messages, model);
            return model_input_costs[model] * input_tokens + model_output_costs[model];
        }
    } else if (url.includes('api.groq.com/openai/v1/chat/completions')){
        if ('Authorization' in headers) {
            return 1;
        } else {
            headers['Authorization'] = `Bearer ${process.env.GROQ_API_KEY}`;
 
            if (!(body.model in model_input_costs)){
                return -1; // unsupported model
            }

            const input_tokens = count_tokens(body.messages, body.model);
            return model_input_costs[body.model] * input_tokens + model_output_costs[body.model];
        }
    } 
    
    // Embedding Services
    else if (url.includes('/api.cohere.ai/v1/embed')){
        if ('Authorization' in headers) {
            return 1;
        } else {
            headers['Authorization'] = `Bearer ${process.env.COHERE_API_KEY}`;


            if (!(body.model in model_input_costs)){
                return -1; // unsupported model
            }

            const input_tokens = count_characters(body.texts);
            return model_input_costs[body.model] * input_tokens;
        }
    } 
    
    // Transcription Services
    else if (url.includes('api.openai.com/v1/audio/transcriptions')){
        if ('Authorization' in headers) {
            return 1;
        } else {
            headers['Authorization'] = `Bearer ${process.env.OPEN_AI_API_KEY}`;
            const length = body.length_in_seconds || 5;

            return model_input_costs["whisper-1"] * length;
        }
    } else if (url.includes('4ad6h1tuu9.execute-api.us-east-1.amazonaws.com')){ // screen perception ocr and ram
        if ('x-api-key' in headers) {
            return 1;
        } else {
            headers['x-api-key'] = IAM_API_KEY;
            return 1;
        }
    } else {
        return -1;
    }
}
