import MdFigureForm from './forms/MdFigureForm.vue';
import MetricsFigureForm from './forms/MetricsFigureForm.vue';
import TableFigureForm from './forms/TableFigureForm.vue';
import VegaFigureForm from './forms/VegaFigureForm.vue';

const figureFormMap: Record<string, any | null> = {
  metric: MetricsFigureForm,
  table: TableFigureForm,
  md: MdFigureForm,
  _default: VegaFigureForm,
};

export default figureFormMap;
