<<<<<<< Updated upstream:client/src/app/+my-account/my-account-subscriptions/my-account-subscriptions.component.ts
=======
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
>>>>>>> Stashed changes:client/src/app/+my-library/my-subscriptions/my-subscriptions.component.ts
import { Component, OnInit } from '@angular/core'
import { Notifier } from '@app/core'
import { VideoChannel } from '@app/shared/video-channel/video-channel.model'
import { UserSubscriptionService } from '@app/shared/user-subscription'
import { ComponentPagination } from '@app/shared/rest/component-pagination.model'
import { Subject } from 'rxjs'

@Component({
  templateUrl: './my-subscriptions.component.html',
  styleUrls: [ './my-subscriptions.component.scss' ]
})
export class MySubscriptionsComponent implements OnInit {
  videoChannels: VideoChannel[] = []

  pagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: null
  }

  onDataSubject = new Subject<any[]>()

  subscriptionsSearch: string
  subscriptionsSearchChanged = new Subject<string>()

  constructor (
    private userSubscriptionService: UserSubscriptionService,
    private notifier: Notifier
  ) {}

  ngOnInit () {
    this.loadSubscriptions()

    this.subscriptionsSearchChanged
      .pipe(debounceTime(500))
      .subscribe(() => {
        this.pagination.currentPage = 1
        this.loadSubscriptions(false)
      })
  }

  resetSearch () {
    this.subscriptionsSearch = ''
    this.onSubscriptionsSearchChanged()
  }

  onSubscriptionsSearchChanged () {
    this.subscriptionsSearchChanged.next()
  }

  onNearOfBottom () {
    // Last page
    if (this.pagination.totalItems <= (this.pagination.currentPage * this.pagination.itemsPerPage)) return

    this.pagination.currentPage += 1
    this.loadSubscriptions()
  }

  private loadSubscriptions (more = true) {
    this.userSubscriptionService.listSubscriptions({ pagination: this.pagination, search: this.subscriptionsSearch })
        .subscribe(
          res => {
            this.videoChannels = more
              ? this.videoChannels.concat(res.data)
              : res.data
            this.pagination.totalItems = res.total

            this.onDataSubject.next(res.data)
          },

          error => this.notifier.error(error.message)
        )
  }
}
