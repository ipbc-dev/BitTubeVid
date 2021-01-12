import { Component, OnInit, ViewChild, AfterViewChecked } from '@angular/core'
import { Notifier, ServerService } from '@app/core'
import { ContactAdminModalComponent } from '@app/+about/about-instance/contact-admin-modal.component'
<<<<<<< Updated upstream
import { InstanceService } from '@app/shared/instance/instance.service'
=======
import { Notifier } from '@app/core'
import { copyToClipboard } from '../../../root-helpers/utils'
import { InstanceService } from '@app/shared/shared-instance'
>>>>>>> Stashed changes
import { ServerConfig } from '@shared/models'
import { ActivatedRoute } from '@angular/router'
import { ResolverData } from './about-instance.resolver'
import { ViewportScroller } from '@angular/common'

@Component({
  selector: 'my-about-instance',
  templateUrl: './about-instance.component.html',
  styleUrls: [ './about-instance.component.scss' ]
})
export class AboutInstanceComponent implements OnInit, AfterViewChecked {
  @ViewChild('contactAdminModal', { static: true }) contactAdminModal: ContactAdminModalComponent

  shortDescription = ''

  html = {
    description: '',
    terms: '',
    codeOfConduct: '',
    moderationInformation: '',
    administrator: '',
    creationReason: '',
    maintenanceLifetime: '',
    businessModel: '',
    hardwareInformation: ''
  }

  languages: string[] = []
  categories: string[] = []

  serverConfig: ServerConfig

<<<<<<< Updated upstream
=======
  initialized = false

  private lastScrollHash: string

>>>>>>> Stashed changes
  constructor (
    private viewportScroller: ViewportScroller,
    private route: ActivatedRoute,
    private notifier: Notifier,
    private instanceService: InstanceService
  ) {}

  get instanceName () {
    return this.serverConfig.instance.name
  }

  get isContactFormEnabled () {
    return this.serverConfig.email.enabled && this.serverConfig.contactForm.enabled
  }

  get isNSFW () {
    return this.serverConfig.instance.isNSFW
  }

  async ngOnInit () {
    const { about, languages, categories, serverConfig }: ResolverData = this.route.snapshot.data.instanceData

    this.serverConfig = serverConfig

    this.languages = languages
    this.categories = categories

    this.shortDescription = about.instance.shortDescription

    this.html = await this.instanceService.buildHtml(about)

    this.initialized = true
  }

  ngAfterViewChecked () {
<<<<<<< Updated upstream
    if (window.location.hash) this.viewportScroller.scrollToAnchor(window.location.hash.replace('#', ''))
=======
    if (this.initialized && window.location.hash && window.location.hash !== this.lastScrollHash) {
      this.viewportScroller.scrollToAnchor(window.location.hash.replace('#', ''))

      this.lastScrollHash = window.location.hash
    }
>>>>>>> Stashed changes
  }

  openContactModal () {
    return this.contactAdminModal.show()
  }

  onClickCopyLink (anchor: HTMLAnchorElement) {
    const link = anchor.href
    copyToClipboard(link)
    this.notifier.success(link, $localize `Link copied`)
  }
}
