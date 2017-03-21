import { Directive, ElementRef, Renderer, AfterViewInit, Input, Output, EventEmitter } from "@angular/core";
import { Observable, Subscription } from "rxjs/Rx";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/pairwise";
import "rxjs/add/operator/map";
import "rxjs/add/operator/exhaustMap";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/startWith";
import { IScrollPosition } from "../interfaces/my-scroll-position.interface";
import { IScrollStat } from "../interfaces/my-scroll-stat.interface";

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
    @Output() scrollChanged: EventEmitter<IScrollStat> = new EventEmitter<IScrollStat>();
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
            .subscribe((positions: Array<IScrollPosition>) => this.scrollChangedHandler(positions));
    }

    private isScrollingDown(positions: Array<IScrollPosition>): boolean {
        console.log(`${positions[0].scrollTop} & ${positions[1].scrollTop}`);
        return positions[0].scrollTop < positions[1].scrollTop;
    }

    private isScrollOutsideRange(position: IScrollPosition): boolean {
        return (((position.scrollTop + position.clientHeight) / position.scrollHeight) > ((50 + this.scrollRange) / 100)
            || ((position.scrollTop + position.clientHeight) / position.scrollHeight) < ((50 - this.scrollRange) / 100));
    }

    private scrollChangedHandler(positions: Array<IScrollPosition>): void {
        console.log(positions);
        let newPosition: IScrollPosition = positions[1];
        let prevPosition: IScrollPosition = positions[0];
        if (this.isScrollingDown(positions) && this.isScrollOutsideRange(newPosition)) {
            console.log("Fetch new years");
            let stat: IScrollStat = { isScrollDown: true, addedRows: 5};
            this.scrollChanged.emit(stat);
        } else if (!this.isScrollingDown(positions) && this.isScrollOutsideRange(newPosition)) {
            console.log("Fetch old years");
            let stat: IScrollStat = { isScrollDown: false, addedRows: 5};
            this.scrollChanged.emit(stat);
        }
    }
}