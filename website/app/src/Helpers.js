export function hashObject(obj) {
	const str = JSON.stringify(obj);
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return hash;
}


export function hashExample(modelName, parameters, inputs) {
	return hashObject(modelName) + "_" + hashObject(parameters) + "_" + hashObject(inputs);
}



export function formatForJSON(obj) {
	return JSON.stringify(obj, null, 2);
}




export function evaluateTemplateLiteral(templateLiteral, variables) {
	const keys = Object.keys(variables);
	const values = Object.values(variables);
	return new Function(...keys, `return \`${templateLiteral}\`;`)(...values);
};