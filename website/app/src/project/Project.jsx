import React, { useEffect, useState, useRef } from "react";
import {
	FaPlus,
	FaTrash,
	FaPlay,
	FaMagic,
	FaCoins,
	FaShare,
	FaArrowLeft,
	FaComment,
	FaEye,
	FaEllipsisV,
} from "react-icons/fa";
import { useBusinessAPI } from "../services/BusinessProvider";
import { useParams, Link } from "react-router-dom";
//import ParamsComponent from "./ParamsComponent";

import ConfigDetails from "./ConfigDetails";
import RequestComponent from "./RequestComponent";
import ExamplesComponent from "./ExamplesComponent";

import { useLocalStorage } from "../services/StorageProvider";
import { useQuery, useMutation, useQueryClient } from "react-query";

import SaveButton from "./SaveButton";
import { debounce } from "lodash"; // You can use lodash for debouncing
import InputSchemaComponent from "./InputSchema";
import Leaderboard from "./Leaderboard";
import Deploy from "./Deploy";

const useProject = (projectId) => {
	const { getProjectById } = useBusinessAPI();
	const [localProject, setLocalProject] = useState(null);

	const query = useQuery(
		["project", projectId],
		async () => {
			const projectData = await getProjectById(projectId);

			// xhexk if inputCodes
			if (!projectData.inputCodes) {
				projectData.inputCodes = [];
				projectData?.payloadParams.forEach((param) => {
					projectData.inputCodes.push({
						name: param.name,
						model: param.model,
						inputCode: "",
					});
				});

				// delete payloadParams
				delete projectData.payloadParams;
			}

			delete projectData.results;

			return projectData;
		},
		{
			staleTime: Infinity, // Adjust as needed
			cacheTime: Infinity, // Adjust as needed
		}
	);

	useEffect(() => {
		if (query.data) {
			setLocalProject(query.data);
		}
	}, [query.data]);

	return {
		...query,
		project: localProject,
		setProject: setLocalProject,
	};
};
const Project = () => {
	const { deleteProject, shareProject, saveProject } = useBusinessAPI();
	const { projectId } = useParams();
	const queryClient = useQueryClient();

	const { project, setProject, isLoading, error } = useProject(projectId);

	const deleteMutation = useMutation(deleteProject, {
		onSuccess: () => {
			queryClient.invalidateQueries(["project", projectId]);
		},
	});

	const shareMutation = useMutation(shareProject, {
		onSuccess: () => {
			queryClient.invalidateQueries(["project", projectId]);
		},
	});

	const saveMutation = useMutation(saveProject, {
		onSuccess: () => {
			queryClient.invalidateQueries(["project", projectId]);
		},
	});

	const [saveStatus, setSaveStatus] = useState("saved");
	const isInitialLoad = useRef(true); // Ref to track initial load

	const [isEditingName, setIsEditingName] = useState(false);
	const [commentingIndex, setCommentingIndex] = useState(null);
	const [viewingCommentsIndex, setViewingCommentsIndex] = useState(null);
	const [newComment, setNewComment] = useState("");
	const [currentConfig, setCurrentConfig] = useLocalStorage(
		"currentConfig",
		"Llama 3.3 70B Versatile"
	);

	// Loading states for operations
	const [isRunningTests, setIsRunningTests] = useState(false);
	const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);

	// Autosave
	useEffect(() => {
		const debouncedSave = debounce(async () => {
			await handleSave();
		}, 10000);

		if (!isInitialLoad.current) {
			console.log("Project changed, saving...");
			setSaveStatus("unsaved");
		} else {
			isInitialLoad.current = false;
		}

		debouncedSave(); // Call the debounced function

		// Clean up function
		return () => {
			debouncedSave.cancel(); // Cancel the debounce on unmount
		};
	}, [project]); // Only depend on project

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>An error occurred: {error.message}</div>;
	if (!project) return null;

	console.log("Project", project);
	console.log("Current Config", currentConfig);

	const inputCode = project.inputCodes.find(
		(config) => config.name === currentConfig
	).inputCode;

	const handleNameChange = (e) => {
		setProject({ ...project, name: e.target.value });
	};

	const toggleNameEdit = () => {
		setIsEditingName(!isEditingName);
	};

	const addComment = () => {
		alert("Not implemented yet");
		const value = newComment.trim();
		if (!value) return;

		setNewComment("");
		setCommentingIndex(null);
	};

	const handleShare = async () => {
		const email = prompt("Enter the email address to share with:");
		if (email) {
			try {
				await shareProject(projectId, email);
				alert("Project shared successfully!");
			} catch (error) {
				console.error("Failed to share project:", error);
				alert("Failed to share project. Please try again.");
			}
		}
	};

	const handleSave = async () => {
		// get exact time in DD:minutes:seconds
		const date = new Date();
		const time = date.toLocaleTimeString("en-US", { hour12: false });
		console.log("Saving project...", saveStatus, time);

		if (saveStatus === "saving" || saveStatus === "saved") {
			return;
		}

		setSaveStatus("saving");
		try {
			console.log(project);
			await saveProject(projectId, project);
			setSaveStatus("saved");
		} catch (error) {
			console.error("Failed to save project:", error);
			setSaveStatus("error");
		}
	};

	return (
		<div className="bg-gray-100 min-h-screen">
			<header className="bg-white shadow-sm py-6">
				<div className="container mx-auto px-4 flex justify-between items-center">
					<Link
						to="/projects"
						className="text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center"
					>
						<FaArrowLeft className="mr-2" />
						<span className="font-medium">Back</span>
					</Link>

					<div className="flex-grow text-center">
						{isEditingName ? (
							<input
								type="text"
								value={project.name}
								onChange={handleNameChange}
								onBlur={toggleNameEdit}
								onKeyPress={(e) =>
									e.key === "Enter" && toggleNameEdit()
								}
								className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none bg-transparent text-center w-full max-w-md"
								autoFocus
							/>
						) : (
							<h1
								className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-200"
								onClick={toggleNameEdit}
							>
								{project.name}
							</h1>
						)}
					</div>

					<div className="flex space-x-4">
						<button
							className="btn-primary flex items-center"
							onClick={handleShare}
						>
							<FaShare className="mr-2" />
							Share
						</button>

						<SaveButton
							saveStatus={saveStatus}
							onSave={handleSave}
						/>
					</div>
				</div>
			</header>
			<div className="mx-auto p-6">
				<InputSchemaComponent
					project={project}
					setProject={setProject}
				/>

				<Leaderboard
					project={project}
					setProject={setProject}
					selectedConfig={currentConfig}
					setSelectedConfig={setCurrentConfig}
				/>

				<ConfigDetails
					project={project}
					setProject={setProject}
					selectedConfig={currentConfig}
				/>

				<RequestComponent
					project={project}
					setProject={setProject}
					selectedConfig={currentConfig}
				/>
				<ExamplesComponent
					project={project}
					setProject={setProject}
					inputCode={inputCode}
					currentConfig={currentConfig}
					setCommentingIndex={setCommentingIndex}
					setViewingCommentsIndex={setViewingCommentsIndex}
					isRunningTests={isRunningTests}
					setIsRunningTests={setIsRunningTests}
					isOptimizingPrompt={isOptimizingPrompt}
					setIsOptimizingPrompt={setIsOptimizingPrompt}
					handleSave={handleSave}
				/>

				<Deploy project={project} />

				{commentingIndex !== null && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
						<div className="bg-white p-4 rounded-lg">
							<h3 className="text-lg font-bold mb-2">
								Add Comment
							</h3>
							<textarea
								className="w-full p-2 border rounded mb-2"
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								placeholder="Enter your comment here..."
							/>
							<div className="flex justify-end">
								<button
									className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-200 mr-2"
									onClick={() => alert("Not implemented yet")}
								>
									Add Comment
								</button>
								<button
									className="bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 transition duration-200"
									onClick={() => setCommentingIndex(null)}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				)}

				{viewingCommentsIndex !== null && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
						<div className="bg-white p-4 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
							<h3 className="text-lg font-bold mb-2">Comments</h3>

							<div className="flex justify-end mt-4">
								<button
									className="bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 transition duration-200"
									onClick={() =>
										setViewingCommentsIndex(null)
									}
								>
									Close
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Loading overlay for operations */}
				{(isRunningTests || isOptimizingPrompt) && (
					<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
						<div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center">
							<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								{isRunningTests
									? "Running Tests..."
									: "Optimizing Prompt..."}
							</h3>
							<p className="text-gray-600 text-center">
								{isRunningTests
									? "Please wait while we execute your tests. This may take a few moments."
									: "Please wait while we optimize your prompt. This may take a few moments."}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Project;
