/**
 * Cloudflare Pages Function untuk mengirim email menggunakan API Resend.
 * Ini otomatis dipanggil oleh Cloudflare ketika endpoint /api/send-email diakses.
 */

interface Env {
  RESEND_API_KEY: string;
}

export async function onRequestPost(context: EventContext<Env, any, any>) {
  try {
    const { request, env } = context;
    const body = await request.json() as { to: string; subject: string; html: string };
    const { to, subject, html } = body;

    if (!env.RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured in Cloudflare Pages' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Portal Skor <noreply@portalskor.net>',
        to: to,
        subject: subject,
        html: html
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
     return new Response(JSON.stringify({ error: data }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
