import { describe, it, expect } from "@jest/globals";
import {
  gstinFrom,
  stateFromGstin,
  pickReferenceCounter,
  freeBillLetter,
  pickSettingsTemplate,
  gstinFallbacksToClear,
  coerceSetting,
} from "../sqlOrg.js";

describe("sqlOrg helpers", () => {
  it("finds the GSTIN inside Textilesoft's labelled tax fields", () => {
    expect(gstinFrom("", "GST NO : 33AFNPA6099M1ZZ")).toBe("33AFNPA6099M1ZZ");
    expect(gstinFrom("  33afnpa6099m1zz ")).toBe("33AFNPA6099M1ZZ");
    expect(gstinFrom("", "TIN 1234", null)).toBe("");
  });

  it("derives the state from the GSTIN", () => {
    expect(stateFromGstin("33AFNPA6099M1ZZ")).toBe("Tamil Nadu");
    expect(stateFromGstin("")).toBe("");
  });
});

describe("new counter: which counter it copies, and its bill letter", () => {
  const old = {
    sl_no: "1",
    counter_name: "OLDPC",
    counter_mode: "A",
    st_mode: "A",
    year_from: new Date("2019-04-01"),
    year_to: new Date("2020-03-31"),
    last_bil_up_date: new Date("2020-03-30"),
  };
  const server = {
    sl_no: "2",
    counter_name: "SERVER",
    counter_mode: "B",
    st_mode: "B",
    year_from: new Date("2026-04-01"),
    year_to: new Date("2027-03-31"),
    last_bil_up_date: new Date("2026-09-29"),
  };
  const user2 = { ...server, sl_no: "3", counter_name: "USER2", counter_mode: "C", st_mode: "D" };

  it("copies the year window from the counter billed most recently, not the first row", () => {
    expect(pickReferenceCounter([old, server])?.counter_name).toBe("SERVER");
    const user2Later = { ...user2, last_bil_up_date: new Date("2026-09-30") };
    expect(pickReferenceCounter([old, server, user2Later])?.counter_name).toBe("USER2");
  });

  it("falls back to latest year_to, then lowest sl_no; understands dd/mm/yyyy text", () => {
    const a = { sl_no: "5", counter_name: "A", year_to: "31/03/2020", last_bil_up_date: null };
    const b = { sl_no: "9", counter_name: "B", year_to: "31/03/2027", last_bil_up_date: null };
    expect(pickReferenceCounter([a, b])?.counter_name).toBe("B");
    const c = { ...b, sl_no: "4", counter_name: "C" };
    expect(pickReferenceCounter([b, c])?.counter_name).toBe("C");
    expect(pickReferenceCounter([])).toBeUndefined();
  });

  it("a bill letter used in counter_mode OR st_mode is taken", () => {
    expect(freeBillLetter([old, server, user2])).toBe("E"); // A, B, C, D (st_mode) used
    expect(freeBillLetter([{ counter_mode: " a ", st_mode: "" }])).toBe("B");
    const all = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((l) => ({ counter_mode: l }));
    expect(freeBillLetter(all)).toBeUndefined();
  });

  it("settings come from the reference counter, skipping rows of deleted counters", () => {
    const settings = [
      { ID: 1, Counter: "DELETEDPC", PrinterName: "old" },
      { ID: 2, Counter: "oldpc", PrinterName: "p1" },
      { ID: 3, Counter: "SERVER", PrinterName: "p2" },
    ];
    expect(pickSettingsTemplate(settings, [old, server], server)?.ID).toBe(3);
    // reference counter has no settings row -> lowest sl_no live counter's row, not the orphan row
    expect(pickSettingsTemplate(settings.slice(0, 2), [old, server], server)?.ID).toBe(2);
    // no row belongs to a live counter -> first row
    expect(pickSettingsTemplate(settings.slice(0, 1), [old, server], server)?.ID).toBe(1);
    expect(pickSettingsTemplate([], [old], old)).toBeUndefined();
  });
});

describe("company GSTIN can be cleared or replaced", () => {
  it("blanks only the fallback fields that hold a GSTIN (a real TIN stays)", () => {
    expect(
      gstinFallbacksToClear({ sgst: "GST NO : 33AFNPA6099M1ZZ", cgst: "", tin_nu: "33123456789" }),
    ).toEqual({ sgst: "" });
    expect(gstinFallbacksToClear({ sgst: "", cgst: "", tin_nu: "33afnpa6099m1zz" })).toEqual({ tin_nu: "" });
    expect(gstinFallbacksToClear({ sgst: null, cgst: undefined, tin_nu: "TIN 1234" })).toEqual({});
  });
});

describe("counter settings are saved in their column's type", () => {
  const col = (type: string, nullable = true, maxLength: number | null = null) => ({ type, nullable, maxLength });

  it("bit: yes/no, true/false, 1/0 (and the text listCounters sends back)", () => {
    for (const v of ["1", "true", "Yes", "Y", "on", true]) expect(coerceSetting("S", v, col("bit"))).toBe(true);
    for (const v of ["0", "false", "no", "N", false]) expect(coerceSetting("S", v, col("bit"))).toBe(false);
    expect(() => coerceSetting("PrintBill", "maybe", col("bit"))).toThrow(/PrintBill must be yes or no/);
  });

  it("numbers and dates", () => {
    expect(coerceSetting("S", "12", col("int"))).toBe(12);
    expect(() => coerceSetting("S", "12.5", col("int"))).toThrow(/whole number/);
    expect(coerceSetting("S", "1,250.75", col("decimal"))).toBe(1250.75);
    expect(() => coerceSetting("S", "abc", col("float"))).toThrow(/a number/);
    expect(coerceSetting("S", "2026-09-30T00:00:00.000Z", col("datetime"))).toEqual(new Date("2026-09-30T00:00:00.000Z"));
    expect(() => coerceSetting("S", "not a date", col("datetime"))).toThrow(/a date/);
  });

  it("empty: NULL when the column allows it, otherwise refused; text keeps its length limit", () => {
    expect(coerceSetting("S", "", col("int"))).toBeNull();
    expect(() => coerceSetting("S", "", col("int", false))).toThrow(/a number/);
    expect(coerceSetting("S", "", col("varchar", false))).toBe("");
    expect(coerceSetting("S", "EPSON", col("varchar", true, 10))).toBe("EPSON");
    expect(() => coerceSetting("Printer", "A VERY LONG PRINTER NAME", col("varchar", true, 10))).toThrow(/at most 10/);
  });
});
