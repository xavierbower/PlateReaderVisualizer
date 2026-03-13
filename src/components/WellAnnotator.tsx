import { useState, useCallback } from 'react';
import type { WellAnnotation } from '../types';

interface WellAnnotatorProps {
  numRows: number;
  numCols: number;
  annotations: WellAnnotation[];
  onUpdateAnnotation: (annotation: WellAnnotation) => void;
  onClearAnnotations: () => void;
  selectedWell: { row: number; col: number } | null;
  onSelectWell: (well: { row: number; col: number } | null) => void;
}

const ROW_LABELS = 'ABCDEFGHIJKLMNOP'.split('');

const TEMPLATES = [
  { name: 'Serial Dilution (1-12)', apply: (numRows: number, numCols: number) => {
    const annotations: WellAnnotation[] = [];
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        annotations.push({
          row: r, col: c,
          label: `${ROW_LABELS[r]}${c + 1}`,
          concentration: `1:${Math.pow(2, c)}`,
        });
      }
    }
    return annotations;
  }},
  { name: 'Row Labels Only', apply: (numRows: number, numCols: number) => {
    const annotations: WellAnnotation[] = [];
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        annotations.push({ row: r, col: c, label: ROW_LABELS[r] });
      }
    }
    return annotations;
  }},
];

export default function WellAnnotator({
  numRows,
  numCols,
  annotations,
  onUpdateAnnotation,
  onClearAnnotations,
  selectedWell,
  onSelectWell,
}: WellAnnotatorProps) {
  const [editLabel, setEditLabel] = useState('');
  const [editConcentration, setEditConcentration] = useState('');
  const [editCondition, setEditCondition] = useState('');

  const getAnnotation = useCallback((row: number, col: number) => {
    return annotations.find(a => a.row === row && a.col === col);
  }, [annotations]);

  const handleWellClick = useCallback((row: number, col: number) => {
    const existing = getAnnotation(row, col);
    setEditLabel(existing?.label ?? '');
    setEditConcentration(existing?.concentration ?? '');
    setEditCondition(existing?.condition ?? '');
    onSelectWell({ row, col });
  }, [getAnnotation, onSelectWell]);

  const handleSave = useCallback(() => {
    if (!selectedWell) return;
    onUpdateAnnotation({
      ...selectedWell,
      label: editLabel,
      concentration: editConcentration || undefined,
      condition: editCondition || undefined,
    });
    onSelectWell(null);
  }, [selectedWell, editLabel, editConcentration, editCondition, onUpdateAnnotation, onSelectWell]);

  const handleExportCSV = useCallback(() => {
    if (annotations.length === 0) return;
    const header = 'Well,Row,Col,Label,Concentration,Condition\n';
    const rows = annotations.map(a =>
      `${ROW_LABELS[a.row]}${a.col + 1},${ROW_LABELS[a.row]},${a.col + 1},${a.label},${a.concentration ?? ''},${a.condition ?? ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'well_annotations.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [annotations]);

  const handleApplyTemplate = useCallback((templateIdx: number) => {
    const template = TEMPLATES[templateIdx];
    if (!template) return;
    const newAnnotations = template.apply(numRows, numCols);
    for (const a of newAnnotations) {
      onUpdateAnnotation(a);
    }
  }, [numRows, numCols, onUpdateAnnotation]);

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-200 font-medium">Well Annotations</h3>
        <div className="flex gap-2">
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => handleApplyTemplate(i)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
            >
              {t.name}
            </button>
          ))}
          <button
            onClick={handleExportCSV}
            disabled={annotations.length === 0}
            className="px-2 py-1 bg-green-700 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-xs"
          >
            Export CSV
          </button>
          <button
            onClick={onClearAnnotations}
            className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Mini plate grid */}
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-8"></th>
              {Array.from({ length: numCols }, (_, c) => (
                <th key={c} className="text-slate-400 text-xs font-normal px-1 pb-1">{c + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: numRows }, (_, r) => (
              <tr key={r}>
                <td className="text-slate-400 text-xs pr-1">{ROW_LABELS[r]}</td>
                {Array.from({ length: numCols }, (_, c) => {
                  const ann = getAnnotation(r, c);
                  const isSelected = selectedWell?.row === r && selectedWell?.col === c;
                  return (
                    <td key={c} className="p-0.5">
                      <button
                        onClick={() => handleWellClick(r, c)}
                        className={`w-7 h-7 rounded-full text-[9px] font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                            : ann?.label
                              ? 'bg-indigo-600/60 text-indigo-200 hover:bg-indigo-500/60'
                              : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                        }`}
                        title={ann ? `${ann.label}${ann.concentration ? ` (${ann.concentration})` : ''}` : `${ROW_LABELS[r]}${c + 1}`}
                      >
                        {ann?.label?.substring(0, 2) ?? ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit form */}
      {selectedWell && (
        <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
          <p className="text-slate-300 text-sm mb-2 font-medium">
            Well {ROW_LABELS[selectedWell.row]}{selectedWell.col + 1}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="Label"
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none focus:border-blue-400"
            />
            <input
              value={editConcentration}
              onChange={(e) => setEditConcentration(e.target.value)}
              placeholder="Concentration"
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none focus:border-blue-400"
            />
            <input
              value={editCondition}
              onChange={(e) => setEditCondition(e.target.value)}
              placeholder="Condition"
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => onSelectWell(null)}
              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
