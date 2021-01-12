import { NgModule } from '@angular/core'
<<<<<<< Updated upstream
import { ConfigComponent, EditCustomConfigComponent } from '@app/+admin/config'
import { ConfigService } from '@app/+admin/config/shared/config.service'
import { TableModule } from 'primeng/table'
import { SharedModule } from '../shared'
=======
import { SharedAbuseListModule } from '@app/shared/shared-abuse-list'
import { SharedFormModule } from '@app/shared/shared-forms'
import { SharedGlobalIconModule } from '@app/shared/shared-icons'
import { SharedMainModule } from '@app/shared/shared-main'
import { SharedModerationModule } from '@app/shared/shared-moderation'
import { SharedVideoCommentModule } from '@app/shared/shared-video-comment'
>>>>>>> Stashed changes
import { AdminRoutingModule } from './admin-routing.module'
import { AdminComponent } from './admin.component'
import { FollowersListComponent, FollowsComponent, VideoRedundanciesListComponent } from './follows'
import { FollowingListComponent } from './follows/following-list/following-list.component'
<<<<<<< Updated upstream
=======
import { RedundancyCheckboxComponent } from './follows/shared/redundancy-checkbox.component'
import { VideoRedundancyInformationComponent } from './follows/video-redundancies-list/video-redundancy-information.component'
import { AbuseListComponent, VideoBlockListComponent } from './moderation'
import { InstanceAccountBlocklistComponent, InstanceServerBlocklistComponent } from './moderation/instance-blocklist'
import { ModerationComponent } from './moderation/moderation.component'
import { VideoCommentListComponent } from './moderation/video-comment-list'
import { PluginListInstalledComponent } from './plugins/plugin-list-installed/plugin-list-installed.component'
import { PluginSearchComponent } from './plugins/plugin-search/plugin-search.component'
import { PluginShowInstalledComponent } from './plugins/plugin-show-installed/plugin-show-installed.component'
import { PluginsComponent } from './plugins/plugins.component'
import { PluginApiService } from './plugins/shared/plugin-api.service'
import { JobService, LogsComponent, LogsService, SystemComponent } from './system'
import { DebugComponent, DebugService } from './system/debug'
import { JobsComponent } from './system/jobs/jobs.component'
>>>>>>> Stashed changes
import { UserCreateComponent, UserListComponent, UserPasswordComponent, UsersComponent, UserUpdateComponent } from './users'
import {
  ModerationCommentModalComponent,
  VideoAbuseListComponent,
  VideoAutoBlacklistListComponent,
  VideoBlacklistListComponent
} from './moderation'
import { ModerationComponent } from '@app/+admin/moderation/moderation.component'
import { RedundancyCheckboxComponent } from '@app/+admin/follows/shared/redundancy-checkbox.component'
import { InstanceAccountBlocklistComponent, InstanceServerBlocklistComponent } from '@app/+admin/moderation/instance-blocklist'
import { JobsComponent } from '@app/+admin/system/jobs/jobs.component'
import { JobService, LogsComponent, LogsService, SystemComponent } from '@app/+admin/system'
import { DebugComponent, DebugService } from '@app/+admin/system/debug'
import { PluginsComponent } from '@app/+admin/plugins/plugins.component'
import { PluginListInstalledComponent } from '@app/+admin/plugins/plugin-list-installed/plugin-list-installed.component'
import { PluginSearchComponent } from '@app/+admin/plugins/plugin-search/plugin-search.component'
import { PluginShowInstalledComponent } from '@app/+admin/plugins/plugin-show-installed/plugin-show-installed.component'
import { SelectButtonModule } from 'primeng/selectbutton'
import { PluginApiService } from '@app/+admin/plugins/shared/plugin-api.service'
import { VideoRedundancyInformationComponent } from '@app/+admin/follows/video-redundancies-list/video-redundancy-information.component'
import { ChartModule } from 'primeng/chart'
import { BatchDomainsModalComponent } from './config/shared/batch-domains-modal.component'
import { VideoAbuseDetailsComponent } from './moderation/video-abuse-list/video-abuse-details.component'

@NgModule({
  imports: [
    AdminRoutingModule,

<<<<<<< Updated upstream
    SharedModule,
=======
    SharedMainModule,
    SharedFormModule,
    SharedModerationModule,
    SharedGlobalIconModule,
    SharedAbuseListModule,
    SharedVideoCommentModule,
>>>>>>> Stashed changes

    TableModule,
    SelectButtonModule,
    ChartModule
  ],

  declarations: [
    AdminComponent,

    FollowsComponent,
    FollowersListComponent,
    FollowingListComponent,
    RedundancyCheckboxComponent,
    VideoRedundanciesListComponent,
    VideoRedundancyInformationComponent,

    UsersComponent,
    UserCreateComponent,
    UserUpdateComponent,
    UserPasswordComponent,
    UserListComponent,

    ModerationComponent,
<<<<<<< Updated upstream
    VideoBlacklistListComponent,
    VideoAbuseListComponent,
    VideoAbuseDetailsComponent,
    VideoAutoBlacklistListComponent,
    ModerationCommentModalComponent,
=======
    VideoBlockListComponent,
    AbuseListComponent,
    VideoCommentListComponent,

>>>>>>> Stashed changes
    InstanceServerBlocklistComponent,
    InstanceAccountBlocklistComponent,

    PluginsComponent,
    PluginListInstalledComponent,
    PluginSearchComponent,
    PluginShowInstalledComponent,

    SystemComponent,
    JobsComponent,
    LogsComponent,
    DebugComponent,

    ConfigComponent,
    EditCustomConfigComponent,

    BatchDomainsModalComponent
  ],

  exports: [
    AdminComponent
  ],

  providers: [
    JobService,
    LogsService,
    DebugService,
    ConfigService,
    PluginApiService
  ]
})
export class AdminModule { }
