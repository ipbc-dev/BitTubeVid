import { Component, Input } from '@angular/core'
import { Notifier } from '@app/core'
<<<<<<< Updated upstream
import { I18n } from '@ngx-translate/i18n-polyfill'
import { RedundancyService } from '@app/shared/video/redundancy.service'
=======
import { RedundancyService } from '@app/shared/shared-main'
>>>>>>> Stashed changes

@Component({
  selector: 'my-redundancy-checkbox',
  templateUrl: './redundancy-checkbox.component.html',
  styleUrls: [ './redundancy-checkbox.component.scss' ]
})
export class RedundancyCheckboxComponent {
  @Input() redundancyAllowed: boolean
  @Input() host: string

  constructor (
    private notifier: Notifier,
    private redundancyService: RedundancyService
    ) { }

  updateRedundancyState () {
    this.redundancyService.updateRedundancy(this.host, this.redundancyAllowed)
        .subscribe(
          () => {
            const stateLabel = this.redundancyAllowed ? $localize`enabled` : $localize`disabled`

            this.notifier.success($localize`Redundancy for ${this.host} is ${stateLabel}`)
          },

          err => this.notifier.error(err.message)
        )
  }
}
