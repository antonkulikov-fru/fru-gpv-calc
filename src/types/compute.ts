import { Cadence } from './schema';

export interface ComputedOutputs {
    intentFormation: {
        totalIntentExposed: number;
        intentExposedByOrg: Record<string, number>;
    };
    gpv: {
        byCadence: Record<Cadence, number>;
        total: number;
    };
    fundraiseupRevenue: {
        total: number;
    };
    orgNetProceeds: {
        total: number;
    };
}

export type ComputationLayer =
    | 'IntentFormation'
    | 'IntentCapture'
    | 'DonationExecution'
    | 'ValueRealization';

export interface ComputationTraceStep {
    layer: ComputationLayer;
    entity: string;
    metric: string;
    formula: string;
    inputs: Record<string, unknown>;
    output: number | Record<string, unknown>;
}

export type WarningCode =
    | 'UNALLOCATED_DISTRIBUTION'
    | 'ZERO_ACTIVE_ORGS'
    | 'ZERO_EXECUTION_PATH'
    | 'UNSUPPORTED_DONATION_MODEL';

export interface ComputationWarning {
    code: WarningCode;
    message: string;
}

export interface ComputeResult {
    computedOutputs: ComputedOutputs;
    computationTrace: ComputationTraceStep[];
    warnings: ComputationWarning[];
}

export interface ValidationError {
    code: string;
    message: string;
    path: string;
}
