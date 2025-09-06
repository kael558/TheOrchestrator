// Projects.js
import React, { useEffect, useState } from "react";
import { FaPlus, FaExternalLinkAlt, FaTrash, FaShare } from "react-icons/fa";
import { useBusinessAPI } from "../services/BusinessProvider";
import { useLoading } from "../services/LoadingProvider";
import { useNavigate } from "react-router-dom";
const ProjectSkeleton = () => (
	<div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
		<div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
		<div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
		<div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
		<div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
		<div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
		<div className="flex justify-between items-center">
			<div className="h-4 bg-gray-200 rounded w-1/4"></div>
			<div className="flex">
				<div className="h-4 w-4 bg-gray-200 rounded-full mr-2"></div>
				<div className="h-4 w-4 bg-gray-200 rounded-full"></div>
			</div>
		</div>
	</div>
);

const ErrorMessage = ({ message, onRetry }) => (
	<div className="text-center py-12">
		<h2 className="text-2xl font-semibold mb-4 text-red-600">Error</h2>
		<p className="text-gray-600 mb-6">{message}</p>
		<button
			onClick={onRetry}
			className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
		>
			Retry
		</button>
	</div>
);

const Projects = ({}) => {
	const {
		createProject,
		getProjectsByOwner,
		getProjectsSharedWithYou,
		deleteProject,
		shareProject,
	} = useBusinessAPI();
	const [ownedProjects, setOwnedProjects] = useState([]);
	const [sharedProjects, setSharedProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	const { showLoading, hideLoading } = useLoading();
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchProjects();
	}, []);

	const fetchProjects = async () => {
		try {
			setLoading(true);
			setError(null);
			const [fetchedOwnedProjects, fetchedSharedProjects] =
				await Promise.all([
					getProjectsByOwner(),
					getProjectsSharedWithYou(),
				]);
			setOwnedProjects(fetchedOwnedProjects);
			setSharedProjects(fetchedSharedProjects);
		} catch (err) {
			setError("Failed to fetch projects");
		} finally {
			setLoading(false);
		}
	};

	const handleCreateProject = async () => {
		try {
			showLoading();
			const newProject = await createProject({
				name: "New Project",
				examples: [],
				configurations: [],
				inputSchema: [],
			});

			console.log(newProject);
			navigate(`/projects/${newProject.projectId}`);
		} catch (err) {
			console.error("Failed to create project", err);
		} finally {
			hideLoading();
		}
	};

	const handleDeleteProject = async (projectId) => {
		try {
			await deleteProject(projectId);
			setOwnedProjects(
				ownedProjects.filter(
					(project) => project.projectId !== projectId
				)
			);
		} catch (err) {
			console.error(err);
			setError("Failed to delete project");
		}
	};

	const handleShareProject = async (projectId) => {
		const userEmail = prompt(
			"Enter the email of the user you want to share with:"
		);
		if (userEmail) {
			try {
				await shareProject(projectId, userEmail);
				fetchProjects();
			} catch (err) {
				setError("Failed to share project");
			}
		}
	};

	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{[...Array(6)].map((_, index) => (
					<ProjectSkeleton key={index} />
				))}
			</div>
		);
	}

	if (error) {
		return <ErrorMessage message={error} onRetry={fetchProjects} />;
	}

	const renderProjects = (projects, isShared = false) => {
		if (projects.length === 0) {
			return (
				<div className="text-center py-12">
					<h2 className="text-2xl font-semibold mb-4">
						No Projects {isShared ? "Shared With You" : "Yet"}
					</h2>
					<p className="text-gray-600 mb-6">
						{isShared
							? "No one has shared any projects with you yet."
							: "Get started by creating your first project!"}
					</p>
				</div>
			);
		}

		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{projects.map((project) => (
					<div
						key={project.id}
						className="bg-white rounded-lg shadow-md p-6"
					>
						<h2 className="text-xl font-semibold mb-2">
							{project.name}
						</h2>
						<p className="text-gray-600 mb-4">
							Examples: {project.examples.length}
						</p>
						<p className="text-sm text-gray-500 mb-2">
							Created:{" "}
							{new Date(project.createdAt).toLocaleDateString()}
						</p>
						<p className="text-sm text-gray-500 mb-4">
							Updated:{" "}
							{new Date(project.updatedAt).toLocaleDateString()}
						</p>
						{!isShared && (
							<p className="text-sm text-gray-500 mb-4">
								Shared with:{" "}
								{project.sharedWithUserEmails.join(", ")}
							</p>
						)}
						<div className="flex justify-between items-center">
							<a
								href={`/projects/${project.projectId}`}
								className="text-blue-500 hover:text-blue-600 inline-flex items-center"
							>
								View Details
								<FaExternalLinkAlt className="ml-1" />
							</a>
							{!isShared && (
								<div>
									<button
										onClick={() =>
											handleShareProject(
												project.projectId
											)
										}
										className="text-green-500 hover:text-green-600 mr-2"
									>
										<FaShare />
									</button>
									<button
										onClick={() =>
											handleDeleteProject(
												project.projectId
											)
										}
										className="text-red-500 hover:text-red-600"
									>
										<FaTrash />
									</button>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		);
	};

	return (
		<div>
			<div className="mb-12">
				<h1 className="text-2xl font-semibold mb-6">Your Projects</h1>
				{renderProjects(ownedProjects)}

				<div className="mt-8 text-center">
					<button
						onClick={handleCreateProject}
						className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
					>
						<FaPlus className="mr-2" />
						Create New Project
					</button>
				</div>
			</div>
			<div>
				<h1 className="text-2xl font-semibold mb-6">
					Projects Shared With You
				</h1>
				{renderProjects(sharedProjects, true)}
			</div>
		</div>
	);
};

export default Projects;
