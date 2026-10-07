const PlatformSettings = require('../models/PlatformSettings');

const getDefaultSettings = () => ({
  appName: 'ExamPro',
  appTagline: 'Exam Entry System',
  logo: '',
  favicon: '',
  supportEmail: 'support@exampro.com',
  supportPhone: '',
  supportWhatsapp: '',
  supportUrl: '',
  allowSelfRegistration: false,
  allowNewAdmins: true,
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
  footerText: '',
  termsUrl: '',
  privacyUrl: ''
});

const getSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne();
    
    if (!settings) {
      settings = new PlatformSettings(getDefaultSettings());
      settings.updatedBy = req.userId;
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Get platform settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const {
      appName,
      appTagline,
      logo,
      favicon,
      supportEmail,
      supportPhone,
      supportWhatsapp,
      supportUrl,
      allowSelfRegistration,
      allowNewAdmins,
      maintenanceMode,
      maintenanceMessage,
      footerText,
      termsUrl,
      privacyUrl
    } = req.body;
    
    let settings = await PlatformSettings.findOne();
    
    if (!settings) {
      settings = new PlatformSettings(getDefaultSettings());
    }
    
    if (appName !== undefined) settings.appName = appName;
    if (appTagline !== undefined) settings.appTagline = appTagline;
    if (logo !== undefined) settings.logo = logo;
    if (favicon !== undefined) settings.favicon = favicon;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (supportPhone !== undefined) settings.supportPhone = supportPhone;
    if (supportWhatsapp !== undefined) settings.supportWhatsapp = supportWhatsapp;
    if (supportUrl !== undefined) settings.supportUrl = supportUrl;
    if (allowSelfRegistration !== undefined) settings.allowSelfRegistration = allowSelfRegistration;
    if (allowNewAdmins !== undefined) settings.allowNewAdmins = allowNewAdmins;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
    if (footerText !== undefined) settings.footerText = footerText;
    if (termsUrl !== undefined) settings.termsUrl = termsUrl;
    if (privacyUrl !== undefined) settings.privacyUrl = privacyUrl;
    
    settings.updatedBy = req.userId;
    
    await settings.save();
    
    res.json(settings);
  } catch (error) {
    console.error('Update platform settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPublicSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.findOne();
    
    if (!settings) {
      return res.json(getDefaultSettings());
    }
    
    res.json({
      appName: settings.appName,
      appTagline: settings.appTagline,
      logo: settings.logo,
      favicon: settings.favicon,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      supportWhatsapp: settings.supportWhatsapp,
      supportUrl: settings.supportUrl,
      allowSelfRegistration: settings.allowSelfRegistration,
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      footerText: settings.footerText,
      termsUrl: settings.termsUrl,
      privacyUrl: settings.privacyUrl
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.json(getDefaultSettings());
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getPublicSettings
};