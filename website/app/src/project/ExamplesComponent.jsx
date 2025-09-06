import { FaPlus, FaPlay, FaMagic, FaCoins } from "react-icons/fa";
import "./ExamplesComponent.css";
import { useEffect, useState } from "react";

import ExampleComponent from "./ExampleComponent";

import React from "react";
import { useAuth } from "../auth/AuthProvider";

const ExpandButton = ({ onClick }) => {
	return (
		<button
			className="absolute top-2 right-2 text-blue-500 hover:text-blue-700"
			onClick={onClick}
		>
			<img
				className="h-4 w-4"
				alt="expand"
				src="https://lm-opt-bucket.s3.amazonaws.com/expand-svgrepo-com.svg"
			/>
		</button>
	);
};

const ExamplesComponent = ({
	project,
	setProject,
	
	inputCode,
	currentConfig,
	setCommentingIndex,
	setViewingCommentsIndex,
}) => {
	const [expandedView, setExpandedView] = useState(null);
	const projectRef = React.useRef(project);
	const { getToken } = useAuth();

	useEffect(() => {
		projectRef.current = project;
	}, [project]);

	const approveExample = (index) => {
		// update status in example index current config
		const updatedExamples = project.examples.map((example, i) => {
			if (i === index) {
				return {
					...example,
					[currentConfig]: {
						...example[currentConfig],
						status: "approved",
					},
				};
			}
			return example;
		});

		setProject({ ...project, examples: updatedExamples });
	};

	const rejectExample = (index) => {
		// update status in example index current config
		const updatedExamples = project.examples.map((example, i) => {
			if (i === index) {
				return {
					...example,
					[currentConfig]: {
						...example[currentConfig],
						status: "rejected",
					},
				};
			}
			return example;
		});


		setProject({ ...project, examples: updatedExamples });
	};

	const runTest = async (index) => {
		
		// Step 1: Fetch rewrite
		const token = await getToken();

		const fetchRewriteStringFn = `
			const fetchProxy = async (url, options) => {
				const chatApiUrl = "https://m6oq29rs3e.execute-api.us-east-1.amazonaws.com/proxy";
				const body = {
					url,
					options,
				}

				return fetch(chatApiUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": "Bearer ${token}",
					},
					body: JSON.stringify(body)
				});
			};`;


		// Step 2: Evaluate the fetch rewrite and input code
		let inputFn;

		try {
			// rewrite fetch to fetchProxy
			const ic = project.inputCodes.find((config) => config.name === currentConfig).inputCode;
			
			const inputCode = ic.replace(/fetch/g, "fetchProxy");

			inputFn = new Function(fetchRewriteStringFn + inputCode + " return fn;")();

			if (typeof inputFn !== "function") {
				throw new Error("Input code must export a function.");
			} else if (inputFn.length !== project.inputSchema.length) {
				throw new Error(`Input function must accept ${project.inputSchema.length} arguments.`);
			} else if (inputFn.name !== "fn") {
				throw new Error("Input function must be named 'fn'.");
			} 
		} catch (error) {
			console.error("Failed to evaluate input code:", error);
			alert(error.message);
			return null;
		}

		// Step 3: Call the fn
		let response, result, error;

		try {
			console.log("Running test for example:", index);
			
			// given the order of args in the input schema, put the values from .input in the correct order
			const inputs = project.inputSchema.map((field) => project.examples[index].input[field.name]);

			console.log("Inputs:", inputs);
			({ response, result, error } = await inputFn.apply(null, inputs));
		} catch (e) {
			console.error("Failed to send request:", e);
			alert(e.message);
			return null;
		}

		console.log("Result:", result);

		const newResult = {
			output: response,
			parsedOutput: result,
			error: error,
			timestamp: Date.now(),
			status: "unknown",
		};

		// step 4: Put the result in the example under the config name
		const updatedExamples = projectRef.current.examples.map((example, i) => {
			if (i === index) {
				return {
					...example,
					[currentConfig]: newResult,
				};
			}
			return example;
		});

		console.log("Updated examples:", updatedExamples);

		setProject({ ...projectRef.current, examples: updatedExamples });
	};

	console.log("Project:", project);

	const runAllTests = async () => {
		for (let index = 0; index < project.examples.length; index++) {
			if ((await runTest(index)) === null) break;
			await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before running the next test
		}
	};

	const runUnknownTests = async () => {
		for (let index = 0; index < project.examples.length; index++) {

			if (!project.examples[index][currentConfig]) {
				console.log("Running test for example:", index);
				if ((await runTest(index)) === null) break;
				await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before next iteration
			}
		}
	};

	const optimizePrompt = () => {
		console.log("Optimizing prompt");
	};

	const optimizeTokens = () => {
		console.log("Optimizing for tokens");
	};

	const addExample = () => {
		const newExample = {
			input: project.inputSchema.reduce((acc, field) => {
				acc[field.name] = field.type === "boolean" ? false : "";
				return acc;
			}, {}),
			expectedOutput: "",
		};

		setProject({
			...project,
			examples: [...project.examples, newExample],
		});
	};

	const deleteExample = (index) => {
		// remove the example from the examples array
		const newExamples = project.examples.filter((_, i) => i !== index);

		setProject({ ...project, examples: newExamples});
	};

	const closeOnOutsideClick = (e) => {
		console.log("Clicked", e.target);

		// Check if the clicked target is inside the `.fixed` element
		if (e.target.closest(".fixed")) {
			console.log("Clicked inside");
			return; // Do nothing if clicked inside
		}

		console.log("Clicked outside");
		setExpandedView(null); // Close the view if clicked outside
	};

	useEffect(() => {
		let timeoutId;
		if (expandedView) {
			timeoutId = setTimeout(() => {
				document.addEventListener("click", closeOnOutsideClick);
			}, 100);
		} else {
			document.removeEventListener("click", closeOnOutsideClick);
		}

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("click", closeOnOutsideClick);
		};
	}, [expandedView]);

	const handleExpandView = (value) => {
		setExpandedView(value);
	};

	const closeExpandedView = () => {
		setExpandedView(null);
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-6 pr-0 pb-48 mb-8 overflow-x-auto">
			<h2 className="text-2xl font-semibold mb-4 text-gray-700">
				Examples
			</h2>
			<div className="min-w-max">
				<table className="w-full border-collapse">
					<thead>
						<tr className="bg-gray-200">
							{project.inputSchema.map((field) => (
								<th
									key={field.name}
									className="border p-2 text-left whitespace-nowrap"
								>
									{field.name}
								</th>
							))}
							<th className="border p-2 text-left whitespace-nowrap">
								Output
							</th>
							<th className="border p-2 text-left whitespace-nowrap">
								Comments
							</th>
						</tr>
					</thead>
					<tbody>
						{project.examples.map((example, index) => (
							<ExampleComponent
								key={index}
								example={example}
								index={index}
								project={project}
								setProject={setProject}
								currentConfig={currentConfig}
							
								handleExpandView={handleExpandView}
								runTest={runTest}
								deleteExample={deleteExample}
								setCommentingIndex={setCommentingIndex}
								setViewingCommentsIndex={
									setViewingCommentsIndex
								}
								approveExample={approveExample}
								rejectExample={rejectExample}
							/>
						))}
					</tbody>
				</table>
			</div>
			<button
				className="bg-blue-500 text-white mb-10 px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 mt-4 flex items-center mx-auto"
				onClick={addExample}
			>
				<FaPlus className="mr-2" /> Add Example
			</button>
			<div className="flex space-x-4">
				<button
					className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 flex items-center `}
					onClick={runUnknownTests}
				>
					<FaPlay className="mr-2" /> Run Tests
				</button>
				<button
					className={`bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition duration-200 flex items-center ${
						true ? "opacity-50 cursor-not-allowed" : ""
					}`}
					onClick={optimizePrompt}
					disabled={true}
				>
					<FaMagic className="mr-2" /> Optimize Prompt
				</button>
				<button
					className={`bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition duration-200 flex items-center ${
						true ? "opacity-50 cursor-not-allowed" : ""
					}`}
					onClick={optimizeTokens}
					disabled={true}
				>
					<FaCoins className="mr-2" /> Optimize for Tokens
				</button>
			</div>
			{expandedView !== null && (
				<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
					<div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">
								Expanded View
							</h2>
							<button
								className="text-gray-500 hover:text-gray-700"
								onClick={closeExpandedView}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-6 w-6"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
						</div>
						<div className="space-y-4">
							{typeof expandedView === "string" ? (
								<pre className="whitespace-pre-wrap text-lg overflow-x-auto bg-gray-100 p-4 rounded">
									{expandedView}
								</pre>
							) : (
								<>
									{expandedView.error && (
										<>
											<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
												<h3 className="font-bold mb-2">
													Error:
												</h3>
												<pre className="whitespace-pre-wrap">
													{expandedView.error}
												</pre>
											</div>
											{(expandedView.parsedOutput ||
												expandedView.output) && (
												<hr className="border-t-2 border-red-300" />
											)}
										</>
									)}
									{expandedView.parsedOutput && (
										<>
											<div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
												<h3 className="font-bold mb-2">
													Parsed Output:
												</h3>
												<pre className="whitespace-pre-wrap">
													{JSON.stringify(
														expandedView.parsedOutput,
														null,
														2
													)}
												</pre>
											</div>
											{expandedView.output && (
												<hr className="border-t-2 border-green-300" />
											)}
										</>
									)}
									{expandedView.output && (
										<div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
											<h3 className="font-bold mb-2">
												Raw Output:
											</h3>
											<pre className="whitespace-pre-wrap">
												{expandedView.output}
											</pre>
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ExamplesComponent;
