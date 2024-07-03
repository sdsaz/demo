import { DOCUMENT } from '@angular/common';
import { Directive } from '@angular/core';
import {
  AfterViewInit,
  EventEmitter,
  Inject,
  OnDestroy,
  Output,
} from '@angular/core';
import { filter, fromEvent, Subscription } from 'rxjs';

@Directive({
  selector: '[clickOutsideFilter]',
})
export class ClickOutsideFilterDirective implements AfterViewInit, OnDestroy {
  @Output() clickOutside = new EventEmitter<void>();

  documentClickSubscription: Subscription | undefined;

  constructor(@Inject(DOCUMENT) private document: Document) 
  { }

  ngAfterViewInit(): void {
    this.documentClickSubscription = fromEvent(this.document, 'click')
      .pipe(
        filter((event) => {
          return !this.isInside(event.target as HTMLElement);
        })
      )
      .subscribe(() => {
        this.clickOutside.emit();
      });
  }

  ngOnDestroy(): void {
    this.documentClickSubscription?.unsubscribe();
  }

  isInside(elementToCheck: HTMLElement): boolean {
    return (
      elementToCheck.id == "btn-show-filters" || elementToCheck.id == "i-show-filters" || elementToCheck.id == "span-show-filters" ||
      elementToCheck.id == "dynamic-filter" || elementToCheck.classList.contains('p-datepicker-prev-icon') || elementToCheck.classList.contains('p-datepicker-prev')
      || elementToCheck.classList.contains('p-datepicker-next-icon') || elementToCheck.classList.contains('p-datepicker-next') ||
      (this.document.getElementById('dynamic-filter') as HTMLElement).contains(elementToCheck)
    );
  }
}
