-- Fix admin password hash
UPDATE users SET password_hash = E'$2a$10$PCcHVwS.8SPme67BvM9r7uztWnq/HSSM.QLPAuGGpG7nitIUwDveu' WHERE email = 'admin@senditcycles.com';
