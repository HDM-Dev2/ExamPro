import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlatform } from '../context/PlatformContext';
import * as platformApi from '../api/platformSettingsApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const PlatformSettingsPage = () => {
  const { isHiddenAdmin } = useAuth();
  const { refresh, setLocal } = usePlatform();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!isHiddenAdmin) {
      window.location.href = '/';
      return;
    }
    load();
  }, [isHiddenAdmin]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await platformApi.getPlatformSettings();
      setForm(data);
    } catch (error) {
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await platformApi.updatePlatformSettings(form);
      setForm(updated);
      setLocal(updated);
      toast.success('Platform settings saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, logo: reader.result });
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, favicon: reader.result });
    reader.readAsDataURL(file);
  };

  if (loading || !form) return <Spinner size="lg" className="py-20" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-1">Global app configuration</p>
        </div>
        <Button onClick={handleSave} isLoading={saving}>Save All</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="App Identity">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {form.logo ? (
                  <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No logo</span>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Upload Logo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <Input label="App Name" value={form.appName || ''} onChange={(e) => setForm({ ...form, appName: e.target.value })} />
            <Input label="Tagline" value={form.appTagline || ''} onChange={(e) => setForm({ ...form, appTagline: e.target.value })} />
            <Input label="Footer Text" value={form.footerText || ''} onChange={(e) => setForm({ ...form, footerText: e.target.value })} placeholder="© 2026 ExamPro" />
          </div>
        </Card>

        <Card title="Support & Contact">
          <div className="space-y-4">
            <Input label="Support Email" value={form.supportEmail || ''} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
            <Input label="Support Phone" value={form.supportPhone || ''} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} />
            <Input label="WhatsApp" value={form.supportWhatsapp || ''} onChange={(e) => setForm({ ...form, supportWhatsapp: e.target.value })} placeholder="+254..." />
            <Input label="Help URL" value={form.supportUrl || ''} onChange={(e) => setForm({ ...form, supportUrl: e.target.value })} />
          </div>
        </Card>

        <Card title="Registration & Access">
          <div className="space-y-4">
            <Toggle
              label="Allow Self Registration"
              description="Users can create accounts that require approval"
              checked={form.allowSelfRegistration}
              onChange={(v) => setForm({ ...form, allowSelfRegistration: v })}
            />
            <Toggle
              label="Allow New Admins"
              description="Super admin can create new admin accounts"
              checked={form.allowNewAdmins}
              onChange={(v) => setForm({ ...form, allowNewAdmins: v })}
            />
          </div>
        </Card>

        <Card title="Maintenance">
          <div className="space-y-4">
            <Toggle
              label="Maintenance Mode"
              description="Temporarily disable access to the app"
              checked={form.maintenanceMode}
              onChange={(v) => setForm({ ...form, maintenanceMode: v })}
            />
            <Input
              label="Maintenance Message"
              value={form.maintenanceMessage || ''}
              onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
            />
          </div>
        </Card>

        <Card title="Legal">
          <div className="space-y-4">
            <Input label="Terms URL" value={form.termsUrl || ''} onChange={(e) => setForm({ ...form, termsUrl: e.target.value })} />
            <Input label="Privacy URL" value={form.privacyUrl || ''} onChange={(e) => setForm({ ...form, privacyUrl: e.target.value })} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-start justify-between">
    <div className="flex-1 pr-4">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  </div>
);

export default PlatformSettingsPage;