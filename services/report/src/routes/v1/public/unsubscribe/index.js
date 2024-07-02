/* eslint-env browser */

export const customAlert = (message, isError = false) => {
  const container = document.querySelector('#alert-container');
  if (!container) {
    // eslint-disable-next-line no-alert
    alert(message);
    return;
  }

  const alertBox = document.createElement('div');
  alertBox.classList.add(
    'alert',
    'alert-hidden',
    isError ? 'alert-error' : 'alert-success',
  );
  alertBox.innerText = message;

  container.appendChild(alertBox);

  // show
  setTimeout(() => {
    alertBox.classList.remove('alert-hidden');
  }, 100);

  // hide
  setTimeout(() => {
    alertBox.classList.add('alert-hidden');
  }, 5000);

  // remove
  setTimeout(() => {
    container.removeChild(alertBox);
  }, 10000);
};

export const unsubFromTask = async (taskId, form) => {
  const obj = {};
  (new FormData(form)).forEach((value, key) => { obj[key] = value; });

  const resp = await fetch(
    `/v1/tasks/${taskId}/_unsubscribe`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(obj),
    },
  );
  const res = await resp.json();

  if (res.content.message) {
    customAlert(`Une erreur est survenue pendant le traitement:\n\n${res.content.message}`, true);
  } else {
    customAlert('Vous avez bien été désinscrit. Vous pouvez fermer cette fenêtre.');
  }
};
