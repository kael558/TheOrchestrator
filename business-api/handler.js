import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { authMiddleware } from "auth-sdk";
import { createProject, deleteProject, getProjectById, getProjectsByOwner, getProjectsSharedWithYou, shareProject, updateProject} from "./database_interface.js";
import { metadata } from "configurations-sdk";


const app = express();

/**
 * Add the JSON body parser middleware to Express.js, and CORS middleware to
 * allow cross-origin requests from the browser.
 */
app.use(cors());
app.use(express.json());

/**
 * Adds the authentication middleware from the auth-sdk. This middleware
 * validates the JWT token in the Authorization header of the incoming request
 * and throws a UnauthorizedError if the token is invalid.
 */
app.use(authMiddleware());

// Create a new project
app.post("/projects", async (req, res) => {
  try {
    const userId = req.auth.userId; 
    const newProject = await createProject(userId);
    res.status(201).json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Get projects by owner
app.get("/projects/owner", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const projects = await getProjectsByOwner(userId);
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve projects" });
  }
});


// Get projects shared with the user
app.get("/projects/shared", async (req, res) => {
  try {
    const userEmail = req.auth.email; 
    const projects = await getProjectsSharedWithYou(userEmail);
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve shared projects" });
  }
});

// Get a project by ID
app.get("/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.auth.userId;
    const project = await getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // add metadata to the project
    project.metadata = metadata;

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve project" });
  }
});


// Share a project
app.post("/projects/:projectId/share", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userEmail } = req.body;
    const result = await shareProject(projectId, userEmail);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to share project" });
  }
});

// Delete a project
app.delete("/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    await deleteProject(projectId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Update a project
app.put("/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectData = req.body;
    const updatedProject = await updateProject(projectId, projectData);
    res.json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update project" });
  }
});



app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Invalid token" });
  } else {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



export const handler = serverless(app);

