import defaultScenario from '../data/defaultScenario.json';
import { Cadence, ScenarioState } from '../types/schema';

const STORAGE_KEY = 'gpvImpactScenarios';
const DEFAULT_SCENARIO = defaultScenario as ScenarioState;
const CADENCES: Cadence[] = ['ONE_TIME', 'RECURRING'];

const CHANNEL_SURFACE_MAP: Record<string, string[]> = {
    online: ['website', 'donor_portal'],
    offline: ['mobile_app'],
    phone: ['virtual_terminal'],
    direct_mail: ['api'],
};

function mergeById<T>(current: T[], defaults: T[], getId: (item: T) => string): T[] {
    const existingIds = new Set(current.map(getId));
    const merged = [...current];
    defaults.forEach((item) => {
        if (!existingIds.has(getId(item))) {
            merged.push(item);
        }
    });
    return merged;
}

function buildKey(...parts: Array<string | number>): string {
    return parts.join('::');
}

function normalizeScenario(scenario: ScenarioState): ScenarioState {
    const defaultScenarioState = DEFAULT_SCENARIO;
    const mergedEntities = {
        ...scenario.entities,
        channels: mergeById(
            scenario.entities.channels,
            defaultScenarioState.entities.channels,
            (item) => item.channelId
        ),
        surfaces: mergeById(
            scenario.entities.surfaces,
            defaultScenarioState.entities.surfaces,
            (item) => item.surfaceId
        ),
        donationModels: mergeById(
            scenario.entities.donationModels,
            defaultScenarioState.entities.donationModels,
            (item) => item.donationModelId
        ),
    };

    const defaultChannelMix = new Map(
        defaultScenarioState.inputs.channelMix.map((item) => [
            buildKey(item.orgId, item.channelId),
            item,
        ])
    );
    const defaultSurfaceMix = new Map(
        defaultScenarioState.inputs.surfaceMix.map((item) => [
            buildKey(item.orgId, item.channelId, item.surfaceId),
            item,
        ])
    );
    const defaultDonationModelMix = new Map(
        defaultScenarioState.inputs.donationModelMix.map((item) => [
            buildKey(item.orgId, item.surfaceId, item.donationModelId),
            item,
        ])
    );
    const defaultCr1 = new Map(
        defaultScenarioState.inputs.cr1.map((item) => [
            buildKey(item.surfaceId, item.donationModelId),
            item,
        ])
    );
    const defaultCr2 = new Map(
        defaultScenarioState.inputs.cr2.map((item) => [
            buildKey(item.orgId, item.surfaceId, item.donationModelId, item.cadence),
            item,
        ])
    );
    const defaultDonationAmount = new Map(
        defaultScenarioState.inputs.donationAmount.map((item) => [
            buildKey(item.orgId, item.surfaceId, item.donationModelId, item.cadence),
            item,
        ])
    );
    const defaultExistingRecurring = new Map(
        defaultScenarioState.inputs.existingRecurringDonors.map((item) => [
            buildKey(item.orgId, item.surfaceId, item.donationModelId),
            item,
        ])
    );
    const defaultProcessorFees = new Map(
        defaultScenarioState.inputs.processorFees.map((item) => [
            buildKey(item.channelId, item.cadence),
            item,
        ])
    );
    const defaultFeeCoverage = new Map(
        defaultScenarioState.inputs.feeCoverage.map((item) => [item.channelId, item])
    );

    const channelMixByKey = new Map<string, ScenarioState['inputs']['channelMix'][number]>();
    scenario.inputs.channelMix.forEach((item) => {
        channelMixByKey.set(buildKey(item.orgId, item.channelId), item);
    });
    const surfaceMixByKey = new Map<string, ScenarioState['inputs']['surfaceMix'][number]>();
    scenario.inputs.surfaceMix.forEach((item) => {
        const allowedSurfaces = CHANNEL_SURFACE_MAP[item.channelId] ?? [];
        if (!allowedSurfaces.includes(item.surfaceId)) {
            return;
        }
        surfaceMixByKey.set(buildKey(item.orgId, item.channelId, item.surfaceId), item);
    });
    const donationModelMixByKey = new Map<
        string,
        ScenarioState['inputs']['donationModelMix'][number]
    >();
    scenario.inputs.donationModelMix.forEach((item) => {
        donationModelMixByKey.set(
            buildKey(item.orgId, item.surfaceId, item.donationModelId),
            item
        );
    });
    const cr1ByKey = new Map<string, ScenarioState['inputs']['cr1'][number]>();
    scenario.inputs.cr1.forEach((item) => {
        cr1ByKey.set(buildKey(item.surfaceId, item.donationModelId), item);
    });
    const cr2ByKey = new Map<string, ScenarioState['inputs']['cr2'][number]>();
    scenario.inputs.cr2.forEach((item) => {
        if (!item.orgId || !item.surfaceId) {
            return;
        }
        cr2ByKey.set(
            buildKey(item.orgId, item.surfaceId, item.donationModelId, item.cadence),
            item
        );
    });
    const donationAmountByKey = new Map<
        string,
        ScenarioState['inputs']['donationAmount'][number]
    >();
    scenario.inputs.donationAmount.forEach((item) => {
        if (!item.orgId || !item.surfaceId) {
            return;
        }
        donationAmountByKey.set(
            buildKey(item.orgId, item.surfaceId, item.donationModelId, item.cadence),
            item
        );
    });
    const existingRecurringByKey = new Map<
        string,
        ScenarioState['inputs']['existingRecurringDonors'][number]
    >();
    scenario.inputs.existingRecurringDonors.forEach((item) => {
        if (!item.orgId || !item.surfaceId) {
            return;
        }
        existingRecurringByKey.set(
            buildKey(item.orgId, item.surfaceId, item.donationModelId),
            item
        );
    });
    const processorFeesByKey = new Map<
        string,
        ScenarioState['inputs']['processorFees'][number]
    >();
    scenario.inputs.processorFees.forEach((item) => {
        processorFeesByKey.set(buildKey(item.channelId, item.cadence), item);
    });
    const feeCoverageByKey = new Map<
        string,
        ScenarioState['inputs']['feeCoverage'][number]
    >();
    scenario.inputs.feeCoverage.forEach((item) => {
        feeCoverageByKey.set(item.channelId, item);
    });

    const nextChannelMix = new Map(channelMixByKey);
    scenario.entities.orgs.forEach((org) => {
        mergedEntities.channels.forEach((channel) => {
            const key = buildKey(org.orgId, channel.channelId);
            if (!nextChannelMix.has(key)) {
                const fallback = defaultChannelMix.get(key);
                nextChannelMix.set(
                    key,
                    fallback ?? {
                        orgId: org.orgId,
                        channelId: channel.channelId,
                        share: 0,
                        enabled: true,
                    }
                );
            }
        });
    });

    const nextSurfaceMix = new Map(surfaceMixByKey);
    scenario.entities.orgs.forEach((org) => {
        mergedEntities.channels.forEach((channel) => {
            const allowedSurfaces = CHANNEL_SURFACE_MAP[channel.channelId] ?? [];
            allowedSurfaces.forEach((surfaceId) => {
                const key = buildKey(org.orgId, channel.channelId, surfaceId);
                if (!nextSurfaceMix.has(key)) {
                    const fallback = defaultSurfaceMix.get(key);
                    const share =
                        fallback?.share ?? (allowedSurfaces.length === 1 ? 1 : 0);
                    nextSurfaceMix.set(key, {
                        orgId: org.orgId,
                        channelId: channel.channelId,
                        surfaceId,
                        share,
                        enabled: true,
                    });
                }
            });
        });
    });

    const nextDonationModelMix = new Map(donationModelMixByKey);
    const surfacesByOrg = new Map<string, string[]>();
    nextSurfaceMix.forEach((item) => {
        const existing = surfacesByOrg.get(item.orgId) ?? [];
        if (!existing.includes(item.surfaceId)) {
            existing.push(item.surfaceId);
        }
        surfacesByOrg.set(item.orgId, existing);
    });

    scenario.entities.orgs.forEach((org) => {
        const surfaces = surfacesByOrg.get(org.orgId) ?? [];
        surfaces.forEach((surfaceId) => {
            const existingModels = scenario.inputs.donationModelMix.filter(
                (item) => item.orgId === org.orgId && item.surfaceId === surfaceId
            );
            const hasExisting = existingModels.length > 0;
            mergedEntities.donationModels.forEach((model, index) => {
                const key = buildKey(org.orgId, surfaceId, model.donationModelId);
                if (!nextDonationModelMix.has(key)) {
                    const fallback = defaultDonationModelMix.get(key);
                    const share =
                        fallback?.share ?? (!hasExisting && index === 0 ? 1 : 0);
                    const enabled = fallback?.enabled ?? (!hasExisting && index === 0);
                    nextDonationModelMix.set(key, {
                        orgId: org.orgId,
                        surfaceId,
                        donationModelId: model.donationModelId,
                        share,
                        enabled,
                    });
                }
            });
        });
    });

    const nextCr1 = new Map(cr1ByKey);
    mergedEntities.surfaces.forEach((surface) => {
        mergedEntities.donationModels.forEach((model) => {
            const key = buildKey(surface.surfaceId, model.donationModelId);
            if (!nextCr1.has(key)) {
                const fallback = defaultCr1.get(key);
                nextCr1.set(key, {
                    surfaceId: surface.surfaceId,
                    donationModelId: model.donationModelId,
                    cr1IntentToOpportunity: fallback?.cr1IntentToOpportunity ?? 0.05,
                });
            }
        });
    });

    const nextCr2 = new Map(cr2ByKey);
    const nextDonationAmount = new Map(donationAmountByKey);
    const nextExistingRecurring = new Map(existingRecurringByKey);

    scenario.entities.orgs.forEach((org) => {
        const surfaces = surfacesByOrg.get(org.orgId) ?? [];
        surfaces.forEach((surfaceId) => {
            mergedEntities.donationModels.forEach((model) => {
                CADENCES.forEach((cadence) => {
                    const cr2Key = buildKey(
                        org.orgId,
                        surfaceId,
                        model.donationModelId,
                        cadence
                    );
                    if (!nextCr2.has(cr2Key)) {
                        const fallback = defaultCr2.get(cr2Key);
                        nextCr2.set(cr2Key, {
                            orgId: org.orgId,
                            surfaceId,
                            donationModelId: model.donationModelId,
                            cadence,
                            cr2OpportunityToDonation:
                                fallback?.cr2OpportunityToDonation ?? 0,
                        });
                    }

                    const amountKey = buildKey(
                        org.orgId,
                        surfaceId,
                        model.donationModelId,
                        cadence
                    );
                    if (!nextDonationAmount.has(amountKey)) {
                        const fallback = defaultDonationAmount.get(amountKey);
                        nextDonationAmount.set(amountKey, {
                            orgId: org.orgId,
                            surfaceId,
                            donationModelId: model.donationModelId,
                            cadence,
                            avgAmount: fallback?.avgAmount ?? 0,
                        });
                    }
                });

                const existingKey = buildKey(
                    org.orgId,
                    surfaceId,
                    model.donationModelId
                );
                if (!nextExistingRecurring.has(existingKey)) {
                    const fallback = defaultExistingRecurring.get(existingKey);
                    nextExistingRecurring.set(existingKey, {
                        orgId: org.orgId,
                        surfaceId,
                        donationModelId: model.donationModelId,
                        existingRecDonorsStartCy:
                            fallback?.existingRecDonorsStartCy ?? 0,
                    });
                }
            });
        });
    });

    const nextProcessorFees = new Map(processorFeesByKey);
    mergedEntities.channels.forEach((channel) => {
        CADENCES.forEach((cadence) => {
            const key = buildKey(channel.channelId, cadence);
            if (!nextProcessorFees.has(key)) {
                const fallback = defaultProcessorFees.get(key);
                nextProcessorFees.set(key, {
                    channelId: channel.channelId,
                    cadence,
                    processorFeeRate: fallback?.processorFeeRate ?? 0,
                });
            }
        });
    });

    const nextFeeCoverage = new Map(feeCoverageByKey);
    mergedEntities.channels.forEach((channel) => {
        if (!nextFeeCoverage.has(channel.channelId)) {
            const fallback = defaultFeeCoverage.get(channel.channelId);
            nextFeeCoverage.set(channel.channelId, {
                channelId: channel.channelId,
                donorFeeCoverageRate: fallback?.donorFeeCoverageRate ?? 0,
            });
        }
    });

    return {
        ...scenario,
        entities: mergedEntities,
        inputs: {
            ...scenario.inputs,
            channelMix: Array.from(nextChannelMix.values()),
            surfaceMix: Array.from(nextSurfaceMix.values()),
            donationModelMix: Array.from(nextDonationModelMix.values()),
            cr1: Array.from(nextCr1.values()),
            cr2: Array.from(nextCr2.values()),
            donationAmount: Array.from(nextDonationAmount.values()),
            existingRecurringDonors: Array.from(nextExistingRecurring.values()),
            processorFees: Array.from(nextProcessorFees.values()),
            feeCoverage: Array.from(nextFeeCoverage.values()),
        },
    };
}

export function loadScenarios(): ScenarioState[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return [normalizeScenario(DEFAULT_SCENARIO)];
    }

    try {
        const parsed = JSON.parse(stored) as ScenarioState[];
        if (parsed.length === 0) {
            return [normalizeScenario(DEFAULT_SCENARIO)];
        }
        return parsed.map((scenario) => normalizeScenario(scenario));
    } catch {
        return [normalizeScenario(DEFAULT_SCENARIO)];
    }
}

export function saveScenarios(scenarios: ScenarioState[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function upsertScenario(
    scenarios: ScenarioState[],
    scenario: ScenarioState
): ScenarioState[] {
    const index = scenarios.findIndex(
        (item) => item.scenario.scenarioId === scenario.scenario.scenarioId
    );
    if (index === -1) {
        return [...scenarios, scenario];
    }
    const next = [...scenarios];
    next[index] = scenario;
    return next;
}

export function duplicateScenario(
    scenarios: ScenarioState[],
    scenarioId: string
): ScenarioState[] {
    const scenario = scenarios.find(
        (item) => item.scenario.scenarioId === scenarioId
    );
    if (!scenario) {
        return scenarios;
    }
    const clone = structuredClone(scenario) as ScenarioState;
    clone.scenario.scenarioId = `${scenario.scenario.scenarioId}-copy`;
    clone.scenario.label = `${scenario.scenario.label} (Copy)`;
    clone.scenario.baselineScenarioId = scenario.scenario.scenarioId;
    return [...scenarios, clone];
}

export function exportScenario(scenario: ScenarioState): void {
    const blob = new Blob([JSON.stringify(scenario, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${scenario.scenario.scenarioId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
}

export async function importScenarioFile(file: File): Promise<ScenarioState> {
    const text = await file.text();
    return JSON.parse(text) as ScenarioState;
}
