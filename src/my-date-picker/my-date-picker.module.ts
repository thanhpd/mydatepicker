import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgModule } from "@angular/core";
import { MaterialModule } from "@angular/material";
import { MyDatePicker } from "./my-date-picker.component";
import { FocusDirective } from "./directives/my-date-picker.focus.directive";
import { InputAutoFillDirective } from "./directives/my-date-picker.input.auto.fill.directive";

@NgModule({
    imports: [CommonModule, FormsModule, MaterialModule.forRoot()],
    declarations: [MyDatePicker, FocusDirective, InputAutoFillDirective],
    exports: [MyDatePicker, FocusDirective, InputAutoFillDirective]
})
export class MyDatePickerModule {
}
