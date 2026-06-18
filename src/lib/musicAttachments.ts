import type { MusicTrack } from '../types';

export function hasPlannerMusicAttachment(track?: MusicTrack): boolean {
  return Boolean(track?.attachment?.source === 'planner_upload' && (track.filePath || track.dataUrl));
}

export function attachmentStorageValue(track?: MusicTrack): string | undefined {
  if (!hasPlannerMusicAttachment(track)) return undefined;
  return track?.dataUrl ?? track?.filePath;
}

export function createPlannerMusicAttachment(file: File): NonNullable<MusicTrack['attachment']> {
  return {
    source: 'planner_upload',
    originalName: file.name,
    mimeType: file.type || 'audio/*',
    sizeBytes: file.size,
    attachedAt: new Date().toISOString(),
  };
}

export function migrateLegacyMusicAttachment(track: MusicTrack): MusicTrack {
  if (track.attachment || (!track.filePath && !track.dataUrl)) return track;
  const path = track.filePath ?? '';
  const inferredName = path.split(/[\\/]/).pop() || `${track.title || 'musica'}.audio`;
  return {
    ...track,
    attachment: {
      source: 'planner_upload',
      originalName: inferredName,
      mimeType: 'audio/*',
      sizeBytes: 0,
      attachedAt: new Date(0).toISOString(),
    },
  };
}
