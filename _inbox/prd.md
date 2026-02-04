GPV Impact Calculator

Product Requirements Document (PRD)
Status: v1.1
Owner: Anton Kulikov
Scope: Internal (Strategy, Planning, Deal Sizing)

⸻

A. Purpose and Epistemic Stance

1.1 Underlying Idea

The GPV Impact Calculator models how donor intent is transformed into economic outcomes.

The model starts from intent, not from donations, because:
	•	Donations are outcomes, not causes
	•	Multiple independent constraints must be satisfied before value materializes
	•	Modeling from donations backward collapses structurally different failure modes into a single number

By modeling intent forward, the system makes explicit:
	•	Where value is created
	•	Where value is lost
	•	Which changes expand or constrain the system’s capacity

The calculator is not predictive. It is a what-if simulator for structural reasoning.

⸻

2. Operating Modes

The calculator supports two explicit modes. Phase 1 implements only Mode A.

2.1 Mode A — Model Data (Counterfactual)
	•	Synthetic, user-defined inputs
	•	No reliance on real org data
	•	Used for:
	•	Market sizing
	•	Roadmap impact analysis
	•	New feature / channel / model simulation

2.2 Mode B — Org Data (Actuals) (Phase 2)
	•	Grounded in real organization-level data
	•	Used for:
	•	Account planning
	•	Deal ROI narratives
	•	Forward projections (e.g. CY+2 recurring impact)

Important constraint:
All intent is attributed to organizations. Verticals are aggregation lenses only, never computational roots.

⸻

3. System Architecture Overview

The GPV Impact Model consists of four layers. These are conceptual layers, not UI or tree nodes.

Intent Formation → Intent Capture → Donation Execution → Value Realization

No layer is allowed to reach “upstream” semantically or mathematically.

⸻

4. Layer Definitions

4.1 Intent Formation Layer

Role: Defines the maximum addressable donor intent that exists outside the product.

Key properties:
	•	Exogenous to FundraiseUp
	•	Exists independently of channels, surfaces, or models
	•	Always attributable to organizations

Primary outputs:
	•	Intent_TAM (by vertical → aggregation of orgs)
	•	Intent_Exposed_To_FRU

Key rule:

This is the last place where vertical-level aggregation is allowed.

Below this layer, all calculations are org-contextual or scenario-specific.

Intent exposure

Intent_Exposed_To_FRU = Intent_TAM × (Active_Orgs / Orgs_Total)

This represents intent that could flow into FRU given current org coverage.

⸻

4.2 Intent Capture Layer

Role: Transforms exposed intent into structured, executable opportunities.

This layer shapes intent but does not execute donations.

Orthogonal dimensions:
	1.	Channels (online, offline, phone, direct mail)
	2.	Execution surfaces (website, API, Tap2Pay, Virtual Terminal, Donor Portal)
	3.	Donation models (campaign, P2P, membership, cart, etc.)

Key outputs:
	•	Captured_Intent
	•	Donation_Opportunities
	•	CR_1 (Intent → Opportunity)

Important constraint:
	•	Channel distribution exists only here, not in Intent Formation

⸻

4.3 Donation Execution Layer

Role: Converts donation opportunities into successful financial transactions.

Includes only execution mechanics:
	•	Cadence choice (1T vs REC)
	•	Completion rates (CR-2-1T, CR-2-REC)
	•	Payment success and retries
	•	Recurring lifecycle mechanics

Explicit exclusions:
	•	Channels
	•	Surfaces
	•	Donation models (already fixed upstream)

Key outputs:
	•	Successful one-time donations
	•	New recurring donors
	•	Existing recurring donor activity

⸻

4.4 Value Realization Layer

Role: Aggregates executed donations into economic value.

Includes:
	•	GPV (1T + REC)
	•	Processor fees
	•	Fee coverage
	•	Revenue share
	•	Org net proceeds

Outputs:
	•	Total GPV
	•	FundraiseUp revenue
	•	Org net proceeds

⸻

5. Organizational Modeling Rules

5.1 Active Orgs as the Baseline
	•	All downstream calculations depend on Active Orgs only
	•	No separate Orgs_Churned input is required
	•	In Model Data mode:
	•	Inputs: Active_Orgs_Start, New_Orgs
	•	Churn is implicitly reflected in the Active Orgs baseline

5.2 Sales Funnel Simplification

The following are scalar inputs, not modeled internally:
	•	Orgs Total
	•	Orgs Reached
	•	Deals Closed Won (= New Active Orgs)

Marketing and sales motion breakdowns are out of scope for Phase 1.

⸻

6. Recurring Revenue Modeling

6.1 Explicit Existing REC Donors

Existing recurring donors are explicit inputs, per donation model:

Existing_REC_Donors_Start[model]

This avoids compounding assumptions and enables scenario control.

6.2 Churn and Duration (Corrected Logic)
	•	Churn is modeled monthly
	•	Survival rate ≠ duration

Donor-Months from Existing REC Donors:

Donor_Months_Existing = Existing_REC_Donors_Start × Months_In_Horizon × Avg_Active_Fraction

Where Avg_Active_Fraction is derived from the churn model.

6.3 New REC Donors
	•	New recurring donors use a seasonality-weighted expected charges model
	•	Expected remaining charges are computed once per time horizon

⸻

7. Time Horizons

All calculations are parameterized by an explicit time horizon.

Supported horizons:
	•	CY (default)
	•	CY+1
	•	CY+2
	•	Rolling 2 months (optional)

One-time GPV is computed per period. Recurring GPV integrates over the full horizon.

⸻

8. Interaction Model (Non-binding)

The UI renders computed flows, not trees.

Views may pivot by:
	•	Donation model
	•	Channel
	•	Surface
	•	Organization
	•	Vertical (aggregation only)

Visualization must not impose structural assumptions on the calculation engine.

⸻

9. Non-Goals (Phase 1)
	•	LTV modeling beyond horizon
	•	Predictive forecasting
	•	Marketing attribution
	•	CRM workflows
	•	Org-level data ingestion

⸻

10. Implementation Phases

Phase 1 (Current)
	•	Model Data mode only
	•	Frozen schema and formulas
	•	Scenario save / duplicate / share

Phase 2
	•	Org Data mode
	•	BI-backed org inputs
	•	Aggregation across org portfolios

⸻

11. Definition of Done (Phase 1)
	•	All calculations traceable to schema
	•	Any variable editable and recomputable
	•	Scenario deltas visible
	•	No hidden aggregation logic

⸻

B. Formula Reference Appendix (Machine-Verifiable)

This is a canonical appendix suitable for:
	•	validation
	•	automated tests
	•	spreadsheet / code generation
⸻

1.1 Intent Formation
IntentExposed(org_id) =
  IntentFormation.intent_tam(vertical_id)
  × IntentAttribution.intent_share_within_vertical(org_id)

TotalIntentExposedToFRU(scenario) =
  Σ IntentExposed(org_id) for all ActiveOrgs

1.2 Intent Capture

CapturedIntent(org, channel, surface, model) =
  IntentExposed(org)
  × ChannelMix.share
  × SurfaceMix.share
  × DonationModelMix.share

DonationOpportunities =
  CapturedIntent × CR1.cr1_intent_to_opportunity

1.3 Cadence Split
OneTimeOpportunities =
  DonationOpportunities × CadenceSplit.share_one_time

RecurringOpportunities =
  DonationOpportunities × CadenceSplit.share_recurring

1.4 Execution (CR-2)
OneTimeTransactions =
  OneTimeOpportunities × CR2(ONE_TIME)

NewRecurringDonors =
  RecurringOpportunities × CR2(RECURRING)

1.5 Recurring Duration (Corrected)
REC_CY_Avg_Active_Fraction =
  AVERAGE(survival_at_start_of_month[1..12])

REC_CY_Expected_Active_Months =
  months_per_year × REC_CY_Avg_Active_Fraction

1.6 Donor-Months
DonorMonths_Existing_REC =
  Existing_REC_Donors_Start
  × REC_CY_Expected_Active_Months

REC_Expected_Charges_New =
  Σ(seasonality_weight_m × months_remaining_m)

DonorMonths_New_REC =
  NewRecurringDonors
  × REC_Expected_Charges_New
  × REC_CY_Avg_Active_Fraction

1.7 GPV
GPV_OneTime =
  OneTimeTransactions × AvgDonationAmount(ONE_TIME)

GPV_Recurring =
  (DonorMonths_Existing_REC + DonorMonths_New_REC)
  × AvgDonationAmount(RECURRING)

GPV_Total =
  GPV_OneTime + GPV_Recurring

1.8 Fees and Revenue
ProcessorFeesPaid =
  GPV_Total
  × ProcessorFeeRate
  × (1 − DonorFeeCoverageRate)

FundraiseUpRevenue =
  GPV_Total × CommissionRate

OrgNetProceeds =
  GPV_Total − ProcessorFeesPaid − FundraiseUpRevenue

1.9 Aggregation Rules
VerticalMetric =
  Σ OrgMetric where org.vertical_id = X

ScenarioMetric =
  Σ OrgMetric across scenario