export const figureTypes = {
  common: {
    arc: { icon: 'mdi-chart-arc' },
    bar: { icon: 'mdi-chart-bar' },
    table: { icon: 'mdi-table' },
    md: { icon: 'mdi-image-text' },
    metric: { icon: 'mdi-counter' },
  },
  others: {
    area: { icon: 'mdi-chart-areaspline-variant' },
    // image: { icon: 'mdi-image' },
    line: { icon: 'mdi-chart-line' },
    // point: { icon: 'mdi-chart-scatter-plot' },
    // rect: { icon: 'mdi-rectangle' },
    // rule: { icon: 'mdi-vector-line' },
    // text: { icon: 'mdi-text' },
    // tick: { icon: '' }, // TODO
    // trail: { icon: 'mdi-chart-bell-curve' },
    // circle: { icon: 'mdi-chart-scatter-plot' },
    // square: { icon: 'mdi-square' },
  },
};

const extractIcons = () => {
  const icons: Record<string, string> = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const figures of Object.values(figureTypes)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, { icon }] of Object.entries(figures)) {
      icons[key] = icon;
    }
  }

  return icons;
};
export const figureIcons = extractIcons();
