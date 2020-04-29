import { Subject, Observable, Subscription } from 'rxjs';
import { map, filter, tap, take } from 'rxjs/operators';
import { Injectable, OnDestroy } from '@hacker-und-koch/di';
import { Logger } from '@hacker-und-koch/logger';


export interface BusEvent<T, K> {
    action: T;
    data: K;
}

@Injectable()
export class Eventbus<T, K> implements OnDestroy {
    private _events: Subject<BusEvent<T, K>> = new Subject();
    private subsciptions: Subscription[] = [];

    public get events(): Observable<BusEvent<T, K>> {
        return this._events.asObservable();
    }

    constructor(private logger: Logger) {
        this.subsciptions.push(
            this._events.subscribe(event =>
                this.logger.spam(`${event.action} >>`, event.data)
            )
        );
    }

    send(event: BusEvent<T, K>) {
        this._events.next(event);
    }

    emit(action: T, data: K) {
        this._events.next({ action, data });
    }

    action(action: T): Observable<K> {
        return this.events
            .pipe(
                filter(event => event.action === action),
                map(event => event.data),
            );
    }

    on(action: T, fn: (data: K) => any): () => void {
        this.logger.info(`registering handler for ${action}`);
        const sub = this.action(action).subscribe(fn);
        this.subsciptions.push(
            sub
        );

        return () => {
            const idx = this.subsciptions.indexOf(sub);
            if (idx > -1) {
                this.subsciptions.splice(idx, 1);
            }
            sub.unsubscribe();
        }
    }

    once(action: T): Promise<K> {
        this.logger.info(`registering handler for one ${action}`);
        return this.action(action)
            .pipe(take(1))
            .toPromise();
    }



    async onDestroy() {
        this.subsciptions.forEach(sub => sub.unsubscribe());
    }
}
