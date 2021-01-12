import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
<<<<<<< Updated upstream
import { immutableAssign } from '@app/shared/misc/utils'
import { AuthService } from '../../core/auth'
import { ConfirmService } from '../../core/confirm'
import { AbstractVideoList } from '../../shared/video/abstract-video-list'
import { VideoService } from '../../shared/video/video.service'
import { VideoChannelService } from '@app/shared/video-channel/video-channel.service'
import { VideoChannel } from '@app/shared/video-channel/video-channel.model'
import { first, tap } from 'rxjs/operators'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { Subscription } from 'rxjs'
import { ScreenService } from '@app/shared/misc/screen.service'
import { Notifier, ServerService } from '@app/core'
import { UserService } from '@app/shared'
import { LocalStorageService } from '@app/shared/misc/storage.service'
=======
import { AuthService, ConfirmService, LocalStorageService, Notifier, ScreenService, ServerService, UserService } from '@app/core'
import { immutableAssign } from '@app/helpers'
import { VideoChannel, VideoChannelService, VideoService } from '@app/shared/shared-main'
import { AbstractVideoList } from '@app/shared/shared-video-miniature'
import { VideoFilter } from '@shared/models'
>>>>>>> Stashed changes

@Component({
  selector: 'my-video-channel-videos',
  templateUrl: '../../shared/video/abstract-video-list.html',
  styleUrls: [
<<<<<<< Updated upstream
    '../../shared/video/abstract-video-list.scss',
    './video-channel-videos.component.scss'
=======
    '../../shared/shared-video-miniature/abstract-video-list.scss'
>>>>>>> Stashed changes
  ]
})
export class VideoChannelVideosComponent extends AbstractVideoList implements OnInit, OnDestroy {
  titlePage: string
  loadOnInit = false

  filter: VideoFilter = null

  private videoChannel: VideoChannel
  private videoChannelSub: Subscription

  constructor (
    protected router: Router,
    protected serverService: ServerService,
    protected route: ActivatedRoute,
    protected authService: AuthService,
    protected userService: UserService,
    protected notifier: Notifier,
    protected confirmService: ConfirmService,
    protected screenService: ScreenService,
    protected storageService: LocalStorageService,
    private videoChannelService: VideoChannelService,
    private videoService: VideoService
  ) {
    super()

<<<<<<< Updated upstream
    this.titlePage = this.i18n('Published videos')
=======
    this.titlePage = $localize`Published videos`
    this.displayOptions = {
      ...this.displayOptions,
      avatar: false
    }
>>>>>>> Stashed changes
  }

  ngOnInit () {
    super.ngOnInit()

    this.enableAllFilterIfPossible()

    // Parent get the video channel for us
    this.videoChannelSub = this.videoChannelService.videoChannelLoaded
                               .pipe(first())
                               .subscribe(videoChannel => {
                                 this.videoChannel = videoChannel

                                 this.reloadVideos()
                                 this.generateSyndicationList()
                               })
  }

  ngOnDestroy () {
    if (this.videoChannelSub) this.videoChannelSub.unsubscribe()

    super.ngOnDestroy()
  }

  getVideosObservable (page: number) {
    const newPagination = immutableAssign(this.pagination, { currentPage: page })
    const options = {
      videoChannel: this.videoChannel,
      videoPagination: newPagination,
      sort: this.sort,
      nsfwPolicy: this.nsfwPolicy,
      videoFilter: this.filter
    }

    return this.videoService
<<<<<<< Updated upstream
               .getVideoChannelVideos(this.videoChannel, newPagination, this.sort)
=======
               .getVideoChannelVideos(options)
>>>>>>> Stashed changes
               .pipe(
                 tap(({ total }) => {
                   this.titlePage = total === 1
                    ? $localize`Published 1 video`
                    : $localize`Published ${total} videos`
                 })
               )
  }

  generateSyndicationList () {
    this.syndicationItems = this.videoService.getVideoChannelFeedUrls(this.videoChannel.id)
  }

  toggleModerationDisplay () {
    this.filter = this.buildLocalFilter(this.filter, null)

    this.reloadVideos()
  }
}
