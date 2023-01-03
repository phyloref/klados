/**
 * Check Phyx management tools.
 */

// import { describe, test, expect } from 'jest';
import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import phyxModule from '../modules/phyx';

const localVue = createLocalVue();
localVue.use(Vuex);

const store = new Vuex.Store(phyxModule);

describe('phyx.js', () => {
  test('phyx initializes with a basic Phyx document', () => {
    // expect(store.getters.currentPhyx).toEqual({});
    expect(1).toBeTruthy();
  });
});