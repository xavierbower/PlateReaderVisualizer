import { useState, useMemo } from 'react';
import { usePlateData } from './hooks/usePlateData';
import FileUpload from './components/FileUpload';
import SheetSelector from './components/SheetSelector';
import PlateHeatmap from './components/PlateHeatmap';
import DoseResponseChart from './components/DoseResponseChart';
import NormalizationView from './components/NormalizationView';
import WellAnnotator from './components/WellAnnotator';

type Tab = 'heatmap' | 'dose-response' | 'ratio' | 'annotate';

function App() {
  const {
    plateData,
    warnings,
    activeBlock,
    viewMode,
    colorScale,
    annotations,
    showSignalOnly,
    loadData,
    setActiveBlock,
    setViewMode,
    setColorScale,
    setShowSignalOnly,
    updateAnnotation,
    clearAnnotations,
    getCurrentData,
    getRatioData,
  } = usePlateData();

  const [activeTab, setActiveTab] = useState<Tab>('heatmap');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(() => new Set([0, 1, 2, 3]));
  const [selectedWell, setSelectedWell] = useState<{ row: number; col: number } | null>(null);

  const currentData = getCurrentData();
  const ratioData = getRatioData();

  const annotationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of annotations) {
      map.set(`${a.row}-${a.col}`, a.label);
    }
    return map;
  }, [annotations]);

  const toggleRow = (row: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'dose-response', label: 'Dose-Response' },
    { id: 'ratio', label: 'Normalization' },
    { id: 'annotate', label: 'Annotate' },
  ];

  if (!plateData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Plate Reader Visualizer</h1>
        <p className="text-slate-400 mb-8 text-center max-w-md">
          Upload dual-luciferase plate reader data to visualize heatmaps, dose-response curves, and normalized ratios.
        </p>
        <FileUpload onDataLoaded={loadData} />
      </div>
    );
  }

  const viewTitle = viewMode === 'ratio' ? 'Firefly / Gaussia Ratio'
    : viewMode === 'firefly' ? 'Firefly' : 'Gaussia';

  return (
    <div className="min-h-screen flex flex-col px-4 py-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Plate Reader Visualizer</h1>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
        >
          New File
        </button>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-3 text-amber-400 text-sm bg-amber-900/30 border border-amber-800 rounded-lg px-4 py-2">
          {warnings.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}

      {/* Controls */}
      <SheetSelector
        plateData={plateData}
        viewMode={viewMode}
        colorScale={colorScale}
        activeBlock={activeBlock}
        showSignalOnly={showSignalOnly}
        onViewModeChange={setViewMode}
        onColorScaleChange={setColorScale}
        onBlockChange={setActiveBlock}
        onShowSignalOnlyChange={setShowSignalOnly}
      />

      {/* Tab bar */}
      <div className="flex gap-1 mt-4 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                : 'bg-slate-800/30 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'heatmap' && currentData && (
          <PlateHeatmap
            data={currentData}
            colorScale={colorScale}
            title={`${viewTitle} — Block ${activeBlock + 1}`}
            annotations={annotationMap}
            onWellClick={(row, col) => {
              setActiveTab('annotate');
              setSelectedWell({ row, col });
            }}
          />
        )}

        {activeTab === 'dose-response' && currentData && (
          <DoseResponseChart
            data={currentData}
            title={`${viewTitle} — Dose Response`}
            selectedRows={selectedRows}
            onToggleRow={toggleRow}
          />
        )}

        {activeTab === 'ratio' && (
          <NormalizationView
            ratioData={ratioData}
            colorScale={colorScale}
            selectedRows={selectedRows}
            onToggleRow={toggleRow}
          />
        )}

        {activeTab === 'annotate' && currentData && (
          <WellAnnotator
            numRows={currentData.length}
            numCols={currentData[0]?.length ?? 0}
            annotations={annotations}
            onUpdateAnnotation={updateAnnotation}
            onClearAnnotations={clearAnnotations}
            selectedWell={selectedWell}
            onSelectWell={setSelectedWell}
          />
        )}
      </div>
    </div>
  );
}

export default App;
