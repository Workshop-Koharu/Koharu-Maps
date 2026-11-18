import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider.toLowerCase();
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || 'https://map.koharu.live';
  const redirectUri = `${origin}/api/auth/social/callback/${provider}`;

  let authUrl = '';

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ status: 'error', message: 'Google Client ID가 설정되지 않았습니다 (.env 확인).' }, { status: 500 });
    }
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
  } else if (provider === 'discord') {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ status: 'error', message: 'Discord Client ID가 설정되지 않았습니다 (.env 확인).' }, { status: 500 });
    }
    authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email`;
  } else if (provider === 'github') {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ status: 'error', message: 'GitHub Client ID가 설정되지 않았습니다 (.env 확인).' }, { status: 500 });
    }
    authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  } else {
    return NextResponse.json({ status: 'error', message: `지원하지 않는 소셜 로그인 제공자: ${provider}` }, { status: 400 });
  }

  return NextResponse.json({ status: 'success', authUrl });
}
