export interface PlateData {
  fileName: string;
  sheets: SheetData[];
}

export interface SheetData {
  name: string;
  blocks: PlateBlock[];
}

export interface PlateBlock {
  temperature: number;
  /** Raw 8-row × 12-col grid as read from the file */
  rawRows: number[][];
  /** Signal values extracted (odd 1-based columns): 8 rows × 6 cols, or full grid if no interleaving detected */
  signal: number[][];
  /** Background values extracted (even 1-based columns), or null if no interleaving */
  background: number[][] | null;
}

export interface WellAnnotation {
  row: number;
  col: number;
  label: string;
  concentration?: string;
  condition?: string;
}

export type ViewMode = 'firefly' | 'gaussia' | 'ratio';
export type ColorScale = 'Viridis' | 'Hot' | 'Blues' | 'YlOrRd' | 'RdBu';

export interface ParsedInput {
  data: PlateData;
  warnings: string[];
}
