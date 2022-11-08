import type { Figure, LayoutFnc } from '../models/reports';

/**
 * ! Remember to generate with /tasks/{id}/run?test_emails[]=<your_mail>&debug=true
 */

const slotTestsLayout: LayoutFnc = () => {
  if (process.env.NODE_ENV !== 'production') {
    return [
      (): [Figure<'md'>] => [
        { type: 'md', data: '0', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        { type: 'md', data: '0,2', params: {} },
        { type: 'md', data: '1,3', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>, Figure<'md'>] => [
        { type: 'md', data: '0', params: {} },
        { type: 'md', data: '1', params: {} },
        { type: 'md', data: '2,3', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>, Figure<'md'>, Figure<'md'>] => [
        { type: 'md', data: '0', params: {} },
        { type: 'md', data: '1', params: {} },
        { type: 'md', data: '2', params: {} },
        { type: 'md', data: '3', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        {
          type: 'md', data: '0', params: {}, slots: [0],
        },
        {
          type: 'md', data: '3', params: {}, slots: [3],
        },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        {
          type: 'md', data: '1', params: {}, slots: [1],
        },
        {
          type: 'md', data: '2', params: {}, slots: [2],
        },
      ],
      (): [Figure<'md'>] => [
        {
          type: 'md', data: '0,1', params: {}, slots: [0, 1],
        },
      ],
      (): [Figure<'md'>] => [
        {
          type: 'md', data: '2,3', params: {}, slots: [2, 3],
        },
      ],
      (): [Figure<'md'>] => [
        {
          type: 'md', data: '0,2', params: {}, slots: [0, 2],
        },
      ],
      (): [Figure<'md'>] => [
        {
          type: 'md', data: '1,3', params: {}, slots: [1, 3],
        },
      ],
    ];
  }
  return [];
};

export default slotTestsLayout;
