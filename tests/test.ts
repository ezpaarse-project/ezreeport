import { global, report } from 'reporting-sdk-js';

(async () => {
  const events = new global.EventEmitter();
  events.on('test', (progress) => {
    console.log('received:', progress);
  });

  await report.listenGeneration(
    events,
    'af549626-641b-44ed-9381-f3b751370164',
    { testEmails: ['test@inist.fr'] },
  );
})();
