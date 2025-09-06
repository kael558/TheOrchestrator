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

const Leaderboard = ({
	project,
	setProject,
	selectedConfig,
	setSelectedConfig,
}) => {
	const [showMenu, setShowMenu] = useState(false);

	const { inputCodes, metadata, examples } = project;

	let chartData = {};

	inputCodes.forEach((config) => {
        if (!chartData[config.name]) {
            chartData[config.name] = {
                name: config.name,
                approved: 0,
                rejected: 0,
                unknown: 0,
            };
        }

        examples.forEach((example) => {

            if (example[config.name] && example[config.name][example[selectedConfig]?.status]) {
                
                chartData[config.name][example[selectedConfig].status]++;
            }
        });
	});


	const sortedChartData = Object.values(chartData).sort((a, b) => {
		const approvedDiff = b.approved - a.approved;
		if (approvedDiff !== 0) return approvedDiff;
		const rejectedDiff = a.rejected - b.rejected;
		if (rejectedDiff !== 0) return rejectedDiff;
		return b.unknown - a.unknown;
	});

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
		</div>
	);
};

export default Leaderboard;
