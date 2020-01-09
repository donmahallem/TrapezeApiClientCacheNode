/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import {
    PositionType,
    TrapezeApiClient,
} from "@donmahallem/trapeze-api-client";
import {
    IVehicleLocation,
    IVehicleLocationList,
    TripId,
    VehicleId,
} from "@donmahallem/trapeze-api-types";
import { LockHandler } from "./lock-handler";
import { NotFoundError } from "./not-found-error";
import { TimestampedVehiclelocation } from "./timestamped-location";
import { VehicleDb } from "./vehicle-db";

export enum Status {
    SUCCESS = 1,
    ERROR = 2,
}

export interface IBaseStatus {
    status: Status;
    lastUpdate: number;
    timestamp: number;
}

export interface IErrorStatus extends IBaseStatus {
    status: Status.ERROR;
    error: any;
}

export interface ISuccessStatus extends IBaseStatus {
    status: Status.SUCCESS;
}

export type LoadStatus = ISuccessStatus | IErrorStatus;

export interface IVehicleLocationResponse {
    lastUpdate: number;
    vehicle: IVehicleLocation;
}

export class VehicleStorage {

    private lock: LockHandler = new LockHandler(false);
    private mStatus: LoadStatus;
    private mDb: VehicleDb;
    constructor(private trapezeClient: TrapezeApiClient, private updateDelay: number = 10000, ttl: number = 0) {
        this.mDb = new VehicleDb(ttl);
    }

    /**
     * Returns the underlying db
     */
    public get db(): VehicleDb {
        return this.mDb;
    }

    public updateRequired(): boolean {
        if (this.status && this.status.timestamp !== undefined) {
            if (!isNaN(this.status.timestamp)) {
                return this.status.timestamp + this.updateDelay < Date.now();
            }
        }
        return true;
    }

    public get status(): LoadStatus {
        return this.mStatus;
    }

    public fetch(positionType: PositionType = "RAW"): Promise<LoadStatus> {
        if (!this.updateRequired()) {
            return Promise.resolve(this.status);
        }
        if (this.lock.locked) {
            return this.lock.promise().then(() => this.status);
        }
        this.lock.locked = true;
        return this.trapezeClient.getVehicleLocations(positionType, this.mStatus.lastUpdate)
            .then((result: IVehicleLocationList): ISuccessStatus => {
                this.mDb.addResponse(result);
                return {
                    lastUpdate: result.lastUpdate,
                    status: Status.SUCCESS,
                    timestamp: Date.now(),
                };
            })
            .catch((err: any): IErrorStatus =>
                ({
                    error: err,
                    lastUpdate: (this.mStatus && this.mStatus.lastUpdate) ? this.mStatus.lastUpdate : 0,
                    status: Status.ERROR,
                    timestamp: Date.now(),
                }))
            .then((loadStatus: LoadStatus): LoadStatus => {
                loadStatus.timestamp = Date.now();
                this.mStatus = loadStatus;
                this.lock.locked = false;
                return loadStatus;
            });
    }

    /**
     * Gets the vehicle or rejects with undefined if not known
     */
    public getVehicleByTripId(id: TripId): Promise<TimestampedVehiclelocation> {
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): TimestampedVehiclelocation => {
                const loc: TimestampedVehiclelocation | undefined = this.mDb.getVehicleByTripId(id);
                if (loc) {
                    return loc;
                }
                throw new NotFoundError("Trip not found");
            });
    }
    /**
     * Fetches or throws if an error status is provided
     * @since 1.0.0
     */
    public fetchSuccessOrThrow(): Promise<ISuccessStatus> {
        return this.fetch()
            .then((value: LoadStatus): ISuccessStatus => {
                if (value) {
                    if (value.status === Status.SUCCESS) {
                        return value;
                    }
                    throw value.error;
                }
                throw new Error("No status provided");
            });
    }

    /**
     * Gets the vehicle or rejects with undefined if not known
     */
    public getVehicle(id: VehicleId): Promise<TimestampedVehiclelocation> {
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): TimestampedVehiclelocation => {
                const location: TimestampedVehiclelocation | undefined = this.mDb
                    .getVehicleById(id);
                if (location) {
                    return location;
                }
                throw new NotFoundError("Vehicle not found");
            });
    }

    /**
     * @since 1.0.0
     * @param left
     * @param right
     * @param top
     * @param bottom
     * @param since
     */
    public getVehicles(left: number,
                       right: number,
                       top: number,
                       bottom: number,
                       lastUpdate: number = 0): Promise<IVehicleLocationList> {
        if (left >= right) {
            return Promise.reject(new Error("left must be smaller than right"));
        }
        if (top <= bottom) {
            return Promise.reject(new Error("top must be greater than bottom"));
        }
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocationList => {
                const vehicles: TimestampedVehiclelocation[] = this.mDb
                    .getVehiclesIn(left, right, top, bottom, lastUpdate);
                return {
                    lastUpdate: status.lastUpdate,
                    vehicles,
                };
            });
    }

    /**
     * @since 1.1.0
     * @param since
     */
    public getAllVehicles(lastUpdate: number = 0): Promise<IVehicleLocationList> {
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocationList => {
                const vehicles: TimestampedVehiclelocation[] = this.mDb
                    .getVehicles(lastUpdate);
                return {
                    lastUpdate: status.lastUpdate,
                    vehicles,
                };
            });
    }

}
