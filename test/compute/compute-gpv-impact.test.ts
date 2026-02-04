import defaultScenario from '../../src/data/defaultScenario.json';
import { computeGpvImpact } from '../../src/services/compute/compute-gpv-impact';
import { validateScenarioState } from '../../src/services/compute/validation';
import { ScenarioState } from '../../src/types/schema';

const scenario = defaultScenario as ScenarioState;

describe('computeGpvImpact', () => {
    it('computes GPV, revenue, and net proceeds for the default scenario', () => {
        const validation = validateScenarioState(scenario);
        expect(validation.errors).toHaveLength(0);

        const result = computeGpvImpact(scenario);

        expect(result.computedOutputs.gpv.byCadence.ONE_TIME).toBeCloseTo(
            307_125_000,
            2
        );
        expect(result.computedOutputs.gpv.byCadence.RECURRING).toBeCloseTo(
            246_698_156.25,
            2
        );
        expect(result.computedOutputs.gpv.total).toBeCloseTo(553_823_156.25, 2);
        expect(result.computedOutputs.fundraiseupRevenue.total).toBeCloseTo(
            19_383_810.47,
            2
        );
        expect(result.computedOutputs.orgNetProceeds.total).toBeCloseTo(
            529_087_198.8,
            2
        );
    });

    it('flags distributions that do not sum to 1', () => {
        const brokenScenario: ScenarioState = JSON.parse(
            JSON.stringify(scenario)
        );
        brokenScenario.inputs.channelMix[0].share = 0.9;

        const validation = validateScenarioState(brokenScenario);
        expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('uses per-row execution inputs for CR-2 and amounts', () => {
        const rowScenario: ScenarioState = JSON.parse(
            JSON.stringify(scenario)
        );

        rowScenario.inputs.intentFormation = rowScenario.inputs.intentFormation.map(
            (item) =>
                item.verticalId === 'cause_cure'
                    ? { ...item, intentTam: 100 }
                    : { ...item, intentTam: 0 }
        );
        rowScenario.inputs.intentAttribution = rowScenario.inputs.intentAttribution.map(
            (item) =>
                item.orgId === 'org-cause'
                    ? { ...item, intentShareWithinVertical: 1 }
                    : { ...item, intentShareWithinVertical: 0 }
        );

        rowScenario.inputs.channelMix = rowScenario.inputs.channelMix.map((item) =>
            item.orgId === 'org-cause'
                ? { ...item, share: item.channelId === 'online' ? 1 : 0 }
                : { ...item, share: item.channelId === 'online' ? 1 : 0 }
        );

        rowScenario.inputs.surfaceMix = rowScenario.inputs.surfaceMix.map((item) => {
            if (item.orgId !== 'org-cause' || item.channelId !== 'online') {
                return item;
            }
            return {
                ...item,
                share: item.surfaceId === 'website' ? 0.5 : item.surfaceId === 'donor_portal' ? 0.5 : 0,
            };
        });

        rowScenario.inputs.cr1 = rowScenario.inputs.cr1.map((item) =>
            item.surfaceId === 'website' || item.surfaceId === 'donor_portal'
                ? { ...item, cr1IntentToOpportunity: 1 }
                : item
        );

        rowScenario.inputs.cadenceSplit = rowScenario.inputs.cadenceSplit.map((item) =>
            item.donationModelId === 'campaign'
                ? { ...item, shareOneTime: 1, shareRecurring: 0 }
                : item
        );

        rowScenario.inputs.cr2 = rowScenario.inputs.cr2.map((item) =>
            item.orgId === 'org-cause' &&
                (item.surfaceId === 'website' || item.surfaceId === 'donor_portal') &&
                item.cadence === 'ONE_TIME'
                ? { ...item, cr2OpportunityToDonation: 1 }
                : item
        );

        rowScenario.inputs.donationAmount = rowScenario.inputs.donationAmount.map(
            (item) => {
                if (item.orgId !== 'org-cause' || item.cadence !== 'ONE_TIME') {
                    return item;
                }
                if (item.surfaceId === 'website') {
                    return { ...item, avgAmount: 1 };
                }
                if (item.surfaceId === 'donor_portal') {
                    return { ...item, avgAmount: 2 };
                }
                return item;
            }
        );

        const baseResult = computeGpvImpact(rowScenario);
        expect(baseResult.computedOutputs.gpv.byCadence.ONE_TIME).toBeCloseTo(150, 5);

        rowScenario.inputs.donationAmount = rowScenario.inputs.donationAmount.map(
            (item) =>
                item.orgId === 'org-cause' && item.surfaceId === 'website' && item.cadence === 'ONE_TIME'
                    ? { ...item, avgAmount: 3 }
                    : item
        );

        const updatedResult = computeGpvImpact(rowScenario);
        expect(updatedResult.computedOutputs.gpv.byCadence.ONE_TIME).toBeCloseTo(250, 5);
    });
});
