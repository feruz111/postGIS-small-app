// lib/evaluateBuildability.ts
type ParcelInput = {
    zoningCode: string | null;
    frontageM: number | null;
    flood: boolean;
};

export type Buildability = {
    allowADU: boolean;
    notes: string[];
    checks: { zoningAllows: boolean; frontageOk: boolean; notFlood: boolean };
};

export function evaluateBuildability(p: ParcelInput): Buildability {
    const zoningAllows = p.zoningCode === "R2";
    const notFlood = !p.flood;

    const allowADU = zoningAllows && notFlood;

    const frontageVal = p.frontageM == null ? 0 : Number(p.frontageM);
    const frontageOk = frontageVal >= 9;

    const notes: string[] = [];
    notes.push(
        zoningAllows ? "Zoning R2 permits ADU." : `Zoning ${p.zoningCode ?? "N/A"} does not permit ADU.`
    );
    notes.push(
        frontageOk
            ? `Frontage ${frontageVal.toFixed(1)}m ≥ 9m.`
            : `Frontage ${frontageVal.toFixed(1)}m < 9m.`
    );
    notes.push(notFlood ? "Not in flood zone." : "In flood zone.");

    return { allowADU, notes, checks: { zoningAllows, frontageOk, notFlood } };
}