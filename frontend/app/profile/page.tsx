'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const avatarUrl = user.avatar?.url;
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  const fullAvatarUrl = avatarUrl ? `${strapiUrl}${avatarUrl}` : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-gray-400 mt-2">View and manage your profile</p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#111] border border-gray-800 rounded-lg overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              {fullAvatarUrl ? (
                <img
                  src={fullAvatarUrl}
                  alt={user.username}
                  className="w-32 h-32 rounded-full border-4 border-[#111] object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-[#111] bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                  <p className="text-gray-400">{user.email}</p>
                </div>
                <Link
                  href="/account/settings"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Edit Profile
                </Link>
              </div>

              {user.bio && (
                <p className="text-gray-300 mb-4">{user.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {user.location && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{user.location}</span>
                  </div>
                )}

                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>{user.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Likes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-[#111] border border-gray-800 rounded-lg p-8">
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
