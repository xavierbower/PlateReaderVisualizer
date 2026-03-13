import Plot from 'react-plotly.js';
import type { ColorScale } from '../types';

interface PlateHeatmapProps {
  data: number[][];
  colorScale: ColorScale;
  title: string;
  annotations?: Map<string, string>;
  onWellClick?: (row: number, col: number) => void;
}

const ROW_LABELS = 'ABCDEFGHIJKLMNOP'.split('');

export default function PlateHeatmap({ data, colorScale, title, annotations, onWellClick }: PlateHeatmapProps) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-center py-8">No data to display</div>;
  }

  const numRows = data.length;
  const numCols = data[0]?.length ?? 0;

  const rowLabels = ROW_LABELS.slice(0, numRows);
  const colLabels = Array.from({ length: numCols }, (_, i) => String(i + 1));

  // Build annotation text overlay
  const annotationText = data.map((row, r) =>
    row.map((val, c) => {
      const key = `${r}-${c}`;
      const label = annotations?.get(key);
      return label ? `${val.toFixed(1)}\n${label}` : val.toFixed(1);
    })
  );

  // Reverse for Plotly (row 0 = top)
  const reversedData = [...data].reverse();
  const reversedLabels = [...rowLabels].reverse();
  const _reversedAnnotations = [...annotationText].reverse();
  void _reversedAnnotations;

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <Plot
        data={[
          {
            z: reversedData,
            x: colLabels,
            y: reversedLabels,
            type: 'heatmap',
            colorscale: colorScale,
            hovertemplate: 'Row %{y}, Col %{x}<br>Value: %{z:.1f}<extra></extra>',
            showscale: true,
            colorbar: {
              thickness: 15,
              tickfont: { color: '#94a3b8', size: 11 },
            },
          },
        ]}
        layout={{
          title: { text: title, font: { color: '#e2e8f0', size: 16 } } as never,
          xaxis: {
            title: { text: 'Column' } as never,
            tickfont: { color: '#94a3b8' },
            side: 'top',
          },
          yaxis: {
            tickfont: { color: '#94a3b8' },
            autorange: true,
          },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          margin: { t: 60, b: 30, l: 40, r: 20 },
          height: Math.max(300, numRows * 40 + 100),
        }}
        config={{ responsive: true, displayModeBar: true }}
        style={{ width: '100%' }}
        onClick={(event) => {
          if (onWellClick && event.points[0]) {
            const point = event.points[0];
            const col = parseInt(String(point.x)) - 1;
            const rowLabel = String(point.y);
            const row = ROW_LABELS.indexOf(rowLabel);
            if (row >= 0 && col >= 0) {
              onWellClick(row, col);
            }
          }
        }}
      />
    </div>
  );
}
