import { Component, OnInit, ViewChild } from '@angular/core'
<<<<<<< Updated upstream:client/src/app/+my-account/my-account-ownership/my-account-ownership.component.ts
import { Notifier } from '@app/core'
import { RestPagination, RestTable } from '@app/shared'
import { SortMeta } from 'primeng/api'
import { VideoChangeOwnership } from '../../../../../shared'
import { VideoOwnershipService } from '@app/shared/video-ownership'
import { Account } from '@app/shared/account/account.model'
import { MyAccountAcceptOwnershipComponent } from './my-account-accept-ownership/my-account-accept-ownership.component'

@Component({
  selector: 'my-account-ownership',
  templateUrl: './my-account-ownership.component.html'
=======
import { Notifier, RestPagination, RestTable } from '@app/core'
import { Account, VideoOwnershipService } from '@app/shared/shared-main'
import { VideoChangeOwnership, VideoChangeOwnershipStatus } from '@shared/models'
import { MyAcceptOwnershipComponent } from './my-accept-ownership/my-accept-ownership.component'

@Component({
  templateUrl: './my-ownership.component.html',
  styleUrls: [ './my-ownership.component.scss' ]
>>>>>>> Stashed changes:client/src/app/+my-library/my-ownership/my-ownership.component.ts
})
export class MyOwnershipComponent extends RestTable implements OnInit {
  videoChangeOwnerships: VideoChangeOwnership[] = []
  totalRecords = 0
  sort: SortMeta = { field: 'createdAt', order: -1 }
  pagination: RestPagination = { count: this.rowsPerPage, start: 0 }

  @ViewChild('myAcceptOwnershipComponent', { static: true }) myAccountAcceptOwnershipComponent: MyAcceptOwnershipComponent

  constructor (
    private notifier: Notifier,
    private videoOwnershipService: VideoOwnershipService
  ) {
    super()
  }

  ngOnInit () {
    this.initialize()
  }

  getIdentifier () {
    return 'MyOwnershipComponent'
  }

  getStatusClass (status: VideoChangeOwnershipStatus) {
    switch (status) {
      case VideoChangeOwnershipStatus.ACCEPTED:
        return 'badge-green'
      case VideoChangeOwnershipStatus.REFUSED:
        return 'badge-red'
      default:
        return 'badge-yellow'
    }
  }

<<<<<<< Updated upstream:client/src/app/+my-account/my-account-ownership/my-account-ownership.component.ts
  createByString (account: Account) {
    return Account.CREATE_BY_STRING(account.name, account.host)
=======
  switchToDefaultAvatar ($event: Event) {
    ($event.target as HTMLImageElement).src = Account.GET_DEFAULT_AVATAR_URL()
>>>>>>> Stashed changes:client/src/app/+my-library/my-ownership/my-ownership.component.ts
  }

  openAcceptModal (videoChangeOwnership: VideoChangeOwnership) {
    this.myAccountAcceptOwnershipComponent.show(videoChangeOwnership)
  }

  accepted () {
    this.loadData()
  }

  refuse (videoChangeOwnership: VideoChangeOwnership) {
    this.videoOwnershipService.refuseOwnership(videoChangeOwnership.id)
      .subscribe(
        () => this.loadData(),
        err => this.notifier.error(err.message)
      )
  }

  protected loadData () {
    return this.videoOwnershipService.getOwnershipChanges(this.pagination, this.sort)
      .subscribe(
        resultList => {
          this.videoChangeOwnerships = resultList.data
          this.totalRecords = resultList.total
        },

        err => this.notifier.error(err.message)
      )
  }
}
