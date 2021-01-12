import { Component, OnDestroy, OnInit } from '@angular/core'
<<<<<<< Updated upstream
import { Account } from '@app/shared/account/account.model'
import { AccountService } from '@app/shared/account/account.service'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { Subscription } from 'rxjs'
import { MarkdownService } from '@app/shared/renderer'
=======
import { MarkdownService } from '@app/core'
import { Account, AccountService } from '@app/shared/shared-main'
>>>>>>> Stashed changes

@Component({
  selector: 'my-account-about',
  templateUrl: './account-about.component.html',
  styleUrls: [ './account-about.component.scss' ]
})
export class AccountAboutComponent implements OnInit, OnDestroy {
  account: Account
  descriptionHTML = ''

  private accountSub: Subscription

  constructor (
    private accountService: AccountService,
    private markdownService: MarkdownService
  ) { }

  ngOnInit () {
    // Parent get the account for us
    this.accountSub = this.accountService.accountLoaded
      .subscribe(async account => {
        this.account = account
        this.descriptionHTML = await this.markdownService.textMarkdownToHTML(this.account.description, true)
      })
  }

  ngOnDestroy () {
    if (this.accountSub) this.accountSub.unsubscribe()
  }

  getAccountDescription () {
    if (this.descriptionHTML) return this.descriptionHTML

    return $localize`No description`
  }
}
