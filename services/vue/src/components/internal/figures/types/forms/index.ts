import MdFigureForm from './MdFigureForm.vue';
import MetricsFigureForm from './MetricsFigureForm.vue';
import TableFigureForm from './TableFigureForm.vue';
import VegaFigureForm from './VegaFigureForm.vue';

const figureFormMap: Record<string, any | null> = {
  metric: MetricsFigureForm,
  table: TableFigureForm,
  md: MdFigureForm,
  _default: VegaFigureForm,
};

export default figureFormMap;
