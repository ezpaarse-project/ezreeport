import { VSwitch } from 'vuetify/lib';
import './style.scss';

export default VSwitch.extend({
  name: 'CustomSwitch',
  props: {
    reverse: Boolean,
    expand: Boolean,
  },
  computed: {
    classes(): object {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(VSwitch as any).options.computed.classes.call(this),
        'v-input--expand': this.expand,
        'v-input--reverse': this.reverse,
      };
    },
  },
});
