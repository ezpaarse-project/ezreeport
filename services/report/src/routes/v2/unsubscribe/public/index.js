export const customAlert = (message, isError = false) => {
  const container = document.querySelector('#alert-container');
  if (!container) {
    // oxlint-disable-next-line no-alert
    alert(message);
    return;
  }

  const alertBox = document.createElement('div');
  alertBox.classList.add(
    'alert',
    'alert-hidden',
    isError ? 'alert-error' : 'alert-success'
  );
  alertBox.textContent = message;

  container.append(alertBox);

  // Show
  setTimeout(() => {
    alertBox.classList.remove('alert-hidden');
  }, 100);

  // Hide
  setTimeout(() => {
    alertBox.classList.add('alert-hidden');
  }, 5000);

  // Remove
  setTimeout(() => {
    alertBox.remove();
  }, 10_000);
};

export const unsubscribeFromTask = async (taskId, form) => {
  const obj = {
    taskId,
  };

  // oxlint-disable-next-line no-array-for-each
  new FormData(form).forEach((value, key) => {
    obj[key] = value;
  });

  try {
    const resp = await fetch('.', {
      body: JSON.stringify(obj),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const res = await resp.json();

    if (res.error) {
      throw new Error(res.error.message);
    }

    customAlert(
      'Vous avez bien été désinscrit. Vous pouvez fermer cette fenêtre.'
    );
  } catch (error) {
    customAlert(
      `Une erreur est survenue pendant le traitement:\n\n${error.message}`,
      true
    );
  }
};
