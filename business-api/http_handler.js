import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { authMiddleware } from "auth-sdk";
import { monitorOnce } from "./testing/api_tester.js";

const app = express();

/**
 * Add the JSON body parser middleware to Express.js, and CORS middleware to
 * allow cross-origin requests from the browser.
 */
app.use(cors());
app.use(express.json());

// Monitor once endpoint - placed before auth middleware to bypass authentication
app.post("/monitor-once", async (req, res) => {
	try {
		const result = await monitorOnce();
		res.json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to monitor once" });
	}
});

/**
 * Adds the authentication middleware from the auth-sdk. This middleware
 * validates the JWT token in the Authorization header of the incoming request
 * and throws a UnauthorizedError if the token is invalid.
 */
app.use(authMiddleware());

app.use((req, res, next) => {
	return res.status(404).json({
		error: "Not Found",
	});
});

app.use((err, req, res, next) => {
	console.error(err);
	if (err.name === "UnauthorizedError") {
		return res.status(401).json({ error: "Invalid token value" });
	} else {
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

/*
app.listen(3000, () => {
	console.log(
		"Server is running on port 3000. Localhost: http://localhost:3000"
	);
});*/

export const handler = serverless(app);
