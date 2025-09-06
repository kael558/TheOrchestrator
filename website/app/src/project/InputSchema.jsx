import { FaPlus, FaTrash } from "react-icons/fa";


const InputSchemaComponent = ({ project, setProject }) => {

    const handleSchemaChange = (index, field, value) => {
        const newSchema = [...project.inputSchema];
        newSchema[index] = { ...newSchema[index], [field]: value };
        setProject({ ...project, inputSchema: newSchema });
      };
    
      const addSchemaField = () => {
        setProject({
          ...project,
          inputSchema: [
            ...project.inputSchema,
            { name: `field${project.inputSchema.length + 1}`, type: "string" },
          ],
        });
      };
    
      const deleteSchemaField = (index) => {
        const newSchema = project.inputSchema.filter((_, i) => i !== index);
        setProject({ ...project, inputSchema: newSchema });
      };

  return (
    <div className="container bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">
        Input Schema
      </h2>
      {project.inputSchema.map((field, index) => (
        <div key={index} className="flex items-center space-x-2 mb-3">
          <input
            type="text"
            className="border rounded-md p-2 flex-grow"
            placeholder="Field Name"
            value={field.name}
            onChange={(e) => handleSchemaChange(index, "name", e.target.value)}
          />
          <select
            className="border rounded-md p-2"
            value={field.type}
            onChange={(e) => handleSchemaChange(index, "type", e.target.value)}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
          {field.type === "number" && (
            <>
              <input
                type="number"
                className="border rounded-md p-2 w-20"
                placeholder="Min"
                value={field.min != 0 ? field.min : 0}
                onChange={(e) =>
                  handleSchemaChange(index, "min", e.target.value)
                }
              />
              <input
                type="number"
                className="border rounded-md p-2 w-20"
                placeholder="Max"
                value={field.max || ""}
                onChange={(e) =>
                  handleSchemaChange(index, "max", e.target.value)
                }
              />
            </>
          )}
          <button
            className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition duration-200"
            onClick={() => deleteSchemaField(index)}
          >
            <FaTrash />
          </button>
        </div>
      ))}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 flex items-center"
        onClick={addSchemaField}
      >
        <FaPlus className="mr-2" /> Add Field
      </button>
    </div>
  );
};

export default InputSchemaComponent;