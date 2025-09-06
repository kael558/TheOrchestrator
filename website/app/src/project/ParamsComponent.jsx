import React, { useState } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { FaEllipsisV } from "react-icons/fa";
import { hashObject } from "../Helpers";

const ParamsComponent = ({
	project,
	setProject,
	selectedConfig,
	setSelectedConfig,
}) => {
	const [showMenu, setShowMenu] = useState(false);

	const { payloadParams, metadata, results, examples } = project;

	const handleInputChange = (modelName, key, value) => {
		const updatedParams = payloadParams.map((model) => {
			if (model.name === modelName) {
				return {
					...model,
					parameters: {
						...model.parameters,
						[key]: { ...model.parameters[key], value },
					},
				};
			}
			return model;
		});

		setProject({ ...project, payloadParams: updatedParams });
	};

	// check if the model is used in results
	const selectedConfigHash = "" + hashObject(selectedConfig);

	let hasResults = false;
	let chartData = {};
	payloadParams.forEach((model) => {
		const configHash = hashObject(model.name);
		chartData[configHash] = {
			name: model.name,
			approved: 0,
			rejected: 0,
			unknown: 0,
		};
	});

	Object.entries(results).forEach(([key, value]) => {
		const [configHash, paramHash, inputHash] = key.split("_");

		if (selectedConfigHash === configHash) {
			hasResults = true;
		}

		if (chartData[Number(configHash)]) {
			const status = value.status;
			chartData[configHash][status]++;
		} else {
			//console.error("Model not found", modelHash);
		}
	});

	const sortedChartData = Object.values(chartData).sort((a, b) => {
		const approvedDiff = b.approved - a.approved;
		if (approvedDiff !== 0) return approvedDiff;
		const rejectedDiff = a.rejected - b.rejected;
		if (rejectedDiff !== 0) return rejectedDiff;
		return b.unknown - a.unknown;
	});

	const renderInput = (modelName, key, config) => {
		switch (config.type) {
			case "string":
			case "array":
				let value = config.value;
				if (typeof value === "object" || Array.isArray(value)) {
					value = JSON.stringify(value, null, 2);
				}

				return (
					<textarea
						className={`w-full p-2 border rounded ${
							hasResults ? "cursor-not-allowed" : ""
						}`}
						value={value.replace(/\\n/g, "\n")}
						disabled={hasResults}
						onChange={(e) => {
							try {
								let inputValue = e.target.value.replace(
									/("(?:(?!")[^\\]|\\.)*")/g,
									function (match) {
										return match.replace(
											/[\n\r]/g,
											function (nl) {
												return nl === "\n"
													? "\\n"
													: "\\r";
											}
										);
									}
								);

								inputValue = JSON.stringify(
									inputValue,
									null,
									2
								);

								console.log(inputValue);

								const parsedValue = JSON.parse(inputValue);
								console.log(typeof parsedValue);
								handleInputChange(modelName, key, parsedValue);
							} catch (error) {
								console.error("Invalid JSON format:", error);
							}
						}}
						rows={value.length > 100 ? 5 : 2}
					/>
				);
			case "number":
			case "boolean":
				return (
					<input
						type="number"
						className={`w-full p-2 border rounded ${
							hasResults ? "cursor-not-allowed" : ""
						}`}
						value={config.value}
						disabled={hasResults}
						onChange={(e) =>
							handleInputChange(modelName, key, e.target.value)
						}
						min={config.minimum}
						max={config.maximum}
						step="0.1"
					/>
				);

			default:
				return null;
		}
	};

	const handleDuplicate = (modelToDuplicate) => {
		const newModel = JSON.parse(JSON.stringify(modelToDuplicate));
		// Increment number surrounded by ()
		const regex = /\((\d+)\)/;
		const match = newModel.name.match(regex);
		if (match) {
			const number = parseInt(match[1]) + 1;
			newModel.name = newModel.name.replace(regex, `(${number})`);
		} else {
			newModel.name = `${newModel.name} (1)`;
		}

		const updatedParams = [...payloadParams, newModel];
		onParamChange(updatedParams);
	};

	return (
		<div className="container bg-white rounded-lg shadow-md p-6 mb-8">
			<div className="mb-8" style={{ width: "100%" }}>
				<ResponsiveContainer width="100%" height={500}>
					<BarChart
						layout="vertical"
						data={sortedChartData}
						margin={{ left: 100 }}
					>
						<XAxis type="number" />
						<YAxis
							dataKey="name"
							type="category"
							width={100}
							onClick={(data) => setSelectedConfig(data.value)}
							tick={(props) => {
								const { x, y, payload } = props;
								return (
									<g transform={`translate(${x},${y})`}>
										<text
											x={0}
											y={0}
											dy={5}
											textAnchor="end"
											fill="#666"
											style={{
												cursor: "pointer",
												transition: "fill 0.3s",
											}}
											onMouseEnter={(e) => {
												e.target.style.fill = "#000";
												e.target.style.fontWeight =
													"bold";
											}}
											onMouseLeave={(e) => {
												e.target.style.fill = "#666";
												e.target.style.fontWeight =
													"normal";
											}}
										>
											{payload.value}
										</text>
									</g>
								);
							}}
						/>
						<Tooltip />
						<Legend
							onClick={(data) => setSelectedConfig(data.value)}
						/>
						<Bar dataKey="approved" stackId="a" fill="#4CAF50" />
						<Bar dataKey="rejected" stackId="a" fill="#F44336" />
						<Bar dataKey="unknown" stackId="a" fill="#FFC107" />
					</BarChart>
				</ResponsiveContainer>
			</div>
			<div className="flex">
				<div className="w-1/5 pr-4 border-r-2">
					<h3 className="text-xl font-semibold mb-4">
						Configurations
					</h3>
					<ul>
						{payloadParams.map((model, index) => (
							<li
								key={index}
								className={`cursor-pointer p-2 ${
									selectedConfig === model.name
										? "bg-blue-100"
										: ""
								}`}
								onClick={() => setSelectedConfig(model.name)}
							>
								{model.name}
							</li>
						))}
					</ul>
				</div>
				<div className="pl-5">
					{payloadParams.map(
						(config) =>
							config.name === selectedConfig && (
								<div key={config.name} className="relative">
									<div className="absolute top-0 right-0 p-2">
										<button
											className="px-2 py-1  text-gray-600 hover:text-gray-800"
											onClick={() =>
												setShowMenu(!showMenu)
											}
										>
											<FaEllipsisV />
										</button>
										{showMenu && (
											<div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
												<div
													className="py-1"
													role="menu"
													aria-orientation="vertical"
													aria-labelledby="options-menu"
												>
													<button
														className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
														onClick={() => {
															handleDuplicate(
																config
															);
															setShowMenu(false);
														}}
													>
														Duplicate
													</button>
													<button
														className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
														onClick={() => {
															handleDelete(
																config
															);
															setShowMenu(false);
														}}
													>
														Delete
													</button>
												</div>
											</div>
										)}
									</div>
									<h3 className="text-xl font-semibold mb-4">
										{config.model}
									</h3>
									<div className="mb-4">
										<p>
											<strong>Provider:</strong>{" "}
											{metadata[config.model].provider}
										</p>
										<p>
											<strong>Developer:</strong>{" "}
											{metadata[config.model].developer}
										</p>
										<p>
											<strong>Description:</strong>{" "}
											{metadata[config.model].description}
										</p>
										<p>
											<strong>Cost:</strong> Input: $
											{metadata[config.model].cost.input}
											/1M tokens, Output: $
											{metadata[config.model].cost.output}
											/1M tokens
										</p>
									</div>

									{Object.entries(config.parameters).map(
										([key, parameter]) => (
											<div key={key} className="mb-4">
												<label className="block font-semibold mb-1">
													{key}
												</label>
												<p className="text-sm text-gray-600 mb-1">
													{parameter.description}
												</p>
												{renderInput(
													config.model,
													key,
													parameter
												)}
											</div>
										)
									)}
								</div>
							)
					)}
				</div>
			</div>
		</div>
	);
};

export default ParamsComponent;
