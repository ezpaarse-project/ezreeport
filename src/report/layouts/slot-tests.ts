import { Figure, LayoutFnc, SlotIndex } from '../models/reports';

/**
 * ! Remember to generate with /tasks/{id}/run?test_emails[]=<your_mail>&debug=true
 */

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
          type: 'md', data: '0 (top-left)', params: {}, slots: [SlotIndex.TOP_LEFT],
        },
        {
          type: 'md', data: '3 (bottom-right)', params: {}, slots: [SlotIndex.BOTTOM_RIGHT],
        },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        {
          type: 'md', data: '1 (top-right)', params: {}, slots: [SlotIndex.TOP_RIGHT],
        },
        {
          type: 'md', data: '2 (bottom-left)', params: {}, slots: [SlotIndex.BOTTOM_LEFT],
        },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        {
          type: 'md', data: '0,1 (top)', params: {}, slots: [SlotIndex.TOP_LEFT, SlotIndex.TOP_RIGHT],
        },
        {
          type: 'md', data: '2,3 (bottom)', params: {}, slots: [SlotIndex.BOTTOM_LEFT, SlotIndex.BOTTOM_RIGHT],
        },
      ],
      (): [Figure<'md'>, Figure<'md'>] => [
        {
          type: 'md', data: '0,2 (left)', params: {}, slots: [SlotIndex.TOP_LEFT, SlotIndex.BOTTOM_LEFT],
        },
        {
          type: 'md', data: '1,3 (right)', params: {}, slots: [SlotIndex.TOP_RIGHT, SlotIndex.BOTTOM_RIGHT],
        },
      ],
      (): [Figure<'md'>] => [
        {
          type: 'md', data: '0,1,2,3 (all)', params: {}, slots: [SlotIndex.TOP_LEFT, SlotIndex.TOP_RIGHT, SlotIndex.BOTTOM_LEFT, SlotIndex.BOTTOM_RIGHT],
        },
      ],
    ];
  }
  return [];
};

export default slotTestsLayout;
