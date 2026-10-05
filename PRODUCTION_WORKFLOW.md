# RESCRO production workflow

Shopify is **not connected**. The existing 500 demo parent orders are imported once into Postgres with idempotent inserts. No simulated Shopify synchronization is performed. Existing browser-local release flags are no longer authoritative and are not imported.

## Source of truth

- `portal_production_orders`: original parent ID, complete original item payload, exclusive `pool` / `production` location, release time, production run number.
- `portal_production_items`: stable child ID, parent ID, original item payload, selection flag, current stage, stage-entry and finish timestamps.
- `portal_production_events`: completion/release/return records, quantity, authenticated actor, timestamp and run.
- `portal_audit_logs`: existing shared audit system receives each release, completion and whole-order return in the same SQL statement as the mutation.

An order stays intact. Only selected, factory-manufactured items advance. Unselected/external items remain visible in View Order. Any selected item moves the entire parent out of Order Pool; the parent is shown once on Dashboard. Return is always whole-order. Historical logs remain; re-release increments the run and starts the selected items at Mesh.

## Active employee queues

`/daily-production` shows only selected items currently waiting at a station the user can view. FIFO is based on Admin's release time. Search does not change FIFO. Expand a work item to read the existing station instruction layout. Complete processes the full quantity of that line item; individual physical units are not split in this version.

Mesh → Cord & Eyelet → Frame → Assembly → Quality Control → Packaging → Finished.

Packaging is represented by the existing `Waiting for Packing` production stage. Packaging completion records Packed and Finished milestones automatically. There is no additional employee queue or manual finish step between them. The eight existing Dashboard station labels and their order are preserved.

A parent is finished only when **all selected items** are finished. Dashboard shows the earliest remaining active stage; station filters match any selected child at that station. An order can legitimately appear in more than one station's filtered view when its different items are at different stages, but is never duplicated in the main order list.

## Permissions

Order Pool view, release and return are Admin-only, enforced in the page proxy and mutation API. Employees need:

- `View Daily Production` to access the work page.
- Their station role, or an explicit `View <station>` permission, to see that queue.
- `Complete <station>` to complete its items.

Role determines the default station. Explicit station permissions can grant additional queues. Completion rights are independently checked on the server. Admin can see/complete all six queues. User ID/name are derived from the signed-in session, never accepted from the browser request body.

## Screens and counts

- Dashboard: one row per parent order, original number preserved; existing layout unchanged.
- Live Production: actual active orders and station quantities from the shared snapshot.
- Production Overview / Station Performance: quantities summed from completion events for the selected Istanbul calendar dates. Employee breakdown sums the same events by authenticated actor.
- Delayed Orders: actual release and stage-entry timestamps, active parents over seven full days.
- View Order: all original items retained, all six instruction cards retained, actual item-flow statuses.

The shared client provider refreshes immediately after actions and every eight seconds while the page is visible. Production changes persist across users, browser refreshes and devices. Errors are displayed and never replaced with fabricated production numbers.

## Consistency and tests

Writes are atomic PostgreSQL statements with parent-row locks. Invalid/duplicate releases, stale station completions, repeat returns and completions from an old production run are rejected. Stock, shipping and order instruction calculations are unchanged.

`npm test` tests the pure workflow and executes the actual SQL with an isolated embedded PostgreSQL (PGlite), including authorization API boundaries, partial releases, full sequence, audit attribution, duplicate prevention and whole-order return/re-release. `npm run build` checks the Next.js production build.

## Future integration boundary

The future Shopify importer must upsert parent orders and their original children into the Pool without changing existing production selection/stage fields. Shopify IDs and order numbers must remain stable. Do not re-import into production. Instruction properties and final calculations currently remain the existing demo implementation; replacing those with real Shopify properties is a separate integration task.
