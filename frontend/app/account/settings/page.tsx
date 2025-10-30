'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  location: z.string().max(100, 'Location must be at most 100 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, loading, updateUser, uploadAvatar } = useAuth();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }

    if (user) {
      setValue('username', user.username);
      setValue('email', user.email);
      setValue('bio', user.bio || '');
      setValue('website', user.website || '');
      setValue('location', user.location || '');

      const avatarUrl = user.avatar?.url;
      if (avatarUrl) {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
        setAvatarPreview(`${strapiUrl}${avatarUrl}`);
      }
    }
  }, [user, loading, router, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(false);
      
      await updateUser(data);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 上传
    try {
      setIsUpdating(true);
      setError(null);
      await uploadAvatar(file);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      // 恢复原头像
      if (user?.avatar?.url) {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
        setAvatarPreview(`${strapiUrl}${user.avatar.url}`);
      } else {
        setAvatarPreview(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account settings and profile</p>
        </div>

        {/* Settings Form */}
        <div className="bg-[#111] border border-gray-800 rounded-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400 text-sm">Profile updated successfully!</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">Profile Picture</label>
              <div className="flex items-center gap-6">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-700">
                    <span className="text-white text-3xl font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Change Avatar
                  </button>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                id="username"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isUpdating}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isUpdating}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                {...register('bio')}
                id="bio"
                rows={4}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Tell us about yourself..."
                disabled={isUpdating}
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <input
                {...register('website')}
                type="url"
                id="website"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://example.com"
                disabled={isUpdating}
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-400">{errors.website.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                {...register('location')}
                type="text"
                id="location"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="San Francisco, CA"
                disabled={isUpdating}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-400">{errors.location.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
