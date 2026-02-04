import { ScenarioState } from '../../types/schema';
import { fromPercent, toPercent } from '../../utils/format';
import { Input } from '../ui/input';

interface IntentCapturePanelProps {
    scenario: ScenarioState;
    onScenarioChange: (scenario: ScenarioState) => void;
}

/**
 * Editor for Intent Capture inputs.
 */
export function IntentCapturePanel({
    scenario,
    onScenarioChange,
}: IntentCapturePanelProps) {
    const { channelMix, surfaceMix, donationModelMix, cr1 } = scenario.inputs;

    const channelSurfaceMap: Record<string, string[]> = {
        online: ['website', 'donor_portal'],
        offline: ['mobile_app'],
        phone: ['virtual_terminal'],
        direct_mail: ['api'],
    };

    function getAllowedSurfaces(channelId: string): string[] {
        return channelSurfaceMap[channelId] ?? [];
    }

    const intentFormationByVertical = new Map(
        scenario.inputs.intentFormation.map((item) => [item.verticalId, item])
    );
    const intentAttributionByOrg = new Map(
        scenario.inputs.intentAttribution.map((item) => [item.orgId, item])
    );
    const cr1BySurfaceModel = new Map(
        cr1.map((item) => [`${item.surfaceId}::${item.donationModelId}`, item])
    );

    function getIntentExposed(orgId: string, verticalId: string): number {
        const intentFormation = intentFormationByVertical.get(verticalId);
        const attribution = intentAttributionByOrg.get(orgId);
        if (!intentFormation || !attribution) {
            return 0;
        }
        return intentFormation.intentTam * attribution.intentShareWithinVertical;
    }

    function updateChannelMix(orgId: string, channelId: string, share: number) {
        const next = channelMix.map((item) =>
            item.orgId === orgId && item.channelId === channelId
                ? { ...item, share }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, channelMix: next },
        });
    }

    function toggleChannel(orgId: string, channelId: string) {
        const next = channelMix.map((item) =>
            item.orgId === orgId && item.channelId === channelId
                ? { ...item, enabled: !item.enabled }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, channelMix: next },
        });
    }

    function updateSurfaceMix(
        orgId: string,
        channelId: string,
        surfaceId: string,
        share: number
    ) {
        const next = surfaceMix.map((item) =>
            item.orgId === orgId &&
                item.channelId === channelId &&
                item.surfaceId === surfaceId
                ? { ...item, share }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, surfaceMix: next },
        });
    }

    function toggleSurface(orgId: string, channelId: string, surfaceId: string) {
        const next = surfaceMix.map((item) =>
            item.orgId === orgId &&
                item.channelId === channelId &&
                item.surfaceId === surfaceId
                ? { ...item, enabled: !item.enabled }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, surfaceMix: next },
        });
    }

    function updateDonationModelMix(
        orgId: string,
        surfaceId: string,
        donationModelId: string,
        share: number
    ) {
        const next = donationModelMix.map((item) =>
            item.orgId === orgId &&
                item.surfaceId === surfaceId &&
                item.donationModelId === donationModelId
                ? { ...item, share }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, donationModelMix: next },
        });
    }

    function toggleDonationModel(
        orgId: string,
        surfaceId: string,
        donationModelId: string
    ) {
        const next = donationModelMix.map((item) =>
            item.orgId === orgId &&
                item.surfaceId === surfaceId &&
                item.donationModelId === donationModelId
                ? { ...item, enabled: !item.enabled }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, donationModelMix: next },
        });
    }

    function updateCr1(surfaceId: string, donationModelId: string, value: number) {
        const next = cr1.map((item) =>
            item.surfaceId === surfaceId && item.donationModelId === donationModelId
                ? { ...item, cr1IntentToOpportunity: value }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, cr1: next },
        });
    }

    function addMembershipModel() {
        const exists = scenario.entities.donationModels.some(
            (model) => model.donationModelId === 'membership'
        );
        if (exists) {
            return;
        }

        const nextDonationModels = [
            ...scenario.entities.donationModels,
            { donationModelId: 'membership', name: 'Membership' },
        ];

        const nextDonationModelMix = [
            ...donationModelMix,
            ...scenario.entities.orgs.flatMap((org) =>
                scenario.entities.surfaces.map((surface) => ({
                    orgId: org.orgId,
                    surfaceId: surface.surfaceId,
                    donationModelId: 'membership',
                    share: 0,
                    enabled: false,
                }))
            ),
        ];

        const nextCr1 = [
            ...cr1,
            ...scenario.entities.surfaces.map((surface) => ({
                surfaceId: surface.surfaceId,
                donationModelId: 'membership',
                cr1IntentToOpportunity: 0.05,
            })),
        ];

        const nextCadenceSplit = [
            ...scenario.inputs.cadenceSplit,
            { donationModelId: 'membership', shareOneTime: 0.7, shareRecurring: 0.3 },
        ];

        const nextCr2 = [
            ...scenario.inputs.cr2,
            ...scenario.entities.orgs.flatMap((org) =>
                scenario.entities.surfaces.flatMap((surface) => [
                    {
                        orgId: org.orgId,
                        surfaceId: surface.surfaceId,
                        donationModelId: 'membership',
                        cadence: 'ONE_TIME' as const,
                        cr2OpportunityToDonation: 0.78,
                    },
                    {
                        orgId: org.orgId,
                        surfaceId: surface.surfaceId,
                        donationModelId: 'membership',
                        cadence: 'RECURRING' as const,
                        cr2OpportunityToDonation: 0.75,
                    },
                ])
            ),
        ];

        const nextDonationAmount = [
            ...scenario.inputs.donationAmount,
            ...scenario.entities.orgs.flatMap((org) =>
                scenario.entities.surfaces.flatMap((surface) => [
                    {
                        orgId: org.orgId,
                        surfaceId: surface.surfaceId,
                        donationModelId: 'membership',
                        cadence: 'ONE_TIME' as const,
                        avgAmount: 75,
                    },
                    {
                        orgId: org.orgId,
                        surfaceId: surface.surfaceId,
                        donationModelId: 'membership',
                        cadence: 'RECURRING' as const,
                        avgAmount: 25,
                    },
                ])
            ),
        ];

        const nextExistingRecurring = [
            ...scenario.inputs.existingRecurringDonors,
            ...scenario.entities.orgs.flatMap((org) =>
                scenario.entities.surfaces.map((surface) => ({
                    orgId: org.orgId,
                    surfaceId: surface.surfaceId,
                    donationModelId: 'membership',
                    existingRecDonorsStartCy: 0,
                }))
            ),
        ];

        onScenarioChange({
            ...scenario,
            entities: {
                ...scenario.entities,
                donationModels: nextDonationModels,
            },
            inputs: {
                ...scenario.inputs,
                donationModelMix: nextDonationModelMix,
                cr1: nextCr1,
                cadenceSplit: nextCadenceSplit,
                cr2: nextCr2,
                donationAmount: nextDonationAmount,
                existingRecurringDonors: nextExistingRecurring,
            },
        });
    }

    const rows = scenario.entities.verticals.flatMap((vertical) => {
        const orgsInVertical = scenario.entities.orgs.filter(
            (org) => org.verticalId === vertical.verticalId
        );

        return orgsInVertical.flatMap((org) => {
            const orgChannels = channelMix.filter((item) => item.orgId === org.orgId);
            const orgSurfaces = surfaceMix.filter((item) => item.orgId === org.orgId);
            const orgModels = donationModelMix.filter((item) => item.orgId === org.orgId);
            const intentExposed = getIntentExposed(org.orgId, org.verticalId);

            return orgChannels.flatMap((channel) => {
                const channelIntent = intentExposed * channel.share;
                const allowedSurfaces = getAllowedSurfaces(channel.channelId);
                const surfacesByChannel = orgSurfaces.filter(
                    (surface) =>
                        surface.channelId === channel.channelId &&
                        allowedSurfaces.includes(surface.surfaceId)
                );

                return surfacesByChannel.flatMap((surface) => {
                    const surfaceIntent = channelIntent * surface.share;
                    const modelsBySurface = orgModels.filter(
                        (model) => model.surfaceId === surface.surfaceId
                    );

                    return modelsBySurface.map((model) => {
                        const modelIntent = surfaceIntent * model.share;
                        const cr1Input = cr1BySurfaceModel.get(
                            `${surface.surfaceId}::${model.donationModelId}`
                        );
                        const cr1Value = cr1Input?.cr1IntentToOpportunity ?? 0;
                        const opportunities = modelIntent * cr1Value;

                        return {
                            vertical,
                            org,
                            channel,
                            surface,
                            model,
                            channelIntent,
                            surfaceIntent,
                            modelIntent,
                            cr1Value,
                            opportunities,
                        };
                    });
                });
            });
        });
    });

    const orgRowCounts = new Map<string, number>();
    const channelRowCounts = new Map<string, number>();
    const surfaceRowCounts = new Map<string, number>();
    const firstOrgIndex = new Map<string, number>();
    const firstChannelIndex = new Map<string, number>();
    const firstSurfaceIndex = new Map<string, number>();

    rows.forEach((row, index) => {
        const orgKey = row.org.orgId;
        const channelKey = `${row.org.orgId}::${row.channel.channelId}`;
        const surfaceKey = `${row.org.orgId}::${row.channel.channelId}::${row.surface.surfaceId}`;

        orgRowCounts.set(orgKey, (orgRowCounts.get(orgKey) ?? 0) + 1);
        channelRowCounts.set(channelKey, (channelRowCounts.get(channelKey) ?? 0) + 1);
        surfaceRowCounts.set(surfaceKey, (surfaceRowCounts.get(surfaceKey) ?? 0) + 1);

        if (!firstOrgIndex.has(orgKey)) {
            firstOrgIndex.set(orgKey, index);
        }
        if (!firstChannelIndex.has(channelKey)) {
            firstChannelIndex.set(channelKey, index);
        }
        if (!firstSurfaceIndex.has(surfaceKey)) {
            firstSurfaceIndex.set(surfaceKey, index);
        }
    });

    return (
        <div className="grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-slate-900">
                        Intent Capture
                    </div>
                    <button
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        onClick={addMembershipModel}
                    >
                        Add Membership model
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Vertical
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Channel
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Surface
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Model
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                CR-1
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => {
                            const orgKey = row.org.orgId;
                            const channelKey = `${row.org.orgId}::${row.channel.channelId}`;
                            const surfaceKey = `${row.org.orgId}::${row.channel.channelId}::${row.surface.surfaceId}`;
                            const isFirstOrgRow = firstOrgIndex.get(orgKey) === index;
                            const isFirstChannelRow = firstChannelIndex.get(channelKey) === index;
                            const isFirstSurfaceRow = firstSurfaceIndex.get(surfaceKey) === index;
                            const orgRowSpan = orgRowCounts.get(orgKey) ?? 1;
                            const channelRowSpan = channelRowCounts.get(channelKey) ?? 1;
                            const surfaceRowSpan = surfaceRowCounts.get(surfaceKey) ?? 1;

                            return (
                                <tr
                                    key={`${row.org.orgId}-${row.channel.channelId}-${row.surface.surfaceId}-${row.model.donationModelId}`}
                                    className="border-b border-slate-200"
                                >
                                    {isFirstOrgRow && (
                                        <td rowSpan={orgRowSpan} className="px-2 py-2 align-top">
                                            <div className="font-medium text-slate-900">
                                                {row.vertical.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {row.org.orgId}
                                            </div>
                                        </td>
                                    )}
                                    {isFirstChannelRow && (
                                        <td rowSpan={channelRowSpan} className="px-2 py-2 align-top">
                                            <div className="font-medium text-slate-900">
                                                {row.channel.channelId}
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Input
                                                    className="w-16 text-right tabular-nums"
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step={0.1}
                                                    value={toPercent(row.channel.share)}
                                                    onChange={(event) =>
                                                        updateChannelMix(
                                                            row.org.orgId,
                                                            row.channel.channelId,
                                                            fromPercent(Number(event.target.value))
                                                        )
                                                    }
                                                />
                                                <span className="text-sm text-slate-700">
                                                    {row.channelIntent.toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                    )}
                                    {isFirstSurfaceRow && (
                                        <td rowSpan={surfaceRowSpan} className="px-2 py-2 align-top">
                                            <div className="font-medium text-slate-900">
                                                {row.surface.surfaceId}
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Input
                                                    className="w-16 text-right tabular-nums"
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step={0.1}
                                                    value={toPercent(row.surface.share)}
                                                    onChange={(event) =>
                                                        updateSurfaceMix(
                                                            row.org.orgId,
                                                            row.channel.channelId,
                                                            row.surface.surfaceId,
                                                            fromPercent(Number(event.target.value))
                                                        )
                                                    }
                                                />
                                                <span className="text-sm text-slate-700">
                                                    {row.surfaceIntent.toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-2 py-2 align-top">
                                        <div className="font-medium text-slate-900">
                                            {row.model.donationModelId}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Input
                                                className="w-16 text-right tabular-nums"
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={0.1}
                                                value={toPercent(row.model.share)}
                                                onChange={(event) =>
                                                    updateDonationModelMix(
                                                        row.org.orgId,
                                                        row.surface.surfaceId,
                                                        row.model.donationModelId,
                                                        fromPercent(Number(event.target.value))
                                                    )
                                                }
                                            />
                                            <span className="text-sm text-slate-700">
                                                {row.modelIntent.toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 align-top">
                                        <div className="mt-2 flex items-center gap-2">
                                            <Input
                                                className="w-16 text-right tabular-nums"
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={0.1}
                                                value={toPercent(row.cr1Value)}
                                                onChange={(event) =>
                                                    updateCr1(
                                                        row.surface.surfaceId,
                                                        row.model.donationModelId,
                                                        fromPercent(Number(event.target.value))
                                                    )
                                                }
                                            />
                                            <span className="text-sm text-slate-700">
                                                {row.opportunities.toLocaleString()}
                                            </span>
                                        </div>
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
