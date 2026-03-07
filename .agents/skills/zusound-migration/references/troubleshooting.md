# Troubleshooting

## Pilot passes, expanded rollout fails

- Compare option drift between pilot and expanded stores.
- Revert expanded stores and restore pilot-only scope.

## Middleware interaction regressions

- Confirm middleware order did not change unexpectedly.
- Isolate Zusound by testing one store with minimal middleware stack.

## Rollback uncertainty

- Require explicit rollback command/code path before moving to next phase.
