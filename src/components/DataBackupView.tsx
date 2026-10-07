import React, { useState } from 'react';
import { HardDrive, Cloud, Download, Upload, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Key, HelpCircle, ExternalLink } from 'lucide-react';
import { UserFitnessProfile, WorkoutLogEntry } from '../types/fitness';
import { StorageService } from '../services/storageService';
import { GoogleDriveService } from '../services/googleDriveService';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface DataBackupViewProps {
  profile: UserFitnessProfile;
  logs: WorkoutLogEntry[];
  onDataUpdated: () => void;
  language?: Language;
}

export const DataBackupView: React.FC<DataBackupViewProps> = ({
  profile,
  logs,
  onDataUpdated,
  language = 'pt-BR'
}) => {
  const t = TRANSLATIONS[language];

  const [clientId, setClientId] = useState(profile.googleDrive.clientId || '');
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // JSON File Export
  const handleExportJSON = () => {
    StorageService.exportJSONDownload();
    setSyncStatusMessage({
      text: language === 'pt-BR'
        ? 'Backup baixado com sucesso para o seu dispositivo!'
        : 'Backup downloaded successfully to your device!',
      type: 'success'
    });
  };

  // JSON File Import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = StorageService.importFromJSON(content);
        if (result.success) {
          setSyncStatusMessage({ text: result.message, type: 'success' });
          onDataUpdated();
        } else {
          setSyncStatusMessage({ text: result.message, type: 'error' });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Google Drive Backup
  const handleDriveBackup = async () => {
    if (!clientId.trim()) {
      setSyncStatusMessage({
        text: language === 'pt-BR'
          ? 'Por favor, insira o Client ID do Google OAuth primeiro (veja o guia abaixo).'
          : 'Please enter a Google OAuth Client ID first (see setup guide below).',
        type: 'error'
      });
      return;
    }

    setIsDriveSyncing(true);
    setSyncStatusMessage({ text: t.connectingDrive, type: 'info' });

    try {
      const result = await GoogleDriveService.backupToDrive(clientId);
      if (result.success) {
        setSyncStatusMessage({ text: result.message, type: 'success' });
        onDataUpdated();
      } else {
        setSyncStatusMessage({ text: result.message, type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Drive error';
      setSyncStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Google Drive Restore
  const handleDriveRestore = async () => {
    if (!clientId.trim()) {
      setSyncStatusMessage({
        text: language === 'pt-BR'
          ? 'Por favor, insira o Client ID do Google OAuth primeiro.'
          : 'Please enter a Google OAuth Client ID first.',
        type: 'error'
      });
      return;
    }

    const confirmMsg = language === 'pt-BR'
      ? 'Restaurar do Google Drive? Isso atualizará seus treinos locais com a cópia da nuvem.'
      : 'Restore from Google Drive? This will update your local workouts with the cloud copy.';
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsDriveSyncing(true);
    setSyncStatusMessage({ text: t.connectingDrive, type: 'info' });

    try {
      const result = await GoogleDriveService.restoreFromDrive(clientId);
      if (result.success) {
        setSyncStatusMessage({ text: result.message, type: 'success' });
        onDataUpdated();
      } else {
        setSyncStatusMessage({ text: result.message, type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Drive error';
      setSyncStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleSaveClientId = () => {
    const updated = { ...profile };
    updated.googleDrive.clientId = clientId.trim();
    StorageService.saveProfile(updated);
    setSyncStatusMessage({
      text: language === 'pt-BR' ? 'Client ID salvo localmente.' : 'Client ID saved locally.',
      type: 'success'
    });
    onDataUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Privacy & 100% Local Storage Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t.privacyBannerTitle}</h2>
            <p className="text-xs text-slate-400">{t.privacyBannerSubtitle}</p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          <p className="mb-2">
            ✅ <strong>{language === 'pt-BR' ? 'Primeiro Local:' : 'Local-first:'}</strong> {t.localFirstDesc}
          </p>
          <p>
            ✅ <strong>{language === 'pt-BR' ? 'Zero Bloqueio:' : 'Zero Lock-in:'}</strong> {t.zeroLockinDesc}
          </p>
        </div>

        {/* Status message */}
        {syncStatusMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              syncStatusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : syncStatusMessage.type === 'error'
                ? 'bg-red-950/60 border-red-500/40 text-red-300'
                : 'bg-blue-950/60 border-blue-500/40 text-blue-300'
            }`}
          >
            {syncStatusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {syncStatusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {syncStatusMessage.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />}
            <span>{syncStatusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Offline JSON Backup & Restore Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-800 text-brand-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t.jsonCardTitle}</h3>
            <p className="text-xs text-slate-400">{t.jsonCardSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportJSON}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 hover:border-brand-500/50 transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-brand-400" />
            {t.exportJsonBtn}
          </button>

          <label className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 hover:border-brand-500/50 transition flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-brand-400" />
            <span>{t.restoreJsonBtn}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Google Drive Integration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/30 text-blue-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t.driveCardTitle}</h3>
              <p className="text-xs text-slate-400">
                {t.driveCardSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showSetupGuide ? t.hideGuideBtn : t.setupGuideBtn}
          </button>
        </div>

        {/* Collapsible Setup Guide */}
        {showSetupGuide && (
          <div className="mb-5 p-4 rounded-xl bg-slate-950 border border-blue-900/40 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-400" />{' '}
              {language === 'pt-BR' ? 'Como conectar seu Google Drive pessoal:' : 'How to connect your personal Google Drive:'}
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
              <li>
                {language === 'pt-BR' ? 'Acesse o ' : 'Go to the '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>{' '}
                {language === 'pt-BR' ? 'e crie um projeto gratuito (ex: "Meu Backup Fitness").' : 'and create a free project (e.g. "My Fitness Backup").'}
              </li>
              <li>
                {language === 'pt-BR' ? 'Ative a Google Drive API em APIs & Serviços.' : 'Enable the Google Drive API in APIs & Services.'}
              </li>
              <li>
                {language === 'pt-BR'
                  ? 'Vá em Credenciais → Criar Credenciais → ID do Cliente OAuth (Tipo: Aplicativo da Web).'
                  : 'Go to Credentials → Create Credentials → OAuth Client ID (Application type: Web application).'}
              </li>
              <li>
                {language === 'pt-BR'
                  ? 'Em Origens JavaScript Autorizadas, adicione a URL da sua aplicação (ex: http://localhost:5173).'
                  : 'Under Authorized JavaScript origins, add your app\'s URL (e.g. http://localhost:5173).'}
              </li>
              <li>
                {language === 'pt-BR'
                  ? 'Copie seu Client ID e cole no campo abaixo!'
                  : 'Copy your Client ID and paste it into the input below!'}
              </li>
            </ol>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              💡 {language === 'pt-BR'
                ? 'Nota de Privacidade: O app usa apenas o escopo restrito drive.file, tendo acesso apenas ao arquivo criado por ele mesmo.'
                : 'Privacy Note: The app only requests the restricted drive.file scope, meaning it can only see and edit its own backup file.'}
            </p>
          </div>
        )}

        {/* Client ID Configuration Input */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-300 block mb-1">
            {t.clientIdLabel}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 1234567890-abcdefg.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleSaveClientId}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
            >
              {t.saveKeyBtn}
            </button>
          </div>
        </div>

        {/* Drive Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDriveBackup}
            disabled={isDriveSyncing}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
          >
            <Cloud className="w-4 h-4" />
            {isDriveSyncing ? t.connectingDrive : t.backupDriveBtn}
          </button>

          <button
            onClick={handleDriveRestore}
            disabled={isDriveSyncing}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            {t.restoreDriveBtn}
          </button>
        </div>

        {profile.googleDrive.lastSyncedIso && (
          <div className="mt-3 text-[11px] text-slate-400 text-center">
            {t.lastDriveSync.replace('{time}', new Date(profile.googleDrive.lastSyncedIso).toLocaleString())}
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-red-950/60 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-red-400">{t.clearDataTitle}</h4>
          <p className="text-[11px] text-slate-500">{t.clearDataSubtitle}</p>
        </div>
        <button
          onClick={() => {
            const confirmMsg = language === 'pt-BR'
              ? 'Tem certeza de que deseja apagar todos os registros de treino locais? Certifique-se de que exportou um backup JSON antes!'
              : 'Are you sure you want to delete all local workout records? Make sure you downloaded a JSON backup first!';
            if (window.confirm(confirmMsg)) {
              StorageService.clearAllData();
              onDataUpdated();
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-[11px] font-bold text-red-300 transition"
        >
          {t.resetDataBtn}
        </button>
      </div>
    </div>
  );
};
