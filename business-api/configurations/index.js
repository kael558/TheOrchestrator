import Handlebars from 'handlebars';
import configurationData from './configurations_data.js';


// register helpers
Handlebars.registerHelper('jsonify', function (context) {
  return JSON.stringify(context, null, 2);
});

function compileRequests() {
  Object.entries(configurationData).forEach(([key, value]) => {
    const template = Handlebars.compile(value.request);
    configurationData.template = template;
  });
}

function getConfigurations() {
	const inputCodes = [];
	Object.entries(configurationData).forEach(([key, value]) => {
		const obj = {
			"name": key,
			"model": key,
			"inputCode": ""
		}
		inputCodes.push(obj);
	});
	return inputCodes;
}


function getPayloadParams() {
  const payloadParams = [];
  Object.entries(configurationData).forEach(([key, value]) => {
    const obj = {
      "name": key,
      "model": key,
      "parameters": value.payload_parameters
    }
    payloadParams.push(obj);
  });
  return payloadParams;
}

function compileRequest(name, parameters) {
  if (!configurationData[name]) {
    console.error(`Configuration ${name} does not exist`);
    return;
  }


  const config = configurationData[name];
  const template = Handlebars.compile(config.request);
  let compiledContent = template(parameters);


  try {
    // replace new lines in quotes with escaped new lines
    compiledContent = compiledContent.replace(/"[^"]*"/g, function (match) {
      return match.replace(/\n/g, '\\n');
    });

    const jsonContent = JSON.parse(compiledContent);
    return jsonContent;
  } catch (error) {
    console.error(error);
    console.log(compiledContent);
    throw new Error(`Failed to parse JSON content for ${name}`);
  }
}


function getMetadata() {
  const metadata = {};
  Object.entries(configurationData).forEach(([key, value]) => {
    metadata[key] = value.metadata;
  });
  return metadata;
}

const configs = getConfigurations();
const metadata = getMetadata();

//compileRequests(); // put the template into memory

/*
const parameters = {
	"top_p": {
		"maximum": 1,
		"description": "The cumulative probability of the top tokens to sample from. Lower values make the model more deterministic and higher values make the model more random.",
		"type": "number",
		"minimum": 0,
		"value": 1
	},
	"frequency_penalty": {
		"maximum": 2,
		"description": "The penalty for adding tokens that have appeared frequently in the past. Higher values make the model less likely to use repeated words.",
		"type": "number",
		"minimum": -2,
		"value": 0
	},
	"response_format": {
		"type": "string",
		"value": "text",
		"description": "The format of the response. Can be 'text' or 'json_object'."
	},
	"max_tokens": {
		"description": "The maximum number of tokens to generate in the response",
		"maximum": 8192,
		"type": "number",
		"minimum": 1,
		"value": 200
	},
	"presence_penalty": {
		"maximum": 2,
		"description": "The penalty for adding tokens that were already in the prompt. Higher values make the model less likely to repeat tokens.",
		"type": "number",
		"minimum": -2,
		"value": 0
	},
	"temperature": {
		"maximum": 2,
		"description": "The temperature of the sampling distribution. Lower temperatures make the model more deterministic, and higher temperatures make the model more random.",
		"type": "number",
		"value": 0.7,
		"minimum": 0
	},
	"messages": {
		"type": "array",
		"description": "The messages to be used as input for the conversation alternating between user and assistant",
		"value": "[\n  {\n    \"content\": \"# INSTRUCTIONS\\nYou are tasked with creating a roleplay scenario related to the given interest and role. The scenario should include a main task and any contextual information.\\n\\nThe content should be generated based on the CLB (Canadian Language Benchmark) scores provided. The task should be appropriate for the given scores and should provide a suitable challenge for the learner.\\n\\n## CLB Scores\\n- {{ inputMode }}: {{ inputScore }}\\n- {{ outputMode }}: {{ outputScore }}\\n\\n## Format:\\nReasoning:\\nSince the user's CLB scores are [scores] and they are interested in... (reason about a suitable scenario based on the scores & interests/role).\\n\\n\\n\\`\\`\\`\\n{\\n  \\\"Name\\\": \\\"Roleplay Scenario\\\",\\n  \\\"Task\\\": \\\"Main task description\\\",\\n  \\\"<1,2..n>\\\": \"Any additional context for the task\\\",\\n \\\"Scenario\\\": \\\"Contextual information or scenario details including the scene, medium of conversation, and participants\\\",\\n  \\\"Language Model Roleplay Instructions\\\": \\\"Instructions for how the language model should respond in the scenario\\\",\\n  \\\"First Message\\\": \\\"Initial message to set the scene or context from the language model\\\"\\n}\\n\\`\\`\\`\\n\\n### Important:\\n- The entire content should be wrapped in \\`\\`\\`.\\n- The format must be valid JSON.\\n- The scenario MUST be related to the interest and role provided.\\n- The scenario should be appropriate for the given CLB scores.\\n- The context can include additional numbered properties that may wrap text (e.g. [text](1)) in the Task or Scenario.\\n- The scenario should be realistic and real-world oriented that a person may encounter in daily life or work.\\n\\n## INTEREST\\n- {{ interest }}\\n\\n## ROLE\\n- {{ role }}\\n\\n# Example:\\nReasoning:\\nSince the user's CLB scores are Writing: 5, Speaking: 4, Reading: 6, Listening: 5, and they are interested in local attractions, so the task could be a roleplay scenario that involves chatting with a friend and planning a day trip to Mer Bleue Bog.\\n\\n\\`\\`\\`\\n{\\n  \\\"Name\\\": \\\"Mer Bleue Bog Trip Planning\\\",\\n  \\\"Task\\\": \\\"Plan a day trip to [Mer Bleue Bog](1)\\\",\\n  \\\"1\\\": \\\"Mer Bleue Bog is a conservation area in Ottawa known for its unique ecosystem.\\\",\\n  \\\"Scenario\\\": \"You are chatting with a friend in-person.\\\",\\n  \\\"Language Model Roleplay Instructions\\\": \\\"Please act as the friend\\\",\\n  \\\"First Message\\\": \\\"Hey I heard you wanted to visit Mer Bleue Bog. What's the plan?\\\"\\n}\\n\\`\\`\\`\",\n    \"role\": \"system\"\n  }\n]"
	}
}

const inputs = {
	"outputScore": "4",
	"role": "Software Engineer",
	"outputMode": "Listening",
	"interest": "Rock climbing",
	"inputScore": "3",
	"inputMode": "Speaking"
}


const { url, headers, payload, keysToResult } = compileRequest("Llama3-70b", parameters, inputs);

console.log(url);
console.log(headers);
console.log(payload);
console.log(keysToResult);*/

export { configs, compileRequest, metadata, getConfigurations };