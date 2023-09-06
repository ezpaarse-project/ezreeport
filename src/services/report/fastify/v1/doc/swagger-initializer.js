/**
 * Overriding default Swagger-UI initializer
 * This file will be run on client
 */

/* eslint-env browser */

window.onload = function onload() {
  const openApiUrl = new URL('./openapi.json', window.location.href);

  // eslint-disable-next-line no-undef
  window.ui = SwaggerUIBundle({
    url: openApiUrl.href,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      // eslint-disable-next-line no-undef
      SwaggerUIBundle.presets.apis,
      // eslint-disable-next-line no-undef
      SwaggerUIStandalonePreset,
    ],
    plugins: [
      // eslint-disable-next-line no-undef
      SwaggerUIBundle.plugins.DownloadUrl,
    ],
    layout: 'StandaloneLayout',
  });
};
