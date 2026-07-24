import type { Logger } from '@ezreeport/logger';
import type { MailReportQueueDataType } from '@ezreeport/models/queues';
import { d, t } from '@ezreeport/i18n';
import { stringToB64 } from '@ezreeport/models/lib/utils';

import config from '~/lib/config';

import { createReportReadStream } from '~/models/rpc/client/files';

import { generateMail, getFilename, sendMail } from '..';

const {
  api: { url: APIurl },
} = config;

async function getFileFromRemote(
  filename: string,
  id: string
): Promise<Buffer> {
  const stream = await createReportReadStream(filename, id);
  // oxlint-disable-next-line promise/avoid-new
  return new Promise<Buffer>((resolve, reject) => {
    const buffers: Buffer[] = [];

    stream
      .on('data', (chunk: Buffer) => {
        buffers.push(chunk);
      })
      .on('end', () => resolve(Buffer.concat(buffers)))
      .on('error', (err) => reject(err));
  });
}

export async function sendSuccessReport(
  data: MailReportQueueDataType,
  logger: Logger
): Promise<void> {
  const file = await getFileFromRemote(data.filename, data.task.id);
  const filename = getFilename(data);

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
          subject: t('mail.report.success.subject', data.locale, {
            date: d(data.date, data.locale, 'P'),
            name: data.task.name,
          }),
          body: await generateMail('report-success', data.locale, {
            data: {
              recurrence: t(`recurrence.${data.task.recurrence}`, data.locale),
              name: data.task.name,
              namespace: data.namespace.name,
              date: d(data.date, data.locale),
              periodStart: d(data.period.start, data.locale, 'P'),
              periodEnd: d(data.period.end, data.locale, 'P'),
              unsubscribeLink,
            },
          }),
          attachments: [
            {
              filename,
              content: file,
              contentDisposition: 'attachment',
            },
          ],
        });

        return to;
      } catch (err) {
        logger.error({
          filename,
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
      filename,
      targets: successTargets,
      msg: 'Report sent to targets',
    });
  } else {
    logger.warn({
      filename,
      msg: 'No target to send report',
    });
  }
}
