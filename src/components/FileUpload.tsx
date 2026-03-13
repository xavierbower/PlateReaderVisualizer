import { useState, useCallback, useRef } from 'react';
import { parseFile, parseExcel, parsePastedText } from '../utils/excelParser';
import type { PlateData } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: PlateData, warnings: string[]) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const result = await parseFile(file);
      onDataLoaded(result.data, result.warnings);
    } catch (e) {
      setError(`Failed to parse file: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleLoadExample = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'example_data/Dox2_20260306.xlsx');
      const buffer = await response.arrayBuffer();
      const result = parseExcel(buffer, 'Dox2_20260306.xlsx');
      onDataLoaded(result.data, result.warnings);
    } catch (e) {
      setError(`Failed to load example: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [onDataLoaded]);

  const handlePaste = useCallback(() => {
    if (!pasteText.trim()) return;
    setError(null);
    try {
      const result = parsePastedText(pasteText);
      onDataLoaded(result.data, result.warnings);
      setPasteText('');
      setShowPasteBox(false);
    } catch (e) {
      setError(`Failed to parse pasted data: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [pasteText, onDataLoaded]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`w-full max-w-lg border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-400/10'
            : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.txt"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="text-3xl mb-2">&#128196;</div>
        <p className="text-slate-300 font-medium">
          Drop a file here or click to browse
        </p>
        <p className="text-slate-500 text-sm mt-1">
          .xlsx, .xls, .csv, .tsv, or .txt
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleLoadExample}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Load Example Data
        </button>
        <button
          onClick={() => setShowPasteBox(!showPasteBox)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Paste Data
        </button>
      </div>

      {showPasteBox && (
        <div className="w-full max-w-lg">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste tab-separated or comma-separated plate reader data here..."
            className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-300 font-mono resize-y focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={handlePaste}
            disabled={!pasteText.trim()}
            className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Parse Pasted Data
          </button>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-4 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
