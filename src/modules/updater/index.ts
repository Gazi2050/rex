// ponytail: updates disabled until the website + release endpoint exist;
// flip to true (and update endpoints in useUpdater.ts / tauri.conf.json) to re-enable.
export const UPDATES_ENABLED = false;

export { UpdaterDialog } from "./UpdaterDialog";
export { useUpdater } from "./useUpdater";
