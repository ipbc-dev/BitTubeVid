import { Component, OnInit } from '@angular/core'
<<<<<<< Updated upstream
import { ConfirmService, Notifier } from '@app/core'
import { SortMeta } from 'primeng/api'
import { ActorFollow } from '../../../../../../shared/models/actors/follow.model'
import { RestPagination, RestTable } from '../../../shared'
import { FollowService } from '@app/shared/instance/follow.service'
import { I18n } from '@ngx-translate/i18n-polyfill'
=======
import { ConfirmService, Notifier, RestPagination, RestTable } from '@app/core'
import { InstanceFollowService } from '@app/shared/shared-instance'
import { ActorFollow } from '@shared/models'
>>>>>>> Stashed changes

@Component({
  selector: 'my-followers-list',
  templateUrl: './followers-list.component.html',
  styleUrls: [ '../follows.component.scss', './followers-list.component.scss' ]
})
export class FollowersListComponent extends RestTable implements OnInit {
  followers: ActorFollow[] = []
  totalRecords = 0
  sort: SortMeta = { field: 'createdAt', order: -1 }
  pagination: RestPagination = { count: this.rowsPerPage, start: 0 }

  constructor (
    private confirmService: ConfirmService,
    private notifier: Notifier,
<<<<<<< Updated upstream
    private i18n: I18n,
    private followService: FollowService
=======
    private followService: InstanceFollowService
>>>>>>> Stashed changes
  ) {
    super()
  }

  ngOnInit () {
    this.initialize()
  }

  getIdentifier () {
    return 'FollowersListComponent'
  }

  acceptFollower (follow: ActorFollow) {
    follow.state = 'accepted'

    this.followService.acceptFollower(follow)
      .subscribe(
        () => {
          const handle = follow.follower.name + '@' + follow.follower.host
          this.notifier.success($localize`${handle} accepted in instance followers`)
        },

        err => {
          follow.state = 'pending'
          this.notifier.error(err.message)
        }
      )
  }

  async rejectFollower (follow: ActorFollow) {
    const message = $localize`Do you really want to reject this follower?`
    const res = await this.confirmService.confirm(message, $localize`Reject`)
    if (res === false) return

    this.followService.rejectFollower(follow)
        .subscribe(
          () => {
            const handle = follow.follower.name + '@' + follow.follower.host
            this.notifier.success($localize`${handle} rejected from instance followers`)

            this.loadData()
          },

          err => {
            follow.state = 'pending'
            this.notifier.error(err.message)
          }
        )
  }

  async deleteFollower (follow: ActorFollow) {
    const message = $localize`Do you really want to delete this follower?`
    const res = await this.confirmService.confirm(message, $localize`Delete`)
    if (res === false) return

    this.followService.removeFollower(follow)
        .subscribe(
          () => {
            const handle = follow.follower.name + '@' + follow.follower.host
            this.notifier.success($localize`${handle} removed from instance followers`)

            this.loadData()
          },

          err => this.notifier.error(err.message)
        )
  }

  protected loadData () {
    this.followService.getFollowers({ pagination: this.pagination, sort: this.sort, search: this.search })
                      .subscribe(
                        resultList => {
                          this.followers = resultList.data
                          this.totalRecords = resultList.total
                        },

                        err => this.notifier.error(err.message)
                      )
  }
}
