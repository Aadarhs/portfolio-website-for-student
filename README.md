# Cybersecurity Portfolio

A modern, dark-themed portfolio website designed for IT and cybersecurity students. Built with Next.js, React, and Tailwind CSS, featuring a particle-animated hero section, comprehensive skill showcase, and contact form integration with Cloudflare backend support.

## Features

- **Dark Cybersecurity Theme** - Modern dark UI with neon cyan/green accent colors
- **Animated Hero Section** - Canvas-based particle background with connections
- **Smooth Navigation** - Sticky header with smooth scroll navigation
- **Skills Showcase** - Organized by categories (Network Security, Technical Skills, Tools, etc.)
- **Project Portfolio** - Grid layout for displaying security projects and lab work
- **Experience Timeline** - Visual timeline of professional experience
- **Education & Certifications** - Timeline-based education and certification tracking
- **Contact Form** - Fully functional contact form with email integration
- **Responsive Design** - Mobile-first design that works on all devices
- **Cloudflare Ready** - Optimized for deployment on Cloudflare Pages with Workers support

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, custom animations
- **Icons**: Lucide React
- **Forms**: React hooks with client-side validation
- **Deployment**: Cloudflare Pages + Cloudflare Workers
- **Database** (Optional): Cloudflare D1, Supabase, or any REST API

## Quick Start

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd cybersecurity-portfolio
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your API keys
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Configuration

### Customize Your Content

Edit these files to personalize your portfolio:

- **Skills**: `components/Skills.tsx`
- **Projects**: `components/Projects.tsx`
- **Experience**: `components/Experience.tsx`
- **Education**: `components/Education.tsx`
- **Certifications**: `components/Certifications.tsx`
- **Social Links**: `components/Hero.tsx` and `components/Contact.tsx`

### Theme Customization

Edit `app/globals.css` to modify colors:

```css
:root {
  --primary: #00d9ff;      /* Cyan accent */
  --secondary: #0ea5e9;    /* Blue accent */
  --accent: #10b981;       /* Green accent */
  --background: #0a0e27;   /* Dark background */
  --foreground: #e0e8ff;   /* Light text */
}
```

### Email Configuration

Choose your email service and follow the setup in `CLOUDFLARE_DEPLOYMENT.md`:

1. **Resend** (Recommended) - Simplest to setup
2. **SendGrid** - Enterprise-ready
3. **Mailgun** - Developer-friendly
4. **SMTP** - Use your own email service

## Deployment

### Deploy to Cloudflare Pages

1. Push your code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Select **Pages** → **Create a project**
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `.next`
6. Set environment variables (see `.env.local.example`)
7. Deploy!

For detailed instructions, see [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

## Project Structure

```
├── app/
│   ├── api/
│   │   └── contact/
│   │       └── route.ts          # Contact form API endpoint
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main portfolio page
│   └── globals.css                # Global styles & theme
├── components/
│   ├── Navigation.tsx             # Sticky header
│   ├── Hero.tsx                   # Hero section with particles
│   ├── About.tsx                  # About section
│   ├── Skills.tsx                 # Skills grid
│   ├── Projects.tsx               # Projects portfolio
│   ├── Experience.tsx             # Experience timeline
│   ├── Education.tsx              # Education timeline
│   ├── Certifications.tsx         # Certifications
│   └── Contact.tsx                # Contact form
├── wrangler.toml                  # Cloudflare configuration
├── CLOUDFLARE_DEPLOYMENT.md       # Deployment guide
└── README.md                      # This file
```

## API Routes

### POST /api/contact

Handles contact form submissions.

**Request:**
```json
{
  "name": "Your Name",
  "email": "your@email.com",
  "subject": "Subject",
  "message": "Your message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your message..."
}
```

## Building for Production

```bash
npm run build
npm run start
```

## Optimization Tips

1. **Images**: Optimize and compress before adding
2. **Fonts**: Already optimized (using system fonts)
3. **Code Splitting**: Next.js handles automatic code splitting
4. **Caching**: Configure in Cloudflare dashboard for static assets
5. **CDN**: Cloudflare Pages provides global CDN automatically

## Security Considerations

- ✅ Server-side form validation
- ✅ Input sanitization
- ✅ Environment variables for secrets
- ✅ HTTPS by default with Cloudflare
- ✅ Optional API key protection for contact form
- ⚠️ Never commit `.env.local` file
- ⚠️ Use `CONTACT_API_KEY` for additional security

## Troubleshooting

### Contact form not sending?
1. Check API key in `.env.local`
2. Verify email service configuration
3. Check browser console for errors
4. Test locally first with `npm run dev`

### Build fails?
1. Run `npm install` again
2. Check for TypeScript errors: `npm run type-check`
3. Ensure all env variables are set
4. Check build logs in Cloudflare dashboard

### Pages not updating?
1. Manually trigger rebuild in Cloudflare Pages
2. Clear browser cache (Ctrl+Shift+Del or Cmd+Shift+Del)
3. Check git branch in Cloudflare settings

## Performance Metrics

- ⚡ Fast first paint with optimized hero section
- 🎯 Smooth animations with GPU acceleration
- 📱 Mobile-optimized with responsive design
- 🔍 SEO-friendly with semantic HTML
- ♿ Accessible with ARIA labels and semantic structure

## Contributing

Feel free to customize and enhance this portfolio:

1. Add more projects
2. Implement additional animations
3. Add more sections (blog, testimonials, etc.)
4. Integrate with external services
5. Improve mobile experience

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or improvements:
1. Check existing issues on GitHub
2. Create a new issue with details
3. Submit a pull request with improvements

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cloudflare Pages Guide](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Guide](https://developers.cloudflare.com/workers/)
- [React Documentation](https://react.dev)

---

Built with ❤️ for cybersecurity enthusiasts
