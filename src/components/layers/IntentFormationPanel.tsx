import { ChangeEvent } from 'react';
import { Input } from '../ui/input';
import { ScenarioState } from '../../types/schema';
import { fromPercent, toPercent } from '../../utils/format';

interface IntentFormationPanelProps {
    scenario: ScenarioState;
    onScenarioChange: (scenario: ScenarioState) => void;
}

/**
 * Editor for Intent Formation inputs and org attribution.
 */
export function IntentFormationPanel({
    scenario,
    onScenarioChange,
}: IntentFormationPanelProps) {
    const { intentFormation, orgActivationFunnel, intentAttribution } =
        scenario.inputs;

    function updateIntentFormation(
        verticalId: string,
        field: 'intentTam' | 'orgsSamTotal',
        value: number
    ) {
        const next = intentFormation.map((item) =>
            item.verticalId === verticalId ? { ...item, [field]: value } : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, intentFormation: next },
        });
    }

    function updateOrgActivationFunnel(
        verticalId: string,
        field: keyof typeof orgActivationFunnel[number],
        value: number
    ) {
        const next = orgActivationFunnel.map((item) =>
            item.verticalId === verticalId ? { ...item, [field]: value } : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, orgActivationFunnel: next },
        });
    }

    function updateIntentAttribution(orgId: string, value: number) {
        const next = intentAttribution.map((item) =>
            item.orgId === orgId
                ? { ...item, intentShareWithinVertical: value }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, intentAttribution: next },
        });
    }

    return (
        <div className="grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">
                    Intent TAM by vertical
                </div>
                <table className="mt-3 w-full text-sm">
                    <thead>
                        <tr>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Vertical
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Intent TAM
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Org SAM Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {scenario.entities.verticals.map((vertical) => {
                            const input = intentFormation.find(
                                (item) => item.verticalId === vertical.verticalId
                            );
                            return (
                                <tr key={vertical.verticalId} className="border-b border-slate-200">
                                    <td className="px-2 py-2 text-slate-700">
                                        {vertical.name}
                                    </td>
                                    <td>
                                        <Input
                                            type="number"
                                            value={input?.intentTam ?? 0}
                                            onChange={(event) =>
                                                updateIntentFormation(
                                                    vertical.verticalId,
                                                    'intentTam',
                                                    Number(event.target.value)
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <Input
                                            type="number"
                                            value={input?.orgsSamTotal ?? 0}
                                            onChange={(event) =>
                                                updateIntentFormation(
                                                    vertical.verticalId,
                                                    'orgsSamTotal',
                                                    Number(event.target.value)
                                                )
                                            }
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">
                    Org activation funnel
                </div>
                <table className="mt-3 w-full text-sm">
                    <thead>
                        <tr>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Vertical
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Orgs Total
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Orgs Reached
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Reach → Qualified (%)
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Qualified → Won (%)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {scenario.entities.verticals.map((vertical) => {
                            const input = orgActivationFunnel.find(
                                (item) => item.verticalId === vertical.verticalId
                            );
                            return (
                                <tr key={vertical.verticalId} className="border-b border-slate-200">
                                    <td className="px-2 py-2 text-slate-700">
                                        {vertical.name}
                                    </td>
                                    <td>
                                        <Input
                                            type="number"
                                            value={input?.orgsTotal ?? 0}
                                            onChange={(event) =>
                                                updateOrgActivationFunnel(
                                                    vertical.verticalId,
                                                    'orgsTotal',
                                                    Number(event.target.value)
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <Input
                                            type="number"
                                            value={input?.orgsReached ?? 0}
                                            onChange={(event) =>
                                                updateOrgActivationFunnel(
                                                    vertical.verticalId,
                                                    'orgsReached',
                                                    Number(event.target.value)
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <Input
                                            className="w-16 text-right tabular-nums"
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={toPercent(input?.crReachedToQualified ?? 0)}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                updateOrgActivationFunnel(
                                                    vertical.verticalId,
                                                    'crReachedToQualified',
                                                    fromPercent(Number(event.target.value))
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <Input
                                            className="w-16 text-right tabular-nums"
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={toPercent(input?.crQualifiedToWon ?? 0)}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                updateOrgActivationFunnel(
                                                    vertical.verticalId,
                                                    'crQualifiedToWon',
                                                    fromPercent(Number(event.target.value))
                                                )
                                            }
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">
                    Org intent attribution
                </div>
                <table className="mt-3 w-full text-sm">
                    <thead>
                        <tr>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Org
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Vertical
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Intent Share (%)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {scenario.entities.orgs.map((org) => {
                            const input = intentAttribution.find((item) => item.orgId === org.orgId);
                            const vertical = scenario.entities.verticals.find(
                                (item) => item.verticalId === org.verticalId
                            );
                            return (
                                <tr key={org.orgId} className="border-b border-slate-200">
                                    <td className="px-2 py-2 text-slate-700">{org.orgId}</td>
                                    <td className="px-2 py-2 text-slate-700">
                                        {vertical?.name ?? org.verticalId}
                                    </td>
                                    <td>
                                        <Input
                                            className="w-16 text-right tabular-nums"
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={toPercent(input?.intentShareWithinVertical ?? 0)}
                                            onChange={(event) =>
                                                updateIntentAttribution(
                                                    org.orgId,
                                                    fromPercent(Number(event.target.value))
                                                )
                                            }
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
