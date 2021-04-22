
import { SelectOptionsItem } from 'src/types/select-options-item.model'
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { ServerConfig } from '@shared/models'
import { ConfigService } from '../shared/config.service'
import { EditConfigurationService, ResolutionOption } from './edit-configuration.service'

@Component({
  selector: 'my-edit-premium-storage-configuration',
  templateUrl: './edit-premium-storage.component.html',
  styleUrls: [ './edit-custom-config.component.scss' ]
})
export class EditPremiumStorageConfiguration implements OnInit, OnChanges {
  @Input() form: FormGroup
  @Input() formErrors: any
  @Input() serverConfig: ServerConfig
 
  transcodingThreadOptions: SelectOptionsItem[] = []
  transcodingProfiles: SelectOptionsItem[] = []

  liveMaxDurationOptions: SelectOptionsItem[] = []
  liveResolutions: ResolutionOption[] = []

  constructor (
    private configService: ConfigService,
    private editConfigurationService: EditConfigurationService
  ) { }

  ngOnInit () {
    this.transcodingThreadOptions = this.configService.transcodingThreadOptions

    this.liveMaxDurationOptions = [
      { id: -1, label: $localize`No limit` },
      { id: 1000 * 3600, label: $localize`1 hour` },
      { id: 1000 * 3600 * 3, label: $localize`3 hours` },
      { id: 1000 * 3600 * 5, label: $localize`5 hours` },
      { id: 1000 * 3600 * 10, label: $localize`10 hours` }
    ]

    this.liveResolutions = this.editConfigurationService.getLiveResolutions()
  }

  ngOnChanges (changes: SimpleChanges) {
    if (changes['serverConfig']) {
      // this.transcodingProfiles = this.buildAvailableTranscodingProfile()
    }
  }
}