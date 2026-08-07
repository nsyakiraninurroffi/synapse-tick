import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// =============================================
//  TICKETFLOW — NEXTAUTH CONFIGURATION
//  Providers: Google, Facebook, TikTok (custom)
// =============================================

// Custom TikTok OAuth Provider
const TikTokProvider = {
  id: 'tiktok',
  name: 'TikTok',
  type: 'oauth' as const,
  clientId: process.env.TIKTOK_CLIENT_ID!,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
  authorization: {
    url: 'https://www.tiktok.com/v2/auth/authorize',
    params: {
      scope: 'user.info.basic',
      response_type: 'code',
    },
  },
  token: 'https://open.tiktokapis.com/v2/oauth/token/',
  userinfo: {
    url: 'https://open.tiktokapis.com/v2/user/info/',
    async request({ tokens, provider }: any) {
      const response = await fetch(
        `https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );
      const data = await response.json();
      return {
        id: data.data?.user?.open_id,
        name: data.data?.user?.display_name,
        image: data.data?.user?.avatar_url,
        email: `${data.data?.user?.open_id}@tiktok.user`, // TikTok doesn't share email
      };
    },
  },
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.name,
      image: profile.image,
      email: profile.email,
    };
  },
};

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    // TikTok: Uncomment after getting TikTok Developer App approval
    // TikTokProvider,
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    // After OAuth sign-in, sync user with TicketFlow backend DB
    async signIn({ user, account, profile }) {
      if (account?.provider && user.email) {
        try {
          const res = await axios.post(`${API_URL}/auth/social-login`, {
            provider: account.provider,
            providerId: account.providerAccountId,
            email: user.email,
            nama: user.name || user.email?.split('@')[0],
            avatar: user.image,
          });

          if (res.data?.success) {
            // Attach our backend JWT to user object
            (user as any).backendToken = res.data.data.token;
            (user as any).backendUser = res.data.data.user;
            return true;
          }
          return false;
        } catch (error) {
          console.error('[NextAuth] Backend social login sync failed:', error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // On first sign-in, persist backend data into JWT
      if (user && (user as any).backendToken) {
        token.backendToken = (user as any).backendToken;
        token.backendUser = (user as any).backendUser;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose backend data to the client session
      if (token.backendToken) {
        (session as any).backendToken = token.backendToken;
        (session as any).backendUser = token.backendUser;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
