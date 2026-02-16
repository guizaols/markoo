# Manifest Permission Review (P0)

## Current permissions
- `bookmarks`: required for core product behavior.
- `tabs`: required to add current active tab.
- `storage`: required for local settings, favorites, telemetry buffer.

## Decision
- Keep only these three permissions for launch.
- Do not request host permissions.
- Re-review if sync/cloud features are introduced.
