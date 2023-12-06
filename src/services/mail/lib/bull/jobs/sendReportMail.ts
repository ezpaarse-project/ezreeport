import { Queue, Job } from 'bullmq';
import { format, parseISO } from 'date-fns';

import config from '~/lib/config';
import { appLogger as logger } from '~/lib/logger';
import { generateMail, sendMail, type MailOptions } from '~/lib/mail';
import { b64ToString, isFulfilled, stringToB64 } from '~/lib/utils';

import { recurrenceToStr } from '~/models/recurrence';

import type { MailResult } from '..';

const {
  redis,
  mail: { team },
  api: { url: APIurl },
} = config;

type ErrorReportPrams = {
  data: MailResult;
  options: Omit<MailOptions, 'to' | 'body' | 'subject'>;
  bodyData: {
    recurrence: string;
    name: string;
    date:string;
  };
  filename: string;
  date: Date;
  dateStr: string;
};

const sendErrorReport = async ({
  data,
  options,
  bodyData,
  filename,
  date,
  dateStr,
}: ErrorReportPrams) => {
  // TODO[feat]: Ignore team if test report ?
  const to = [data.contact ?? '', team];

  let error: string;
  try {
    const { detail } = JSON.parse(b64ToString(data.file));
    error = detail.error.message;
  } catch (err) {
    error = 'Unknown error, see attachements';
  }

  await sendMail({
    ...options,
    to,
    subject: `Erreur de Reporting ezMESURE [${dateStr}] - ${data.task.name}`,
    body: await generateMail('error', { ...bodyData, error, date: format(date, 'dd/MM/yyyy à HH:mm:ss') }),
  });
  logger.info(`[mail] [${process.pid}] Error report [${filename}] sent to [${to.filter((v) => v).join(', ')}]`);
};

type SuccessReportParams = {
  filename: string;
  dateStr: string;
  options: Omit<MailOptions, 'to' | 'body' | 'subject'>;
  bodyData: {
    recurrence: string;
    name: string;
    date: string;
  };
  task: MailResult['task'];
};

const sendSuccessReport = async ({
  task,
  options,
  dateStr,
  bodyData,
  filename,
}: SuccessReportParams) => {
  // Send one email per target to allow un-subscription prefill
  const targets = await Promise.allSettled(
    task.targets.map(async (to) => {
      try {
        const taskId64 = stringToB64(task.id);
        const to64 = stringToB64(to);
        const unsubId = encodeURIComponent(`${taskId64}:${to64}`);

        const unsubscribeLink = `${APIurl}/unsubscribe/${unsubId}`;
        await sendMail({
          ...options,
          to,
          subject: `Reporting ezMESURE [${dateStr}] - ${task.name}`,
          body: await generateMail('success', { ...bodyData, unsubscribeLink }),
        });

        return to;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`[mail] [${process.pid}] Report [${filename}] wan't sent to [${to}] with error: {${error.message}}`);
        } else {
          logger.error(`[cron] [${process.pid}] Unexpected error when sending report [${filename}] wan't sent to [${to}]: {${error}}`);
        }
        throw error;
      }
    }),
  );

  const successTargets = targets.filter(isFulfilled).map(({ value }) => value);
  if (successTargets.length > 0) {
    logger.info(`[mail] [${process.pid}] Report [${filename}] sent to [${successTargets.join(', ')}]`);
  } else {
    logger.error(`[mail] [${process.pid}] Report [${filename}] wasn't sent to anyone (see previous logs)`);
  }
};

const sendReport = (data: MailResult, date: Date, dateStr: string) => {
  const filename = data.url.replace(/^.*\//, '');

  const options: Omit<MailOptions, 'to' | 'body' | 'subject'> = {
    attachments: [{
      filename,
      content: data.file,
      encoding: 'base64',
    }],
  };
  const bodyData = {
    recurrence: recurrenceToStr(data.task.recurrence),
    name: data.task.name,
    date: dateStr,
  };

  if (data.success) {
    return sendSuccessReport({
      filename,
      dateStr,
      options,
      bodyData,
      task: data.task,
    });
  }
  return sendErrorReport({
    data,
    bodyData,
    date,
    dateStr,
    filename,
    options,
  });
};

type ErrorParams = {
  file: string,
  filename: string,
  contact: string,
  date: string,
};

const sendError = async (data: ErrorParams, date: Date, dateStr: string) => {
  await sendMail({
    attachments: [{
      filename: data.filename,
      content: data.file,
      encoding: 'base64',
    }],
    to: [team],
    subject: `Erreur de Reporting ezMESURE [${dateStr}]`,
    body: await generateMail('error', {
      error: 'Unknown error, see attachements',
      date: format(date, 'dd/MM/yyyy à HH:mm:ss'),
    }),
  });
  logger.info(`[mail] [${process.pid}] Error sent to [${team}]`);
};

export default async (j: Job) => {
  // Re-getting job from it's id and queue to get child jobs
  // See https://github.com/taskforcesh/bullmq/issues/753
  const queue = new Queue<MailResult>(j.queueName, { connection: redis });
  const job = await Job.fromId(queue, j.id ?? '');
  if (!job) {
    throw new Error(`Cannot find job [${j.id}] in queue [${queue.name}]`);
  }

  const data: MailResult = Object.values(await job.getChildrenValues())[0]?.mailData;

  const date = parseISO(data.date);
  const dateStr = format(date, 'dd/MM/yyyy');

  try {
    if (data && !job.data.error) {
      await sendReport(data, date, dateStr);
      return;
    }

    if (job.data.error) {
      await sendError(job.data, date, dateStr);
      return;
    }

    throw new Error('No suitable data found');
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[mail] [${process.pid}] Error when sending incoming report: {${error.message}}`);
    } else {
      logger.error(`[cron] [${process.pid}] Unexpected error when sending incoming report: {${error}}`);
    }
  }
};
