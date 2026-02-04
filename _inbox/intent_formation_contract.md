Intent Formation Layer — Review, Corrections, and Frozen Contract

Status: Frozen (Pass A)
Scope: Intent Formation layer only
Audience: Product, Engineering, Modeling
Purpose: Align UI, data schema, and computation logic with the canonical GPV Impact Model

⸻

1. Purpose of the Intent Formation Layer

The Intent Formation layer models where donor intent exists before Fundraise Up can act on it.

It answers one question:

How much donor intent exists in the world, and what portion of it becomes addressable by Fundraise Up through organizations that are active on the platform?

This layer:
	•	Does not execute donations
	•	Does not include channels, surfaces, or donation models
	•	Does not contain currency
	•	Does not predict behavior

It establishes the upper bound of all downstream value.

⸻

2. Fundamental Invariants (Non-Negotiable)

2.1 Intent is Abstract
	•	Intent is not money
	•	Intent is not donations
	•	Intent is not transactions

Intent units are abstract, dimensionless quantities representing willingness to donate.

Currency appears only in Donation Execution and Value Realization.

⸻

2.2 Organizations Are the Atomic Unit
	•	All intent is attributed to organizations
	•	Verticals are aggregations of organizations, nothing more
	•	No downstream logic may operate directly on verticals

A vertical never “has” intent.
Organizations within that vertical do.

⸻

2.3 Vertical-Level Aggregation Ends Here

The Intent Formation layer is the last place where vertical-level aggregation is allowed.

Everything downstream must operate on:
	•	org_id
	•	scenario-specific parameters

⸻

3. Conceptual Structure of the Layer

The layer has three conceptual steps, each with strict boundaries.

⸻

3.1 TAM — Total Intent (Vertical-Level, Exogenous)

What it represents
	•	Total donor intent existing in the world for a given nonprofit vertical

Properties
	•	Exogenous input
	•	Not derived
	•	Vertical-level only

Canonical variable

intent_tam[vertical_id]

Forbidden
	•	Treating intent as currency
	•	Dividing intent directly by org counts
	•	Applying channels or conversion rates here

⸻

3.2 SAM — Organization Universe (Still Non-Product)

This step switches from donors to organizations, not to Fundraise Up yet.

What it represents
	•	How many organizations exist in a vertical
	•	How many are reachable by sales/marketing motion

Canonical variables

orgs_total[vertical_id]
orgs_reached[vertical_id]

Derived variables

orgs_qualified = orgs_reached * CR_reached_to_qualified
orgs_closed_won = orgs_qualified * CR_qualified_to_won

Important
	•	These are counts of organizations
	•	They do not affect intent directly
	•	They exist to determine which orgs can become active

⸻

3.3 SOM — Active Organizations (Bridge to FRU)

This is where Fundraise Up enters the picture.

Canonical rule

Only active organizations can expose intent to Fundraise Up.

⸻

4. Active Organization Logic (Canonical)

4.1 Definitions

ExistingActiveOrgs_Start
NewActiveOrgs = orgs_closed_won

ActiveOrgs =
  ExistingActiveOrgs_Start
+ NewActiveOrgs

4.2 Churn Handling
	•	Model-data mode:
	•	No Orgs_Churned input
	•	ExistingActiveOrgs_Start is assumed net of churn
	•	Org-data mode (future):
	•	Active orgs are read directly from data
	•	Churn is implicit, not modeled

Churn is not an input at this layer.

⸻

5. Intent Exposure to Fundraise Up (Core Output)

5.1 Org-Level Attribution (Mandatory)

Each active org receives a share of vertical intent.

Canonical input

intent_share_within_vertical[org_id] ∈ [0,1]

Constraint

SUM(intent_share_within_vertical) <= 1   (per vertical)

It is NOT required to sum to 1.
The sum represents the portion of the TAM that belongs to the specific set of active organizations in the scenario.
The remainder (1 - SUM) belongs to organizations not modeled or not active.


⸻

5.2 Org-Level Intent Exposed

Canonical formula

IntentExposed(org_id) =
  intent_tam(vertical_id)
* intent_share_within_vertical(org_id)

This is the only valid way to attribute intent to Fundraise Up.

⸻

5.3 Total Intent Exposed to FRU

Required aggregate

TotalIntentExposedToFRU =
  SUM(IntentExposed(org_id))
  WHERE org_id ∈ ActiveOrgs

Yes — this aggregate must exist explicitly in the schema and computation graph.

It is the handoff variable to the Intent Capture layer.

⸻

6. What Is Explicitly Forbidden

The following are model violations:
	•	Applying channel distribution in Intent Formation
	•	Applying surface or donation model splits
	•	Using vertical-level intent directly downstream
	•	Multiplying intent by conversion rates to create donations
	•	Treating intent_tam as dollars
	•	Computing intent exposure using:

intent_tam * (ActiveOrgs / orgs_total)



Intent is attributed per org, not per ratio.

⸻

7. UI Contract (Intent Formation Only)

7.1 Vertical Tables
	•	May exist only as read-only aggregates
	•	Must never be used as computation inputs

7.2 Org Tables

Must support:
	•	org_id
	•	vertical_id
	•	intent_share_within_vertical

Must enforce:
	•	Sum <= 1 validation per vertical (strict = 1 is NOT required)
	•	Read-only derived intent values

⸻

8. Outputs of the Intent Formation Layer

The layer produces exactly three categories of outputs:
	1.	Active org set

ActiveOrgs


	2.	Org-level intent

IntentExposed(org_id)


	3.	Scenario-level aggregate

TotalIntentExposedToFRU



Nothing else.

⸻

9. Handoff Contract to Next Layer

The Intent Capture layer must receive:

{
  "active_orgs": [...],
  "intent_exposed_by_org": { "org_id": number },
  "total_intent_exposed": number
}

No verticals.
No channels.
No currency.

⸻

10. Summary (Non-Negotiable Takeaways)
	•	Intent Formation ends at org-attributed intent
	•	Vertical logic stops here
	•	Active orgs are the sole bridge to Fundraise Up
	•	Intent is abstract and conserved
	•	This layer defines the upper bound of everything downstream
