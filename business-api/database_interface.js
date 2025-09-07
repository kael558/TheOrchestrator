import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	GetCommand,
	QueryCommand,
	UpdateCommand,
	DeleteCommand,
	PutCommand,
	ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
	CreateTableCommand,
	DeleteTableCommand,
	DescribeTableCommand,
	ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { getConfigurations } from "configurations-sdk";

const dynamoDbClientParams = {};

const isRunningOnLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
if (!isRunningOnLambda) {
	dynamoDbClientParams.region = "us-east-1";
	dynamoDbClientParams.endpoint = "http://localhost:8000";
	dynamoDbClientParams.credentials = {
		accessKeyId: "fakeMyKeyId",
		secretAccessKey: "fakeSecretAccessKey",
	};

	// Set local development environment variables
	process.env.PROJECTS_TABLE_NAME = "projects-table-dev";
	process.env.USAGE_TABLE_NAME = "usage-table-dev";
	process.env.USERS_TABLE_NAME = "users-table-dev";
	process.env.SHARED_TOKEN_SECRET =
		process.env.SHARED_TOKEN_SECRET || "DEFAULT";
}

const client = new DynamoDBClient(dynamoDbClientParams);
const docClient = DynamoDBDocumentClient.from(client);

const PROJECTS_TABLE = process.env.PROJECTS_TABLE_NAME;
const CREATED_BY_INDEX = "createdByUserIdIndex";

export const createProjectsTable = async () => {
	const tableName = PROJECTS_TABLE || "projects-table";

	const createTableParams = {
		TableName: tableName,
		AttributeDefinitions: [
			{
				AttributeName: "projectId",
				AttributeType: "S",
			},
			{
				AttributeName: "createdByUserId",
				AttributeType: "S",
			},
		],
		KeySchema: [
			{
				AttributeName: "projectId",
				KeyType: "HASH",
			},
		],
		BillingMode: "PAY_PER_REQUEST",
		GlobalSecondaryIndexes: [
			{
				IndexName: CREATED_BY_INDEX,
				KeySchema: [
					{
						AttributeName: "createdByUserId",
						KeyType: "HASH",
					},
				],
				Projection: {
					ProjectionType: "ALL",
				},
			},
		],
	};

	try {
		const command = new CreateTableCommand(createTableParams);
		const result = await client.send(command);
		console.log(
			`Projects table '${tableName}' created successfully:`,
			result.TableDescription.TableStatus
		);
		return result;
	} catch (error) {
		if (error.name === "ResourceInUseException") {
			console.log(`Projects table '${tableName}' already exists`);
			return { message: "Table already exists" };
		}
		console.error("Error creating projects table:", error);
		throw error;
	}
};

export const listTables = async () => {
	const command = new ListTablesCommand({});
	const result = await client.send(command);
	return result.TableNames;
};

export const createUsageTable = async () => {
	const tableName = process.env.USAGE_TABLE_NAME;
	const createTableParams = {
		TableName: tableName,
		KeySchema: [
			{
				AttributeName: "PK",
				KeyType: "HASH",
			},
			{
				AttributeName: "SK",
				KeyType: "RANGE",
			},
		],
		AttributeDefinitions: [
			{
				AttributeName: "PK",
				AttributeType: "S",
			},
			{
				AttributeName: "SK",
				AttributeType: "S",
			},
		],
		BillingMode: "PAY_PER_REQUEST",
	};

	try {
		const command = new CreateTableCommand(createTableParams);
		const result = await client.send(command);
		console.log(
			`Usage table '${tableName}' created successfully:`,
			result.TableDescription.TableStatus
		);
		return result;
	} catch (error) {
		if (error.name === "ResourceInUseException") {
			console.log(`Usage table '${tableName}' already exists`);
			return { message: "Table already exists" };
		}
		console.error("Error creating usage table:", error);
		throw error;
	}
};

export const deleteUsersTable = async () => {
	const tableName = process.env.USERS_TABLE_NAME;

	try {
		const command = new DeleteTableCommand({
			TableName: tableName,
		});
		const result = await client.send(command);
		console.log(`Users table '${tableName}' deleted successfully`);

		// Wait for table to be fully deleted
		let tableExists = true;
		while (tableExists) {
			try {
				await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
				// Try to describe table - if it throws an error, table is deleted
				const describeCommand = new DescribeTableCommand({
					TableName: tableName,
				});
				await client.send(describeCommand);
			} catch (error) {
				if (error.name === "ResourceNotFoundException") {
					tableExists = false;
					console.log(`Users table '${tableName}' fully deleted`);
				}
			}
		}

		return result;
	} catch (error) {
		if (error.name === "ResourceNotFoundException") {
			console.log(`Users table '${tableName}' does not exist`);
			return { message: "Table does not exist" };
		}
		console.error("Error deleting users table:", error);
		throw error;
	}
};

export const createUsersTable = async () => {
	const tableName = process.env.USERS_TABLE_NAME;

	// First delete existing table if it exists
	await deleteUsersTable();

	const createTableParams = {
		TableName: tableName,
		KeySchema: [
			{
				AttributeName: "userId",
				KeyType: "HASH",
			},
		],
		AttributeDefinitions: [
			{
				AttributeName: "userId",
				AttributeType: "S",
			},
			{
				AttributeName: "email",
				AttributeType: "S",
			},
		],
		BillingMode: "PAY_PER_REQUEST",
		GlobalSecondaryIndexes: [
			{
				IndexName: "emailIndex",
				KeySchema: [
					{
						AttributeName: "email",
						KeyType: "HASH",
					},
				],
				Projection: {
					ProjectionType: "ALL",
				},
			},
		],
	};

	try {
		const command = new CreateTableCommand(createTableParams);
		const result = await client.send(command);
		console.log(
			`Users table '${tableName}' created successfully:`,
			result.TableDescription.TableStatus
		);
		return result;
	} catch (error) {
		if (error.name === "ResourceInUseException") {
			console.log(`Users table '${tableName}' already exists`);
			return { message: "Table already exists" };
		}
		console.error("Error creating users table:", error);
		throw error;
	}
};

export const createProject = async (userId) => {
	const projectId = uuidv4();
	const timestamp = new Date().toISOString();

	const item = {
		projectId,
		createdByUserId: userId,
		createdAt: timestamp,
		updatedAt: timestamp,
		sharedWithUserEmails: [],

		name: "New Project",
		examples: [],
		inputCodes: getConfigurations(), // { "model": "code" }
		inputSchema: [],
	};

	const command = new PutCommand({
		TableName: PROJECTS_TABLE,
		Item: item,
	});

	await docClient.send(command);
	return item;
};

export const updateProject = async (projectId, projectData) => {
	const timestamp = new Date().toISOString();

	console.log("saving project data");
	console.log(projectData.inputCodes);

	const command = new UpdateCommand({
		TableName: PROJECTS_TABLE,
		Key: { projectId },
		UpdateExpression:
			"SET #name = :name, examples = :examples, inputSchema = :inputSchema, inputCodes = :inputCodes, updatedAt = :updatedAt",
		ExpressionAttributeNames: {
			"#name": "name",
		},
		ExpressionAttributeValues: {
			":name": projectData.name,
			":examples": projectData.examples,
			":inputSchema": projectData.inputSchema,
			":inputCodes": projectData.inputCodes,
			":updatedAt": timestamp,
		},
		ReturnValues: "UPDATED_NEW",
	});

	const result = await docClient.send(command);
	return result.Attributes;
};

export const getProjectById = async (projectId, userId) => {
	const command = new GetCommand({
		TableName: PROJECTS_TABLE,
		Key: { projectId },
	});

	const result = await docClient.send(command);
	return result.Item;
};

export const getProjectsByOwner = async (userId) => {
	const command = new QueryCommand({
		TableName: PROJECTS_TABLE,
		IndexName: CREATED_BY_INDEX,
		KeyConditionExpression: "createdByUserId = :userId",
		ExpressionAttributeValues: {
			":userId": userId,
		},
	});

	const result = await docClient.send(command);
	return result.Items;
};

export const getProjectsSharedWithYou = async (userEmail) => {
	const command = new ScanCommand({
		TableName: PROJECTS_TABLE,
		FilterExpression: "contains(sharedWithUserEmails, :email)",
		ExpressionAttributeValues: {
			":email": userEmail,
		},
	});

	const result = await docClient.send(command);
	return result.Items;
};

export const shareProject = async (projectId, userEmail) => {
	// First, get the current project
	const getCommand = new GetCommand({
		TableName: PROJECTS_TABLE,
		Key: { projectId },
	});

	const { Item: project } = await docClient.send(getCommand);

	if (!project) {
		throw new Error("Project not found");
	}

	// Check if the email is already in the array
	if (!project.sharedWithUserEmails.includes(userEmail)) {
		const updateCommand = new UpdateCommand({
			TableName: PROJECTS_TABLE,
			Key: { projectId },
			UpdateExpression:
				"SET sharedWithUserEmails = list_append(if_not_exists(sharedWithUserEmails, :empty_list), :new_email)",
			ExpressionAttributeValues: {
				":empty_list": [],
				":new_email": [userEmail],
			},
			ReturnValues: "UPDATED_NEW",
		});

		const result = await docClient.send(updateCommand);
		return result;
	} else {
		return { message: "Email already shared with this project" };
	}
};

export const deleteProject = async (projectId) => {
	const command = new DeleteCommand({
		TableName: PROJECTS_TABLE,
		Key: { projectId },
	});

	const result = await docClient.send(command);
	return result;
};

/* THROTTLE MECHANISMS */
export const getUsage = async (userId, modelName) => {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const queryParams = (pk) => ({
		TableName: process.env.USAGE_TABLE_NAME,
		KeyConditionExpression: "PK = :pk AND SK = :sk",
		ExpressionAttributeValues: {
			":pk": pk,
			":sk": `MODEL#${modelName}`,
		},
	});

	const userUsageKey = `USER#${userId}#${startOfMonth.toISOString()}`;
	const globalUsageKey = `GLOBAL#${startOfMonth.toISOString()}`;

	const userUsageCommand = new QueryCommand(queryParams(userUsageKey));
	const userUsageRecords = await docClient.send(userUsageCommand);
	const userUsageMetrics = userUsageRecords.Items[0];

	const globalUsageCommand = new QueryCommand(queryParams(globalUsageKey));
	const globalUsageRecords = await docClient.send(globalUsageCommand);
	const globalUsageMetrics = globalUsageRecords.Items[0];
};

// CLI functionality for running via command line
const runAsCLI = async () => {
	// Check if script is being run directly
	if (process.argv[1].endsWith("database_interface.js")) {
		const command = process.argv[2];

		if (command === "create-table") {
			console.log("Creating projects table...");
			try {
				const result = await createProjectsTable();
				console.log("Operation completed:", result);
			} catch (error) {
				console.error("Failed to create table:", error);
			}
		} else if (command === "create-usage-table") {
			console.log("Creating usage table...");
			try {
				const result = await createUsageTable();
				console.log("Operation completed:", result);
			} catch (error) {
				console.error("Failed to create usage table:", error);
			}
		} else if (command === "create-users-table") {
			console.log("Creating users table...");
			try {
				const result = await createUsersTable();
				console.log("Operation completed:", result);
			} catch (error) {
				console.error("Failed to create users table:", error);
			}
		} else if (command === "list-tables") {
			console.log("Listing tables...");
			try {
				const result = await listTables();
				console.log("Operation completed:", result);
			} catch (error) {
				console.error("Failed to list tables:", error);
			}
		} else {
			console.log("Available commands:");
			console.log(
				"  create-table - Creates the projects table if it doesn't exist"
			);
			console.log(
				"  create-usage-table - Creates the usage table if it doesn't exist"
			);
			console.log(
				"  create-users-table - Deletes and recreates the users table with correct structure"
			);
		}
	}
};

// Run the CLI handler
runAsCLI();
