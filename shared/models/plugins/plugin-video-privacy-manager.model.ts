<<<<<<< Updated upstream
import { VideoPrivacy } from '@shared/models'
=======
import { VideoPrivacy } from '../videos/video-privacy.enum'
>>>>>>> Stashed changes

export interface PluginVideoPrivacyManager {
  // PUBLIC = 1
  // UNLISTED = 2
  // PRIVATE = 3
  // INTERNAL = 4
  deletePrivacy: (privacyKey: VideoPrivacy) => boolean
}
