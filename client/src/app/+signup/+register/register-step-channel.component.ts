import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { AuthService } from '@app/core'
import { FormReactive, UserService, VideoChannelValidatorsService } from '@app/shared'
import { FormValidatorService } from '@app/shared/forms/form-validators/form-validator.service'
import { FormGroup } from '@angular/forms'
<<<<<<< Updated upstream
import { pairwise } from 'rxjs/operators'
import { concat, of } from 'rxjs'
=======
import { UserService } from '@app/core'
import { VIDEO_CHANNEL_DISPLAY_NAME_VALIDATOR, VIDEO_CHANNEL_NAME_VALIDATOR } from '@app/shared/form-validators/video-channel-validators'
import { FormReactive, FormValidatorService } from '@app/shared/shared-forms'
>>>>>>> Stashed changes

@Component({
  selector: 'my-register-step-channel',
  templateUrl: './register-step-channel.component.html',
  styleUrls: [ './register.component.scss' ]
})
export class RegisterStepChannelComponent extends FormReactive implements OnInit {
  @Input() username: string
  @Output() formBuilt = new EventEmitter<FormGroup>()

  constructor (
    protected formValidatorService: FormValidatorService,
<<<<<<< Updated upstream
    private authService: AuthService,
    private userService: UserService,
    private videoChannelValidatorsService: VideoChannelValidatorsService
=======
    private userService: UserService
>>>>>>> Stashed changes
  ) {
    super()
  }

  get instanceHost () {
    return window.location.host
  }

  ngOnInit () {
    this.buildForm({
      displayName: VIDEO_CHANNEL_DISPLAY_NAME_VALIDATOR,
      name: VIDEO_CHANNEL_NAME_VALIDATOR
    })

    setTimeout(() => this.formBuilt.emit(this.form))

    concat(
      of(''),
      this.form.get('displayName').valueChanges
    ).pipe(pairwise())
     .subscribe(([ oldValue, newValue ]) => this.onDisplayNameChange(oldValue, newValue))
  }

  isSameThanUsername () {
    return this.username && this.username === this.form.value['name']
  }

  private onDisplayNameChange (oldDisplayName: string, newDisplayName: string) {
    const name = this.form.value['name'] || ''

    const newName = this.userService.getNewUsername(oldDisplayName, newDisplayName, name)
    this.form.patchValue({ name: newName })
  }
}
