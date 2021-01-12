import { Component, OnInit } from '@angular/core'
<<<<<<< Updated upstream
import { ActivatedRoute, Router } from '@angular/router'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { AuthService, Notifier } from '@app/core'
import { UserService } from '@app/shared'
=======
import { ActivatedRoute } from '@angular/router'
import { AuthService, Notifier, UserService } from '@app/core'
>>>>>>> Stashed changes

@Component({
  selector: 'my-verify-account-email',
  templateUrl: './verify-account-email.component.html'
})

export class VerifyAccountEmailComponent implements OnInit {
  success = false
  failed = false
  isPendingEmail = false

  private userId: number
  private verificationString: string

  constructor (
    private userService: UserService,
    private authService: AuthService,
    private notifier: Notifier,
<<<<<<< Updated upstream
    private router: Router,
    private route: ActivatedRoute,
    private i18n: I18n
  ) {
=======
    private route: ActivatedRoute
    ) {
>>>>>>> Stashed changes
  }

  ngOnInit () {
    const queryParams = this.route.snapshot.queryParams
    this.userId = queryParams['userId']
    this.verificationString = queryParams['verificationString']
    this.isPendingEmail = queryParams['isPendingEmail'] === 'true'

    if (!this.userId || !this.verificationString) {
      this.notifier.error($localize`Unable to find user id or verification string.`)
    } else {
      this.verifyEmail()
    }
  }

  verifyEmail () {
    this.userService.verifyEmail(this.userId, this.verificationString, this.isPendingEmail)
      .subscribe(
        () => {
          if (this.authService.isLoggedIn()) {
            this.authService.refreshUserInformation()
          }

          this.success = true
        },

        err => {
          this.failed = true

          this.notifier.error(err.message)
        }
      )
  }
}
