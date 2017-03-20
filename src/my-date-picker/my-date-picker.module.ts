import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgModule } from "@angular/core";
import { MaterialModule } from "@angular/material";
import { MyDatePicker } from "./my-date-picker.component";
import { FocusDirective } from "./directives/my-date-picker.focus.directive";
import { InputAutoFillDirective } from "./directives/my-date-picker.input.auto.fill.directive";
import { InfiniteScrollDirective } from "./directives/my-date-picker.infinite.scroll.directive";


@NgModule({
    imports: [CommonModule, FormsModule, MaterialModule.forRoot()],
    declarations: [MyDatePicker, FocusDirective, InputAutoFillDirective, InfiniteScrollDirective],
    exports: [MyDatePicker, FocusDirective, InputAutoFillDirective, InfiniteScrollDirective]
})
export class MyDatePickerModule {
}
