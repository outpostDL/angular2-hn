# Reset: HN Reader — UX Refresh demo (P-DAN-10)

Restores GitHub and Linear to the demo baseline captured 2026-09-30T03:10:10Z.
Snapshot: `demo/ux-refresh/baseline.json` on branch `demo/ux-refresh-baseline` of outpostDL/angular2-hn.
Run only after the user confirms "reset the demo". Report every action taken.

## GitHub (outpostDL/angular2-hn)
1. `master` must still be at `67f0eb17fc4eeb76f2d9e07be0913cdbdc3362b5`. If it moved, stop and tell the user; never force-push master.
2. Close (don't merge) every open PR whose head branch matches a demo pattern, with the comment "Closed by demo reset":
   `feature/ux-refresh*`, `devin/*DAN-7[4-9]*`, `devin/*DAN-8[0-6]*`, `dan/dan-7[4-9]-*`, `dan/dan-8[0-6]-*` (case-insensitive), plus any PR whose body links DAN-74 to DAN-86 and was created after the baseline.
3. Delete those head branches on the remote.
4. Never touch: `master`, `demo/*` branches (including `demo/ux-refresh-baseline`), PRs #26 and #27, or any branch that existed before the baseline.

## Linear (team Dan Borg, via the `linear` MCP server)
For each issue in `baseline.json` (DAN-73 to DAN-86):
1. Restore `status`, `description`, `labels`, `priority`, `assignee` (none), and the milestone.
2. Restore relations: remove any blocks/blockedBy/relatedTo that aren't in the snapshot and re-add missing ones.
3. Delete comments created after the baseline (`list_comments` then `delete_comment`).
4. Remove attachments added after the baseline (`delete_attachment`).

Project P-DAN-10:
1. Restore `description`, `summary`, status `Planned`, and priority.
2. Delete status updates created after the baseline (`delete_status_update`).
3. Issues created in the project after the baseline: remove them from the project and move them to Canceled with the comment "Created during a demo run; removed by demo reset".
4. Keep the "Demo baseline & reset" document. Remove any other project documents created after the baseline.

## Verify
Re-read every issue and the project and compare them to `baseline.json`. Confirm `gh pr list --state open` only shows PRs that were there before the baseline. Then tell the user the demo is clean.
