import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize with provided initial value", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
    expect(result.current[0]).toBe("initial");
  });

  it("should persist value to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("updated"));
  });

  it("should retrieve value from localStorage on mount", () => {
    localStorage.setItem("test-key", JSON.stringify("stored"));

    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
    expect(result.current[0]).toBe("stored");
  });

  it("should handle function updates", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it("should remove value from localStorage", () => {
    localStorage.setItem("test-key", JSON.stringify("value"));

    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe("initial");
    expect(localStorage.getItem("test-key")).toBeNull();
  });

  it("should handle complex objects", () => {
    const obj = { name: "test", value: 42 };
    const { result } = renderHook(() => useLocalStorage("test-key", obj));

    act(() => {
      result.current[1]({ name: "updated", value: 100 });
    });

    expect(result.current[0]).toEqual({ name: "updated", value: 100 });
  });

  it("should handle arrays", () => {
    const arr = ["a", "b", "c"];
    const { result } = renderHook(() => useLocalStorage("test-key", arr));

    act(() => {
      result.current[1](["x", "y", "z"]);
    });

    expect(result.current[0]).toEqual(["x", "y", "z"]);
  });

  it("should handle localStorage errors gracefully", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Mock localStorage to throw error
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });

    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[1]("updated");
    });

    expect(consoleSpy).toHaveBeenCalled();

    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
