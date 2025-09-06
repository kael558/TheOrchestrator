import React from "react";
import { Menu, Transition } from "@headlessui/react";
import "./ExampleComponent.css";

import {
	FaComment,
	FaEllipsisV,
	FaEye,
	FaPlay,
	FaTrash,
	FaCheck,
	FaTimes,
} from "react-icons/fa";
const ExampleMenu = ({
	index,
	runTest,
	results,
	deleteExample,
	setCommentingIndex,
	setViewingCommentsIndex,
	example,
	approveExample,
	rejectExample,
}) => (
	<Menu as="div" className="relative inline-block text-left">
		<div>
			<Menu.Button className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
				<FaEllipsisV />
			</Menu.Button>
		</div>
		<Transition
			enter="transition ease-out duration-100"
			enterFrom="transform opacity-0 scale-95"
			enterTo="transform opacity-100 scale-100"
			leave="transition ease-in duration-75"
			leaveFrom="transform opacity-100 scale-100"
			leaveTo="transform opacity-0 scale-95"
		>
			<Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
				<div className="px-1 py-1">
					<Menu.Item>
						{({ active }) => (
							<button
								className={`${
									active
										? "bg-blue-500 text-white"
										: "text-gray-900"
								} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
								onClick={() => runTest(index)}
							>
								<FaPlay className="mr-2" /> Run Test
							</button>
						)}
					</Menu.Item>
					<Menu.Item>
						{({ active }) => (
							<button
								className={`${
									active
										? "bg-blue-500 text-white"
										: "text-gray-900"
								} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
								onClick={() => deleteExample(index)}
							>
								<FaTrash className="mr-2" /> Delete
							</button>
						)}
					</Menu.Item>

					<Menu.Item>
						{({ active }) => (
							<button
								className={`${
									active
										? "bg-green-500 text-white"
										: "text-gray-900"
								} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
								onClick={() => approveExample(index)}
							>
								<FaCheck className="mr-2" /> Approve
							</button>
						)}
					</Menu.Item>
					<Menu.Item>
						{({ active }) => (
							<button
								className={`${
									active
										? "bg-red-500 text-white"
										: "text-gray-900"
								} group flex rounded-md items-center w-full px-2 py-2 text-sm`}
								onClick={() => rejectExample(index)}
							>
								<FaTimes className="mr-2" /> Reject
							</button>
						)}
					</Menu.Item>
				</div>
			</Menu.Items>
		</Transition>
	</Menu>
);

const ExampleComponent = ({
	example,
	currentConfig,
	index,
	project,
	setProject,
	handleExpandView,
	runTest,
	deleteExample,
	setCommentingIndex,
	setViewingCommentsIndex,
	approveExample,
	rejectExample,
}) => {
	const results = example[currentConfig] || {};


	const getRowBackgroundColor = () => {
		if (results?.status === "rejected") return "bg-red-100";
		if (results?.status === "approved") return "bg-green-100";
		return "bg-orange-100";
	};

	const getRowHoverColor = () => {
		
		if (results?.status === "rejected") return "hover:bg-red-200";
		if (results?.status === "approved") return "hover:bg-green-200";
		return "hover:bg-orange-200";
	};

	const getCellHoverColor = (important = false) => {
		if (results?.status === "rejected")
			return (
				"hover:bg-red-300 " + (important ? "bg-red-300" : "bg-red-100")
			);
		if (results?.status === "approved")
			return (
				"hover:bg-green-300 " +
				(important ? "bg-green-300" : "bg-green-100")
			);

		return (
			"hover:bg-orange-300 " +
			(important ? "bg-orange-300" : "bg-orange-100")
		);
	};

	let exampleOutput = {};
	if (results?.error) {
		exampleOutput["error"] = results.error;
	} else if (results?.parsedOutput) {
		exampleOutput["parsedOutput"] = results.parsedOutput;
	}

	if (results?.output) {
		exampleOutput["output"] = results.output;
	}

	return (
		<tr className={`${getRowHoverColor()} `}>
			{project.inputSchema.map((field) => (
				<td
					key={field.name}
					className={`border-2 p-2 relative ${getCellHoverColor()} group`}
					onClick={() => handleExpandView(example.input[field.name])}
				>
					<textarea
						className="w-full p-1 border rounded min-h-[2.5rem] bg-transparent resize-none hover:bg-opacity-30"
						value={example.input[field.name]}
						onChange={(e) => {
							const newExamples = [...project.examples];
							newExamples[index].input[field.name] =
								field.type === "number"
									? Number(e.target.value)
									: e.target.value;
							setProject({ ...project, examples: newExamples });
						}}
						onClick={(e) => e.stopPropagation()}
					/>
				</td>
			))}

			<td
				className={`border-2 p-2 relative ${getCellHoverColor(
					true
				)} cursor-pointer bg-gree`}
				onClick={() => handleExpandView(exampleOutput)}
			>
				<pre className="whitespace-pre-wrap text-sm max-h-40 overflow-hidden text-ellipsis">
					<div className="overflow-hidden text-ellipsis">
						{JSON.stringify(
							results?.error ||
								results?.parsedOutput ||
								results?.output,
							null,
							2
						)}
					</div>
				</pre>
			</td>
			<td
				className={`border-2  p-2 relative ${getCellHoverColor(true)}`}
				onClick={() => handleExpandView(example.expectedOutput)}
			>
				<textarea
					className="w-full p-1 border rounded min-h-[2.5rem] bg-transparent resize-none hover:bg-opacity-30 ellipsis-textarea"
					value={example.expectedOutput}
					onChange={(e) => {
						const newExamples = [...project.examples];
						newExamples[index].expectedOutput = e.target.value;
						setProject({ ...project, examples: newExamples });
					}}
					onClick={(e) => e.stopPropagation()}
				/>
			</td>
			<td className="p-2">
				<ExampleMenu
					index={index}
					runTest={runTest}
					results={results}
					deleteExample={deleteExample}
					setCommentingIndex={setCommentingIndex}
					setViewingCommentsIndex={setViewingCommentsIndex}
					example={example}
					approveExample={approveExample}
					rejectExample={rejectExample}
				/>
			</td>
		</tr>
	);
};

export default ExampleComponent;
