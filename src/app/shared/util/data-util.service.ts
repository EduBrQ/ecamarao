import { Injectable } from '@angular/core';

@Injectable()
export class DataUtilService {
    readonly TimeZone = 'T00:00:00';

    public converterDateParaStringUs(data: Date, scape = '-'): string {
        if (data) {
            let month = String(data.getMonth() + 1);
            let day = String(data.getDate());
            const year = String(data.getFullYear());
            if (month.length < 2) { month = '0' + month; }
            if (day.length < 2) { day = '0' + day; }
            return `${year}${scape}${month}${scape}${day}`;
        }
    }

    public converterStringParaDate(dateStr: string, scape = '/'): Date {
        const [day, month, year]: string[] = dateStr.split(scape);
        return new Date(parseInt(year, 0), parseInt(month, 0) - 1, parseInt(day, 0));
    }

    public adicionarDias(date: Date, days: number): Date {
        const dateCopy = new Date(date);
        dateCopy.setDate(date.getDate() + days);
        return dateCopy;
    }

    public converterDateHoraParaString(data: Date): string {
        const options = {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric',
            hour12: false,
            timeZone: 'America/Sao_Paulo'
        };

        return new Intl.DateTimeFormat('pt-BR', options).format(data);
    }

    public converterDataParaMilisegundos(data: Date): number {
        if (data) {
            const novaData = this.converterDateParaStringUs(data);
            return Date.parse(novaData + this.TimeZone);
        }
        else {
            return null;
        }

    }

}
