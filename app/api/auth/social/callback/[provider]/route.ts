import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createToken, getClientConnectionInfo } from '@/lib/auth';
import { sendWelcomeEmail, sendSecurityAlertEmail } from '@/lib/email';

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider.toLowerCase();
  const code = req.nextUrl.searchParams.get('code');
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || 'https://map.koharu.live';
  const redirectUri = `${origin}/api/auth/social/callback/${provider}`;

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  try {
    let email = '';
    let name = '';
    let avatarUrl = '';
    let providerId = '';

    if (provider === 'google') {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error('Google token exchange failed');

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const uinfo = await userRes.json();
      email = uinfo.email;
      name = uinfo.name || uinfo.email.split('@')[0];
      avatarUrl = uinfo.picture || '';
      providerId = uinfo.id;
    } else if (provider === 'discord') {
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID || '',
          client_secret: process.env.DISCORD_CLIENT_SECRET || '',
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error('Discord token exchange failed');

      const userRes = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const uinfo = await userRes.json();
      email = uinfo.email;
      name = uinfo.global_name || uinfo.username;
      avatarUrl = uinfo.avatar ? `https://cdn.discordapp.com/avatars/${uinfo.id}/${uinfo.avatar}.png` : '';
      providerId = uinfo.id;
    } else if (provider === 'github') {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID || '',
          client_secret: process.env.GITHUB_CLIENT_SECRET || '',
          code,
          redirect_uri: redirectUri,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error('GitHub token exchange failed');

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const uinfo = await userRes.json();
      name = uinfo.name || uinfo.login;
      avatarUrl = uinfo.avatar_url || '';
      providerId = String(uinfo.id);

      email = uinfo.email;
      if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const emails = await emailsRes.json();
        for (const e of emails) {
          if (e.primary) {
            email = e.email;
            break;
          }
        }
      }
      if (!email) email = `github_${providerId}@koharu.live`;
    }

    if (!email) throw new Error('User email not obtained from provider');

    let user = await db.getUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await db.createUser({
        name,
        email,
        provider: provider as any,
        providerId,
        avatarUrl,
      });

      // Send Welcome Email upon new social sign-up
      await sendWelcomeEmail(user.email, user.name, provider);
    }

    // Inspect connection
    const { ip, location, userAgent } = getClientConnectionInfo(req);
    const isNewEnvironment = !isNewUser && user.lastLoginIp && (user.lastLoginIp !== ip || user.lastLoginDevice !== userAgent);

    if (isNewEnvironment) {
      await sendSecurityAlertEmail(user.email, user.name, ip, location, userAgent);
    }

    // Update login history
    await db.updateUser(user.id, {
      lastLoginIp: ip,
      lastLoginLocation: location,
      lastLoginDevice: userAgent,
      lastLoginAt: new Date().toISOString(),
      avatarUrl: avatarUrl || user.avatarUrl,
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const redirectResponse = NextResponse.redirect(`${origin}/#token=${token}`);
    redirectResponse.cookies.set('kmap_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    return redirectResponse;
  } catch (err: any) {
    console.error('Social login callback error:', err);
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(err.message || 'social_login_failed')}`);
  }
}
