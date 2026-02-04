import { ScenarioState } from '../../types/schema';
import { fromPercent, toPercent } from '../../utils/format';
import { Input } from '../ui/input';

interface ValueRealizationPanelProps {
    scenario: ScenarioState;
    onScenarioChange: (scenario: ScenarioState) => void;
}

/**
 * Editor for Value Realization inputs.
 */
export function ValueRealizationPanel({
    scenario,
    onScenarioChange,
}: ValueRealizationPanelProps) {
    const { processorFees, feeCoverage, commission } = scenario.inputs;

    function updateProcessorFee(
        channelId: string,
        cadence: 'ONE_TIME' | 'RECURRING',
        value: number
    ) {
        const next = processorFees.map((item) =>
            item.channelId === channelId && item.cadence === cadence
                ? { ...item, processorFeeRate: value }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, processorFees: next },
        });
    }

    function updateFeeCoverage(channelId: string, value: number) {
        const next = feeCoverage.map((item) =>
            item.channelId === channelId
                ? { ...item, donorFeeCoverageRate: value }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, feeCoverage: next },
        });
    }

    function updateCommission(value: number) {
        onScenarioChange({
            ...scenario,
            inputs: {
                ...scenario.inputs,
                commission: { avgFundraiseupCommissionRate: value },
            },
        });
    }

    return (
        <div className="grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">Processor fees</div>
                <table className="mt-3 w-full text-sm">
                    <thead>
                        <tr>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Channel
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Cadence
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Fee Rate (%)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {processorFees.map((item) => (
                            <tr
                                key={`${item.channelId}-${item.cadence}`}
                                className="border-b border-slate-200"
                            >
                                <td className="px-2 py-2 text-slate-700">
                                    {item.channelId}
                                </td>
                                <td className="px-2 py-2 text-slate-700">{item.cadence}</td>
                                <td>
                                    <Input
                                        className="w-16 text-right tabular-nums"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={toPercent(item.processorFeeRate)}
                                        onChange={(event) =>
                                            updateProcessorFee(
                                                item.channelId,
                                                item.cadence,
                                                fromPercent(Number(event.target.value))
                                            )
                                        }
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">Fee coverage</div>
                <table className="mt-3 w-full text-sm">
                    <thead>
                        <tr>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Channel
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Coverage (%)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {feeCoverage.map((item) => (
                            <tr key={item.channelId} className="border-b border-slate-200">
                                <td className="px-2 py-2 text-slate-700">
                                    {item.channelId}
                                </td>
                                <td>
                                    <Input
                                        className="w-16 text-right tabular-nums"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={toPercent(item.donorFeeCoverageRate)}
                                        onChange={(event) =>
                                            updateFeeCoverage(
                                                item.channelId,
                                                fromPercent(Number(event.target.value))
                                            )
                                        }
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">Commission</div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Input
                        className="w-16 text-right tabular-nums"
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={toPercent(commission.avgFundraiseupCommissionRate)}
                        onChange={(event) =>
                            updateCommission(fromPercent(Number(event.target.value)))
                        }
                    />
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        Avg FRU Commission (%)
                    </span>
                </div>
            </div>
        </div>
    );
}
