import { basename } from 'node:path';

import type { Logger } from '@ezreeport/logger';
import { format } from '@ezreeport/dates';
import { stringToB64 } from '@ezreeport/models/lib/utils';
import type { MailReportQueueDataType } from '@ezreeport/models/queues';

import config from '~/lib/config';

import { recurrenceToStr } from '~/models/recurrence';
import { createReportReadStream } from '~/models/rpc/client/files';

import { generateMail, sendMail } from '..';

const {
  api: { url: APIurl },
} = config;

export default async function sendSuccessReport(
  data: MailReportQueueDataType,
  logger: Logger
): Promise<void> {
  const file = await createReportReadStream(data.filename, data.task.id);
  const name = basename(data.filename);
  const dateStr = format(data.date, 'dd/MM/yyyy');

  // Send one email per target to allow un-subscription prefill
  const targets = await Promise.allSettled(
    data.targets.map(async (to) => {
      try {
        const taskId64 = stringToB64(data.task.id);
        const to64 = stringToB64(to);
        const unsubId = encodeURIComponent(`${taskId64}:${to64}`);

        const unsubscribeLink = `${APIurl}/unsubscribe/${unsubId}`;
        await sendMail({
          to,
          subject: `Reporting ezMESURE [${dateStr}] - ${data.task.name}`,
          body: await generateMail('success', {
            recurrence: recurrenceToStr(data.task.recurrence),
            name: data.task.name,
            namespace: data.namespace.name,
            date: format(data.date, 'dd/MM/yyyy à HH:mm:ss'),
            period: {
              start: format(data.period.start, 'dd/MM/yyyy'),
              end: format(data.period.end, 'dd/MM/yyyy'),
            },
            unsubscribeLink,
          }),
          attachments: [
            {
              filename: name,
              content: file,
            },
          ],
        });

        return to;
      } catch (err) {
        logger.error({
          filename: name,
          to,
          err,
          msg: 'Error when sending report',
        });
        throw err;
      }
    })
  );

  const successTargets = targets
    .filter((task) => task.status === 'fulfilled')
    .map(({ value }) => value);
  if (successTargets.length > 0) {
    logger.info({
      filename: name,
      targets: successTargets,
      msg: 'Report sent to targets',
    });
  } else {
    logger.warn({
      filename: name,
      msg: 'No target to send report',
    });
  }
}
