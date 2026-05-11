# Cloudflare Deployment Guide

This guide covers deploying your cybersecurity portfolio to Cloudflare Pages with backend support via Cloudflare Workers.

## Prerequisites

- A Cloudflare account (free or paid)
- A GitHub repository connected to your project
- Node.js and npm installed locally
- Wrangler CLI: `npm install -g @cloudflare/wrangler`

## Step 1: Setup Cloudflare Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Create a new account or login to existing one
3. Note your Account ID (found in Account Overview)
4. Create a new API token with Pages & Workers permissions

## Step 2: Connect GitHub Repository

1. In Cloudflare Dashboard, go to **Pages**
2. Click **Create a project**
3. Select **Connect to Git**
4. Authorize GitHub and select your repository
5. Select the branch to deploy (usually `main`)

## Step 3: Configure Build Settings

When connecting your repo, configure:

- **Framework preset**: None (or Next.js if available)
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (or your project root)

## Step 4: Set Environment Variables

In Cloudflare Pages settings:

1. Go to your project → **Settings** → **Environment variables**
2. Add the following variables for production:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url (if using Supabase)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (if using Supabase)
RESEND_API_KEY=your_resend_api_key (if using Resend for emails)
SENDGRID_API_KEY=your_sendgrid_api_key (if using SendGrid)
CONTACT_EMAIL=your.email@example.com (where to receive contact form submissions)
CONTACT_API_KEY=your_secure_api_key (optional - for basic API security)
```

## Step 5: Configure Contact Form Email

Choose one of the following email services:

### Option A: Resend (Recommended)

1. Sign up at [Resend.com](https://resend.com)
2. Get your API key
3. Add `RESEND_API_KEY` to environment variables
4. Install package: `npm install resend`
5. Uncomment the Resend section in `app/api/contact/route.ts`

```bash
npm install resend
```

### Option B: SendGrid

1. Sign up at [SendGrid](https://sendgrid.com)
2. Create an API key
3. Add `SENDGRID_API_KEY` to environment variables
4. Install package: `npm install @sendgrid/mail`
5. Use SendGrid in your contact API route

### Option C: Mailgun

1. Sign up at [Mailgun](https://www.mailgun.com)
2. Get your API key and domain
3. Add `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` to environment variables
4. Install package: `npm install mailgun.js`
5. Use Mailgun in your contact API route

### Option D: Nodemailer (SMTP)

For Gmail or other SMTP services:

1. Create an app password in your email provider
2. Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` to environment variables
3. Install package: `npm install nodemailer`
4. Use Nodemailer in your contact API route

## Step 6: Optional - Setup Cloudflare D1 Database

To store contact form submissions:

1. In Cloudflare Dashboard, go to **D1** → **Create database**
2. Name it something like `portfolio-db`
3. Create the following table:

```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

4. Get your Database ID from the database overview
5. Update `wrangler.toml` with your D1 binding
6. Uncomment the D1 code in `app/api/contact/route.ts`

## Step 7: Deploy

### Automatic Deployment
- Push changes to your GitHub repository
- Cloudflare Pages automatically builds and deploys

### Manual Deployment with Wrangler

```bash
# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages deploy .next

# Deploy as Worker (if using serverless functions)
wrangler deploy
```

## Step 8: Configure Custom Domain

1. In Cloudflare Pages, go to **Custom domains**
2. Add your domain
3. Follow DNS setup instructions
4. Optional: Point domain through Cloudflare nameservers for additional features

## Step 9: Setup Cloudflare Workers (Optional)

For advanced features like caching, rate limiting, or edge functions:

1. Update `wrangler.toml` with your configuration
2. Create worker scripts in `src/workers/` directory
3. Deploy with: `wrangler deploy`

Example worker for caching:

```typescript
export default {
  async fetch(request: Request) {
    const cache = caches.default;
    const cached = await cache.match(request);
    
    if (cached) return cached;
    
    const response = await fetch(request);
    const cacheable = response.status === 200;
    
    if (cacheable) {
      cache.put(request, response.clone());
    }
    
    return response;
  },
};
```

## Step 10: Monitor and Optimize

1. Check **Analytics** in Cloudflare Pages dashboard
2. View **Deployments** for build logs
3. Use **Functions** analytics to monitor API calls
4. Setup **Alerting** for errors or performance issues

## Troubleshooting

### Build Fails

- Check build logs in Cloudflare Pages dashboard
- Ensure all required environment variables are set
- Verify `npm run build` works locally: `npm run build`

### Contact Form Doesn't Send Emails

- Verify API key is correctly set in environment variables
- Check API rate limits with your email service
- Review function logs in Cloudflare dashboard
- Test locally first: `npm run dev`

### Slow Performance

- Enable Cloudflare caching rules
- Optimize images and assets
- Use Cloudflare's Page Rules for performance
- Monitor Core Web Vitals in Analytics

### Custom Domain Issues

- Verify DNS records are properly configured
- Wait 24-48 hours for DNS propagation
- Check Cloudflare nameservers are set correctly

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Enable Rate Limiting** - Prevent abuse of contact form
3. **Use HTTPS** - Cloudflare provides free SSL
4. **Validate Input** - Server-side validation is implemented
5. **Monitor Logs** - Check for suspicious activity regularly
6. **Update Dependencies** - Run `npm audit` regularly

## Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Next.js Deployment Guides](https://nextjs.org/docs/deployment)
