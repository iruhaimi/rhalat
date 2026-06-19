Fix the `column reference "display_number" is ambiguous` error in the `create_whatsapp_order` database function.

## Change
Update the function so the `INSERT ... RETURNING` clause qualifies the column with the table name, removing the conflict with the function's `RETURNS TABLE(... display_number text)` output parameter.

```sql
RETURNING applications.id, applications.display_number
INTO v_app_id, v_display;
```

Everything else in the function stays identical (auth check, profile creation, role assignment, insert payload, final `RETURN QUERY`).

## Impact
- WhatsApp order creation will succeed instead of throwing the ambiguity error.
- No frontend changes needed.
- No data migration; function replacement only.