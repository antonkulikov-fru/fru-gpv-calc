import defaultScenario from '../src/data/defaultScenario.json';
import { loadScenarios, saveScenarios } from '../src/services/scenario-storage';
import { ScenarioState } from '../src/types/schema';

describe('scenario-storage normalization', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('adds missing channels and surfaces to stored scenarios', () => {
        const baseline = defaultScenario as ScenarioState;
        const scenario = structuredClone(baseline) as ScenarioState;

        scenario.entities.channels = scenario.entities.channels.filter(
            (channel) => channel.channelId !== 'phone' && channel.channelId !== 'direct_mail'
        );
        scenario.entities.surfaces = scenario.entities.surfaces.filter(
            (surface) =>
                surface.surfaceId !== 'virtual_terminal' && surface.surfaceId !== 'api'
        );

        scenario.inputs.channelMix = scenario.inputs.channelMix.filter(
            (item) => item.channelId !== 'phone' && item.channelId !== 'direct_mail'
        );
        scenario.inputs.surfaceMix = scenario.inputs.surfaceMix.filter(
            (item) => item.surfaceId !== 'virtual_terminal' && item.surfaceId !== 'api'
        );
        scenario.inputs.donationModelMix = scenario.inputs.donationModelMix.filter(
            (item) => item.surfaceId !== 'virtual_terminal' && item.surfaceId !== 'api'
        );
        scenario.inputs.cr1 = scenario.inputs.cr1.filter(
            (item) => item.surfaceId !== 'virtual_terminal' && item.surfaceId !== 'api'
        );
        scenario.inputs.processorFees = scenario.inputs.processorFees.filter(
            (item) => item.channelId !== 'phone' && item.channelId !== 'direct_mail'
        );
        scenario.inputs.feeCoverage = scenario.inputs.feeCoverage.filter(
            (item) => item.channelId !== 'phone' && item.channelId !== 'direct_mail'
        );

        saveScenarios([scenario]);

        const [normalized] = loadScenarios();

        const channelIds = normalized.entities.channels.map((channel) => channel.channelId);
        const surfaceIds = normalized.entities.surfaces.map((surface) => surface.surfaceId);

        expect(channelIds).toEqual(expect.arrayContaining(['phone', 'direct_mail']));
        expect(surfaceIds).toEqual(expect.arrayContaining(['virtual_terminal', 'api']));

        normalized.entities.orgs.forEach((org) => {
            expect(
                normalized.inputs.channelMix.some(
                    (item) => item.orgId === org.orgId && item.channelId === 'phone'
                )
            ).toBe(true);
            expect(
                normalized.inputs.channelMix.some(
                    (item) => item.orgId === org.orgId && item.channelId === 'direct_mail'
                )
            ).toBe(true);

            expect(
                normalized.inputs.surfaceMix.some(
                    (item) =>
                        item.orgId === org.orgId &&
                        item.channelId === 'phone' &&
                        item.surfaceId === 'virtual_terminal'
                )
            ).toBe(true);
            expect(
                normalized.inputs.surfaceMix.some(
                    (item) =>
                        item.orgId === org.orgId &&
                        item.channelId === 'direct_mail' &&
                        item.surfaceId === 'api'
                )
            ).toBe(true);

            expect(
                normalized.inputs.donationModelMix.some(
                    (item) => item.orgId === org.orgId && item.surfaceId === 'virtual_terminal'
                )
            ).toBe(true);
            expect(
                normalized.inputs.donationModelMix.some(
                    (item) => item.orgId === org.orgId && item.surfaceId === 'api'
                )
            ).toBe(true);
        });

        expect(
            normalized.inputs.cr1.some(
                (item) => item.surfaceId === 'virtual_terminal' && item.donationModelId === 'campaign'
            )
        ).toBe(true);
        expect(
            normalized.inputs.cr1.some(
                (item) => item.surfaceId === 'api' && item.donationModelId === 'campaign'
            )
        ).toBe(true);

        expect(
            normalized.inputs.processorFees.some(
                (item) => item.channelId === 'phone' && item.cadence === 'ONE_TIME'
            )
        ).toBe(true);
        expect(
            normalized.inputs.processorFees.some(
                (item) => item.channelId === 'direct_mail' && item.cadence === 'RECURRING'
            )
        ).toBe(true);

        expect(
            normalized.inputs.feeCoverage.some((item) => item.channelId === 'phone')
        ).toBe(true);
        expect(
            normalized.inputs.feeCoverage.some((item) => item.channelId === 'direct_mail')
        ).toBe(true);
    });
});
