import { NextRequest, NextResponse } from 'next/server'

// Basic validation function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateFormData(data: unknown) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const { name, email, subject, message } = data as Record<string, unknown>

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' }
  }

  if (!email || typeof email !== 'string' || !validateEmail(email)) {
    return { valid: false, error: 'Valid email is required' }
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    return { valid: false, error: 'Subject is required' }
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'Message is required' }
  }

  return { valid: true, data: { name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() } }
}

export async function POST(request: NextRequest) {
  // Check for API key (optional - for basic security)
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.CONTACT_API_KEY

  // If API key is configured, require it
  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = validateFormData(body)

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, email, subject, message } = validation.data!

    // TODO: Implement email sending via your preferred service
    // Options:
    // 1. Resend (recommended) - npm install resend
    // 2. SendGrid - requires SENDGRID_API_KEY
    // 3. Mailgun - requires MAILGUN_API_KEY
    // 4. AWS SES - requires AWS credentials
    // 5. Nodemailer - requires SMTP credentials

    // Example with Resend (uncomment and configure when ready):
    /*
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.CONTACT_EMAIL || 'your.email@example.com',
      replyTo: email,
      subject: `New Portfolio Contact: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });
    */

    // Placeholder: Log the contact form data
    console.log('[Contact Form]', { name, email, subject, message, timestamp: new Date().toISOString() })

    // TODO: Store in database (optional)
    // Example with Supabase:
    /*
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('contacts').insert({
      name,
      email,
      subject,
      message,
      created_at: new Date().toISOString()
    });
    */

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message. I will get back to you soon!',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)

    return NextResponse.json(
      {
        error: 'Failed to process your request. Please try again later.',
      },
      { status: 500 }
    )
  }
}

// Optional: Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
