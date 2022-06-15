import { shallowMount } from '@vue/test-utils';
// const App = require('../App');
import Sidebar from "@/components/sidebar/Sidebar";

// const wrapper = shallowMount(App);

describe('App', () => {
    describe('Integration tests', () => {
        describe('Try demo run', () => {
            test('is initially loaded', () => {
                expect(1).toBeTruthy();

                /*
                const navBarTitle = wrapper.findComponent("nav.navbar a");
                expect(navBarTitle.text()).toEqual("Klados");
                expect(navBarTitle.get("[href]").text()).toEqual("index.html");

                 */
            });
        });
    });
});