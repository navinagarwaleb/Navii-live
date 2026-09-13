/** Shared performer column list after P2P tip migration is applied. */
export const PERFORMER_SELECT =
  "id,username,display_name,bio,tip_handle,interac_email,paypal_link,custom_tip_link,paypal_me_link,venmo_handle,cash_app_handle,user_id,created_at" as const;

/**
 * Use `*` so admin/public loads keep working before tip migrations are applied.
 * Missing columns simply won't appear on the row until the SQL is run.
 */
export const PERFORMER_SELECT_SAFE = "*" as const;
