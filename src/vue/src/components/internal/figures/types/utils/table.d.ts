export type PDFStyle = {
  overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden',
  halign?: 'left' | 'right' | 'center' | 'justify',
  valign?: 'left' | 'right' | 'center' | 'justify',
};

export type TableColumn = {
  header: string,
  dataKey: string,
};

// Extracted from `src/services/report/...`
export type PDFParams = {
  dataKey: string,
  title?: string,
  maxLength?: number,
  columns: TableColumn[],
  totals?: string[],
  columnStyles?: Record<string, PDFStyle>
};
