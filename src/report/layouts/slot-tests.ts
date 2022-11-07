import type { Figure, LayoutFnc } from '../models/reports';

/**
 * ! Remember to generate with /tasks/{id}/run?test_emails[]=<your_mail>&debug=true
 */

const slotTestsLayout: LayoutFnc = () => {
  if (process.env.NODE_ENV !== 'production') {
    return [
      (): [Figure<'md'>] => [
        { type: 'md', data: '', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        { type: 'md', data: '', params: {} },
        { type: 'md', data: '', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>, Figure<'md'>] => [
        { type: 'md', data: '', params: {} },
        { type: 'md', data: '', params: {} },
        { type: 'md', data: '', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>, Figure<'md'>, Figure<'md'>] => [
        { type: 'md', data: '', params: {} },
        { type: 'md', data: '', params: {} },
        { type: 'md', data: '', params: {} },
        { type: 'md', data: '', params: {} },
      ],
    ];
  }
  return [];
};

export default slotTestsLayout;
