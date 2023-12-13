import type { Meta, StoryObj } from '@storybook/vue';
import { defineComponent } from 'vue';
import ezReeportMixin from '~/mixins/ezr';
import EzrProvider from './EzrProvider.vue';

const meta: Meta<typeof EzrProvider> = {
  title: 'ezr-provider (Provider)',
  component: EzrProvider,
  args: {
    as: 'div',
    token: import.meta.env.VITE_AUTH_TOKEN,
    apiUrl: import.meta.env.VITE_REPORT_API,
    namespaceLogoUrl: import.meta.env.VITE_NAMESPACES_LOGO_URL,
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

/**
 * Example component to show reactivity of Provider
 */
const ProviderDemo = defineComponent({
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
    '$ezReeport.isLogged': function () {
      try {
        this.$ezReeport.fetchNamespaces();
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

type Story = StoryObj<typeof EzrProvider>;

export const Basic: Story = {
  render: (args) => ({
    components: { EzrProvider, ProviderDemo },
    props: Object.keys(args),
    template: `<div>
      <v-alert v-if="err" type="error">
        {{ err }}
      </v-alert>

      <EzrProvider v-bind="$props" @error="onProviderError" v-on="$props">
        <ProviderDemo />
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
