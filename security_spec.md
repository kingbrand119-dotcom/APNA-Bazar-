# Security Specification for Apna Bazar

## 1. Data Invariants
- A product must have a valid `seller_id` matching the creator.
- A product is not visible to public unless `is_approved` is true.
- Only admins can set `is_approved` to true.
- An order must link a `buyer_id` and `seller_id`.
- Messages are only accessible to the `sender_id` and `receiver_id`.
- Users cannot change their own `role` once set (or only admins can).

## 2. The "Dirty Dozen" Payloads (Examples to Block)
1. **The Ghost Field**: Updating product with `adminVerified: true`.
2. **The Identity Spoof**: Creating a product with someone else's `seller_id`.
3. **The Role Escalation**: Updating user profile to `role: 'admin'`.
4. **The Price Manipulation**: Changing product price to negative.
5. **The Order Hijack**: Reading someone else's order.
6. **The Message Snoop**: Reading messages between two other users.
7. **The Shadow Delete**: Deleting someone else's product.
8. **The Status Skip**: Updating order from `pending` to `delivered` directly (handled by logic, but rules should restrict keys).
9. **The Huge Payload**: Sending 1MB string in `title`.
10. **The Orphaned Order**: Creating order for non-existent product (client side check, but rules can use `get`).
11. **The PII Leak**: Reading `users/{userId}` as a non-owner.
12. **The Unauthorized Approval**: Normal seller setting `is_approved: true`.

## 3. Product Validation Example
```javascript
function isValidProduct(data) {
  return data.title is string && data.title.size() <= 100 &&
         data.price is number && data.price > 0 &&
         data.seller_id == request.auth.uid;
}
```
