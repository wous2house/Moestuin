/// <reference types="vite/client" />
import PocketBase from 'pocketbase';

// URL van je PocketBase VPS (bijv. https://api.jouw-moestuin-domein.nl)
// Vervang dit zodra je VPS live staat!
const PB_URL = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(PB_URL);

// Optioneel: Auto-cancel dubbele requests aan of uit (standaard aan)
pb.autoCancellation(false);