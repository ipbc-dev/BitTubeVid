import { ViewportScroller } from '@angular/common'
import { AfterViewChecked, Component, OnInit, OnDestroy } from '@angular/core'
import { AuthService, Notifier, User, UserService, ServerService } from '@app/core'
import { HttpErrorResponse } from '@angular/common/http'
import { uploadErrorHandler } from '@app/helpers'

@Component({
  selector: 'my-account-settings',
  templateUrl: './my-account-settings.component.html',
  styleUrls: [ './my-account-settings.component.scss' ]
})
export class MyAccountSettingsComponent implements OnInit, OnDestroy, AfterViewChecked {
  user: User = null

  private lastScrollHash: string

  constructor (
    private viewportScroller: ViewportScroller,
    private userService: UserService,
    private authService: AuthService,
    private notifier: Notifier,
    private serverService: ServerService
    ) {
    this.getUserInfo = this.getUserInfo.bind(this)
  }

  get userInformationLoaded () {
    return this.authService.userInformationLoaded
  }

  ngOnInit () {
    this.user = this.authService.getUser()
    document.body.addEventListener('premiumStorageAddedSuccessfully', this.getUserInfo)
  }

  ngAfterViewChecked () {
    if (window.location.hash && window.location.hash !== this.lastScrollHash) {
      this.viewportScroller.scrollToAnchor(window.location.hash.replace('#', ''))

      this.lastScrollHash = window.location.hash
    }

  }

  onAvatarChange (formData: FormData) {
    this.userService.changeAvatar(formData)
      .subscribe(
        data => {
          this.notifier.success($localize`Avatar changed.`)

          this.user.updateAccountAvatar(data.avatar)
        },

        (err: HttpErrorResponse) => uploadErrorHandler({
          err,
          name: $localize`avatar`,
          notifier: this.notifier
        })
      )
  }

  isPremiumStorageEnabled () {
    const isPremiumStorageEnabled = this.serverService.getTmpConfig().premium_storage.enabled
    return isPremiumStorageEnabled
  }

  ngOnDestroy () {
    document.body.removeEventListener('premiumStorageAddedSuccessfully', this.getUserInfo)
  }

  getUserInfo () {
    this.authService.refreshUserInformation()
    setTimeout(() => {
      this.user = this.authService.getUser()
    }, 1000)
  }
  onAvatarDelete () {
    this.userService.deleteAvatar()
      .subscribe(
        data => {
          this.notifier.success($localize`Avatar deleted.`)

          this.user.updateAccountAvatar()
        },

        (err: HttpErrorResponse) => this.notifier.error(err.message)
      )
  }
}
