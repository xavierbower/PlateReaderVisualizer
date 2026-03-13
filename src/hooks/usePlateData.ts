import { useState, useCallback } from 'react';
import type { PlateData, WellAnnotation, ViewMode, ColorScale } from '../types';

export function usePlateData() {
  const [plateData, setPlateData] = useState<PlateData | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [activeBlock, setActiveBlock] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('firefly');
  const [colorScale, setColorScale] = useState<ColorScale>('Viridis');
  const [annotations, setAnnotations] = useState<WellAnnotation[]>(() => {
    try {
      const saved = localStorage.getItem('plate-annotations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSignalOnly, setShowSignalOnly] = useState(true);

  const loadData = useCallback((data: PlateData, warns: string[]) => {
    setPlateData(data);
    setWarnings(warns);
    setActiveSheet(0);
    setActiveBlock(0);
    // Auto-detect view mode from sheet names
    const names = data.sheets.map(s => s.name.toLowerCase());
    if (names.includes('firefly')) setViewMode('firefly');
    else setViewMode('firefly');
  }, []);

  const updateAnnotation = useCallback((annotation: WellAnnotation) => {
    setAnnotations(prev => {
      const filtered = prev.filter(
        a => !(a.row === annotation.row && a.col === annotation.col)
      );
      const next = annotation.label ? [...filtered, annotation] : filtered;
      localStorage.setItem('plate-annotations', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    localStorage.removeItem('plate-annotations');
  }, []);

  // Compute ratio data (firefly / gaussia) if both sheets exist
  const getRatioData = useCallback((): number[][] | null => {
    if (!plateData) return null;
    const fireflySheet = plateData.sheets.find(s => s.name.toLowerCase().includes('firefly'));
    const gaussiaSheet = plateData.sheets.find(s => s.name.toLowerCase().includes('gaussia'));
    if (!fireflySheet || !gaussiaSheet) return null;

    const fBlock = fireflySheet.blocks[activeBlock];
    const gBlock = gaussiaSheet.blocks[activeBlock];
    if (!fBlock || !gBlock) return null;

    const fData = showSignalOnly ? fBlock.signal : fBlock.rawRows;
    const gData = showSignalOnly ? gBlock.signal : gBlock.rawRows;

    const ratio: number[][] = [];
    const rows = Math.min(fData.length, gData.length);
    const cols = Math.min(fData[0]?.length ?? 0, gData[0]?.length ?? 0);

    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        const g = gData[r]?.[c] ?? 0;
        row.push(g !== 0 ? (fData[r]?.[c] ?? 0) / g : 0);
      }
      ratio.push(row);
    }
    return ratio;
  }, [plateData, activeBlock, showSignalOnly]);

  const getCurrentData = useCallback((): number[][] | null => {
    if (!plateData) return null;

    if (viewMode === 'ratio') {
      return getRatioData();
    }

    const sheetName = viewMode === 'firefly' ? 'firefly' : 'gaussia';
    let sheet = plateData.sheets.find(s => s.name.toLowerCase().includes(sheetName));
    if (!sheet) sheet = plateData.sheets[activeSheet];
    if (!sheet) return null;

    const block = sheet.blocks[activeBlock];
    if (!block) return null;

    return showSignalOnly ? block.signal : block.rawRows;
  }, [plateData, viewMode, activeSheet, activeBlock, showSignalOnly, getRatioData]);

  return {
    plateData,
    warnings,
    activeSheet,
    activeBlock,
    viewMode,
    colorScale,
    annotations,
    showSignalOnly,
    loadData,
    setActiveSheet,
    setActiveBlock,
    setViewMode,
    setColorScale,
    setShowSignalOnly,
    updateAnnotation,
    clearAnnotations,
    getCurrentData,
    getRatioData,
  };
}
