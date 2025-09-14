import {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import dotenv from "dotenv";

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
const model = "gpt-4o-mini";

// Realistic prompt scenarios with varying lengths and complexity
const prompts = [
	// SHORT PROMPTS (5) - Minimal system instructions
	{
		id: "customer-greeting",
		category: "short",
		messages: [
			{
				role: "system",
				content:
					"You are a helpful customer service representative for TechCorp. Be friendly and professional.",
			},
			{
				role: "user",
				content: "Hi, I need help with my account login",
			},
		],
	},
	{
		id: "code-review",
		category: "short",
		messages: [
			{
				role: "system",
				content:
					"You are a senior software engineer. Provide concise, actionable code feedback.",
			},
			{
				role: "user",
				content:
					"Review this function: function add(a, b) { return a + b; }",
			},
		],
	},
	{
		id: "translation-task",
		category: "short",
		messages: [
			{
				role: "system",
				content:
					"You are a professional translator. Provide accurate translations with cultural context when needed.",
			},
			{
				role: "user",
				content:
					"Translate to Spanish: 'The meeting has been postponed until next week.'",
			},
		],
	},
	{
		id: "math-helper",
		category: "short",
		messages: [
			{
				role: "system",
				content:
					"You are a math tutor. Show your work step by step and explain concepts clearly.",
			},
			{
				role: "user",
				content: "What's 15% of 240?",
			},
		],
	},
	{
		id: "recipe-assistant",
		category: "short",
		messages: [
			{
				role: "system",
				content:
					"You are a culinary assistant. Provide practical cooking advice and ingredient substitutions.",
			},
			{
				role: "user",
				content:
					"Can I substitute honey for sugar in chocolate chip cookies?",
			},
		],
	},

	// MEDIUM PROMPTS (5) - Moderate system instructions with context
	{
		id: "financial-advisor",
		category: "medium",
		messages: [
			{
				role: "system",
				content:
					"You are a certified financial advisor with 10+ years of experience. You help clients make informed investment decisions based on their risk tolerance, time horizon, and financial goals. Always remind users that this is educational information and not personalized financial advice. Consider market conditions, diversification principles, and long-term wealth building strategies. Be clear about potential risks and never guarantee returns.",
			},
			{
				role: "user",
				content:
					"I'm 28 years old with $50k saved. Should I invest in index funds or individual stocks for retirement? I'm comfortable with moderate risk.",
			},
		],
	},
	{
		id: "medical-qa",
		category: "medium",
		messages: [
			{
				role: "system",
				content:
					"You are a medical information assistant. Provide accurate, evidence-based health information while emphasizing that you cannot diagnose conditions or replace professional medical advice. Always recommend consulting healthcare providers for personal medical concerns. Focus on general health education, symptom awareness, and when to seek medical attention. Use clear, accessible language and cite reputable medical sources when possible.",
			},
			{
				role: "user",
				content:
					"I've been having persistent headaches for 2 weeks, usually in the afternoon. What could be causing this and when should I see a doctor?",
			},
		],
	},
	{
		id: "legal-research",
		category: "medium",
		messages: [
			{
				role: "system",
				content:
					"You are a legal research assistant specializing in contract law and business regulations. Provide accurate legal information while clearly stating that this is not legal advice and users should consult qualified attorneys for their specific situations. Focus on explaining legal concepts, typical contract provisions, and general business law principles. Always recommend professional legal counsel for important decisions.",
			},
			{
				role: "user",
				content:
					"What are the key elements that make a business contract legally enforceable? I'm drafting a service agreement for my consulting business.",
			},
		],
	},
	{
		id: "education-tutor",
		category: "medium",
		messages: [
			{
				role: "system",
				content:
					"You are an experienced high school science teacher and tutor with expertise in biology, chemistry, and physics. Your teaching style emphasizes conceptual understanding over memorization. Use analogies, real-world examples, and step-by-step explanations to help students grasp complex topics. Encourage critical thinking and scientific inquiry. Adapt your explanations to the student's apparent level of understanding.",
			},
			{
				role: "user",
				content:
					"I'm struggling to understand photosynthesis. Can you explain how plants convert sunlight into energy and why this process is important for life on Earth?",
			},
		],
	},
	{
		id: "project-manager",
		category: "medium",
		messages: [
			{
				role: "system",
				content:
					"You are a senior project manager with expertise in agile methodologies, risk management, and team coordination. You help teams deliver projects on time and within budget. Focus on practical solutions, stakeholder communication, and process improvement. Consider resource constraints, timeline pressures, and team dynamics in your recommendations. Emphasize clear communication and proactive problem-solving.",
			},
			{
				role: "user",
				content:
					"Our software development project is behind schedule by 3 weeks. The client is getting anxious and my team is stressed. What strategies can I use to get back on track while maintaining quality?",
			},
		],
	},

	// LONG PROMPTS (5) - Extensive system instructions with detailed context
	{
		id: "enterprise-architect",
		category: "long",
		messages: [
			{
				role: "system",
				content:
					"You are a senior enterprise architect with 15+ years of experience designing large-scale distributed systems. You have deep expertise in cloud architecture, microservices, security, scalability, and system integration. Your role involves translating business requirements into technical solutions while considering factors like performance, reliability, maintainability, cost-effectiveness, and future scalability.\n\nWhen providing architectural guidance, consider:\n- Current technology landscape and emerging trends\n- Security best practices and compliance requirements\n- Scalability patterns and performance optimization\n- Data architecture and storage strategies\n- Integration patterns and API design\n- DevOps practices and deployment strategies\n- Monitoring, logging, and observability\n- Disaster recovery and business continuity\n- Team skills and organizational constraints\n- Budget limitations and ROI considerations\n\nAlways provide multiple options when possible, explain trade-offs clearly, and justify your recommendations with concrete reasoning. Consider both short-term implementation and long-term evolution of the system.",
			},
			{
				role: "user",
				content:
					"We're a growing e-commerce company (currently 1M users, 10k daily orders) planning to expand globally. Our current monolithic application is showing performance issues and we need to redesign our architecture. We have a team of 25 developers, use AWS, and need to support multiple currencies and payment methods. What architecture would you recommend for the next 3-5 years?",
			},
		],
	},
	{
		id: "clinical-researcher",
		category: "long",
		messages: [
			{
				role: "system",
				content:
					"You are a clinical research scientist and biostatistician with extensive experience in pharmaceutical research, clinical trial design, and regulatory affairs. You have a PhD in Biostatistics and 12+ years of experience working with FDA submissions, EMA approvals, and international clinical trials.\n\nYour expertise includes:\n- Clinical trial methodology and statistical analysis plans\n- Regulatory guidelines (ICH-GCP, FDA, EMA requirements)\n- Study design optimization and power calculations\n- Interim analysis and data safety monitoring\n- Biomarker development and validation\n- Real-world evidence and post-market surveillance\n- Pharmacovigilance and adverse event reporting\n- Health economics and outcomes research\n\nWhen discussing clinical research topics:\n- Always emphasize patient safety and ethical considerations\n- Reference relevant regulatory guidance when applicable\n- Explain statistical concepts in accessible terms\n- Consider practical implementation challenges\n- Discuss potential biases and limitation mitigation strategies\n- Address both efficacy and safety endpoints\n- Consider health economic implications\n- Maintain scientific rigor while being practical\n\nNote: Provide educational information only; specific research decisions should involve qualified clinical research professionals and regulatory experts.",
			},
			{
				role: "user",
				content:
					"We're designing a Phase III randomized controlled trial for a new diabetes medication. The primary endpoint is HbA1c reduction after 24 weeks. We expect a 0.8% reduction vs placebo with SD of 1.2%. How should we design this study to ensure regulatory approval, and what are the key considerations for the statistical analysis plan?",
			},
		],
	},
	{
		id: "investment-strategist",
		category: "long",
		messages: [
			{
				role: "system",
				content:
					"You are a senior investment strategist and portfolio manager at a major institutional investment firm with 20+ years of experience managing multi-billion dollar portfolios. You hold a CFA designation and have extensive expertise in:\n\n- Global equity and fixed income markets\n- Alternative investments (private equity, hedge funds, real estate, commodities)\n- Risk management and portfolio optimization\n- Macroeconomic analysis and market forecasting\n- ESG investing and sustainable finance\n- Quantitative analysis and factor investing\n- Currency hedging and international markets\n- Derivative strategies and structured products\n\nYour analytical approach involves:\n- Top-down macroeconomic analysis combined with bottom-up security selection\n- Multi-factor risk models and stress testing\n- Behavioral finance considerations and market psychology\n- Liquidity management and operational risk assessment\n- Regulatory compliance and fiduciary responsibility\n- Client communication and expectation management\n\nWhen providing investment insights:\n- Always emphasize that past performance doesn't guarantee future results\n- Discuss both opportunities and risks transparently\n- Consider different market scenarios and their implications\n- Reference relevant economic data and market indicators\n- Explain complex concepts in accessible terms for different audience types\n- Maintain objectivity and avoid confirmation bias\n- Consider time horizons, liquidity needs, and risk tolerance\n- Acknowledge uncertainty and the limits of forecasting\n\nThis is educational content only, not personalized investment advice. Individuals should consult qualified financial advisors for their specific situations.",
			},
			{
				role: "user",
				content:
					"Given the current inflationary environment, rising interest rates, and geopolitical tensions, how should institutional investors adjust their portfolio allocation strategy? What are your views on the outlook for different asset classes over the next 12-24 months?",
			},
		],
	},
	{
		id: "cybersecurity-expert",
		category: "long",
		messages: [
			{
				role: "system",
				content:
					"You are a Chief Information Security Officer (CISO) with 18+ years of cybersecurity experience across multiple industries including financial services, healthcare, and technology. You hold advanced certifications (CISSP, CISM, CISSP) and have led incident response teams, built security programs from the ground up, and managed enterprise-wide security transformations.\n\nYour expertise spans:\n- Enterprise security architecture and zero-trust implementation\n- Threat intelligence, adversary tactics, and attack vector analysis\n- Incident response, forensics, and crisis management\n- Compliance frameworks (SOX, HIPAA, PCI-DSS, GDPR, SOC 2)\n- Risk assessment methodologies and quantitative risk analysis\n- Security awareness training and human factors in cybersecurity\n- Cloud security architecture (AWS, Azure, GCP)\n- Identity and access management (IAM) and privileged access management (PAM)\n- Network security, endpoint protection, and SIEM/SOAR platforms\n- Vendor risk management and third-party security assessments\n- Security metrics, KPIs, and board-level reporting\n- Emerging threats: AI/ML security, IoT, and operational technology\n\nYour approach emphasizes:\n- Business alignment and risk-based decision making\n- Practical, implementable solutions over theoretical perfection\n- Continuous improvement and adaptive security postures\n- Clear communication with both technical teams and executive leadership\n- Balancing security requirements with business enablement\n- Industry best practices while considering organizational constraints\n\nWhen providing security guidance, always consider the organization's risk appetite, regulatory requirements, budget constraints, and operational impact. Emphasize that security is an ongoing process requiring regular assessment and adaptation.",
			},
			{
				role: "user",
				content:
					"Our mid-sized financial services company (500 employees) just experienced a ransomware attack that encrypted 30% of our servers. We've contained the threat but need to rebuild our security posture. The board is demanding a comprehensive security transformation plan. What should be our priorities for the next 6-12 months, and how do we prevent this from happening again while maintaining business operations?",
			},
		],
	},
	{
		id: "product-strategist",
		category: "long",
		messages: [
			{
				role: "system",
				content:
					"You are a Senior Vice President of Product Strategy at a high-growth technology company with 12+ years of experience in product management, business strategy, and market analysis. You've successfully launched multiple products that achieved product-market fit and scaled to millions of users.\n\nYour core competencies include:\n- Product-market fit assessment and go-to-market strategy\n- User research, behavioral analysis, and customer journey optimization\n- Competitive analysis and market positioning\n- Product roadmap development and prioritization frameworks\n- Cross-functional team leadership and stakeholder management\n- Data-driven decision making and experimentation methodology\n- Platform strategy and ecosystem development\n- Pricing strategy and monetization optimization\n- International expansion and localization strategies\n- Product lifecycle management and sunset planning\n\nYour strategic framework considers:\n- Market size, growth potential, and competitive dynamics\n- Technical feasibility and resource requirements\n- User needs, pain points, and behavioral patterns\n- Business model alignment and revenue impact\n- Organizational capabilities and strategic fit\n- Regulatory considerations and compliance requirements\n- Scalability and operational complexity\n- Risk assessment and mitigation strategies\n\nMethodology:\n- Jobs-to-be-Done framework for understanding user motivation\n- OKRs and KPI-driven goal setting and measurement\n- Design thinking and lean startup principles\n- Agile development and continuous delivery practices\n- A/B testing and statistical analysis for feature validation\n- Customer development and continuous feedback loops\n\nWhen providing product strategy advice, always ground recommendations in market evidence, user research, and business metrics. Consider both short-term execution and long-term strategic positioning. Acknowledge assumptions and recommend validation approaches.",
			},
			{
				role: "user",
				content:
					"We're a B2B SaaS company with a successful workflow automation product (50k users, $10M ARR). We're considering expanding into AI-powered analytics as our next major product line. The market looks promising but it's highly competitive with well-funded startups and Big Tech players. Should we build this internally, acquire a company, or partner with existing solutions? What factors should drive this strategic decision?",
			},
		],
	},
];

// ---------------------
// ENHANCED HELPER FUNCTIONS
// ---------------------
class LLMMonitor {
	constructor(s3Client, bucketName, csvKey) {
		this.s3 = s3Client;
		this.bucket = bucketName;
		this.key = csvKey;
		this.model = model;
	}

	async loadExistingData() {
		try {
			const response = await this.s3.send(
				new GetObjectCommand({ Bucket: this.bucket, Key: this.key })
			);
			const csvContent = await response.Body.transformToString();
			return parse(csvContent, {
				columns: true,
				skip_empty_lines: true,
			});
		} catch (error) {
			if (this.isNotFoundError(error)) {
				console.log("No existing data found, starting fresh");
				return [];
			}
			throw new Error(`Failed to load existing data: ${error.message}`);
		}
	}

	async saveData(records) {
		try {
			const csvContent = stringify(records, {
				header: true,
				quoted_string: true,
			});
			await this.s3.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: this.key,
					Body: csvContent,
					ContentType: "text/csv",
				})
			);
		} catch (error) {
			throw new Error(`Failed to save data: ${error.message}`);
		}
	}

	async executePrompt(prompt) {
		const startTime = performance.now();

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
						model: this.model,
						messages: prompt.messages,
						logprobs: true,
						top_logprobs: 5, // Get top 5 logprobs for analysis
					}),
				}
			);

			if (!response.ok) {
				const error = await response.json();
				console.error(error);
				throw new Error(`OpenAI API error: ${response.status}`);
			}

			const data = await response.json();

			const endTime = performance.now();
			const choice = data.choices[0];

			return this.formatResult(prompt, data, choice, endTime - startTime);
		} catch (error) {
			return this.formatError(
				prompt,
				error,
				performance.now() - startTime
			);
		}
	}

	formatResult(prompt, response, choice, latencyMs) {
		const usage = response.usage || {};
		const promptTokensDetails = usage.prompt_tokens_details || {};
		const completionTokensDetails = usage.completion_tokens_details || {};

		return {
			timestamp: new Date().toISOString(),
			promptId: prompt.id,
			category: prompt.category,
			model: response.model || this.model,
			latencyMs: Math.round(latencyMs),
			success: true,
			finishReason: choice.finish_reason,
			// Token usage - updated for new API response structure
			promptTokens: usage.prompt_tokens || 0,
			completionTokens: usage.completion_tokens || 0,
			totalTokens: usage.total_tokens || 0,
			// Detailed token breakdown
			cachedTokens: promptTokensDetails.cached_tokens || 0,
			audioTokensPrompt: promptTokensDetails.audio_tokens || 0,
			reasoningTokens: completionTokensDetails.reasoning_tokens || 0,
			audioTokensCompletion: completionTokensDetails.audio_tokens || 0,
			acceptedPredictionTokens:
				completionTokensDetails.accepted_prediction_tokens || 0,
			rejectedPredictionTokens:
				completionTokensDetails.rejected_prediction_tokens || 0,
			// Response analysis
			responseLength: choice.message.content?.length || 0,
			response: choice.message.content,
			hasRefusal: choice.message.refusal !== null,
			refusalContent: choice.message.refusal || "",
			annotationsCount: (choice.message.annotations || []).length,
			// Logprobs for quality assessment
			avgLogprob: this.calculateAverageLogprob(choice.logprobs),
			hasLogprobs: choice.logprobs !== null,
			// Service tier info
			serviceTier: response.service_tier || "unknown",
			// Response metadata
			responseId: response.id,
			createdAt: response.created
				? new Date(response.created * 1000).toISOString()
				: null,
		};
	}

	formatError(prompt, error, latencyMs) {
		return {
			timestamp: new Date().toISOString(),
			promptId: prompt.id,
			category: prompt.category,
			model: this.model,
			latencyMs: Math.round(latencyMs),
			success: false,
			finishReason: "error",
			error: error.message,
			errorType: error.type || "unknown",
			// Token usage - all zeros for errors
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0,
			cachedTokens: 0,
			audioTokensPrompt: 0,
			reasoningTokens: 0,
			audioTokensCompletion: 0,
			acceptedPredictionTokens: 0,
			rejectedPredictionTokens: 0,
			// Response analysis - all empty/false for errors
			responseLength: 0,
			response: "",
			hasRefusal: false,
			refusalContent: "",
			annotationsCount: 0,
			avgLogprob: null,
			hasLogprobs: false,
			serviceTier: "unknown",
			responseId: null,
			createdAt: null,
		};
	}

	calculateAverageLogprob(logprobs) {
		if (!logprobs?.content || logprobs.content.length === 0) return null;

		const validLogprobs = logprobs.content
			.map((token) => token.logprob)
			.filter((logprob) => logprob !== null && logprob !== undefined);

		if (validLogprobs.length === 0) return null;

		const sum = validLogprobs.reduce((acc, logprob) => acc + logprob, 0);
		return Math.round((sum / validLogprobs.length) * 1000) / 1000; // Round to 3 decimal places
	}

	appendNewResults(existingRecords, newResults) {
		// Simple append-only approach for time series data
		// Each test run creates new rows, making time series analysis straightforward
		return existingRecords.concat(newResults);
	}

	isNotFoundError(error) {
		return (
			error.name === "NoSuchKey" ||
			error.Code === "NoSuchKey" ||
			error.$metadata?.httpStatusCode === 404
		);
	}

	generateSummaryStats(results) {
		const successful = results.filter((r) => r.success);
		const failed = results.filter((r) => !r.success);

		const latencies = successful.map((r) => r.latencyMs);
		const tokenUsage = successful.reduce(
			(acc, r) => acc + r.totalTokens,
			0
		);

		return {
			totalPrompts: results.length,
			successful: successful.length,
			failed: failed.length,
			successRate: Math.round((successful.length / results.length) * 100),
			avgLatency:
				latencies.length > 0
					? Math.round(
							latencies.reduce((a, b) => a + b, 0) /
								latencies.length
					  )
					: 0,
			totalTokens: tokenUsage,
			categoryBreakdown: this.getCategoryBreakdown(results),
		};
	}

	getCategoryBreakdown(results) {
		const breakdown = {};
		results.forEach((result) => {
			const category = result.category;
			if (!breakdown[category]) {
				breakdown[category] = {
					total: 0,
					successful: 0,
					avgLatency: 0,
				};
			}
			breakdown[category].total++;
			if (result.success) {
				breakdown[category].successful++;
				breakdown[category].avgLatency =
					(breakdown[category].avgLatency + result.latencyMs) /
					breakdown[category].successful;
			}
		});
		return breakdown;
	}

	// Helper function for time series analysis
	static analyzeTimeSeriesData(records, promptId = null, timeWindow = null) {
		let filteredRecords = records;

		// Filter by prompt ID if specified
		if (promptId) {
			filteredRecords = filteredRecords.filter(
				(r) => r.promptId === promptId
			);
		}

		// Filter by time window if specified (e.g., last 24 hours)
		if (timeWindow) {
			const cutoffTime = new Date(Date.now() - timeWindow);
			filteredRecords = filteredRecords.filter(
				(r) => new Date(r.timestamp) >= cutoffTime
			);
		}

		// Sort by timestamp for time series analysis
		filteredRecords.sort(
			(a, b) => new Date(a.timestamp) - new Date(b.timestamp)
		);

		return {
			records: filteredRecords,
			summary: {
				totalRuns: filteredRecords.length,
				successRate:
					filteredRecords.length > 0
						? (filteredRecords.filter((r) => r.success).length /
								filteredRecords.length) *
						  100
						: 0,
				avgLatency:
					filteredRecords.length > 0
						? filteredRecords.reduce(
								(sum, r) => sum + r.latencyMs,
								0
						  ) / filteredRecords.length
						: 0,
				avgTokens:
					filteredRecords.length > 0
						? filteredRecords.reduce(
								(sum, r) => sum + r.totalTokens,
								0
						  ) / filteredRecords.length
						: 0,
				timeRange:
					filteredRecords.length > 0
						? {
								start: filteredRecords[0].timestamp,
								end: filteredRecords[filteredRecords.length - 1]
									.timestamp,
						  }
						: null,
			},
		};
	}
}

// ---------------------
// MAIN MONITORING FUNCTION
// ---------------------
export async function monitorOnce() {
	const monitor = new LLMMonitor(s3, bucket, key);

	try {
		console.log(
			`🚀 Starting monitoring run with ${prompts.length} prompts...`
		);

		// Load existing data
		const existingRecords = await monitor.loadExistingData();
		console.log(`📊 Loaded ${existingRecords.length} existing records`);

		// Execute all prompts concurrently with error handling
		const results = await Promise.allSettled(
			prompts.map((prompt) => monitor.executePrompt(prompt))
		);

		// Process results and handle any rejections
		const processedResults = results.map((result, index) => {
			if (result.status === "fulfilled") {
				return result.value;
			} else {
				console.error(
					`❌ Prompt ${prompts[index].id} failed:`,
					result.reason
				);
				return monitor.formatError(prompts[index], result.reason, 0);
			}
		});

		// Append new results to existing records for time series analysis
		const updatedRecords = monitor.appendNewResults(
			existingRecords,
			processedResults
		);

		// Save updated data
		await monitor.saveData(updatedRecords);

		// Generate and log summary statistics
		const stats = monitor.generateSummaryStats(processedResults);
		console.log("📈 Monitoring Summary:", JSON.stringify(stats, null, 2));

		return {
			success: true,
			timestamp: new Date().toISOString(),
			stats,
			recordCount: updatedRecords.length,
		};
	} catch (error) {
		console.error("💥 Monitoring run failed:", error);
		throw error;
	}
}

// Export the time series analysis function for external use
export async function analyzeTimeSeriesData(
	promptId = null,
	timeWindow = null
) {
	const monitor = new LLMMonitor(s3, bucket, key);
	const records = await monitor.loadExistingData();
	//console.log(records);
	return LLMMonitor.analyzeTimeSeriesData(records, promptId, timeWindow);
}

/*
analyzeTimeSeriesData("customer-greeting").then((result) => {
	console.log(result);
});
*/
