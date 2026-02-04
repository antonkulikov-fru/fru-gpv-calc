import { ScenarioState } from '../../types/schema';
import { fromPercent, toPercent } from '../../utils/format';
import { Input } from '../ui/input';

interface ConfigPanelProps {
    scenario: ScenarioState;
    onScenarioChange: (scenario: ScenarioState) => void;
}

/**
 * Configuration tab for recurring churn and seasonality.
 */
export function ConfigPanel({ scenario, onScenarioChange }: ConfigPanelProps) {
    const { recurringChurnModel, recurringSeasonalityModel } = scenario.inputs;

    const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];

    function updateChurn(month: number, monthlyChurnRate: number) {
        const sorted = recurringChurnModel.slice().sort((a, b) => a.month - b.month);
        const monthlyChurns = sorted.map((item, index) => {
            const priorSurvival = index === 0 ? 1 : sorted[index - 1].survivalAtStartOfMonth;
            const monthlySurvival =
                priorSurvival === 0 ? 0 : item.survivalAtStartOfMonth / priorSurvival;
            return 1 - monthlySurvival;
        });

        const targetIndex = sorted.findIndex((item) => item.month === month);
        if (targetIndex >= 0) {
            monthlyChurns[targetIndex] = monthlyChurnRate;
        }

        let cumulativeSurvival = 1;
        const next = sorted.map((item, index) => {
            const churn = monthlyChurns[index] ?? 0;
            const survivalAtStart = cumulativeSurvival;
            cumulativeSurvival = cumulativeSurvival * (1 - churn);
            return { ...item, survivalAtStartOfMonth: survivalAtStart };
        });

        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, recurringChurnModel: next },
        });
    }

    function updateSeasonality(month: number, value: number) {
        const next = recurringSeasonalityModel.map((item) =>
            item.month === month ? { ...item, seasonalityWeight: value } : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, recurringSeasonalityModel: next },
        });
    }

    const churnRows = recurringChurnModel
        .slice()
        .sort((a, b) => a.month - b.month)
        .map((item, index, list) => {
            const priorSurvival = index === 0 ? 1 : list[index - 1].survivalAtStartOfMonth;
            const monthlySurvival =
                priorSurvival === 0 ? 0 : item.survivalAtStartOfMonth / priorSurvival;
            const monthlyChurn = 1 - monthlySurvival;
            return {
                ...item,
                monthlySurvival,
                monthlyChurn,
            };
        });

    const totalMonthlyChurn = churnRows.reduce((acc, row) => acc + row.monthlyChurn, 0);
    const avgMonthlySurvival =
        churnRows.reduce((acc, row) => acc + row.monthlySurvival, 0) /
        Math.max(churnRows.length, 1);
    const avgCumulativeSurvival =
        churnRows.reduce((acc, row) => acc + row.survivalAtStartOfMonth, 0) /
        Math.max(churnRows.length, 1);

    const seasonalityRows = recurringSeasonalityModel
        .slice()
        .sort((a, b) => a.month - b.month)
        .map((item, index, list) => {
            const monthsRemaining = list.length - index;
            return {
                ...item,
                monthsRemaining,
                expectedMonthlyContributions: item.seasonalityWeight,
            };
        });

    const seasonalityTotal = seasonalityRows.reduce(
        (acc, item) => acc + item.seasonalityWeight,
        0
    );
    const expectedContributionTotal = seasonalityRows.reduce((acc, item) => {
        const weightShare = seasonalityTotal === 0 ? 0 : item.seasonalityWeight / seasonalityTotal;
        return acc + weightShare * item.monthsRemaining;
    }, 0);
    const monthsRemainingTotal = seasonalityRows.reduce(
        (acc, item) => acc + item.monthsRemaining,
        0
    );

    return (
        <div className="grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">
                    REC donors Churn Model
                </div>
                <table className="mt-3 w-full text-sm">
                    <thead>
                        <tr>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Month
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Monthly churn
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Monthly survival
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Survival at start of month (cumulative)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {churnRows.map((item) => (
                            <tr key={item.month} className="border-b border-slate-200">
                                <td className="px-2 py-2 text-slate-700">
                                    {monthNames[item.month - 1] ?? item.month}
                                </td>
                                <td>
                                    <Input
                                        className="w-16 text-right tabular-nums"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={toPercent(item.monthlyChurn)}
                                        onChange={(event) =>
                                            updateChurn(
                                                item.month,
                                                fromPercent(Number(event.target.value))
                                            )
                                        }
                                    />
                                </td>
                                <td className="px-2 py-2 text-slate-700">
                                    {item.monthlySurvival.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-slate-700">
                                    {item.survivalAtStartOfMonth.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-slate-200">
                            <td className="px-2 py-2 text-slate-700">Total</td>
                            <td className="px-2 py-2 text-slate-700">
                                {toPercent(totalMonthlyChurn)}
                            </td>
                            <td className="px-2 py-2 text-slate-700">
                                {avgMonthlySurvival.toFixed(2)}
                            </td>
                            <td className="px-2 py-2 text-slate-700">
                                {avgCumulativeSurvival.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">
                    New REC donors contributions Model
                </div>
                <table className="mt-3 w-full text-sm">
                    <thead>
                        <tr>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Month
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Seasonality factor
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Months remaining in CY
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Weight share
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Expected monthly contributions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {seasonalityRows.map((item) => (
                            <tr key={item.month} className="border-b border-slate-200">
                                <td className="px-2 py-2 text-slate-700">{item.month}</td>
                                <td>
                                    <Input
                                        type="number"
                                        value={item.seasonalityWeight}
                                        onChange={(event) =>
                                            updateSeasonality(
                                                item.month,
                                                Number(event.target.value)
                                            )
                                        }
                                    />
                                </td>
                                <td className="px-2 py-2 text-slate-700">
                                    {item.monthsRemaining}
                                </td>
                                <td className="px-2 py-2 text-slate-700">
                                    {seasonalityTotal === 0
                                        ? '0.000000'
                                        : (item.seasonalityWeight / seasonalityTotal).toFixed(6)}
                                </td>
                                <td className="px-2 py-2 text-slate-700">
                                    {seasonalityTotal === 0
                                        ? '0.000000'
                                        : (
                                            (item.seasonalityWeight / seasonalityTotal) *
                                            item.monthsRemaining
                                        ).toFixed(6)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-slate-200">
                            <td className="px-2 py-2 text-slate-700">Total</td>
                            <td className="px-2 py-2 text-slate-700">
                                {seasonalityTotal.toFixed(0)}
                            </td>
                            <td className="px-2 py-2 text-slate-700">
                                {monthsRemainingTotal}
                            </td>
                            <td className="px-2 py-2 text-slate-700">1.000000</td>
                            <td className="px-2 py-2 text-slate-700">
                                {expectedContributionTotal.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
