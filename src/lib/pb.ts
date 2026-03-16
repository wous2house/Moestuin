/// <reference types="vite/client" />
import PocketBase from 'pocketbase';

// URL van je PocketBase VPS (database en authenticatie)
const PB_URL = import.meta.env.VITE_PB_URL || 'https://db.jthv.nl';

export const pb = new PocketBase(PB_URL);

// Auto-cancel dubbele requests uitzetten voor stabiliteit bij snelle acties (zoals klikken in het grid)
pb.autoCancellation(false);