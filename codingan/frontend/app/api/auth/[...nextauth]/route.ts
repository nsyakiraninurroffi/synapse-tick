import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// =============================================
//  SYNAPSETICK — NEXTAUTH CONFIGURATION
//  Providers: Google, Facebook
// =============================================

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'demo-google-client-id.apps.googleusercontent.com',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-google-client-secret',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || 'demo-facebook-app-id',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'demo-facebook-app-secret',
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    // After OAuth sign-in, sync user with SynapseTick backend DB
    async signIn({ user, account }) {
      if (account?.provider && user.email) {
        try {
          const res = await axios.post(
            `${API_URL}/auth/social-login`,
            {
              provider: account.provider,
              providerId: account.providerAccountId,
              email: user.email,
              nama: user.name || user.email?.split('@')[0],
              avatar: user.image,
            },
            { timeout: 3000 } // Short 3s timeout to prevent 8s hanging
          );

          if (res.data?.success) {
            (user as any).backendToken = res.data.data.token;
            (user as any).backendUser = res.data.data.user;
            return true;
          }
          return true; // Allow login even if backend sync returns standard response
        } catch (error) {
          console.warn('[NextAuth] Backend social login sync fallback:', error);
          return true; // Fallback to avoid breaking OAuth flow
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user && (user as any).backendToken) {
        token.backendToken = (user as any).backendToken;
        token.backendUser = (user as any).backendUser;
      }
      return token;
    },

    async session({ session, token }) {
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

  secret: process.env.NEXTAUTH_SECRET || 'synapsetick-nextauth-secret-key-2026-super-secure-key',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
