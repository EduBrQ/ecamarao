import { Component, Input, OnChanges } from '@angular/core';

@Component({
    selector: 'app-popover',
    templateUrl: './popover.component.html',
    styleUrls: ['./popover.component.css']
})
export class PopoverComponent implements OnChanges {
    @Input() itens = [];

    constructor() { }

    ngOnChanges(_changes): void {
        this.setItens();
    }

    setItens() {

        const array = [];
        if (this.itens !== null && this.itens.length > 0) {
            if (this.itens[0].nome) {
                if (this.itens !== null) {
                    array.length = this.itens.length - 1;
                    for (let index = 0; index < array.length; index++) {
                        array[index] = this.itens[index + 1].nome;
                    }
                    this.itens = array;
                }
            } else {
                array.length = this.itens.length - 1;
                for (let index = 0; index < array.length; index++) {
                    array[index] = this.itens[index + 1];
                }
                this.itens = array;
            }
        }

    }
}
