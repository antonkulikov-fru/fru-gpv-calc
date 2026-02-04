/**
 * Core scenario state for the GPV Impact Calculator.
 */
export interface ScenarioState {
    scenario: ScenarioMeta;
    entities: ScenarioEntities;
    inputs: ScenarioInputs;
}

export interface ScenarioMeta {
    scenarioId: string;
    mode: 'MODEL_DATA' | 'ORG_DATA';
    timeHorizonId: 'CY' | 'CY_PLUS_1' | 'CY_PLUS_2' | 'ROLLING_2M';
    label: string;
    baselineScenarioId: string | null;
}

export interface ScenarioEntities {
    verticals: Vertical[];
    orgs: Org[];
    channels: Channel[];
    surfaces: Surface[];
    donationModels: DonationModel[];
}

export interface Vertical {
    verticalId: string;
    name: string;
}

export interface Org {
    orgId: string;
    verticalId: string;
    archetypeId: string | null;
    weight: number;
}

export interface Channel {
    channelId: string;
    name: string;
}

export interface Surface {
    surfaceId: string;
    name: string;
}

export interface DonationModel {
    donationModelId: string;
    name: string;
}

export interface ScenarioInputs {
    intentFormation: IntentFormationInput[];
    orgActivationFunnel: OrgActivationFunnelInput[];
    intentAttribution: IntentAttributionInput[];
    channelMix: ChannelMixInput[];
    surfaceMix: SurfaceMixInput[];
    donationModelMix: DonationModelMixInput[];
    cr1: Cr1Input[];
    cadenceSplit: CadenceSplitInput[];
    cr2: Cr2Input[];
    donationAmount: DonationAmountInput[];
    existingRecurringDonors: ExistingRecurringDonorsInput[];
    recurringChurnModel: RecurringChurnInput[];
    recurringSeasonalityModel: RecurringSeasonalityInput[];
    processorFees: ProcessorFeeInput[];
    feeCoverage: FeeCoverageInput[];
    commission: CommissionInput;
}

export interface IntentFormationInput {
    verticalId: string;
    intentTam: number;
    orgsSamTotal: number;
}

export interface OrgActivationFunnelInput {
    verticalId: string;
    orgsTotal: number;
    orgsReached: number;
    crReachedToQualified: number;
    crQualifiedToWon: number;
}

export interface IntentAttributionInput {
    orgId: string;
    intentShareWithinVertical: number;
}

export interface ChannelMixInput {
    orgId: string;
    channelId: string;
    share: number;
    enabled: boolean;
}

export interface SurfaceMixInput {
    orgId: string;
    channelId: string;
    surfaceId: string;
    share: number;
    enabled: boolean;
}

export interface DonationModelMixInput {
    orgId: string;
    surfaceId: string;
    donationModelId: string;
    share: number;
    enabled: boolean;
}

export interface Cr1Input {
    surfaceId: string;
    donationModelId: string;
    cr1IntentToOpportunity: number;
}

export interface CadenceSplitInput {
    donationModelId: string;
    shareOneTime: number;
    shareRecurring: number;
}

export type Cadence = 'ONE_TIME' | 'RECURRING';

export interface Cr2Input {
    orgId: string;
    surfaceId: string;
    donationModelId: string;
    cadence: Cadence;
    cr2OpportunityToDonation: number;
}

export interface DonationAmountInput {
    orgId: string;
    surfaceId: string;
    donationModelId: string;
    cadence: Cadence;
    avgAmount: number;
}

export interface ExistingRecurringDonorsInput {
    orgId: string;
    surfaceId: string;
    donationModelId: string;
    existingRecDonorsStartCy: number;
}

export interface RecurringChurnInput {
    month: number;
    survivalAtStartOfMonth: number;
}

export interface RecurringSeasonalityInput {
    month: number;
    seasonalityWeight: number;
}

export interface ProcessorFeeInput {
    channelId: string;
    cadence: Cadence;
    processorFeeRate: number;
}

export interface FeeCoverageInput {
    channelId: string;
    donorFeeCoverageRate: number;
}

export interface CommissionInput {
    avgFundraiseupCommissionRate: number;
}
