import { Directive, ElementRef, Renderer, AfterViewInit, Input } from "@angular/core";
import { Observable, Subscription } from "rxjs/Rx";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/pairwise";
import "rxjs/add/operator/map";
import "rxjs/add/operator/exhaustMap";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/startWith";
import { IScrollPosition } from "../interfaces/scroll-position.interface";

const DEFAULT_SCROLL_POSITION: IScrollPosition = {
    scrollHeight: 0,
    scrollTop: 0,
    clientHeight: 0
}

@Directive({
    selector: "[mydpinfinitescroll]"
})

export class InfiniteScrollDirective implements AfterViewInit {
    @Input() scrollRange = 10;

    private scrollEvent$: any;
    private userScrolled$: any;

    constructor(private el: ElementRef, private renderer: Renderer) { }

    ngAfterViewInit() {
        this.el.nativeElement.scrollTop = 455;
        this.registerScrollEvent();
        this.streamScrollEvents();
    }

    private registerScrollEvent(): void {
        this.scrollEvent$ = Observable.fromEvent(this.el.nativeElement, "scroll");
    }

    private streamScrollEvents(): void {
        this.userScrolled$ = this.scrollEvent$
            .debounceTime(100)
            .map((e: any): IScrollPosition => ({
                scrollHeight: e.target.scrollHeight,
                scrollTop: e.target.scrollTop,
                clientHeight: e.target.clientHeight
            }))
            .pairwise()
            .filter((positions: Array<IScrollPosition>) => this.isScrollingDown(positions));
    }

    private isScrollingDown(positions: Array<IScrollPosition>): boolean {
        console.log(`${positions[0].scrollTop} & ${positions[1].scrollTop}`);
        return positions[0].scrollTop < positions[1].scrollTop;
    }

    private isScrollOutsideRange(position: IScrollPosition): boolean {
        return (((position.scrollTop + position.clientHeight) / position.scrollHeight) > ((50 + this.scrollRange) / 100)
            || ((position.scrollTop + position.clientHeight) / position.scrollHeight) < ((50 - this.scrollRange) / 100));
    }
}