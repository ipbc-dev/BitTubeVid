import { Component, Input, OnInit } from '@angular/core'
<<<<<<< Updated upstream
import { User } from '@app/shared'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { Subject } from 'rxjs'
import { UserNotificationSetting, UserNotificationSettingValue, UserRight } from '../../../../../../shared'
import { Notifier, ServerService } from '@app/core'
import { debounce } from 'lodash-es'
import { UserNotificationService } from '@app/shared/users/user-notification.service'
=======
import { Notifier, ServerService, User } from '@app/core'
import { UserNotificationService } from '@app/shared/shared-main'
import { UserNotificationSetting, UserNotificationSettingValue, UserRight } from '@shared/models'
>>>>>>> Stashed changes

@Component({
  selector: 'my-account-notification-preferences',
  templateUrl: './my-account-notification-preferences.component.html',
  styleUrls: [ './my-account-notification-preferences.component.scss' ]
})
export class MyAccountNotificationPreferencesComponent implements OnInit {
  @Input() user: User = null
  @Input() userInformationLoaded: Subject<any>

  notificationSettingKeys: (keyof UserNotificationSetting)[] = []
  emailNotifications: { [ id in keyof UserNotificationSetting ]: boolean } = {} as any
  webNotifications: { [ id in keyof UserNotificationSetting ]: boolean } = {} as any
  labelNotifications: { [ id in keyof UserNotificationSetting ]: string } = {} as any
  rightNotifications: { [ id in keyof Partial<UserNotificationSetting> ]: UserRight } = {} as any
  emailEnabled = false

  private savePreferences = debounce(this.savePreferencesImpl.bind(this), 500)

  constructor (
    private userNotificationService: UserNotificationService,
    private serverService: ServerService,
    private notifier: Notifier
  ) {
    this.labelNotifications = {
<<<<<<< Updated upstream
      newVideoFromSubscription: this.i18n('New video from your subscriptions'),
      newCommentOnMyVideo: this.i18n('New comment on your video'),
      videoAbuseAsModerator: this.i18n('New video abuse'),
      videoAutoBlacklistAsModerator: this.i18n('Video auto-blacklisted waiting review'),
      blacklistOnMyVideo: this.i18n('One of your video is blacklisted/unblacklisted'),
      myVideoPublished: this.i18n('Video published (after transcoding/scheduled update)'),
      myVideoImportFinished: this.i18n('Video import finished'),
      newUserRegistration: this.i18n('A new user registered on your instance'),
      newFollow: this.i18n('You or your channel(s) has a new follower'),
      commentMention: this.i18n('Someone mentioned you in video comments'),
      newInstanceFollower: this.i18n('Your instance has a new follower'),
      autoInstanceFollowing: this.i18n('Your instance auto followed another instance')
=======
      newVideoFromSubscription: $localize`New video from your subscriptions`,
      newCommentOnMyVideo: $localize`New comment on your video`,
      abuseAsModerator: $localize`New abuse`,
      videoAutoBlacklistAsModerator: $localize`Video blocked automatically waiting review`,
      blacklistOnMyVideo: $localize`One of your video is blocked/unblocked`,
      myVideoPublished: $localize`Video published (after transcoding/scheduled update)`,
      myVideoImportFinished: $localize`Video import finished`,
      newUserRegistration: $localize`A new user registered on your instance`,
      newFollow: $localize`You or your channel(s) has a new follower`,
      commentMention: $localize`Someone mentioned you in video comments`,
      newInstanceFollower: $localize`Your instance has a new follower`,
      autoInstanceFollowing: $localize`Your instance automatically followed another instance`,
      abuseNewMessage: $localize`An abuse report received a new message`,
      abuseStateChange: $localize`One of your abuse reports has been accepted or rejected by moderators`
>>>>>>> Stashed changes
    }
    this.notificationSettingKeys = Object.keys(this.labelNotifications) as (keyof UserNotificationSetting)[]

    this.rightNotifications = {
      abuseAsModerator: UserRight.MANAGE_ABUSES,
      videoAutoBlacklistAsModerator: UserRight.MANAGE_VIDEO_BLACKLIST,
      newUserRegistration: UserRight.MANAGE_USERS,
      newInstanceFollower: UserRight.MANAGE_SERVER_FOLLOW,
      autoInstanceFollowing: UserRight.MANAGE_CONFIGURATION
    }
  }

  ngOnInit () {
    this.serverService.getConfig()
        .subscribe(config => {
          this.emailEnabled = config.email.enabled
        })

    this.userInformationLoaded.subscribe(() => this.loadNotificationSettings())
  }

  hasUserRight (field: keyof UserNotificationSetting) {
    const rightToHave = this.rightNotifications[field]
    if (!rightToHave) return true // No rights needed

    return this.user.hasRight(rightToHave)
  }

  updateEmailSetting (field: keyof UserNotificationSetting, value: boolean) {
    if (value === true) this.user.notificationSettings[field] |= UserNotificationSettingValue.EMAIL
    else this.user.notificationSettings[field] &= ~UserNotificationSettingValue.EMAIL

    this.savePreferences()
  }

  updateWebSetting (field: keyof UserNotificationSetting, value: boolean) {
    if (value === true) this.user.notificationSettings[field] |= UserNotificationSettingValue.WEB
    else this.user.notificationSettings[field] &= ~UserNotificationSettingValue.WEB

    this.savePreferences()
  }

  private savePreferencesImpl () {
    this.userNotificationService.updateNotificationSettings(this.user.notificationSettings)
      .subscribe(
        () => {
          this.notifier.success($localize`Preferences saved`, undefined, 2000)
        },

        err => this.notifier.error(err.message)
      )
  }

  private loadNotificationSettings () {
    for (const key of Object.keys(this.user.notificationSettings)) {
      const value = this.user.notificationSettings[key]
      this.emailNotifications[key] = value & UserNotificationSettingValue.EMAIL

      this.webNotifications[key] = value & UserNotificationSettingValue.WEB
    }
  }
}
