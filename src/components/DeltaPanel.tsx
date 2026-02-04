import { ComputeResult } from '../types/compute';
import { formatCurrency } from '../utils/format';

interface DeltaPanelProps {
    currentResult: ComputeResult | null;
    baselineResult: ComputeResult | null;
}

/**
 * Displays deltas between current and baseline scenarios.
 */
export function DeltaPanel({ currentResult, baselineResult }: DeltaPanelProps) {
    if (!currentResult || !baselineResult) {
        return null;
    }

    const deltaOneTime =
        currentResult.computedOutputs.gpv.byCadence.ONE_TIME -
        baselineResult.computedOutputs.gpv.byCadence.ONE_TIME;
    const deltaRecurring =
        currentResult.computedOutputs.gpv.byCadence.RECURRING -
        baselineResult.computedOutputs.gpv.byCadence.RECURRING;
    const deltaTotal =
        currentResult.computedOutputs.gpv.total -
        baselineResult.computedOutputs.gpv.total;
    const deltaRevenue =
        currentResult.computedOutputs.fundraiseupRevenue.total -
        baselineResult.computedOutputs.fundraiseupRevenue.total;
    const deltaNet =
        currentResult.computedOutputs.orgNetProceeds.total -
        baselineResult.computedOutputs.orgNetProceeds.total;

    return (
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">Delta vs baseline</div>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">GPV (One-Time)</span>
                    <span className="text-2xl font-semibold text-slate-900">
                        {formatCurrency(deltaOneTime)}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">GPV (Recurring)</span>
                    <span className="text-2xl font-semibold text-slate-900">
                        {formatCurrency(deltaRecurring)}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">GPV Total</span>
                    <span className="text-2xl font-semibold text-slate-900">
                        {formatCurrency(deltaTotal)}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">FundraiseUp Revenue</span>
                    <span className="text-2xl font-semibold text-slate-900">
                        {formatCurrency(deltaRevenue)}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">Org Net Proceeds</span>
                    <span className="text-2xl font-semibold text-slate-900">
                        {formatCurrency(deltaNet)}
                    </span>
                </div>
            </div>
        </div>
    );
}
