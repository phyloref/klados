import { mount } from '@vue/test-utils';
import ModifiedCard from './ModifiedCard.vue';

// Mounts a ModifiedCard with these props and reports whether it rendered the card.
function rendersCard(propsData) {
  return mount(ModifiedCard, { propsData }).find('div').exists();
}

describe('ModifiedCard', () => {
  test('should be accessible as a Vue instance', () => {
    const wrapper = mount(ModifiedCard);
    expect(wrapper.vm).toBeTruthy();
  });
  test('is initially invisible', () => {
    expect(rendersCard()).toBe(false);
  });
  test('remains invisible if the comparison values provided are identical', () => {
    expect(rendersCard({ compare: { key: 'test1' }, compareTo: { key: 'test1' } })).toBe(false);
  });
  test('becomes visible if the comparison values provided are different', () => {
    expect(rendersCard({ compare: { key: 'test1' }, compareTo: { key: 'test2' } })).toBe(true);
  });
  test('becomes visible if one of the comparison value is undefined', () => {
    expect(rendersCard({ compare: { key: 'test1' }, compareTo: undefined })).toBe(true);
  });
});
