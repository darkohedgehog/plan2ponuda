# Rule Engine Specification

This document defines how the Plan2Ponuda rule engine should work.

The rule engine is responsible for transforming reviewed room data into:

- electrical point suggestions
- material quantities
- quote inputs

This is one of the core business logic systems in the application.

AI agents must read this file before implementing:

- room suggestions
- material calculation
- quote generation

---

# 1. Purpose

The rule engine converts room information into predictable installation estimates.

Input:

- room type
- room area
- optional user overrides

Output:

- sockets
- switches
- lights
- estimated material quantities
- labor inputs

The goal is not to produce a legally final electrical design.

The goal is to produce a fast, practical, editable estimation baseline.

---

# 2. Inputs

The rule engine receives reviewed room data.

Each room contains:

- name
- type
- estimatedAreaM2
- optional user overrides

Example room input:

```json
{
  "name": "Kitchen",
  "type": "kitchen",
  "estimatedAreaM2": 12
}
⸻

3. Supported Room Types

The system supports the following room types:

* living_room
* bedroom
* kitchen
* bathroom
* hallway
* office
* unknown

Future room types may be added later.

⸻

4. Output Categories

The rule engine produces three levels of output.

4.1 Room Suggestions

Per-room suggested values:

* sockets
* switches
* lights

4.2 Project Material List

Project-wide materials derived from all rooms:

* cable 3x2.5
* cable 3x1.5
* sockets
* switches
* boxes
* breakers
* panel
* protective items

4.3 Quote Inputs

Values used to generate quote totals:

* material cost
* labor cost
* subtotal
* total

⸻

5. Suggestion Rules — Base Values

These are the baseline room suggestion defaults.

living_room

* sockets: 5
* switches: 2
* lights: 2

bedroom

* sockets: 4
* switches: 1
* lights: 1

kitchen

* sockets: 6
* switches: 2
* lights: 2

bathroom

* sockets: 2
* switches: 1
* lights: 1

hallway

* sockets: 1
* switches: 1
* lights: 1

office

* sockets: 5
* switches: 1
* lights: 2

unknown

* sockets: 2
* switches: 1
* lights: 1

These values are the starting point.

Users may override them manually.

⸻

6. Area-Based Adjustments

Base values may be adjusted using room area.

This keeps the estimate more realistic.

6.1 Living Room

If area > 25 m²

* add +2 sockets
* add +1 light

6.2 Bedroom

If area > 18 m²

* add +1 socket

6.3 Kitchen

If area > 15 m²

* add +2 sockets

If area > 20 m²

* add +1 light

6.4 Bathroom

If area > 10 m²

* add +1 light

6.5 Office

If area > 20 m²

* add +2 sockets
* add +1 light

6.6 Hallway

If area > 8 m²

* add +1 light

⸻

7. User Override Rules

The system must always support user overrides.

If the user manually edits:

* sockets
* switches
* lights

Then the final rule engine output must use the user-edited values instead of the auto-generated defaults.

Priority:

1. user override
2. area-adjusted default
3. base default

⸻

8. Final Suggestion Resolution

Each room must produce final resolved values.

Example logic:

resolvedSockets =
userSockets ?? generatedSockets

resolvedSwitches =
userSwitches ?? generatedSwitches

resolvedLights =
userLights ?? generatedLights

These resolved values are used for all downstream calculations.

⸻

9. Material Mapping Rules

The project material list is calculated from the sum of all resolved room suggestions.

⸻

10. Core Material Types

The MVP material calculation should support:

* socket module
* switch module
* light point
* cable 3x2.5
* cable 3x1.5
* junction box
* breaker
* panel
* miscellaneous installation allowance

⸻

11. Material Quantity Rules

11.1 Socket Modules

One socket point = one socket module

Quantity:

totalSockets

⸻

11.2 Switch Modules

One switch point = one switch module

Quantity:

totalSwitches

⸻

11.3 Light Points

One light point = one light point item

Quantity:

totalLights

⸻

11.4 Junction Boxes

For MVP:

junctionBoxes =
totalSockets + totalSwitches

Optional future logic may refine this.

⸻

11.5 Cable 3x2.5

Used mainly for socket circuits.

Formula:

cable3x25 =
totalSockets * 4

Unit:

meters

This is a simplified baseline estimate.

⸻

11.6 Cable 3x1.5

Used mainly for lighting circuits.

Formula:

cable3x15 =
totalLights * 5

Unit:

meters

⸻

11.7 Breakers

For MVP:

breakers =
ceil((totalSockets + totalLights) / 8)

Minimum:

1

⸻

11.8 Panel

Always include:

1 panel per project

This may later vary by project size.

⸻

11.9 Miscellaneous Allowance

To avoid unrealistically low estimates, add a miscellaneous installation item.

Example:

miscellaneous =
10% of total material line count
or fixed starter quantity depending on item model

For MVP, use one fixed line item:

* installation miscellaneous
* quantity: 1

⸻

12. Material Pricing

Each material line should have:

* quantity
* unitPrice
* totalPrice

Calculation:

totalPrice = quantity * unitPrice

Prices come from:

Material.defaultPrice

Users may later override prices manually on project materials.

Priority:

1. project-specific edited unitPrice
2. default material price

⸻

13. Labor Calculation Rules

Labor is calculated at project level.

MVP rule:

laborCost =
areaM2 * laborFactor

Suggested default:

laborFactor = 12

This means:

80 m² project → labor cost = 960

This value should be configurable later.

⸻

14. Quote Calculation Rules

materialCost

Sum of all project material line totals

laborCost

Calculated from project area

subtotal

materialCost + laborCost

total

For MVP:

total = subtotal

Future phases may include tax/VAT logic.

⸻

15. Rule Engine Flow

The rule engine should run in the following order.

Step 1

Read reviewed rooms.

Step 2

Generate base suggestions by room type.

Step 3

Apply area-based adjustments.

Step 4

Apply user overrides.

Step 5

Persist final room suggestion values.

Step 6

Aggregate project totals.

Step 7

Generate material list.

Step 8

Calculate quote totals.

⸻

16. Recommended Code Structure

src/lib/rules/room-rules.ts

Responsibilities:

* base suggestion rules
* area adjustments
* final suggestion resolution

Suggested functions:

* getBaseRoomRule(roomType)
* applyAreaAdjustments(roomType, areaM2, baseRule)
* resolveRoomSuggestion(room)

src/lib/rules/material-rules.ts

Responsibilities:

* aggregate room totals
* map points to materials
* calculate quantities

Suggested functions:

* aggregateProjectPoints(rooms)
* generateProjectMaterials(project, rooms, materialsCatalog)
* calculateMaterialTotals(items)

src/server/services/quote-service.ts

Responsibilities:

* calculate labor cost
* calculate subtotal
* create Quote record

Suggested functions:

* calculateLaborCost(areaM2)
* generateQuote(projectId)

⸻

17. Data Persistence Rules

The rule engine must persist outputs in structured form.

Room level

Persist in:

RoomSuggestion

Project level materials

Persist in:

ProjectMaterial

Quote level

Persist in:

Quote

Never keep critical outputs only in memory.

⸻

18. Validation Rules

Inputs must be validated before rule execution.

Validate:

* room type exists
* areaM2 is a number if present
* user overrides are non-negative integers

Outputs must also be validated:

* quantities must not be negative
* prices must not be negative
* totals must be numeric

⸻

19. Edge Cases

The rule engine must handle:

Missing room area

Fallback to base rule only

Unknown room type

Use unknown defaults

Empty room list

Return empty material list and zero quote

Invalid override values

Reject or fallback safely

Duplicate room names

Allowed, because different rooms may share generic labels

⸻

20. MVP Accuracy Philosophy

This rule engine is intentionally simplified.

It provides:

* fast estimates
* editable defaults
* practical starting point

It does NOT provide:

* final engineering documentation
* certified electrical design
* regulation-complete project outputs

The system must always present results as:

suggestions
estimates
editable values

⸻

21. Future Improvements

Potential later enhancements:

* appliance-aware kitchen logic
* dedicated bathroom safety rules
* cable routing estimation by layout geometry
* multi-circuit panel sizing
* standards-based rule packs
* country-specific presets
* supplier catalog mapping
* VAT/tax support
* labor cost presets by region

⸻

22. Definition of Done

Rule engine implementation is considered complete when:

* room suggestions are generated consistently
* user overrides are respected
* project materials are generated from resolved values
* quote totals are calculated
* outputs are persisted
* invalid inputs fail safely
* logic is separated from UI and route handlers