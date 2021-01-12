<<<<<<< Updated upstream:client/src/app/+my-account/my-account-video-playlists/my-account-video-playlist-edit.ts
import { FormReactive } from '@app/shared'
=======
import { FormReactive, SelectChannelItem } from '@app/shared/shared-forms'
import { VideoConstant, VideoPlaylistPrivacy } from '@shared/models'
>>>>>>> Stashed changes:client/src/app/+my-library/my-video-playlists/my-video-playlist-edit.ts
import { VideoPlaylist } from '@shared/models/videos/playlist/video-playlist.model'
import { VideoConstant, VideoPlaylistPrivacy } from '@shared/models'

export abstract class MyVideoPlaylistEdit extends FormReactive {
  // Declare it here to avoid errors in create template
  videoPlaylistToUpdate: VideoPlaylist
  userVideoChannels: SelectChannelItem[] = []
  videoPlaylistPrivacies: VideoConstant<VideoPlaylistPrivacy>[] = []

  abstract isCreation (): boolean
  abstract getFormButtonTitle (): string
}
