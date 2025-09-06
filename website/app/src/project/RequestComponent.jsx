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
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-github';

const RequestComponent = ({
	project,
	setProject,
	selectedConfig,
}) => {

	const handleCodeChange = (newCode) => {
		const updatedInputCodes = project.inputCodes.map((config) => 
			config.name === selectedConfig ? { ...config, inputCode: newCode } : config
		);

		console.log(updatedInputCodes);
	
		setProject({ ...project, inputCodes: updatedInputCodes });
	};


	const hasResults = project.examples.some((example) => example[selectedConfig]?.status);



	return (
		<div className="container bg-white rounded-lg shadow-md p-6 mb-8">
		  <h2 className="text-2xl font-semibold mb-4 text-gray-700">Request</h2>
		  <div className="border rounded-lg overflow-hidden">
			<AceEditor
			  mode="javascript"
			  theme="github"
			  readOnly={hasResults}
			  value={project.inputCodes.find((config) => config.name === selectedConfig).inputCode}
			  onChange={handleCodeChange}
			  name="output-schema-editor"
			  editorProps={{ $blockScrolling: true }}
			  setOptions={{
				showLineNumbers: true,
				tabSize: 4,

			  }}
			  style={{
				width: '100%',
				height: '400px',
				fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
				fontSize: '14px',
			  }}
			/>
		  </div>
		</div>
	  );

};

export default RequestComponent;