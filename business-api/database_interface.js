import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';
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

	process.env.PROJECTS_TABLE_NAME = "projects-table-dev";
	process.env.USAGE_TABLE_NAME = "usage-table-dev";
	process.env.USERS_TABLE_NAME = "users-table-dev";
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
				AttributeType: "S"
			},
			{
				AttributeName: "createdByUserId", 
				AttributeType: "S"
			}
		],
		KeySchema: [
			{
				AttributeName: "projectId",
				KeyType: "HASH"
			}
		],
		BillingMode: "PAY_PER_REQUEST",
		GlobalSecondaryIndexes: [
			{
				IndexName: CREATED_BY_INDEX,
				KeySchema: [
					{
						AttributeName: "createdByUserId",
						KeyType: "HASH"
					}
				],
				Projection: {
					ProjectionType: "ALL"
				}
			}
		]
	};

	try {
		const command = new CreateTableCommand(createTableParams);
		const result = await client.send(command);
		console.log(`Projects table '${tableName}' created successfully:`, result.TableDescription.TableStatus);
		return result;
	} catch (error) {
		if (error.name === 'ResourceInUseException') {
			console.log(`Projects table '${tableName}' already exists`);
			return { message: "Table already exists" };
		}
		console.error("Error creating projects table:", error);
		throw error;
	}
};

export const createUsageTable = async () => {
	const tableName = process.env.USAGE_TABLE_NAME;
	const createTableParams = {
		TableName: tableName,
		KeySchema: [
			{
				AttributeName: "PK",
				KeyType: "HASH"
			},
			{
				AttributeName: "SK",
				KeyType: "RANGE"
			}
		],
		AttributeDefinitions: [
			{
				AttributeName: "PK",
				AttributeType: "S"
			},
			{
				AttributeName: "SK",
				AttributeType: "S"
			}
		],
		BillingMode: "PAY_PER_REQUEST"
	};

	try {
		const command = new CreateTableCommand(createTableParams);
		const result = await client.send(command);
		console.log(`Usage table '${tableName}' created successfully:`, result.TableDescription.TableStatus);
		return result;
	} catch (error) {
		if (error.name === 'ResourceInUseException') {
			console.log(`Usage table '${tableName}' already exists`);
			return { message: "Table already exists" };
		}
		console.error("Error creating usage table:", error);
		throw error;
	}
};

export const createUsersTable = async () => {
	const tableName = process.env.USERS_TABLE_NAME;
	const createTableParams = {
		TableName: tableName,
		KeySchema: [
			{
				AttributeName: "PK",
				KeyType: "HASH"
			},
			{
				AttributeName: "SK",
				KeyType: "RANGE"
			}
		],
		AttributeDefinitions: [
			{
				AttributeName: "PK",
				AttributeType: "S"
			},
			{
				AttributeName: "SK",
				AttributeType: "S"
			}
		],
		BillingMode: "PAY_PER_REQUEST"
	};

	try {
		const command = new CreateTableCommand(createTableParams);
		const result = await client.send(command);
		console.log(`Users table '${tableName}' created successfully:`, result.TableDescription.TableStatus);
		return result;
	} catch (error) {
		if (error.name === 'ResourceInUseException') {
			console.log(`Users table '${tableName}' already exists`);
			return { message: "Table already exists" };
		}
		console.error("Error creating users table:", error);
		throw error;
	}
};

//createUsageTable();

//createUsersTable();

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
		inputSchema: []
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
		UpdateExpression: "SET #name = :name, examples = :examples, inputSchema = :inputSchema, inputCodes = :inputCodes, updatedAt = :updatedAt",
		ExpressionAttributeNames: {
			"#name": "name"
		},
		ExpressionAttributeValues: {
			":name": projectData.name,
			":examples": projectData.examples,
			":inputSchema": projectData.inputSchema,
			":inputCodes": projectData.inputCodes,
			":updatedAt": timestamp
		},
		ReturnValues: "UPDATED_NEW"
	});

	const result = await docClient.send(command);
	return result.Attributes;
};

export const getProjectById = async (projectId, userId) => {
	const command = new GetCommand({
		TableName: PROJECTS_TABLE,
		Key: { projectId }
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
			":userId": userId
		}
	});

	const result = await docClient.send(command);
	return result.Items;
};


export const getProjectsSharedWithYou = async (userEmail) => {
	const command = new ScanCommand({
		TableName: PROJECTS_TABLE,
		FilterExpression: "contains(sharedWithUserEmails, :email)",
		ExpressionAttributeValues: {
			":email": userEmail
		}
	});

	const result = await docClient.send(command);
	return result.Items;
};

export const shareProject = async (projectId, userEmail) => {
	// First, get the current project
	const getCommand = new GetCommand({
		TableName: PROJECTS_TABLE,
		Key: { projectId }
	});

	const { Item: project } = await docClient.send(getCommand);

	if (!project) {
		throw new Error('Project not found');
	}

	// Check if the email is already in the array
	if (!project.sharedWithUserEmails.includes(userEmail)) {
		const updateCommand = new UpdateCommand({
			TableName: PROJECTS_TABLE,
			Key: { projectId },
			UpdateExpression: "SET sharedWithUserEmails = list_append(if_not_exists(sharedWithUserEmails, :empty_list), :new_email)",
			ExpressionAttributeValues: {
				":empty_list": [],
				":new_email": [userEmail]
			},
			ReturnValues: "UPDATED_NEW"
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
		Key: { projectId }
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
	const globalUsageRecords = await docClient.send(
		globalUsageCommand
	);
	const globalUsageMetrics = globalUsageRecords.Items[0];
}
