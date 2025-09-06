import { FaSave, FaExclamationTriangle, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa'; // Import necessary icons

const SaveButton = ({ saveStatus, onSave }) => {
  return (
    <button 
      className="btn-primary flex items-center" 
      onClick={onSave} 
      disabled={saveStatus === 'saving'}
    >
      {saveStatus === 'unsaved' && (
        <>
          <FaExclamationTriangle className="mr-2 text-red-500" />
          Unsaved
        </>
      )}
      {saveStatus === 'saving' && (
        <>
          <FaSpinner className="mr-2 animate-spin" />
          Saving...
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <FaCheck className="mr-2 text-green-500" />
          Saved
        </>
      )}
      {saveStatus === 'error' && (
        <>
          <FaTimes className="mr-2 text-red-500" />
          Error Saving
        </>
      )}
      {/* Default Save Icon if not unsaved, saving, saved, or error */}
      {(saveStatus === 'unsaved' || saveStatus === 'saved') && <FaSave className="ml-2" />}
    </button>
  );
};

export default SaveButton;