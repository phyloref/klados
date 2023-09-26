import { mount } from "@vue/test-utils";
import ModifiedCard from "./ModifiedCard";

describe("ModifiedCard", () => {
  test("should be accessible as a Vue instance", () => {
    const wrapper = mount(ModifiedCard);
    expect(wrapper.isVueInstance()).toBeTruthy();
  });
  test("is initially invisible", () => {
    const wrapper = mount(ModifiedCard);
    expect(wrapper.contains("div")).toBeFalsy();
  });
  test("remains invisible if the comparison values provided are identical", () => {
    const wrapper = mount(ModifiedCard, {
      propsData: {
        compare: { key: "test1" },
        compareTo: { key: "test1" },
      },
    });
    expect(wrapper.contains("div")).toBeFalsy();
  });
  test("becomes visible if the comparison values provided are different", () => {
    const wrapper = mount(ModifiedCard, {
      propsData: {
        compare: { key: "test1" },
        compareTo: { key: "test2" },
      },
    });
    expect(wrapper.contains("div")).toBeTruthy();
  });
  test("becomes visible if one of the comparison value is undefined", () => {
    const wrapper = mount(ModifiedCard, {
      propsData: {
        compare: { key: "test1" },
        compareTo: undefined,
      },
    });
    expect(wrapper.contains("div")).toBeTruthy();
  });
});
