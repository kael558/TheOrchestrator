import {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { prompts } from "./api_tester.js";

// If not AWS Lambda, use dotenv to load environment variables
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
	dotenv.config();
}

// ---------------------
// CONFIG
// ---------------------
const s3 = new S3Client({ region: process.env.AWS_REGION });
const bucket = process.env.S3_BUCKET;
const key = process.env.S3_KEY || "monitor_data.csv";

/**
 * Loads existing monitoring data from S3
 */
async function loadExistingData() {
	try {
		const response = await s3.send(
			new GetObjectCommand({ Bucket: bucket, Key: key })
		);
		const csvContent = await response.Body.transformToString();
		return parse(csvContent, {
			columns: true,
			skip_empty_lines: true,
		});
	} catch (error) {
		if (
			error.name === "NoSuchKey" ||
			error.Code === "NoSuchKey" ||
			error.$metadata?.httpStatusCode === 404
		) {
			console.log("No existing data found");
			return [];
		}
		throw new Error(`Failed to load existing data: ${error.message}`);
	}
}

/**
 * Makes a request to OpenAI API for pattern analysis
 */
async function analyzeWithLLM(systemPrompt, userPrompt) {
	try {
		const response = await fetch(
			"https://api.openai.com/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				},
				body: JSON.stringify({
					model: "gpt-4o-mini",
					messages: [
						{
							role: "system",
							content: systemPrompt,
						},
						{
							role: "user",
							content: userPrompt,
						},
					],
					temperature: 0.1, // Low temperature for consistent analysis
				}),
			}
		);

		if (!response.ok) {
			const error = await response.json();
			console.error("OpenAI API error:", error);
			throw new Error(`OpenAI API error: ${response.status}`);
		}

		const data = await response.json();
		return data.choices[0].message.content;
	} catch (error) {
		console.error("Error calling OpenAI API:", error);
		throw error;
	}
}

/**
 * Groups data by prompt, then by date, then by hour within each prompt-date combination
 */
function groupByPromptDateHour(records) {
	const grouped = {};

	records.forEach((record) => {
		if (!record.timestamp || !record.promptId) return;

		const promptId = record.promptId;
		const date = new Date(record.timestamp).toISOString().split("T")[0]; // YYYY-MM-DD
		const hour = new Date(record.timestamp).getHours();

		if (!grouped[promptId]) {
			grouped[promptId] = {};
		}

		if (!grouped[promptId][date]) {
			grouped[promptId][date] = {};
		}

		if (!grouped[promptId][date][hour]) {
			grouped[promptId][date][hour] = [];
		}

		grouped[promptId][date][hour].push(record);
	});

	return grouped;
}

/**
 * Groups data by prompt, then by hour, then by date within each prompt-hour combination
 */
function groupByPromptHourDate(records) {
	const grouped = {};

	records.forEach((record) => {
		if (!record.timestamp || !record.promptId) return;

		const promptId = record.promptId;
		const hour = new Date(record.timestamp).getHours();
		const date = new Date(record.timestamp).toISOString().split("T")[0]; // YYYY-MM-DD

		if (!grouped[promptId]) {
			grouped[promptId] = {};
		}

		if (!grouped[promptId][hour]) {
			grouped[promptId][hour] = {};
		}

		if (!grouped[promptId][hour][date]) {
			grouped[promptId][hour][date] = [];
		}

		grouped[promptId][hour][date].push(record);
	});

	return grouped;
}

/**
 * First function: Analyze hourly patterns within the same day for each prompt
 * Groups data by prompt -> date -> hour to compare different hours on the same day
 */
export async function analyzeHourlyPatterns() {
	console.log(
		"🔍 Starting hourly pattern analysis (same prompt, same day, all hours)..."
	);

	try {
		// Load existing data
		const records = await loadExistingData();
		console.log(`📊 Loaded ${records.length} records for analysis`);

		if (records.length === 0) {
			console.log("❌ No data available for analysis");
			return { success: false, message: "No data available" };
		}

		// Group records by prompt -> date -> hour
		const promptDateHourGroups = groupByPromptDateHour(records);
		const analysisResults = {};

		const systemPrompt = `You are an expert data analyst specializing in response quality analysis and temporal performance patterns. Your task is to analyze the same prompt's responses across different hours within the same specific day to identify hourly quality patterns and performance variations.

For the provided data from the SAME PROMPT on the SAME DATE across DIFFERENT HOURS, analyze:
1. Response quality variations throughout the day (hour by hour)
2. Performance patterns across different hours of the day
3. Whether certain hours show consistently better or worse response quality. Be specific about the hours and the reasons for the differences.
4. Latency and token usage patterns by hour. Only significant differences should be mentioned.
5. Error patterns and timing within the day
6. Response accuracy and content quality variations by hour
7. Any temporal degradation or improvement throughout the day

Focus specifically on:
- How does this prompt perform at different hours on this specific date?
- Are there certain hours when response quality drops?
- How consistent are responses across different hours of the same day?
- What hourly patterns indicate potential issues?
- Does response quality vary predictably by time of day?

Provide your analysis in a structured JSON format:
{
  "promptId": "prompt-identifier",
  "date": "YYYY-MM-DD",
  "summary": "Brief overview of hourly response quality patterns for this prompt on this date",
  "patterns": {
    "hourly_quality": "How response quality varies by hour throughout the day",
    "performance_trends": "Performance patterns across different hours",
    "peak_hours": "Hours with best performance",
    "problematic_hours": "Hours with quality issues"
  },
  "quality_issues": ["Specific hourly response quality problems identified. Not response length or latency."],
  "timing_patterns": ["When during the day quality drops occurred"],
}

Be thorough and focus on identifying hourly quality patterns for this specific prompt on this specific date.`;

		// Analyze each prompt-date combination
		for (const [promptId, dateGroups] of Object.entries(
			promptDateHourGroups
		)) {
			for (const [date, hourGroups] of Object.entries(dateGroups)) {
				// Only analyze if we have multiple hours for this prompt-date combination
				const hourCount = Object.keys(hourGroups).length;
				if (hourCount < 2) {
					console.log(
						`⚠️ Skipping ${promptId} on ${date} - only ${hourCount} hour(s) of data`
					);
					continue;
				}

				console.log(
					`🔍 Analyzing prompt "${promptId}" on ${date} across ${hourCount} hours`
				);

				// Prepare data for LLM analysis - organize by hour for this prompt-date
				const dataForAnalysis = {
					promptId: promptId,
					date: date,
					totalRecords: Object.values(hourGroups).flat().length,
					hourBreakdown: {},
				};

				for (const [hour, hourRecords] of Object.entries(hourGroups)) {
					dataForAnalysis.hourBreakdown[hour] = {
						hour: parseInt(hour),
						recordCount: hourRecords.length,
						avgLatency:
							hourRecords.reduce(
								(sum, r) => sum + (r.latencyMs || 0),
								0
							) / hourRecords.length,
						avgResponseLength:
							hourRecords.reduce(
								(sum, r) => sum + (r.responseLength || 0),
								0
							) / hourRecords.length,
						responses: hourRecords.map((record) => ({
							timestamp: record.timestamp,

							finishReason: record.finishReason,
							error: record.error || null,
							response: record.response ? record.response : null,
						})),
					};
				}

				const messages = prompts.find(
					(p) => p.id === promptId
				).messages;

				const userPrompt = `A language model was given the following messages at different hours of the day:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}              
------------

The responses were recorded on date ${date}. Look for response quality patterns across different hours of this specific day. Here is the data for the analysis:

${JSON.stringify(dataForAnalysis, null, 2)}


------------
Analyze the data and provide a detailed analysis of the response quality patterns across different hours of this specific day if there are differences/drops in response quality at certain hours. If there are no significant differences, say so.
Focus on identifying how response quality varies by hour throughout this day for this specific prompt.`;

				try {
					const analysis = await analyzeWithLLM(
						systemPrompt,
						userPrompt
					);
					const resultKey = `${promptId}_${date}`;
					analysisResults[resultKey] = {
						promptId,
						date,
						hoursAnalyzed: hourCount,
						totalRecords: dataForAnalysis.totalRecords,
						analysis: analysis,
						hourlyBreakdown: dataForAnalysis,
					};
				} catch (error) {
					console.error(
						`❌ Failed to analyze prompt ${promptId} on ${date}:`,
						error
					);
					const resultKey = `${promptId}_${date}`;
					analysisResults[resultKey] = {
						promptId,
						date,
						hoursAnalyzed: hourCount,
						totalRecords: dataForAnalysis.totalRecords,
						error: error.message,
						hourlyBreakdown: dataForAnalysis,
					};
				}

				// Add delay to respect rate limits
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		// Save results to JSON file
		const outputPath = path.join(
			process.cwd(),
			"hourly_pattern_analysis.json"
		);
		await fs.writeFile(
			outputPath,
			JSON.stringify(analysisResults, null, 2)
		);

		console.log(
			`✅ Hourly pattern analysis complete. Analyzed ${
				Object.keys(analysisResults).length
			} prompt-date combinations. Results saved to ${outputPath}`
		);

		return {
			success: true,
			analysisCount: Object.keys(analysisResults).length,
			outputPath,
			results: analysisResults,
		};
	} catch (error) {
		console.error("💥 Hourly pattern analysis failed:", error);
		throw error;
	}
}

/**
 * Second function: Analyze daily patterns across different days for each prompt at the same hour
 * Groups data by prompt -> hour -> date to compare the same hour across different days
 */
export async function analyzeDailyPatterns() {
	console.log(
		"🔍 Starting daily pattern analysis (same prompt, same hour, all days)..."
	);

	try {
		// Load existing data
		const records = await loadExistingData();
		console.log(`📊 Loaded ${records.length} records for analysis`);

		if (records.length === 0) {
			console.log("❌ No data available for analysis");
			return { success: false, message: "No data available" };
		}

		// Group records by prompt -> hour -> date
		const promptHourDateGroups = groupByPromptHourDate(records);
		const analysisResults = {};

		const systemPrompt = `You are an expert data analyst specializing in response quality analysis and temporal performance patterns. Your task is to analyze the same prompt's responses at the same hour across different days to identify daily quality patterns and day-to-day performance variations.

For the provided data from the SAME PROMPT at the SAME HOUR across DIFFERENT DAYS, analyze:
1. Response quality consistency across different days at this specific hour
2. Day-of-week effects on response quality at this time
3. Whether certain days show consistently better or worse response quality
4. Performance trends across different dates at this specific hour
5. Error patterns and timing across different days
6. Response accuracy and content quality variations by day
7. Any degradation or improvement patterns over time

Focus specifically on:
- How does this prompt perform at this specific hour across different days?
- Are there certain days when this hour shows quality drops?
- How consistent are responses at this time across different days?
- What daily patterns indicate potential issues at this specific time?
- Does response quality at this hour vary by day of the week?

Provide your analysis in a structured JSON format:
{
  "promptId": "prompt-identifier",
  "hour": "HH (24-hour format)",
  "summary": "Brief overview of daily response quality patterns for this prompt at this hour",
  "patterns": {
    "daily_consistency": "How response quality varies across days at this hour",
    "day_of_week_effects": "Whether certain weekdays perform better",
    "quality_trends": "Quality trends over time at this specific hour",
    "problematic_days": "Days with quality issues at this time"
  },
  "quality_issues": ["Specific daily quality problems at this hour"],
  "recommendations": ["Actions to address daily performance variations at this time"]
}

Be thorough and focus on identifying daily quality patterns for this specific prompt at this specific hour.`;

		// Analyze each prompt-hour combination
		for (const [promptId, hourGroups] of Object.entries(
			promptHourDateGroups
		)) {
			for (const [hour, dateGroups] of Object.entries(hourGroups)) {
				// Only analyze if we have multiple days for this prompt-hour combination
				const dayCount = Object.keys(dateGroups).length;
				if (dayCount < 2) {
					console.log(
						`⚠️ Skipping ${promptId} at hour ${hour} - only ${dayCount} day(s) of data`
					);
					continue;
				}

				console.log(
					`🔍 Analyzing prompt "${promptId}" at hour ${hour}:00 across ${dayCount} days`
				);

				// Prepare data for LLM analysis - organize by date for this prompt-hour
				const dataForAnalysis = {
					promptId: promptId,
					hour: parseInt(hour),
					totalRecords: Object.values(dateGroups).flat().length,
					dayBreakdown: {},
				};

				for (const [date, dateRecords] of Object.entries(dateGroups)) {
					const dayOfWeek = new Date(date).toLocaleDateString(
						"en-US",
						{ weekday: "long" }
					);

					dataForAnalysis.dayBreakdown[date] = {
						date: date,
						dayOfWeek: dayOfWeek,
						recordCount: dateRecords.length,
						avgLatency:
							dateRecords.reduce(
								(sum, r) => sum + (r.latencyMs || 0),
								0
							) / dateRecords.length,

						avgResponseLength:
							dateRecords.reduce(
								(sum, r) => sum + (r.responseLength || 0),
								0
							) / dateRecords.length,
						responses: dateRecords.map((record) => ({
							timestamp: record.timestamp,
							success: record.success,
							latencyMs: record.latencyMs,
							totalTokens: record.totalTokens,
							responseLength: record.responseLength,
							finishReason: record.finishReason,
							error: record.error || null,
							response: record.response ? record.response : null,
						})),
					};
				}

				const messages = prompts.find(
					(p) => p.id === promptId
				).messages;

				const userPrompt = `A language model was given the following messages at different hours of the day:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}                

The responses were recorded on different days. Look for response quality patterns across different days at this specific time of ${hour}:00. Here is the data for the analysis:

${JSON.stringify(dataForAnalysis, null, 2)}

------------
Analyze the data and provide a detailed analysis of the response quality patterns across different days at this specific hour if there are differences/drops in response quality at certain days. If there are no significant differences, say so.
Focus on identifying how response quality varies across different days at this specific hour for this specific prompt.`;

				try {
					const analysis = await analyzeWithLLM(
						systemPrompt,
						userPrompt
					);
					const resultKey = `${promptId}_hour_${hour}`;
					analysisResults[resultKey] = {
						promptId,
						hour: parseInt(hour),
						daysAnalyzed: dayCount,
						totalRecords: dataForAnalysis.totalRecords,
						analysis: analysis,
						dailyBreakdown: dataForAnalysis,
					};
				} catch (error) {
					console.error(
						`❌ Failed to analyze prompt ${promptId} at hour ${hour}:`,
						error
					);
					const resultKey = `${promptId}_hour_${hour}`;
					analysisResults[resultKey] = {
						promptId,
						hour: parseInt(hour),
						daysAnalyzed: dayCount,
						totalRecords: dataForAnalysis.totalRecords,
						error: error.message,
						dailyBreakdown: dataForAnalysis,
					};
				}

				// Add delay to respect rate limits
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		// Save results to JSON file
		const outputPath = path.join(
			process.cwd(),
			"daily_pattern_analysis.json"
		);
		await fs.writeFile(
			outputPath,
			JSON.stringify(analysisResults, null, 2)
		);

		console.log(
			`✅ Daily pattern analysis complete. Analyzed ${
				Object.keys(analysisResults).length
			} prompt-hour combinations. Results saved to ${outputPath}`
		);

		return {
			success: true,
			analysisCount: Object.keys(analysisResults).length,
			outputPath,
			results: analysisResults,
		};
	} catch (error) {
		console.error("💥 Daily pattern analysis failed:", error);
		throw error;
	}
}

/**
 * Utility function to run both analyses
 */
export async function runFullAnalysis() {
	console.log("🚀 Starting comprehensive pattern analysis...");

	try {
		//const hourlyResults = await analyzeHourlyPatterns();
		const dailyResults = await analyzeDailyPatterns();

		return {
			success: true,
			//hourly: hourlyResults,
			daily: dailyResults,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("💥 Full analysis failed:", error);
		throw error;
	}
}

// Uncomment the line below to run the analysis
//runFullAnalysis();
