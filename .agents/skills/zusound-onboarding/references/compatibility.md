# Compatibility and lifecycle

- Use Zustand `>=4.0.0 <6.0.0`.
- For Zustand 4.0 only, required input-mutator metadata means Zusound wraps `subscribeWithSelector(...)`, `persist(...)`, or `devtools(...)` outermost. Zustand `>=4.5` and 5 use the modern wrapper order. Follow the [checked 4.0 consumer fixture](../../../../examples/consumer/smoke-v4.cts), not the modern recipe, when pinned to 4.0.
- Production and unknown environments default to audio off. During development, specify `enabled: true` when the test outcome matters.
- Importing Zusound is SSR-safe. Create browser-only subscriber attachments in a client lifecycle boundary. An SSR-created store can use `{ enabled: false }` until client activation.
- Middleware stores own `store.zusoundCleanup()`. Subscriber attachments own both `unsubscribe()` and `zs.cleanup()`. Instance cleanup does not detach middleware stores.
- A subscriber instance is terminal after `cleanup()`. Create a fresh `createZusound()` instance for a new attachment.
- Browsers can require a click or tap before audio resumes. Automated checks can verify the state update and lifecycle, but a person must report whether optional audio was audible.
