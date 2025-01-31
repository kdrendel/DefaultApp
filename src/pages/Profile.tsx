import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import type { Profile, ProfileChange, LoginHistory } from '../lib/types';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [changes, setChanges] = useState<ProfileChange[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadProfileChanges();
      loadLoginHistory();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      toast.error('Failed to load profile');
      return;
    }

    setProfile(data);
    reset({
      firstName: data.first_name,
      lastName: data.last_name,
      phoneNumber: data.phone_number || '',
    });
  };

  const loadProfileChanges = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profile_changes')
      .select('*')
      .eq('user_id', user.id)
      .order('change_timestamp', { ascending: false });

    if (error) {
      toast.error('Failed to load profile changes');
      return;
    }

    setChanges(data);
  };

  const loadLoginHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', user.id)
      .order('login_timestamp', { ascending: false });

    if (error) {
      toast.error('Failed to load login history');
      return;
    }

    setLoginHistory(data);
  };

  const recordProfileChange = async (fieldName: string, oldValue: string | null, newValue: string | null) => {
    if (!user) return;

    const { error } = await supabase
      .from('profile_changes')
      .insert({
        user_id: user.id,
        field_changed: fieldName,
        old_value: oldValue,
        new_value: newValue,
        changed_by: user.id
      });

    if (error) {
      console.error('Failed to record profile change:', error);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!user || !profile) return;

    try {
      // Record changes before updating
      if (data.firstName !== profile.first_name) {
        await recordProfileChange('first_name', profile.first_name, data.firstName);
      }
      if (data.lastName !== profile.last_name) {
        await recordProfileChange('last_name', profile.last_name, data.lastName);
      }
      if (data.phoneNumber !== profile.phone_number) {
        await recordProfileChange('phone_number', profile.phone_number || null, data.phoneNumber || null);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone_number: data.phoneNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      await loadProfile();
      await loadProfileChanges();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Profile Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <div className="mt-1">
                  <input
                    {...register('firstName')}
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <div className="mt-1">
                  <input
                    {...register('lastName')}
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone number (optional)
              </label>
              <div className="mt-1">
                <input
                  {...register('phoneNumber')}
                  type="tel"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Profile Changes History */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Change History</h3>
          {changes.length > 0 ? (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Field</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Old Value</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">New Value</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Changed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {changes.map((change) => (
                    <tr key={change.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">{change.field_changed}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{change.old_value || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{change.new_value || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(change.change_timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No profile changes recorded yet.</p>
          )}
        </div>

        {/* Login History */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Login History</h3>
          {loginHistory.length > 0 ? (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Date & Time</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">IP Address</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Device Info</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loginHistory.map((login) => (
                    <tr key={login.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                        {new Date(login.login_timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{login.ip_address}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{login.device_info}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          login.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {login.success ? 'Success' : 'Failed'}
                        </span>
                        {!login.success && login.failure_reason && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({login.failure_reason})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No login history recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}