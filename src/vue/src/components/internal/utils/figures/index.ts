import MetricsFigureForm from './forms/MetricsFigureForm.vue';
import TableFigureForm from './forms/TableFigureForm.vue';
const figureFormMap: Record<string, any | null> = {
  table: TableFigureForm,
  metric: MetricsFigureForm,
  md: null,
};

export default figureFormMap;
