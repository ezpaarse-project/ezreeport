declare module '*.vue' {
  import Vue from 'vue';

  export default Vue;
}

declare module '@highlightjs/vue-plugin';

declare module 'highlight.js/lib/core' {
  import hljs from 'highlight.js';

  export default hljs;
}
