import Plot from 'react-plotly.js';

interface DoseResponseChartProps {
  data: number[][];
  title: string;
  selectedRows: Set<number>;
  onToggleRow: (row: number) => void;
}

const ROW_LABELS = 'ABCDEFGHIJKLMNOP'.split('');
const ROW_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#fb923c', '#facc15', '#4ade80',
  '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6',
];

export default function DoseResponseChart({ data, title, selectedRows, onToggleRow }: DoseResponseChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-center py-8">No data to display</div>;
  }

  const numCols = data[0]?.length ?? 0;
  const xValues = Array.from({ length: numCols }, (_, i) => i + 1);

  const traces = data.map((row, rowIdx) => ({
    x: xValues,
    y: row,
    type: 'scatter' as const,
    mode: 'lines+markers' as const,
    name: `Row ${ROW_LABELS[rowIdx] ?? rowIdx}`,
    line: { color: ROW_COLORS[rowIdx % ROW_COLORS.length] },
    marker: { size: 6 },
    visible: selectedRows.has(rowIdx) ? true as const : 'legendonly' as const,
  }));

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex flex-wrap gap-1 mb-3">
        {data.map((_, rowIdx) => (
          <button
            key={rowIdx}
            onClick={() => onToggleRow(rowIdx)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              selectedRows.has(rowIdx)
                ? 'text-white'
                : 'bg-slate-700 text-slate-500'
            }`}
            style={selectedRows.has(rowIdx) ? { backgroundColor: ROW_COLORS[rowIdx % ROW_COLORS.length] } : {}}
          >
            {ROW_LABELS[rowIdx] ?? rowIdx}
          </button>
        ))}
        <button
          onClick={() => {
            const allSelected = data.every((_, i) => selectedRows.has(i));
            data.forEach((_, i) => {
              if (allSelected) onToggleRow(i);
              else if (!selectedRows.has(i)) onToggleRow(i);
            });
          }}
          className="px-2 py-0.5 rounded text-xs font-medium bg-slate-600 text-slate-300 hover:bg-slate-500"
        >
          {data.every((_, i) => selectedRows.has(i)) ? 'None' : 'All'}
        </button>
      </div>
      <Plot
        data={traces}
        layout={{
          title: { text: title, font: { color: '#e2e8f0', size: 16 } } as never,
          xaxis: {
            title: { text: 'Column' } as never,
            tickfont: { color: '#94a3b8' },
            dtick: 1,
          },
          yaxis: {
            title: { text: 'Signal' } as never,
            tickfont: { color: '#94a3b8' },
          },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          legend: {
            font: { color: '#94a3b8' },
            bgcolor: 'rgba(0,0,0,0)',
          },
          margin: { t: 50, b: 50, l: 60, r: 20 },
          height: 400,
          showlegend: true,
        }}
        config={{ responsive: true, displayModeBar: true }}
        style={{ width: '100%' }}
      />
    </div>
  );
}
