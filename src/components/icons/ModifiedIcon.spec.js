import { mount } from '@vue/test-utils';
import ModifiedIcon from './ModifiedIcon.vue';

describe('ModifiedIcon', () => {
  test('is initially invisible', () => {
    const wrapper = mount(ModifiedIcon);
    expect(wrapper.findComponent("div").exists()).toBeFalsy();
  });
  test('remains invisible if the comparison values provided are identical', () => {
    const wrapper = mount(ModifiedIcon, {
      propsData: {
        compare: { key: 'test1' },
        compareTo: { key: 'test1' },
      },
    });
    expect(wrapper.findComponent("div").exists()).toBeFalsy();
  });
  test('becomes visible if the comparison values provided are different', () => {
    const wrapper = mount(ModifiedIcon, {
      propsData: {
        compare: { key: 'test1' },
        compareTo: { key: 'test2' },
      },
    });
    expect(wrapper.findComponent("div").exists()).toBeTruthy();
  });
  test('becomes visible if one of the comparison values is undefined', () => {
    const wrapper = mount(ModifiedIcon, {
      propsData: {
        compare: { key: 'test1' },
        compareTo: undefined,
      },
    });
    expect(wrapper.findComponent("div").exists()).toBeTruthy();
  });
});
