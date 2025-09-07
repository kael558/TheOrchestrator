import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	QueryCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { compileRequest } from "configurations-sdk";
import {
	postRequest,
	streamPostRequest,
	addAuthorizationAndCountInputTokens,
} from "./requests_handler.js";
import { TokensTab } from "./tokenCalculator.js";

import { Auth, authMiddleware } from "auth-sdk";
import serverless from "serverless-http";
import express from "express";
import cors from "cors";

const app = express();

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

/**
 * A small utility to easily capture the status codes in the error handlers.
 */
class HTTPError extends Error {
	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
	}
}

/**
 * Initialize the AWS SDK Dynamo Doc Client.
 */
const USAGE_TABLE_NAME = process.env.USAGE_TABLE_NAME || "usage-table-dev";
const dynamoDbClient = new DynamoDBClient();
const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

/**
 * Defines the zod schema for the input payload to pass on to AWS Bedrock's
 * model. This is passed to the ConverseStreamCommand as a part of the user
 * input.
 */
const inputSchema = z.object({
	parameters: z.record(z.any()),
	inputs: z.any(),
});

async function checkUsageAndThrottle(userId, modelId = "fixed") {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const queryParams = (pk) => ({
		TableName: USAGE_TABLE_NAME,
		KeyConditionExpression: "PK = :pk AND SK = :sk",
		ExpressionAttributeValues: {
			":pk": pk,
			":sk": `MODEL#${modelId}`,
		},
	});

	const userUsageKey = `USER#${userId}#${startOfMonth.toISOString()}`;
	const globalUsageKey = `GLOBAL#${startOfMonth.toISOString()}`;

	const userUsageCommand = new QueryCommand(queryParams(userUsageKey));
	const userUsageRecords = await dynamoDbDocClient.send(userUsageCommand);
	const userUsageMetrics = userUsageRecords.Items[0];

	const globalUsageCommand = new QueryCommand(queryParams(globalUsageKey));
	const globalUsageRecords = await dynamoDbDocClient.send(globalUsageCommand);
	const globalUsageMetrics = globalUsageRecords.Items[0];

	if (
		userUsageMetrics?.invocationCount >=
			process.env.THROTTLE_MONTHLY_LIMIT_USER ||
		globalUsageMetrics?.invocationCount >=
			process.env.THROTTLE_MONTHLY_LIMIT_GLOBAL
	) {
		throw new HTTPError(
			429,
			`User has exceeded the user or global monthly usage limit`
		);
	}
}

async function updateUsage(userId, modelId, inputTokens, outputTokens) {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const updateParams = (pk) => ({
		TableName: USAGE_TABLE_NAME,
		Key: {
			PK: pk,
			SK: `MODEL#${modelId}`,
		},
		UpdateExpression:
			"ADD invocationCount :inc, inputTokens :in, outputTokens :out, totalTokens :tot",
		ExpressionAttributeValues: {
			":inc": 1,
			":in": inputTokens,
			":out": outputTokens,
			":tot": inputTokens + outputTokens,
		},
	});

	const userUsageKey = `USER#${userId}#${startOfMonth.toISOString()}`;
	const globalUsageKey = `GLOBAL#${startOfMonth.toISOString()}`;

	const userUsageUpdateCommand = new UpdateCommand(
		updateParams(userUsageKey)
	);
	const globalUsageUpdateCommand = new UpdateCommand(
		updateParams(globalUsageKey)
	);

	await dynamoDbDocClient.send(userUsageUpdateCommand);
	await dynamoDbDocClient.send(globalUsageUpdateCommand);
}

/**
 * The awslambda.streamifyResponse is a utility provided in the lambda runtime
 * to stream the response. Unfortunately this utility is not available
 * externally at the moment, therefore this method can't be run locally using
 * Serverless Dev mode.
 */
/*
export const handler = awslambda.streamifyResponse(
	async (event, responseStream, context) => {

		const updateStream = ({ statusCode } = {}) => {
			const httpResponseMetadata = {
				statusCode: statusCode || 200,
				headers: {
					"Content-Type": "application/json",
				},
			};
			responseStream = awslambda.HttpResponseStream.from(
				responseStream,
				httpResponseMetadata
			);
		};

		try {
			const authenticator = new Auth({
				secret: process.env.SHARED_TOKEN_SECRET,
			});

			const requestTokenHeader =
				event.headers.Authorization || event.headers.authorization;
			const [authSchema, authorizationParameter] = (
				requestTokenHeader || ""
			).split(" ");

			if (
				!requestTokenHeader ||
				authSchema !== "Bearer" ||
				!authorizationParameter
			) {
				throw new HTTPError(
					403,
					"Missing bearer token in Authorization header"
				);
			}

			const token = authenticator.verify(authorizationParameter);
			if (!token) {
				throw new HTTPError(403, "Invalid token");
			}

			const { userId } = token;

			const { modelName } = event.pathParameters;
			let { parameters, inputs } = JSON.parse(event.body);

			try {
				inputSchema.parse({ parameters, inputs });
			} catch (e) {
				const issuePath = e.issues[0].path.join(".");
				const issueMessage = e.issues[0].message;
				const errorMessage = `Invalid value at '${issuePath}': ${issueMessage}`;
				throw new HTTPError(400, errorMessage);
			}

			await checkUsageAndThrottle(userId, modelName);

			updateStream();

			const { url, headers, payload, keysToResult } = compileRequest(
				modelName,
				parameters,
				inputs
			);
			const inputTokens = addAuthorizationAndCountInputTokens(
				url,
				headers,
				payload
			);

			const tokensTab = new TokensTab();
			tokensTab.addInputRequest(modelName, inputTokens);

			const requestStream = await streamPostRequest(
				url,
				headers,
				payload
			);

			let outputTokens = 0;
			for await (const chunk of requestStream) {
				let result = JSON.parse(chunk);
				for (let key of keysToResult) {
					result = result[key];
				}

				responseStream.write(result);
				outputTokens += result.length;
			}

			tokensTab.addOutputRequest(modelName, outputTokens);

			await updateUsage(userId, modelName, inputTokens, outputTokens);
		} catch (error) {
			console.error(event);
			console.error(error);
			if (error instanceof HTTPError) {
				updateStream({ statusCode: error.statusCode });
				responseStream.write(JSON.stringify({ error: error.message }));
			} else {
				updateStream({ statusCode: 500 });
				responseStream.write(
					JSON.stringify({ error: "Internal Error" })
				);
			}
		} finally {
			responseStream.end();
		}
	}
);
*/

// Given model name, parameters & inputs, return the model output
app.post("/proxy", async (req, res) => {
	try {
		const { url, options } = req.body;
		const userId = req.auth.userId;

		//await checkUsageAndThrottle(userId);

		// Get the url, headers, payload from configurations
		//const { url, headers, payload, keysToResult } = compileRequest(modelName, parameters);

		const { headers, body } = options;

		// Add auth to headers
		const inputTokens = addAuthorizationAndCountInputTokens(
			url,
			headers,
			body
		);

		// Calculate tokens
		//const tokensTab = new TokensTab();
		//tokensTab.addInputRequest(modelName, inputTokens);

		// Call the model execution code here
		const [responseData, status] = await postRequest(url, headers, body);

		// Return the response from the external server back to the client
		if (status !== 200) {
			return res.status(status).json({ error: responseData });
		}

		return res.status(status).json(responseData);

		/*if (status !== 200) {
      console.error(response);
      return res.status(status).json({ error: response });
    }

    res.json(result);

    // Extract the result from the response
    let result = response;
    for (let key of keysToResult) {
      result = result[key];
    }

    // Calculate output tokens
    const outputTokens = result.length;
    tokensTab.addOutputRequest(modelName, outputTokens);

    await updateUsage(userId, modelName, inputTokens, outputTokens);

    res.json(result);*/
	} catch (error) {
		console.error(error);

		if (error instanceof HTTPError && error.status === 429) {
			return res.status(429).json({ error: error.message });
		}

		res.status(500).json({ error });
	}
});

/*
import dotenv from "dotenv";
dotenv.config();

app.listen(3200, () => {
	console.log(
		"Server is running on port 3200. Localhost: http://localhost:3200"
	);
});*/

export const request_handler = serverless(app);
