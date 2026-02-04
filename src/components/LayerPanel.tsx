import { ScenarioState } from '../types/schema';
import {
    ConfigPanel,
    DonationExecutionPanel,
    IntentCapturePanel,
    IntentFormationPanel,
    ValueRealizationPanel,
} from './layers';

interface LayerPanelProps {
    layer: string;
    scenario: ScenarioState;
    onScenarioChange: (scenario: ScenarioState) => void;
}

/**
 * Delegates rendering to the active layer editor.
 */
export function LayerPanel({ layer, scenario, onScenarioChange }: LayerPanelProps) {
    switch (layer) {
        case 'IntentFormation':
            return (
                <IntentFormationPanel
                    scenario={scenario}
                    onScenarioChange={onScenarioChange}
                />
            );
        case 'IntentCapture':
            return (
                <IntentCapturePanel
                    scenario={scenario}
                    onScenarioChange={onScenarioChange}
                />
            );
        case 'DonationExecution':
            return (
                <DonationExecutionPanel
                    scenario={scenario}
                    onScenarioChange={onScenarioChange}
                />
            );
        case 'ValueRealization':
            return (
                <ValueRealizationPanel
                    scenario={scenario}
                    onScenarioChange={onScenarioChange}
                />
            );
        case 'Config':
            return (
                <ConfigPanel
                    scenario={scenario}
                    onScenarioChange={onScenarioChange}
                />
            );
        default:
            return null;
    }
}
