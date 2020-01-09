/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

export type LockListener = () => void;

export class LockHandler {
    private lockListeners: LockListener[] = [];

    public constructor(private mLocked: boolean = false) {

    }

    public addListener(lockListener: LockListener): void {
        if (!this.mLocked) {
            lockListener();
            return;
        }
        this.lockListeners.push(lockListener);
    }

    public set locked(l: boolean) {
        if (!l) {
            this.releaseLocks();
        }
        this.mLocked = l;
    }

    public get locked(): boolean {
        return this.mLocked;
    }

    public releaseLocks(): void {
        for (const l of this.lockListeners) {
            l();
        }
        this.lockListeners = [];
    }

    public promise(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.addListener(resolve);
        });
    }
}
