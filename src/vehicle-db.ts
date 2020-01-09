/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import {
    IVehicleLocation,
    IVehicleLocationList,
    TripId,
    VehicleId,
} from "@donmahallem/trapeze-api-types";
import {
    TimestampedVehiclelocation,
    TimestampedVehiclelocations,
} from "./timestamped-location";

type VehicleIdMap = Map<VehicleId, TimestampedVehiclelocation>;
export class VehicleDb {
    private mVehicles: TimestampedVehiclelocation[] = [];
    private mLastUpdate: number = 0;
    public constructor(public ttl: number = 0) {

    }
    public get lastUpdate(): number {
        return this.mLastUpdate;
    }
    /**
     *
     * @param vehicleResponse
     * @since 3.0.0
     */
    public convertResponse(vehicleResponse: IVehicleLocationList): TimestampedVehiclelocations[] {
        if (vehicleResponse && vehicleResponse.vehicles) {
            return vehicleResponse
                .vehicles
                .filter((value: IVehicleLocation): boolean => {
                    if (value === null || value === undefined) {
                        return false;
                    }
                    return value.id ? true : false;
                })
                .map((value: IVehicleLocation): TimestampedVehiclelocations => {
                    if ("latitude" in value !== "longitude" in value) {
                        return {
                            id: value.id,
                            isDeleted: true,
                            lastUpdate: vehicleResponse.lastUpdate,
                        };
                    }
                    return Object.assign({
                        lastUpdate: vehicleResponse.lastUpdate,
                    }, value);
                });
        }
        return [];
    }
    /**
     *
     * @param resp
     * @since 3.0.0
     */
    public addResponse(resp: IVehicleLocationList): void {
        this.addAll(this.convertResponse(resp));
    }
    /**
     *
     * @param locations
     * @since 3.0.0
     */
    public addAll(locations: TimestampedVehiclelocations[]): void {
        const dataMap: VehicleIdMap = (this.mVehicles as TimestampedVehiclelocations[]).concat(locations)
            .reduce<VehicleIdMap>((prev: VehicleIdMap, cur: TimestampedVehiclelocation): VehicleIdMap => {
                if (prev.has(cur.id)) {
                    const curEntry: TimestampedVehiclelocation | undefined = prev.get(cur.id);
                    if (curEntry && curEntry.lastUpdate >= cur.lastUpdate) {
                        return prev;
                    } else if (cur.isDeleted === true) {
                        prev.delete(cur.id);
                        return prev;
                    }
                } else if (cur.isDeleted === true) {
                    return prev;
                }
                if (this.ttl <= 0 || cur.lastUpdate + this.ttl >= Date.now()) {
                    prev.set(cur.id, cur);
                }
                return prev;
            }, new Map<VehicleId, TimestampedVehiclelocation>());
        this.mVehicles = Array.from(dataMap.values());
        this.mLastUpdate = this.mVehicles
            .reduce((prev: number, cur: TimestampedVehiclelocation): number =>
                Math.max(prev, cur.lastUpdate), 0);

    }

    /**
     *
     * @param id
     * @since 3.0.0
     */
    public getVehicleById(id: VehicleId): TimestampedVehiclelocation | undefined {
        const idx: number = this.mVehicles.findIndex((value: TimestampedVehiclelocation): boolean =>
            value.id === id);
        return idx < 0 ? undefined : this.mVehicles[idx];
    }
    /**
     *
     * @param id
     * @since 3.0.0
     */
    public getVehicleByTripId(id: TripId): TimestampedVehiclelocation | undefined {
        const idx: number = this.mVehicles.findIndex((value: TimestampedVehiclelocation): boolean =>
            (value.tripId === id));
        return idx < 0 ? undefined : this.mVehicles[idx] as TimestampedVehiclelocation;
    }

    /**
     *
     * @param since
     * @since 3.0.0
     */
    public getVehicles(since: number = 0): TimestampedVehiclelocation[] {
        return this.mVehicles
            .filter((vehicle: TimestampedVehiclelocation): boolean =>
                vehicle.lastUpdate >= since);
    }
    /**
     *
     * @param left
     * @param right
     * @param top
     * @param bottom
     * @param since
     * @since 3.0.0
     */
    public getVehiclesIn(left: number,
                         right: number,
                         top: number,
                         bottom: number,
                         since: number = 0): TimestampedVehiclelocation[] {
        if (left >= right) {
            throw new Error("left must be smaller than right");
        }
        if (top <= bottom) {
            throw new Error("top must be greater than bottom");
        }
        return this.mVehicles
            .filter((vehicle: TimestampedVehiclelocation): boolean => {
                if (vehicle.longitude < left || vehicle.longitude > right) {
                    return false;
                }
                if (vehicle.latitude < bottom || vehicle.latitude > top) {
                    return false;
                }
                return vehicle.lastUpdate >= since;
            });
    }
}
