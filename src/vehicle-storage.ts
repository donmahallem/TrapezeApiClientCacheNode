/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import {
    TrapezeApiClient,
    PositionType
} from "@donmahallem/trapeze-api-client";
import { IVehicleLocationExtended } from "@donmahallem/trapeze-api-client-types";
import {
    IVehicleLocation,
    IVehicleLocationList,
    VehicleId,
    TripId
} from "@donmahallem/trapeze-api-types";
import { LockHandler } from "./lock-handler";
import { NotFoundError } from "./not-found-error";
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
            .catch((err: any): IErrorStatus => {
                return {
                    error: err,
                    lastUpdate: this.mStatus.lastUpdate,
                    status: Status.ERROR,
                    timestamp: Date.now()
                };
            })
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
    public getVehicleByTripId(id: TripId): Promise<IVehicleLocationExtended> {
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocationExtended => {
                const loc: IVehicleLocationExtended = this.mDb.getVehicleByTripId(id);
                if (loc)
                    return loc;
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
    public getVehicle(id: VehicleId): Promise<IVehicleLocationExtended> {
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocationExtended => {
                const location: IVehicleLocationExtended | undefined = this.mDb
                    .getVehicleById(id);
                if (location)
                    return location;
                throw new NotFoundError("Vehicle not found");
            });
    }

    /**
     * @since 1.0.0
     * @param left
     * @param right
     * @param top
     * @param bottom
     */
    public getVehicles(left: number, right: number, top: number, bottom: number): Promise<IVehicleLocationList> {
        if (left >= right) {
            return Promise.reject(new Error("left must be smaller than right"));
        }
        if (top <= bottom) {
            return Promise.reject(new Error("top must be greater than bottom"));
        }
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocationList => {
                const vehicleList: IVehicleLocationList = {
                    lastUpdate: status.lastUpdate,
                    vehicles: new Array(),
                };
                for (const key of Array.from(status.storage.keys())) {
                    const vehicle: IVehicleLocation = status.storage.get(key) as IVehicleLocation;
                    if (vehicle.longitude < left || vehicle.longitude > right) {
                        continue;
                    } else if (vehicle.latitude > top || vehicle.latitude < bottom) {
                        continue;
                    } else {
                        vehicleList.vehicles.push(vehicle);
                    }
                }
                return vehicleList;
            });
    }

}
