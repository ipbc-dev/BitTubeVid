import { Routes } from '@angular/router'
<<<<<<< Updated upstream
import { UserRight } from '../../../../../shared'
=======
import { AbuseListComponent } from '@app/+admin/moderation/abuse-list'
import { InstanceAccountBlocklistComponent, InstanceServerBlocklistComponent } from '@app/+admin/moderation/instance-blocklist'
import { ModerationComponent } from '@app/+admin/moderation/moderation.component'
import { VideoBlockListComponent } from '@app/+admin/moderation/video-block-list'
import { VideoCommentListComponent } from './video-comment-list'
>>>>>>> Stashed changes
import { UserRightGuard } from '@app/core'
import { VideoAbuseListComponent } from '@app/+admin/moderation/video-abuse-list'
import { VideoBlacklistListComponent } from '@app/+admin/moderation/video-blacklist-list'
import { VideoAutoBlacklistListComponent } from '@app/+admin/moderation/video-auto-blacklist-list'
import { ModerationComponent } from '@app/+admin/moderation/moderation.component'
import { InstanceAccountBlocklistComponent, InstanceServerBlocklistComponent } from '@app/+admin/moderation/instance-blocklist'

export const ModerationRoutes: Routes = [
  {
    path: 'moderation',
    component: ModerationComponent,
    children: [
      {
        path: '',
        redirectTo: 'abuses/list',
        pathMatch: 'full'
      },
      {
        path: 'video-abuses',
        redirectTo: 'abuses/list',
        pathMatch: 'full'
      },
      {
        path: 'video-blacklist',
        redirectTo: 'video-blacklist/list',
        pathMatch: 'full'
      },
      {
        path: 'video-auto-blacklist',
        redirectTo: 'video-auto-blacklist/list',
        pathMatch: 'full'
      },
      {
        path: 'video-abuses/list',
        redirectTo: 'abuses/list',
        pathMatch: 'full'
      },
      {
        path: 'abuses/list',
        component: AbuseListComponent,
        canActivate: [ UserRightGuard ],
        data: {
          userRight: UserRight.MANAGE_ABUSES,
          meta: {
<<<<<<< Updated upstream
            title: 'Video abuses list'
=======
            title: $localize`Reports`
>>>>>>> Stashed changes
          }
        }
      },

      {
        path: 'video-auto-blacklist/list',
        component: VideoAutoBlacklistListComponent,
        canActivate: [ UserRightGuard ],
        data: {
          userRight: UserRight.MANAGE_VIDEO_BLACKLIST,
          meta: {
            title: 'Auto-blacklisted videos'
          }
        }
      },
      {
        path: 'video-blacklist/list',
        component: VideoBlacklistListComponent,
        canActivate: [ UserRightGuard ],
        data: {
          userRight: UserRight.MANAGE_VIDEO_BLACKLIST,
          meta: {
<<<<<<< Updated upstream
            title: 'Blacklisted videos'
=======
            title: $localize`Blocked videos`
          }
        }
      },

      {
        path: 'video-comments',
        redirectTo: 'video-comments/list',
        pathMatch: 'full'
      },
      {
        path: 'video-comments/list',
        component: VideoCommentListComponent,
        canActivate: [ UserRightGuard ],
        data: {
          userRight: UserRight.SEE_ALL_COMMENTS,
          meta: {
            title: $localize`Video comments`
>>>>>>> Stashed changes
          }
        }
      },

      {
        path: 'blocklist/accounts',
        component: InstanceAccountBlocklistComponent,
        canActivate: [ UserRightGuard ],
        data: {
          userRight: UserRight.MANAGE_ACCOUNTS_BLOCKLIST,
          meta: {
            title: $localize`Muted accounts`
          }
        }
      },
      {
        path: 'blocklist/servers',
        component: InstanceServerBlocklistComponent,
        canActivate: [ UserRightGuard ],
        data: {
          userRight: UserRight.MANAGE_SERVERS_BLOCKLIST,
          meta: {
            title: $localize`Muted instances`
          }
        }
      }
    ]
  }
]
