import {
    Cadence,
    ScenarioState,
} from '../../types/schema';
import {
    ComputeResult,
    ComputationTraceStep,
    ComputationWarning,
    ComputedOutputs,
} from '../../types/compute';

interface TimeHorizonInfo {
    totalMonths: number;
    monthsPerYear: number;
}

const CADENCES: Cadence[] = ['ONE_TIME', 'RECURRING'];

const ZERO_OUTPUTS: ComputedOutputs = {
    intentFormation: {
        totalIntentExposed: 0,
        intentExposedByOrg: {},
    },
    gpv: { byCadence: { ONE_TIME: 0, RECURRING: 0 }, total: 0 },
    fundraiseupRevenue: { total: 0 },
    orgNetProceeds: { total: 0 },
};

function getTimeHorizonInfo(
    timeHorizonId: ScenarioState['scenario']['timeHorizonId']
): TimeHorizonInfo {
    switch (timeHorizonId) {
        case 'CY_PLUS_1':
            return { totalMonths: 24, monthsPerYear: 12 };
        case 'CY_PLUS_2':
            return { totalMonths: 36, monthsPerYear: 12 };
        case 'ROLLING_2M':
            return { totalMonths: 2, monthsPerYear: 12 };
        case 'CY':
        default:
            return { totalMonths: 12, monthsPerYear: 12 };
    }
}

function average(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
}

function buildKey(...parts: Array<string | number>): string {
    return parts.join('::');
}

export function computeGpvImpact(state: ScenarioState): ComputeResult {
    const warnings: ComputationWarning[] = [];
    const trace: ComputationTraceStep[] = [];

    if (state.entities.orgs.length === 0) {
        warnings.push({
            code: 'ZERO_ACTIVE_ORGS',
            message: 'No active orgs available for computation.',
        });
        return { computedOutputs: ZERO_OUTPUTS, computationTrace: trace, warnings };
    }

    const intentFormationByVertical = new Map(
        state.inputs.intentFormation.map((item) => [item.verticalId, item])
    );
    const intentAttributionByOrg = new Map(
        state.inputs.intentAttribution.map((item) => [item.orgId, item])
    );
    const channelMixByOrg = new Map<string, typeof state.inputs.channelMix>();
    state.inputs.channelMix.forEach((item) => {
        const existing = channelMixByOrg.get(item.orgId) ?? [];
        existing.push(item);
        channelMixByOrg.set(item.orgId, existing);
    });

    const surfaceMixByOrgChannel = new Map<string, typeof state.inputs.surfaceMix>();
    state.inputs.surfaceMix.forEach((item) => {
        const key = buildKey(item.orgId, item.channelId);
        const existing = surfaceMixByOrgChannel.get(key) ?? [];
        existing.push(item);
        surfaceMixByOrgChannel.set(key, existing);
    });

    const donationModelMixByOrgSurface = new Map<
        string,
        typeof state.inputs.donationModelMix
    >();
    state.inputs.donationModelMix.forEach((item) => {
        const key = buildKey(item.orgId, item.surfaceId);
        const existing = donationModelMixByOrgSurface.get(key) ?? [];
        existing.push(item);
        donationModelMixByOrgSurface.set(key, existing);
    });

    const cr1BySurfaceModel = new Map(
        state.inputs.cr1.map((item) => [buildKey(item.surfaceId, item.donationModelId), item])
    );
    const cadenceByModel = new Map(
        state.inputs.cadenceSplit.map((item) => [item.donationModelId, item])
    );
    const cr2ByModelCadence = new Map(
        state.inputs.cr2.map((item) => [
            buildKey(item.orgId, item.surfaceId, item.donationModelId, item.cadence),
            item,
        ])
    );
    const donationAmountByModelCadence = new Map(
        state.inputs.donationAmount.map((item) => [
            buildKey(item.orgId, item.surfaceId, item.donationModelId, item.cadence),
            item,
        ])
    );
    const existingRecurringByOrgModel = new Map(
        state.inputs.existingRecurringDonors.map((item) => [
            buildKey(item.orgId, item.surfaceId, item.donationModelId),
            item,
        ])
    );
    const processorFeeByChannelCadence = new Map(
        state.inputs.processorFees.map((item) => [buildKey(item.channelId, item.cadence), item])
    );
    const feeCoverageByChannel = new Map(
        state.inputs.feeCoverage.map((item) => [item.channelId, item])
    );

    const horizonInfo = getTimeHorizonInfo(state.scenario.timeHorizonId);
    const churnValues = state.inputs.recurringChurnModel.map(
        (item) => item.survivalAtStartOfMonth
    );
    const avgActiveFraction = average(churnValues);
    const expectedActiveMonths = horizonInfo.monthsPerYear * avgActiveFraction;

    const seasonalityValues = state.inputs.recurringSeasonalityModel.map(
        (item) => item.seasonalityWeight
    );
    const monthsRemainingWeights = Array.from({ length: horizonInfo.totalMonths }, (_, index) => {
        const monthIndex = index % seasonalityValues.length;
        const monthsRemaining = horizonInfo.totalMonths - index;
        return (seasonalityValues[monthIndex] ?? 0) * monthsRemaining;
    });
    const expectedChargesNew = monthsRemainingWeights.reduce(
        (acc, value) => acc + value,
        0
    );

    let gpvOneTimeTotal = 0;
    let gpvRecurringTotal = 0;
    let processorFeesPaid = 0;
    let totalIntentExposed = 0;
    const intentExposedByOrg: Record<string, number> = {};

    const gpvByChannelCadence = new Map<string, number>();

    state.entities.orgs.forEach((org) => {
        const intentFormation = intentFormationByVertical.get(org.verticalId);
        const intentAttribution = intentAttributionByOrg.get(org.orgId);

        if (!intentFormation || !intentAttribution) {
            return;
        }

        const intentExposed = intentFormation.intentTam * intentAttribution.intentShareWithinVertical;
        intentExposedByOrg[org.orgId] = intentExposed;
        totalIntentExposed += intentExposed;
        trace.push({
            layer: 'IntentFormation',
            entity: org.orgId,
            metric: 'IntentExposed',
            formula: 'intent_tam * intent_share_within_vertical',
            inputs: {
                intent_tam: intentFormation.intentTam,
                intent_share_within_vertical: intentAttribution.intentShareWithinVertical,
            },
            output: intentExposed,
        });

        const channels = channelMixByOrg.get(org.orgId) ?? [];
        const enabledChannels = channels.filter((channel) => channel.enabled);

        enabledChannels.forEach((channel) => {
            const surfaces = surfaceMixByOrgChannel.get(
                buildKey(org.orgId, channel.channelId)
            ) ?? [];

            surfaces
                .filter((surface) => surface.enabled)
                .forEach((surface) => {
                    const donationModels = donationModelMixByOrgSurface.get(
                        buildKey(org.orgId, surface.surfaceId)
                    ) ?? [];

                    donationModels
                        .filter((model) => model.enabled)
                        .forEach((model) => {
                            const cr1 =
                                cr1BySurfaceModel.get(
                                    buildKey(surface.surfaceId, model.donationModelId)
                                )?.cr1IntentToOpportunity ?? 0;

                            const capturedIntent =
                                intentExposed * channel.share * surface.share * model.share;

                            const donationOpportunities = capturedIntent * cr1;
                            trace.push({
                                layer: 'IntentCapture',
                                entity: `${org.orgId} | ${channel.channelId} | ${surface.surfaceId} | ${model.donationModelId}`,
                                metric: 'DonationOpportunities',
                                formula: 'IntentExposed * channel_share * surface_share * donation_model_share * cr1',
                                inputs: {
                                    intent_exposed: intentExposed,
                                    channel_share: channel.share,
                                    surface_share: surface.share,
                                    donation_model_share: model.share,
                                    cr1_intent_to_opportunity: cr1,
                                },
                                output: donationOpportunities,
                            });

                            const cadenceSplit = cadenceByModel.get(model.donationModelId);
                            const cr2OneTime =
                                cr2ByModelCadence.get(
                                    buildKey(
                                        org.orgId,
                                        surface.surfaceId,
                                        model.donationModelId,
                                        'ONE_TIME'
                                    )
                                )?.cr2OpportunityToDonation ?? 0;
                            const cr2Recurring =
                                cr2ByModelCadence.get(
                                    buildKey(
                                        org.orgId,
                                        surface.surfaceId,
                                        model.donationModelId,
                                        'RECURRING'
                                    )
                                )?.cr2OpportunityToDonation ?? 0;

                            const donationAmountOneTime =
                                donationAmountByModelCadence.get(
                                    buildKey(
                                        org.orgId,
                                        surface.surfaceId,
                                        model.donationModelId,
                                        'ONE_TIME'
                                    )
                                )?.avgAmount ?? 0;
                            const donationAmountRecurring =
                                donationAmountByModelCadence.get(
                                    buildKey(
                                        org.orgId,
                                        surface.surfaceId,
                                        model.donationModelId,
                                        'RECURRING'
                                    )
                                )?.avgAmount ?? 0;

                            const existingRecurring =
                                existingRecurringByOrgModel.get(
                                    buildKey(org.orgId, surface.surfaceId, model.donationModelId)
                                )?.existingRecDonorsStartCy ?? 0;
                            const donorMonthsExisting =
                                existingRecurring * expectedActiveMonths;
                            const gpvRecurringExisting =
                                donorMonthsExisting * donationAmountRecurring;

                            if (donorMonthsExisting > 0) {
                                trace.push({
                                    layer: 'DonationExecution',
                                    entity: `${org.orgId} | ${channel.channelId} | ${surface.surfaceId} | ${model.donationModelId} | RECURRING`,
                                    metric: 'DonorMonths_Existing_REC',
                                    formula: 'existing_rec_donors_start * expected_active_months',
                                    inputs: {
                                        existing_rec_donors_start: existingRecurring,
                                        expected_active_months: expectedActiveMonths,
                                    },
                                    output: donorMonthsExisting,
                                });
                            }

                            if (gpvRecurringExisting > 0) {
                                gpvRecurringTotal += gpvRecurringExisting * org.weight;
                                const recurringKey = buildKey(
                                    channel.channelId,
                                    'RECURRING'
                                );
                                gpvByChannelCadence.set(
                                    recurringKey,
                                    (gpvByChannelCadence.get(recurringKey) ?? 0) +
                                    gpvRecurringExisting * org.weight
                                );
                            }

                            const oneTimeOpportunities =
                                donationOpportunities * (cadenceSplit?.shareOneTime ?? 0);
                            const recurringOpportunities =
                                donationOpportunities * (cadenceSplit?.shareRecurring ?? 0);

                            const oneTimeTransactions = oneTimeOpportunities * cr2OneTime;
                            const newRecurringDonors = recurringOpportunities * cr2Recurring;

                            trace.push({
                                layer: 'DonationExecution',
                                entity: `${org.orgId} | ${model.donationModelId} | ONE_TIME`,
                                metric: 'OneTimeTransactions',
                                formula: 'DonationOpportunities * share_one_time * cr2_one_time',
                                inputs: {
                                    donation_opportunities: donationOpportunities,
                                    share_one_time: cadenceSplit?.shareOneTime ?? 0,
                                    cr2_one_time: cr2OneTime,
                                },
                                output: oneTimeTransactions,
                            });

                            trace.push({
                                layer: 'DonationExecution',
                                entity: `${org.orgId} | ${model.donationModelId} | RECURRING`,
                                metric: 'NewRecurringDonors',
                                formula: 'DonationOpportunities * share_recurring * cr2_recurring',
                                inputs: {
                                    donation_opportunities: donationOpportunities,
                                    share_recurring: cadenceSplit?.shareRecurring ?? 0,
                                    cr2_recurring: cr2Recurring,
                                },
                                output: newRecurringDonors,
                            });

                            const donorMonthsNew =
                                newRecurringDonors * expectedChargesNew * avgActiveFraction;

                            trace.push({
                                layer: 'DonationExecution',
                                entity: `${org.orgId} | ${model.donationModelId} | RECURRING`,
                                metric: 'DonorMonths_New_REC',
                                formula: 'NewRecurringDonors * expected_charges_new * avg_active_fraction',
                                inputs: {
                                    new_recurring_donors: newRecurringDonors,
                                    expected_charges_new: expectedChargesNew,
                                    avg_active_fraction: avgActiveFraction,
                                },
                                output: donorMonthsNew,
                            });

                            const gpvOneTime = oneTimeTransactions * donationAmountOneTime;
                            const gpvRecurring = donorMonthsNew * donationAmountRecurring;

                            gpvOneTimeTotal += gpvOneTime * org.weight;
                            gpvRecurringTotal += gpvRecurring * org.weight;

                            const oneTimeKey = buildKey(channel.channelId, 'ONE_TIME');
                            const recurringKey = buildKey(channel.channelId, 'RECURRING');
                            gpvByChannelCadence.set(
                                oneTimeKey,
                                (gpvByChannelCadence.get(oneTimeKey) ?? 0) +
                                gpvOneTime * org.weight
                            );
                            gpvByChannelCadence.set(
                                recurringKey,
                                (gpvByChannelCadence.get(recurringKey) ?? 0) +
                                gpvRecurring * org.weight
                            );

                            trace.push({
                                layer: 'ValueRealization',
                                entity: `${org.orgId} | ${model.donationModelId} | ONE_TIME`,
                                metric: 'GPV_OneTime',
                                formula: 'OneTimeTransactions * avg_amount_ONE_TIME',
                                inputs: {
                                    one_time_transactions: oneTimeTransactions,
                                    avg_amount_one_time: donationAmountOneTime,
                                },
                                output: gpvOneTime,
                            });

                            trace.push({
                                layer: 'ValueRealization',
                                entity: `${org.orgId} | ${model.donationModelId} | RECURRING`,
                                metric: 'GPV_Recurring',
                                formula: 'DonorMonths_New_REC * avg_amount_RECURRING',
                                inputs: {
                                    donor_months_new: donorMonthsNew,
                                    avg_amount_recurring: donationAmountRecurring,
                                },
                                output: gpvRecurring,
                            });

                        });
                });
        });
    });

    gpvByChannelCadence.forEach((gpv, key) => {
        const [channelId, cadence] = key.split('::');
        const processorFeeRate =
            processorFeeByChannelCadence.get(buildKey(channelId, cadence as Cadence))
                ?.processorFeeRate ?? 0;
        const feeCoverage =
            feeCoverageByChannel.get(channelId)?.donorFeeCoverageRate ?? 0;
        processorFeesPaid += gpv * processorFeeRate * (1 - feeCoverage);
    });

    const gpvTotal = gpvOneTimeTotal + gpvRecurringTotal;
    const fundraiseupRevenue =
        gpvTotal * state.inputs.commission.avgFundraiseupCommissionRate;
    const orgNetProceeds = gpvTotal - processorFeesPaid - fundraiseupRevenue;

    trace.push({
        layer: 'ValueRealization',
        entity: 'SCENARIO',
        metric: 'ProcessorFeesPaid',
        formula: 'GPV_Total * processor_fee_rate * (1 - donor_fee_coverage_rate)',
        inputs: {
            gpv_total: gpvTotal,
        },
        output: processorFeesPaid,
    });

    trace.push({
        layer: 'ValueRealization',
        entity: 'SCENARIO',
        metric: 'FundraiseUpRevenue',
        formula: 'GPV_Total * avg_fundraiseup_commission_rate',
        inputs: {
            gpv_total: gpvTotal,
            avg_fundraiseup_commission_rate:
                state.inputs.commission.avgFundraiseupCommissionRate,
        },
        output: fundraiseupRevenue,
    });

    trace.push({
        layer: 'ValueRealization',
        entity: 'SCENARIO',
        metric: 'OrgNetProceeds',
        formula: 'GPV_Total - ProcessorFeesPaid - FundraiseUpRevenue',
        inputs: {
            gpv_total: gpvTotal,
            processor_fees_paid: processorFeesPaid,
            fundraiseup_revenue: fundraiseupRevenue,
        },
        output: orgNetProceeds,
    });

    if (gpvTotal === 0) {
        warnings.push({
            code: 'ZERO_EXECUTION_PATH',
            message: 'No GPV generated with the current inputs.',
        });
    }

    const computedOutputs: ComputedOutputs = {
        intentFormation: {
            totalIntentExposed,
            intentExposedByOrg,
        },
        gpv: {
            byCadence: {
                ONE_TIME: gpvOneTimeTotal,
                RECURRING: gpvRecurringTotal,
            },
            total: gpvTotal,
        },
        fundraiseupRevenue: { total: fundraiseupRevenue },
        orgNetProceeds: { total: orgNetProceeds },
    };

    return { computedOutputs, computationTrace: trace, warnings };
}
