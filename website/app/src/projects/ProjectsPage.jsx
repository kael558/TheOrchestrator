// ProjectsPage.js
import React from "react";
import { FaPlus } from "react-icons/fa";
import { useBusinessAPI } from "../services/BusinessProvider";
import Projects from "./Projects";

import { useAuth } from "../auth/AuthProvider";
import { useLoading } from "../services/LoadingProvider";

const ProjectsPage = () => {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8">Projects</h1>

			<Projects />
		</div>
	);
};

export default ProjectsPage;
