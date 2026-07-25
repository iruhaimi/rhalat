UPDATE auth.users
SET encrypted_password = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
    updated_at = now()
WHERE email = 'applereview@visafaster.com';