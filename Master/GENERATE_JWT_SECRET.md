# Generate JWT Secret Key

## Quick Command

### Option 1: One-liner (Node.js)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Option 2: Using the script
```bash
node generate-jwt-secret.js
```

### Option 3: OpenSSL (if installed)
```bash
openssl rand -hex 64
```

### Option 4: PowerShell (Windows)
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

## Recommended Length

- **Minimum**: 32 characters (256 bits)
- **Recommended**: 64 characters (512 bits) or more
- **For production**: Use at least 64 characters

## Add to .env

After generating, add to your `Master/.env` file:

```env
JWT_SECRET="your-generated-secret-key-here"
```

## Security Best Practices

1. ✅ Use a long, random secret (64+ characters)
2. ✅ Never commit `.env` to version control
3. ✅ Use different secrets for development and production
4. ✅ Rotate secrets periodically in production
5. ✅ Store production secrets securely (environment variables, secret managers)

## Example Output

```
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2"
```

