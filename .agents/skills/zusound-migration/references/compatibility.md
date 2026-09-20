# Composition and lifecycle

- Zusound supports Zustand `>=4.0.0 <6.0.0`.
- The documented supported middleware orders are `devtools(persist(zusound(initializer)))` and `subscribeWithSelector(zusound(initializer))`. Preserve an existing order unless the consumer typechecks and tests the changed stack.
- Modern Zustand 4 and 5 examples use named `create` and `createStore` imports. Zustand 4.0 may require its legacy default imports. Keep the current consumer import style when supporting that earliest peer version.
- Middleware teardown is `store.zusoundCleanup()`. Subscriber teardown requires both `unsubscribe()` and cleanup of that fresh instance.
- Production and unknown environments default off. Use explicit enablement only for deliberate browser feedback.
