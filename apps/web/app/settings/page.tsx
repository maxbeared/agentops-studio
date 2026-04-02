'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Bot, Plus, Edit2, Trash2, Check, Camera } from 'lucide-react';
import { useTranslation } from '../../contexts/locale-context';
import { AuthCheck } from '../../components/auth-check';
import { PageHeader, Card, Button, EmptyState, RevealSection } from '../../components/ui';
import { AvatarUpload } from '../../components/avatar-upload';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/auth-context';

type Tab = 'profile' | 'aiModels';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <AuthCheck>
      <main className="bg-zinc-950 px-6 py-6 text-white">
        <div className="mx-auto max-w-4xl">
          <RevealSection>
            <PageHeader
              title={t('settings.title')}
              subtitle={t('settings.subtitle')}
            />
          </RevealSection>

          {/* Tabs */}
          <RevealSection delay={50}>
            <div className="mb-6 flex gap-2 border-b border-zinc-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-base font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                <User className="h-4 w-4" />
                {t('settings.tabs.profile')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('aiModels')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-base font-medium transition-all ${
                  activeTab === 'aiModels'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                <Bot className="h-4 w-4" />
                {t('settings.tabs.aiModels')}
              </button>
            </div>
          </RevealSection>

          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'aiModels' && <AIModelsTab />}
        </div>
      </main>
    </AuthCheck>
  );
}

function ProfileTab() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string }) => {
      return api.auth.updateProfile(data);
    },
    onSuccess: async () => {
      setSuccessMsg(t('settings.profile.profileUpdated'));
      setErrorMsg('');
      await refreshUser();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      setSuccessMsg('');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (data: { avatar: string }) => {
      return api.auth.uploadAvatar(data);
    },
    onSuccess: async () => {
      setShowAvatarUpload(false);
      setSuccessMsg(t('settings.profile.profileUpdated'));
      setErrorMsg('');
      await refreshUser();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      setSuccessMsg('');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return api.auth.updatePassword(data);
    },
    onSuccess: () => {
      setSuccessMsg(t('settings.profile.passwordUpdated'));
      setErrorMsg('');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      setSuccessMsg('');
    },
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: formData.name,
    });
  };

  const handleAvatarUpload = async (avatarDataUrl: string) => {
    uploadAvatarMutation.mutate({ avatar: avatarDataUrl });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMsg(t('settings.profile.passwordMismatch'));
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  return (
    <RevealSection delay={100}>
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {successMsg && (
          <Card className="p-4 border-emerald-500/30 bg-emerald-500/10" glow glowColor="#69f0ae">
            <p className="text-emerald-300">{successMsg}</p>
          </Card>
        )}
        {errorMsg && (
          <Card className="p-4 border-red-500/30 bg-red-500/10" glow glowColor="#ff4081">
            <p className="text-red-300">{errorMsg}</p>
          </Card>
        )}

        {/* Profile Form */}
        <Card className="p-6" glow glowColor="#00e5ff">
          <h2 className="mb-4 text-lg font-medium text-zinc-100">{t('settings.profile.title')}</h2>
          <p className="mb-6 text-base text-zinc-400">{t('settings.profile.subtitle')}</p>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-base text-zinc-400 mb-1">{t('settings.profile.email')}</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-500 cursor-not-allowed"
              />
              <p className="mt-1 text-base text-zinc-500">{t('settings.profile.emailReadOnly')}</p>
            </div>
            <div>
              <label className="block text-base text-zinc-400 mb-1">{t('settings.profile.name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('settings.profile.namePlaceholder')}
                className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="flex flex-col items-center gap-4">
              <label className="block text-base text-zinc-400 self-start">{t('settings.profile.avatar')}</label>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="h-28 w-28 rounded-full object-cover border-2 border-zinc-600"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-600">
                  <User className="h-14 w-14 text-zinc-500" />
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                icon={<Camera className="h-4 w-4" />}
                onClick={() => setShowAvatarUpload(true)}
              >
                {t('settings.profile.changeAvatar')}
              </Button>
            </div>

            {showAvatarUpload && (
              <Card className="p-4 border-cyan-500/30" glow glowColor="#00e5ff">
                <AvatarUpload
                  currentAvatar={user?.avatarUrl}
                  onUpload={handleAvatarUpload}
                  onCancel={() => setShowAvatarUpload(false)}
                />
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button type="submit" variant="primary" loading={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? t('settings.profile.updating') : t('settings.profile.updateProfile')}
              </Button>
            </div>
          </form>
        </Card>

        {/* Password Form */}
        <Card className="p-6" glow glowColor="#00e5ff">
          <h2 className="mb-4 text-lg font-medium text-zinc-100">{t('settings.profile.changePassword')}</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-base text-zinc-400 mb-1">{t('settings.profile.currentPassword')}</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder={t('settings.profile.currentPasswordPlaceholder')}
                required
                className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-base text-zinc-400 mb-1">{t('settings.profile.newPassword')}</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder={t('settings.profile.newPasswordPlaceholder')}
                required
                minLength={6}
                className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-base text-zinc-400 mb-1">{t('settings.profile.confirmPassword')}</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder={t('settings.profile.confirmPasswordPlaceholder')}
                required
                minLength={6}
                className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={updatePasswordMutation.isPending}>
                {updatePasswordMutation.isPending ? t('settings.profile.updating') : t('settings.profile.changePassword')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </RevealSection>
  );
}

function AIModelsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['aiModels'],
    queryFn: () => api.aiModels.list(),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai' as 'openai' | 'anthropic' | 'custom',
    apiEndpoint: '',
    apiKey: '',
    defaultModel: '',
    isDefault: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.aiModels.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiModels'] });
      setShowCreate(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => api.aiModels.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiModels'] });
      setShowEdit(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.aiModels.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiModels'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'openai',
      apiEndpoint: '',
      apiKey: '',
      defaultModel: '',
      isDefault: false,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      name: formData.name,
      provider: formData.provider,
      defaultModel: formData.defaultModel,
      isDefault: formData.isDefault,
    };
    if (formData.apiEndpoint) submitData.apiEndpoint = formData.apiEndpoint;
    if (formData.apiKey) submitData.apiKey = formData.apiKey;
    createMutation.mutate(submitData);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    const submitData: any = {
      name: formData.name,
      provider: formData.provider,
      defaultModel: formData.defaultModel,
      isDefault: formData.isDefault,
    };
    if (formData.apiEndpoint) submitData.apiEndpoint = formData.apiEndpoint;
    if (formData.apiKey) submitData.apiKey = formData.apiKey;
    updateMutation.mutate({ id: showEdit.id, data: submitData });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('settings.aiModels.deleteConfirm'))) return;
    deleteMutation.mutate(id);
  };

  const openEdit = (model: any) => {
    setShowEdit(model);
    setFormData({
      name: model.name,
      provider: model.provider,
      apiEndpoint: model.apiEndpoint || '',
      apiKey: '', // Don't prefill API key for security
      defaultModel: model.defaultModel,
      isDefault: model.isDefault,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <span className="ml-3 text-zinc-400">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <RevealSection delay={100}>
      <div className="space-y-6">
        <RevealSection>
          <PageHeader
            title={t('settings.aiModels.title')}
            subtitle={t('settings.aiModels.subtitle')}
            action={
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                {t('settings.aiModels.addModel')}
              </Button>
            }
          />
        </RevealSection>

        {/* Create/Edit Form */}
        {(showCreate || showEdit) && (
          <RevealSection>
            <Card className="p-6" glow glowColor="#00e5ff">
              <h2 className="mb-4 text-lg font-medium text-zinc-100">
                {showEdit ? t('settings.aiModels.editModel') : t('settings.aiModels.addModel')}
              </h2>
              <form onSubmit={showEdit ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-base text-zinc-400 mb-1">{t('settings.aiModels.name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('settings.aiModels.namePlaceholder')}
                    required
                    className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-base text-zinc-400 mb-1">{t('settings.aiModels.provider')}</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                    className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="openai">{t('settings.aiModels.openai')}</option>
                    <option value="anthropic">{t('settings.aiModels.anthropic')}</option>
                    <option value="custom">{t('settings.aiModels.custom')}</option>
                  </select>
                  <p className="mt-1 text-base text-zinc-500">
                    {formData.provider === 'openai' && t('settings.aiModels.providerOpenAI')}
                    {formData.provider === 'anthropic' && t('settings.aiModels.providerAnthropic')}
                    {formData.provider === 'custom' && t('settings.aiModels.providerCustom')}
                  </p>
                </div>
                <div>
                  <label className="block text-base text-zinc-400 mb-1">{t('settings.aiModels.apiEndpoint')}</label>
                  <input
                    type="url"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                    placeholder={t('settings.aiModels.apiEndpointPlaceholder')}
                    className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-base text-zinc-400 mb-1">{t('settings.aiModels.apiKey')}</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder={t('settings.aiModels.apiKeyPlaceholder')}
                    className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <p className="mt-1 text-base text-zinc-500">{t('settings.aiModels.apiKeyHint')}</p>
                </div>
                <div>
                  <label className="block text-base text-zinc-400 mb-1">{t('settings.aiModels.defaultModel')}</label>
                  <input
                    type="text"
                    value={formData.defaultModel}
                    onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                    placeholder={t('settings.aiModels.defaultModelPlaceholder')}
                    required
                    className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <label htmlFor="isDefault" className="text-base text-zinc-300">
                    {t('settings.aiModels.setAsDefault')}
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" loading={createMutation.isPending || updateMutation.isPending}>
                    {showEdit ? t('settings.aiModels.update') : t('settings.aiModels.create')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCreate(false);
                      setShowEdit(null);
                      resetForm();
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </Card>
          </RevealSection>
        )}

        {/* Model List */}
        <RevealSection delay={100}>
          <Card className="p-6">
            {models.length === 0 ? (
              <EmptyState
                icon={<Bot className="h-10 w-10 text-zinc-600" />}
                title={t('settings.aiModels.noConfigs')}
                description={t('settings.aiModels.addFirst')}
                action={
                  <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                    {t('settings.aiModels.addModel')}
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {models.map((model: any) => (
                  <div
                    key={model.id}
                    className="group rounded-xl border-2 border-zinc-600/80 bg-zinc-950/70 p-4 transition-all hover:border-cyan-500/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-zinc-100">{model.name}</h3>
                          {model.isDefault && (
                            <span className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">
                              <Check className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-base text-zinc-400">
                          <span className="rounded bg-zinc-800 px-2 py-0.5">
                            {model.provider === 'openai' && t('settings.aiModels.openai')}
                            {model.provider === 'anthropic' && t('settings.aiModels.anthropic')}
                            {model.provider === 'custom' && t('settings.aiModels.custom')}
                          </span>
                          <span className="rounded bg-zinc-800 px-2 py-0.5">{model.defaultModel}</span>
                        </div>
                        {model.apiEndpoint && (
                          <p className="mt-2 text-base text-zinc-500 truncate max-w-md">{model.apiEndpoint}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 ml-4">
                        <button
                          type="button"
                          onClick={() => openEdit(model)}
                          className="rounded p-1.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-cyan-400"
                          title={t('common.edit')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(model.id)}
                          className="rounded p-1.5 text-red-400 transition-all hover:bg-red-500/20"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </RevealSection>
      </div>
    </RevealSection>
  );
}