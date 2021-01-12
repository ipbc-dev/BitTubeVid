import { Component, OnInit } from '@angular/core'
<<<<<<< Updated upstream
import { UserRight } from '../../../../shared'
import { AuthService } from '../core/auth/auth.service'
import { ListOverflowItem } from '@app/shared/misc/list-overflow.component'
import { I18n } from '@ngx-translate/i18n-polyfill'
=======
import { AuthService, ScreenService } from '@app/core'
import { ListOverflowItem } from '@app/shared/shared-main'
import { TopMenuDropdownParam } from '@app/shared/shared-main/misc/top-menu-dropdown.component'
import { UserRight } from '@shared/models'
>>>>>>> Stashed changes

@Component({
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  items: ListOverflowItem[] = []

  constructor (
    private auth: AuthService,
    private screen: ScreenService
  ) { }

  get isBroadcastMessageDisplayed () {
    return this.screen.isBroadcastMessageDisplayed
  }

  ngOnInit () {
<<<<<<< Updated upstream
    if (this.hasUsersRight()) this.items.push({ label: this.i18n('Users'), routerLink: '/admin/users' })
    if (this.hasServerFollowRight()) this.items.push({ label: this.i18n('Follows & redundancies'), routerLink: '/admin/follows' })
    if (this.hasVideoAbusesRight() || this.hasVideoBlacklistRight()) this.items.push({ label: this.i18n('Moderation'), routerLink: '/admin/moderation' })
    if (this.hasConfigRight()) this.items.push({ label: this.i18n('Configuration'), routerLink: '/admin/config' })
    if (this.hasPluginsRight()) this.items.push({ label: this.i18n('Plugins/Themes'), routerLink: '/admin/plugins' })
    if (this.hasJobsRight() || this.hasLogsRight() || this.hasDebugRight()) this.items.push({ label: this.i18n('System'), routerLink: '/admin/system' })
=======
    const federationItems: TopMenuDropdownParam = {
      label: $localize`Federation`,
      children: [
        {
          label: $localize`Instances you follow`,
          routerLink: '/admin/follows/following-list',
          iconName: 'following'
        },
        {
          label: $localize`Instances following you`,
          routerLink: '/admin/follows/followers-list',
          iconName: 'follower'
        },
        {
          label: $localize`Video redundancies`,
          routerLink: '/admin/follows/video-redundancies-list',
          iconName: 'videos'
        }
      ]
    }

    const moderationItems: TopMenuDropdownParam = {
      label: $localize`Moderation`,
      children: []
    }

    if (this.hasAbusesRight()) {
      moderationItems.children.push({
        label: $localize`Reports`,
        routerLink: '/admin/moderation/abuses/list',
        iconName: 'flag'
      })
    }
    if (this.hasVideoBlocklistRight()) {
      moderationItems.children.push({
        label: $localize`Video blocks`,
        routerLink: '/admin/moderation/video-blocks/list',
        iconName: 'cross'
      })
    }
    if (this.hasVideoCommentsRight()) {
      moderationItems.children.push({
        label: $localize`Video comments`,
        routerLink: '/admin/moderation/video-comments/list',
        iconName: 'message-circle'
      })
    }
    if (this.hasAccountsBlocklistRight()) {
      moderationItems.children.push({
        label: $localize`Muted accounts`,
        routerLink: '/admin/moderation/blocklist/accounts',
        iconName: 'user-x'
      })
    }
    if (this.hasServersBlocklistRight()) {
      moderationItems.children.push({
        label: $localize`Muted servers`,
        routerLink: '/admin/moderation/blocklist/servers',
        iconName: 'peertube-x'
      })
    }

    if (this.hasUsersRight()) {
      this.menuEntries.push({ label: $localize`Users`, routerLink: '/admin/users' })
    }

    if (this.hasServerFollowRight()) this.menuEntries.push(federationItems)
    if (this.hasAbusesRight() || this.hasVideoBlocklistRight()) this.menuEntries.push(moderationItems)

    if (this.hasConfigRight()) {
      this.menuEntries.push({ label: $localize`Configuration`, routerLink: '/admin/config' })
    }

    if (this.hasPluginsRight()) {
      this.menuEntries.push({ label: $localize`Plugins/Themes`, routerLink: '/admin/plugins' })
    }

    if (this.hasJobsRight() || this.hasLogsRight() || this.hasDebugRight()) {
      this.menuEntries.push({ label: $localize`System`, routerLink: '/admin/system' })
    }
>>>>>>> Stashed changes
  }

  hasUsersRight () {
    return this.auth.getUser().hasRight(UserRight.MANAGE_USERS)
  }

  hasServerFollowRight () {
    return this.auth.getUser().hasRight(UserRight.MANAGE_SERVER_FOLLOW)
  }

  hasAbusesRight () {
    return this.auth.getUser().hasRight(UserRight.MANAGE_ABUSES)
  }

  hasVideoBlacklistRight () {
    return this.auth.getUser().hasRight(UserRight.MANAGE_VIDEO_BLACKLIST)
  }

  hasConfigRight () {
    return this.auth.getUser().hasRight(UserRight.MANAGE_CONFIGURATION)
  }

  hasPluginsRight () {
    return this.auth.getUser().hasRight(UserRight.MANAGE_PLUGINS)
  }

  hasLogsRight () {
    return this.auth.getUser().hasRight(UserRight.MANAGE_LOGS)
  }

  hasJobsRight () {
    return this.auth.getUser().hasRight(UserRight.MANAGE_JOBS)
  }

  hasDebugRight () {
    return this.auth.getUser().hasRight(UserRight.MANAGE_DEBUG)
  }

  hasVideoCommentsRight () {
    return this.auth.getUser().hasRight(UserRight.SEE_ALL_COMMENTS)
  }
}
