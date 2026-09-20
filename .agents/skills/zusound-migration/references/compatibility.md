# Composition and lifecycle

- Zusound supports Zustand `>=4.0.0 <6.0.0`.
- Zustand `>=4.5` and 5 use `devtools(persist(zusound(initializer)))` and `subscribeWithSelector(zusound(initializer))`. Preserve an existing order unless the consumer typechecks and tests the changed stack.
- Zustand 4.0 requires Zusound outermost because of required input-mutator metadata: `zusound(devtools(initializer))`, `zusound(persist(initializer, options))`, or `zusound(subscribeWithSelector(initializer))`. It can also require legacy default `create` and `createStore` imports. Follow the [checked 4.0 fixture](../../../../examples/consumer/smoke-v4.cts) for that exact version.
- Middleware teardown is `store.zusoundCleanup()`. Subscriber teardown requires both `unsubscribe()` and cleanup of that fresh instance.
- Production and unknown environments default off. Use explicit enablement only for deliberate browser feedback.
