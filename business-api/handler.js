import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { authMiddleware } from "auth-sdk";
import {
	createProject,
	deleteProject,
	getProjectById,
	getProjectsByOwner,
	getProjectsSharedWithYou,
	shareProject,
	updateProject,
} from "./database_interface.js";
import { metadata } from "configurations-sdk";

// Import configurations for the optimize prompt functionality
import configurations from "./configurations/configurations_data.js";

const app = express();

/**
 * Generates optimized input code using a language model based on project examples and configuration
 */
const optimizePrompt = async (project, selectedConfig) => {
	// Get the configuration metadata
	const configMeta = configurations[selectedConfig];
	if (!configMeta) {
		throw new Error(`Configuration ${selectedConfig} not found`);
	}

	// Extract examples data
	const examples = project.examples || [];
	const inputSchema = project.inputSchema || [];

	// Build examples analysis
	const exampleAnalysis = examples
		.map((example, index) => {
			const result = example[selectedConfig];
			return {
				index,
				input: example.input,
				expectedOutput: example.expectedOutput,
				outputDescription: example.outputDescription,
				actualOutput: result?.parsedOutput,
				rawOutput: result?.output,
				error: result?.error,
				status: result?.status,
				comments: example.comments || [],
			};
		})
		.filter(
			(ex) => ex.actualOutput || ex.expectedOutput || ex.outputDescription
		); // Include examples with any useful data

	// Get configuration details
	const apiUrl = configMeta.request
		? JSON.parse(configMeta.request).url
		: "https://api.openai.com/v1/chat/completions";
	const model = configMeta.request
		? JSON.parse(configMeta.request).payload?.model || "gpt-3.5-turbo"
		: "gpt-3.5-turbo";

	// Determine API type
	const isAnthropic = apiUrl.includes("anthropic.com");
	const isGroq = apiUrl.includes("groq.com");

	// Create system message for the LLM to generate the code
	const systemMessage = `You are an expert JavaScript developer. Generate input code for an API testing system based on the provided examples and configuration.

REQUIREMENTS:
1. Generate a complete JavaScript code that includes three functions: chat, parser, and fn
2. The chat function should make a call to the API endpoint
3. The parser function should parse the response from the chat function  
4. The fn function should always be the main function with input fields as arguments and should have the system message, chat and parser function calls
5. The resultant code should be executable and handle the specific API format

CONFIGURATION:
- API URL: ${apiUrl}
- Model: ${model}
- API Type: ${isAnthropic ? "Anthropic" : isGroq ? "Groq" : "OpenAI-compatible"}
- Input Parameters: ${inputSchema.map((field) => field.name).join(", ")}

EXAMPLES DATA:
${exampleAnalysis
	.map(
		(ex, i) => `
Example ${i + 1}:
- Input: ${JSON.stringify(ex.input)}
- Expected Output: ${ex.expectedOutput || "Not specified"}
- Output Description: ${ex.outputDescription || "Not specified"}
- Actual Output: ${
			ex.actualOutput ? JSON.stringify(ex.actualOutput) : "Not available"
		}
- Comments: ${ex.comments.length > 0 ? ex.comments.join("; ") : "None"}
- Status: ${ex.status || "unknown"}
`
	)
	.join("")}

Generate the complete JavaScript code following this structure:

async function chat(messages, model = "${model}", json_mode = false) {
	// Implementation for ${
		isAnthropic ? "Anthropic" : isGroq ? "Groq" : "OpenAI"
	} API
}

function parser(content) {
	// Implementation to parse the API response
}

async function fn(${inputSchema.map((field) => field.name).join(", ")}) {
	// Main function implementation with system message based on examples
	// Should use the chat function and parser function
	// Should have retry logic and error handling
}

Make sure the generated code:
- Handles the specific API format correctly
- Includes appropriate system messages based on the examples
- Has proper error handling and retry logic
- Returns {result, response} on success or {response, error} on failure
- Uses the correct API endpoints and headers
- Uses fetch instead of axios
- Don't include the API key and Authorization header in the code`;

	// Call Claude 3.5 Sonnet to generate the code
	try {
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"anthropic-version": "2023-06-01",
				"x-api-key": process.env.ANTHROPIC_API_KEY,
			},
			body: JSON.stringify({
				model: "claude-3-5-sonnet-20240620",
				max_tokens: 4000,
				messages: [
					{
						role: "user",
						content: systemMessage,
					},
				],
			}),
		});

		if (!response.ok) {
			throw new Error(`Anthropic API error: ${response.status}`);
		}

		const data = await response.json();
		const generatedCode = data.content[0].text;

		// Extract code from markdown if present
		const codeMatch = generatedCode.match(
			/```(?:javascript|js)?\n?([\s\S]*?)\n?```/
		);
		const finalCode = codeMatch
			? codeMatch[1].trim()
			: generatedCode.trim();

		return { inputCode: finalCode };
	} catch (error) {
		console.error("Error generating optimized prompt:", error);
		throw new Error("Failed to generate optimized code: " + error.message);
	}
};

/**
 * Add the JSON body parser middleware to Express.js, and CORS middleware to
 * allow cross-origin requests from the browser.
 */
app.use(cors());
app.use(express.json());

/**
 * Adds the authentication middleware from the auth-sdk. This middleware
 * validates the JWT token in the Authorization header of the incoming request
 * and throws a UnauthorizedError if the token is invalid.
 */
app.use(authMiddleware());

// Create a new project
app.post("/projects", async (req, res) => {
	try {
		const userId = req.auth.userId;
		const newProject = await createProject(userId);
		res.status(201).json(newProject);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to create project" });
	}
});

// Get projects by owner
app.get("/projects/owner", async (req, res) => {
	try {
		const userId = req.auth.userId;
		const projects = await getProjectsByOwner(userId);
		res.json(projects);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to retrieve projects" });
	}
});

// Get projects shared with the user
app.get("/projects/shared", async (req, res) => {
	try {
		const userEmail = req.auth.email;
		const projects = await getProjectsSharedWithYou(userEmail);
		res.json(projects);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to retrieve shared projects" });
	}
});

// Get a project by ID
app.get("/projects/:projectId", async (req, res) => {
	try {
		const { projectId } = req.params;
		const userId = req.auth.userId;
		const project = await getProjectById(projectId, userId);
		if (!project) {
			return res.status(404).json({ error: "Project not found" });
		}

		// add metadata to the project
		project.metadata = metadata;

		res.json(project);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to retrieve project" });
	}
});

// Share a project
app.post("/projects/:projectId/share", async (req, res) => {
	try {
		const { projectId } = req.params;
		const { userEmail } = req.body;
		const result = await shareProject(projectId, userEmail);
		res.json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to share project" });
	}
});

// Delete a project
app.delete("/projects/:projectId", async (req, res) => {
	try {
		const { projectId } = req.params;
		await deleteProject(projectId);
		res.status(204).send();
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to delete project" });
	}
});

// Update a project
app.put("/projects/:projectId", async (req, res) => {
	try {
		const { projectId } = req.params;
		const projectData = req.body;
		const updatedProject = await updateProject(projectId, projectData);
		res.json(updatedProject);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to update project" });
	}
});

// Optimize prompt
app.post("/projects/:projectId/optimize-prompt", async (req, res) => {
	try {
		const { projectId } = req.params;
		const { selectedConfig } = req.body;
		const userId = req.auth.userId;

		// get project
		const project = await getProjectById(projectId, userId);

		const optimizedPrompt = await optimizePrompt(project, selectedConfig);
		res.json(optimizedPrompt);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to optimize prompt" });
	}
});

app.use((req, res, next) => {
	return res.status(404).json({
		error: "Not Found",
	});
});

app.use((err, req, res, next) => {
	console.error(err);
	if (err.name === "UnauthorizedError") {
		return res.status(401).json({ error: "Invalid token value" });
	} else {
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

/*
app.listen(3000, () => {
	console.log(
		"Server is running on port 3000. Localhost: http://localhost:3000"
	);
});*/

export const handler = serverless(app);
