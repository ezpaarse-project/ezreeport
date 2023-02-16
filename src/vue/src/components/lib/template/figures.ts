export const figureIcons: Record<string, string> = {
  // Vega types
  arc: 'mdi-chart-arc',
  area: 'mdi-chart-areaspline-variant',
  bar: 'mdi-chart-bar',
  // image: 'mdi-image',
  line: 'mdi-chart-line',
  point: 'mdi-chart-scatter-plot',
  rect: 'mdi-rectangle',
  rule: 'mdi-vector-line',
  text: 'mdi-text',
  tick: '', // TODO
  trail: 'mdi-chart-bell-curve',
  circle: 'mdi-chart-scatter-plot', // TODO
  square: 'mdi-square',
  // Custom types
  table: 'mdi-table',
  md: 'mdi-image-text',
  metric: 'mdi-counter',
};

export const figureTypes = Object.keys(figureIcons);
