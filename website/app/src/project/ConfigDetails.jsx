import React, { useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import { hashObject } from "../Helpers";

const ConfigDetails = ({
	project,
	setProject,
	selectedConfig,
	setSelectedConfig,
}) => {
	const [showMenu, setShowMenu] = useState(false);

	const { metadata, inputCodes } = project;



	const handleDuplicate = (config) => {
		const newConfig = JSON.parse(JSON.stringify(config));
		// Increment number surrounded by ()
		const regex = /\((\d+)\)/;
		const match = newConfig.name.match(regex);
		if (match) {
			const number = parseInt(match[1]) + 1;
			newConfig.name = newConfig.name.replace(regex, `(${number})`);
		} else {
			newConfig.name = `${newConfig.name} (1)`;
		}

        const updatedInputCodes = [...inputCodes, newConfig];
        setProject({ ...project, inputCodes: updatedInputCodes });
	};

	return (
		<div className="container bg-white rounded-lg shadow-md p-6 mb-8">
			
			<div className="flex">
				
				<div className="pl-5">
					{inputCodes.map(
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

								
								</div>
							)
					)}
				</div>
			</div>
		</div>
	);
};

export default ConfigDetails;
