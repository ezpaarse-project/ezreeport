/**
 * ! Remember to generate with /tasks/{id}/run?test_emails[]=<your_mail>&debug=true
 */

import type { Figure } from '../../models/figures';
import type { LayoutFnc } from '../../models/layouts';

export const GRID = { rows: 2, cols: 2 };

const slotTestsLayout: LayoutFnc = () => {
  if (process.env.NODE_ENV !== 'production') {
    return [
      (): [Figure<'md'>] => [
        { type: 'md', data: '0,1,2,3 (all) (auto)', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        { type: 'md', data: '0,2 (left) (auto)', params: {} },
        { type: 'md', data: '1,3 (right) (auto)', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>, Figure<'md'>] => [
        { type: 'md', data: '0 (top-left) (auto)', params: {} },
        { type: 'md', data: '1 (top-right) (auto)', params: {} },
        { type: 'md', data: '2,3 (bottom) (auto)', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>, Figure<'md'>, Figure<'md'>] => [
        { type: 'md', data: '0 (top-left) (auto)', params: {} },
        { type: 'md', data: '1 (top-right) (auto)', params: {} },
        { type: 'md', data: '2 (bottom-left) (auto)', params: {} },
        { type: 'md', data: '3 (bottom-right) (auto)', params: {} },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        {
          type: 'md', data: '0 (top-left)', params: {}, slots: [0],
        },
        {
          type: 'md', data: '3 (bottom-right)', params: {}, slots: [3],
        },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        {
          type: 'md', data: '1 (top-right)', params: {}, slots: [1],
        },
        {
          type: 'md', data: '2 (bottom-left)', params: {}, slots: [2],
        },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        {
          type: 'md', data: '0,1 (top)', params: {}, slots: [0, 1],
        },
        {
          type: 'md', data: '2,3 (bottom)', params: {}, slots: [2, 3],
        },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        {
          type: 'md', data: '0,2 (left)', params: {}, slots: [0, 2],
        },
        {
          type: 'md', data: '1,3 (right)', params: {}, slots: [1, 3],
        },
      ],
      (): [Figure<'md'>] => [
        {
          type: 'md', data: '0,1,2,3 (all)', params: {}, slots: [0, 1, 2, 3],
        },
      ],
    ];
  }
  return [];
};

export default slotTestsLayout;
