import { ShieldCheckIcon, UserIcon } from 'lucide-react';
import { useState } from 'react';
import { AccountTabButton } from './_components/account-tab-button';
import { PermissionsTab } from './_components/permissions-tab';
import { ProfileSection } from './_components/profile-section';
import { SecuritySection } from './_components/security-section';

export default function SettingsAccountPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
      <div>
        <h1 className="text-base font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your profile, security, and permissions
        </p>
      </div>

      <nav className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        <AccountTabButton
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          icon={UserIcon}
          label="Profile & Security"
        />
        <AccountTabButton
          active={activeTab === 'permissions'}
          onClick={() => setActiveTab('permissions')}
          icon={ShieldCheckIcon}
          label="Permissions"
        />
      </nav>

      <div>
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <ProfileSection />
            <SecuritySection />
          </div>
        )}
        {activeTab === 'permissions' && <PermissionsTab />}
      </div>
    </div>
  );
}
