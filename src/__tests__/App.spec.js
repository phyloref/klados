import { mount } from '@vue/test-utils';
import App from '../App.vue';

describe('App', () => {
    describe('Integration tests', () => {
        describe('Try demo run', () => {
            let wrapper;
            test('is initially loaded', () => {
                wrapper = mount(App);
                const navBarTitle = wrapper.findComponent("nav.navbar a");
                expect(navBarTitle.text()).toEqual("Klados");
                expect(navBarTitle.get("[href]").text()).toEqual("index.html");
            });
        });
    });
});