import { ComputeResult } from '../types/compute';
import { formatCurrency } from '../utils/format';

interface OutputsPanelProps {
    computeResult: ComputeResult | null;
    activeLayer: string;
}

/**
 * Displays computed outputs and warnings.
 */
export function OutputsPanel({ computeResult, activeLayer }: OutputsPanelProps) {
    if (!computeResult) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">Outputs</div>
                <div className="text-sm text-red-600">
                    Fix validation errors to compute outputs.
                </div>
            </div>
        );
    }

    const { computedOutputs, warnings } = computeResult;

    return (
        <div className="grid gap-4">
            {activeLayer === 'IntentFormation' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-lg font-semibold text-slate-900">
                        Intent Formation Outputs
                    </div>
                    <div className="mt-3 flex flex-col gap-1">
                        <span className="text-xs text-slate-500">
                            Total Intent Exposed to FRU
                        </span>
                        <span className="text-2xl font-semibold text-slate-900">
                            {computedOutputs.intentFormation.totalIntentExposed.toLocaleString()}
                        </span>
                    </div>
                    <table className="mt-3 w-full text-sm">
                        <thead>
                            <tr>
                                <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                    Org
                                </th>
                                <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                    Intent Exposed
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(computedOutputs.intentFormation.intentExposedByOrg).map(
                                ([orgId, intent]) => (
                                    <tr key={orgId} className="border-b border-slate-200">
                                        <td className="px-2 py-2 text-slate-700">{orgId}</td>
                                        <td className="px-2 py-2 text-slate-700">
                                            {intent.toLocaleString()}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">Overall Outputs</div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">GPV (One-Time)</span>
                        <span className="text-2xl font-semibold text-slate-900">
                            {formatCurrency(computedOutputs.gpv.byCadence.ONE_TIME)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">GPV (Recurring)</span>
                        <span className="text-2xl font-semibold text-slate-900">
                            {formatCurrency(computedOutputs.gpv.byCadence.RECURRING)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">GPV Total</span>
                        <span className="text-2xl font-semibold text-slate-900">
                            {formatCurrency(computedOutputs.gpv.total)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">FundraiseUp Revenue</span>
                        <span className="text-2xl font-semibold text-slate-900">
                            {formatCurrency(computedOutputs.fundraiseupRevenue.total)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">Org Net Proceeds</span>
                        <span className="text-2xl font-semibold text-slate-900">
                            {formatCurrency(computedOutputs.orgNetProceeds.total)}
                        </span>
                    </div>
                </div>
                {warnings.length > 0 && (
                    <div>
                        <div className="text-lg font-semibold text-slate-900">Warnings</div>
                        {warnings.map((warning) => (
                            <div key={warning.message} className="text-sm text-red-600">
                                {warning.message}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
