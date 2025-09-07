import React, { useState, useRef } from "react";
import { FaKey, FaCopy, FaEye, FaEyeSlash, FaRocket } from "react-icons/fa";

const Deploy = ({ project }) => {
	const [apiKey, setApiKey] = useState("");
	const [isKeyGenerated, setIsKeyGenerated] = useState(false);
	const [showKey, setShowKey] = useState(false);
	const [copied, setCopied] = useState("");
	const keyRef = useRef(null);

	const chatApiUrl = "https://m6oq29rs3e.execute-api.us-east-1.amazonaws.com"; // import.meta.env.VITE_CHAT_API_URL;
	const endpoint = `${chatApiUrl}/proxy`;

	// Generate a random API key
	const generateApiKey = () => {
		const characters =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let result = "sk-";
		for (let i = 0; i < 48; i++) {
			result += characters.charAt(
				Math.floor(Math.random() * characters.length)
			);
		}
		setApiKey(result);
		setIsKeyGenerated(true);
		setShowKey(true);
	};

	// Copy to clipboard function
	const copyToClipboard = async (text, type) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(type);
			setTimeout(() => setCopied(""), 2000);
		} catch (err) {
			console.error("Failed to copy: ", err);
		}
	};

	// Generate example payload from inputSchema
	const generateExamplePayload = () => {
		const payload = {};
		project.inputSchema?.forEach((field) => {
			switch (field.type) {
				case "string":
					payload[field.name] = `"example_${field.name}"`;
					break;
				case "number":
					const min = field.min || 0;
					const max = field.max || 100;
					payload[field.name] =
						Math.floor(Math.random() * (max - min + 1)) + min;
					break;
				case "boolean":
					payload[field.name] = Math.random() > 0.5;
					break;
				default:
					payload[field.name] = `"example_${field.name}"`;
			}
		});
		return payload;
	};

	const examplePayload = generateExamplePayload();
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${apiKey || "YOUR_API_KEY"}`,
		"X-Project-ID": project.projectId,
	};

	return (
		<div className="container bg-white rounded-lg shadow-md p-6 mb-8">
			<div className="flex items-center mb-6">
				<FaRocket className="text-blue-600 mr-3 text-2xl" />
				<h2 className="text-2xl font-semibold text-gray-700">
					Deploy API
				</h2>
			</div>

			<div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
				<p className="text-blue-800 text-sm">
					<strong>Smart Routing:</strong> This endpoint will always
					choose the best model configuration for your use case based
					on your project's optimization settings.
				</p>
			</div>

			{/* API Key Generation */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-medium text-gray-700 flex items-center">
						<FaKey className="mr-2" />
						API Key
					</h3>
					{!isKeyGenerated && (
						<button
							onClick={generateApiKey}
							className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 flex items-center"
						>
							<FaKey className="mr-2" />
							Generate API Key
						</button>
					)}
				</div>

				{isKeyGenerated && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<div className="flex items-center justify-between mb-2">
							<p className="text-sm text-yellow-800 font-medium">
								⚠️ Save this API key now. You won't be able to
								see it again!
							</p>
							<div className="flex space-x-2">
								<button
									onClick={() => setShowKey(!showKey)}
									className="text-gray-500 hover:text-gray-700"
								>
									{showKey ? <FaEyeSlash /> : <FaEye />}
								</button>
								<button
									onClick={() =>
										copyToClipboard(apiKey, "apiKey")
									}
									className="text-blue-500 hover:text-blue-700"
								>
									<FaCopy />
								</button>
							</div>
						</div>
						<div className="font-mono text-sm bg-white p-3 rounded border">
							{showKey ? apiKey : "•".repeat(apiKey.length)}
						</div>
						{copied === "apiKey" && (
							<p className="text-green-600 text-sm mt-1">
								✓ Copied to clipboard!
							</p>
						)}
					</div>
				)}
			</div>

			{/* Endpoint */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-medium text-gray-700">
						Endpoint
					</h3>
					<button
						onClick={() => copyToClipboard(endpoint, "endpoint")}
						className="text-blue-500 hover:text-blue-700 flex items-center"
					>
						<FaCopy className="mr-1" />
						Copy
					</button>
				</div>
				<div className="bg-gray-50 p-4 rounded-lg border">
					<div className="flex items-center">
						<span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium mr-3">
							POST
						</span>
						<code className="font-mono text-sm text-gray-800 break-all">
							{endpoint}
						</code>
					</div>
				</div>
				{copied === "endpoint" && (
					<p className="text-green-600 text-sm mt-1">
						✓ Copied to clipboard!
					</p>
				)}
			</div>

			{/* Headers */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-medium text-gray-700">
						Headers
					</h3>
					<button
						onClick={() =>
							copyToClipboard(
								JSON.stringify(headers, null, 2),
								"headers"
							)
						}
						className="text-blue-500 hover:text-blue-700 flex items-center"
					>
						<FaCopy className="mr-1" />
						Copy
					</button>
				</div>
				<div className="bg-gray-50 p-4 rounded-lg border">
					<pre className="text-sm text-gray-800 overflow-x-auto">
						{JSON.stringify(headers, null, 2)}
					</pre>
				</div>
				{copied === "headers" && (
					<p className="text-green-600 text-sm mt-1">
						✓ Copied to clipboard!
					</p>
				)}
			</div>

			{/* Payload */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-medium text-gray-700">
						Example Payload
					</h3>
					<button
						onClick={() =>
							copyToClipboard(
								JSON.stringify(examplePayload, null, 2),
								"payload"
							)
						}
						className="text-blue-500 hover:text-blue-700 flex items-center"
					>
						<FaCopy className="mr-1" />
						Copy
					</button>
				</div>
				<div className="bg-gray-50 p-4 rounded-lg border">
					<pre className="text-sm text-gray-800 overflow-x-auto">
						{JSON.stringify(examplePayload, null, 2)}
					</pre>
				</div>
				{copied === "payload" && (
					<p className="text-green-600 text-sm mt-1">
						✓ Copied to clipboard!
					</p>
				)}
			</div>

			{/* Example cURL */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-medium text-gray-700">
						Example cURL Request
					</h3>
					<button
						onClick={() => {
							const curlCommand = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey || "YOUR_API_KEY"}" \\
  -H "X-Project-ID: ${project.projectId}" \\
  -d '${JSON.stringify(examplePayload)}'`;
							copyToClipboard(curlCommand, "curl");
						}}
						className="text-blue-500 hover:text-blue-700 flex items-center"
					>
						<FaCopy className="mr-1" />
						Copy
					</button>
				</div>
				<div className="bg-gray-900 text-green-400 p-4 rounded-lg border overflow-x-auto">
					<pre className="text-sm">
						{`curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey || "YOUR_API_KEY"}" \\
  -H "X-Project-ID: ${project.projectId}" \\
  -d '${JSON.stringify(examplePayload)}'`}
					</pre>
				</div>
				{copied === "curl" && (
					<p className="text-green-600 text-sm mt-1">
						✓ Copied to clipboard!
					</p>
				)}
			</div>

			{project.inputSchema?.length === 0 && (
				<div className="bg-amber-50 border-l-4 border-amber-500 p-4 mt-4">
					<p className="text-amber-800 text-sm">
						<strong>Note:</strong> No input schema defined. Add
						fields to the Input Schema section above to see them in
						the payload example.
					</p>
				</div>
			)}
		</div>
	);
};

export default Deploy;
