import amqp from 'amqplib';

let connection: amqp.ChannelModel | undefined;

async function getConnection() {
  if (!connection) {
    connection = await amqp.connect('amqp://localhost');
  }
  return connection;
}

async function sendGeneration(filename: string) {
  const { default: file } = await import(`./${filename}`);

  const channel = await (await getConnection()).createChannel();

  channel.sendToQueue('ezreeport.report:generation', Buffer.from(JSON.stringify(file)));
  console.log('File sent', filename);
}

sendGeneration('ddor.ts');
// sendGeneration('bibcnrs.ts');

setTimeout(() => {
  connection?.close();
  process.exit(0);
}, 5000);
