/**
 * 声音状态管理 (Zustand)
 *
 * 管理当前活跃声音、家庭声音列表、声音切换逻辑。
 */
import { create } from 'zustand';

interface VoiceProfile {
  voiceId: string;
  voiceName: string;
  voiceRole: 'mother' | 'father' | 'grandma' | 'grandpa';
  status: string;
  isDefault: boolean;
}

interface VoiceState {
  // 家庭声音列表
  familyVoices: VoiceProfile[];
  // 当前活跃声音ID
  activeVoiceId: string | null;
  // 当前活跃角色
  activeRole: string | null;

  // Actions
  setFamilyVoices: (voices: VoiceProfile[]) => void;
  switchVoice: (voiceId: string) => void;
  setActiveRole: (role: string) => void;
  getActiveVoice: () => VoiceProfile | null;
  getVoicesByRole: (role: string) => VoiceProfile[];
  getDefaultVoice: () => VoiceProfile | null;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  familyVoices: [],
  activeVoiceId: null,
  activeRole: null,

  setFamilyVoices: (voices) => {
    const defaultVoice = voices.find((v) => v.isDefault);
    set({
      familyVoices: voices,
      activeVoiceId: get().activeVoiceId || defaultVoice?.voiceId || voices[0]?.voiceId || null,
      activeRole: get().activeRole || defaultVoice?.voiceRole || voices[0]?.voiceRole || null,
    });
  },

  switchVoice: (voiceId) => {
    const voice = get().familyVoices.find((v) => v.voiceId === voiceId);
    if (voice) {
      set({
        activeVoiceId: voiceId,
        activeRole: voice.voiceRole,
      });
    }
  },

  setActiveRole: (role) => {
    const voices = get().familyVoices.filter((v) => v.voiceRole === role);
    if (voices.length > 0) {
      set({
        activeRole: role,
        activeVoiceId: voices[0].voiceId,
      });
    }
  },

  getActiveVoice: () => {
    const { familyVoices, activeVoiceId } = get();
    return familyVoices.find((v) => v.voiceId === activeVoiceId) || null;
  },

  getVoicesByRole: (role) => {
    return get().familyVoices.filter((v) => v.voiceRole === role);
  },

  getDefaultVoice: () => {
    return get().familyVoices.find((v) => v.isDefault) || null;
  },
}));
