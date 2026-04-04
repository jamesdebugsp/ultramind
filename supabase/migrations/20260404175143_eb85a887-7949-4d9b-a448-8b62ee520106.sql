INSERT INTO companies_whatsapp_config (
  user_id,
  phone_number_id,
  business_account_id,
  access_token,
  is_verified,
  verified_at,
  phone_display,
  business_name
) VALUES (
  '57a5b053-a6c1-41b0-9172-6d414e10268f',
  '1027560050445213',
  '2385795155234535',
  'EAAcEqrdQEo8BRKPsXhVZBOfVvui1XZBwOfskQ1LZAZBMrVpqapsvlyyhuG7zu4DkIC9a8ax75kr9WgZAc6IhJQpPx4HEgYJZAucNIvLur2Vpd6ufuWYPMc5XzTb0XiYqlcfD6EncqGZAFNRaUTMuWJT9SZA2Kq62umHnDRKlKTcX2AWEGXiM6eMuWz3v9lBb1rfcj0FNR0uNebFoMgSw',
  true,
  now(),
  'UltraMind Solutions',
  'UltraMind Solutions'
) ON CONFLICT (user_id) DO UPDATE SET
  phone_number_id = EXCLUDED.phone_number_id,
  business_account_id = EXCLUDED.business_account_id,
  access_token = EXCLUDED.access_token,
  is_verified = true,
  verified_at = now(),
  phone_display = EXCLUDED.phone_display,
  business_name = EXCLUDED.business_name,
  updated_at = now();