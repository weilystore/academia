/**
 * WhatsApp Media Management Service
 * Downloads, caches, and serves media (images, documents, audio, videos) from Meta WhatsApp Cloud API.
 * Academia de Aduanas
 */

import fs from 'fs';
import path from 'path';
import { getMetaConfig, META_GRAPH_BASE_URL } from './whatsappApi';

const MEDIA_DIR = path.resolve(process.cwd(), 'data', 'media');

// Ensure media directory exists
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

export interface MediaInfo {
  mediaId: string;
  filePath: string;
  mimeType: string;
  fileSize?: number;
  fileName?: string;
  cached: boolean;
}

/**
 * Derives a clean file extension from mime type
 */
function getExtensionFromMime(mimeType: string): string {
  if (!mimeType) return '.bin';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg';
  if (mimeType.includes('png')) return '.png';
  if (mimeType.includes('webp')) return '.webp';
  if (mimeType.includes('pdf')) return '.pdf';
  if (mimeType.includes('ogg')) return '.ogg';
  if (mimeType.includes('mp4')) return '.mp4';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return '.mp3';
  return '.bin';
}

class WhatsAppMediaService {
  /**
   * Retrieves media from local cache or fetches it from Meta Cloud API
   */
  async getMedia(mediaId: string): Promise<MediaInfo | null> {
    if (!mediaId || typeof mediaId !== 'string') {
      return null;
    }

    const cleanId = mediaId.trim();
    const metaFilePath = path.join(MEDIA_DIR, `${cleanId}.meta.json`);

    // 1. Check local cache
    if (fs.existsSync(metaFilePath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaFilePath, 'utf-8'));
        const binaryPath = path.join(MEDIA_DIR, `${cleanId}${meta.extension || '.jpg'}`);
        if (fs.existsSync(binaryPath)) {
          const stats = fs.statSync(binaryPath);
          return {
            mediaId: cleanId,
            filePath: binaryPath,
            mimeType: meta.mimeType || 'image/jpeg',
            fileSize: stats.size,
            fileName: meta.fileName || `whatsapp-media-${cleanId}${meta.extension || '.jpg'}`,
            cached: true
          };
        }
      } catch (err) {
        console.warn(`[WhatsApp Media] Cache read error for ${cleanId}, re-fetching:`, err);
      }
    }

    // 2. Fetch from Meta Graph API
    const { accessToken } = getMetaConfig();
    if (!accessToken) {
      console.warn(`[WhatsApp Media] Cannot fetch media ${cleanId}: META_ACCESS_TOKEN is missing`);
      return null;
    }

    try {
      console.log(`[WhatsApp Media] Requesting metadata for mediaId ${cleanId} from Meta...`);
      const metaUrl = `${META_GRAPH_BASE_URL}/${cleanId}`;
      const metaResp = await fetch(metaUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!metaResp.ok) {
        const errorText = await metaResp.text();
        console.error(`[WhatsApp Media] Meta API error fetching media ${cleanId} (${metaResp.status}):`, errorText);
        return null;
      }

      const metaData = await metaResp.json();
      const downloadUrl = metaData.url;
      const mimeType = metaData.mime_type || 'image/jpeg';
      const extension = getExtensionFromMime(mimeType);

      if (!downloadUrl) {
        console.error(`[WhatsApp Media] No download URL returned by Meta for media ${cleanId}`);
        return null;
      }

      console.log(`[WhatsApp Media] Downloading binary media from Meta lookaside URL for ${cleanId} (${mimeType})...`);
      const binaryResp = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'curl/7.68.0'
        }
      });

      if (!binaryResp.ok) {
        const errText = await binaryResp.text();
        console.error(`[WhatsApp Media] Error downloading binary for ${cleanId} (${binaryResp.status}):`, errText);
        return null;
      }

      const buffer = Buffer.from(await binaryResp.arrayBuffer());
      const binaryPath = path.join(MEDIA_DIR, `${cleanId}${extension}`);

      fs.writeFileSync(binaryPath, buffer);
      fs.writeFileSync(metaFilePath, JSON.stringify({
        mediaId: cleanId,
        mimeType,
        extension,
        fileSize: buffer.length,
        downloadedAt: new Date().toISOString()
      }, null, 2));

      console.log(`[WhatsApp Media] Successfully downloaded and cached media ${cleanId} (${buffer.length} bytes) to ${binaryPath}`);

      return {
        mediaId: cleanId,
        filePath: binaryPath,
        mimeType,
        fileSize: buffer.length,
        fileName: `whatsapp-media-${cleanId}${extension}`,
        cached: false
      };
    } catch (err: any) {
      console.error(`[WhatsApp Media] Failed to retrieve media ${cleanId}:`, err?.message || err);
      return null;
    }
  }

  /**
   * Pre-downloads media in the background (fire-and-forget)
   */
  preloadMedia(mediaId: string): void {
    if (!mediaId) return;
    this.getMedia(mediaId).catch(err => {
      console.warn(`[WhatsApp Media] Background preload failed for ${mediaId}:`, err?.message || err);
    });
  }
}

export const whatsappMediaService = new WhatsAppMediaService();
