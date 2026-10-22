# Security Specification: User Profile & Cross-Device Library Sync

## 1. Data Invariants
1. **User Identity Boundary**: Every document at `/users/{userId}` must only be readable and writable by the authenticated user whose `request.auth.uid == userId`.
2. **Identity Integrity**: The document field `id` must equal `request.auth.uid` and path variable `userId`.
3. **No Unauthenticated Access**: Unauthenticated users cannot read or write any user records.
4. **Immutable Fields**: `id`, `email`, and `createdAt` cannot be modified or replaced once created.
5. **Array Bounds**: `savedArticleIds` and `dislikedArticleIds` must not exceed 200 items each, preventing Denial-of-Wallet attacks.
6. **Strict Field Whitelist**: User documents only permit valid known fields (`id`, `name`, `email`, `studyTrack`, `interests`, `savedArticleIds`, `dislikedArticleIds`, `readingGoalMinutes`, `createdAt`, `updatedAt`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read**: Anonymous/null auth attempting to read `/users/alice_uid`. Expected: `PERMISSION_DENIED`.
2. **Cross-User Snooping**: Authenticated `bob_uid` attempting to read `/users/alice_uid`. Expected: `PERMISSION_DENIED`.
3. **Cross-User Overwrite**: Authenticated `bob_uid` attempting to overwrite `/users/alice_uid`. Expected: `PERMISSION_DENIED`.
4. **ID Spoofing on Create**: Authenticated `alice_uid` attempting to create `/users/alice_uid` with payload `{ id: "bob_uid" }`. Expected: `PERMISSION_DENIED`.
5. **Shadow Field Injection**: Injecting `{ isAdmin: true, role: 'admin' }` into `/users/alice_uid`. Expected: `PERMISSION_DENIED`.
6. **Immortal Field Mutation**: Attempting to alter `createdAt` on an existing `/users/alice_uid` document. Expected: `PERMISSION_DENIED`.
7. **Identity Mutation on Update**: Changing `id` or `email` during an update. Expected: `PERMISSION_DENIED`.
8. **Denial-of-Wallet Array Flood**: Pushing an array of 5,000 synthetic IDs into `savedArticleIds`. Expected: `PERMISSION_DENIED`.
9. **Junk Path ID Poisoning**: Trying to access a path with > 128 chars or invalid characters. Expected: `PERMISSION_DENIED`.
10. **Invalid String Injection**: Sending a non-string or 50KB string into `name` or `studyTrack`. Expected: `PERMISSION_DENIED`.
11. **Negative Reading Goal**: Setting `readingGoalMinutes` to an invalid negative number or string. Expected: `PERMISSION_DENIED`.
12. **Blanket Collection Query**: Attempting `list /users` without scoped query on own UID. Expected: `PERMISSION_DENIED`.

## 3. Test Runner
Defined in `firestore.rules.test.ts` to test rules enforcement against standard security gates.
