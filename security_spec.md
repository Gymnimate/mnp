# Security Specification - Firebase Firestore Security Rules

## 1. Data Invariants
- An anonymous opinion entry must belong to the `opinions` collection.
- Every entry's `createdAt` must exactly match the server timestamp (`request.time`).
- The `text` must be a valid string between 1 and 2000 characters.
- The `authorName` must be a valid string between 1 and 100 characters.
- The `category` must be strictly one of `opinion`, `note`, or `story`.
- Entries are read-only to the public; updating or deleting existing entries is strictly forbidden (`allow update, delete: if false`).

## 2. Security Payloads (Red Team Scenarios)
1. **Empty Body Payload**:
   `{ "text": "", "authorName": "Anonym", "category": "opinion", "createdAt": "request.time" }` -> REJECTED (empty string).
2. **Missing Field Payload**:
   `{ "text": "Interesting topic!", "category": "opinion", "createdAt": "request.time" }` -> REJECTED (missing authorName).
3. **Invalid category Payload**:
   `{ "text": "Valid", "authorName": "Anonym", "category": "unsupported", "createdAt": "request.time" }` -> REJECTED (unsupported category value).
4. **Spoofed/Client Timestamp**:
   `{ "text": "Valid text", "authorName": "Anonym", "category": "note", "createdAt": "2026-05-31T08:00:00Z" }` -> REJECTED (does not equal request.time).
5. **Too Long Author Payload**:
   `{ "text": "Valid text", "authorName": "VeryLongName...[repeated to > 100 char]", "category": "note", "createdAt": "request.time" }` -> REJECTED (size limit).
6. **Attempt Update Payload**:
   Modification of an already existing opinion document -> REJECTED (updates forbidden).
