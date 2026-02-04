interface LayerNavigatorProps<T extends string> {
    layers: readonly T[];
    activeLayer: T;
    onLayerChange: (layer: T) => void;
}

/**
 * Renders layer navigation tabs.
 */
export function LayerNavigator<T extends string>({
    layers,
    activeLayer,
    onLayerChange,
}: LayerNavigatorProps<T>) {
    return (
        <div className="flex flex-wrap gap-2">
            {layers.map((layer) => (
                <button
                    key={layer}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${layer === activeLayer
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                    onClick={() => onLayerChange(layer)}
                >
                    {layer}
                </button>
            ))}
        </div>
    );
}
