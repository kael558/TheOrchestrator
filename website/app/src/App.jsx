import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./auth/LoginPage";
import RegistrationPage from "./auth/RegistrationPage";
import ProjectPage from "./project/Project";
import ProjectsPage from "./projects/ProjectsPage";
import Landing from "./app/Landing";

import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import AuthLayout from "./app/AuthLayout";
import { BusinessProvider } from "./services/BusinessProvider";
import { LoadingProvider } from "./services/LoadingProvider";

import { QueryClient, QueryClientProvider } from "react-query";

const AppRoutes = () => {
	return (
		<Routes>
			<Route path="/" element={<Landing />} />
			<Route element={<AuthLayout />}>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegistrationPage />} />
			</Route>
			<Route path="">
				<Route element={<ProtectedRoute loginPath="/login" />}>
					<Route
						path="/dashboard"
						element={<Navigate to="/projects" />}
					/>
					<Route path="/projects" element={<ProjectsPage />} />
					<Route
						path="/projects/:projectId"
						element={<ProjectPage />}
					/>
				</Route>
			</Route>
		</Routes>
	);
};

const queryClient = new QueryClient();

const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<BusinessProvider>
					<BrowserRouter>
						<LoadingProvider>
							<AppRoutes />
						</LoadingProvider>
					</BrowserRouter>
				</BusinessProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
};

export default App;
