import inquirer, { type ConfirmQuestion } from 'inquirer';

export const simpleConfirm = async (message: string, params: Omit<ConfirmQuestion, 'type' | 'message' | 'name'> = {}) => {
  const res = await inquirer.prompt([{
    ...params,
    name: 'confirm',
    message,
    type: 'confirm',
  }]);

  return !!res.confirm;
};
