import type { ViewMode, ColorScale, PlateData } from '../types';

interface SheetSelectorProps {
  plateData: PlateData;
  viewMode: ViewMode;
  colorScale: ColorScale;
  activeBlock: number;
  showSignalOnly: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onColorScaleChange: (scale: ColorScale) => void;
  onBlockChange: (block: number) => void;
  onShowSignalOnlyChange: (show: boolean) => void;
}

const colorScales: ColorScale[] = ['Viridis', 'Hot', 'Blues', 'YlOrRd', 'RdBu'];

export default function SheetSelector({
  plateData,
  viewMode,
  colorScale,
  activeBlock,
  showSignalOnly,
  onViewModeChange,
  onColorScaleChange,
  onBlockChange,
  onShowSignalOnlyChange,
}: SheetSelectorProps) {
  const hasFirefly = plateData.sheets.some(s => s.name.toLowerCase().includes('firefly'));
  const hasGaussia = plateData.sheets.some(s => s.name.toLowerCase().includes('gaussia'));
  const canShowRatio = hasFirefly && hasGaussia;

  const currentSheet = plateData.sheets.find(s => {
    if (viewMode === 'ratio' || viewMode === 'firefly') return s.name.toLowerCase().includes('firefly');
    return s.name.toLowerCase().includes('gaussia');
  }) ?? plateData.sheets[0];

  const blockCount = currentSheet?.blocks.length ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-4 bg-slate-800/50 rounded-xl px-4 py-3">
      <div className="flex gap-1">
        {hasFirefly && (
          <button
            onClick={() => onViewModeChange('firefly')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'firefly' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Firefly
          </button>
        )}
        {hasGaussia && (
          <button
            onClick={() => onViewModeChange('gaussia')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'gaussia' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Gaussia
          </button>
        )}
        {canShowRatio && (
          <button
            onClick={() => onViewModeChange('ratio')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'ratio' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Ratio (F/G)
          </button>
        )}
        {!hasFirefly && !hasGaussia && plateData.sheets.map((sheet, i) => (
          <button
            key={i}
            onClick={() => onViewModeChange('firefly')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-600 text-white"
          >
            {sheet.name}
          </button>
        ))}
      </div>

      {blockCount > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Block:</span>
          <div className="flex gap-1">
            {Array.from({ length: blockCount }, (_, i) => (
              <button
                key={i}
                onClick={() => onBlockChange(i)}
                className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
                  activeBlock === i ? 'bg-slate-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm">Color:</span>
        <select
          value={colorScale}
          onChange={(e) => onColorScaleChange(e.target.value as ColorScale)}
          className="bg-slate-700 text-slate-300 text-sm rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-blue-400"
        >
          {colorScales.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
        <input
          type="checkbox"
          checked={showSignalOnly}
          onChange={(e) => onShowSignalOnlyChange(e.target.checked)}
          className="rounded"
        />
        Signal only
      </label>

      <span className="text-slate-500 text-xs ml-auto">
        {plateData.fileName}
      </span>
    </div>
  );
}
