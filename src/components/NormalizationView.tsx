import PlateHeatmap from './PlateHeatmap';
import DoseResponseChart from './DoseResponseChart';
import type { ColorScale } from '../types';

interface NormalizationViewProps {
  ratioData: number[][] | null;
  colorScale: ColorScale;
  selectedRows: Set<number>;
  onToggleRow: (row: number) => void;
}

export default function NormalizationView({
  ratioData,
  colorScale,
  selectedRows,
  onToggleRow,
}: NormalizationViewProps) {
  if (!ratioData) {
    return (
      <div className="text-slate-500 text-center py-8 bg-slate-800/50 rounded-xl">
        Ratio view requires both firefly and gaussia sheets.
        <br />
        <span className="text-sm">Upload an Excel file with both sheets to see the firefly/gaussia ratio.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PlateHeatmap
        data={ratioData}
        colorScale={colorScale}
        title="Firefly / Gaussia Ratio"
      />
      <DoseResponseChart
        data={ratioData}
        title="Ratio Dose-Response"
        selectedRows={selectedRows}
        onToggleRow={onToggleRow}
      />
    </div>
  );
}
