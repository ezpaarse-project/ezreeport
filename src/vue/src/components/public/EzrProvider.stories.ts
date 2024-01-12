import type { Meta, StoryObj } from '@storybook/vue';
import {
  computed, defineComponent, ref, watch,
} from 'vue';
import ezReeportMixin from '~/mixins/ezr';
import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';
import EzrProvider from './EzrProvider.vue';

const meta: Meta<typeof EzrProvider> = {
  title: 'ezr-provider (Provider)',
  component: EzrProvider,
  args: {
    as: 'div',
    token: import.meta.env.VITE_AUTH_TOKEN,
    apiUrl: import.meta.env.VITE_REPORT_API,
    namespaceLogoUrl: import.meta.env.VITE_NAMESPACES_LOGO_URL,
    namespaceIcon: 'mdi-domain',
    namespaceLabel: { fr: 'espace|espaces', en: 'namespace|namespaces' },
  },
  argTypes: {
    namespaceLabel: {
      defaultValue: { summary: {}, detail: {} },
    },
    error: {
      action: 'error',
      control: { type: null },
    },
    'error:auth': {
      action: 'error:auth',
      control: { type: null },
    },
    default: {
      description: 'The default Vue slot',
      control: { type: null },
    },
  },
};

export default meta;

type Story = StoryObj<typeof EzrProvider>;

/**
 * Example component to show reactivity of Provider using options API
 */
const OptionsAPIDemo = defineComponent({
  mixins: [ezReeportMixin],
  template: `<v-card>
    <v-card-title>
      {{ $t('title') }}
    </v-card-title>

    <v-card-text>
      <div v-if="$ezReeport.isLogged">
        {{ $t('loggedInMessage', i18nData) }}
        </div>
        <div v-else>
        {{ $t('loggedOutMessage') }}
      </div>
    </v-card-text>
  </v-card>`,
  data: () => ({
    error: '',
  }),
  computed: {
    i18nData() {
      const namespaceCount = this.$ezReeport.data.namespaces.data.length;
      return {
        user: this.$ezReeport.data.auth.user?.username,
        count: namespaceCount,
        namespaces: this.$ezReeport.tcNamespace(false, namespaceCount),
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.isLogged': async function () {
      try {
        await this.$ezReeport.fetchNamespaces();
      } catch (error) {
        this.error = (error as Error).message;
      }
    },
  },
  i18n: {
    messages: {
      en: {
        title: 'Provider Demo',
        loggedInMessage: 'You\'re currently connected as "{user}" and you have access to {count} {namespaces}.',
        loggedOutMessage: "You're not logged in. Check <code>token</code> prop or console for more info.",
      },
      fr: {
        title: 'Démo du Provider',
        loggedInMessage: 'Vous êtes connecté en tant que "{user}" et vous avez accès à {count} {namespaces}.',
        loggedOutMessage: "Vous n'êtes pas connecté. Vérifiez le paramètre <code>token</code> ou la console pour plus d'informations.",
      },
    },
  },
});

export const OptionsAPI: Story = {
  render: (args) => ({
    components: { EzrProvider, OptionsAPIDemo },
    props: Object.keys(args),
    template: `<div>
      <v-alert v-if="err" type="error">
        {{ err }}
      </v-alert>

      <EzrProvider v-bind="$props" @error="onProviderError" v-on="$props">
        <OptionsAPIDemo />
      </EzrProvider>
    </div>`,
    data: () => ({
      err: '',
    }),
    methods: {
      onProviderError(err: Error) {
        this.err = err.message;
      },
    },
  }),
};

/**
 * Example component to show reactivity of Provider using composition API
 */
const CompositionAPIDemo = defineComponent({
  template: `<v-card>
    <v-card-title>
      {{ t('title') }}
    </v-card-title>

    <v-card-text>
      <div v-if="ezReeport.isLogged">
        {{ t('loggedInMessage', i18nData) }}
        </div>
        <div v-else>
        {{ t('loggedOutMessage') }}
      </div>
    </v-card-text>
  </v-card>`,
  setup() {
    const ezReeport = useEzR();
    const { $t: t } = useI18n();

    const i18nData = computed(() => {
      const namespaceCount = ezReeport.namespaces.value.data.length;
      return {
        user: ezReeport.auth.value.user?.username,
        count: namespaceCount,
        namespaces: ezReeport.tcNamespace(false, namespaceCount),
      };
    });

    watch(
      ezReeport.isLogged,
      async () => {
        try {
          await ezReeport.fetchNamespaces();
        } catch (err) {
          console.error((err as Error).message);
        }
      },
    );

    return {
      t,
      ezReeport,

      i18nData,
    };
  },
  i18n: OptionsAPIDemo.i18n,
});

export const CompositionAPI: Story = {
  render: (args) => ({
    components: { EzrProvider, CompositionAPIDemo },
    props: Object.keys(args),
    template: `<div>
      <v-alert v-if="err" type="error">
        {{ err }}
      </v-alert>

      <EzrProvider v-bind="$props" @error="onProviderError" v-on="$props">
        <CompositionAPIDemo />
      </EzrProvider>
    </div>`,
    setup() {
      const error = ref('');
      return {
        err: error,
        onProviderError(err: Error) {
          error.value = err.message;
        },
      };
    },
  }),
};
