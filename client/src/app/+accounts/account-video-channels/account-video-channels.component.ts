import { Component, OnDestroy, OnInit } from '@angular/core'
<<<<<<< Updated upstream
import { ActivatedRoute } from '@angular/router'
import { Account } from '@app/shared/account/account.model'
import { AccountService } from '@app/shared/account/account.service'
import { VideoChannelService } from '@app/shared/video-channel/video-channel.service'
import { concatMap, map, switchMap, tap } from 'rxjs/operators'
import { from, Subject, Subscription } from 'rxjs'
import { VideoChannel } from '@app/shared/video-channel/video-channel.model'
import { Video } from '@app/shared/video/video.model'
import { AuthService } from '@app/core'
import { VideoService } from '@app/shared/video/video.service'
import { VideoSortField } from '@app/shared/video/sort-field.type'
import { ComponentPagination, hasMoreItems } from '@app/shared/rest/component-pagination.model'
import { ScreenService } from '@app/shared/misc/screen.service'
=======
import { ComponentPagination, hasMoreItems, ScreenService, User, UserService } from '@app/core'
import { Account, AccountService, Video, VideoChannel, VideoChannelService, VideoService } from '@app/shared/shared-main'
import { NSFWPolicyType, VideoSortField } from '@shared/models'
>>>>>>> Stashed changes

@Component({
  selector: 'my-account-video-channels',
  templateUrl: './account-video-channels.component.html',
  styleUrls: [ './account-video-channels.component.scss' ]
})
export class AccountVideoChannelsComponent implements OnInit, OnDestroy {
  account: Account
  videoChannels: VideoChannel[] = []
  videos: { [id: number]: Video[] } = {}

  channelPagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 2,
    totalItems: null
  }

  videosPagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: null
  }
  videosSort: VideoSortField = '-publishedAt'

  onChannelDataSubject = new Subject<any>()

<<<<<<< Updated upstream
=======
  userMiniature: User
  nsfwPolicy: NSFWPolicyType

>>>>>>> Stashed changes
  private accountSub: Subscription

  constructor (
    private route: ActivatedRoute,
    private authService: AuthService,
    private accountService: AccountService,
    private videoChannelService: VideoChannelService,
    private videoService: VideoService,
    private screenService: ScreenService
  ) { }

  get user () {
    return this.authService.getUser()
  }

  ngOnInit () {
    // Parent get the account for us
    this.accountSub = this.accountService.accountLoaded
        .subscribe(account => {
          this.account = account

          this.loadMoreChannels()
        })
<<<<<<< Updated upstream
=======

    this.userService.getAnonymousOrLoggedUser()
      .subscribe(user => {
        this.userMiniature = user

        this.nsfwPolicy = user.nsfwPolicy
      })
>>>>>>> Stashed changes
  }

  ngOnDestroy () {
    if (this.accountSub) this.accountSub.unsubscribe()
  }

  loadMoreChannels () {
    this.videoChannelService.listAccountVideoChannels(this.account, this.channelPagination)
      .pipe(
        tap(res => this.channelPagination.totalItems = res.total),
        switchMap(res => from(res.data)),
        concatMap(videoChannel => {
          const options = {
            videoChannel,
            videoPagination: this.videosPagination,
            sort: this.videosSort,
            nsfwPolicy: this.nsfwPolicy
          }

          return this.videoService.getVideoChannelVideos(options)
            .pipe(map(data => ({ videoChannel, videos: data.data })))
        })
      )
      .subscribe(({ videoChannel, videos }) => {
        this.videoChannels.push(videoChannel)

        this.videos[videoChannel.id] = videos

        this.onChannelDataSubject.next([ videoChannel ])
      })
  }

  getVideosOf (videoChannel: VideoChannel) {
    const numberOfVideos = this.screenService.getNumberOfAvailableMiniatures()

    // 2 rows
    return this.videos[ videoChannel.id ].slice(0, numberOfVideos * 2)
  }

  onNearOfBottom () {
    if (!hasMoreItems(this.channelPagination)) return

    this.channelPagination.currentPage += 1

    this.loadMoreChannels()
  }

  getVideoChannelLink (videoChannel: VideoChannel) {
    return [ '/video-channels', videoChannel.nameWithHost ]
  }
}
