import { AutoCompleteModule } from 'primeng/autocomplete'
import { InputSwitchModule } from 'primeng/inputswitch'
import { TableModule } from 'primeng/table'
import { NgModule } from '@angular/core'
import { SharedFormModule } from '@app/shared/shared-forms'
import { SharedGlobalIconModule } from '@app/shared/shared-icons'
import { SharedMainModule } from '@app/shared/shared-main'
import { SharedModerationModule } from '@app/shared/shared-moderation'
import { SharedUserInterfaceSettingsModule } from '@app/shared/shared-user-settings'
import { SharedUserSubscriptionModule } from '@app/shared/shared-user-subscription/shared-user-subscription.module'
import { SharedVideoMiniatureModule } from '@app/shared/shared-video-miniature'
import { SharedVideoPlaylistModule } from '@app/shared/shared-video-playlist/shared-video-playlist.module'
import { MyAccountRoutingModule } from './my-account-routing.module'
import { MyAccountChangePasswordComponent } from './my-account-settings/my-account-change-password/my-account-change-password.component'
import { MyAccountSettingsComponent } from './my-account-settings/my-account-settings.component'
import { MyAccountVideosComponent } from './my-account-videos/my-account-videos.component'
import { VideoChangeOwnershipComponent } from './my-account-videos/video-change-ownership/video-change-ownership.component'
import { MyAccountOwnershipComponent } from './my-account-ownership/my-account-ownership.component'
import { MyAccountAcceptOwnershipComponent } from './my-account-ownership/my-account-accept-ownership/my-account-accept-ownership.component'
import { MyAccountProfileComponent } from '@app/+my-account/my-account-settings/my-account-profile/my-account-profile.component'
import { MyAccountVideoImportsComponent } from '@app/+my-account/my-account-video-imports/my-account-video-imports.component'
import { MyAccountDangerZoneComponent } from '@app/+my-account/my-account-settings/my-account-danger-zone'
import { MyAccountSubscriptionsComponent } from '@app/+my-account/my-account-subscriptions/my-account-subscriptions.component'
import { MyAccountBlocklistComponent } from '@app/+my-account/my-account-blocklist/my-account-blocklist.component'
import { MyAccountStorageBillingComponent } from '@app/+my-account/my-account-storage-billing/my-account-storage-billing.component'
import { MyAccountServerBlocklistComponent } from '@app/+my-account/my-account-blocklist/my-account-server-blocklist.component'
import { MyAccountHistoryComponent } from '@app/+my-account/my-account-history/my-account-history.component'
import { MyAccountNotificationsComponent } from '@app/+my-account/my-account-notifications/my-account-notifications.component'
import { MyAccountNotificationPreferencesComponent } from '@app/+my-account/my-account-settings/my-account-notification-preferences'
import {
  MyAccountVideoPlaylistCreateComponent
} from '@app/+my-account/my-account-video-playlists/my-account-video-playlist-create.component'
import {
  MyAccountVideoPlaylistUpdateComponent
} from '@app/+my-account/my-account-video-playlists/my-account-video-playlist-update.component'
import { MyAccountVideoPlaylistsComponent } from '@app/+my-account/my-account-video-playlists/my-account-video-playlists.component'
import {
  MyAccountVideoPlaylistElementsComponent
} from '@app/+my-account/my-account-video-playlists/my-account-video-playlist-elements.component'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { MyAccountChangeEmailComponent } from '@app/+my-account/my-account-settings/my-account-change-email'
import { MyAccountComponent } from './my-account.component'

@NgModule({
  imports: [
    MyAccountRoutingModule,

    AutoCompleteModule,
    TableModule,
    InputSwitchModule,
    DragDropModule,

    SharedMainModule,
    SharedFormModule,
    SharedModerationModule,
    SharedVideoMiniatureModule,
    SharedUserSubscriptionModule,
    SharedVideoPlaylistModule,
    SharedUserInterfaceSettingsModule,
    SharedGlobalIconModule
  ],

  declarations: [
    MyAccountComponent,
    MyAccountSettingsComponent,
    MyAccountChangePasswordComponent,
    MyAccountProfileComponent,
    MyAccountChangeEmailComponent,

    MyAccountVideosComponent,

    VideoChangeOwnershipComponent,
    MyAccountOwnershipComponent,
    MyAccountAcceptOwnershipComponent,
    MyAccountVideoImportsComponent,
    MyAccountDangerZoneComponent,
    MyAccountSubscriptionsComponent,
    MyAccountBlocklistComponent,
    MyAccountStorageBillingComponent,
    MyAccountServerBlocklistComponent,
    MyAccountHistoryComponent,
    MyAccountNotificationsComponent,
    MyAccountNotificationPreferencesComponent,

    MyAccountVideoPlaylistCreateComponent,
    MyAccountVideoPlaylistUpdateComponent,
    MyAccountVideoPlaylistsComponent,
    MyAccountVideoPlaylistElementsComponent
  ],

  exports: [
    MyAccountComponent
  ],

  providers: []
})
export class MyAccountModule {
}
