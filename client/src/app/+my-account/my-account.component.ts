import { Component, OnInit } from '@angular/core'
<<<<<<< Updated upstream
import { ServerService } from '@app/core'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { TopMenuDropdownParam } from '@app/shared/menu/top-menu-dropdown.component'
import { ServerConfig } from '@shared/models'
=======
import { AuthUser, ScreenService } from '@app/core'
import { TopMenuDropdownParam } from '../shared/shared-main/misc/top-menu-dropdown.component'
>>>>>>> Stashed changes

@Component({
  selector: 'my-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: [ './my-account.component.scss' ]
})
export class MyAccountComponent implements OnInit {
  menuEntries: TopMenuDropdownParam[] = []
  user: AuthUser

  constructor (
    private screenService: ScreenService
    ) { }

<<<<<<< Updated upstream
    const libraryEntries: TopMenuDropdownParam = {
      label: this.i18n('My library'),
      children: [
        {
          label: this.i18n('My channels'),
          routerLink: '/my-account/video-channels',
          iconName: 'folder'
        },
        {
          label: this.i18n('My videos'),
          routerLink: '/my-account/videos',
          iconName: 'videos'
        },
        {
          label: this.i18n('My playlists'),
          routerLink: '/my-account/video-playlists',
          iconName: 'playlists'
        },
        {
          label: this.i18n('My subscriptions'),
          routerLink: '/my-account/subscriptions',
          iconName: 'subscriptions'
        },
        {
          label: this.i18n('My history'),
          routerLink: '/my-account/history/videos',
          iconName: 'history'
        }
      ]
    }
=======
  get isBroadcastMessageDisplayed () {
    return this.screenService.isBroadcastMessageDisplayed
  }
>>>>>>> Stashed changes

  ngOnInit (): void {
    this.buildMenu()
  }

  private buildMenu () {
    const moderationEntries: TopMenuDropdownParam = {
      label: $localize`Moderation`,
      children: [
        {
          label: $localize`Muted accounts`,
          routerLink: '/my-account/blocklist/accounts',
          iconName: 'user-x'
        },
        {
<<<<<<< Updated upstream
          label: this.i18n('Muted instances'),
=======
          label: $localize`Premium storage billing`,
          routerLink: '/my-account/premium-storage/billing',
          iconName: 'history'
        },
        {
          label: $localize`Muted servers`,
>>>>>>> Stashed changes
          routerLink: '/my-account/blocklist/servers',
          iconName: 'peertube-x'
        },
        {
<<<<<<< Updated upstream
          label: this.i18n('Ownership changes'),
          routerLink: '/my-account/ownership',
          iconName: 'im-with-her'
=======
          label: $localize`Abuse reports`,
          routerLink: '/my-account/abuses',
          iconName: 'flag'
>>>>>>> Stashed changes
        }
      ]
    }

    this.menuEntries = [
      {
        label: $localize`Settings`,
        routerLink: '/my-account/settings'
      },

      {
        label: $localize`Notifications`,
        routerLink: '/my-account/notifications'
      },

      {
        label: $localize`Applications`,
        routerLink: '/my-account/applications'
      },

      moderationEntries
    ]
  }
}
