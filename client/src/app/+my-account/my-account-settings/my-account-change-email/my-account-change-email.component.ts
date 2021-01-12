import { Component, OnInit } from '@angular/core'
<<<<<<< Updated upstream
import { AuthService, Notifier, ServerService } from '@app/core'
import { FormReactive, UserService } from '../../../shared'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { FormValidatorService } from '@app/shared/forms/form-validators/form-validator.service'
import { UserValidatorsService } from '@app/shared/forms/form-validators/user-validators.service'
import { User } from '../../../../../../shared'
import { tap } from 'rxjs/operators'
import { forkJoin } from 'rxjs'
=======
import { AuthService, ServerService, UserService } from '@app/core'
import { USER_EMAIL_VALIDATOR, USER_PASSWORD_VALIDATOR } from '@app/shared/form-validators/user-validators'
import { FormReactive, FormValidatorService } from '@app/shared/shared-forms'
import { User } from '@shared/models'
>>>>>>> Stashed changes

@Component({
  selector: 'my-account-change-email',
  templateUrl: './my-account-change-email.component.html',
  styleUrls: [ './my-account-change-email.component.scss' ]
})
export class MyAccountChangeEmailComponent extends FormReactive implements OnInit {
  error: string = null
  success: string = null
  user: User = null

  constructor (
    protected formValidatorService: FormValidatorService,
<<<<<<< Updated upstream
    private userValidatorsService: UserValidatorsService,
    private notifier: Notifier,
=======
>>>>>>> Stashed changes
    private authService: AuthService,
    private userService: UserService,
    private serverService: ServerService
  ) {
    super()
  }

  ngOnInit () {
    this.buildForm({
      'new-email': USER_EMAIL_VALIDATOR,
      'password': USER_PASSWORD_VALIDATOR
    })

    this.user = this.authService.getUser()
  }

  changeEmail () {
    this.error = null
    this.success = null

    const password = this.form.value[ 'password' ]
    const email = this.form.value[ 'new-email' ]

    forkJoin([
      this.serverService.getConfig(),
      this.userService.changeEmail(password, email)
    ]).pipe(tap(() => this.authService.refreshUserInformation()))
      .subscribe(
        ([ config ]) => {
          this.form.reset()

          if (config.signup.requiresEmailVerification) {
            this.success = $localize`Please check your emails to verify your new email.`
          } else {
            this.success = $localize`Email updated.`
          }
        },

        err => {
          if (err.status === 401) {
            this.error = $localize`You current password is invalid.`
            return
          }

          this.error = err.message
        }
      )
  }
}
