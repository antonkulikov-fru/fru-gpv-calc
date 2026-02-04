import { useMemo, useState } from 'react';
import { computeGpvImpact } from '../services/compute/compute-gpv-impact';
import { validateScenarioState } from '../services/compute/validation';
import {
    duplicateScenario,
    exportScenario,
    importScenarioFile,
    loadScenarios,
    saveScenarios,
    upsertScenario,
} from '../services/scenario-storage';
import { ComputeResult, ValidationError } from '../types/compute';
import { ScenarioState } from '../types/schema';
import { DeltaPanel } from './DeltaPanel';
import { LayerNavigator } from './LayerNavigator';
import { LayerPanel } from './LayerPanel';
import { OutputsPanel } from './OutputsPanel';
import { ScenarioHeader } from './ScenarioHeader';

const LAYERS = [
    'IntentFormation',
    'IntentCapture',
    'DonationExecution',
    'ValueRealization',
    'Config',
] as const;

export function ScenarioWorkspace() {
    const [scenarios, setScenarios] = useState<ScenarioState[]>(() => loadScenarios());
    const [activeScenarioId, setActiveScenarioId] = useState(
        scenarios[0]?.scenario.scenarioId ?? ''
    );
    const [activeLayer, setActiveLayer] = useState<(typeof LAYERS)[number]>(
        'IntentFormation'
    );

    const activeScenario = scenarios.find(
        (scenarioItem: ScenarioState) =>
            scenarioItem.scenario.scenarioId === activeScenarioId
    );

    const { validationErrors, computeResult } = useMemo(() => {
        if (!activeScenario) {
            return { validationErrors: [], computeResult: null };
        }
        const validation = validateScenarioState(activeScenario);
        const result: ComputeResult | null =
            validation.errors.length === 0 ? computeGpvImpact(activeScenario) : null;
        return { validationErrors: validation.errors, computeResult: result };
    }, [activeScenario]);

    const baselineScenario = activeScenario?.scenario.baselineScenarioId
        ? scenarios.find(
            (scenarioItem: ScenarioState) =>
                scenarioItem.scenario.scenarioId ===
                activeScenario.scenario.baselineScenarioId
        )
        : null;

    const baselineResult = useMemo(() => {
        if (!baselineScenario) {
            return null;
        }
        const validation = validateScenarioState(baselineScenario);
        if (validation.errors.length > 0) {
            return null;
        }
        return computeGpvImpact(baselineScenario);
    }, [baselineScenario]);

    function handleScenarioChange(nextScenario: ScenarioState) {
        const nextScenarios = upsertScenario(scenarios, nextScenario);
        setScenarios(nextScenarios);
        saveScenarios(nextScenarios);
        setActiveScenarioId(nextScenario.scenario.scenarioId);
    }

    function handleDuplicateScenario() {
        const nextScenarios = duplicateScenario(scenarios, activeScenarioId);
        setScenarios(nextScenarios);
        saveScenarios(nextScenarios);
    }

    async function handleImportScenario(file: File) {
        const importedScenario = await importScenarioFile(file);
        const nextScenarios = upsertScenario(scenarios, importedScenario);
        setScenarios(nextScenarios);
        saveScenarios(nextScenarios);
        setActiveScenarioId(importedScenario.scenario.scenarioId);
    }

    if (!activeScenario) {
        return (
            <div className="mx-auto max-w-6xl p-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    No scenarios available.
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-4 p-6">
            <ScenarioHeader
                scenarios={scenarios}
                activeScenarioId={activeScenarioId}
                onScenarioChange={(scenarioId: string) => setActiveScenarioId(scenarioId)}
                onDuplicateScenario={handleDuplicateScenario}
                onExportScenario={() => exportScenario(activeScenario)}
                onImportScenario={handleImportScenario}
                onUpdateScenario={handleScenarioChange}
            />

            {validationErrors.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-lg font-semibold text-slate-900">
                        Validation errors
                    </div>
                    {validationErrors.map((error: ValidationError) => (
                        <div key={error.path} className="text-sm text-red-600">
                            {error.message}
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <LayerNavigator
                    layers={LAYERS}
                    activeLayer={activeLayer}
                    onLayerChange={setActiveLayer}
                />
            </div>

            <LayerPanel
                layer={activeLayer}
                scenario={activeScenario}
                onScenarioChange={handleScenarioChange}
            />

            <OutputsPanel computeResult={computeResult} activeLayer={activeLayer} />

            <DeltaPanel currentResult={computeResult} baselineResult={baselineResult} />
        </div>
    );
}
