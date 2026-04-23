# Security Specification - User Guide Manager

## Data Invariants
- A Page must have a title and sequence.
- Hierarchical structure: parentId must either be null or reference an existing Page.
- Users can view all pages.
- Only authenticated users can create/update/delete pages (Admin role assumed for all authenticated users for this app).

## The Dirty Dozen Payloads (Targeting Rejection)
1. Creating a page without a title.
2. Creating a page with a title > 200 characters.
3. Creating a page with a content > 100KB.
4. Updating a page's `updatedAt` to a client-side timestamp instead of `request.time`.
5. Deleting a page as an unauthenticated user.
6. Injecting extra fields (e.g., `isAdmin: true`) into a page document.
7. Modifying `createdBy` after creation.
8. Setting `sequence` to a non-integer value.
9. Setting `parentId` to a non-string value.
10. Creating a page with an ID containing malicious characters (poisoning).
11. Attempting to list all pages without being signed in (if privacy was a concern, but here pages are public).
12. Updating `content` as an unauthenticated user.

## Test Runner Plan
Using `@firebase/rules-unit-testing` logic (conceptual for this turn).
