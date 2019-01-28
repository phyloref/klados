import { mount } from '@vue/test-utils';
import ModifiedCard from '../src/components/cards/ModifiedCard';

describe('ModifiedCard', () => {
    test('is a Vue instance', () => {
        const wrapper = mount(ModifiedCard);
        expect(wrapper.isVueInstance()).toBeTruthy();
    });
});
