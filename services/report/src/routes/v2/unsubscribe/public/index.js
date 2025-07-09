export const customAlert = (message, isError = false) => {
  const container = document.querySelector('#alert-container');
  if (!container) {
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

export const unsubscribeFromTask = async (taskId, form) => {
  const obj = {
    taskId,
  };
  (new FormData(form)).forEach((value, key) => { obj[key] = value; });

  try {
    const resp = await fetch('.', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(obj),
    });
    const res = await resp.json();

    if (res.error) {
      throw new Error(res.error.message);
    }

    customAlert('Vous avez bien été désinscrit. Vous pouvez fermer cette fenêtre.');
  } catch (err) {
    customAlert(`Une erreur est survenue pendant le traitement:\n\n${err.message}`, true);
  }
};
