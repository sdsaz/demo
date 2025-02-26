import {
    ElementRef,
    Directive,
    Input,
    TemplateRef,
    EventEmitter,
    Renderer2,
    Injector,
    ComponentFactoryResolver,
    ViewContainerRef,
    NgZone,
    OnInit,
    OnDestroy,
    Inject,
    ChangeDetectorRef,
    ApplicationRef,
  } from '@angular/core';
  
  import { DOCUMENT } from '@angular/common';
  import { NgbPopover, NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';
  @Directive({
    selector: '[stickyPopover]',
    exportAs: 'stickyPopover',
  })
  export class StickyPopoverDirective
    extends NgbPopover
    implements OnInit, OnDestroy
  {
    @Input() stickyPopover: TemplateRef<any>;
  
    popoverTitle: string;
  
    placement:
      | 'auto'
      | 'top'
      | 'bottom'
      | 'left'
      | 'right'
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right'
      | 'left-top'
      | 'left-bottom'
      | 'right-top'
      | 'right-bottom'
      | (
          | 'auto'
          | 'top'
          | 'bottom'
          | 'left'
          | 'right'
          | 'top-left'
          | 'top-right'
          | 'bottom-left'
          | 'bottom-right'
          | 'left-top'
          | 'left-bottom'
          | 'right-top'
          | 'right-bottom'
        )[];
  
    triggers: string;
    container: string;
    ngpPopover: TemplateRef<any>;
    canClosePopover: boolean;
  
    toggle(): void {
      super.toggle();
    }
  
    isOpen(): boolean {
      return super.isOpen();
    }
  
    constructor(
      private _elRef: ElementRef,
      private _render: Renderer2,
      injector: Injector,
      viewContainerRef: ViewContainerRef,
      config: NgbPopoverConfig,
      ngZone: NgZone,
      _changeDetectorRef: ChangeDetectorRef,
      _appRef: ApplicationRef,
      @Inject(DOCUMENT) _document: any
    ) {
      super(
        _elRef,
        _render,
        injector,
        viewContainerRef,
        config,
        ngZone,
        _document,
        _changeDetectorRef,
        _appRef
      );
      this.triggers = 'manual';
      this.container = 'body';
      this.placement = 'auto';
    }
  
    ngOnInit(): void {
      super.ngOnInit();
      this.ngbPopover = this.stickyPopover;
  
      this._render.listen(this._elRef.nativeElement, 'mouseenter', (event: Event) => {
        this.canClosePopover = true;
        setTimeout(() => {
          if (this.canClosePopover) {
            this.open();
          }
        },0);
      });
  
      this._render.listen(
        this._elRef.nativeElement,
        'mouseleave',
        (event: Event) => {
          setTimeout(() => {
            if (this.canClosePopover) {
              this.close();
            }
          }, 500);
        }
      );
  
      this._render.listen(this._elRef.nativeElement, 'click', () => {
        this.close();
      });
    }
  
    ngOnDestroy(): void {
      super.ngOnDestroy();
    }
  
    open() {
      super.open();
      setTimeout(() => {
        const popover = window.document.querySelector('.popover');
        this._render.listen(popover, 'mouseover', () => {
          this.canClosePopover = false;
        });
  
        this._render.listen(popover, 'mouseout', () => {
          this.canClosePopover = true;
          setTimeout(() => {
            if (this.canClosePopover) {
              this.close();
            }
          }, 0);
        });
      }, 0);
    }
  
    close() {
      super.close();
    }
  }
  