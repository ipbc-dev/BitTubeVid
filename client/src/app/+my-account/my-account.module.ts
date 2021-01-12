import { NgModule } from '@angular/core'
import { TableModule } from 'primeng/table'
import { AutoCompleteModule } from 'primeng/autocomplete'
<<<<<<< Updated upstream
import { InputSwitchModule } from 'primeng/inputswitch'
import { SharedModule } from '../shared'
=======
import { TableModule } from 'primeng/table'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { NgModule } from '@angular/core'
import { SharedAbuseListModule } from '@app/shared/shared-abuse-list'
import { SharedFormModule } from '@app/shared/shared-forms'
import { SharedGlobalIconModule } from '@app/shared/shared-icons'
import { SharedMainModule } from '@app/shared/shared-main'
import { SharedModerationModule } from '@app/shared/shared-moderation'
import { SharedShareModal } from '@app/shared/shared-share-modal'
import { SharedUserInterfaceSettingsModule } from '@app/shared/shared-user-settings'
import { MyAccountAbusesListComponent } from './my-account-abuses/my-account-abuses-list.component'
import { MyAccountBlocklistComponent } from './my-account-blocklist/my-account-blocklist.component'
import { MyAccountServerBlocklistComponent } from './my-account-blocklist/my-account-server-blocklist.component'
import { MyAccountNotificationsComponent } from './my-account-notifications/my-account-notifications.component'
>>>>>>> Stashed changes
import { MyAccountRoutingModule } from './my-account-routing.module'
import { MyAccountChangeEmailComponent } from './my-account-settings/my-account-change-email'
import { MyAccountChangePasswordComponent } from './my-account-settings/my-account-change-password/my-account-change-password.component'
import { MyAccountDangerZoneComponent } from './my-account-settings/my-account-danger-zone'
import { MyAccountNotificationPreferencesComponent } from './my-account-settings/my-account-notification-preferences'
import { MyAccountProfileComponent } from './my-account-settings/my-account-profile/my-account-profile.component'
import { MyAccountSettingsComponent } from './my-account-settings/my-account-settings.component'
<<<<<<< Updated upstream
import { MyAccountComponent } from './my-account.component'
import { MyAccountVideosComponent } from './my-account-videos/my-account-videos.component'
import { VideoChangeOwnershipComponent } from './my-account-videos/video-change-ownership/video-change-ownership.component'
import { MyAccountOwnershipComponent } from './my-account-ownership/my-account-ownership.component'
import { MyAccountAcceptOwnershipComponent } from './my-account-ownership/my-account-accept-ownership/my-account-accept-ownership.component'
import { MyAccountProfileComponent } from '@app/+my-account/my-account-settings/my-account-profile/my-account-profile.component'
import { MyAccountVideoImportsComponent } from '@app/+my-account/my-account-video-imports/my-account-video-imports.component'
import { MyAccountDangerZoneComponent } from '@app/+my-account/my-account-settings/my-account-danger-zone'
import { MyAccountSubscriptionsComponent } from '@app/+my-account/my-account-subscriptions/my-account-subscriptions.component'
import { MyAccountBlocklistComponent } from '@app/+my-account/my-account-blocklist/my-account-blocklist.component'
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
=======
import { MyAccountApplicationsComponent } from './my-account-applications/my-account-applications.component'
import { MyAccountComponent } from './my-account.component'
import { MyAccountStorageBillingComponent } from '@app/+my-account/my-account-storage-billing/my-account-storage-billing.component'
>>>>>>> Stashed changes

@NgModule({
  imports: [
    TableModule,
    MyAccountRoutingModule,
    AutoCompleteModule,
    SharedModule,
    TableModule,
<<<<<<< Updated upstream
    InputSwitchModule,
    DragDropModule
=======
    DragDropModule,

    SharedMainModule,
    SharedFormModule,
    SharedModerationModule,
    SharedUserInterfaceSettingsModule,
    SharedGlobalIconModule,
    SharedAbuseListModule,
    SharedShareModal
>>>>>>> Stashed changes
  ],

  declarations: [
    MyAccountComponent,
    MyAccountSettingsComponent,
    MyAccountChangePasswordComponent,
    MyAccountProfileComponent,
    MyAccountChangeEmailComponent,
    MyAccountApplicationsComponent,

<<<<<<< Updated upstream
    MyAccountVideosComponent,

    VideoChangeOwnershipComponent,
    MyAccountOwnershipComponent,
    MyAccountAcceptOwnershipComponent,
    MyAccountVideoImportsComponent,
=======
>>>>>>> Stashed changes
    MyAccountDangerZoneComponent,
    MyAccountBlocklistComponent,
<<<<<<< Updated upstream
=======
    MyAccountStorageBillingComponent,
    MyAccountAbusesListComponent,
>>>>>>> Stashed changes
    MyAccountServerBlocklistComponent,
    MyAccountNotificationsComponent,
    MyAccountNotificationPreferencesComponent
  ],

  exports: [
    MyAccountComponent
  ],

  providers: []
})
export class MyAccountModule {
}
