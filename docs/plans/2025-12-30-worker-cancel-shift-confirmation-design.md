# Worker cancel shift confirmation (design)

## Goal
Add a confirmation step when a worker cancels a shift so accidental cancellations are avoided.

## Scope
- Worker UI only.
- Use the existing cancel flow; add a confirmation modal before calling the cancel API.
- Copy: "Chcete naozaj zrusit tuto smenu?"

## Approach
- Centralize the confirmation in `WorkerApplicationCancelButton` so all usages inherit it.
- Add local state to open/close the modal (`isConfirmOpen`) and to prevent double submissions (`isSubmitting`).
- Clicking the cancel button opens the modal.
- Confirm action runs the existing cancel logic; on success, close the modal.
- Cancel action closes the modal without API calls.

## UI details
- Modal with two actions: secondary "Zrusit" (close modal) and primary "Ano, zrusit smenu" (confirm cancel).
- Disable modal actions while submitting.
- If the cancel request fails, keep the modal open and show an inline error in the modal (and keep existing error handling if present).

## Data flow
1. User clicks "Zrusit smenu" button.
2. `isConfirmOpen = true` to show modal.
3. User confirms.
4. `isSubmitting = true`, call existing cancel `fetch` to `/api/worker/applications/:id/cancel`.
5. On success: close modal and reset `isSubmitting`.
6. On error: keep modal open, show error message, reset `isSubmitting`.

## Testing
- If component tests exist, add a test that the cancel API is not called until confirmation.
- No backend changes; no server-side tests required.

## Out of scope
- Backend changes.
- Policy changes around cancellation windows or compensation.
