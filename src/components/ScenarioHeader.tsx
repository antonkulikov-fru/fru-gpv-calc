import { ChangeEvent } from 'react';
import { Input } from './ui/input';
import { ScenarioState } from '../types/schema';

interface ScenarioHeaderProps {
    scenarios: ScenarioState[];
    activeScenarioId: string;
    onScenarioChange: (scenarioId: string) => void;
    onDuplicateScenario: () => void;
    onExportScenario: () => void;
    onImportScenario: (file: File) => void;
    onUpdateScenario: (scenario: ScenarioState) => void;
}

/**
 * Scenario header with selection, metadata, and import/export controls.
 */
export function ScenarioHeader({
    scenarios,
    activeScenarioId,
    onScenarioChange,
    onDuplicateScenario,
    onExportScenario,
    onImportScenario,
    onUpdateScenario,
}: ScenarioHeaderProps) {
    const activeScenario = scenarios.find(
        (scenario) => scenario.scenario.scenarioId === activeScenarioId
    );

    if (!activeScenario) {
        return null;
    }

    const scenario = activeScenario;

    function handleLabelChange(event: ChangeEvent<HTMLInputElement>) {
        onUpdateScenario({
            ...scenario,
            scenario: {
                ...scenario.scenario,
                label: event.target.value,
            },
        });
    }

    function handleTimeHorizonChange(event: ChangeEvent<HTMLSelectElement>) {
        onUpdateScenario({
            ...scenario,
            scenario: {
                ...scenario.scenario,
                timeHorizonId: event.target.value as ScenarioState['scenario']['timeHorizonId'],
            },
        });
    }

    function handleImport(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (file) {
            onImportScenario(file);
            event.target.value = '';
        }
    }

    return (
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
            <div className="grid gap-2">
                <div className="text-lg font-semibold text-slate-900">Scenario</div>
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                        value={activeScenarioId}
                        onChange={(event) => onScenarioChange(event.target.value)}
                    >
                        {scenarios.map((scenarioItem) => (
                            <option
                                key={scenarioItem.scenario.scenarioId}
                                value={scenarioItem.scenario.scenarioId}
                            >
                                {scenarioItem.scenario.label}
                            </option>
                        ))}
                    </select>
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {scenario.scenario.mode}
                    </span>
                </div>
                <Input
                    value={scenario.scenario.label}
                    onChange={handleLabelChange}
                    aria-label="Scenario label"
                />
            </div>

            <div className="grid gap-2">
                <div className="text-lg font-semibold text-slate-900">
                    Time horizon & actions
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                        value={scenario.scenario.timeHorizonId}
                        onChange={handleTimeHorizonChange}
                    >
                        <option value="CY">CY</option>
                        <option value="CY_PLUS_1">CY + 1</option>
                        <option value="CY_PLUS_2">CY + 2</option>
                        <option value="ROLLING_2M">Rolling 2M</option>
                    </select>
                    <button
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        onClick={onDuplicateScenario}
                    >
                        Duplicate
                    </button>
                    <button
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        onClick={onExportScenario}
                    >
                        Export JSON
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        Import JSON
                        <input
                            type="file"
                            accept="application/json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
