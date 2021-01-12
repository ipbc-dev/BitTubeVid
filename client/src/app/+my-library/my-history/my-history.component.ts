import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
<<<<<<< Updated upstream:client/src/app/+my-account/my-account-history/my-account-history.component.ts
import { immutableAssign } from '@app/shared/misc/utils'
import { ComponentPagination } from '@app/shared/rest/component-pagination.model'
import { AuthService } from '../../core/auth'
import { ConfirmService } from '../../core/confirm'
import { AbstractVideoList } from '../../shared/video/abstract-video-list'
import { VideoService } from '../../shared/video/video.service'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { ScreenService } from '@app/shared/misc/screen.service'
import { UserHistoryService } from '@app/shared/users/user-history.service'
import { UserService } from '@app/shared'
import { Notifier, ServerService } from '@app/core'
import { LocalStorageService } from '@app/shared/misc/storage.service'
=======
import {
  AuthService,
  ComponentPagination,
  ConfirmService,
  LocalStorageService,
  Notifier,
  ScreenService,
  ServerService,
  UserService
} from '@app/core'
import { immutableAssign } from '@app/helpers'
import { UserHistoryService } from '@app/shared/shared-main'
import { AbstractVideoList } from '@app/shared/shared-video-miniature'
>>>>>>> Stashed changes:client/src/app/+my-library/my-history/my-history.component.ts

@Component({
  templateUrl: './my-history.component.html',
  styleUrls: [ './my-history.component.scss' ]
})
export class MyHistoryComponent extends AbstractVideoList implements OnInit, OnDestroy {
  titlePage: string
  pagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: null
  }
  videosHistoryEnabled: boolean

  constructor (
    protected router: Router,
    protected serverService: ServerService,
    protected route: ActivatedRoute,
    protected authService: AuthService,
    protected userService: UserService,
    protected notifier: Notifier,
    protected screenService: ScreenService,
    protected storageService: LocalStorageService,
    private confirmService: ConfirmService,
    private videoService: VideoService,
    private userHistoryService: UserHistoryService
  ) {
    super()

    this.titlePage = $localize`My videos history`
  }

  ngOnInit () {
    super.ngOnInit()

    this.authService.userInformationLoaded
      .subscribe(() => {
        this.videosHistoryEnabled = this.authService.getUser().videosHistoryEnabled
      })

  }

  ngOnDestroy () {
    super.ngOnDestroy()
  }

  getVideosObservable (page: number) {
    const newPagination = immutableAssign(this.pagination, { currentPage: page })

    return this.userHistoryService.getUserVideosHistory(newPagination)
  }

  generateSyndicationList () {
    throw new Error('Method not implemented.')
  }

  onVideosHistoryChange () {
    this.userService.updateMyProfile({ videosHistoryEnabled: this.videosHistoryEnabled })
      .subscribe(
        () => {
          const message = this.videosHistoryEnabled === true ?
            $localize`Videos history is enabled` :
            $localize`Videos history is disabled`

          this.notifier.success(message)

          this.authService.refreshUserInformation()
        },

        err => this.notifier.error(err.message)
      )
  }

  async deleteHistory () {
    const title = $localize`Delete videos history`
    const message = $localize`Are you sure you want to delete all your videos history?`

    const res = await this.confirmService.confirm(message, title)
    if (res !== true) return

    this.userHistoryService.deleteUserVideosHistory()
        .subscribe(
          () => {
            this.notifier.success($localize`Videos history deleted`)

            this.reloadVideos()
          },

          err => this.notifier.error(err.message)
        )
  }
}
