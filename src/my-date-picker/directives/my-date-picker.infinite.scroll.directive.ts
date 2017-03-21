import { Directive, ElementRef, Renderer, AfterViewInit, Input, Output, EventEmitter } from "@angular/core";
import { Observable, Subscription } from "rxjs/Rx";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/pairwise";
import "rxjs/add/operator/map";
import "rxjs/add/operator/filter";
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
    @Input() scrollRange: number = 10;
    @Input() numberOfItems: number = 10;
    @Input() itemSelector: string = ".yearrow";
    @Output() scrollChanged: EventEmitter<IScrollStat> = new EventEmitter<IScrollStat>();
    private scrollEvent$: any;
    private userScrolled$: any;

    private itemHeight: number;
    private defaultOffset: number = 0;

    constructor(private el: ElementRef, private renderer: Renderer) { }

    ngAfterViewInit() {
        // Get height for each item in table
        this.itemHeight = this.el.nativeElement.querySelector(this.itemSelector).offsetHeight;
        this.initialScrolling();

        // Event handling
        this.registerScrollEvent();
        this.streamScrollEvents();
    }

    private registerScrollEvent(): void {
        this.scrollEvent$ = Observable.fromEvent(this.el.nativeElement, "scroll");
    }

    private streamScrollEvents(): void {
        this.userScrolled$ = this.scrollEvent$
            // .debounceTime(10)
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
        return (((position.scrollTop + position.clientHeight) / position.scrollHeight) > ((70 + this.scrollRange) / 100)
            || ((position.scrollTop + position.clientHeight) / position.scrollHeight) < ((70 - this.scrollRange) / 100));
    }

    private scrollChangedHandler(positions: Array<IScrollPosition>): void {
        let newPosition: IScrollPosition = positions[1];
        let prevPosition: IScrollPosition = positions[0];
        let currScrollPercentage: number = (newPosition.scrollTop + newPosition.clientHeight) / newPosition.scrollHeight;

        console.log(`new: ${newPosition.scrollTop}; old: ${prevPosition.scrollTop}`);

        if ((prevPosition.scrollTop < newPosition.scrollTop || newPosition.scrollTop === newPosition.scrollHeight - newPosition.clientHeight) &&
            (newPosition.scrollTop - this.defaultOffset >= this.itemHeight)) {
            console.log("Fetch new years");
            let stat: IScrollStat = { isScrollDown: true, addedRows: Math.floor((newPosition.scrollTop - this.defaultOffset) / this.itemHeight) };
            this.scrollChanged.emit(stat);
        }
        else if ((prevPosition.scrollTop > newPosition.scrollTop || newPosition.scrollTop === 0) &&
            (this.defaultOffset - newPosition.scrollTop >= this.itemHeight)) {
            console.log("Fetch old years");
            let stat: IScrollStat = { isScrollDown: false, addedRows: Math.floor((this.defaultOffset - newPosition.scrollTop) / this.itemHeight) };
            this.scrollChanged.emit(stat);
        }
        console.log("===========");
    }

    // Scroll the view to the middle position, in this case the current view year will be on top of viewport
    private initialScrolling(): void {
        // Get the position for the current yearrow
        let pos = Math.floor(this.numberOfItems / 2);
        this.defaultOffset = this.itemHeight * pos;

        // Scroll the view
        this.el.nativeElement.scrollTop = this.defaultOffset;
    }
}