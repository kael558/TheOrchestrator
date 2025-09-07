const sharedPayloadParams = {
	system_message: {
		description:
			"The system message to be used as instructions and context for the conversation",
		type: "string",
		value: "System instructions and context message",
	},
	messages_with_system: {
		description:
			"The messages to be used as input for the conversation alternating between user and assistant",
		type: "array",
		value: [
			{
				role: "system",
				content:
					"The system message to be used as instructions and context for the conversation",
			},
			{ role: "user", content: "Hello, how are you?" },
		],
	},
	messages_without_system: {
		description:
			"The messages to be used as input for the conversation alternating between user and assistant",
		type: "array",
		value: [{ role: "user", content: "Hello, how are you?" }],
	},
	temperature: {
		type: "number",
		value: 0.7,
		minimum: 0.0,
		maximum: 2.0,
		description:
			"The temperature of the sampling distribution. Lower temperatures make the model more deterministic, and higher temperatures make the model more random.",
	},
	top_k: {
		type: "number",
		value: 1.0,
		minimum: 0.0,
		maximum: 1.0,
		description:
			"The number of highest probability vocabulary tokens to keep for top-k sampling. Higher values make the model more deterministic.",
	},
	top_p: {
		type: "number",
		minimum: 0.0,
		maximum: 1.0,
		value: 1.0,
		description:
			"The cumulative probability of the top tokens to sample from. Lower values make the model more deterministic and higher values make the model more random.",
	},
	presence_penalty: {
		type: "number",
		minimum: -2.0,
		maximum: 2.0,
		value: 0.0,
		description:
			"The penalty for adding tokens that were already in the prompt. Higher values make the model less likely to repeat tokens.",
	},
	frequency_penalty: {
		type: "number",
		minimum: -2.0,
		maximum: 2.0,
		value: 0.0,
		description:
			"The penalty for adding tokens that have appeared frequently in the past. Higher values make the model less likely to use repeated words.",
	},
	response_format: {
		type: "string",
		value: "text",
		description:
			"The format of the response. Can be 'text' or 'json_object'.",
	},
};

const configurations = {};

configurations["Claude 2.1"] = {
	metadata: {
		name: "Claude 2.1",
		provider: "Anthropic",
		developer: "Anthropic",
		description:
			"An updated version of Claude 2 with improved accuracy and consistency",
		cost: {
			input: 8,
			output: 24,
		},
	},
	request: `{
      "url": "https://api.anthropic.com/v1/messages",
      "headers": {
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      "payload": {
        "model": "claude-2.1"
      },
      "keysToResult": [
        "content",
        0,
        "text"
      ]
    }
    `,
	payload_parameters: {
		system_message: sharedPayloadParams["system_message"],
		messages: sharedPayloadParams["messages_without_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		top_k: sharedPayloadParams["top_k"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 2048,
			value: 200,
		},
	},
};

configurations["Claude 3 Haiku"] = {
	metadata: {
		name: "Claude 3 Haiku",
		provider: "Anthropic",
		developer: "Anthropic",
		description:
			"Haiku is the fastest and most cost-effective model for its intelligence category from the Anthropic family of models.",
		cost: {
			input: 0.25,
			output: 1.25,
		},
	},
	request: `{
    "url": "https://api.anthropic.com/v1/messages",
    "headers": {
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    "payload": {
      "model": "claude-3-haiku-20240307"
    },
    "keysToResult": [
        "content",
        0,
        "text"
      ]
  }`,
	payload_parameters: {
		system_message: sharedPayloadParams["system_message"],
		messages: sharedPayloadParams["messages_without_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		top_k: sharedPayloadParams["top_k"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 2048,
			value: 200,
		},
	},
};

configurations["Claude 3 Opus"] = {
	metadata: {
		name: "Claude 3 Opus",
		provider: "Anthropic",
		developer: "Anthropic",
		description:
			"Opus is the most powerful, delivering state-of-the-art performance on complex tasks from the Anthropic family of models.",
		cost: {
			input: 15,
			output: 75,
		},
	},
	request: `{
    "url": "https://api.anthropic.com/v1/messages",
    "headers": {
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    "payload": {
      "model": "claude-3-opus-20240229"
    },
    "keysToResult": [
        "content",
        0,
        "text"
      ]
  }`,
	payload_parameters: {
		system_message: sharedPayloadParams["system_message"],
		messages: sharedPayloadParams["messages_without_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		top_k: sharedPayloadParams["top_k"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 2048,
			value: 200,
		},
	},
};

configurations["Claude 3 Sonnet"] = {
	metadata: {
		name: "Claude 3 Sonnet",
		provider: "Anthropic",
		developer: "Anthropic",
		description:
			"Ideal balance of intelligence and speed for enterprise workloads.",
		cost: {
			input: 3,
			output: 15,
		},
	},
	request: `{
    "url": "https://api.anthropic.com/v1/messages",
    "headers": {
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    "payload": {
      "model": "claude-3-sonnet-20240229"
    },
    "keysToResult": [
        "content",
        0,
        "text"
      ]
  }`,
	payload_parameters: {
		system_message: sharedPayloadParams["system_message"],
		messages: sharedPayloadParams["messages_without_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		top_k: sharedPayloadParams["top_k"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 2048,
			value: 200,
		},
	},
};

configurations["Claude 3.5 Sonnet"] = {
	metadata: {
		name: "Claude 3.5 Sonnet",
		provider: "Anthropic",
		developer: "Anthropic",
		description: "Most intelligent model",
		cost: {
			input: 3,
			output: 15,
		},
	},
	request: `{
    "url": "https://api.anthropic.com/v1/messages",
    "headers": {
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    "payload": {
      "model": "claude-3-5-sonnet-20240620"
    },
    "keysToResult": [
        "content",
        0,
        "text"
      ]
  }`,
	payload_parameters: {
		system_message: sharedPayloadParams["system_message"],
		messages: sharedPayloadParams["messages_without_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		top_k: sharedPayloadParams["top_k"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 2048,
			value: 200,
		},
	},
};

configurations["GPT 3.5 Turbo"] = {
	metadata: {
		name: "GPT 3.5 Turbo",
		provider: "OpenAI",
		developer: "OpenAI",
		description: "A fast and powerful model for generating text",
		cost: {
			input: 0.5,
			output: 1.5,
		},
	},
	request: `{
    "url": "https://api.openai.com/v1/chat/completions",
    "headers": {
      "Content-Type": "application/json"
    },
    "payload": {
      "model": "gpt-3.5-turbo"
    },
    "keysToResult": [
      "choices",
      0,
      "message",
      "content"
    ]
  }`,
	payload_parameters: {
		messages: sharedPayloadParams["messages_with_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],

		presence_penalty: sharedPayloadParams["presence_penalty"],
		frequency_penalty: sharedPayloadParams["frequency_penalty"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 2048,
			value: 200,
		},
	},
};

configurations["GPT4"] = {
	metadata: {
		name: "GPT4",
		provider: "OpenAI",
		developer: "OpenAI",
		description: "A fast and powerful model for generating text",
		cost: {
			input: 30,
			output: 60,
		},
	},
	request: `{
    "url": "https://api.openai.com/v1/chat/completions",
    "method": "POST", 
    "headers": {
        "Content-Type": "application/json"
    },
    "payload": {
        "model": "gpt-4"
    },
    "keysToResult": [
        "choices",
        0,
        "message",
        "content"
    ]
  }`,
	payload_parameters: {
		messages: sharedPayloadParams["messages_with_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		presence_penalty: sharedPayloadParams["presence_penalty"],
		frequency_penalty: sharedPayloadParams["frequency_penalty"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 2048,
			value: 200,
		},
	},
};

// Llama 3.3 70B Versatile configuration
configurations["Llama 3.3 70B Versatile"] = {
	metadata: {
		name: "Llama 3.3 70B Versatile",
		provider: "Groq",
		developer: "Meta",
		description:
			"A versatile model with a large context window for complex tasks.",
		cost: { input: 0.59, output: 0.79 },
		tokensPerSeconds: "250",
	},
	request: `{
    "url": "https://api.groq.com/openai/v1/chat/completions",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "payload": {
      "model": "llama-3.3-70b-versatile"
    },
    "keysToResult": ["choices", 0, "message", "content"]
  }`,
	payload_parameters: {
		messages: sharedPayloadParams["messages_with_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		frequency_penalty: sharedPayloadParams["frequency_penalty"],
		presence_penalty: sharedPayloadParams["presence_penalty"],
		response_format: sharedPayloadParams["response_format"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 8192,
			value: 200,
		},
	},
};

configurations["Llama3-70b"] = {
	metadata: {
		name: "Llama3-70b",
		provider: "Groq",
		developer: "Meta",
		description: "An extremely fast and powerful model for generating text",
		cost: {
			input: 0.59,
			output: 0.79,
		},
	},
	request: `{
    "url": "https://api.groq.com/openai/v1/chat/completions",
    "method": "POST", 
    "headers": {
        "Content-Type": "application/json"
    },
    "payload": {
        "model": "llama3-70b-8192"
    },
    "keysToResult": [
        "choices",
        0,
        "message",
        "content"
    ]
  }`,
	payload_parameters: {
		messages: sharedPayloadParams["messages_with_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		frequency_penalty: sharedPayloadParams["frequency_penalty"],
		presence_penalty: sharedPayloadParams["presence_penalty"],
		response_format: sharedPayloadParams["response_format"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 8192,
			value: 200,
		},
	},
};

configurations["Gemma 2 9B"] = {
	metadata: {
		name: "Gemma 2 9B",
		provider: "Groq",
		developer: "Google",
		description: "An extremely fast and powerful model for generating text",
		cost: {
			input: 0.2,
			output: 0.2,
		},
	},
	request: `{
    "url": "https://api.groq.com/openai/v1/chat/completions",
    "method": "POST", 
    "headers": {
        "Content-Type": "application/json"
    },
    "payload": {
        "model": "gemma2-9b-it"
    },
    "keysToResult": [
        "choices",
        0,
        "message",
        "content"
    ]
  }`,
	payload_parameters: {
		messages: sharedPayloadParams["messages_with_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		frequency_penalty: sharedPayloadParams["frequency_penalty"],
		presence_penalty: sharedPayloadParams["presence_penalty"],
		response_format: sharedPayloadParams["response_format"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 8192,
			value: 200,
		},
	},
};

configurations["Llama 3.3 8B Instant"] = {
	metadata: {
		name: "Llama 3.3 8B Instant",
		provider: "Groq",
		developer: "Meta",
		description: "An instant response model ideal for quick interactions.",
		cost: { input: 0.05, output: 0.08 },
		tokensPerSeconds: "750",
	},
	request: `{
    "url": "https://api.groq.com/openai/v1/chat/completions",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "payload": {
      "model": "llama-3.3-8b-instant"
    },
    "keysToResult": ["choices", 0, "message", "content"]
  }`,
	payload_parameters: {
		messages: sharedPayloadParams["messages_with_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		frequency_penalty: sharedPayloadParams["frequency_penalty"],
		presence_penalty: sharedPayloadParams["presence_penalty"],
		response_format: sharedPayloadParams["response_format"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 8192,
			value: 200,
		},
	},
};

// Gemma 7B configuration
configurations["Gemma 7B"] = {
	metadata: {
		name: "Gemma 7B",
		provider: "Groq",
		developer: "Google",
		description:
			"A smaller but efficient model for generating quick and coherent text.",
		cost: { input: 0.07, output: 0.07 },
		tokensPerSeconds: "950",
	},
	request: `{
    "url": "https://api.google.com/openai/v1/chat/completions",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "payload": {
      "model": "gemma-7b-it"
    },
    "keysToResult": ["choices", 0, "message", "content"]
  }`,
	payload_parameters: {
		messages: sharedPayloadParams["messages_with_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		frequency_penalty: sharedPayloadParams["frequency_penalty"],
		presence_penalty: sharedPayloadParams["presence_penalty"],
		response_format: sharedPayloadParams["response_format"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 8192,
			value: 200,
		},
	},
};

// Mixtral 8x7B configuration
configurations["Mixtral 8x7B"] = {
	metadata: {
		name: "Mixtral 8x7B",
		provider: "Groq",
		developer: "Mistral",
		description:
			"An instruct model with a large context window for detailed outputs.",
		cost: { input: 0.24, output: 0.24 },
		tokensPerSeconds: "575",
	},
	request: `{
    "url": "https://api.mistral.com/openai/v1/chat/completions",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "payload": {
      "model": "mixtral-8x7b-32768"
    },
    "keysToResult": ["choices", 0, "message", "content"]
  }`,
	payload_parameters: {
		messages: sharedPayloadParams["messages_with_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		frequency_penalty: sharedPayloadParams["frequency_penalty"],
		presence_penalty: sharedPayloadParams["presence_penalty"],
		response_format: sharedPayloadParams["response_format"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 8192,
			value: 200,
		},
	},
};

// Llama Guard 3 8B configuration
configurations["Llama Guard 3 8B"] = {
	metadata: {
		name: "Llama Guard 3 8B",
		provider: "Groq",
		developer: "Meta",
		description:
			"A secure and reliable model designed for guard-rail purposes.",
		cost: { input: 0.2, output: 0.2 },
		tokensPerSeconds: "765",
	},
	request: `{
    "url": "https://api.groq.com/openai/v1/chat/completions",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "payload": {
      "model": "llama-guard-3-8b"
    },
    "keysToResult": ["choices", 0, "message", "content"]
  }`,
	payload_parameters: {
		messages: sharedPayloadParams["messages_with_system"],
		temperature: sharedPayloadParams["temperature"],
		top_p: sharedPayloadParams["top_p"],
		frequency_penalty: sharedPayloadParams["frequency_penalty"],
		presence_penalty: sharedPayloadParams["presence_penalty"],
		response_format: sharedPayloadParams["response_format"],
		max_tokens: {
			description:
				"The maximum number of tokens to generate in the response",
			type: "number",
			minimum: 1,
			maximum: 8192,
			value: 200,
		},
	},
};

export default configurations;
