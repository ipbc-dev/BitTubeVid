import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { MetaGuard } from '@ngx-meta/core'
import { LoginGuard } from '../core'
<<<<<<< Updated upstream
import { MyAccountComponent } from './my-account.component'
import { MyAccountSettingsComponent } from './my-account-settings/my-account-settings.component'
import { MyAccountVideosComponent } from './my-account-videos/my-account-videos.component'
import { MyAccountVideoImportsComponent } from '@app/+my-account/my-account-video-imports/my-account-video-imports.component'
import { MyAccountSubscriptionsComponent } from '@app/+my-account/my-account-subscriptions/my-account-subscriptions.component'
import { MyAccountOwnershipComponent } from '@app/+my-account/my-account-ownership/my-account-ownership.component'
import { MyAccountBlocklistComponent } from '@app/+my-account/my-account-blocklist/my-account-blocklist.component'
import { MyAccountServerBlocklistComponent } from '@app/+my-account/my-account-blocklist/my-account-server-blocklist.component'
import { MyAccountHistoryComponent } from '@app/+my-account/my-account-history/my-account-history.component'
import { MyAccountNotificationsComponent } from '@app/+my-account/my-account-notifications/my-account-notifications.component'
import { MyAccountVideoPlaylistsComponent } from '@app/+my-account/my-account-video-playlists/my-account-video-playlists.component'
import {
  MyAccountVideoPlaylistCreateComponent
} from '@app/+my-account/my-account-video-playlists/my-account-video-playlist-create.component'
import {
  MyAccountVideoPlaylistUpdateComponent
} from '@app/+my-account/my-account-video-playlists/my-account-video-playlist-update.component'
import {
  MyAccountVideoPlaylistElementsComponent
} from '@app/+my-account/my-account-video-playlists/my-account-video-playlist-elements.component'
=======
import { MyAccountAbusesListComponent } from './my-account-abuses/my-account-abuses-list.component'
import { MyAccountBlocklistComponent } from './my-account-blocklist/my-account-blocklist.component'
import { MyAccountServerBlocklistComponent } from './my-account-blocklist/my-account-server-blocklist.component'
import { MyAccountNotificationsComponent } from './my-account-notifications/my-account-notifications.component'
import { MyAccountSettingsComponent } from './my-account-settings/my-account-settings.component'
import { MyAccountComponent } from './my-account.component'
import { MyAccountStorageBillingComponent } from '@app/+my-account/my-account-storage-billing/my-account-storage-billing.component'
import { MyAccountApplicationsComponent } from './my-account-applications/my-account-applications.component'
>>>>>>> Stashed changes

const myAccountRoutes: Routes = [
  {
    path: '',
    component: MyAccountComponent,
    canActivateChild: [ MetaGuard, LoginGuard ],
    children: [
      {
        path: '',
        redirectTo: 'settings',
        pathMatch: 'full'
      },
      {
        path: 'settings',
        component: MyAccountSettingsComponent,
        data: {
          meta: {
            title: $localize`Account settings`
          }
        }
      },

      {
        path: 'video-channels',
<<<<<<< Updated upstream
        loadChildren: () => import('./my-account-video-channels/my-account-video-channels.module').then(m => m.MyAccountVideoChannelsModule)
=======
        redirectTo: '/my-library/video-channels',
        pathMatch: 'full'
>>>>>>> Stashed changes
      },

      {
        path: 'video-playlists',
        redirectTo: '/my-library/video-playlists',
        pathMatch: 'full'
      },
      {
        path: 'video-playlists/create',
        redirectTo: '/my-library/video-playlists/create',
        pathMatch: 'full'
      },
      {
        path: 'video-playlists/:videoPlaylistId',
        redirectTo: '/my-library/video-playlists/:videoPlaylistId',
        pathMatch: 'full'
      },
      {
        path: 'video-playlists/update/:videoPlaylistId',
        redirectTo: '/my-library/video-playlists/update/:videoPlaylistId',
        pathMatch: 'full'
      },

      {
        path: 'videos',
        redirectTo: '/my-library/videos',
        pathMatch: 'full'
      },
      {
        path: 'video-imports',
        redirectTo: '/my-library/video-imports',
        pathMatch: 'full'
      },
      {
        path: 'subscriptions',
        redirectTo: '/my-library/subscriptions',
        pathMatch: 'full'
      },
      {
        path: 'ownership',
        redirectTo: '/my-library/ownership',
        pathMatch: 'full'
      },
      {
        path: 'blocklist/accounts',
        component: MyAccountBlocklistComponent,
        data: {
          meta: {
            title: $localize`Muted accounts`
          }
        }
      },
      {
        path: 'blocklist/servers',
        component: MyAccountServerBlocklistComponent,
        data: {
          meta: {
<<<<<<< Updated upstream
            title: 'Muted instances'
=======
            title: $localize`Muted servers`
>>>>>>> Stashed changes
          }
        }
      },
      {
        path: 'history/videos',
        redirectTo: '/my-library/history/videos',
        pathMatch: 'full'
      },
      {
        path: 'notifications',
        component: MyAccountNotificationsComponent,
        data: {
          meta: {
            title: $localize`Notifications`
          }
        }
      },
      {
        path: 'abuses',
        component: MyAccountAbusesListComponent,
        data: {
          meta: {
            title: $localize`My abuse reports`
          }
        }
      },
      {
        path: 'applications',
        component: MyAccountApplicationsComponent,
        data: {
          meta: {
            title: $localize`Applications`
          }
        }
      }
    ]
  }
]

@NgModule({
  imports: [ RouterModule.forChild(myAccountRoutes) ],
  exports: [ RouterModule ]
})
export class MyAccountRoutingModule {}
