/**
 * Dynamic Settings Keys
 * Keys used with SettingsService for database-backed settings (overridable by env)
 */
export const SettingKeys = {
  MAIL_SENDING_ENABLED: 'MAIL_SENDING_ENABLED',
} as const;

export type SettingKeyType = (typeof SettingKeys)[keyof typeof SettingKeys];
