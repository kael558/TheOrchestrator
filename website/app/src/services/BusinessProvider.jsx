import { createContext, useContext } from "react";
import { useAuth } from "../auth/AuthProvider";

const businessApiUrl = import.meta.env.VITE_BUSINESS_API_URL;
const streamApiUrl = import.meta.env.VITE_STREAM_API_URL;
const chatApiUrl = import.meta.env.VITE_CHAT_API_URL;

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
	const { getToken } = useAuth();

	const fetchWrapper = async (url, options) => {
		const response = await fetch(url, {
			...options,
			headers: {
				...options.headers,
				Authorization: `Bearer ${await getToken()}`,
			},
		});
		if (response.ok) {
			if (response.status === 204) {
				return null;
			}
			return response.json();
		} else if (response.status === 429) {
			// Handle 429 error specifically
			throw new Error("Quota exceeded. Please try again later."); // Custom error message
		} else {
			throw new Error(response.statusText);
		}
	};

	// Create a new project
	const createProject = async (projectData) => {
		return fetchWrapper(`${businessApiUrl}/projects`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(projectData),
		});
	};

	const saveProject = async (projectId, projectData) => {
		return fetchWrapper(`${businessApiUrl}/projects/${projectId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(projectData),
		});
	};

	// Get a project by ID
	const getProjectById = async (projectId) => {
		return fetchWrapper(`${businessApiUrl}/projects/${projectId}`, {
			method: "GET",
		});
	};

	// Get projects by owner
	const getProjectsByOwner = async () => {
		return fetchWrapper(`${businessApiUrl}/projects/owner`, {
			method: "GET",
		});
	};

	// Get projects shared with the user
	const getProjectsSharedWithYou = async () => {
		return fetchWrapper(`${businessApiUrl}/projects/shared`, {
			method: "GET",
		});
	};

	// Share a project
	const shareProject = async (projectId, userEmail) => {
		return fetchWrapper(`${businessApiUrl}/projects/${projectId}/share`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userEmail }),
		});
	};

	// Delete a project
	const deleteProject = async (projectId) => {
		return fetchWrapper(`${businessApiUrl}/projects/${projectId}`, {
			method: "DELETE",
		});
	};

	// Send a request
	const sendRequest = async (modelName, parameters) => {
		return fetchWrapper(`${chatApiUrl}/proxy`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ parameters }),
		});
	};

	// Optimize prompt
	const optimizePrompt = async (projectId, selectedConfig) => {
		return fetchWrapper(
			`${businessApiUrl}/projects/${projectId}/optimize-prompt`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ selectedConfig }),
			}
		);
	};

	const contextValue = {
		createProject,
		getProjectById,
		getProjectsByOwner,
		getProjectsSharedWithYou,
		shareProject,
		deleteProject,
		saveProject,
		sendRequest,
		optimizePrompt,
	};

	return (
		<BusinessContext.Provider value={contextValue}>
			{children}
		</BusinessContext.Provider>
	);
};

export const useBusinessAPI = () => {
	return useContext(BusinessContext);
};
