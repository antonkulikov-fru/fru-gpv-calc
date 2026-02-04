import { ScenarioState } from '../../types/schema';
import { fromPercent, toPercent } from '../../utils/format';
import { Input } from '../ui/input';

interface DonationExecutionPanelProps {
    scenario: ScenarioState;
    onScenarioChange: (scenario: ScenarioState) => void;
}

/**
 * Editor for Donation Execution inputs.
 */
export function DonationExecutionPanel({
    scenario,
    onScenarioChange,
}: DonationExecutionPanelProps) {
    const {
        cadenceSplit,
        cr2,
        donationAmount,
        existingRecurringDonors,
    } = scenario.inputs;

    const intentFormationByVertical = new Map(
        scenario.inputs.intentFormation.map((item) => [item.verticalId, item])
    );
    const intentAttributionByOrg = new Map(
        scenario.inputs.intentAttribution.map((item) => [item.orgId, item])
    );
    const cr1BySurfaceModel = new Map(
        scenario.inputs.cr1.map((item) => [`${item.surfaceId}::${item.donationModelId}`, item])
    );
    const cadenceByModel = new Map(
        cadenceSplit.map((item) => [item.donationModelId, item])
    );
    const cr2ByModelCadence = new Map(
        cr2.map((item) => [
            `${item.orgId}::${item.surfaceId}::${item.donationModelId}::${item.cadence}`,
            item,
        ])
    );
    const donationAmountByModelCadence = new Map(
        donationAmount.map((item) => [
            `${item.orgId}::${item.surfaceId}::${item.donationModelId}::${item.cadence}`,
            item,
        ])
    );
    const existingRecurringByOrgModel = new Map(
        existingRecurringDonors.map((item) => [
            `${item.orgId}::${item.surfaceId}::${item.donationModelId}`,
            item,
        ])
    );

    const avgActiveFraction =
        scenario.inputs.recurringChurnModel.reduce(
            (acc, item) => acc + item.survivalAtStartOfMonth,
            0
        ) / Math.max(scenario.inputs.recurringChurnModel.length, 1);
    const expectedActiveMonths = 12 * avgActiveFraction;
    const expectedChargesNew = scenario.inputs.recurringSeasonalityModel.reduce(
        (acc, item, index) => acc + item.seasonalityWeight * (12 - index),
        0
    );

    const channelSurfaceMap: Record<string, string[]> = {
        online: ['website', 'donor_portal'],
        offline: ['mobile_app'],
        phone: ['virtual_terminal'],
        direct_mail: ['api'],
    };

    function getIntentExposed(orgId: string, verticalId: string): number {
        const intentFormation = intentFormationByVertical.get(verticalId);
        const attribution = intentAttributionByOrg.get(orgId);
        if (!intentFormation || !attribution) {
            return 0;
        }
        return intentFormation.intentTam * attribution.intentShareWithinVertical;
    }

    function updateCadenceSplit(
        donationModelId: string,
        field: 'shareOneTime' | 'shareRecurring',
        value: number
    ) {
        const next = cadenceSplit.map((item) =>
            item.donationModelId === donationModelId ? { ...item, [field]: value } : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, cadenceSplit: next },
        });
    }

    function updateCr2(
        orgId: string,
        surfaceId: string,
        donationModelId: string,
        cadence: 'ONE_TIME' | 'RECURRING',
        value: number
    ) {
        const next = cr2.map((item) =>
            item.orgId === orgId &&
                item.surfaceId === surfaceId &&
                item.donationModelId === donationModelId &&
                item.cadence === cadence
                ? { ...item, cr2OpportunityToDonation: value }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, cr2: next },
        });
    }

    function updateDonationAmount(
        orgId: string,
        surfaceId: string,
        donationModelId: string,
        cadence: 'ONE_TIME' | 'RECURRING',
        value: number
    ) {
        const next = donationAmount.map((item) =>
            item.orgId === orgId &&
                item.surfaceId === surfaceId &&
                item.donationModelId === donationModelId &&
                item.cadence === cadence
                ? { ...item, avgAmount: value }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, donationAmount: next },
        });
    }

    function updateExistingRecurring(
        orgId: string,
        surfaceId: string,
        donationModelId: string,
        value: number
    ) {
        const next = existingRecurringDonors.map((item) =>
            item.orgId === orgId &&
                item.surfaceId === surfaceId &&
                item.donationModelId === donationModelId
                ? { ...item, existingRecDonorsStartCy: value }
                : item
        );
        onScenarioChange({
            ...scenario,
            inputs: { ...scenario.inputs, existingRecurringDonors: next },
        });
    }

    const rows = scenario.entities.verticals.flatMap((vertical) => {
        const orgsInVertical = scenario.entities.orgs.filter(
            (org) => org.verticalId === vertical.verticalId
        );

        return orgsInVertical.flatMap((org) => {
            const intentExposed = getIntentExposed(org.orgId, org.verticalId);
            const orgChannels = scenario.inputs.channelMix.filter(
                (item) => item.orgId === org.orgId
            );
            const orgSurfaces = scenario.inputs.surfaceMix.filter(
                (item) => item.orgId === org.orgId
            );
            const orgModels = scenario.inputs.donationModelMix.filter(
                (item) => item.orgId === org.orgId
            );

            return orgChannels.flatMap((channel) => {
                const channelIntent = intentExposed * channel.share;
                const surfacesByChannel = orgSurfaces.filter(
                    (surface) => surface.channelId === channel.channelId
                );
                const allowedSurfaces = channelSurfaceMap[channel.channelId] ?? [];
                const filteredSurfaces = surfacesByChannel.filter((surface) =>
                    allowedSurfaces.includes(surface.surfaceId)
                );

                return filteredSurfaces.flatMap((surface) => {
                    const surfaceIntent = channelIntent * surface.share;
                    const modelsBySurface = orgModels.filter(
                        (model) => model.surfaceId === surface.surfaceId
                    );

                    return modelsBySurface.flatMap((model) => {
                        const modelIntent = surfaceIntent * model.share;
                        const cr1Input = cr1BySurfaceModel.get(
                            `${surface.surfaceId}::${model.donationModelId}`
                        );
                        const cr1Value = cr1Input?.cr1IntentToOpportunity ?? 0;
                        const donationOpportunities = modelIntent * cr1Value;
                        const cadence = cadenceByModel.get(model.donationModelId);
                        const oneTimeOpportunities =
                            donationOpportunities * (cadence?.shareOneTime ?? 0);
                        const recurringOpportunities =
                            donationOpportunities * (cadence?.shareRecurring ?? 0);

                        const oneTimeCr2 =
                            cr2ByModelCadence.get(
                                `${org.orgId}::${surface.surfaceId}::${model.donationModelId}::ONE_TIME`
                            )?.cr2OpportunityToDonation ?? 0;
                        const recurringCr2 =
                            cr2ByModelCadence.get(
                                `${org.orgId}::${surface.surfaceId}::${model.donationModelId}::RECURRING`
                            )?.cr2OpportunityToDonation ?? 0;

                        const oneTimeNewDonors = oneTimeOpportunities * oneTimeCr2;
                        const recurringNewDonors = recurringOpportunities * recurringCr2;

                        const oneTimeAvgAmount =
                            donationAmountByModelCadence.get(
                                `${org.orgId}::${surface.surfaceId}::${model.donationModelId}::ONE_TIME`
                            )?.avgAmount ?? 0;
                        const recurringAvgAmount =
                            donationAmountByModelCadence.get(
                                `${org.orgId}::${surface.surfaceId}::${model.donationModelId}::RECURRING`
                            )?.avgAmount ?? 0;

                        const donorMonthsFromNew =
                            recurringNewDonors * expectedChargesNew * avgActiveFraction;
                        const existingRecurring =
                            existingRecurringByOrgModel.get(
                                `${org.orgId}::${surface.surfaceId}::${model.donationModelId}`
                            )?.existingRecDonorsStartCy ?? 0;
                        const donorMonthsFromExisting = existingRecurring * expectedActiveMonths;

                        const aggregateLabel = `${vertical.name}/${channel.channelId}/${surface.surfaceId}/${model.donationModelId}`;

                        return [
                            {
                                aggregateLabel,
                                orgId: org.orgId,
                                surfaceId: surface.surfaceId,
                                modelId: model.donationModelId,
                                cadence: 'ONE_TIME' as const,
                                cr2Value: oneTimeCr2,
                                avgAmount: oneTimeAvgAmount,
                                newDonors: oneTimeNewDonors,
                                donorMonthsFromNew: 0,
                                existingRecurring,
                                donorMonthsFromExisting,
                                isAggregateRow: true,
                                donationOpportunities,
                            },
                            {
                                aggregateLabel,
                                orgId: org.orgId,
                                surfaceId: surface.surfaceId,
                                modelId: model.donationModelId,
                                cadence: 'RECURRING' as const,
                                cr2Value: recurringCr2,
                                avgAmount: recurringAvgAmount,
                                newDonors: recurringNewDonors,
                                donorMonthsFromNew,
                                existingRecurring,
                                donorMonthsFromExisting,
                                isAggregateRow: false,
                                donationOpportunities,
                            },
                        ];
                    });
                });
            });
        });
    });

    return (
        <div className="grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Aggregate
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Cadence
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                CR-2 (%)
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Avg Amount
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                New Donors
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Donor-Months from New REC Donors (CY)
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Existing Rec Donors (start of CY)
                            </th>
                            <th className="bg-slate-100 px-2 py-2 text-left font-semibold text-slate-700">
                                Donor-Months from Existing REC Donors (CY)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr
                                key={`${row.aggregateLabel}-${row.cadence}-${index}`}
                                className="border-b border-slate-200"
                            >
                                <td>
                                    {row.isAggregateRow && (
                                        <div className="px-2 py-2 text-slate-700">
                                            {row.aggregateLabel}: {row.donationOpportunities.toLocaleString()}
                                        </div>
                                    )}
                                </td>
                                <td className="px-2 py-2 text-slate-700">{row.cadence}</td>
                                <td>
                                    <Input
                                        className="w-16 text-right tabular-nums"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={toPercent(row.cr2Value)}
                                        onChange={(event) =>
                                            updateCr2(
                                                row.orgId,
                                                row.surfaceId,
                                                row.modelId,
                                                row.cadence,
                                                fromPercent(Number(event.target.value))
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <Input
                                        type="number"
                                        value={row.avgAmount}
                                        onChange={(event) =>
                                            updateDonationAmount(
                                                row.orgId,
                                                row.surfaceId,
                                                row.modelId,
                                                row.cadence,
                                                Number(event.target.value)
                                            )
                                        }
                                    />
                                </td>
                                <td className="px-2 py-2 text-slate-700">
                                    {row.newDonors.toLocaleString()}
                                </td>
                                <td className="px-2 py-2 text-slate-700">
                                    {row.donorMonthsFromNew.toLocaleString()}
                                </td>
                                <td>
                                    {row.cadence === 'RECURRING' ? (
                                        <Input
                                            type="number"
                                            value={row.existingRecurring}
                                            onChange={(event) =>
                                                updateExistingRecurring(
                                                    row.orgId,
                                                    row.surfaceId,
                                                    row.modelId,
                                                    Number(event.target.value)
                                                )
                                            }
                                        />
                                    ) : (
                                        <span className="px-2 py-2 text-slate-500">-</span>
                                    )}
                                </td>
                                <td className="px-2 py-2 text-slate-700">
                                    {row.donorMonthsFromExisting.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
