import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

const JsonToExcelConverter = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [fileName, setFileName] = useState('converted_data.xlsx');
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setJsonInput(e.target.result);
        setFileName(file.name.replace(/\.json$/i, '.xlsx') || 'converted_data.xlsx');
        setErrorMsg('');
        setStatusMsg(`${file.name} loaded.`);
      };
      reader.onerror = () => {
        setErrorMsg('Error reading file.');
        setStatusMsg('');
      };
      reader.readAsText(file);
    }
  }, []);

  const handleConvert = useCallback(() => {
    setErrorMsg('');
    setStatusMsg('');

    if (!jsonInput.trim()) {
      setErrorMsg('JSON input cannot be empty.');
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonInput);
    } catch (error) {
      setErrorMsg(`Invalid JSON format: ${error.message}`);
      return;
    }

    if (!Array.isArray(parsedData)) {
      // Try to handle a single object by wrapping it in an array
      if (typeof parsedData === 'object' && parsedData !== null) {
        parsedData = [parsedData];
      } else {
        setErrorMsg('Unsupported JSON structure. Please provide an array of objects or a single object.');
        return;
      }
    }

    if (parsedData.length === 0 && typeof parsedData[0] !== 'object') {
        //This case is for an empty array, which is valid JSON but won't make a useful Excel
        //However, json_to_sheet can handle an empty array and produce an empty sheet.
        //We could show a warning, but let's allow it.
        //If it's not an array of objects (e.g. array of strings/numbers), json_to_sheet will also handle it.
    }


    try {
      setStatusMsg('Converting...');
      const worksheet = XLSX.utils.json_to_sheet(parsedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, fileName);
      setStatusMsg('Conversion successful! Download should start automatically.');
      setJsonInput(''); // Clear input after successful conversion
    } catch (error) {
      setErrorMsg(`Conversion error: ${error.message}`);
      setStatusMsg('');
    }
  }, [jsonInput, fileName]);

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">JSON to Excel Converter</h1>
        <p className="text-gray-600 mt-2">
          Paste your JSON data or upload a JSON file to convert it into an Excel (.xlsx) file.
        </p>
      </header>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="jsonInput" className="block text-sm font-medium text-gray-700 mb-1">
            JSON Input:
          </label>
          <textarea
            id="jsonInput"
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setErrorMsg('');
              setStatusMsg('');
            }}
            placeholder='[{"name":"John Doe", "age":30}, {"name":"Jane Doe", "age":28}]'
            rows="10"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-1">
            Or Upload JSON File:
          </label>
          <input
            type="file"
            id="fileInput"
            accept=".json"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100"
          />
        </div>

        <div className="mb-4">
            <label htmlFor="fileNameInput" className="block text-sm font-medium text-gray-700 mb-1">
                Output File Name:
            </label>
            <input
                type="text"
                id="fileNameInput"
                value={fileName}
                onChange={(e) => setFileName(e.target.value.endsWith('.xlsx') ? e.target.value : `${e.target.value}.xlsx`)}
                placeholder="converted_data.xlsx"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={handleConvert}
            disabled={!jsonInput.trim()}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm
                       disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Convert to Excel
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          <p className="font-semibold">Error:</p>
          <p>{errorMsg}</p>
        </div>
      )}
      {statusMsg && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-md text-sm">
          <p className="font-semibold">Status:</p>
          <p>{statusMsg}</p>
        </div>
      )}
       <footer className="text-center mt-8 text-sm text-gray-500">
        <p>Uses <a href="https://sheetjs.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">SheetJS (xlsx)</a> library for conversion.</p>
        <p>Note: Ensure your JSON is an array of objects or a single object for best results. Complex nested structures might not convert as expected.</p>
      </footer>
    </div>
  );
};

export default JsonToExcelConverter;
