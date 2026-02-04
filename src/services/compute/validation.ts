import { ScenarioState } from '../../types/schema';
import { ComputationWarning, ValidationError } from '../../types/compute';
import { roundToOneDecimal } from '../../utils/format';

interface DistributionItem {
    key: string;
    share: number;
    enabled: boolean;
}

const RATE_MIN = 0;
const RATE_MAX = 1;
const DISTRIBUTION_TOLERANCE = 0.0001;

function isValidRate(value: number): boolean {
    return value >= RATE_MIN && value <= RATE_MAX;
}

function validateRate(
    errors: ValidationError[],
    path: string,
    value: number
): void {
    if (!isValidRate(value)) {
        errors.push({
            code: 'RATE_OUT_OF_BOUNDS',
            message: 'Rate must be between 0 and 1.',
            path,
        });
    }
}

function validateDistribution(
    errors: ValidationError[],
    warnings: ComputationWarning[],
    label: string,
    items: DistributionItem[]
): void {
    const enabledItems = items.filter((item) => item.enabled);
    const sum = enabledItems.reduce((acc, item) => acc + item.share, 0);
    if (enabledItems.length === 0) {
        warnings.push({
            code: 'ZERO_EXECUTION_PATH',
            message: `${label} has no enabled paths.`,
        });
        return;
    }

    if (Math.abs(sum - 1) > DISTRIBUTION_TOLERANCE) {
        errors.push({
            code: 'DISTRIBUTION_NOT_NORMALIZED',
            message: `${label} must sum to 1. Current sum: ${roundToOneDecimal(sum)}.`,
            path: label,
        });
    }
}

export function validateScenarioState(state: ScenarioState): {
    errors: ValidationError[];
    warnings: ComputationWarning[];
} {
    const errors: ValidationError[] = [];
    const warnings: ComputationWarning[] = [];

    state.inputs.intentFormation.forEach((input) => {
        if (input.intentTam < 0) {
            errors.push({
                code: 'NEGATIVE_INTENT',
                message: 'Intent TAM must be non-negative.',
                path: `intentFormation.${input.verticalId}.intentTam`,
            });
        }
        if (input.orgsSamTotal < 0) {
            errors.push({
                code: 'NEGATIVE_ORGS',
                message: 'Org SAM total must be non-negative.',
                path: `intentFormation.${input.verticalId}.orgsSamTotal`,
            });
        }
    });

    state.inputs.intentAttribution.forEach((input) => {
        validateRate(
            errors,
            `intentAttribution.${input.orgId}.intentShareWithinVertical`,
            input.intentShareWithinVertical
        );
    });

    const channelGroups = new Map<string, DistributionItem[]>();
    state.inputs.channelMix.forEach((input) => {
        validateRate(errors, `channelMix.${input.orgId}.${input.channelId}.share`, input.share);
        const key = input.orgId;
        const existing = channelGroups.get(key) ?? [];
        existing.push({
            key: input.channelId,
            share: input.share,
            enabled: input.enabled,
        });
        channelGroups.set(key, existing);
    });

    channelGroups.forEach((items, key) => {
        validateDistribution(errors, warnings, `ChannelMix.${key}`, items);
    });

    const surfaceGroups = new Map<string, DistributionItem[]>();
    state.inputs.surfaceMix.forEach((input) => {
        validateRate(
            errors,
            `surfaceMix.${input.orgId}.${input.channelId}.${input.surfaceId}.share`,
            input.share
        );
        const key = `${input.orgId}:${input.channelId}`;
        const existing = surfaceGroups.get(key) ?? [];
        existing.push({
            key: input.surfaceId,
            share: input.share,
            enabled: input.enabled,
        });
        surfaceGroups.set(key, existing);
    });

    surfaceGroups.forEach((items, key) => {
        validateDistribution(errors, warnings, `SurfaceMix.${key}`, items);
    });

    const modelGroups = new Map<string, DistributionItem[]>();
    state.inputs.donationModelMix.forEach((input) => {
        validateRate(
            errors,
            `donationModelMix.${input.orgId}.${input.surfaceId}.${input.donationModelId}.share`,
            input.share
        );
        const key = `${input.orgId}:${input.surfaceId}`;
        const existing = modelGroups.get(key) ?? [];
        existing.push({
            key: input.donationModelId,
            share: input.share,
            enabled: input.enabled,
        });
        modelGroups.set(key, existing);
    });

    modelGroups.forEach((items, key) => {
        validateDistribution(errors, warnings, `DonationModelMix.${key}`, items);
    });

    state.inputs.cadenceSplit.forEach((input) => {
        validateRate(errors, `cadenceSplit.${input.donationModelId}.shareOneTime`, input.shareOneTime);
        validateRate(
            errors,
            `cadenceSplit.${input.donationModelId}.shareRecurring`,
            input.shareRecurring
        );
        const sum = input.shareOneTime + input.shareRecurring;
        if (Math.abs(sum - 1) > DISTRIBUTION_TOLERANCE) {
            errors.push({
                code: 'CADENCE_NOT_NORMALIZED',
                message: `Cadence split for ${input.donationModelId} must sum to 1. Current sum: ${roundToOneDecimal(sum)}.`,
                path: `cadenceSplit.${input.donationModelId}`,
            });
        }
    });

    state.inputs.cr1.forEach((input) => {
        validateRate(
            errors,
            `cr1.${input.surfaceId}.${input.donationModelId}.cr1IntentToOpportunity`,
            input.cr1IntentToOpportunity
        );
    });

    state.inputs.cr2.forEach((input) => {
        validateRate(
            errors,
            `cr2.${input.orgId}.${input.surfaceId}.${input.donationModelId}.${input.cadence}.cr2OpportunityToDonation`,
            input.cr2OpportunityToDonation
        );
    });

    state.inputs.processorFees.forEach((input) => {
        validateRate(
            errors,
            `processorFees.${input.channelId}.${input.cadence}.processorFeeRate`,
            input.processorFeeRate
        );
    });

    state.inputs.feeCoverage.forEach((input) => {
        validateRate(
            errors,
            `feeCoverage.${input.channelId}.donorFeeCoverageRate`,
            input.donorFeeCoverageRate
        );
    });

    validateRate(
        errors,
        'commission.avgFundraiseupCommissionRate',
        state.inputs.commission.avgFundraiseupCommissionRate
    );

    if (state.entities.orgs.length === 0) {
        warnings.push({
            code: 'ZERO_ACTIVE_ORGS',
            message: 'No active orgs are defined in the scenario.',
        });
    }

    return { errors, warnings };
}
