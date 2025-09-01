import { describe, it, expect } from "vitest";

// Example utility functions that would be tested
function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

function validateEircode(eircode: string): boolean {
  const eircodeRegex =
    /^[A-C|D|F-H|K|N|P|R|T-Y][0-9]{2}\s?[A-C|D|F-H|K|N|P|R|T-Y|0-9]{4}$/i;
  return eircodeRegex.test(eircode.replace(/\s/g, ""));
}

function validateIBAN(iban: string): boolean {
  const ibanRegex = /^IE[0-9]{2}[A-Z]{4}[0-9]{14}$/;
  return ibanRegex.test(iban.replace(/\s/g, ""));
}

function calculateAllocation(
  beneficiaries: Array<{ allocation: number }>,
): number {
  return beneficiaries.reduce(
    (total, beneficiary) => total + beneficiary.allocation,
    0,
  );
}

describe("Utility Functions", () => {
  describe("formatCurrency", () => {
    it("formats EUR currency correctly", () => {
      expect(formatCurrency(1000)).toBe("€1,000.00");
      expect(formatCurrency(500000)).toBe("€500,000.00");
      expect(formatCurrency(0)).toBe("€0.00");
    });

    it("formats USD currency correctly", () => {
      expect(formatCurrency(1000, "USD")).toBe("$1,000.00");
    });

    it("handles decimal values", () => {
      expect(formatCurrency(1234.56)).toBe("€1,234.56");
      expect(formatCurrency(999.99)).toBe("€999.99");
    });

    it("handles negative values", () => {
      expect(formatCurrency(-500)).toBe("-€500.00");
    });
  });

  describe("validateEircode", () => {
    it("validates correct Eircode formats", () => {
      expect(validateEircode("D02 X285")).toBe(true);
      expect(validateEircode("A65 F4E2")).toBe(true);
      expect(validateEircode("T12 AB34")).toBe(true);
    });

    it("validates Eircode without spaces", () => {
      expect(validateEircode("D02X285")).toBe(true);
      expect(validateEircode("A65F4E2")).toBe(true);
    });

    it("rejects invalid Eircode formats", () => {
      expect(validateEircode("123 ABC4")).toBe(false);
      expect(validateEircode("D2X 285")).toBe(false);
      expect(validateEircode("D02 X28")).toBe(false);
      expect(validateEircode("invalid")).toBe(false);
      expect(validateEircode("")).toBe(false);
    });

    it("handles case insensitivity", () => {
      expect(validateEircode("d02 x285")).toBe(true);
      expect(validateEircode("D02 x285")).toBe(true);
    });
  });

  describe("validateIBAN", () => {
    it("validates correct Irish IBAN format", () => {
      expect(validateIBAN("IE29AIBK93115212345678")).toBe(true);
      expect(validateIBAN("IE64IRCE92050112345678")).toBe(true);
    });

    it("handles IBAN with spaces", () => {
      expect(validateIBAN("IE29 AIBK 9311 5212 3456 78")).toBe(true);
    });

    it("rejects invalid IBAN formats", () => {
      expect(validateIBAN("GB29NWBK60161331926819")).toBe(false); // Wrong country
      expect(validateIBAN("IE29AIBK931152123456")).toBe(false); // Too short
      expect(validateIBAN("IE29AIBK9311521234567890")).toBe(false); // Too long
      expect(validateIBAN("invalid")).toBe(false);
      expect(validateIBAN("")).toBe(false);
    });
  });

  describe("calculateAllocation", () => {
    it("calculates total allocation correctly", () => {
      const beneficiaries = [
        { allocation: 50 },
        { allocation: 30 },
        { allocation: 20 },
      ];
      expect(calculateAllocation(beneficiaries)).toBe(100);
    });

    it("handles empty array", () => {
      expect(calculateAllocation([])).toBe(0);
    });

    it("handles single beneficiary", () => {
      expect(calculateAllocation([{ allocation: 100 }])).toBe(100);
    });

    it("handles decimal allocations", () => {
      const beneficiaries = [
        { allocation: 33.33 },
        { allocation: 33.33 },
        { allocation: 33.34 },
      ];
      expect(calculateAllocation(beneficiaries)).toBeCloseTo(100, 2);
    });

    it("identifies over-allocation", () => {
      const beneficiaries = [{ allocation: 60 }, { allocation: 50 }];
      expect(calculateAllocation(beneficiaries)).toBe(110);
      expect(calculateAllocation(beneficiaries) > 100).toBe(true);
    });

    it("identifies under-allocation", () => {
      const beneficiaries = [{ allocation: 40 }, { allocation: 30 }];
      expect(calculateAllocation(beneficiaries)).toBe(70);
      expect(calculateAllocation(beneficiaries) < 100).toBe(true);
    });
  });
});
