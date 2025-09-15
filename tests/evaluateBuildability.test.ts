import { evaluateBuildability } from "../lib/evaluateBuildability";

describe("evaluateBuildability", () => {
    test("R2 zoning, 10m frontage, not in flood → allows ADU", () => {
        const result = evaluateBuildability({ zoningCode: "R2", frontageM: 10, flood: false });
        expect(result.allowADU).toBe(true);
        expect(result.checks).toEqual({ zoningAllows: true, frontageOk: true, notFlood: true });
        expect(result.notes).toEqual([
            "Zoning R2 permits ADU.",
            "Frontage 10.0m ≥ 9m.",
            "Not in flood zone.",
        ]);
    });

    test("non-R2 zoning (R1) → disallows ADU, frontage still evaluated", () => {
        const result = evaluateBuildability({ zoningCode: "R1", frontageM: 12, flood: false });
        expect(result.allowADU).toBe(false);
        expect(result.checks).toEqual({ zoningAllows: false, frontageOk: true, notFlood: true });
        expect(result.notes).toEqual([
            "Zoning R1 does not permit ADU.",
            "Frontage 12.0m ≥ 9m.",
            "Not in flood zone.",
        ]);
    });

    test("frontage exactly 9.0m → frontageOk true", () => {
        const result = evaluateBuildability({ zoningCode: "R2", frontageM: 9, flood: false });
        expect(result.checks.frontageOk).toBe(true);
        expect(result.notes[1]).toBe("Frontage 9.0m ≥ 9m.");
        expect(result.allowADU).toBe(true);
    });

    test("frontage 8.9m → frontageOk false (edge)", () => {
        const result = evaluateBuildability({ zoningCode: "R2", frontageM: 8.9, flood: false });
        expect(result.checks.frontageOk).toBe(false);
        expect(result.notes[1]).toBe("Frontage 8.9m < 9m.");
        // Note: allowADU depends only on zoning and flood per current logic
        expect(result.allowADU).toBe(true);
    });

    test("no zoning found (null) → treated as not permitted", () => {
        const result = evaluateBuildability({ zoningCode: null, frontageM: 10, flood: false });
        expect(result.allowADU).toBe(false);
        expect(result.checks).toEqual({ zoningAllows: false, frontageOk: true, notFlood: true });
        expect(result.notes[0]).toBe("Zoning N/A does not permit ADU.");
    });

    test("in flood zone → notFlood false and disallow ADU", () => {
        const result = evaluateBuildability({ zoningCode: "R2", frontageM: 9, flood: true });
        expect(result.checks.notFlood).toBe(false);
        expect(result.allowADU).toBe(false);
        expect(result.notes[2]).toBe("In flood zone.");
    });

    test("frontage null → treated as 0.0m and frontageOk false", () => {
        const result = evaluateBuildability({ zoningCode: "R2", frontageM: null, flood: false });
        expect(result.checks.frontageOk).toBe(false);
        expect(result.notes[1]).toBe("Frontage 0.0m < 9m.");
        // allowADU still true because frontage is not part of allowADU decision
        expect(result.allowADU).toBe(true);
    });

    test("rounding nuance: 8.95m shows 8.9m due to FP rounding, still < 9m", () => {
        const result = evaluateBuildability({ zoningCode: "R2", frontageM: 8.95, flood: false });
        expect(result.checks.frontageOk).toBe(false);
        expect(result.notes[1]).toBe("Frontage 8.9m < 9m.");
    });
});


